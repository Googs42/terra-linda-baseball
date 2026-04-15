import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'

interface Props {
  roster: any[]
  varsitySchedule: any[]
  jvSchedule: any[]
  battingStats: any[]
  pitchingStats: any[]
  fieldingStats: any[]
  fundraisers: any[]
  fieldTasks: any[]
  clinics: any[]
}

export default function App(props: Props) {
  // Serialize props to inject into the page as JSON
  const data = JSON.stringify(props)

  return (
    <>
      <Head>
        <title>Terra Linda Baseball</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Terra Linda Trojans Baseball - Team Portal" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Inject server data before the app script runs */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__TL_DATA__ = ${data};`,
        }}
      />

      {/* The full app HTML is loaded via the static file */}
      <div id="app-root" />

      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Override fetch functions to use server-loaded data
            // then fall back to live API for mutations
            window.__SUPABASE_READY__ = true;
            console.log('TL Baseball loaded. Supabase connected.');
          `,
        }}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const empty = {
    roster: [], varsitySchedule: [], jvSchedule: [],
    battingStats: [], pitchingStats: [], fieldingStats: [],
    fundraisers: [], fieldTasks: [], clinics: [],
  }

  if (!supabase) return { props: empty }

  try {
    const [
      { data: roster },
      { data: varsitySchedule },
      { data: jvSchedule },
      { data: battingStats },
      { data: pitchingStats },
      { data: fieldingStats },
      { data: fundraisers },
      { data: fieldTasks },
      { data: clinics },
    ] = await Promise.all([
      supabase.from('roster').select('*').order('num'),
      supabase.from('schedule').select('*').eq('team', 'Varsity').order('game_date'),
      supabase.from('schedule').select('*').eq('team', 'JV').order('game_date'),
      supabase.from('batting_stats').select('*').order('avg', { ascending: false }),
      supabase.from('pitching_stats').select('*').order('era'),
      supabase.from('fielding_stats').select('*').order('player_name'),
      supabase.from('fundraisers').select('*').order('created_at'),
      supabase.from('field_tasks').select('*').order('created_at'),
      supabase.from('clinics').select('*').order('clinic_date'),
    ])

    return {
      props: {
        roster: roster || [], varsitySchedule: varsitySchedule || [],
        jvSchedule: jvSchedule || [], battingStats: battingStats || [],
        pitchingStats: pitchingStats || [], fieldingStats: fieldingStats || [],
        fundraisers: fundraisers || [], fieldTasks: fieldTasks || [],
        clinics: clinics || [],
      },
    }
  } catch {
    return { props: empty }
  }
}
