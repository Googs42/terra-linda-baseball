import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import RosterTable from '@/components/RosterTable';
import PlayerFormModal from '@/components/PlayerFormModal';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/apiClient';
import { PlayerRow, Team } from '@/lib/types';

type TabKey = 'varsity' | 'jv' | 'all';

export default function RosterPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('varsity');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlayerRow | null>(null);

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

  const varsityCount = useMemo(() => players.filter(p => p.team === 'Varsity').length, [players]);
  const jvCount      = useMemo(() => players.filter(p => p.team === 'JV').length, [players]);

  const visible = useMemo(() => {
    const term = search.toLowerCase().trim();
    return players.filter(p => {
      const teamOk = tab === 'all' || (tab === 'varsity' ? p.team === 'Varsity' : p.team === 'JV');
      if (!teamOk) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || (p.pos || '').toLowerCase().includes(term);
    });
  }, [players, tab, search]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: PlayerRow) {
    setEditing(p);
    setModalOpen(true);
  }

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
        <button className="btn btn-red" onClick={openAdd}>+ Add Player</button>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>

      <div className="tabs">
        <div className={'tab' + (tab === 'varsity' ? ' active' : '')} onClick={() => setTab('varsity')}>Varsity ({varsityCount})</div>
        <div className={'tab' + (tab === 'jv'      ? ' active' : '')} onClick={() => setTab('jv')}>JV ({jvCount})</div>
        <div className={'tab' + (tab === 'all'     ? ' active' : '')} onClick={() => setTab('all')}>All Players</div>
      </div>

      {loading
        ? <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading roster…</div>
        : <RosterTable players={visible} onEdit={openEdit} onDelete={handleDelete} />}

      <PlayerFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
