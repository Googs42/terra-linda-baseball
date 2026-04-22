import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiGet, apiPatch } from '@/lib/apiClient';
import { PlayerRow } from '@/lib/types';

interface BattingStat {
  id: string; player_name: string; season: string; team: string;
  g: number; ab: number; h: number; doubles: number; triples: number;
  hr: number; rbi: number; bb: number; so: number;
  avg: number; obp: number; slg: number;
}
interface PitchingStat {
  id: string; player_name: string; season: string; team: string;
  g: number; gs: number; w: number; l: number; sv: number;
  ip: number; hits: number; er: number; bb: number; k: number;
  era: number; whip: number;
}
interface FieldingStat {
  id: string; player_name: string; pos: string; season: string; team: string;
  g: number; po: number; assists: number; errors: number; dp: number; fld_pct: number;
}

const FIELD_ICONS: Record<string, string> = {
  season_goals: '🎯',
  offseason_goals: '❄️',
  coach_notes: '📋',
};

export default function PlayerProfilePage() {
  const router = useRouter();
  const playerId = typeof router.query.id === 'string' ? router.query.id : '';
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [batting, setBatting] = useState<BattingStat[]>([]);
  const [pitching, setPitching] = useState<PitchingStat[]>([]);
  const [fielding, setFielding] = useState<FieldingStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-section edit state: which card is currently in edit mode
  const [editing, setEditing] = useState<null | 'season_goals' | 'offseason_goals' | 'coach_notes' | 'basics'>(null);
  const [draft, setDraft] = useState('');
  const [basicsDraft, setBasicsDraft] = useState<Partial<PlayerRow>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (playerId) load(); }, [playerId]);

  async function load() {
    setLoading(true);
    try {
      const roster = await apiGet<PlayerRow[]>('roster');
      const p = (roster || []).find(r => r.id === playerId) || null;
      setPlayer(p);
      if (p) {
        const [b, pt, f] = await Promise.all([
          apiGet<BattingStat[]>('stats?type=batting'),
          apiGet<PitchingStat[]>('stats?type=pitching'),
          apiGet<FieldingStat[]>('stats?type=fielding'),
        ]);
        const match = (s: { player_name: string }) => (s.player_name || '').toLowerCase() === p.name.toLowerCase();
        setBatting((b || []).filter(match));
        setPitching((pt || []).filter(match));
        setFielding((f || []).filter(match));
      }
    } finally { setLoading(false); }
  }

  function beginEdit(field: 'season_goals' | 'offseason_goals' | 'coach_notes') {
    setEditing(field);
    setDraft((player && (player as any)[field]) || '');
  }

  function beginEditBasics() {
    if (!player) return;
    setEditing('basics');
    setBasicsDraft({
      num: player.num, pos: player.pos, year: player.year,
      bats: player.bats, throws: player.throws, team: player.team,
      height: player.height || '', weight: player.weight || '',
      photo_url: player.photo_url || '',
    });
  }

  function cancelEdit() { setEditing(null); setDraft(''); setBasicsDraft({}); }

  async function saveField(field: 'season_goals' | 'offseason_goals' | 'coach_notes') {
    if (!player) return;
    setSaving(true);
    try {
      const res = await apiPatch('roster', player.id, { [field]: draft });
      if ((res as any).error) { alert('Save failed: ' + (res as any).error); return; }
      setPlayer(p => p ? { ...p, [field]: draft } as PlayerRow : p);
      setEditing(null);
    } finally { setSaving(false); }
  }

  async function saveBasics() {
    if (!player) return;
    setSaving(true);
    try {
      const res = await apiPatch('roster', player.id, basicsDraft);
      if ((res as any).error) { alert('Save failed: ' + (res as any).error); return; }
      setPlayer(p => p ? { ...p, ...basicsDraft } as PlayerRow : p);
      setEditing(null);
    } finally { setSaving(false); }
  }

  // Group career stats by season (descending)
  const battingBySeason = useMemo(() => {
    const byYear = new Map<string, BattingStat[]>();
    batting.forEach(b => {
      const key = b.season || 'Unknown';
      if (!byYear.has(key)) byYear.set(key, []);
      byYear.get(key)!.push(b);
    });
    return Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [batting]);

  const pitchingBySeason = useMemo(() => {
    const byYear = new Map<string, PitchingStat[]>();
    pitching.forEach(p => {
      const key = p.season || 'Unknown';
      if (!byYear.has(key)) byYear.set(key, []);
      byYear.get(key)!.push(p);
    });
    return Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [pitching]);

  const fieldingBySeason = useMemo(() => {
    const byYear = new Map<string, FieldingStat[]>();
    fielding.forEach(f => {
      const key = f.season || 'Unknown';
      if (!byYear.has(key)) byYear.set(key, []);
      byYear.get(key)!.push(f);
    });
    return Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [fielding]);

  // Current season = newest year with stats
  const currentBatting = battingBySeason[0]?.[1][0];
  const currentPitching = pitchingBySeason[0]?.[1][0];

  if (loading) {
    return (
      <Layout title="Player Profile" activeSection="roster">
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile…</div>
      </Layout>
    );
  }

  if (!player) {
    return (
      <Layout title="Player Profile" activeSection="roster">
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Player not found. <Link href="/roster" style={{ color: 'var(--gold)' }}>Back to roster</Link>
        </div>
      </Layout>
    );
  }

  const initials = player.name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  const teamColor = player.team === 'Varsity' ? 'var(--gold)' : '#4ECDC4';

  return (
    <Layout title={player.name} activeSection="roster">
      {/* Back link */}
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/roster" style={{ color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none' }}>← Back to roster</Link>
      </div>

      {/* Profile header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {player.photo_url
          ? <img src={player.photo_url} alt={player.name} style={{ width: 76, height: 76, borderRadius: 16, objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }} />
          : <div style={{ width: 76, height: 76, borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,199,44,0.25), rgba(200,16,46,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 1, color: 'var(--white)' }}>{initials}</div>}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 1.5, color: 'var(--white)', lineHeight: 1.05 }}>
            {player.num ? <span style={{ color: 'var(--gold)', marginRight: 10 }}>#{player.num}</span> : null}
            {player.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span>{player.pos || '—'}</span>
            <span>·</span>
            <span>{player.year || '—'}</span>
            <span>·</span>
            <span style={{ color: teamColor, fontWeight: 600 }}>{player.team}</span>
            <span>·</span>
            <span>Bats {player.bats || '—'} / Throws {player.throws || '—'}</span>
            {player.height ? <><span>·</span><span>{player.height}</span></> : null}
            {player.weight ? <><span>·</span><span>{player.weight} lbs</span></> : null}
          </div>
        </div>
        <button className="btn" onClick={beginEditBasics} style={{ fontSize: 11 }}>Edit basics</button>
      </div>

      {/* Basics edit */}
      {editing === 'basics' && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title" style={{ marginBottom: 10 }}>Edit basics</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Number</label>
              <input className="form-input" type="number" value={basicsDraft.num as any ?? ''} onChange={e => setBasicsDraft(d => ({ ...d, num: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="form-group"><label className="form-label">Position(s)</label>
              <input className="form-input" value={basicsDraft.pos as string || ''} onChange={e => setBasicsDraft(d => ({ ...d, pos: e.target.value }))} placeholder="e.g. P/OF" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Year</label>
              <select className="form-input form-select" value={basicsDraft.year as string || ''} onChange={e => setBasicsDraft(d => ({ ...d, year: e.target.value }))}>
                <option value="">—</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Team</label>
              <select className="form-input form-select" value={basicsDraft.team as string || 'Varsity'} onChange={e => setBasicsDraft(d => ({ ...d, team: e.target.value as any }))}>
                <option value="Varsity">Varsity</option>
                <option value="JV">JV</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Bats</label>
              <select className="form-input form-select" value={basicsDraft.bats as string || 'R'} onChange={e => setBasicsDraft(d => ({ ...d, bats: e.target.value }))}>
                <option value="R">R</option><option value="L">L</option><option value="S">S</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Throws</label>
              <select className="form-input form-select" value={basicsDraft.throws as string || 'R'} onChange={e => setBasicsDraft(d => ({ ...d, throws: e.target.value }))}>
                <option value="R">R</option><option value="L">L</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Height</label>
              <input className="form-input" value={basicsDraft.height as string || ''} onChange={e => setBasicsDraft(d => ({ ...d, height: e.target.value }))} placeholder="e.g. 6'1&quot;" />
            </div>
            <div className="form-group"><label className="form-label">Weight (lbs)</label>
              <input className="form-input" value={basicsDraft.weight as string || ''} onChange={e => setBasicsDraft(d => ({ ...d, weight: e.target.value }))} placeholder="e.g. 175" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Photo URL (optional)</label>
            <input className="form-input" value={basicsDraft.photo_url as string || ''} onChange={e => setBasicsDraft(d => ({ ...d, photo_url: e.target.value }))} placeholder="https://…" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={cancelEdit} disabled={saving}>Cancel</button>
            <button className="btn btn-red" style={{ flex: 2 }} onClick={saveBasics} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      )}

      {/* Quick stat tiles */}
      <div className="stats-row" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-label">Current AVG</div>
          <div className="stat-num" style={{ color: 'var(--gold)' }}>{currentBatting ? formatAvg(currentBatting.avg) : '—'}</div>
          <div className="stat-sub">{currentBatting ? currentBatting.season + ' season' : 'no at-bats yet'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">HR / RBI</div>
          <div className="stat-num">{currentBatting ? `${currentBatting.hr} / ${currentBatting.rbi}` : '—'}</div>
          <div className="stat-sub">{currentBatting ? currentBatting.g + ' games' : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pitching W-L</div>
          <div className="stat-num">{currentPitching ? `${currentPitching.w}-${currentPitching.l}` : '—'}</div>
          <div className="stat-sub">{currentPitching ? `ERA ${formatEra(currentPitching.era)}` : 'not a pitcher'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Seasons logged</div>
          <div className="stat-num">{new Set([...battingBySeason.map(([y]) => y), ...pitchingBySeason.map(([y]) => y)]).size}</div>
          <div className="stat-sub">years of data</div>
        </div>
      </div>

      {/* Goals + notes */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <GoalsCard
          title="Season goals"
          icon={FIELD_ICONS.season_goals}
          value={player.season_goals}
          field="season_goals"
          editing={editing}
          draft={draft}
          saving={saving}
          onBegin={beginEdit}
          onChange={setDraft}
          onCancel={cancelEdit}
          onSave={saveField}
          placeholder={"What do you want to accomplish this season?\n\ne.g.\n- Hit .300+\n- Earn a varsity starter spot\n- Cut strikeouts in half"}
        />
        <GoalsCard
          title="Offseason goals"
          icon={FIELD_ICONS.offseason_goals}
          value={player.offseason_goals}
          field="offseason_goals"
          editing={editing}
          draft={draft}
          saving={saving}
          onBegin={beginEdit}
          onChange={setDraft}
          onCancel={cancelEdit}
          onSave={saveField}
          placeholder={"What are you working on before next season?\n\ne.g.\n- Add 10 lbs\n- Weighted-ball program\n- Clean up left-side swing"}
        />
      </div>

      <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'rgba(200,16,46,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="card-title" style={{ margin: 0 }}>{FIELD_ICONS.coach_notes} Coach notes <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400, marginLeft: 6 }}>(coach only)</span></div>
          {editing !== 'coach_notes'
            ? <button className="btn" style={{ fontSize: 11 }} onClick={() => beginEdit('coach_notes')}>{player.coach_notes ? 'Edit' : 'Add notes'}</button>
            : null}
        </div>
        {editing === 'coach_notes' ? (
          <>
            <textarea className="form-input" rows={4} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Strengths, areas to work on, attitude, anything else." />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn" style={{ flex: 1 }} onClick={cancelEdit} disabled={saving}>Cancel</button>
              <button className="btn btn-red" style={{ flex: 2 }} onClick={() => saveField('coach_notes')} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', minHeight: 40 }}>
            {player.coach_notes || <em style={{ opacity: 0.6 }}>No notes yet.</em>}
          </div>
        )}
      </div>

      {/* Career history */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title" style={{ marginBottom: 10 }}>📊 Career history</div>

        {battingBySeason.length === 0 && pitchingBySeason.length === 0 && fieldingBySeason.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0.5rem 0' }}>
            No stats recorded yet. Import a CSV from the <Link href="/#stats" style={{ color: 'var(--gold)' }}>Game Stats</Link> page to populate this.
          </div>
        )}

        {battingBySeason.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Batting</div>
            <table className="stats-table">
              <thead><tr><th>Season</th><th>G</th><th>AB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>BB</th><th>SO</th><th>AVG</th><th>OBP</th><th>SLG</th></tr></thead>
              <tbody>
                {battingBySeason.map(([season, rows]) => rows.map((r, i) => (
                  <tr key={season + '-' + i}>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{season}</td>
                    <td>{r.g}</td><td>{r.ab}</td><td>{r.h}</td><td>{r.doubles}</td><td>{r.triples}</td>
                    <td>{r.hr}</td><td>{r.rbi}</td><td>{r.bb}</td><td>{r.so}</td>
                    <td className="stat-highlight">{formatAvg(r.avg)}</td>
                    <td className="stat-highlight">{formatAvg(r.obp)}</td>
                    <td className="stat-highlight">{formatAvg(r.slg)}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}

        {pitchingBySeason.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Pitching</div>
            <table className="stats-table">
              <thead><tr><th>Season</th><th>G</th><th>GS</th><th>W</th><th>L</th><th>SV</th><th>IP</th><th>H</th><th>ER</th><th>BB</th><th>K</th><th>ERA</th><th>WHIP</th></tr></thead>
              <tbody>
                {pitchingBySeason.map(([season, rows]) => rows.map((r, i) => (
                  <tr key={season + '-' + i}>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{season}</td>
                    <td>{r.g}</td><td>{r.gs}</td><td>{r.w}</td><td>{r.l}</td><td>{r.sv}</td>
                    <td>{r.ip}</td><td>{r.hits}</td><td>{r.er}</td><td>{r.bb}</td><td>{r.k}</td>
                    <td className="stat-highlight">{formatEra(r.era)}</td>
                    <td className="stat-highlight">{formatEra(r.whip)}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}

        {fieldingBySeason.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Fielding</div>
            <table className="stats-table">
              <thead><tr><th>Season</th><th>Pos</th><th>G</th><th>PO</th><th>A</th><th>E</th><th>DP</th><th>FLD%</th></tr></thead>
              <tbody>
                {fieldingBySeason.map(([season, rows]) => rows.map((r, i) => (
                  <tr key={season + '-' + i}>
                    <td style={{ fontWeight: 600, color: 'var(--white)' }}>{season}</td>
                    <td>{r.pos}</td><td>{r.g}</td><td>{r.po}</td><td>{r.assists}</td>
                    <td>{r.errors}</td><td>{r.dp}</td>
                    <td className="stat-highlight">{formatAvg(r.fld_pct)}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Link href={'/workouts/' + player.id} className="btn" style={{ textDecoration: 'none', display: 'inline-block' }}>View workout plan →</Link>
        <Link href="/roster" className="btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Back to roster</Link>
      </div>
    </Layout>
  );
}

// Inline goals card — shared between Season and Offseason goals so behaviour
// stays identical in both places.
function GoalsCard({
  title, icon, value, field, editing, draft, saving, placeholder,
  onBegin, onChange, onCancel, onSave,
}: {
  title: string; icon: string; value: string | null | undefined;
  field: 'season_goals' | 'offseason_goals';
  editing: string | null; draft: string; saving: boolean; placeholder: string;
  onBegin: (f: 'season_goals' | 'offseason_goals') => void;
  onChange: (v: string) => void;
  onCancel: () => void;
  onSave: (f: 'season_goals' | 'offseason_goals') => void;
}) {
  const isEditing = editing === field;
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="card-title" style={{ margin: 0 }}>{icon} {title}</div>
        {!isEditing && (
          <button className="btn" style={{ fontSize: 11 }} onClick={() => onBegin(field)}>{value ? 'Edit' : 'Add'}</button>
        )}
      </div>
      {isEditing ? (
        <>
          <textarea className="form-input" rows={6} value={draft} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>Cancel</button>
            <button className="btn btn-red" style={{ flex: 2 }} onClick={() => onSave(field)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: value ? 'var(--white)' : 'var(--text-muted)', whiteSpace: 'pre-wrap', minHeight: 60 }}>
          {value || <em style={{ opacity: 0.6 }}>No {title.toLowerCase()} yet — click {value ? 'Edit' : 'Add'} to set some.</em>}
        </div>
      )}
    </div>
  );
}

// Batting avg-style decimals render as ".312" not "0.312"
function formatAvg(n: number | null | undefined): string {
  if (n == null || isNaN(n as any)) return '—';
  const s = Number(n).toFixed(3);
  return s.startsWith('0.') ? s.slice(1) : s;
}
function formatEra(n: number | null | undefined): string {
  if (n == null || isNaN(n as any)) return '—';
  return Number(n).toFixed(2);
}
