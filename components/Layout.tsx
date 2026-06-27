import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { useSession } from '@/lib/useSession';

type NavEntry = {
  label: string;
  href: string;
  section?: string;
  icon?: string;
  badge?: number;
  group: string;
  external?: boolean;
};

const GROUP_ORDER = ['TEAM', 'TRAINING', 'FACILITY', 'ACADEMY', 'LINKS'];

const NAV: NavEntry[] = [
  // ── TEAM ──────────────────────────────────────────────────────
  { label: 'Dashboard',          href: '/#dashboard',    section: 'dashboard',    icon: '■', group: 'TEAM' },
  { label: 'My Dashboard',       href: '/#parent-home',  section: 'parent-home',  icon: '■', group: 'TEAM' },
  { label: 'My Dashboard',       href: '/#player-home',  section: 'player-home',  icon: '■', group: 'TEAM' },
  { label: 'Admin',              href: '/#admin',        section: 'admin',        icon: '■', group: 'TEAM' },
  { label: 'Manage Users',       href: '/#users',        section: 'users',        icon: '■', group: 'TEAM' },
  { label: 'Roster',             href: '/roster',        section: 'roster',       icon: '■', group: 'TEAM' },
  { label: 'Schedule',           href: '/schedule',      section: 'schedule',     icon: '■', group: 'TEAM' },
  { label: 'Lineup Card',        href: '/#lineup',       section: 'lineup',       icon: '■', group: 'TEAM' },
  // ── TRAINING ──────────────────────────────────────────────────
  { label: 'Position Skills',    href: '/#skills',       section: 'skills',       icon: '■', group: 'TRAINING' },
  { label: 'Workout Plans',      href: '/workouts',      section: 'workouts',     icon: '■', group: 'TRAINING' },
  // ── FACILITY ──────────────────────────────────────────────────
  { label: 'Field Maintenance',  href: '/#field',        section: 'field',        icon: '■', group: 'FACILITY' },
  // ── ACADEMY ───────────────────────────────────────────────────
  { label: 'Clinics',            href: '/#clinics',      section: 'clinics',      icon: '■', group: 'ACADEMY' },
  { label: 'Summer Camp',        href: '/#camp',         section: 'camp',         icon: '■', group: 'ACADEMY' },
  { label: 'Fundraising',        href: '/#fundraising',  section: 'fundraising',  icon: '■', group: 'ACADEMY' },
  { label: 'Team Store',         href: '/#store',        section: 'store',        icon: '■', group: 'ACADEMY' },
  { label: 'Volunteer & Donate', href: '/#volunteer',    section: 'volunteer',    icon: '■', group: 'ACADEMY' },
  { label: 'Contact / Outreach', href: '/#contact',      section: 'contact',      icon: '■', group: 'ACADEMY' },
  // ── LINKS ─────────────────────────────────────────────────────
  { label: 'Game Stats',         href: '/#stats',        section: 'stats',        icon: '■', group: 'LINKS' },
  { label: 'MaxPreps Hub',       href: '/#maxpreps',     section: 'maxpreps',     icon: '■', group: 'LINKS' },
  { label: 'GameChanger ↗',      href: 'https://gc.com/', section: undefined,     icon: '■', group: 'LINKS', external: true },
];

const NAV_ACCESS: Record<string, string[]> = {
  coach:  ['dashboard','users','admin','roster','stats','schedule','lineup','skills','workouts','field','clinics','camp','fundraising','store','volunteer','maxpreps','contact'],
  viewer: ['dashboard','roster','stats','schedule','lineup','skills','workouts','field','clinics','camp','fundraising','store','maxpreps','contact'],
  player: ['player-home','roster','stats','schedule','skills','workouts','field','clinics','camp','store','maxpreps'],
  parent: ['parent-home','roster','stats','schedule','clinics','camp','fundraising','store','volunteer','maxpreps','contact'],
};

interface LayoutProps {
  title: string;
  activeSection?: string;
  topbarRight?: ReactNode;
  children: ReactNode;
}

export default function Layout({ title, activeSection, topbarRight, children }: LayoutProps) {
  const router = useRouter();
  const { user, ready } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/');
  }, [ready, user, router]);

  if (!ready || !user) return null;

  const allowed = NAV_ACCESS[user.role] ?? NAV_ACCESS.coach;
  const visibleNav = NAV.filter(n => !n.section || allowed.includes(n.section));

  const groups: Record<string, NavEntry[]> = {};
  for (const n of visibleNav) {
    if (!groups[n.group]) groups[n.group] = [];
    groups[n.group].push(n);
  }

  const isActive = (entry: NavEntry) =>
    (activeSection && entry.section === activeSection) ||
    (!activeSection && entry.href === router.asPath);

  const close = () => {
    setSidebarOpen(false);
    document.body.classList.remove('sidebar-open');
  };

  return (
    <div className={'shell' + (sidebarOpen ? ' sidebar-open-wrapper' : '')}>
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-badge">
            <div className="logo-diamond"><span>TL</span></div>
            <div>
              <div className="logo-name">TERRA LINDA</div>
              <div className="logo-sub">Trojans Baseball</div>
            </div>
          </div>
        </div>

        {GROUP_ORDER.filter(g => groups[g]?.length).map(group => (
          <div className="nav-section" key={group}>
            <div className="nav-label">{group}</div>
            {groups[group].map(entry =>
              entry.external ? (
                <a
                  key={entry.href}
                  href={entry.href}
                  className="nav-item"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                >
                  <span className="nav-icon">{entry.icon}</span>
                  {entry.label}
                </a>
              ) : (
                <Link
                  key={entry.section ?? entry.href}
                  href={entry.href}
                  className={'nav-item' + (isActive(entry) ? ' active' : '')}
                  onClick={close}
                >
                  <span className="nav-icon">{entry.icon}</span>
                  {entry.label}
                  {entry.badge ? <span className="nav-badge">{entry.badge}</span> : null}
                </Link>
              )
            )}
          </div>
        ))}
      </aside>

      <div className="sidebar-backdrop" onClick={close} />

      <main className="main">
        <div className="topbar">
          <button
            className="menu-toggle"
            onClick={() => {
              const next = !sidebarOpen;
              setSidebarOpen(next);
              document.body.classList.toggle('sidebar-open', next);
            }}
            aria-label="Toggle menu"
          >☰</button>
          <div className="topbar-title" id="topbar-title">{title}</div>
          {topbarRight}
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
