import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/apiClient';
import { PlayerRow } from '@/lib/types';
import { DAY_NAMES, WorkoutExercise, WorkoutLog, WorkoutPlan, daysAgoISO, dayOfWeekOf, todayISO } from '@/lib/workoutTypes';

export default function PlayerWorkoutPlanPage() {
  const router = useRouter();
  const playerId = typeof router.query.playerId === 'string' ? router.query.playerId : '';
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (playerId) load(); }, [playerId]);

  async function load() {
    setLoading(true);
    try {
      const [roster, plans] = await Promise.all([
        apiGet<PlayerRow[]>('roster'),
        apiGet<WorkoutPlan[]>('workout-plans?player_id=' + playerId),
      ]);
      const p = (roster || []).find(r => r.id === playerId) || null;
      setPlayer(p);
      const pl = (plans || [])[0] || null;
      setPlan(pl);
      if (pl) {
        const [ex, lg] = await Promise.all([
          apiGet<WorkoutExercise[]>('workout-exercises?plan_id=' + pl.id),
          apiGet<WorkoutLog[]>('workout-logs?plan_id=' + pl.id + '&from=' + daysAgoISO(29) + '&to=' + todayISO()),
        ]);
        setExercises(ex || []);
        setLogs(lg || []);
      } else {
        setExercises([]); setLogs([]);
      }
    } finally { setLoading(false); }
  }

  async function createPlan() {
    setSaving(true);
    try {
      const res = await apiPost<WorkoutPlan>('workout-plans', {
        player_id: playerId,
        plan_name: 'Training plan',
        start_date: todayISO(),
      });
      if ((res as any).error) { alert('Failed: ' + (res as any).error); return; }
      setPlan(res as any);
    } finally { setSaving(false); }
  }

  async function updatePlan(patch: Partial<WorkoutPlan>) {
    if (!plan) return;
    const res = await apiPatch<WorkoutPlan>('workout-plans', plan.id, patch);
    if ((res as any).error) { alert('Save failed: ' + (res as any).error); return; }
    setPlan(res as any);
  }

  async function addExercise() {
    if (!plan) return;
    const res = await apiPost<WorkoutExercise>('workout-exercises', {
      plan_id: plan.id,
      name: 'New exercise',
      day_of_week: null,
      target_sets: 3,
      target_reps: '10',
      order_idx: exercises.length,
    });
    if ((res as any).error) { alert('Failed: ' + (res as any).error); return; }
    setExercises(prev => [...prev, res as any]);
  }

  async function updateExercise(id: string, patch: Partial<WorkoutExercise>) {
    // Optimistic local update
    setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    const res = await apiPatch<WorkoutExercise>('workout-exercises', id, patch);
    if ((res as any).error) { alert('Save failed: ' + (res as any).error); await load(); }
  }

  async function deleteExercise(id: string) {
    if (!confirm('Delete this exercise?')) return;
    const res = await apiDelete('workout-exercises', id);
    if ((res as any).error) { alert('Delete failed: ' + (res as any).error); return; }
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  async function deletePlan() {
    if (!plan) return;
    if (!confirm('Delete this entire plan and all its exercises / logs? Cannot be undone.')) return;
    const res = await apiDelete('workout-plans', plan.id);
    if ((res as any).error) { alert('Delete failed: ' + (res as any).error); return; }
    setPlan(null); setExercises([]); setLogs([]);
  }

  // Scorecard computation: last-30 summary
  const scorecard = useMemo(() => {
    if (!exercises.length) return { scheduled30: 0, done30: 0, pct30: 0, dayRows: [] as { date: string; scheduled: number; done: number }[] };
    const dayRows: { date: string; scheduled: number; done: number }[] = [];
    let scheduled30 = 0;
    let done30 = 0;
    for (let i = 29; i >= 0; i--) {
      const dateIso = daysAgoISO(i);
      const dow = dayOfWeekOf(dateIso);
      const dueToday = exercises.filter(e => e.day_of_week === null || e.day_of_week === dow);
      const doneToday = logs.filter(l => l.log_date === dateIso && l.done).length;
      scheduled30 += dueToday.length;
      done30 += doneToday;
      dayRows.push({ date: dateIso, scheduled: dueToday.length, done: doneToday });
    }
    return { scheduled30, done30, pct30: scheduled30 ? Math.round((done30 / scheduled30) * 100) : 0, dayRows };
  }, [exercises, logs]);

  const playerLink = typeof window !== 'undefined' ? window.location.origin + '/my-workouts?player=' + playerId : '';

  return (
    <Layout title={player ? player.name : 'Player plan'} activeSection="workouts">
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/workouts" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← All players</Link>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : !player ? (
        <div className="card">Player not found.</div>
      ) : !plan ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 12, color: 'var(--white)' }}>{player.name} doesn't have a workout plan yet.</div>
          <button className="btn btn-red" onClick={createPlan} disabled={saving}>
            {saving ? 'Creating…' : 'Create a plan'}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Plan name</label>
                <input className="form-input" value={plan.plan_name} onChange={e => setPlan({ ...plan, plan_name: e.target.value })} onBlur={e => updatePlan({ plan_name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Player link (share this URL)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="form-input" readOnly value={playerLink} onFocus={e => e.currentTarget.select()} />
                  <button className="btn" onClick={() => { navigator.clipboard.writeText(playerLink); }}>Copy</button>
                </div>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start date</label>
                <input type="date" className="form-input" value={plan.start_date || ''} onChange={e => setPlan({ ...plan, start_date: e.target.value || null })} onBlur={e => updatePlan({ start_date: e.target.value || null })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End date (optional)</label>
                <input type="date" className="form-input" value={plan.end_date || ''} onChange={e => setPlan({ ...plan, end_date: e.target.value || null })} onBlur={e => updatePlan({ end_date: e.target.value || null })} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <label className="form-label">Notes for the player</label>
              <textarea className="form-input" rows={2} value={plan.notes || ''} onChange={e => setPlan({ ...plan, notes: e.target.value })} onBlur={e => updatePlan({ notes: e.target.value })} />
            </div>
          </div>

          <div className="stats-row" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card">
              <div className="stat-label">Last 30 days</div>
              <div className="stat-num" style={{ color: 'var(--gold)' }}>{scorecard.pct30}%</div>
              <div className="stat-sub">{scorecard.done30} of {scorecard.scheduled30} exercises</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Exercises in plan</div>
              <div className="stat-num">{exercises.length}</div>
              <div className="stat-sub">{exercises.filter(e => e.day_of_week === null).length} any-day, {exercises.filter(e => e.day_of_week !== null).length} day-specific</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Logged days</div>
              <div className="stat-num">{new Set(logs.filter(l => l.done).map(l => l.log_date)).size}</div>
              <div className="stat-sub">distinct completion dates (30d)</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Current streak</div>
              <div className="stat-num">{computeStreak(scorecard.dayRows)}</div>
              <div className="stat-sub">consecutive days at 100%</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exercises</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-red" onClick={addExercise}>+ Add exercise</button>
                <button className="btn btn-danger" onClick={deletePlan}>Delete plan</button>
              </div>
            </div>
            <table className="stats-table">
              <thead>
                <tr>
                  <th style={{ width: '26%' }}>Name</th>
                  <th>Day</th>
                  <th>Sets</th>
                  <th>Reps</th>
                  <th style={{ width: '24%' }}>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {exercises.map(ex => (
                  <tr key={ex.id}>
                    <td><input className="form-input" style={{ padding: '6px 8px', fontSize: 12 }} value={ex.name} onChange={e => updateExercise(ex.id, { name: e.target.value })} /></td>
                    <td>
                      <select className="form-input form-select" style={{ padding: '6px 8px', fontSize: 12 }} value={ex.day_of_week == null ? '' : String(ex.day_of_week)} onChange={e => updateExercise(ex.id, { day_of_week: e.target.value === '' ? null : Number(e.target.value) })}>
                        <option value="">Any day</option>
                        {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </td>
                    <td><input type="number" min={0} max={20} className="form-input" style={{ padding: '6px 8px', fontSize: 12, width: 70 }} value={ex.target_sets} onChange={e => updateExercise(ex.id, { target_sets: parseInt(e.target.value) || 0 })} /></td>
                    <td><input className="form-input" style={{ padding: '6px 8px', fontSize: 12, width: 90 }} value={ex.target_reps} onChange={e => updateExercise(ex.id, { target_reps: e.target.value })} placeholder="10 or 10-12" /></td>
                    <td><input className="form-input" style={{ padding: '6px 8px', fontSize: 12 }} value={ex.notes || ''} onChange={e => updateExercise(ex.id, { notes: e.target.value })} /></td>
                    <td><button className="btn btn-danger" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => deleteExercise(ex.id)}>Delete</button></td>
                  </tr>
                ))}
                {exercises.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No exercises yet. Click + Add exercise to build the plan.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 30-day grid */}
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Last 30 days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: 3 }}>
              {scorecard.dayRows.map((r, i) => {
                const pct = r.scheduled ? Math.round((r.done / r.scheduled) * 100) : 0;
                const color = r.scheduled === 0 ? 'rgba(255,255,255,0.06)' : pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--gold)' : '#E74C3C';
                return (
                  <div key={i} title={r.date + ' · ' + r.done + '/' + r.scheduled + ' done'}
                       style={{ height: 22, background: color, borderRadius: 3, opacity: r.scheduled === 0 ? 0.4 : 1 }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

function computeStreak(dayRows: { date: string; scheduled: number; done: number }[]) {
  let streak = 0;
  // walk backwards from the most recent day
  for (let i = dayRows.length - 1; i >= 0; i--) {
    const r = dayRows[i];
    if (r.scheduled === 0) continue; // days with nothing scheduled don't break the streak
    if (r.done >= r.scheduled) streak++;
    else break;
  }
  return streak;
}
