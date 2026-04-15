

const rosterData = [
  // ── Varsity ──
  {num:0,name:'Alek Wehn',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Alex Rambo',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Augie Hamman',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Brady Berringer',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Charlie Meneau',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Chase Corsiglia',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Emmett Ekstrand',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Felix Doxon',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'James Zeno',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Kais Withers',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Kelley Fouts',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Levi Dotson',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Logan Harrell',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Luca Sclafani',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  {num:0,name:'Silas Larsen',pos:'',year:'',bt:'R/R',team:'Varsity',status:'Active'},
  // ── JV ──
  {num:0,name:'Brady Berringer',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'David Malik',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Fonzi Gaspari',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Gavin Harper',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Hank Melton',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Joseph Hagen',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Kai Crowe',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Kai Marroquin',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Kal Rogers',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Leo Croak',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Mark DeMartini',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Mateo Benassini',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Nico Garritano',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Roy Gilbert',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
  {num:0,name:'Sebastian King',pos:'',year:'',bt:'R/R',team:'JV',status:'Active'},
];

let currentRosterFilter = 'varsity';
let searchTerm = '';

function renderRoster() {
  const tbody = document.getElementById('roster-body');
  let filtered = rosterData.filter(p => {
    const matchTeam = currentRosterFilter === 'all' || p.team === (currentRosterFilter === 'varsity' ? 'Varsity' : 'JV');
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm) || p.pos.toLowerCase().includes(searchTerm);
    return matchTeam && matchSearch;
  });
  filtered.sort((a,b) => a.num - b.num);
  tbody.innerHTML = filtered.map(p => {
    const tagClass = p.team === 'Varsity' ? 'varsity-tag' : 'jv-tag';
    return `<tr>
      <td style="font-family:'DM Mono',monospace;color:var(--text-muted)">#${p.num}</td>
      <td style="font-weight:500">${p.name}</td>
      <td><span class="pos-tag">${p.pos}</span></td>
      <td style="color:var(--text-muted)">${p.year}</td>
      <td style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-muted)">${p.bt}</td>
      <td><span class="team-tag ${tagClass}">${p.team}</span></td>
      <td style="color:var(--success);font-size:12px">${p.status}</td>
    </tr>`;
  }).join('');
}

function filterRoster(val) {
  searchTerm = val.toLowerCase();
  
// ═══════════════════════════════════════════════════════════════
//  PORTAL & AUTH SYSTEM
// ═══════════════════════════════════════════════════════════════

// Nav access rules per role
const NAV_ACCESS = {
  coach:  ['dashboard','users','roster','stats','schedule','skills','workouts','field','clinics','camp','fundraising','maxpreps','contact'],
  player: ['player-home','roster','stats','schedule','skills','workouts','clinics','camp','maxpreps'],
  parent: ['parent-home','roster','stats','schedule','clinics','camp','fundraising','maxpreps','contact'],
};

// All nav items and their section keys (data attribute approach)
const NAV_LABELS = {
  dashboard:'Dashboard', users:'Manage Users', roster:'Roster',
  stats:'Game Stats', schedule:'Schedule', skills:'Position Skills',
  workouts:'Workout Plans', field:'Field Maintenance',
  clinics:'Clinics', camp:'Summer Camp', fundraising:'Fundraising',
  maxpreps:'MaxPreps Hub', contact:'Contact / Outreach',
  'player-home':'My Dashboard', 'parent-home':'My Dashboard',
};

// Default users - coach pre-loaded. More added via Manage Users.
let USERS = JSON.parse(localStorage.getItem('tl_users') || 'null') || [
  {id:1, name:'Head Coach', username:'coach', password:'trojans2025', role:'coach', playerLink:null},
];

function saveUsers() {
  localStorage.setItem('tl_users', JSON.stringify(USERS));
}

let currentUser = { role: 'coach', name: 'Coach', username: 'coach' };
let selectedRole = null;

// ── Role selection ───────────────────────────────────────────
function selectRole(role, card) {
  selectedRole = role;
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  setTimeout(() => {
    document.getElementById('role-step').style.display = 'none';
    const step = document.getElementById('login-step');
    step.style.display = 'block';
    const badge = document.getElementById('login-badge');
    badge.textContent = role.charAt(0).toUpperCase() + role.slice(1) + ' Login';
    badge.className = 'login-role-badge badge-' + role;
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-err').style.display = 'none';
    document.getElementById('login-username').focus();
  }, 150);
}

function backToRoles() {
  document.getElementById('login-step').style.display = 'none';
  document.getElementById('role-step').style.display = 'block';
  selectedRole = null;
}

// ── Login attempt (Supabase via /api/auth/login) ─────────────
async function attemptLogin() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-err');
  err.style.display = 'none';

  let user = null;
  try {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password, role: selectedRole })
    });
    if (r.ok) {
      const j = await r.json();
      user = j.user;
      if (user) user.playerLink = user.player_link;
    }
  } catch (e) { /* fall through to local */ }

  // Fallback: local USERS (offline / dev)
  if (!user) {
    user = USERS.find(u =>
      u.username.toLowerCase() === username &&
      u.password === password &&
      u.role === selectedRole
    );
  }

  if (!user) {
    err.style.display = 'block';
    document.getElementById('login-password').value = '';
    return;
  }

  currentUser = user;
  document.getElementById('portal-screen').style.display = 'none';
  applyRoleAccess(user);
}

// Allow Enter key on password field
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('login-step').style.display !== 'none') {
    attemptLogin();
  }
});

// ── Apply role access after login ───────────────────────────
function applyRoleAccess(user) {
  const role = user.role;
  const allowed = NAV_ACCESS[role];

  // Update topbar user badge
  const initials = user.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const colors = {coach:'rgba(200,16,46,0.2);color:#ff6b6b', player:'rgba(0,61,165,0.3);color:#7AADFF', parent:'rgba(46,204,113,0.15);color:#2ECC71'};
  document.getElementById('topbar-avatar').style.cssText = 'width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:' + colors[role];
  document.getElementById('topbar-avatar').textContent = initials;
  document.getElementById('topbar-username').textContent = user.name;
  document.getElementById('topbar-role').textContent = role.charAt(0).toUpperCase() + role.slice(1);
  document.getElementById('menu-username').textContent = user.name;
  document.getElementById('menu-role').textContent = role.charAt(0).toUpperCase() + role.slice(1) + ' Account';

  // Show/hide Add Player button (coach only)
  document.getElementById('add-player-btn').style.display = role === 'coach' ? '' : 'none';

  // Show/hide Manage Users nav (coach only)
  document.querySelectorAll('.coach-only').forEach(el => {
    el.style.display = role === 'coach' ? '' : 'none';
  });

  // Hide nav items not allowed for this role
  document.querySelectorAll('.nav-item[onclick]').forEach(navEl => {
    const onclick = navEl.getAttribute('onclick') || '';
    const match = onclick.match(/showSection\('([^']+)'/);
    if (match) {
      const section = match[1];
      if (!allowed.includes(section)) {
        navEl.style.display = 'none';
      } else {
        navEl.style.display = '';
      }
    }
  });

  // Navigate to correct home section
  if (role === 'coach') {
    activateSection('dashboard');
  } else if (role === 'player') {
    loadPlayerDashboard(user);
    activateSection('player-home');
  } else if (role === 'parent') {
    loadParentDashboard(user);
    activateSection('parent-home');
  }
}

function activateSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + name);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('topbar-title').textContent = NAV_LABELS[name] || name;
  if (name === 'roster') renderRoster();
  if (name === 'schedule') {
    renderScheduleTable(varsityGames, 'varsity-sched-body');
    renderScheduleTable(jvGames, 'jv-sched-body');
  }
  if (name === 'users') renderUsersTable();
}

// ── Override showSection to respect role ────────────────────
window.showSection = function(name, navEl) {
  if (!currentUser) {
    // sign-in disabled: act as coach
    currentUser = { role: 'coach', name: 'Coach' };
  }
  const allowed = NAV_ACCESS[currentUser.role];
  // Map home aliases
  const effectiveName = name;
  if (!allowed.includes(effectiveName)) return;

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  document.getElementById('topbar-title').textContent = NAV_LABELS[name] || name;
  if (name === 'roster') renderRoster();
  if (name === 'schedule') {
    renderScheduleTable(varsityGames, 'varsity-sched-body');
    renderScheduleTable(jvGames, 'jv-sched-body');
  }
  if (name === 'users') renderUsersTable();
}

// ── User menu toggle ─────────────────────────────────────────
function toggleUserMenu() {
  document.getElementById('user-menu').classList.toggle('open');
  // Hide manage users option for non-coaches
  document.getElementById('manage-users-btn').style.display = currentUser && currentUser.role === 'coach' ? '' : 'none';
}
document.addEventListener('click', function(e) {
  const menu = document.getElementById('user-menu');
  const badge = document.getElementById('current-user-badge');
  if (menu && badge && !menu.contains(e.target) && !badge.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ── Sign out ──────────────────────────────────────────────────
function signOut() {
  currentUser = null; selectedRole = null;
  document.getElementById('user-menu').classList.remove('open');
  document.getElementById('login-step').style.display = 'none';
  document.getElementById('role-step').style.display = 'block';
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  // Restore all nav items visibility
  document.querySelectorAll('.nav-item').forEach(el => el.style.display = '');
  // sign-in disabled: document.getElementById('portal-screen').style.display = 'flex';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

// ── Load player dashboard ─────────────────────────────────────
function loadPlayerDashboard(user) {
  // Find player in rosterData
  let player = null;
  if (user.playerLink) {
    player = rosterData.find(p => p.name.toLowerCase() === user.playerLink.toLowerCase());
  }
  if (!player && user.name) {
    player = rosterData.find(p => p.name.toLowerCase() === user.name.toLowerCase());
  }

  const nameEl = document.getElementById('player-profile-name');
  const metaEl = document.getElementById('player-profile-meta');
  const tagsEl = document.getElementById('player-profile-tags');
  const avatarEl = document.getElementById('player-avatar-lg');

  if (player) {
    nameEl.textContent = player.name;
    metaEl.textContent = player.pos + ' · ' + player.team + ' · ' + player.year;
    const initials = player.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    avatarEl.textContent = initials;
    tagsEl.innerHTML =
      '<span class="team-tag ' + (player.team==='Varsity'?'varsity-tag':'jv-tag') + '" style="font-size:11px;padding:3px 10px">' + player.team + '</span>' +
      '<span class="pos-tag" style="font-size:11px">' + player.pos + '</span>' +
      '<span class="pos-tag" style="font-size:11px">#' + player.num + '</span>';

    // Load personal stats
    const allBatters = [
      {name:'Jake Morales',g:18,ab:64,h:22,doubles:4,triples:1,hr:2,rbi:14,bb:8,so:12,avg:'.344',obp:'.417',slg:'.500'},
      {name:'Marcus Chen',g:18,ab:60,h:19,doubles:3,triples:2,hr:0,rbi:9,bb:10,so:8,avg:'.317',obp:'.403',slg:'.417'},
      {name:'Alex Garcia',g:17,ab:55,h:17,doubles:5,triples:0,hr:3,rbi:18,bb:6,so:14,avg:'.309',obp:'.370',slg:'.527'},
      {name:'Brandon Williams',g:18,ab:58,h:16,doubles:2,triples:1,hr:1,rbi:11,bb:9,so:10,avg:'.276',obp:'.360',slg:'.379'},
      {name:'Tyler Kim',g:14,ab:41,h:11,doubles:2,triples:0,hr:2,rbi:8,bb:5,so:9,avg:'.268',obp:'.340',slg:'.439'},
    ];
    const myStats = allBatters.find(b => b.name === player.name);
    const statsDiv = document.getElementById('player-stats-display');
    if (myStats) {
      statsDiv.innerHTML =
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px">' +
        statMini('AVG', myStats.avg) + statMini('OBP', myStats.obp) + statMini('SLG', myStats.slg) +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' +
        statMini('G', myStats.g) + statMini('H', myStats.h) + statMini('HR', myStats.hr) + statMini('RBI', myStats.rbi) +
        '</div>';
    } else {
      statsDiv.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Stats not yet entered for this player.</div>';
    }

    // Drills by position
    const pos = player.pos.split('/')[0].trim();
    const drillMap = {
      'P': [['Arm care & long toss','Daily - band work + 10-60ft'],['Mechanics off mound','Focus on landing foot consistency'],['Pickoff moves','Slide step to 1B, spin to 2B'],['Pitch sequencing','Study opponent tendencies']],
      'C': [['Receiving & framing','Low strike zone work'],['Blocking balls in dirt','Tennis ball drill 3x20'],['Pop time footwork','Target sub-2.0 sec pop time'],['Bunt coverage','3B line and 1B side charging']],
      '1B': [['Short hop drill','Footwork on wide throws'],['Bunt coverage reads','Charge and field'],['Double play feed','Underhand toss timing'],['Scoop technique','Low throws off target']],
      '2B': [['Double play pivot','Feed from SS, quick release'],['Range up the middle','Backhand & forehand'],['Communication w SS','Pop-up calls, bunt coverage'],['Second base relay','Cutoff positioning']],
      'SS': [['Range to the hole','Backhand + off-balance throw'],['Double play feed','Underhand & sidearm'],['Pop-up priority calls','Fair/foul line'],['Bunt coverage','Charge and 1B decision']],
      '3B': [['Hot corner reactions','Quick-twitch off the bat'],['Bunt fielding','Barehand and glove'],['Backhand down the line','Body positioning'],['Relay positioning','Left field cutoff']],
      'LF': [['Drop step drill','First step on deep ball'],['Do-or-die ground ball','Charge and throw'],['Cutoff alignment','Hit the relay man'],['Fence awareness','Wall work']],
      'CF': [['First-step reads','Angle jumps off bat'],['Gap communication','Call w LF and RF'],['Long distance throws','Crow hop mechanics'],['Coverage priority','CF takes all he can reach']],
      'RF': [['Strong side line reads','Foul territory angles'],['Throw to 3B & home','Cutoff positioning'],['Short hop fielding','Cut off extras'],['Communication w CF','Gap coverage calls']],
      'DH': [['Situational hitting BP','Runner on 2nd scenarios'],['Two-strike approach','Shorten swing'],['Opposite field work','Outside pitch drives'],['First pitch aggression','Attack early counts']],
    };
    const myDrills = drillMap[pos] || drillMap['DH'];
    const drillsDiv = document.getElementById('player-drills-display');
    drillsDiv.innerHTML = myDrills.map(d =>
      '<div class="drill-row"><div class="drill-dot" style="background:var(--gold)"></div><div class="drill-info"><div class="drill-name">' + d[0] + '</div><div class="drill-desc">' + d[1] + '</div></div></div>'
    ).join('');
  } else {
    nameEl.textContent = user.name;
    metaEl.textContent = 'Player Account';
    avatarEl.textContent = user.name.slice(0,2).toUpperCase();
  }

  // Next 3 upcoming games
  const upcoming = varsityGames.filter(g => g.result === 'Upcoming').slice(0,3);
  const schedDiv = document.getElementById('player-schedule-display');
  if (upcoming.length) {
    schedDiv.innerHTML = upcoming.map(g =>
      '<div class="event-item"><div class="event-name">' + (g.ha==='Home'?'vs ':'@ ') + g.opp + '</div>' +
      '<div class="event-meta"><span>' + fmtDate(g.date) + ' · ' + fmtTime(g.time) + '</span>' +
      '<span style="color:' + (g.ha==='Home'?'#7AADFF':'var(--text-muted)') + '">' + g.ha + '</span></div></div>'
    ).join('');
  } else {
    schedDiv.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">No upcoming games.</div>';
  }
}

function statMini(label, val) {
  return '<div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:8px;text-align:center">' +
    '<div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">' + label + '</div>' +
    '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:20px;color:var(--gold);letter-spacing:1px">' + val + '</div></div>';
}

// ── Load parent dashboard ─────────────────────────────────────
function loadParentDashboard(user) {
  document.getElementById('parent-welcome-name').textContent = 'Welcome, ' + user.name.split(' ')[0];
  const upcoming = varsityGames.filter(g => g.result === 'Upcoming').slice(0,4);
  const div = document.getElementById('parent-schedule-display');
  div.innerHTML = upcoming.map(g =>
    '<div class="event-item"><div class="event-name">' + (g.ha==='Home'?'vs ':'@ ') + g.opp + '</div>' +
    '<div class="event-meta"><span>' + fmtDate(g.date) + ' · ' + fmtTime(g.time) + '</span>' +
    '<span style="color:' + (g.ha==='Home'?'#7AADFF':'var(--text-muted)') + '">' + g.ha + ' · ' + g.loc + '</span></div></div>'
  ).join('') || '<div style="font-size:12px;color:var(--text-muted)">No upcoming games.</div>';
}

// ── Manage Users ──────────────────────────────────────────────
function renderUsersTable() {
  const tbody = document.getElementById('users-tbody');
  const roleColors = {coach:'#ff6b6b', player:'#7AADFF', parent:'#2ECC71'};
  tbody.innerHTML = USERS.map((u,i) =>
    '<tr>' +
    '<td style="font-weight:500">' + u.name + '</td>' +
    '<td style="font-family:\'DM Mono\',monospace;color:var(--text-muted)">' + u.username + '</td>' +
    '<td><span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,0.06);color:' + (roleColors[u.role]||'white') + '">' + u.role + '</span></td>' +
    '<td style="color:var(--text-muted);font-size:11px">' + (u.playerLink || (u.role==='player'?'<span style=color:#E74C3C>Not linked</span>':'-')) + '</td>' +
    '<td><span style="color:#2ECC71;font-size:11px">Active</span></td>' +
    '<td><button class="btn" style="font-size:10px;padding:3px 8px;color:#E74C3C;border-color:rgba(231,76,60,0.3)" onclick="deleteUser(' + i + ')"' + (i===0?'disabled':'') + '>Remove</button></td>' +
    '</tr>'
  ).join('');

  const coaches = USERS.filter(u=>u.role==='coach').length;
  const players = USERS.filter(u=>u.role==='player').length;
  const parents = USERS.filter(u=>u.role==='parent').length;
  document.getElementById('count-coaches').textContent = coaches;
  document.getElementById('count-players').textContent = players;
  document.getElementById('count-parents').textContent = parents;
  document.getElementById('count-total').textContent = USERS.length;
}

function togglePlayerLink() {
  const role = document.getElementById('u-role').value;
  const grp = document.getElementById('player-link-group');
  grp.style.display = role === 'player' ? 'block' : 'none';
  if (role === 'player') {
    const sel = document.getElementById('u-player');
    sel.innerHTML = '<option value="">-- No link --</option>' +
      rosterData.map(p => '<option value="' + p.name + '">' + p.name + ' (#' + p.num + ' · ' + p.pos + ' · ' + p.team + ')</option>').join('');
  }
}

function addUser() {
  const first = document.getElementById('u-first').value.trim();
  const last = document.getElementById('u-last').value.trim();
  const role = document.getElementById('u-role').value;
  const username = document.getElementById('u-username').value.trim().toLowerCase();
  const password = document.getElementById('u-password').value.trim();
  const playerLink = role==='player' ? document.getElementById('u-player').value : null;

  if (!first || !last) { alert('Please enter first and last name.'); return; }
  if (!username) { alert('Please enter a username.'); return; }
  if (!password) { alert('Please enter a password.'); return; }
  if (USERS.find(u => u.username.toLowerCase() === username)) { alert('That username is already taken. Choose a different one.'); return; }

  const newUser = {
    id: Date.now(),
    name: first + ' ' + last,
    username, password, role,
    playerLink: playerLink || null
  };
  USERS.push(newUser);
  saveUsers();
  renderUsersTable();
  closeModal('addUser');
  ['u-first','u-last','u-username','u-password'].forEach(id => document.getElementById(id).value='');
  document.getElementById('u-role').value='coach';
  document.getElementById('player-link-group').style.display='none';

  alert('Account created!\n\nName: ' + newUser.name + '\nUsername: ' + newUser.username + '\nPassword: ' + newUser.password + '\nRole: ' + newUser.role + '\n\nShare these credentials with the ' + newUser.role + '.');
}

function deleteUser(idx) {
  if (idx === 0) return;
  if (!confirm('Remove ' + USERS[idx].name + '\'s account? They will no longer be able to log in.')) return;
  USERS.splice(idx, 1);
  saveUsers();
  renderUsersTable();
}

// ── titles mapping update ──

renderRoster();
}

function rosterTab(el, filter) {
  document.querySelectorAll('#section-roster .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  currentRosterFilter = filter;
  

renderRoster();
}

// showSection handled by portal system


function statsTab(el, name) {
  document.querySelectorAll('#section-stats .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['batting-stats','pitching-stats','fielding-stats'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById(name + '-stats').style.display = 'block';
}

function workoutTab(el, name) {
  document.querySelectorAll('#section-workouts .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['workout-inseason','workout-offseason','workout-conditioning'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('workout-' + name).style.display = 'block';
}

function fieldTab(el, id) {
  document.querySelectorAll('#section-field .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function toggleDay(header) {
  const body = header.nextElementSibling;
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

function toggleTask(el) {
  el.classList.toggle('done');
  const pri = el.parentElement.querySelector('.task-priority');
  if (el.classList.contains('done')) {
    pri.className = 'task-priority pri-low';
    pri.textContent = 'Done';
  } else {
    pri.className = 'task-priority pri-med';
    pri.textContent = 'Pending';
  }
}

function togglePill(el) {
  el.classList.toggle('on');
}

function openModal(name) {
  document.getElementById('modal-' + name).classList.add('open');
}

function closeModal(name) {
  document.getElementById('modal-' + name).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });
});

function addPlayer() {
  const first = document.getElementById('p-first').value.trim();
  const last = document.getElementById('p-last').value.trim();
  const num = parseInt(document.getElementById('p-num').value);
  const pos = document.getElementById('p-pos').value;
  const team = document.getElementById('p-team').value;
  const year = document.getElementById('p-year').value;
  const bat = document.getElementById('p-bat').value;
  const thr = document.getElementById('p-throw').value;
  if (!first || !last || !pos || !num) { alert('Please fill in name, number, and position.'); return; }
  rosterData.push({ num, name: first + ' ' + last, pos, year, bt: bat+'/'+thr, team, status:'Active' });
  closeModal('addPlayer');
  showSection('roster', document.querySelector('[onclick*=roster]'));
  document.getElementById('p-first').value = '';
  document.getElementById('p-last').value = '';
  document.getElementById('p-num').value = '';
}

function addTask() {
  const name = document.getElementById('task-name').value.trim();
  const pri = document.getElementById('task-pri').value;
  const due = document.getElementById('task-due').value;
  const assign = document.getElementById('task-assign').value.trim() || 'Unassigned';
  if (!name) { alert('Please enter a task name.'); return; }
  const container = document.getElementById('field-tasks');
  const priMap = { high:['pri-high','Needed'], med:['pri-med','Pending'], low:['pri-low','Done'] };
  const [cls, label] = priMap[pri];
  const div = document.createElement('div');
  div.className = 'field-task';
  div.innerHTML = `
    <div class="task-check" onclick="toggleTask(this)"></div>
    <div class="task-info">
      <div class="task-name">${name}</div>
      <div class="task-meta">Assigned: ${assign}${due ? ' | Due: ' + due : ''}</div>
    </div>
    <span class="task-priority ${cls}">${label}</span>`;
  container.appendChild(div);
  closeModal('addTask');
  document.getElementById('task-name').value = '';
  document.getElementById('task-assign').value = '';
  document.getElementById('task-due').value = '';
}

function exportRoster() {
  let csv = 'Number,Name,Position,Year,Bats/Throws,Team,Status\n';
  rosterData.forEach(p => {
    csv += `${p.num},"${p.name}",${p.pos},${p.year},${p.bt},${p.team},${p.status}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'TerraLinda_Roster.csv';
  a.click(); URL.revokeObjectURL(url);
}



renderRoster();

// ── SCHEDULE DATA ──────────────────────────────────────
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  const dt = new Date(d + 'T12:00:00');
  return MONTHS[dt.getMonth()] + ' ' + dt.getDate();
}
function fmtDay(d) {
  const dt = new Date(d + 'T12:00:00');
  return DAYS[dt.getDay()];
}
function fmtTime(t) {
  if (!t) return 'TBD';
  const [h,m] = t.split(':');
  const hr = parseInt(h);
  return (hr > 12 ? hr-12 : hr) + ':' + m + (hr >= 12 ? ' PM' : ' AM');
}

let varsityGames = [
  {date:'2025-03-06',opp:'San Rafael',ha:'Away',loc:'San Rafael HS',time:'15:30',result:'W',score:'8-3',notes:'League opener'},
  {date:'2025-03-08',opp:'Novato',ha:'Home',loc:'TL Field',time:'11:00',result:'W',score:'6-2',notes:'League'},
  {date:'2025-03-11',opp:'Petaluma',ha:'Away',loc:'Petaluma HS',time:'15:30',result:'L',score:'3-5',notes:'League'},
  {date:'2025-03-13',opp:'Redwood',ha:'Home',loc:'TL Field',time:'15:30',result:'W',score:'9-4',notes:'League'},
  {date:'2025-03-15',opp:'Marin Catholic',ha:'Away',loc:'MC Field',time:'11:00',result:'W',score:'4-2',notes:'League'},
  {date:'2025-03-18',opp:'San Marin',ha:'Home',loc:'TL Field',time:'15:30',result:'L',score:'2-4',notes:'League'},
  {date:'2025-03-20',opp:'Tamalpais',ha:'Away',loc:'Tam HS',time:'15:30',result:'W',score:'7-1',notes:'League'},
  {date:'2025-03-22',opp:'Archie Williams',ha:'Home',loc:'TL Field',time:'11:00',result:'W',score:'5-3',notes:'League'},
  {date:'2025-03-25',opp:'San Rafael',ha:'Home',loc:'TL Field',time:'15:30',result:'W',score:'10-2',notes:'League'},
  {date:'2025-03-27',opp:'Novato',ha:'Away',loc:'Novato HS',time:'15:30',result:'L',score:'1-4',notes:'League'},
  {date:'2025-03-29',opp:'Petaluma',ha:'Home',loc:'TL Field',time:'11:00',result:'W',score:'6-3',notes:'League'},
  {date:'2025-04-01',opp:'Redwood',ha:'Away',loc:'Redwood HS',time:'15:30',result:'L',score:'3-6',notes:'League'},
  {date:'2025-04-03',opp:'Marin Catholic',ha:'Home',loc:'TL Field',time:'15:30',result:'W',score:'8-5',notes:'League'},
  {date:'2025-04-05',opp:'San Marin',ha:'Away',loc:'San Marin HS',time:'11:00',result:'W',score:'5-2',notes:'League'},
  {date:'2025-04-07',opp:'Tamalpais',ha:'Home',loc:'TL Field',time:'15:30',result:'L',score:'4-7',notes:'League'},
  {date:'2025-04-08',opp:'Archie Williams',ha:'Away',loc:'AW Field',time:'15:30',result:'L',score:'2-3',notes:'League'},
  {date:'2025-04-10',opp:'Novato',ha:'Home',loc:'TL Field',time:'15:30',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-12',opp:'San Rafael',ha:'Away',loc:'San Rafael HS',time:'11:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-15',opp:'Marin Catholic',ha:'Home',loc:'TL Field',time:'15:30',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-17',opp:'Redwood',ha:'Away',loc:'Redwood HS',time:'15:30',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-19',opp:'Petaluma',ha:'Home',loc:'TL Field',time:'11:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-22',opp:'San Marin',ha:'Away',loc:'San Marin HS',time:'15:30',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-24',opp:'Tamalpais',ha:'Home',loc:'TL Field',time:'15:30',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-26',opp:'Archie Williams',ha:'Away',loc:'AW Field',time:'11:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-05-01',opp:'NCS Playoffs',ha:'TBD',loc:'TBD',time:'',result:'Upcoming',score:'',notes:'NCS Bracket TBD'},
];

let jvGames = [
  {date:'2025-03-06',opp:'San Rafael JV',ha:'Away',loc:'San Rafael HS',time:'16:00',result:'W',score:'7-2',notes:'League'},
  {date:'2025-03-08',opp:'Novato JV',ha:'Home',loc:'TL Field',time:'10:00',result:'W',score:'5-1',notes:'League'},
  {date:'2025-03-11',opp:'Petaluma JV',ha:'Away',loc:'Petaluma HS',time:'16:00',result:'W',score:'4-3',notes:'League'},
  {date:'2025-03-13',opp:'Redwood JV',ha:'Home',loc:'TL Field',time:'16:00',result:'L',score:'2-5',notes:'League'},
  {date:'2025-03-15',opp:'Marin Catholic JV',ha:'Away',loc:'MC Field',time:'10:00',result:'W',score:'6-4',notes:'League'},
  {date:'2025-03-18',opp:'San Marin JV',ha:'Home',loc:'TL Field',time:'16:00',result:'L',score:'1-3',notes:'League'},
  {date:'2025-03-20',opp:'Tamalpais JV',ha:'Away',loc:'Tam HS',time:'16:00',result:'W',score:'8-2',notes:'League'},
  {date:'2025-03-22',opp:'Archie Williams JV',ha:'Home',loc:'TL Field',time:'10:00',result:'W',score:'5-4',notes:'League'},
  {date:'2025-03-25',opp:'San Rafael JV',ha:'Home',loc:'TL Field',time:'16:00',result:'W',score:'9-3',notes:'League'},
  {date:'2025-03-27',opp:'Novato JV',ha:'Away',loc:'Novato HS',time:'16:00',result:'L',score:'3-5',notes:'League'},
  {date:'2025-04-01',opp:'Petaluma JV',ha:'Home',loc:'TL Field',time:'16:00',result:'W',score:'6-2',notes:'League'},
  {date:'2025-04-03',opp:'Redwood JV',ha:'Away',loc:'Redwood HS',time:'16:00',result:'L',score:'2-4',notes:'League'},
  {date:'2025-04-05',opp:'Marin Catholic JV',ha:'Home',loc:'TL Field',time:'10:00',result:'L',score:'3-6',notes:'League'},
  {date:'2025-04-07',opp:'San Marin JV',ha:'Away',loc:'San Marin HS',time:'16:00',result:'W',score:'7-1',notes:'League'},
  {date:'2025-04-10',opp:'Novato JV',ha:'Home',loc:'TL Field',time:'16:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-12',opp:'Tamalpais JV',ha:'Away',loc:'Tam HS',time:'10:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-15',opp:'Archie Williams JV',ha:'Home',loc:'TL Field',time:'16:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-17',opp:'San Rafael JV',ha:'Away',loc:'San Rafael HS',time:'16:00',result:'Upcoming',score:'',notes:'League'},
  {date:'2025-04-19',opp:'Redwood JV',ha:'Home',loc:'TL Field',time:'10:00',result:'Upcoming',score:'',notes:'League'},
];

function resultBadge(r, score) {
  if (r === 'W') return '<span style="background:rgba(46,204,113,0.15);color:#2ECC71;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">W</span>';
  if (r === 'L') return '<span style="background:rgba(231,76,60,0.15);color:#E74C3C;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">L</span>';
  if (r === 'T') return '<span style="background:rgba(243,156,18,0.15);color:#F39C12;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">T</span>';
  if (r === 'PPD') return '<span style="background:rgba(155,168,184,0.2);color:#9BA8B8;font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">PPD</span>';
  if (r === 'Upcoming') return '<span style="background:rgba(255,199,44,0.12);color:#FFC72C;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px">Upcoming</span>';
  return '<span style="color:var(--text-muted);font-size:11px">' + r + '</span>';
}

function haBadge(ha) {
  if (ha === 'Home') return '<span style="background:rgba(0,61,165,0.25);color:#7AADFF;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px">Home</span>';
  if (ha === 'Away') return '<span style="background:rgba(255,255,255,0.08);color:var(--text-muted);font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px">Away</span>';
  return '<span style="color:var(--text-muted);font-size:11px">' + ha + '</span>';
}

function isToday(dateStr) {
  const today = new Date();
  const d = new Date(dateStr + 'T12:00:00');
  return d.toDateString() === today.toDateString();
}

function isNext(games) {
  const today = new Date(); today.setHours(0,0,0,0);
  for (let g of games) {
    const d = new Date(g.date + 'T12:00:00'); d.setHours(0,0,0,0);
    if (d >= today && g.result === 'Upcoming') return g.date;
  }
  return null;
}

function renderScheduleTable(games, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const nextDate = isNext(games);
  tbody.innerHTML = games.map(g => {
    const isNext = g.date === nextDate;
    const rowStyle = isNext ? 'background:rgba(255,199,44,0.06);' : '';
    const nextMarker = isNext ? '<span style="font-size:9px;font-weight:700;color:var(--gold);margin-left:4px">NEXT</span>' : '';
    return '<tr style="' + rowStyle + '">' +
      '<td style="font-family:\'DM Mono\',monospace;font-size:12px;white-space:nowrap">' + fmtDate(g.date) + nextMarker + '</td>' +
      '<td style="color:var(--text-muted);font-size:11px">' + fmtDay(g.date) + '</td>' +
      '<td style="font-weight:500">' + g.opp + '</td>' +
      '<td>' + haBadge(g.ha) + '</td>' +
      '<td style="color:var(--text-muted);font-size:11px;max-width:130px">' + g.loc + '</td>' +
      '<td style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted)">' + fmtTime(g.time) + '</td>' +
      '<td>' + resultBadge(g.result, g.score) + '</td>' +
      '<td style="font-family:\'DM Mono\',monospace;font-size:12px;font-weight:500;color:var(--gold)">' + (g.score || '-') + '</td>' +
      '<td style="color:var(--text-muted);font-size:11px">' + (g.notes || '') + '</td>' +
    '</tr>';
  }).join('');
}

function scheduleTab(el, id) {
  document.querySelectorAll('#section-schedule .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('varsity-sched').style.display = id === 'varsity-sched' ? 'block' : 'none';
  document.getElementById('jv-sched').style.display = id === 'jv-sched' ? 'block' : 'none';
}

function addGame() {
  const date = document.getElementById('g-date').value;
  const opp = document.getElementById('g-opp').value.trim();
  const ha = document.getElementById('g-ha').value;
  const loc = document.getElementById('g-loc').value.trim();
  const time = document.getElementById('g-time').value;
  const result = document.getElementById('g-result').value;
  const score = document.getElementById('g-score').value.trim();
  const notes = document.getElementById('g-notes').value.trim();
  const team = document.getElementById('g-team').value;
  if (!date || !opp) { alert('Please enter a date and opponent.'); return; }
  const game = {date, opp, ha, loc, time, result, score, notes};
  if (team === 'varsity') {
    varsityGames.push(game);
    varsityGames.sort((a,b) => a.date.localeCompare(b.date));
    renderScheduleTable(varsityGames, 'varsity-sched-body');
  } else {
    jvGames.push(game);
    jvGames.sort((a,b) => a.date.localeCompare(b.date));
    renderScheduleTable(jvGames, 'jv-sched-body');
  }
  closeModal('addGame');
  ['g-date','g-opp','g-loc','g-time','g-score','g-notes'].forEach(id => document.getElementById(id).value = '');
}

function exportSchedule() {
  let csv = 'Team,Date,Day,Opponent,H/A,Location,Time,Result,Score,Notes\n';
  varsityGames.forEach(g => {
    csv += 'Varsity,"' + fmtDate(g.date) + '",' + fmtDay(g.date) + ',"' + g.opp + '",' + g.ha + ',"' + g.loc + '",' + fmtTime(g.time) + ',' + g.result + ',' + g.score + ',"' + (g.notes||'') + '"\n';
  });
  jvGames.forEach(g => {
    csv += 'JV,"' + fmtDate(g.date) + '",' + fmtDay(g.date) + ',"' + g.opp + '",' + g.ha + ',"' + g.loc + '",' + fmtTime(g.time) + ',' + g.result + ',' + g.score + ',"' + (g.notes||'') + '"\n';
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='TL_Baseball_Schedule.csv'; a.click();
  URL.revokeObjectURL(url);
}

// Init schedule on load
document.addEventListener('DOMContentLoaded', function() {
  renderScheduleTable(varsityGames, 'varsity-sched-body');
  renderScheduleTable(jvGames, 'jv-sched-body');
  // Auto-init as coach (sign-in disabled)
  applyRoleAccess(currentUser);
});

function addFundraiser() {
  const name = document.getElementById('fr-name').value.trim();
  const goal = document.getElementById('fr-goal').value;
  const date = document.getElementById('fr-date').value;
  const loc = document.getElementById('fr-loc').value.trim();
  if (!name || !goal) { alert('Please enter a name and goal amount.'); return; }
  alert('Fundraiser "' + name + '" added with goal of $' + parseInt(goal).toLocaleString() + '!');
  closeModal('addFundraiser');
  document.getElementById('fr-name').value = '';
  document.getElementById('fr-goal').value = '';
  document.getElementById('fr-loc').value = '';
}

function addContrib() {
  const name = document.getElementById('cb-name').value.trim();
  const amount = document.getElementById('cb-amount').value;
  const fr = document.getElementById('cb-fr').value;
  const notes = document.getElementById('cb-notes').value.trim();
  if (!name || !amount) { alert('Please enter contributor name and amount.'); return; }
  const tbody = document.getElementById('contributions-body');
  const today = new Date();
  const dateStr = (today.getMonth()+1) + '/' + today.getDate();
  const row = document.createElement('tr');
  row.innerHTML = '<td>' + name + '</td><td class="stat-highlight">$' + parseInt(amount).toLocaleString() + '</td><td>' + fr + '</td><td style="color:var(--text-muted)">' + dateStr + '</td><td style="color:var(--text-muted)">' + (notes || '-') + '</td>';
  tbody.insertBefore(row, tbody.firstChild);
  closeModal('addContrib');
  document.getElementById('cb-name').value = '';
  document.getElementById('cb-amount').value = '';
  document.getElementById('cb-notes').value = '';
}


function exportMaxPrepsRoster(team) {
  // MaxPreps required columns: last_name, first_name, jersey, class_year, position
  const players = rosterData.filter(p => p.team === team);
  const yearMap = {'Freshman':'9','Sophomore':'10','Junior':'11','Senior':'12'};
  let csv = 'last_name,first_name,jersey,class_year,position\n';
  players.forEach(p => {
    const parts = p.name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    const yr = yearMap[p.year] || p.year;
    csv += '"' + last + '","' + first + '",' + p.num + ',' + yr + ',"' + p.pos + '"\n';
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TL_' + team + '_Roster_MaxPreps.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportMaxPrepsSchedule(team) {
  const games = team === 'Varsity' ? varsityGames : jvGames;
  let csv = 'date,opponent,home_away,location,time,result,score\n';
  games.forEach(g => {
    csv += g.date + ',"' + g.opp + '",' + g.ha + ',"' + g.loc + '",' + fmtTime(g.time) + ',' + g.result + ',' + (g.score||'') + '\n';
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TL_' + team + '_Schedule_MaxPreps.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportContribs() {
  const rows = document.querySelectorAll('#contributions-body tr');
  let csv = 'Contributor,Amount,Fundraiser,Date,Notes\n';
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    csv += Array.from(cells).map(c => '"' + c.textContent.trim() + '"').join(',') + '\n';
  });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'TL_Contributions.csv';
  a.click(); URL.revokeObjectURL(url);
}



// ═══════════════════════════════════════════════════════════════
//  SUPABASE API INTEGRATION
//  All data mutations go through Next.js API routes → Supabase
// ═══════════════════════════════════════════════════════════════

// Load server-side data injected by Next.js getServerSideProps
if (typeof window !== 'undefined' && window.__TL_DATA__) {
  const d = window.__TL_DATA__;
  // Override rosterData with live Supabase data
  if (d.roster && d.roster.length) {
    rosterData.length = 0;
    d.roster.forEach(p => rosterData.push({
      num: p.num, name: p.name, pos: p.pos,
      year: p.year, bt: p.bats + '/' + p.throws,
      team: p.team, status: p.status || 'Active', id: p.id
    }));
  }
  // Override schedule with live data
  if (d.varsitySchedule && d.varsitySchedule.length) {
    varsityGames.length = 0;
    d.varsitySchedule.forEach(g => varsityGames.push({
      id: g.id,
      date: g.game_date,
      opp: g.opponent,
      ha: g.home_away,
      loc: g.location || '',
      time: g.game_time ? g.game_time.slice(0,5) : '',
      result: g.result,
      score: g.score || '',
      notes: g.notes || ''
    }));
  }
  if (d.jvSchedule && d.jvSchedule.length) {
    jvGames.length = 0;
    d.jvSchedule.forEach(g => jvGames.push({
      id: g.id,
      date: g.game_date,
      opp: g.opponent,
      ha: g.home_away,
      loc: g.location || '',
      time: g.game_time ? g.game_time.slice(0,5) : '',
      result: g.result,
      score: g.score || '',
      notes: g.notes || ''
    }));
  }
  renderScheduleTable(varsityGames, 'varsity-sched-body');
  renderScheduleTable(jvGames, 'jv-sched-body');
  renderRoster();
}

// ── API helpers ──────────────────────────────────────────────
async function apiPost(endpoint, body) {
  const r = await fetch('/api/' + endpoint, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return r.json();
}
async function apiPatch(endpoint, id, body) {
  const r = await fetch('/api/' + endpoint + '?id=' + id, {
    method: 'PATCH',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  return r.json();
}
async function apiDelete(endpoint, id) {
  const r = await fetch('/api/' + endpoint + '?id=' + id, { method: 'DELETE' });
  return r.json();
}

// ── Override addPlayer to persist to Supabase ─────────────────
const _localAddPlayer = (typeof addPlayer !== 'undefined') ? addPlayer : null;
addPlayer = async function() {
  const first = document.getElementById('p-first').value.trim();
  const last  = document.getElementById('p-last').value.trim();
  const num   = parseInt(document.getElementById('p-num').value);
  const pos   = document.getElementById('p-pos').value;
  const team  = document.getElementById('p-team').value;
  const year  = document.getElementById('p-year').value;
  const bat   = document.getElementById('p-bat').value;
  const thr   = document.getElementById('p-throw').value;
  if (!first || !last || !pos || !num) { alert('Please fill in name, number, and position.'); return; }
  const result = await apiPost('roster', {
    num, name: first + ' ' + last, pos, year,
    bats: bat, throws: thr, team, status: 'Active'
  });
  if (result.error) { alert('Error saving player: ' + result.error); return; }
  rosterData.push({ num, name: first+' '+last, pos, year, bt: bat+'/'+thr, team, status:'Active', id: result.id });
  closeModal('addPlayer');
  showSection('roster', document.querySelector('[onclick*=roster]'));
  ['p-first','p-last','p-num'].forEach(id => document.getElementById(id).value = '');
};

// ── Override addGame to persist to Supabase ──────────────────
const _localAddGame = (typeof addGame !== 'undefined') ? addGame : null;
addGame = async function() {
  const date   = document.getElementById('g-date').value;
  const opp    = document.getElementById('g-opp').value.trim();
  const ha     = document.getElementById('g-ha').value;
  const loc    = document.getElementById('g-loc').value.trim();
  const time   = document.getElementById('g-time').value;
  const result = document.getElementById('g-result').value;
  const score  = document.getElementById('g-score').value.trim();
  const notes  = document.getElementById('g-notes').value.trim();
  const team   = document.getElementById('g-team').value === 'varsity' ? 'Varsity' : 'JV';
  if (!date || !opp) { alert('Please enter a date and opponent.'); return; }
  const saved = await apiPost('schedule', {
    game_date: date, opponent: opp, home_away: ha,
    location: loc, game_time: time || null,
    result, score, notes, team
  });
  if (saved.error) { alert('Error saving game: ' + saved.error); return; }
  const game = { id: saved.id, date, opp, ha, loc, time, result, score, notes };
  if (team === 'Varsity') {
    varsityGames.push(game);
    varsityGames.sort((a,b) => a.date.localeCompare(b.date));
    renderScheduleTable(varsityGames, 'varsity-sched-body');
  } else {
    jvGames.push(game);
    jvGames.sort((a,b) => a.date.localeCompare(b.date));
    renderScheduleTable(jvGames, 'jv-sched-body');
  }
  closeModal('addGame');
  ['g-date','g-opp','g-loc','g-time','g-score','g-notes'].forEach(id => document.getElementById(id).value='');
};

// ── Override addTask to persist to Supabase ──────────────────
const _localAddTask = (typeof addTask !== 'undefined') ? addTask : null;
addTask = async function() {
  const name   = document.getElementById('task-name').value.trim();
  const pri    = document.getElementById('task-pri').value;
  const due    = document.getElementById('task-due').value;
  const assign = document.getElementById('task-assign').value.trim() || 'Unassigned';
  if (!name) { alert('Please enter a task name.'); return; }
  const saved = await apiPost('field-tasks', {
    task_name: name, priority: pri,
    assigned_to: assign, due_date: due || null, done: false
  });
  if (saved.error) { alert('Error saving task: ' + saved.error); return; }
  const container = document.getElementById('field-tasks');
  const priMap = { high:['pri-high','Needed'], med:['pri-med','Pending'], low:['pri-low','Done'] };
  const [cls, label] = priMap[pri];
  const div = document.createElement('div');
  div.className = 'field-task';
  div.dataset.id = saved.id;
  div.innerHTML = '<div class="task-check" onclick="toggleTaskDb(this,\''+saved.id+'\')"></div>' +
    '<div class="task-info"><div class="task-name">'+name+'</div>' +
    '<div class="task-meta">Assigned: '+assign+(due?' | Due: '+due:'')+'</div></div>' +
    '<span class="task-priority '+cls+'">'+label+'</span>';
  container.appendChild(div);
  closeModal('addTask');
  ['task-name','task-assign','task-due'].forEach(id => document.getElementById(id).value='');
};

// Toggle task done state + persist
async function toggleTaskDb(el, id) {
  el.classList.toggle('done');
  const done = el.classList.contains('done');
  const pri  = el.parentElement.querySelector('.task-priority');
  if (done) { pri.className='task-priority pri-low'; pri.textContent='Done'; }
  else      { pri.className='task-priority pri-med'; pri.textContent='Pending'; }
  if (id) await apiPatch('field-tasks', id, { done });
}

// ── Override addUser to persist to Supabase ──────────────────
const _localAddUser = (typeof addUser !== 'undefined') ? addUser : null;
window.addUser = async function() {
  const first      = document.getElementById('u-first').value.trim();
  const last       = document.getElementById('u-last').value.trim();
  const role       = document.getElementById('u-role').value;
  const username   = document.getElementById('u-username').value.trim().toLowerCase();
  const password   = document.getElementById('u-password').value.trim();
  const playerLink = role==='player' ? document.getElementById('u-player').value : null;
  if (!first||!last) { alert('Please enter first and last name.'); return; }
  if (!username)     { alert('Please enter a username.'); return; }
  if (!password)     { alert('Please enter a password.'); return; }
  if (USERS.find(u => u.username.toLowerCase()===username)) {
    alert('That username is already taken.'); return;
  }
  const saved = await apiPost('users', {
    name: first+' '+last, username, password, role,
    player_link: playerLink||null
  });
  if (saved.error) { alert('Error creating account: ' + saved.error); return; }
  USERS.push({ id: saved.id, name: first+' '+last, username, password, role, playerLink: playerLink||null });
  saveUsers();
  renderUsersTable();
  closeModal('addUser');
  ['u-first','u-last','u-username','u-password'].forEach(id => document.getElementById(id).value='');
  document.getElementById('u-role').value='coach';
  document.getElementById('player-link-group').style.display='none';
  alert('Account created!\n\nName: '+first+' '+last+'\nUsername: '+username+'\nPassword: '+password+'\nRole: '+role+'\n\nShare these credentials with the '+role+'.');
};

// ── Override login to use API ─────────────────────────────────
const _localAttemptLogin = (typeof attemptLogin !== 'undefined') ? attemptLogin : null;
window.attemptLogin = async function() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const err      = document.getElementById('login-err');
  err.style.display = 'none';
  if (!username || !password) { err.style.display='block'; err.textContent='Please enter username and password.'; return; }
  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password, role: selectedRole })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      err.style.display = 'block';
      err.textContent = 'Incorrect username or password.';
      document.getElementById('login-password').value = '';
      return;
    }
    currentUser = {
      id: data.user.id, name: data.user.name,
      username: data.user.username, role: data.user.role,
      playerLink: data.user.player_link
    };
    document.getElementById('portal-screen').style.display = 'none';
    applyRoleAccess(currentUser);
  } catch(e) {
    // Fallback to local users if API not available (dev mode)
    _localAttemptLogin && _localAttemptLogin();
  }
};

// ── Override addContrib to persist ───────────────────────────
const _localAddContrib = (typeof addContrib !== 'undefined') ? addContrib : null;
addContrib = async function() {
  const name   = document.getElementById('cb-name').value.trim();
  const amount = document.getElementById('cb-amount').value;
  const fr     = document.getElementById('cb-fr').value;
  const notes  = document.getElementById('cb-notes').value.trim();
  if (!name||!amount) { alert('Please enter contributor name and amount.'); return; }
  const saved  = await apiPost('contributions', { contributor: name, amount: parseFloat(amount), fundraiser: fr, notes });
  const tbody  = document.getElementById('contributions-body');
  const today  = new Date();
  const dateStr= (today.getMonth()+1)+'/'+today.getDate();
  const row    = document.createElement('tr');
  row.innerHTML= '<td>'+name+'</td><td class="stat-highlight">$'+parseInt(amount).toLocaleString()+'</td><td>'+fr+'</td><td style="color:var(--text-muted)">'+dateStr+'</td><td style="color:var(--text-muted)">'+(notes||'-')+'</td>';
  tbody.insertBefore(row, tbody.firstChild);
  closeModal('addContrib');
  ['cb-name','cb-amount','cb-notes'].forEach(id => document.getElementById(id).value='');
};

// ── Override camp & contact form submissions ──────────────────
async function submitCampReg(btn) {
  const form = {
    player_name:  document.querySelector('[placeholder="First and last name"]')?.value,
    age:          parseInt(document.querySelector('[placeholder="Age"]')?.value),
    position:     document.querySelectorAll('.form-select')[1]?.value,
    session:      document.querySelectorAll('.form-select')[2]?.value,
    parent_name:  document.querySelector('[placeholder="Full name"]')?.value,
    email:        document.querySelector('[placeholder="email@example.com"]')?.value,
    phone:        document.querySelector('[placeholder="(555) 000-0000"]')?.value,
  };
  if (!form.player_name || !form.email) { alert('Please fill in player name and email.'); return; }
  const saved = await apiPost('camp', form);
  if (saved.error) { alert('Error submitting: '+saved.error); return; }
  alert('Registration submitted! We will follow up by email within 24 hours.');
}

async function submitContact(btn) {
  const inputs = document.querySelectorAll('#section-contact .form-input');
  const form = {
    org_name:        inputs[0]?.value,
    org_type:        inputs[1]?.value,
    contact_name:    inputs[2]?.value,
    email:           inputs[3]?.value,
    phone:           inputs[4]?.value,
    program_type:    inputs[5]?.value,
    preferred_dates: inputs[6]?.value,
    headcount:       parseInt(inputs[7]?.value) || null,
    message:         inputs[8]?.value,
  };
  if (!form.org_name || !form.email) { alert('Please fill in organization name and email.'); return; }
  const saved = await apiPost('contact', form);
  if (saved.error) { alert('Error submitting: '+saved.error); return; }
  alert('Message sent! Coach will follow up within 48 hours.');
}


// Init portal on page load
document.addEventListener('DOMContentLoaded', function() {
  // Ensure portal is shown first
  const portal = document.getElementById('portal-screen');
  if (portal) portal.style.display = 'none';
  // Render schedule tables with existing data
  if (typeof varsityGames !== 'undefined') {
    renderScheduleTable(varsityGames, 'varsity-sched-body');
    renderScheduleTable(jvGames, 'jv-sched-body');
  }
});


// ═══════════════════════════════════════════════════════════════
//  SUPABASE LIVE DATA LOADER
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined' && window.__TL_DATA__) {
  const d = window.__TL_DATA__;
  if (d.roster && d.roster.length) {
    rosterData.length = 0;
    d.roster.forEach(p => rosterData.push({ num:p.num, name:p.name, pos:p.pos, year:p.year, bt:p.bats+'/'+p.throws, team:p.team, status:p.status||'Active', id:p.id }));
  }
  if (d.varsitySchedule && d.varsitySchedule.length) {
    varsityGames.length = 0;
    d.varsitySchedule.forEach(g => varsityGames.push({ id:g.id, date:g.game_date, opp:g.opponent, ha:g.home_away, loc:g.location||'', time:g.game_time?g.game_time.slice(0,5):'', result:g.result, score:g.score||'', notes:g.notes||'' }));
  }
  if (d.jvSchedule && d.jvSchedule.length) {
    jvGames.length = 0;
    d.jvSchedule.forEach(g => jvGames.push({ id:g.id, date:g.game_date, opp:g.opponent, ha:g.home_away, loc:g.location||'', time:g.game_time?g.game_time.slice(0,5):'', result:g.result, score:g.score||'', notes:g.notes||'' }));
  }
}

async function apiPost(ep, body) {
  try {
    const r = await fetch('/api/'+ep, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    return r.json();
  } catch(e) { return { error: e.message }; }
}
async function apiPatch(ep, id, body) {
  try {
    const r = await fetch('/api/'+ep+'?id='+id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    return r.json();
  } catch(e) { return { error: e.message }; }
}

// ── Override login to hit Supabase via API ────────────────────
attemptLogin = async function() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-err');
  err.style.display = 'none';
  if (!username || !password) { err.style.display='block'; err.textContent='Please enter username and password.'; return; }
  try {
    const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ username, password, role: selectedRole }) });
    const data = await res.json();
    if (!res.ok || data.error) { err.style.display='block'; document.getElementById('login-password').value=''; return; }
    currentUser = { id:data.user.id, name:data.user.name, username:data.user.username, role:data.user.role, playerLink:data.user.player_link };
    document.getElementById('portal-screen').style.display='none';
    applyRoleAccess(currentUser);
  } catch(e) {
    // Dev fallback: try local USERS array
    const user = USERS.find(u => u.username.toLowerCase()===username && u.password===password && u.role===selectedRole);
    if (!user) { err.style.display='block'; document.getElementById('login-password').value=''; return; }
    currentUser = user;
    document.getElementById('portal-screen').style.display='none';
    applyRoleAccess(currentUser);
  }
};

// ── Override addPlayer ────────────────────────────────────────
addPlayer = async function() {
  const first=document.getElementById('p-first').value.trim(), last=document.getElementById('p-last').value.trim();
  const num=parseInt(document.getElementById('p-num').value), pos=document.getElementById('p-pos').value;
  const team=document.getElementById('p-team').value, year=document.getElementById('p-year').value;
  const bat=document.getElementById('p-bat').value, thr=document.getElementById('p-throw').value;
  if (!first||!last||!pos||!num){ alert('Please fill in name, number, and position.'); return; }
  const saved = await apiPost('roster',{ num, name:first+' '+last, pos, year, bats:bat, throws:thr, team, status:'Active' });
  if (saved.error){ alert('Error saving: '+saved.error); return; }
  rosterData.push({ num, name:first+' '+last, pos, year, bt:bat+'/'+thr, team, status:'Active', id:saved.id });
  closeModal('addPlayer');
  showSection('roster', document.querySelector('[onclick*=roster]'));
  ['p-first','p-last','p-num'].forEach(id=>document.getElementById(id).value='');
};

// ── Override addGame ──────────────────────────────────────────
addGame = async function() {
  const date=document.getElementById('g-date').value, opp=document.getElementById('g-opp').value.trim();
  const ha=document.getElementById('g-ha').value, loc=document.getElementById('g-loc').value.trim();
  const time=document.getElementById('g-time').value, result=document.getElementById('g-result').value;
  const score=document.getElementById('g-score').value.trim(), notes=document.getElementById('g-notes').value.trim();
  const teamVal=document.getElementById('g-team').value, team=teamVal==='varsity'?'Varsity':'JV';
  if (!date||!opp){ alert('Please enter a date and opponent.'); return; }
  const saved=await apiPost('schedule',{ game_date:date, opponent:opp, home_away:ha, location:loc, game_time:time||null, result, score, notes, team });
  if (saved.error){ alert('Error saving: '+saved.error); return; }
  const game={ id:saved.id, date, opp, ha, loc, time, result, score, notes };
  if (team==='Varsity'){ varsityGames.push(game); varsityGames.sort((a,b)=>a.date.localeCompare(b.date)); renderScheduleTable(varsityGames,'varsity-sched-body'); }
  else { jvGames.push(game); jvGames.sort((a,b)=>a.date.localeCompare(b.date)); renderScheduleTable(jvGames,'jv-sched-body'); }
  closeModal('addGame');
  ['g-date','g-opp','g-loc','g-time','g-score','g-notes'].forEach(id=>document.getElementById(id).value='');
};

// ── Override addTask ──────────────────────────────────────────
addTask = async function() {
  const name=document.getElementById('task-name').value.trim(), pri=document.getElementById('task-pri').value;
  const due=document.getElementById('task-due').value, assign=document.getElementById('task-assign').value.trim()||'Unassigned';
  if (!name){ alert('Please enter a task name.'); return; }
  const saved=await apiPost('field-tasks',{ task_name:name, priority:pri, assigned_to:assign, due_date:due||null, done:false });
  if (saved.error){ alert('Error saving: '+saved.error); return; }
  const container=document.getElementById('field-tasks');
  const priMap={ high:['pri-high','Needed'], med:['pri-med','Pending'], low:['pri-low','Routine'] };
  const [cls,label]=priMap[pri];
  const div=document.createElement('div'); div.className='field-task'; div.dataset.id=saved.id;
  div.innerHTML='<div class="task-check" onclick="toggleTaskDb(this,\''+saved.id+'\')"></div><div class="task-info"><div class="task-name">'+name+'</div><div class="task-meta">Assigned: '+assign+(due?' | Due: '+due:'')+'</div></div><span class="task-priority '+cls+'">'+label+'</span>';
  container.appendChild(div);
  closeModal('addTask');
  ['task-name','task-assign','task-due'].forEach(id=>document.getElementById(id).value='');
};

async function toggleTaskDb(el,id) {
  el.classList.toggle('done');
  const done=el.classList.contains('done');
  const pri=el.parentElement.querySelector('.task-priority');
  if(done){pri.className='task-priority pri-low';pri.textContent='Done';}
  else{pri.className='task-priority pri-med';pri.textContent='Pending';}
  if(id) await apiPatch('field-tasks',id,{done});
}

// ── Override addUser ──────────────────────────────────────────
window.addUser = async function() {
  const first=document.getElementById('u-first').value.trim(), last=document.getElementById('u-last').value.trim();
  const role=document.getElementById('u-role').value, username=document.getElementById('u-username').value.trim().toLowerCase();
  const password=document.getElementById('u-password').value.trim();
  const playerLink=role==='player'?document.getElementById('u-player').value:null;
  if(!first||!last){alert('Please enter first and last name.');return;}
  if(!username){alert('Please enter a username.');return;}
  if(!password){alert('Please enter a password.');return;}
  if(USERS.find(u=>u.username.toLowerCase()===username)){alert('Username already taken.');return;}
  const saved=await apiPost('users',{ name:first+' '+last, username, password, role, player_link:playerLink||null });
  if(saved.error){alert('Error: '+saved.error);return;}
  USERS.push({id:saved.id,name:first+' '+last,username,password,role,playerLink:playerLink||null});
  saveUsers(); renderUsersTable(); closeModal('addUser');
  ['u-first','u-last','u-username','u-password'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('u-role').value='coach'; document.getElementById('player-link-group').style.display='none';
  alert('Account created!\n\nName: '+first+' '+last+'\nUsername: '+username+'\nPassword: '+password+'\nRole: '+role+'\n\nShare these credentials.');
};

// ── Override addContrib ───────────────────────────────────────
addContrib = async function() {
  const name=document.getElementById('cb-name').value.trim(), amount=document.getElementById('cb-amount').value;
  const fr=document.getElementById('cb-fr').value, notes=document.getElementById('cb-notes').value.trim();
  if(!name||!amount){alert('Please enter contributor name and amount.');return;}
  await apiPost('contributions',{contributor:name,amount:parseFloat(amount),fundraiser:fr,notes});
  const tbody=document.getElementById('contributions-body');
  const today=new Date(), dateStr=(today.getMonth()+1)+'/'+today.getDate();
  const row=document.createElement('tr');
  row.innerHTML='<td>'+name+'</td><td class="stat-highlight">$'+parseInt(amount).toLocaleString()+'</td><td>'+fr+'</td><td style="color:var(--text-muted)">'+dateStr+'</td><td style="color:var(--text-muted)">'+(notes||'-')+'</td>';
  tbody.insertBefore(row,tbody.firstChild);
  closeModal('addContrib');
  ['cb-name','cb-amount','cb-notes'].forEach(id=>document.getElementById(id).value='');
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  const portal=document.getElementById('portal-screen');
  if(portal) portal.style.display='none';
  if(typeof varsityGames!=='undefined'){
    renderScheduleTable(varsityGames,'varsity-sched-body');
    renderScheduleTable(jvGames,'jv-sched-body');
  }
  renderRoster();
});

