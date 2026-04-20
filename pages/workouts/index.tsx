import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { apiGet } from '@/lib/apiClient';
import { PlayerRow } from '@/lib/types';
import { WorkoutExercise, WorkoutLog, WorkoutPlan, daysAgoISO, dayOfWeekOf, todayISO } from '@/lib/workoutTypes';

type TabKey = 'Varsity' | 'JV' | 'all';

interface Row {
  player: PlayerRow;
  plan: WorkoutPlan | null;
  exercisesCount: number;
  doneLast7: number;
  scheduledLast7: number;
}

export default function WorkoutsIndexPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('Varsity');
  const [copiedFor, setCopiedFor] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [players, plans] = await Promise.all([
        apiGet<PlayerRow[]>('roster'),
        apiGet<WorkoutPlan[]>('workout-plans'),
      ]);
      const plansByPlayer = new Map<string, WorkoutPlan>();
      (plans || []).forEach(p => { plansByPlayer.set(p.player_id, p); });

      // For each plan, fetch exercises + last-7-days logs in parallel
      const details = await Promise.all(
        (plans || []).map(async (plan) => {
          const [exercises, logs] = await Promise.all([
            apiGet<WorkoutExercise[]>('workout-exercises?plan_id=' + plan.id),
            apiGet<any[]>('workout-logs?plan_id=' + plan.id + '&from=' + daysAgoISO(6) + '&to=' + todayISO()),
          ]);
          return { plan_id: plan.id, exercises: exercises || [], logs: logs || [] };
        })
      );
      const detailsByPlan = new Map(details.map(d => [d.plan_id, d]));

      const result: Row[] = (players || []).map(player => {
        const plan = plansByPlayer.get(player.id) || null;
        const detail = plan ? detailsByPlan.get(plan.id) : null;
        const exercises = detail?.exercises || [];
        const logs = detail?.logs || [];

        // Scheduled count: for each of the last 7 days, count exercises due that day
        let scheduled = 0;
        for (let i = 0; i < 7; i++) {
          const dayIso = daysAgoISO(i);
          const dow = dayOfWeekOf(dayIso);
          scheduled += exercises.filter(e => e.day_of_week === null || e.day_of_week === dow).length;
        }
        const done = logs.filter(l => l.done).length;

        return {
          player,
          plan,
          exercisesCount: exercises.length,
          doneLast7: done,
          scheduledLast7: scheduled,
        };
      });

      setRows(result);
    } finally { setLoading(false); }
  }

  const filtered = useMemo(() => rows.filter(r => tab === 'all' || r.player.team === tab), [rows, tab]);

  const overallDone = filtered.reduce((s, r) => s + r.doneLast7, 0);
  const overallSched = filtered.reduce((s, r) => s + r.scheduledLast7, 0);
  const overallPct = overallSched ? Math.round((overallDone / overallSched) * 100) : 0;

  function copyPlayerLink(playerId: string) {
    const url = window.location.origin + '/my-workouts?player=' + playerId;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedFor(playerId);
      setTimeout(() => setCopiedFor(cur => cur === playerId ? null : cur), 1500);
    });
  }

  return (
    <Layout title="Workouts" activeSection="workouts">
      <div className="stats-row" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card">
          <div className="stat-label">Last 7 days (team)</div>
          <div className="stat-num" style={{ color: 'var(--gold)' }}>{overallPct}%</div>
          <div className="stat-sub">{overallDone} of {overallSched} exercises completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Players with plans</div>
          <div className="stat-num">{filtered.filter(r => r.plan).length}/{filtered.length}</div>
          <div className="stat-sub">assigned at least one exercise</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Exercises this week</div>
          <div className="stat-num">{overallSched}</div>
          <div className="stat-sub">scheduled across all players</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active today</div>
          <div className="stat-num">{filtered.filter(r => (r.exercisesCount || 0) > 0).length}</div>
          <div className="stat-sub">players with an active plan</div>
        </div>
      </div>

      <div className="tabs">
        <div className={'tab' + (tab === 'Varsity' ? ' active' : '')} onClick={() => setTab('Varsity')}>Varsity</div>
        <div className={'tab' + (tab === 'JV' ? ' active' : '')} onClick={() => setTab('JV')}>JV</div>
        <div className={'tab' + (tab === 'all' ? ' active' : '')} onClick={() => setTab('all')}>All Players</div>
      </div>

      {loading
        ? <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading workouts…</div>
        : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Plan</th>
                  <th>Exercises</th>
                  <th>Last 7 days</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const pct = r.scheduledLast7 ? Math.round((r.doneLast7 / r.scheduledLast7) * 100) : 0;
                  const barColor = pct >= 80 ? 'var(--success)' : pct >= 40 ? 'var(--gold)' : '#E74C3C';
                  return (
                    <tr key={r.player.id}>
                      <td style={{ fontWeight: 500 }}>{r.player.name}</td>
                      <td><span className={'team-tag ' + (r.player.team === 'Varsity' ? 'varsity-tag' : 'jv-tag')}>{r.player.team}</span></td>
                      <td style={{ color: r.plan ? 'var(--white)' : 'var(--text-muted)' }}>
                        {r.plan ? r.plan.plan_name : <span style={{ color: '#F39C12', fontSize: 11 }}>No plan yet</span>}
                      </td>
                      <td style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text-muted)' }}>{r.exercisesCount}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', minWidth: 80 }}>
                            <div style={{ width: pct + '%', height: '100%', background: barColor }} />
                          </div>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--white)', minWidth: 58, textAlign: 'right' }}>
                            {r.doneLast7}/{r.scheduledLast7} ({pct}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Link href={'/workouts/' + r.player.id} className="btn" style={{ fontSize: 10, padding: '3px 8px', marginRight: 4, textDecoration: 'none', display: 'inline-block' }}>
                          {r.plan ? 'Edit plan' : 'Create plan'}
                        </Link>
                        <button className="btn" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => copyPlayerLink(r.player.id)}>
                          {copiedFor === r.player.id ? 'Copied!' : 'Copy player link'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No players on this team.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
    </Layout>
  );
}
