import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient';
import { PlayerRow } from '@/lib/types';
import {
  DAY_NAMES, FULL_DAY_NAMES, WorkoutExercise, WorkoutLog, WorkoutPlan,
  daysAgoISO, dayOfWeekOf, todayISO,
} from '@/lib/workoutTypes';

export default function MyWorkoutsPage() {
  const router = useRouter();
  const playerId = typeof router.query.player === 'string' ? router.query.player : '';
  const [player, setPlayer] = useState<PlayerRow | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(todayISO());

  useEffect(() => { if (playerId) load(); }, [playerId]);

  async function load() {
    setLoading(true);
    try {
      const [roster, plans] = await Promise.all([
        apiGet<PlayerRow[]>('roster'),
        apiGet<WorkoutPlan[]>('workout-plans?player_id=' + playerId),
      ]);
      setPlayer((roster || []).find(r => r.id === playerId) || null);
      const pl = (plans || [])[0] || null;
      setPlan(pl);
      if (pl) {
        const [ex, lg] = await Promise.all([
          apiGet<WorkoutExercise[]>('workout-exercises?plan_id=' + pl.id),
          apiGet<WorkoutLog[]>('workout-logs?plan_id=' + pl.id + '&from=' + daysAgoISO(13) + '&to=' + todayISO()),
        ]);
        setExercises(ex || []);
        setLogs(lg || []);
      } else {
        setExercises([]); setLogs([]);
      }
    } finally { setLoading(false); }
  }

  const viewDow = dayOfWeekOf(viewDate);
  const todaysExercises = useMemo(
    () => exercises.filter(e => e.day_of_week === null || e.day_of_week === viewDow),
    [exercises, viewDow]
  );

  const logByExercise = useMemo(() => {
    const m = new Map<string, WorkoutLog>();
    logs.filter(l => l.log_date === viewDate).forEach(l => { m.set(l.exercise_id, l); });
    return m;
  }, [logs, viewDate]);

  async function setDone(ex: WorkoutExercise, done: boolean, extras?: { actual_sets?: number | null; actual_reps?: string | null; notes?: string }) {
    setSaving(ex.id);
    try {
      if (done) {
        const existing = logByExercise.get(ex.id);
        const res = await apiPost<WorkoutLog>('workout-logs', {
          exercise_id: ex.id,
          log_date: viewDate,
          done: true,
          actual_sets: extras?.actual_sets ?? existing?.actual_sets ?? ex.target_sets,
          actual_reps: extras?.actual_reps ?? existing?.actual_reps ?? ex.target_reps,
          notes: extras?.notes ?? existing?.notes ?? '',
        });
        if ((res as any).error) { alert('Save failed: ' + (res as any).error); return; }
        // update local state
        setLogs(prev => {
          const others = prev.filter(l => !(l.exercise_id === ex.id && l.log_date === viewDate));
          return [...others, res as any];
        });
      } else {
        // uncheck = delete the log row for this exercise + date
        const res = await apiDelete('workout-logs', '') as any;
        // We need a different call since apiDelete requires id
        // Fall through to manual fetch:
        const r = await fetch('/api/workout-logs?exercise_id=' + ex.id + '&log_date=' + viewDate, { method: 'DELETE' });
        const j = await r.json();
        if (j && j.error) { alert('Unmark failed: ' + j.error); return; }
        setLogs(prev => prev.filter(l => !(l.exercise_id === ex.id && l.log_date === viewDate)));
      }
    } finally { setSaving(null); }
  }

  // 7-day progress strip
  const weekStrip = useMemo(() => {
    const out: { date: string; pct: number; scheduled: number; done: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = daysAgoISO(i);
      const dow = dayOfWeekOf(d);
      const sched = exercises.filter(e => e.day_of_week === null || e.day_of_week === dow).length;
      const done = logs.filter(l => l.log_date === d && l.done).length;
      out.push({ date: d, pct: sched ? Math.round(done / sched * 100) : 0, scheduled: sched, done });
    }
    return out;
  }, [exercises, logs]);

  return (
    <Layout title={player ? 'Hi, ' + player.name.split(' ')[0] : 'My workouts'} activeSection="my-workouts">
      {!playerId ? (
        <div className="card">No player ID in the URL. Ask your coach for your workout link.</div>
      ) : loading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : !player ? (
        <div className="card">Player not found.</div>
      ) : !plan ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14 }}>No workout plan assigned yet. Check back after your coach sets one up.</div>
        </div>
      ) : (
        <>
          {/* Week strip */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last 7 days</div>
              <input type="date" className="form-input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }} value={viewDate} onChange={e => setViewDate(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {weekStrip.map(s => {
                const color = s.scheduled === 0 ? 'rgba(255,255,255,0.06)' : s.pct >= 100 ? 'var(--success)' : s.pct >= 50 ? 'var(--gold)' : '#E74C3C';
                const isToday = s.date === todayISO();
                return (
                  <button key={s.date} onClick={() => setViewDate(s.date)}
                          style={{
                            background: 'transparent', border: viewDate === s.date ? '2px solid var(--gold)' : '1px solid var(--border)',
                            borderRadius: 8, padding: '8px 4px', cursor: 'pointer', color: 'var(--white)', textAlign: 'center',
                          }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{DAY_NAMES[dayOfWeekOf(s.date)]}</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{parseInt(s.date.split('-')[2])}</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: s.pct + '%', height: '100%', background: color }} />
                    </div>
                    {isToday && <div style={{ fontSize: 9, color: 'var(--gold)', marginTop: 4 }}>TODAY</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan notes */}
          {plan.notes ? (
            <div className="card" style={{ marginBottom: '1.25rem', background: 'rgba(255,199,44,0.06)', borderColor: 'rgba(255,199,44,0.25)' }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Coach note</div>
              <div style={{ fontSize: 13, color: 'var(--white)', whiteSpace: 'pre-wrap' }}>{plan.notes}</div>
            </div>
          ) : null}

          {/* Today's exercises */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1 }}>
                {viewDate === todayISO() ? 'Today' : FULL_DAY_NAMES[viewDow]} · {viewDate}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {todaysExercises.length} exercise{todaysExercises.length === 1 ? '' : 's'} scheduled
              </div>
            </div>

            {todaysExercises.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nothing scheduled for this day. Take a rest.
              </div>
            ) : (
              <div>
                {todaysExercises.map(ex => {
                  const log = logByExercise.get(ex.id);
                  const done = !!(log && log.done);
                  return (
                    <div key={ex.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr auto',
                      gap: 12,
                      alignItems: 'center',
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      background: done ? 'rgba(46,204,113,0.06)' : 'transparent',
                    }}>
                      <button onClick={() => setDone(ex, !done)} disabled={saving === ex.id} style={{
                        width: 32, height: 32, borderRadius: 8,
                        border: '2px solid ' + (done ? 'var(--success)' : 'var(--border)'),
                        background: done ? 'var(--success)' : 'transparent',
                        color: 'white', fontSize: 16, cursor: 'pointer', lineHeight: 1,
                      }} aria-label="Toggle done">
                        {done ? '✓' : ''}
                      </button>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--white)', fontWeight: 500, textDecoration: done ? 'line-through' : 'none' }}>
                          {ex.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                          {ex.target_sets > 0 ? ex.target_sets + ' × ' : ''}{ex.target_reps}
                          {ex.notes ? ' · ' + ex.notes : ''}
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {ex.day_of_week === null ? 'Any day' : DAY_NAMES[ex.day_of_week]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
            Bookmark this page — your coach can see when you check things off.
          </div>
        </>
      )}
    </Layout>
  );
}
