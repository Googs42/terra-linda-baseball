import { GameRow } from '@/lib/types';
import { fmtDisplayDate, fmtDisplayDay, fmtDisplayTime } from '@/lib/csv';

interface Props {
  games: GameRow[];
  onEdit: (g: GameRow) => void;
  onDelete: (g: GameRow) => void;
  manageMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export default function ScheduleTable({ games, onEdit, onDelete, manageMode, selectedIds, onToggleSelect, onToggleSelectAll }: Props) {
  if (!games.length) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No games yet — click <strong>+ Add Game</strong> or <strong>Import CSV</strong> to get started.
      </div>
    );
  }

  const allSelected = !!manageMode && !!selectedIds && games.length > 0 && games.every(g => selectedIds.has(g.id));

  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table className="stats-table">
        <thead>
          <tr>
            {manageMode && (
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allSelected} onChange={() => onToggleSelectAll && onToggleSelectAll()} />
              </th>
            )}
            <th>Date</th>
            <th>Day</th>
            <th>Opponent</th>
            <th>H/A</th>
            <th>Location</th>
            <th>Time</th>
            <th>Result</th>
            <th>Score</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map(g => {
            const isUpcoming = !g.result;
            const resultBadge = !g.result ? 'Upcoming'
              : g.result === 'W' ? 'W'
              : g.result === 'L' ? 'L'
              : g.result;
            const resultColor = !g.result ? 'var(--text-muted)'
              : g.result === 'W' ? 'var(--success)'
              : g.result === 'L' ? '#E74C3C'
              : 'var(--gold)';
            const resultBg = !g.result ? 'rgba(138,175,221,0.12)'
              : g.result === 'W' ? 'rgba(46,204,113,0.15)'
              : g.result === 'L' ? 'rgba(231,76,60,0.15)'
              : 'rgba(255,199,44,0.15)';
            const haColor = g.home_away === 'Home' ? 'rgba(255,199,44,0.15)' : 'rgba(78,205,196,0.15)';
            const haText  = g.home_away === 'Home' ? 'var(--gold)' : '#4ECDC4';
            const isSelected = !!selectedIds && selectedIds.has(g.id);
            return (
              <tr key={g.id} style={isSelected ? { background: 'rgba(255,199,44,0.08)' } : undefined}>
                {manageMode && (
                  <td>
                    <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect && onToggleSelect(g.id)} />
                  </td>
                )}
                <td style={{ fontFamily: "'DM Mono',monospace" }}>{fmtDisplayDate(g.game_date)}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDisplayDay(g.game_date)}</td>
                <td style={{ fontWeight: 500 }}>{g.opponent}</td>
                <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: haColor, color: haText }}>{g.home_away || '—'}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{g.location || '—'}</td>
                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{fmtDisplayTime(g.game_time)}</td>
                <td><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: resultBg, color: resultColor }}>{resultBadge}</span></td>
                <td style={{ fontFamily: "'DM Mono',monospace", color: isUpcoming ? 'var(--text-muted)' : 'var(--gold)' }}>{g.score || '—'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{g.notes || ''}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn" style={{ fontSize: 10, padding: '3px 8px', marginRight: 4 }} onClick={() => onEdit(g)}>Edit</button>
                  <button className="btn btn-danger" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => onDelete(g)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
