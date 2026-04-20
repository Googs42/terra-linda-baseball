import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Layout from '@/components/Layout';
import ScheduleTable from '@/components/ScheduleTable';
import GameFormModal from '@/components/GameFormModal';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/apiClient';
import { GameRow, Team } from '@/lib/types';
import { csvSplitLine, fmtDisplayDate, fmtDisplayDay, fmtDisplayTime, parseLooseDate, parseLooseTime } from '@/lib/csv';

type TabKey = 'Varsity' | 'JV';
type YearView = 'current' | 'archive';

export default function SchedulePage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('Varsity');
  const [year, setYear] = useState<number | 'all'>(new Date().getFullYear());
  const [yearView, setYearView] = useState<YearView>('current');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GameRow | null>(null);
  const [manageMode, setManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement | null>(null);

  const currentSeasonYear = new Date().getFullYear();

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
    // is_league is the source of truth. If the column isn't set yet (older rows
    // from before the migration), fall back to the legacy notes-contains-"league"
    // heuristic so counts don't collapse to zero during rollout.
    const isLeagueRow = (r: GameRow) =>
      r.is_league == null
        ? (r.notes || '').toLowerCase().includes('league')
        : !!r.is_league;

    const mk = (t: Team) => {
      const rows = filteredByYear.filter(g => g.team === t && g.result);
      const w = rows.filter(r => r.result === 'W').length;
      const l = rows.filter(r => r.result === 'L').length;
      const league = rows.filter(isLeagueRow);
      const lw = league.filter(r => r.result === 'W').length;
      const ll = league.filter(r => r.result === 'L').length;
      return { w, l, lw, ll };
    };
    const varsity = mk('Varsity');
    const jv = mk('JV');

    // Run differential for whichever team tab is active.
    // Score is stored as "winner-loser" (e.g. a 5-1 loss means they scored 5, we scored 1),
    // so we flip the two numbers when the result is an L to get our signed diff.
    const runDiff = filteredByYear
      .filter(g => g.team === tab && g.result && /^\d+-\d+$/.test(g.score || ''))
      .reduce((sum, g) => {
        const [a, b] = g.score.split('-').map(n => parseInt(n, 10));
        if (g.result === 'W') return sum + (a - b);
        if (g.result === 'L') return sum + (b - a);
        return sum; // ties contribute 0
      }, 0);

    // Next upcoming game for the active team tab
    const todayIso = new Date().toISOString().slice(0, 10);
    const next = filteredByYear
      .filter(g => g.team === tab && !g.result && g.game_date >= todayIso)
      .sort((a, b) => (a.game_date || '').localeCompare(b.game_date || ''))[0];

    return { varsity, jv, runDiff, next };
  }, [filteredByYear, tab]);

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

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const allVisibleSelected = visible.length > 0 && visible.every(g => prev.has(g.id));
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach(g => next.delete(g.id));
      else visible.forEach(g => next.add(g.id));
      return next;
    });
  }

  function exitManage() {
    setManageMode(false);
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    if (!selectedIds.size) return;
    if (!confirm('Delete ' + selectedIds.size + ' selected game' + (selectedIds.size === 1 ? '' : 's') + '? This cannot be undone.')) return;
    let ok = 0, fail = 0;
    for (const id of Array.from(selectedIds)) {
      const res = await apiDelete('schedule', id);
      if ((res as any).error) fail++; else ok++;
    }
    await reload();
    exitManage();
    alert('Deleted ' + ok + (fail ? ' — ' + fail + ' failed' : '') + '.');
  }

  async function bulkMoveTeam() {
    if (!selectedIds.size) return;
    const otherTeam: Team = tab === 'Varsity' ? 'JV' : 'Varsity';
    if (!confirm('Move ' + selectedIds.size + ' game' + (selectedIds.size === 1 ? '' : 's') + ' to ' + otherTeam + '?')) return;
    let ok = 0, fail = 0;
    for (const id of Array.from(selectedIds)) {
      const res = await apiPatch('schedule', id, { team: otherTeam });
      if ((res as any).error) fail++; else ok++;
    }
    await reload();
    exitManage();
    alert('Moved ' + ok + (fail ? ' — ' + fail + ' failed' : '') + '.');
  }

  function startNewSeason() {
    const target = Math.max(currentSeasonYear, ...availableYears) + 1;
    if (!confirm('Start ' + target + ' season? You will be switched to the ' + target + ' view so you can add or import games.')) return;
    setYearView('current');
    setYear(target);
  }

  function exportCsv() {
    let csv = 'Team,Date,Day,Opponent,H/A,Location,Time,Result,Score,League,Notes\n';
    const rows = [...filteredByYear].sort((a, b) => (a.game_date || '').localeCompare(b.game_date || ''));
    rows.forEach(g => {
      const leagueText = g.is_league == null
        ? ((g.notes || '').toLowerCase().includes('league') ? 'League' : '')
        : (g.is_league ? 'League' : 'Non-League');
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
        leagueText,
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

    if (!confirm('Import "' + file.name + '" into the ' + tab + ' schedule?\n\nAll rows will be added as ' + tab + ' games. Click Cancel and switch tabs first if that is wrong.')) {
      return;
    }

    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');

    let lines: string[] = [];
    if (isExcel) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { alert('Excel file has no sheets.'); return; }
      // dateNF forces date cells to render as YYYY-MM-DD regardless of the
      // workbook's display format, so parseLooseDate never has to guess the year.
      const csvText = XLSX.utils.sheet_to_csv(ws, { dateNF: 'yyyy-mm-dd' });
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
      league: col(['league', 'game_type', 'type', 'is_league']),
    };
    if (idx.date === -1 || idx.opp === -1) {
      alert('File needs at least Date and Opponent columns. Expected: Team, Date, Opponent, H/A, Location, Time, Result, Score, League, Notes.');
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
      // Active tab ALWAYS wins on import. If the user is on the JV tab,
      // every imported row lands on JV, regardless of any "Team" column
      // values inside the file. WYSIWYG beats mysterious file-column overrides.
      const team: Team = tab;

      // League column: accept Yes/No/true/false/League/Non-League.
      // Blank or missing -> default to league (most games are league games).
      const leagueRaw = get('league').toLowerCase();
      const is_league = leagueRaw === ''
        ? true
        : !(leagueRaw.includes('non') || leagueRaw === 'no' || leagueRaw === 'n' || leagueRaw === 'false' || leagueRaw === '0');

      try {
        const res = await apiPost('schedule', {
          game_date: date, opponent: opp, home_away: ha,
          location: loc, game_time: time, result, score, notes, team, is_league,
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

  // Current Season = the newest year that has data (or current calendar year if none).
  // If the user explicitly picked a year via "+ New Season" or the archive dropdown, prefer that.
  const newestYearWithData = availableYears.find(y => games.some(g => g.game_date && g.game_date.startsWith(y + '-')));
  const currentYear = yearView === 'current' && typeof year === 'number'
    ? year
    : (newestYearWithData ?? currentSeasonYear);
  const archiveYears = availableYears.filter(y => y !== currentYear);

  function selectCurrentTab() {
    setYearView('current');
    setYear(newestYearWithData ?? currentSeasonYear);
  }

  function selectArchiveTab() {
    const firstArchive = availableYears.filter(y => y !== (newestYearWithData ?? currentSeasonYear))[0];
    if (firstArchive == null) { alert('No past seasons archived yet.'); return; }
    setYearView('archive');
    setYear(firstArchive);
  }

  const seasonLabel = yearView === 'archive'
    ? 'Archive — ' + year + ' season'
    : year + ' season schedule — Varsity & JV';

  return (
    <Layout title="Schedule" activeSection="schedule">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: 10, flexWrap: 'wrap' }}>
        <div className="tabs" style={{ margin: 0 }}>
          <div className={'tab' + (yearView === 'current' ? ' active' : '')} onClick={selectCurrentTab}>
            Current Season ({currentYear})
          </div>
          <div className={'tab' + (yearView === 'archive' ? ' active' : '')} onClick={selectArchiveTab}>
            Archive{archiveYears.length ? ' (' + archiveYears.length + ')' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {yearView === 'archive' && archiveYears.length > 0 && (
            <select className="form-input form-select" value={String(year)} onChange={e => setYear(parseInt(e.target.value, 10))} style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>
              {archiveYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          <button className="btn" onClick={startNewSeason} title="Start a new season for next year">+ New Season</button>
          <button className="btn btn-red" onClick={openAdd}>+ Add Game</button>
          <button className="btn" onClick={() => fileRef.current?.click()} title={'Import will add games to the ' + tab + ' schedule'}>
            Import {tab} CSV / Excel
          </button>
          <button className="btn" onClick={exportCsv}>Export CSV</button>
          <button className={'btn' + (manageMode ? ' btn-red' : '')} onClick={() => manageMode ? exitManage() : setManageMode(true)}>
            {manageMode ? 'Done' : 'Manage'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style={{ display: 'none' }} onChange={importCsv} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>{seasonLabel}</div>

      {manageMode && (
        <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', padding: '10px 14px' }}>
          <strong style={{ fontSize: 13 }}>{selectedIds.size} selected</strong>
          <button className="btn btn-danger" onClick={bulkDelete} disabled={!selectedIds.size}>Delete selected</button>
          <button className="btn" onClick={bulkMoveTeam} disabled={!selectedIds.size}>
            Move to {tab === 'Varsity' ? 'JV' : 'Varsity'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Tip: check the box in the header to select every {tab} game shown.
          </span>
        </div>
      )}

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
          <div className="stat-sub">{tab} season</div>
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
        : <ScheduleTable
            games={visible}
            onEdit={openEdit}
            onDelete={handleDelete}
            manageMode={manageMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />}

      <GameFormModal
        open={modalOpen}
        editing={editing}
        defaultTeam={tab}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
