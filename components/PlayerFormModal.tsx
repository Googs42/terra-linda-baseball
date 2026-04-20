import { useEffect, useState } from 'react';
import Modal from './Modal';
import { PlayerRow, POSITIONS, YEARS, Team } from '@/lib/types';

interface Props {
  open: boolean;
  editing: PlayerRow | null;
  onClose: () => void;
  onSubmit: (values: {
    num: number;
    name: string;
    pos: string;
    year: string;
    team: Team;
    bats: string;
    throws: string;
    status: string;
  }) => Promise<void> | void;
}

const emptyForm = {
  first: '',
  last: '',
  num: '',
  pos1: '',
  pos2: '',
  year: 'Freshman',
  team: 'Varsity' as Team,
  bats: 'R',
  throws: 'R',
  status: 'Active',
};

export default function PlayerFormModal({ open, editing, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const parts = editing.name.split(' ');
      const posParts = (editing.pos || '').split('/');
      setForm({
        first: parts[0] || '',
        last: parts.slice(1).join(' ') || '',
        num: editing.num ? String(editing.num) : '',
        pos1: posParts[0] || '',
        pos2: posParts[1] || '',
        year: editing.year || 'Freshman',
        team: (editing.team as Team) || 'Varsity',
        bats: editing.bats || 'R',
        throws: editing.throws || 'R',
        status: editing.status || 'Active',
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
    const first = form.first.trim();
    const last = form.last.trim();
    if (!first || !last) { alert('Please enter at least a first and last name.'); return; }
    const pos1 = form.pos1.trim();
    const pos2 = form.pos2.trim();
    const pos = pos2 ? (pos1 ? pos1 + '/' + pos2 : pos2) : pos1;

    setSaving(true);
    try {
      await onSubmit({
        num: parseInt(form.num) || 0,
        name: first + ' ' + last,
        pos: pos || 'TBD',
        year: form.year || 'TBD',
        team: form.team,
        bats: form.bats,
        throws: form.throws,
        status: form.status,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={editing ? 'Edit Player' : 'Add New Player'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First name</label>
            <input className="form-input" value={form.first} onChange={e => set('first', e.target.value)} placeholder="First name" />
          </div>
          <div className="form-group">
            <label className="form-label">Last name</label>
            <input className="form-input" value={form.last} onChange={e => set('last', e.target.value)} placeholder="Last name" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Jersey number</label>
            <input className="form-input" type="number" min={0} max={99} value={form.num} onChange={e => set('num', e.target.value)} placeholder="#" />
          </div>
          <div className="form-group">
            <label className="form-label">Position</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select className="form-input form-select" value={form.pos1} onChange={e => set('pos1', e.target.value)} style={{ flex: 1 }}>
                <option value="">—</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="form-input form-select" value={form.pos2} onChange={e => set('pos2', e.target.value)} style={{ flex: 1 }}>
                <option value="">— none —</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Pick a primary position. Add a second only if needed.
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Team</label>
            <select className="form-input form-select" value={form.team} onChange={e => set('team', e.target.value as Team)}>
              <option value="Varsity">Varsity</option>
              <option value="JV">JV</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year / Grade</label>
            <select className="form-input form-select" value={form.year} onChange={e => set('year', e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bats</label>
            <select className="form-input form-select" value={form.bats} onChange={e => set('bats', e.target.value)}>
              <option>R</option><option>L</option><option>S</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Throws</label>
            <select className="form-input form-select" value={form.throws} onChange={e => set('throws', e.target.value)}>
              <option>R</option><option>L</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option>Active</option><option>Pending</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-red" style={{ flex: 2 }} disabled={saving}>
            {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Player')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
