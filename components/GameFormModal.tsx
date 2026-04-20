import { useEffect, useState } from 'react';
import Modal from './Modal';
import { GameRow, Team } from '@/lib/types';

interface Props {
  open: boolean;
  editing: GameRow | null;
  onClose: () => void;
  onSubmit: (values: {
    game_date: string;
    opponent: string;
    home_away: string;
    location: string;
    game_time: string | null;
    result: string;
    score: string;
    notes: string;
    team: Team;
  }) => Promise<void>;
}

const emptyForm = {
  game_date: '',
  opponent: '',
  home_away: 'Home',
  location: '',
  game_time: '',
  result: '',
  score: '',
  notes: '',
  team: 'Varsity' as Team,
};

export default function GameFormModal({ open, editing, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        game_date: editing.game_date || '',
        opponent: editing.opponent || '',
        home_away: editing.home_away || 'Home',
        location: editing.location || '',
        game_time: editing.game_time ? editing.game_time.slice(0, 5) : '',
        result: editing.result || '',
        score: editing.score || '',
        notes: editing.notes || '',
        team: editing.team || 'Varsity',
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, editing]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.game_date || !form.opponent.trim()) {
      alert('Date and opponent are required.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        game_date: form.game_date,
        opponent: form.opponent.trim(),
        home_away: form.home_away,
        location: form.location.trim(),
        game_time: form.game_time || null,
        result: form.result,
        score: form.score.trim(),
        notes: form.notes.trim(),
        team: form.team,
      });
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} title={editing ? 'Edit Game' : 'Add Game'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.game_date} onChange={e => set('game_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Team</label>
            <select className="form-input form-select" value={form.team} onChange={e => set('team', e.target.value as Team)}>
              <option value="Varsity">Varsity</option>
              <option value="JV">JV</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Opponent</label>
          <input className="form-input" value={form.opponent} onChange={e => set('opponent', e.target.value)} placeholder="e.g. San Rafael" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Home / Away</label>
            <select className="form-input form-select" value={form.home_away} onChange={e => set('home_away', e.target.value)}>
              <option value="Home">Home</option>
              <option value="Away">Away</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input type="time" className="form-input" value={form.game_time} onChange={e => set('game_time', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. TL Field" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Result</label>
            <select className="form-input form-select" value={form.result} onChange={e => set('result', e.target.value)}>
              <option value="">Upcoming</option>
              <option value="W">W</option>
              <option value="L">L</option>
              <option value="T">T</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Score</label>
            <input className="form-input" value={form.score} onChange={e => set('score', e.target.value)} placeholder="e.g. 8-3" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. League opener" />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-red" style={{ flex: 2 }} disabled={saving}>
            {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Game')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
