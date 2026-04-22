import Link from 'next/link';
import { PlayerRow } from '@/lib/types';

interface Props {
  players: PlayerRow[];
  onEdit: (p: PlayerRow) => void;
  onDelete: (p: PlayerRow) => void;
}

export default function RosterTable({ players, onEdit, onDelete }: Props) {
  if (!players.length) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No players yet — click + Add Player to get started.
      </div>
    );
  }

  const yearRank: Record<string, number> = { Senior: 0, Junior: 1, Sophomore: 2, Freshman: 3 };
  const rankOf = (y: string | undefined) => (y && y in yearRank) ? yearRank[y] : 99;
  const sorted = [...players].sort((a, b) => {
    const r = rankOf(a.year) - rankOf(b.year);
    if (r !== 0) return r;
    return (a.num || 0) - (b.num || 0);
  });

  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table className="stats-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Position</th>
            <th>Year</th>
            <th>B/T</th>
            <th>Team</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const tagClass = p.team === 'Varsity' ? 'varsity-tag' : 'jv-tag';
            const status = p.status || 'Active';
            const statusColor = status === 'Pending' ? '#F39C12' : 'var(--success)';
            const bt = (p.bats || 'R') + '/' + (p.throws || 'R');
            return (
              <tr key={p.id}>
                <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text-muted)' }}>
                  {p.num ? '#' + p.num : <span style={{ color: '#F39C12' }}>—</span>}
                </td>
                <td style={{ fontWeight: 500 }}>
                  <Link href={'/players/' + p.id} style={{ color: 'var(--white)', textDecoration: 'none' }}>{p.name}</Link>
                </td>
                <td>
                  {p.pos && p.pos !== 'TBD'
                    ? <span className="pos-tag">{p.pos}</span>
                    : <span style={{ color: '#F39C12', fontSize: 11 }}>TBD</span>}
                </td>
                <td style={{ color: 'var(--white)' }}>{p.year && p.year !== 'TBD' ? p.year : ''}</td>
                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{bt}</td>
                <td><span className={'team-tag ' + tagClass}>{p.team}</span></td>
                <td style={{ color: statusColor, fontSize: 12 }}>{status}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Link href={'/players/' + p.id} className="btn" style={{ fontSize: 10, padding: '3px 8px', marginRight: 4, textDecoration: 'none', display: 'inline-block' }}>Profile</Link>
                  <button className="btn" style={{ fontSize: 10, padding: '3px 8px', marginRight: 4 }} onClick={() => onEdit(p)}>Edit</button>
                  <button className="btn btn-danger" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => onDelete(p)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
