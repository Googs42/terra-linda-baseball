import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import RosterTable from '@/components/RosterTable';
import PlayerFormModal from '@/components/PlayerFormModal';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/apiClient';
import { PlayerRow, Team } from '@/lib/types';
import { useSession } from '@/lib/useSession';

type TabKey = 'varsity' | 'jv' | 'all' | 'archive';

const YEAR_ORDER = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
function advanceYear(y: string): string {
  const i = YEAR_ORDER.indexOf(y);
  return i >= 0 && i < YEAR_ORDER.length - 1 ? YEAR_ORDER[i + 1] : y;
}

interface ArchiveRow {
  id: string; season: string; num: number; name: string; pos: string;
  year: string; bats: string; throws: string; team: string; status: string;
  archived_at: string;
}

export default function RosterPage() {
  const { user } = useSession();
  const canEdit = user?.role === 'coach';
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('varsity');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerRow | null>(null);

  const [archiveRows, setArchiveRows] = useState<ArchiveRow[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => { reload(); }, []);

  async function reload() {
    setLoading(true);
    try {
      const data = await apiGet<PlayerRow[]>('roster');
      setPlayers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('roster fetch failed', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadArchive() {
    if (archiveRows.length) return; // already loaded
    setArchiveLoading(true);
    try {
      const data = await apiGet<ArchiveRow[]>('roster-archive');
      setArchiveRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('archive fetch failed', e);
    } finally {
      setArchiveLoading(false);
    }
  }

  const varsityCount = useMemo(() => players.filter(p => p.team === 'Varsity').length, [players]);
  const jvCount      = useMemo(() => players.filter(p => p.team === 'JV').length, [players]);

  const visible = useMemo(() => {
    const term = search.toLowerCase().trim();
    return players.filter(p => {
      const teamOk = tab === 'all' || tab === 'archive' || (tab === 'varsity' ? p.team === 'Varsity' : p.team === 'JV');
      if (!teamOk) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || (p.pos || '').toLowerCase().includes(term);
    });
  }, [players, tab, search]);

  // Group archive rows by season
  const archiveBySeason = useMemo(() => {
    const map: Record<string, ArchiveRow[]> = {};
    archiveRows.forEach(r => {
      if (!map[r.season]) map[r.season] = [];
      map[r.season].push(r);
    });
    return map;
  }, [archiveRows]);

  const archiveSeasons = useMemo(() =>
    Object.keys(archiveBySeason).sort((a, b) => b.localeCompare(a)),
    [archiveBySeason]
  );

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(p: PlayerRow) { setEditing(p); setModalOpen(true); }

  async function handleSubmit(values: {
    num: number; name: string; pos: string; year: string;
    team: Team; bats: string; throws: string; status: string;
  }) {
    if (editing) {
      const res = await apiPatch<PlayerRow>('roster', editing.id, values);
      if (res && res.error) { alert('Save failed: ' + res.error); return; }
    } else {
      const res = await apiPost<PlayerRow>('roster', values);
      if (res && res.error) { alert('Add failed: ' + res.error); return; }
    }
    setModalOpen(false);
    setEditing(null);
    await reload();
  }

  async function handleDelete(p: PlayerRow) {
    if (!confirm('Delete ' + p.name + ' from the roster?')) return;
    const res = await apiDelete('roster', p.id);
    if (res && res.error) { alert('Delete failed: ' + res.error); return; }
    setPlayers(prev => prev.filter(x => x.id !== p.id));
  }

  async function archiveAndAdvance() {
    const seniors = players.filter(p => p.year === 'Senior');
    const returning = players.filter(p => p.year !== 'Senior');
    const msg =
      `Archive 2026 Spring and advance to Fall 2026?\n\n` +
      `• ${players.length} players will be saved to the 2026 Spring archive\n` +
      `• ${seniors.length} Senior${seniors.length !== 1 ? 's' : ''} will be removed\n` +
      `• ${returning.length} returning player${returning.length !== 1 ? 's' : ''} will advance one year\n\n` +
      `This cannot be undone.`;
    if (!confirm(msg)) return;

    setArchiving(true);
    try {
      // 1. Save snapshot
      const snapRes = await fetch('/api/roster-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: '2026 Spring', players }),
      });
      if (!snapRes.ok) throw new Error('Archive failed: ' + (await snapRes.json()).error);

      // 2. Remove seniors
      for (const s of seniors) {
        await apiDelete('roster', s.id);
      }

      // 3. Advance returning players one year
      for (const p of returning) {
        const next = advanceYear(p.year);
        if (next !== p.year) {
          await apiPatch('roster', p.id, { year: next });
        }
      }

      // 4. Refresh
      setArchiveRows([]); // force archive reload next time
      await reload();
      alert('Done! 2026 Spring archived. ' + seniors.length + ' seniors removed, ' + returning.length + ' players advanced.');
    } catch (e: any) {
      alert('Error: ' + (e.message || e));
    } finally {
      setArchiving(false);
    }
  }

  function exportCsv() {
    const rows = [...players].sort((a, b) => (a.num || 0) - (b.num || 0));
    let csv = '#,Name,Position,Year,Bats,Throws,Team,Status\n';
    rows.forEach(p => {
      csv += [
        p.num || '',
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        '"' + (p.pos || '') + '"',
        '"' + (p.year || '') + '"',
        p.bats || '',
        p.throws || '',
        p.team,
        p.status || 'Active',
      ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'TL_Baseball_Roster.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout
      title="Roster"
      activeSection="roster"
      topbarRight={
        <div className="team-pills">
          <span className="pill pill-varsity on">Varsity</span>
          <span className="pill pill-jv">JV</span>
        </div>
      }
    >
      <div className="roster-controls">
        <input
          className="search-box"
          placeholder="Search player name, position…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {canEdit && tab !== 'archive' && <button className="btn btn-red" onClick={openAdd}>+ Add Player</button>}
        {canEdit && tab !== 'archive' && <button className="btn" onClick={exportCsv}>Export CSV</button>}
        {canEdit && tab !== 'archive' && (
          <button
            className="btn"
            onClick={archiveAndAdvance}
            disabled={archiving}
            title="Archive 2026 Spring and advance all players one year"
            style={{ background: 'rgba(255,199,44,0.12)', borderColor: 'rgba(255,199,44,0.4)', color: 'var(--gold)' }}
          >
            {archiving ? 'Archiving…' : '📦 Archive 2026 Spring & Advance'}
          </button>
        )}
      </div>

      <div className="tabs">
        <div className={'tab' + (tab === 'varsity' ? ' active' : '')} onClick={() => setTab('varsity')}>Varsity ({varsityCount})</div>
        <div className={'tab' + (tab === 'jv'      ? ' active' : '')} onClick={() => setTab('jv')}>JV ({jvCount})</div>
        <div className={'tab' + (tab === 'all'     ? ' active' : '')} onClick={() => setTab('all')}>All Players</div>
        <div className={'tab' + (tab === 'archive' ? ' active' : '')} onClick={() => { setTab('archive'); loadArchive(); }}>
          Archive {archiveSeasons.length ? '(' + archiveSeasons.length + ')' : ''}
        </div>
      </div>

      {tab === 'archive' ? (
        archiveLoading
          ? <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading archive…</div>
          : archiveSeasons.length === 0
            ? <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No archived seasons yet.</div>
            : archiveSeasons.map(season => {
                const rows = archiveBySeason[season];
                const isOpen = expandedSeason === season;
                const varsity = rows.filter(r => r.team === 'Varsity');
                const jv = rows.filter(r => r.team === 'JV');
                return (
                  <div key={season} className="card" style={{ marginBottom: '1rem', padding: 0 }}>
                    <div
                      onClick={() => setExpandedSeason(isOpen ? null : season)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--gold)' }}>{season}</span>
                        <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                          {rows.length} players &nbsp;·&nbsp; {varsity.length} Varsity &nbsp;·&nbsp; {jv.length} JV
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0 0 14px', overflowX: 'auto' }}>
                        <table className="stats-table" style={{ marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th>#</th><th>Name</th><th>Pos</th><th>Year</th>
                              <th>B/T</th><th>Team</th><th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows
                              .slice()
                              .sort((a, b) => (a.num || 0) - (b.num || 0))
                              .map(r => (
                                <tr key={r.id}>
                                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{r.num || '—'}</td>
                                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                                  <td style={{ color: 'var(--text-muted)' }}>{r.pos || '—'}</td>
                                  <td>{r.year || '—'}</td>
                                  <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{r.bats}/{r.throws}</td>
                                  <td>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                      background: r.team === 'Varsity' ? 'rgba(255,199,44,0.15)' : 'rgba(78,205,196,0.15)',
                                      color: r.team === 'Varsity' ? 'var(--gold)' : '#4ECDC4' }}>
                                      {r.team}
                                    </span>
                                  </td>
                                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.status || 'Active'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
      ) : (
        loading
          ? <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading roster…</div>
          : <RosterTable players={visible} canEdit={canEdit} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <PlayerFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
