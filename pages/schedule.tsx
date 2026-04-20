import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';
import ScheduleTable from '@/components/ScheduleTable';
import GameFormModal from '@/components/GameFormModal';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/apiClient';
import { GameRow, Team } from '@/lib/types';
import { csvSplitLine, fmtDisplayDate, fmtDisplayDay, fmtDisplayTime, parseLooseDate, parseLooseTime } from '@/lib/csv';

type TabKey = 'Varsity' | 'JV';

export default function SchedulePage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('Varsity');
  const [year, setYear] = useState<number | 'all'>(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GameRow | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { reload(); }, []);

  async function reload() {
    setLoading(true);
    try {
      const data = await apiGet<GameRow[]>('schedule');
      setGames(Array.isArray(data) ? data : []);
    } catch (e) { console.warn('schedule fetch failed', e); }
    finally { setLoading(false); }
  }

  // All distinct years present in the data (plus the current year so fresh boards have somewhere to land)
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    games.forEach(g => {
      if (g.game_date) set.add(parseInt(g.game_date.slice(0, 4), 10));
    });
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [games]);

  // Default: if the user's chosen year has no games, fall back to the newest year that does
  useEffect(() => {
    if (year === 'all') return;
    const hasYear = games.some(g => g.game_date && g.game_date.startsWith(year + '-'));
    if (!hasYear && availableYears.length > 0 && games.length > 0) {
      const newest = availableYears.find(y => games.some(g => g.game_date && g.game_date.startsWith(y + '-')));
      if (newest && newest !== year) setYear(newest);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]);

  const filteredByYear = useMemo(() => {
    if (year === 'all') return games;
    return games.filter(g => g.game_date && g.game_date.startsWith(year + '-'));
  }, [games, year]);

  const visible = useMemo(() => {
    return filteredByYear
      .filter(g => g.team === tab)
      .slice()
      .sort((a, b) => (a.game_date || '').localeCompare(b.game_date || ''));
  }, [filteredByYear, tab]);

  // Stats
  const stats = useMemo(() => {
    const mk = (t: Team) => {
      const rows = filteredByYear.filter(g => g.team === t && g.result);
      const w = rows.filter(r => r.result === 'W').length;
      const l = rows.filter(r => r.result === 'L').length;
      const league = rows.filter(r => (r.notes || '').toLowerCase().includes('league'));
      const lw = league.filter(r => r.result === 'W').length;
      const ll = league.filter(r => r.result === 'L').length;
      return { w, l, lw, ll };
    };
    const varsity = mk('Varsity');
    const jv = mk('JV');

    // Run differential: only makes sense when score has format N-N
    const runDiff = filteredByYear
      .filter(g => g.team === 'Varsity' && g.result && /^\d+-\d+$/.test(g.score || ''))
      .reduce((sum, g) => {
        const [us, them] = g.score.split('-').map(n => parseInt(n, 10));
        // score is stored as "ours-theirs" regardless of W/L
        return sum + (us - them);
      }, 0);

    // Next upcoming game (any team)
    const todayIso = new Date().toISOString().slice(0, 10);
    const next = filteredByYear
      .filter(g => !g.result && g.game_date >= todayIso)
      .sort((a, b) => (a.game_date || '').localeCompare(b.game_date || ''))[0];

    return { varsity, jv, runDiff, next };
  }, [filteredByYear]);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(g: GameRow) { setEditing(g); setModalOpen(true); }

  async function handleSubmit(values: {
    game_date: string; opponent: string; home_away: string; location: string;
    game_time: string | null; result: string; score: string; notes: string; team: Team;
  }) {
    if (editing) {
      const res = await apiPatch('schedule', editing.id, values);
      if ((res as any).error) { alert('Save failed: ' + (res as any).error); return; }
    } else {
      const res = await apiPost('schedule', values);
      if ((res as any).error) { alert('Add failed: ' + (res as any).error); return; }
    }
    setModalOpen(false);
    setEditing(null);
    await reload();
  }

  async function handleDelete(g: GameRow) {
    if (!confirm('Delete game vs ' + g.opponent + ' on ' + g.game_date + '?')) return;
    const res = await apiDelete('schedule', g.id);
    if ((res as any).error) { alert('Delete failed: ' + (res as any).error); return; }
    setGames(prev => prev.filter(x => x.id !== g.id));
  }

  function exportCsv() {
    let csv = 'Team,Date,Day,Opponent,H/A,Location,Time,Result,Score,Notes\n';
    const rows = [...filteredByYear].sort((a, b) => (a.game_date || '').localeCompare(b.game_date || ''));
    rows.forEach(g => {
      csv += [
        g.team,
        '"' + fmtDisplayDate(g.game_date) + '"',
        fmtDisplayDay(g.game_date),
        '"' + (g.opponent || '').replace(/"/g, '""') + '"',
        g.home_away || '',
        '"' + (g.location || '').replace(/"/g, '""') + '"',
        fmtDisplayTime(g.game_time),
        g.result || '',
        g.score || '',
        '"' + (g.notes || '').replace(/"/g, '""') + '"',
      ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'TL_Baseball_Schedule_' + (year === 'all' ? 'all' : year) + '.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

    let lines: string[] = [];
    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { alert('Excel file has no sheets.'); return; }
      const csvText = XLSX.utils.sheet_to_csv(ws);
      lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    } else {
      const text = await file.text();
      lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    }
    if (!lines.length) { alert('File is empty.'); return; }

    const header = csvSplitLine(lines[0]).map(h => h.toLowerCase());
    const col = (names: string[]) => { for (const n of names) { const i = header.indexOf(n); if (i !== -1) return i; } return -1; };
    const idx = {
      team:   col(['team']),
      date:   col(['date', 'game_date']),
      opp:    col(['opponent', 'opp']),
      ha:     col(['h/a', 'home_away', 'home/away', 'ha']),
      loc:    col(['location', 'loc']),
      time:   col(['time', 'game_time']),
      result: col(['result']),
      score:  col(['score']),
      notes:  col(['notes', 'note']),
    };
    if (idx.date === -1 || idx.opp === -1) {
      alert('File needs at least Date and Opponent columns. Expected: Team, Date, Opponent, H/A, Location, Time, Result, Score, Notes.');
      return;
    }

    let ok = 0, fail = 0;
    const errors: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = csvSplitLine(lines[i]);
      const get = (k: keyof typeof idx) => idx[k] === -1 ? '' : (row[idx[k]] || '').trim();
      const date = parseLooseDate(get('date'));
      const opp  = get('opp');
      if (!date || !opp) { fail++; errors.push('Row ' + (i + 1) + ': missing date or opponent'); continue; }
      const haRaw = get('ha').toLowerCase();
      const ha = (haRaw === 'home' || haRaw === 'h') ? 'Home'
        : (haRaw === 'away' || haRaw === 'a' ? 'Away'
        : (haRaw ? (haRaw[0].toUpperCase() + haRaw.slice(1)) : 'Home'));
      const loc = get('loc');
      const time = parseLooseTime(get('time'));
      const result = get('result') || '';
      const score = get('score');
      const notes = get('notes');
      const teamRaw = get('team').toLowerCase();
      const team: Team = (teamRaw === 'jv' || teamRaw === 'j.v.') ? 'JV' : 'Varsity';

      try {
        const res = await apiPost('schedule', {
          game_date: date, opponent: opp, home_away: ha,
          location: loc, game_time: time, result, score, notes, team,
        });
        if ((res as any).error) { fail++; errors.push('Row ' + (i + 1) + ': ' + (res as any).error); }
        else ok++;
      } catch (e: any) {
        fail++; errors.push('Row ' + (i + 1) + ': ' + (e.message || e));
      }
    }

    await reload();

    let msg = 'Imported ' + ok + ' game' + (ok === 1 ? '' : 's') + '.';
    if (fail) msg += '\n\nSkipped ' + fail + ':\n' + errors.slice(0, 10).join('\n') + (errors.length > 10 ? '\n…' : '');
    alert(msg);
  }

  const seasonLabel = year === 'all'
    ? 'All seasons'
    : year + ' season schedule — Varsity & JV';

  return (
    <Layout title="Schedule" activeSection="schedule">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seasonLabel}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="form-input form-select" value={String(year)} onChange={e => setYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))} style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            <option value="all">All years</option>
          </select>
          <button className="btn btn-red" onClick={openAdd}>+ Add Game</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Import CSV / Excel</button>
          <button className="btn" onClick={exportCsv}>Export CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ display: 'none' }} onChange={importCsv} />
        </div>
      </div>

      <div className="stats-row" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-label">Varsity record</div>
          <div className="stat-num" style={{ color: 'var(--gold)' }}>{stats.varsity.w}-{stats.varsity.l}</div>
          <div className="stat-sub">League: {stats.varsity.lw}-{stats.varsity.ll}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">JV record</div>
          <div className="stat-num" style={{ color: 'var(--gold)' }}>{stats.jv.w}-{stats.jv.l}</div>
          <div className="stat-sub">League: {stats.jv.lw}-{stats.jv.ll}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Run differential</div>
          <div className="stat-num">{(stats.runDiff > 0 ? '+' : '') + stats.runDiff}</div>
          <div className="stat-sub">Varsity season</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Next game</div>
          <div className="stat-num" style={{ fontSize: 16, color: 'var(--gold)' }}>
            {stats.next ? fmtDisplayDate(stats.next.game_date) : '—'}
          </div>
          <div className="stat-sub">
            {stats.next ? 'vs ' + stats.next.opponent + ' @ ' + (stats.next.home_away || '—') : 'nothing upcoming'}
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={'tab' + (tab === 'Varsity' ? ' active' : '')} onClick={() => setTab('Varsity')}>Varsity</div>
        <div className={'tab' + (tab === 'JV' ? ' active' : '')} onClick={() => setTab('JV')}>JV</div>
      </div>

      {loading
        ? <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule…</div>
        : <ScheduleTable games={visible} onEdit={openEdit} onDelete={handleDelete} />}

      <GameFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
