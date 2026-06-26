import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { useSession } from '@/lib/useSession';

type NavEntry = { label: string; href: string; section?: string; icon?: string; badge?: number; group?: string };

const NAV: NavEntry[] = [
  { label: 'Dashboard',          href: '/#dashboard',   section: 'dashboard',   icon: '■', group: 'TEAM' },
  { label: 'Manage Users',       href: '/#users',       section: 'users',       icon: '■', group: 'TEAM' },
  { label: 'Roster',             href: '/roster',       section: 'roster',      icon: '■', group: 'TEAM' },
  { label: 'Game Stats',         href: '/#stats',       section: 'stats',       icon: '■', group: 'TEAM' },
  { label: 'Schedule',           href: '/schedule',     section: 'schedule',    icon: '■', group: 'TEAM' },
  { label: 'Lineup Card',        href: '/#lineup',      section: 'lineup',      icon: '■', group: 'TEAM' },
  { label: 'Position Skills',    href: '/#skills',      section: 'skills',      icon: '■', group: 'TRAINING' },
  { label: 'Workout Plans',      href: '/workouts',     section: 'workouts',    icon: '■', group: 'TRAINING' },
  { label: 'Field Maintenance',  href: '/#field',       section: 'field',       icon: '■', group: 'FACILITY' },
  { label: 'Clinics',            href: '/#clinics',     section: 'clinics',     icon: '■', group: 'ACADEMY' },
  { label: 'Summer Camp',        href: '/#camp',        section: 'camp',        icon: '■', group: 'ACADEMY' },
  { label: 'Fundraising',        href: '/#fundraising', section: 'fundraising', icon: '■', group: 'ACADEMY' },
  { label: 'MaxPreps Hub',       href: '/#maxpreps',    section: 'maxpreps',    icon: '■', group: 'ACADEMY' },
  { label: 'Contact / Outreach', href: '/#contact',     section: 'contact',     icon: '■', group: 'ACADEMY' },
];

const NAV_ACCESS: Record<string, string[]> = {
  coach:  ['dashboard','users','roster','stats','schedule','lineup','skills','workouts','field','clinics','camp','fundraising','maxpreps','contact'],
  viewer: ['dashboard','roster','stats','schedule','lineup','skills','workouts','field','clinics','camp','fundraising','maxpreps','contact'],
  player: ['roster','stats','schedule','skills','workouts','clinics','camp','maxpreps'],
  parent: ['roster','stats','schedule','clinics','camp','fundraising','maxpreps','contact'],
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
    if (!user) {
      router.replace('/');
    }
  }, [ready, user, router]);

  if (!ready || !user) return null;

  const allowed = NAV_ACCESS[user.role] || NAV_ACCESS.coach;
  const visibleNav = NAV.filter(n => !n.section || allowed.includes(n.section));

  const groups: Record<string, NavEntry[]> = {};
  for (const n of visibleNav) {
    const g = n.group || 'TEAM';
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  }

  const isActive = (entry: NavEntry) =>
    (activeSection && entry.section === activeSection) ||
    (!activeSection && entry.href === router.asPath);

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

        {Object.entries(groups).map(([group, items]) => (
          <div className="nav-section" key={group}>
            <div className="nav-label">{group}</div>
            {items.map(entry => (
              <Link
                key={entry.href}
                href={entry.href}
                className={'nav-item' + (isActive(entry) ? ' active' : '')}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{entry.icon}</span>
                {entry.label}
                {entry.badge ? <span className="nav-badge">{entry.badge}</span> : null}
              </Link>
            ))}
          </div>
        ))}
      </aside>

      <div
        className="sidebar-backdrop"
        onClick={() => { setSidebarOpen(false); document.body.classList.remove('sidebar-open'); }}
      />

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
