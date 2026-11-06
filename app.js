'use strict';
/* =====================================================================
   keel: personal tracker (gym, bulk, money, uni, learning)
   All data is stored on this device in localStorage.
   ===================================================================== */

/* ---------------- helpers ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const KEY = 'keel.v1';
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayKey = () => keyOf(today());
const dayIdx = (d) => (d.getDay() + 6) % 7; // 0 = monday
const mondayOf = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dayIdx(d));
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY3 = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY1 = ['m', 't', 'w', 't', 'f', 's', 's'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbp0 = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const money = (n) => gbp.format(n || 0);
const money0 = (n) => (Math.abs(n) >= 1000 ? gbp0.format(n || 0) : gbp.format(n || 0));
const int = (n) => Math.round(n || 0).toLocaleString('en-GB');
const round1 = (n) => Math.round(n * 10) / 10;
const sum = (a) => a.reduce((t, x) => t + x, 0);
const num = (v) => {
  const s = String(v ?? '').replace(/[£\s]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};
const fmtMins = (m) => { m = Math.round(m || 0); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r}m`; };
const fmtDay = (k) => {
  const t = todayKey();
  if (k === t) return 'today';
  if (k === keyOf(addDays(today(), -1))) return 'yesterday';
  const d = parseKey(k);
  return `${DAY3[dayIdx(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
const unitW = () => S.settings.unit || 'kg';

/* ---------------- icons ---------------- */
const ICONS = {
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  dumbbell: '<rect x="5" y="7" width="3" height="10" rx="1.2"/><rect x="16" y="7" width="3" height="10" rx="1.2"/><path d="M3 10v4M21 10v4M8 12h8"/>',
  flame: '<path d="M12 3c.8 3.3 5 5.4 5 10.2A5 5 0 0 1 7 13.2c0-2.4 1.3-3.9 2.5-4.9.2 1.6 1 2.6 2 3.1C11.4 8.6 10.6 6 12 3z"/>',
  drop: '<path d="M12 3.5c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 8.8c-.4-.8-1.3-1.3-2.4-1.3-1.5 0-2.4.8-2.4 1.9 0 2.6 5 1.4 5 4.1 0 1.2-1 2-2.6 2-1.1 0-2-.5-2.5-1.4M12 6v1.5M12 16v1.6"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.6v4c3 2 8 2 11 0v-4"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 10a5 5 0 0 1 7 0M12 10l1.4-1.6"/>',
  run: '<circle cx="14" cy="4.5" r="1.8"/><path d="M6 20l3.5-5 3 2V12l-3-1.5L7 13M12.5 12l2 3H18M11 8l3.5 1.5"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  pray: '<path d="M12 3v18M7 8l5-5 5 5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  gear: '<path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9"/><circle cx="15" cy="7.5" r="2.2"/><circle cx="9" cy="16.5" r="2.2"/>',
  left: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  right: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  out: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>',
  in: '<path d="M12 20V8M7 13l5-5 5 5M5 4h14"/>',
  share: '<path d="M12 15V4M8 7.5L12 4l4 3.5"/><path d="M7.5 10H6v10h12V10h-1.5"/>'
};
const ico = (name, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.star}</svg>`;
const HABIT_ICONS = ['book', 'drop', 'moon', 'pen', 'bulb', 'leaf', 'run', 'heart', 'sun', 'star', 'coin', 'pray'];

const LOGO = `<svg viewBox="0 0 30 30" aria-hidden="true"><polygon points="${hexPts(13)}" style="fill:none;stroke:var(--ink);stroke-width:2.4"/><polygon points="${hexPts(7)}" style="fill:var(--accent)"/></svg>`;

/* ---------------- state ---------------- */
function defaultState() {
  return {
    version: 1,
    settings: { setupDone: false, name: '', gymPerWeek: 4, calorieTarget: 3000, startWeight: null, goalWeight: null, unit: 'kg', theme: 'system' },
    habits: [
      { id: 'gym', name: 'gym', icon: 'dumbbell', kind: 'weekly', auto: 'gym' },
      { id: 'cal', name: 'calories', icon: 'flame', kind: 'daily', auto: 'calories' }
    ],
    checks: {},      // { 'YYYY-MM-DD': { habitId: true } }
    workouts: [],    // { id, date, title, exercises: [{ name, sets: [{ reps, w }] }] }
    weights: [],     // { id, date, w }
    food: {},        // { 'YYYY-MM-DD': [{ id, kcal, label }] }
    tx: [],          // { id, date, type: 'out'|'in', amount, cat, note }
    goals: [],       // { id, name, target, saved }
    classes: [],     // { id, day, start, end, title, type, room }
    learning: []     // { id, date, topic, mins, note }
  };
}
function migrate(s) {
  const d = defaultState();
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  s.settings = { ...d.settings, ...s.settings };
  return s;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { /* fall through */ }
  return defaultState();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('could not save. export a backup in settings'); }
}
let S = load();
const UI = { tab: 'today', monthOff: 0, uniDay: dayIdx(today()) };

function commit(msg) { save(); render(); if (msg) toast(msg); }

/* ---------------- habit logic ---------------- */
const activeHabits = () => S.habits.filter((h) => !h.hidden);
const findHabit = (id) => S.habits.find((h) => h.id === id);
const kcalOn = (k) => sum((S.food[k] || []).map((f) => f.kcal));
const perWeekOf = (h) => (h.auto === 'gym' ? S.settings.gymPerWeek : h.perWeek || 3);

function doneOn(h, k) {
  if (h.auto === 'gym') return S.workouts.some((w) => w.date === k);
  if (h.auto === 'calories') return S.settings.calorieTarget > 0 && kcalOn(k) >= S.settings.calorieTarget;
  return !!(S.checks[k] && S.checks[k][h.id]);
}
function weekCount(h, monday) {
  let n = 0;
  for (let i = 0; i < 7; i++) if (doneOn(h, keyOf(addDays(monday, i)))) n++;
  return n;
}
function keptToday(h) {
  const t = today();
  if (doneOn(h, keyOf(t))) return true;
  return h.kind === 'weekly' && weekCount(h, mondayOf(t)) >= perWeekOf(h);
}
function streakOf(h) {
  if (h.kind === 'weekly') {
    let w = mondayOf(today()), n = 0;
    const target = perWeekOf(h);
    if (weekCount(h, w) >= target) n++;
    w = addDays(w, -7);
    for (let i = 0; i < 520 && weekCount(h, w) >= target; i++) { n++; w = addDays(w, -7); }
    return n;
  }
  let d = today(), n = 0;
  if (!doneOn(h, keyOf(d))) d = addDays(d, -1);
  for (let i = 0; i < 3650 && doneOn(h, keyOf(d)); i++) { n++; d = addDays(d, -1); }
  return n;
}
function showingUp() {
  const hs = activeHabits();
  if (!hs.length) return 0;
  const any = (k) => hs.some((h) => doneOn(h, k));
  let d = today(), n = 0;
  if (!any(keyOf(d))) d = addDays(d, -1);
  for (let i = 0; i < 3650 && any(keyOf(d)); i++) { n++; d = addDays(d, -1); }
  return n;
}
function subOf(h) {
  if (h.auto === 'gym') return `${S.settings.gymPerWeek}× a week`;
  if (h.auto === 'calories') return `${int(S.settings.calorieTarget)} kcal`;
  if (h.detail) return h.detail;
  return h.kind === 'weekly' ? `${h.perWeek}× a week` : 'every day';
}

/* ---------------- drawing ---------------- */
function hexPts(r, c = 15) {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    p.push(`${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`);
  }
  return p.join(' ');
}
function hex(kind) {
  let s = '';
  if (kind === 'done') s = `<polygon points="${hexPts(9)}" style="fill:var(--ink)"/>`;
  else if (kind === 'miss') s = `<polygon points="${hexPts(5)}" style="fill:var(--faint)"/>`;
  else if (kind === 'future') s = `<polygon points="${hexPts(5)}" style="fill:var(--faint);opacity:.5"/>`;
  else {
    s = `<polygon points="${hexPts(13)}" style="fill:none;stroke:var(--muted);stroke-width:2.4"/>`;
    s += kind === 'today-done' ? `<polygon points="${hexPts(8.5)}" style="fill:var(--ink)"/>` : `<polygon points="${hexPts(5)}" style="fill:var(--faint)"/>`;
  }
  return `<svg viewBox="0 0 30 30" aria-hidden="true">${s}</svg>`;
}
function tally(done, slots) {
  slots = Math.max(slots, done, 1);
  const groups = Math.ceil(slots / 5);
  const W = groups * 62 - 10;
  let faint = '', ink = '';
  for (let i = 0; i < slots; i++) {
    const g = Math.floor(i / 5), p = i % 5, x0 = g * 62;
    const seg = p < 4 ? `<path d="M${x0 + 8 + p * 12} 4 L${x0 + 6 + p * 12} 38"/>` : `<path d="M${x0} 31 L${x0 + 50} 11"/>`;
    if (i < done) ink += seg; else faint += seg;
  }
  return `<svg viewBox="-4 0 ${W + 8} 42" style="width:${Math.round((W + 8) * 0.95)}px" aria-label="${done} of ${slots}">
    <g style="stroke:var(--faint);stroke-width:5;stroke-linecap:round;fill:none">${faint}</g>
    <g style="stroke:var(--ink);stroke-width:5.5;stroke-linecap:round;fill:none">${ink}</g></svg>`;
}
function bars(values, labels, todayI, fmt) {
  const max = Math.max(...values, 1);
  return `<div class="bars">${values.map((v, i) => `
    <div class="b ${i === todayI ? 'today' : ''}" title="${esc(fmt ? fmt(v) : v)}">
      <i class="${v ? '' : 'zero'}" style="height:${Math.max(3, (v / max) * 92)}%"></i><span>${labels[i]}</span>
    </div>`).join('')}</div>`;
}
function weightChart() {
  const pts = [...S.weights].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-90);
  if (pts.length < 2) return `<p class="empty">log at least two weigh-ins to see your chart</p>`;
  const W = 320, H = 150, P = 12;
  const vals = pts.map((p) => p.w);
  const goal = S.settings.goalWeight;
  let min = Math.min(...vals), max = Math.max(...vals);
  if (goal) { min = Math.min(min, goal); max = Math.max(max, goal); }
  const padv = Math.max((max - min) * 0.12, 0.5); min -= padv; max += padv;
  const t0 = parseKey(pts[0].date).getTime(), t1 = parseKey(pts[pts.length - 1].date).getTime();
  const span = Math.max(t1 - t0, 1);
  const x = (k) => P + ((parseKey(k).getTime() - t0) / span) * (W - 2 * P);
  const y = (v) => P + ((max - v) / (max - min)) * (H - 2 * P);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)} ${y(p.w).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts[pts.length - 1].date).toFixed(1)} ${H - P} L${x(pts[0].date).toFixed(1)} ${H - P} Z`;
  const last = pts[pts.length - 1];
  const goalLine = goal ? `<line x1="${P}" x2="${W - P}" y1="${y(goal)}" y2="${y(goal)}" style="stroke:var(--muted);stroke-width:1.2;stroke-dasharray:4 5"/>
    <text x="${W - P}" y="${y(goal) - 6}" text-anchor="end" style="fill:var(--muted);font-size:12px;font-style:italic">goal ${goal}</text>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="body weight chart">
    <path d="${area}" style="fill:var(--accent);opacity:.08"/>
    ${goalLine}
    <path d="${line}" style="fill:none;stroke:var(--accent);stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round"/>
    <circle cx="${x(last.date)}" cy="${y(last.w)}" r="5" style="fill:var(--accent);stroke:var(--card);stroke-width:2"/>
    <text x="${P}" y="${H - 1}" style="fill:var(--muted);font-size:11px">${esc(fmtDay(pts[0].date))}</text>
    <text x="${W - P}" y="${H - 1}" text-anchor="end" style="fill:var(--muted);font-size:11px">${esc(fmtDay(last.date))}</text>
  </svg>`;
}

/* ---------------- shared pieces ---------------- */
function topbar(extra = '') {
  return `<header class="top">
    <div class="brand">${LOGO}keel</div>
    <div class="top-actions">
      ${extra}
      <button class="round ghost" data-act="openSettings" aria-label="settings">${ico('gear')}</button>
      <button class="round" data-act="openQuick" aria-label="add">${ico('plus')}</button>
    </div>
  </header>`;
}
function habitCard(h) {
  const t = today(), tk = keyOf(t), mon = mondayOf(t);
  const weekly = h.kind === 'weekly';
  const target = perWeekOf(h);
  const wc = weekCount(h, mon);
  const doneT = doneOn(h, tk);
  const met = weekly && !doneT && wc >= target;
  const st = streakOf(h);
  const days = DAY1.map((l, i) => {
    const d = addDays(mon, i), k = keyOf(d);
    const isToday = k === tk, future = d > t, done = doneOn(h, k);
    const kind = isToday ? (done ? 'today-done' : 'today-open') : future ? 'future' : done ? 'done' : 'miss';
    const clickable = !future && h.auto !== 'calories';
    const attrs = clickable ? `data-act="toggleDay" data-id="${h.id}" data-date="${k}" aria-label="${DAYS[i]}: ${done ? 'done' : 'not done'}"` : `disabled aria-label="${DAYS[i]}"`;
    return `<button class="d ${isToday ? 'today' : ''}" ${attrs}>${hex(kind)}<span>${l}</span></button>`;
  }).join('');
  const weekDone = weekly ? wc : sum(DAY1.map((_, i) => (doneOn(h, keyOf(addDays(mon, i))) ? 1 : 0)));
  const unit = weekly ? (st === 1 ? 'week' : 'weeks') : (st === 1 ? 'day' : 'days');
  return `<article class="card habit">
    <div class="habit-head">
      <div class="icon-tile">${ico(h.icon)}</div>
      <div class="habit-title"><h2>${esc(h.name)}</h2><p class="sub">${esc(subOf(h))}</p></div>
      <button class="check ${doneT ? 'on' : met ? 'met' : ''}" data-act="toggleHabit" data-id="${h.id}" aria-label="${doneT ? 'done today' : 'mark done'}">${ico('check')}</button>
    </div>
    <div class="week">${days}</div>
    <div class="habit-foot">
      <div class="tally">${tally(weekDone, weekly ? target : 7)}</div>
      ${weekly ? `<span class="of">${wc} of ${target}</span>` : ''}
      <div class="streak"><b>${st}</b> ${unit}</div>
    </div>
  </article>`;
}
function classRow(c, isToday) {
  let tag = '';
  if (isToday) {
    const now = new Date(), hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (c.start <= hm && hm < c.end) tag = '<span class="now-tag">now</span>';
  }
  return `<button class="item" data-act="openClass" data-id="${c.id}">
    <div class="time"><b>${esc(c.start)}</b>${esc(c.end)}</div>
    <div class="main"><div class="t">${esc(c.title)}</div><div class="s">${esc([c.type, c.room].filter(Boolean).join(' · '))}</div></div>
    ${tag}
  </button>`;
}
const classesOn = (d) => S.classes.filter((c) => c.day === d).sort((a, b) => (a.start < b.start ? -1 : 1));
const monthKey = (off = 0) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const txIn = (mk) => S.tx.filter((t) => t.date.startsWith(mk));
function weekMins() { const mon = mondayOf(today()); return DAY1.map((_, i) => { const k = keyOf(addDays(mon, i)); return sum(S.learning.filter((l) => l.date === k).map((l) => l.mins)); }); }

/* ---------------- views ---------------- */
function viewSetup() {
  const s = S.settings;
  return `<section class="setup">
    <div class="brand">${LOGO}keel</div>
    <h1 class="big" style="margin-top:34px">let's set you up.</h1>
    <p class="lead">a few targets to start. you can change any of these later in settings.</p>
    <form data-form="setup" autocomplete="off">
      ${settingsFields(s)}
      <div class="btnrow" style="margin-top:26px"><button class="btn">start</button></div>
    </form>
  </section>`;
}
function settingsFields(s) {
  return `
    <label class="field"><span>your name (optional)</span><input class="input" name="name" value="${esc(s.name)}" placeholder="what should i call you?"></label>
    <div class="grid2">
      <label class="field"><span>gym days / week</span><input class="input" name="gymPerWeek" type="number" inputmode="numeric" min="1" max="7" required value="${esc(s.gymPerWeek)}"></label>
      <label class="field"><span>daily calories</span><input class="input" name="calorieTarget" inputmode="numeric" required value="${esc(s.calorieTarget)}"></label>
    </div>
    <div class="field"><span>weight unit</span>
      <div class="chips">
        <label><input type="radio" name="unit" value="kg" ${s.unit !== 'lb' ? 'checked' : ''}><span class="chip">kg</span></label>
        <label><input type="radio" name="unit" value="lb" ${s.unit === 'lb' ? 'checked' : ''}><span class="chip">lb</span></label>
      </div>
    </div>
    <div class="grid2">
      <label class="field"><span>${s.setupDone ? 'start weight' : 'current weight'}</span><input class="input" name="startWeight" inputmode="decimal" value="${esc(s.startWeight ?? '')}" placeholder="e.g. 68"></label>
      <label class="field"><span>goal weight</span><input class="input" name="goalWeight" inputmode="decimal" value="${esc(s.goalWeight ?? '')}" placeholder="e.g. 75"></label>
    </div>`;
}

function viewToday() {
  const t = today();
  const hs = activeHabits();
  const kept = hs.filter(keptToday).length;
  const pct = hs.length ? Math.round((kept / hs.length) * 100) : 0;
  const su = showingUp();
  const keptTxt = !hs.length ? '' : kept === hs.length ? 'all kept' : `${kept} of ${hs.length} kept`;
  const classes = classesOn(dayIdx(t));
  const kc = kcalOn(keyOf(t));
  const spent = sum(txIn(monthKey()).filter((x) => x.type === 'out').map((x) => x.amount));
  const learned = sum(weekMins());
  const hello = S.settings.name ? `<p class="note" style="margin-top:6px">hey ${esc(S.settings.name.toLowerCase())}.</p>` : '';

  return `${topbar('<button class="pill" data-act="openHabits">edit</button>')}
  <section class="dateblock">
    <div class="row between"><span class="weekday">${DAYS[dayIdx(t)]}</span><span class="streakline">showing up · ${su} ${su === 1 ? 'day' : 'days'}</span></div>
    <div class="row between" style="align-items:flex-end;flex-wrap:wrap;column-gap:12px;row-gap:0">
      <h1 class="bigdate">${MONTHS[t.getMonth()]} ${t.getDate()}</h1>
      <span class="kept">${keptTxt}</span>
    </div>
    ${hello}
    <hr class="double">
    <div class="progress"><div class="bar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>
  </section>

  ${hs.map(habitCard).join('') || `<div class="card"><p class="empty">no habits yet. tap <b>edit</b> to add some.</p></div>`}

  <div class="section-title"><span>at a glance</span></div>
  <div class="card tight">
    <div class="stats">
      <button class="stat" data-act="tab" data-tab="gym"><div class="k">kcal</div><div class="v">${int(kc)}</div></button>
      <button class="stat" data-act="tab" data-tab="money"><div class="k">spent · ${MONTHS[t.getMonth()].slice(0, 3)}</div><div class="v">${money0(spent)}</div></button>
      <button class="stat" data-act="tab" data-tab="learn"><div class="k">learned</div><div class="v">${fmtMins(learned)}</div></button>
    </div>
  </div>

  <div class="section-title"><span>today at uni</span><button data-act="tab" data-tab="uni">timetable</button></div>
  <div class="card tight">
    ${classes.length ? `<div class="list">${classes.map((c) => classRow(c, true)).join('')}</div>` : `<p class="empty">no classes today</p>`}
  </div>`;
}

function viewGym() {
  const t = today(), tk = keyOf(t);
  const gymH = findHabit('gym') || { id: 'gym', name: 'gym', icon: 'dumbbell', kind: 'weekly', auto: 'gym' };
  const target = S.settings.calorieTarget || 0;
  const kc = kcalOn(tk);
  const left = target - kc;
  const foods = S.food[tk] || [];
  const last7 = [...Array(7)].map((_, i) => keyOf(addDays(t, i - 6)));
  const kcal7 = last7.map(kcalOn);
  const hit7 = kcal7.filter((v) => target && v >= target).length;
  const u = unitW();

  // weight stats
  const ws = [...S.weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const cur = ws.length ? ws[ws.length - 1].w : S.settings.startWeight;
  const goal = S.settings.goalWeight;
  const start = S.settings.startWeight ?? (ws[0] && ws[0].w);
  let rateTxt = '';
  if (ws.length >= 2) {
    const lastD = parseKey(ws[ws.length - 1].date);
    const ref = ws.filter((w) => parseKey(w.date) <= addDays(lastD, -21));
    const base = ref.length ? ref[ref.length - 1] : ws[0];
    const days = (lastD - parseKey(base.date)) / 864e5;
    if (days >= 6) { const r = ((ws[ws.length - 1].w - base.w) / days) * 7; rateTxt = `${r >= 0 ? '+' : ''}${round1(r)} ${u}/week lately`; }
  }
  const sinceTxt = start != null && cur != null ? `${cur - start >= 0 ? '+' : ''}${round1(cur - start)} ${u} since start` : '';

  const workouts = [...S.workouts].sort(byDateDesc).slice(0, 25);

  return `${topbar()}
  <div class="pagehead"><h1>gym & bulk</h1><p>show up, eat up, grow.</p></div>

  ${habitCard(gymH)}
  <div class="btnrow">
    <button class="btn soft" data-act="toggleHabit" data-id="gym">${doneOn(gymH, tk) ? 'went today ✓' : 'went today'}</button>
    <button class="btn" data-act="openWorkout">${ico('plus')} log workout</button>
  </div>

  <div class="section-title"><span>calories today</span><button data-act="openCalories">+ add</button></div>
  <div class="card">
    <div class="big">${int(kc)}<small> / ${int(target)} kcal</small></div>
    <div class="meter"><i style="width:${target ? Math.min(100, (kc / target) * 100) : 0}%"></i></div>
    <p class="note">${!target ? 'set a calorie target in settings' : left > 0 ? `${int(left)} to go` : `target hit${left < 0 ? ` · ${int(-left)} over` : ''} ✓`}</p>
    ${foods.length ? `<div class="list" style="margin-top:8px">${foods.map((f) => `
      <button class="item" data-act="delFood" data-id="${f.id}">
        <div class="main"><div class="t">${esc(f.label || 'food')}</div></div>
        <div class="amt">${int(f.kcal)}</div>
      </button>`).join('')}</div>` : ''}
    <div class="btnrow"><button class="btn" data-act="openCalories">${ico('plus')} add calories</button></div>
    <div class="section-title" style="margin:22px 0 0"><span>last 7 days</span><span class="note" style="letter-spacing:0">hit ${hit7} of 7</span></div>
    ${bars(kcal7, last7.map((k) => DAY1[dayIdx(parseKey(k))]), 6, (v) => `${int(v)} kcal`)}
  </div>

  <div class="section-title"><span>body weight</span><button data-act="openWeight">+ log</button></div>
  <div class="card">
    <div class="stats">
      <div class="stat"><div class="k">now</div><div class="v">${cur != null ? `${round1(cur)}` : '—'}</div></div>
      <div class="stat"><div class="k">goal</div><div class="v">${goal != null ? round1(goal) : '—'}</div></div>
      <div class="stat"><div class="k">to go</div><div class="v">${goal != null && cur != null ? round1(Math.max(0, goal - cur)) : '—'}</div></div>
    </div>
    ${goal != null && start != null && cur != null && goal !== start ? `<div class="meter"><i style="width:${Math.max(0, Math.min(100, ((cur - start) / (goal - start)) * 100))}%"></i></div>` : ''}
    <p class="note" style="text-align:center">${[sinceTxt, rateTxt].filter(Boolean).join(' · ') || `weights in ${u}`}</p>
    ${weightChart()}
    <div class="btnrow"><button class="btn" data-act="openWeight">${ico('scale')} log weight</button></div>
    ${ws.length ? `<div class="list" style="margin-top:8px">${ws.slice(-5).reverse().map((w) => `
      <button class="item" data-act="delWeight" data-id="${w.id}"><div class="main"><div class="t">${esc(fmtDay(w.date))}</div></div><div class="amt">${round1(w.w)} ${u}</div></button>`).join('')}</div>` : ''}
  </div>

  <div class="section-title"><span>workouts</span><button data-act="openWorkout">+ log</button></div>
  <div class="card tight">
    ${workouts.length ? `<div class="list">${workouts.map((w) => `
      <button class="item" data-act="openWorkoutView" data-id="${w.id}">
        <div class="main"><div class="t">${esc(w.title || 'gym')}</div>
          <div class="s">${w.exercises.length ? esc(w.exercises.map((e) => e.name).join(', ')) : 'attendance only'}</div></div>
        <div class="note">${esc(fmtDay(w.date))}</div>
      </button>`).join('')}</div>` : `<p class="empty">no workouts yet. tap “log workout” after your next session.</p>`}
  </div>`;
}

const OUT_CATS = ['food', 'groceries', 'going out', 'transport', 'shopping', 'rent', 'bills', 'subscriptions', 'uni', 'gym', 'other'];
const IN_CATS = ['student loan', 'job', 'family', 'refund', 'other'];

function viewMoney() {
  const mk = monthKey(UI.monthOff);
  const [y, m] = mk.split('-').map(Number);
  const list = txIn(mk);
  const inc = sum(list.filter((t) => t.type === 'in').map((t) => t.amount));
  const out = sum(list.filter((t) => t.type === 'out').map((t) => t.amount));
  const net = inc - out;
  const cats = {};
  list.filter((t) => t.type === 'out').forEach((t) => { cats[t.cat] = (cats[t.cat] || 0) + t.amount; });
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const topCat = catRows.length ? catRows[0][1] : 1;
  const byDay = {};
  [...list].sort(byDateDesc).forEach((t) => { (byDay[t.date] = byDay[t.date] || []).push(t); });

  return `${topbar()}
  <div class="pagehead"><h1>money</h1><p>know where every pound goes.</p></div>
  <div class="monthnav">
    <button data-act="month" data-d="-1" aria-label="previous month">${ico('left')}</button>
    <b>${MONTHS[m - 1]} ${y}</b>
    <button data-act="month" data-d="1" aria-label="next month" ${UI.monthOff >= 0 ? 'disabled style="opacity:.25"' : ''}>${ico('right')}</button>
  </div>

  <div class="card">
    <div class="note" style="text-align:center">${net >= 0 ? 'left over' : 'overspent'}</div>
    <div class="big" style="text-align:center;margin:4px 0 16px;${net < 0 ? 'color:var(--bad)' : ''}">${money(net)}</div>
    <div class="stats" style="grid-template-columns:1fr 1fr">
      <div class="stat"><div class="k">in</div><div class="v" style="color:var(--good)">${money(inc)}</div></div>
      <div class="stat"><div class="k">out</div><div class="v">${money(out)}</div></div>
    </div>
    <div class="btnrow">
      <button class="btn" data-act="openTx" data-type="out">${ico('out')} spent</button>
      <button class="btn soft" data-act="openTx" data-type="in">${ico('in')} income</button>
    </div>
  </div>

  ${catRows.length ? `<div class="section-title"><span>where it went</span></div>
  <div class="card">${catRows.map(([c, v]) => `
    <div class="catbar"><div class="row"><span>${esc(c)}</span><span class="amt">${money(v)}</span></div>
    <div class="meter"><i style="width:${(v / topCat) * 100}%"></i></div></div>`).join('')}</div>` : ''}

  <div class="section-title"><span>savings goals</span><button data-act="openGoal">+ new</button></div>
  ${S.goals.length ? S.goals.map((g) => {
    const p = g.target ? Math.min(100, (g.saved / g.target) * 100) : 0;
    return `<button class="card tight" style="display:block;width:100%;text-align:left" data-act="openGoalMove" data-id="${g.id}">
      <div class="row between"><b style="font-size:20px">${esc(g.name)}</b><span class="note">${Math.round(p)}%</span></div>
      <div class="meter"><i style="width:${p}%"></i></div>
      <div class="note">${money(g.saved)} of ${money(g.target)}${g.saved < g.target ? ` · ${money(g.target - g.saved)} to go` : ' · done ✓'}</div>
    </button>`;
  }).join('') : `<div class="card tight"><p class="empty">no goals yet. what are you saving for?</p></div>`}

  <div class="section-title"><span>transactions</span></div>
  <div class="card tight">
    ${Object.keys(byDay).length ? Object.entries(byDay).map(([d, ts]) => `
      <div class="daylabel">${esc(fmtDay(d))}</div>
      <div class="list">${ts.map((t) => `
        <button class="item" data-act="openTx" data-id="${t.id}">
          <div class="main"><div class="t">${esc(t.note || t.cat)}</div><div class="s">${esc(t.note ? t.cat : '')}</div></div>
          <div class="amt ${t.type === 'in' ? 'in' : ''}">${t.type === 'in' ? '+' : '−'}${money(t.amount)}</div>
        </button>`).join('')}</div>`).join('') : `<p class="empty">nothing logged this month</p>`}
  </div>`;
}

function viewUni() {
  const ti = dayIdx(today());
  const d = UI.uniDay;
  const cs = classesOn(d);
  const total = S.classes.length;
  return `${topbar()}
  <div class="pagehead"><h1>uni</h1><p>your week, at a glance.</p></div>
  <div class="daypick">${DAY1.map((l, i) => `<button class="${i === d ? 'on' : ''} ${classesOn(i).length ? 'has' : ''}" data-act="uniDay" data-d="${i}" aria-label="${DAYS[i]}">${l}</button>`).join('')}</div>
  <div class="section-title"><span>${DAYS[d]}${d === ti ? ' · today' : ''}</span><button data-act="openClass" data-day="${d}">+ add class</button></div>
  <div class="card tight">
    ${cs.length ? `<div class="list">${cs.map((c) => classRow(c, d === ti)).join('')}</div>` : `<p class="empty">${total ? 'nothing on this day' : 'add your lectures and seminars to build your timetable'}</p>`}
  </div>
  ${total ? `<p class="note" style="text-align:center;margin-top:14px">${total} ${total === 1 ? 'class' : 'classes'} a week · ${fmtMins(sum(S.classes.map((c) => minsBetween(c.start, c.end))))} timetabled</p>` : ''}`;
}
function minsBetween(a, b) { const [h1, m1] = a.split(':').map(Number), [h2, m2] = b.split(':').map(Number); return Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1)); }

function viewLearn() {
  const t = today();
  const wm = weekMins();
  const total = sum(wm);
  const daysLearned = wm.filter(Boolean).length;
  // streak of consecutive days with learning
  const has = (k) => S.learning.some((l) => l.date === k);
  let d = t, st = 0;
  if (!has(keyOf(d))) d = addDays(d, -1);
  for (let i = 0; i < 3650 && has(keyOf(d)); i++) { st++; d = addDays(d, -1); }
  const mk = monthKey();
  const topics = {};
  S.learning.filter((l) => l.date.startsWith(mk)).forEach((l) => { topics[l.topic] = (topics[l.topic] || 0) + l.mins; });
  const topicRows = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = topicRows.length ? topicRows[0][1] : 1;
  const recent = [...S.learning].sort(byDateDesc).slice(0, 30);

  return `${topbar()}
  <div class="pagehead"><h1>learning</h1><p>a little every day compounds.</p></div>
  <div class="card">
    <div class="row between" style="align-items:flex-end">
      <div><div class="note">this week</div><div class="big">${fmtMins(total)}</div></div>
      <div style="text-align:right"><div class="note">streak</div><div class="big" style="font-size:34px">${st}<small> ${st === 1 ? 'day' : 'days'}</small></div></div>
    </div>
    ${bars(wm, DAY1, dayIdx(t), fmtMins)}
    <p class="note" style="text-align:center;margin-top:8px">learned on ${daysLearned} of 7 days</p>
    <div class="btnrow"><button class="btn" data-act="openLearn">${ico('plus')} log learning</button></div>
  </div>

  ${topicRows.length ? `<div class="section-title"><span>this month</span></div>
  <div class="card">${topicRows.map(([n, v]) => `
    <div class="catbar"><div class="row"><span>${esc(n)}</span><span class="amt">${fmtMins(v)}</span></div>
    <div class="meter"><i style="width:${(v / topMax) * 100}%"></i></div></div>`).join('')}</div>` : ''}

  <div class="section-title"><span>log</span></div>
  <div class="card tight">
    ${recent.length ? `<div class="list">${recent.map((l) => `
      <button class="item" data-act="openLearn" data-id="${l.id}">
        <div class="main"><div class="t">${esc(l.topic)}</div>${l.note ? `<div class="s">${esc(l.note)}</div>` : ''}</div>
        <div style="text-align:right"><div class="amt">${fmtMins(l.mins)}</div><div class="note">${esc(fmtDay(l.date))}</div></div>
      </button>`).join('')}</div>` : `<p class="empty">nothing logged yet. what did you learn today?</p>`}
  </div>`;
}

const VIEWS = { today: viewToday, gym: viewGym, money: viewMoney, uni: viewUni, learn: viewLearn };

function render() {
  const v = $('#view'), tb = $('#tabbar');
  applyTheme();
  if (!S.settings.setupDone) { tb.classList.add('hidden'); v.innerHTML = viewSetup(); return; }
  tb.classList.remove('hidden');
  $$('button', tb).forEach((b) => b.classList.toggle('on', b.dataset.tab === UI.tab));
  v.innerHTML = (VIEWS[UI.tab] || viewToday)();
}
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

/* ---------------- sheets ---------------- */
function openSheet(title, body, onMount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="overlay" data-act="closeOverlay">
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="grab"></div>
      <div class="head"><h2>${esc(title)}</h2><button class="closer" data-act="closeSheet" aria-label="close">${ico('x')}</button></div>
      ${body}
    </div></div>`;
  document.body.style.overflow = 'hidden';
  const sheet = $('.sheet', root);
  const af = $('[autofocus]', sheet);
  if (af) af.focus({ preventScroll: true });
  if (onMount) onMount(sheet);
}
function closeSheet() { $('#sheet-root').innerHTML = ''; document.body.style.overflow = ''; }
const dateField = (k, label = 'date') => `<label class="field"><span>${label}</span><input class="input" type="date" name="date" value="${esc(k || todayKey())}" max="${todayKey()}" required></label>`;
const datalist = (id, items) => `<datalist id="${id}">${[...new Set(items)].filter(Boolean).slice(0, 40).map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`;
const radioChips = (name, opts, cur) => `<div class="chips">${opts.map((o) => `<label><input type="radio" name="${name}" value="${esc(o)}" ${o === cur ? 'checked' : ''}><span class="chip">${esc(o)}</span></label>`).join('')}</div>`;

function sheetQuick() {
  const b = (act, icon, label, extra = '') => `<button data-act="${act}" ${extra}>${ico(icon)}<span>${label}</span></button>`;
  openSheet('add', `<div class="quickgrid">
    ${b('openTx', 'out', 'spent', 'data-type="out"')}
    ${b('openTx', 'in', 'income', 'data-type="in"')}
    ${b('openCalories', 'flame', 'calories')}
    ${b('openWorkout', 'dumbbell', 'workout')}
    ${b('openWeight', 'scale', 'weight')}
    ${b('openLearn', 'bulb', 'learning')}
    ${b('openClass', 'cap', 'class')}
    ${b('openGoal', 'coin', 'savings goal')}
    ${b('openHabits', 'star', 'habit')}
  </div>`);
}

function sheetCalories() {
  const recent = [];
  const seen = new Set();
  Object.keys(S.food).sort().reverse().forEach((k) => (S.food[k] || []).slice().reverse().forEach((f) => {
    const key = `${f.label}|${f.kcal}`;
    if (f.label && !seen.has(key) && recent.length < 8) { seen.add(key); recent.push(f); }
  }));
  openSheet('add calories', `<form data-form="calories" autocomplete="off">
    <label class="field"><span>calories</span><input class="input xl" name="kcal" inputmode="numeric" placeholder="0" required autofocus></label>
    <div class="chips" style="margin-top:12px">${[100, 250, 500, 750, 1000].map((n) => `<button type="button" class="chip" data-act="fillKcal" data-n="${n}">+${n}</button>`).join('')}</div>
    <label class="field"><span>what was it? (optional)</span><input class="input" name="label" placeholder="e.g. chicken & rice" list="foodlist"></label>
    ${datalist('foodlist', recent.map((f) => f.label))}
    ${recent.length ? `<div class="field"><span>recent</span><div class="chips">${recent.map((f) => `<button type="button" class="chip" data-act="fillFood" data-k="${f.kcal}" data-l="${esc(f.label)}">${esc(f.label)} · ${int(f.kcal)}</button>`).join('')}</div></div>` : ''}
    <div class="btnrow"><button class="btn">add</button></div>
  </form>`);
}

function sheetWeight() {
  const ws = [...S.weights].sort(byDateDesc);
  openSheet('log weight', `<form data-form="weight" autocomplete="off">
    <label class="field"><span>weight (${unitW()})</span><input class="input xl" name="w" inputmode="decimal" placeholder="${ws[0] ? round1(ws[0].w) : '0.0'}" required autofocus></label>
    ${dateField()}
    <p class="note" style="margin-top:10px">tip: weigh in first thing in the morning for consistent numbers.</p>
    <div class="btnrow"><button class="btn">save</button></div>
  </form>`);
}

/* workout builder */
function setRowHtml(s, i) {
  return `<div class="setrow"><span class="n">${i + 1}</span>
    <input class="input r" inputmode="numeric" placeholder="reps" value="${esc(s.reps ?? '')}" aria-label="reps">
    <input class="input w" inputmode="decimal" placeholder="${unitW()}" value="${esc(s.w ?? '')}" aria-label="weight">
    <button type="button" class="mini" data-act="rmSet" aria-label="remove set">${ico('x')}</button></div>`;
}
function exHtml(ex = { name: '', sets: [{}, {}, {}] }) {
  return `<div class="ex">
    <div class="row"><input class="input ex-name" placeholder="exercise, e.g. bench press" value="${esc(ex.name)}" list="exlist">
      <button type="button" class="mini" data-act="rmEx" aria-label="remove exercise">${ico('x')}</button></div>
    <div class="sets">${ex.sets.map(setRowHtml).join('')}</div>
    <button type="button" class="linkbtn" data-act="addSet">+ add set</button>
  </div>`;
}
function sheetWorkout(id) {
  const w = id ? S.workouts.find((x) => x.id === id) : null;
  const allEx = S.workouts.flatMap((x) => x.exercises.map((e) => e.name));
  const titles = [];
  [...S.workouts].sort(byDateDesc).forEach((x) => { if (x.exercises.length && x.title && !titles.includes(x.title) && titles.length < 6) titles.push(x.title); });
  openSheet(w ? 'edit workout' : 'log workout', `<form data-form="workout" autocomplete="off">
    <input type="hidden" name="id" value="${w ? w.id : ''}">
    ${!w && titles.length ? `<div class="field"><span>repeat a previous session</span><div class="chips">${titles.map((t) => `<button type="button" class="chip" data-act="copyWorkout" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>` : ''}
    <div class="grid2">
      <label class="field"><span>session</span><input class="input" name="title" placeholder="e.g. push" value="${esc(w ? w.title : '')}" list="titlelist"></label>
      ${dateField(w ? w.date : '')}
    </div>
    ${datalist('titlelist', titles.concat(['push', 'pull', 'legs', 'upper', 'lower', 'full body']))}
    ${datalist('exlist', allEx)}
    <div id="exs">${w ? w.exercises.map(exHtml).join('') : exHtml()}</div>
    <button type="button" class="linkbtn" data-act="addEx">+ add exercise</button>
    <div class="btnrow"><button class="btn">save workout</button></div>
  </form>`);
}
function sheetWorkoutView(id) {
  const w = S.workouts.find((x) => x.id === id);
  if (!w) return;
  const u = unitW();
  openSheet(w.title || 'gym', `
    <p class="note">${esc(fmtDay(w.date))}</p>
    ${w.exercises.length ? w.exercises.map((e) => `<div class="card tight">
      <b>${esc(e.name)}</b>
      <div class="note" style="margin-top:4px">${e.sets.map((s) => `${s.reps ?? '?'} × ${s.w ?? 0}${u}`).join(' · ')}</div>
    </div>`).join('') : '<p class="empty">attendance only</p>'}
    <div class="btnrow">
      <button class="btn danger" data-act="delWorkout" data-id="${w.id}">delete</button>
      <button class="btn" data-act="openWorkout" data-id="${w.id}">edit</button>
    </div>`);
}

function sheetTx(type, id) {
  const t = id ? S.tx.find((x) => x.id === id) : null;
  if (t) type = t.type;
  const cats = type === 'in' ? IN_CATS : OUT_CATS;
  const cur = t ? t.cat : cats[0];
  const allCats = cats.includes(cur) ? cats : cats.concat([cur]);
  openSheet(t ? (type === 'in' ? 'edit income' : 'edit spending') : type === 'in' ? 'add income' : 'add spending', `<form data-form="tx" autocomplete="off">
    <input type="hidden" name="id" value="${t ? t.id : ''}"><input type="hidden" name="type" value="${type}">
    <label class="field"><span>amount (£)</span><input class="input xl" name="amount" inputmode="decimal" placeholder="0.00" required ${t ? `value="${t.amount}"` : 'autofocus'}></label>
    <div class="field"><span>category</span>${radioChips('cat', allCats, cur)}</div>
    <label class="field"><span>note (optional)</span><input class="input" name="note" value="${esc(t ? t.note : '')}" placeholder="${type === 'in' ? 'e.g. november pay' : 'e.g. tesco meal deal'}"></label>
    ${dateField(t ? t.date : '')}
    <div class="btnrow">${t ? `<button type="button" class="btn danger" data-act="delTx" data-id="${t.id}">delete</button>` : ''}<button class="btn">save</button></div>
  </form>`);
}

function sheetGoal() {
  openSheet('new savings goal', `<form data-form="goal" autocomplete="off">
    <label class="field"><span>saving for</span><input class="input" name="name" placeholder="e.g. summer trip" required autofocus></label>
    <div class="grid2">
      <label class="field"><span>target (£)</span><input class="input" name="target" inputmode="decimal" placeholder="1000" required></label>
      <label class="field"><span>already saved (£)</span><input class="input" name="saved" inputmode="decimal" placeholder="0"></label>
    </div>
    <div class="btnrow"><button class="btn">create</button></div>
  </form>`);
}
function sheetGoalMove(id) {
  const g = S.goals.find((x) => x.id === id);
  if (!g) return;
  openSheet(g.name, `<form data-form="goalMove" autocomplete="off">
    <input type="hidden" name="id" value="${g.id}">
    <p class="note">${money(g.saved)} of ${money(g.target)} saved</p>
    <label class="field"><span>amount (£)</span><input class="input xl" name="amount" inputmode="decimal" placeholder="0.00" required autofocus></label>
    <div class="field">${radioChips('dir', ['add', 'take out'], 'add')}</div>
    <label class="field"><span>change target (£)</span><input class="input" name="target" inputmode="decimal" value="${g.target}"></label>
    <div class="btnrow"><button type="button" class="btn danger" data-act="delGoal" data-id="${g.id}">delete goal</button><button class="btn">save</button></div>
  </form>`);
}

const CLASS_TYPES = ['lecture', 'seminar', 'tutorial', 'lab', 'workshop', 'other'];
function sheetClass(id, day) {
  const c = id ? S.classes.find((x) => x.id === id) : null;
  const d = c ? c.day : day ?? UI.uniDay;
  openSheet(c ? 'edit class' : 'add class', `<form data-form="class" autocomplete="off">
    <input type="hidden" name="id" value="${c ? c.id : ''}">
    <label class="field"><span>module / class</span><input class="input" name="title" required value="${esc(c ? c.title : '')}" placeholder="e.g. economics 101" list="modlist" ${c ? '' : 'autofocus'}></label>
    ${datalist('modlist', S.classes.map((x) => x.title))}
    <div class="field"><span>type</span>${radioChips('type', CLASS_TYPES, c ? c.type : 'lecture')}</div>
    <div class="field"><span>day</span><div class="chips">${DAY3.map((l, i) => `<label><input type="radio" name="day" value="${i}" ${i === d ? 'checked' : ''}><span class="chip">${l}</span></label>`).join('')}</div></div>
    <div class="grid2">
      <label class="field"><span>starts</span><input class="input" type="time" name="start" required value="${esc(c ? c.start : '09:00')}"></label>
      <label class="field"><span>ends</span><input class="input" type="time" name="end" required value="${esc(c ? c.end : '10:00')}"></label>
    </div>
    <label class="field"><span>room (optional)</span><input class="input" name="room" value="${esc(c ? c.room : '')}" placeholder="e.g. lecture theatre 2"></label>
    <div class="btnrow">${c ? `<button type="button" class="btn danger" data-act="delClass" data-id="${c.id}">delete</button>` : ''}<button class="btn">save</button></div>
  </form>`);
}

function sheetLearn(id) {
  const l = id ? S.learning.find((x) => x.id === id) : null;
  const topics = [...S.learning].sort(byDateDesc).map((x) => x.topic);
  const recentTopics = [...new Set(topics)].slice(0, 6);
  openSheet(l ? 'edit entry' : 'log learning', `<form data-form="learn" autocomplete="off">
    <input type="hidden" name="id" value="${l ? l.id : ''}">
    <label class="field"><span>what did you learn?</span><input class="input" name="topic" required value="${esc(l ? l.topic : '')}" placeholder="e.g. python, spanish, a book" list="topiclist" ${l ? '' : 'autofocus'}></label>
    ${datalist('topiclist', topics)}
    ${!l && recentTopics.length ? `<div class="chips" style="margin-top:10px">${recentTopics.map((t) => `<button type="button" class="chip" data-act="fillTopic" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
    <label class="field"><span>minutes</span><input class="input" name="mins" inputmode="numeric" required value="${l ? l.mins : ''}" placeholder="30"></label>
    <div class="chips" style="margin-top:10px">${[15, 30, 45, 60, 90, 120].map((n) => `<button type="button" class="chip" data-act="fillMins" data-n="${n}">${fmtMins(n)}</button>`).join('')}</div>
    <label class="field"><span>note (optional)</span><textarea class="input" name="note" placeholder="one thing you'll remember">${esc(l ? l.note : '')}</textarea></label>
    ${dateField(l ? l.date : '')}
    <div class="btnrow">${l ? `<button type="button" class="btn danger" data-act="delLearn" data-id="${l.id}">delete</button>` : ''}<button class="btn">save</button></div>
  </form>`);
}

function sheetHabits() {
  openSheet('habits', `
    <p class="note">these appear on your today screen. gym and calories tick themselves when you log them.</p>
    <div class="list" style="margin-top:8px">${S.habits.map((h) => `
      <div class="toggle-row">
        <div class="icon-tile" style="width:42px;height:42px;border-radius:12px">${ico(h.icon)}</div>
        <div class="main"><div class="t">${esc(h.name)}</div><div class="note">${esc(subOf(h))}${h.auto ? ' · automatic' : ''}</div></div>
        ${h.auto ? '' : `<button class="mini" data-act="delHabit" data-id="${h.id}" aria-label="delete ${esc(h.name)}">${ico('x')}</button>`}
        <button class="switch ${h.hidden ? '' : 'on'}" data-act="toggleHidden" data-id="${h.id}" role="switch" aria-checked="${!h.hidden}" aria-label="show ${esc(h.name)}"></button>
      </div>`).join('')}</div>

    <h2 style="font-size:22px;margin-top:26px">new habit</h2>
    <form data-form="habit" autocomplete="off">
      <label class="field"><span>name</span><input class="input" name="name" required placeholder="e.g. reading, water, sleep by 12"></label>
      <label class="field"><span>detail (optional)</span><input class="input" name="detail" placeholder="e.g. 20 pages, 2 litres"></label>
      <div class="field"><span>how often</span>${radioChips('kind', ['every day', 'x per week'], 'every day')}</div>
      <label class="field"><span>times per week (if weekly)</span><input class="input" name="perWeek" type="number" inputmode="numeric" min="1" max="7" value="3"></label>
      <div class="field"><span>icon</span><div class="iconpick">${HABIT_ICONS.map((n, i) => `<label><input type="radio" name="icon" value="${n}" ${i === 0 ? 'checked' : ''}><span class="ic">${ico(n)}</span></label>`).join('')}</div></div>
      <div class="btnrow"><button class="btn">add habit</button></div>
    </form>`);
}

function sheetSettings() {
  const s = S.settings;
  openSheet('settings', `<form data-form="settings" autocomplete="off">
    ${settingsFields(s)}
    <div class="field"><span>appearance</span>${radioChips('theme', ['system', 'light', 'dark'], s.theme || 'system')}</div>
    <div class="btnrow"><button class="btn">save settings</button></div>
  </form>
  <h2 style="font-size:22px;margin-top:30px">your data</h2>
  <p class="note" style="margin-top:4px">everything lives only on this phone. export a backup now and then, and save it to files or icloud drive.</p>
  <div class="btnrow">
    <button class="btn soft" data-act="exportData">${ico('share')} export backup</button>
    <label class="btn soft" style="cursor:pointer">${ico('in')} import<input id="importFile" type="file" accept="application/json,.json" hidden></label>
  </div>
  <div class="btnrow"><button class="btn danger" data-act="resetAll">erase everything</button></div>
  <h2 style="font-size:22px;margin-top:30px">install on iphone</h2>
  <p class="note" style="margin-top:4px">open this page in safari → tap the share button → “add to home screen”. it then opens full screen like a normal app and works offline.</p>`);
}

/* ---------------- actions (taps) ---------------- */
function toggleGym(k) {
  const ws = S.workouts.filter((w) => w.date === k);
  if (!ws.length) {
    S.workouts.push({ id: uid(), date: k, title: 'gym', exercises: [] });
    commit(k === todayKey() ? 'gym logged ✓' : `gym logged for ${fmtDay(k)}`);
    return;
  }
  const quick = ws.find((w) => !w.exercises.length);
  if (quick) { S.workouts = S.workouts.filter((w) => w !== quick); commit('gym unticked'); }
  else toast('you logged a full workout that day. edit it in the gym tab');
}
function toggleCheck(h, k) {
  S.checks[k] = S.checks[k] || {};
  if (S.checks[k][h.id]) delete S.checks[k][h.id]; else S.checks[k][h.id] = true;
  if (!Object.keys(S.checks[k]).length) delete S.checks[k];
  commit();
}

const ACTIONS = {
  tab: (el) => { UI.tab = el.dataset.tab; closeSheet(); render(); window.scrollTo(0, 0); },
  closeSheet,
  closeOverlay: (el, e) => { if (e.target === el) closeSheet(); },
  openQuick: sheetQuick,
  openSettings: sheetSettings,
  openHabits: sheetHabits,
  openCalories: sheetCalories,
  openWeight: sheetWeight,
  openWorkout: (el) => sheetWorkout(el.dataset.id),
  openWorkoutView: (el) => sheetWorkoutView(el.dataset.id),
  openTx: (el) => sheetTx(el.dataset.type || 'out', el.dataset.id),
  openGoal: sheetGoal,
  openGoalMove: (el) => sheetGoalMove(el.dataset.id),
  openClass: (el) => sheetClass(el.dataset.id, el.dataset.day != null ? +el.dataset.day : undefined),
  openLearn: (el) => sheetLearn(el.dataset.id),

  toggleHabit: (el) => {
    const h = findHabit(el.dataset.id) || (el.dataset.id === 'gym' ? { auto: 'gym' } : null);
    if (!h) return;
    if (h.auto === 'gym') return toggleGym(todayKey());
    if (h.auto === 'calories') return sheetCalories();
    toggleCheck(h, todayKey());
  },
  toggleDay: (el) => {
    const h = findHabit(el.dataset.id);
    if (!h) return;
    if (h.auto === 'gym') return toggleGym(el.dataset.date);
    toggleCheck(h, el.dataset.date);
  },
  month: (el) => { UI.monthOff = Math.min(0, UI.monthOff + +el.dataset.d); render(); },
  uniDay: (el) => { UI.uniDay = +el.dataset.d; render(); },

  fillKcal: (el) => { const i = $('[name=kcal]'); i.value = (num(i.value) || 0) + +el.dataset.n; },
  fillFood: (el) => { $('[name=kcal]').value = el.dataset.k; $('[name=label]').value = el.dataset.l; },
  fillMins: (el) => { $('[name=mins]').value = el.dataset.n; },
  fillTopic: (el) => { $('[name=topic]').value = el.dataset.t; $('[name=mins]').focus(); },

  addEx: () => { $('#exs').insertAdjacentHTML('beforeend', exHtml()); const n = $$('.ex-name'); n[n.length - 1].focus(); },
  rmEx: (el) => el.closest('.ex').remove(),
  addSet: (el) => {
    const sets = $('.sets', el.closest('.ex'));
    const rows = $$('.setrow', sets);
    const last = rows[rows.length - 1];
    const s = last ? { reps: $('.r', last).value, w: $('.w', last).value } : {};
    sets.insertAdjacentHTML('beforeend', setRowHtml(s, rows.length));
  },
  rmSet: (el) => {
    const sets = el.closest('.sets');
    el.closest('.setrow').remove();
    $$('.setrow', sets).forEach((r, i) => { $('.n', r).textContent = i + 1; });
  },
  copyWorkout: (el) => {
    const w = [...S.workouts].sort(byDateDesc).find((x) => x.title === el.dataset.t && x.exercises.length);
    if (!w) return;
    $('[name=title]').value = w.title;
    $('#exs').innerHTML = w.exercises.map(exHtml).join('');
    toast(`copied your last ${w.title}. adjust and save`);
  },

  delFood: (el) => {
    const k = todayKey();
    const f = (S.food[k] || []).find((x) => x.id === el.dataset.id);
    if (!f || !confirm(`remove ${f.label || 'this'} (${int(f.kcal)} kcal)?`)) return;
    S.food[k] = S.food[k].filter((x) => x !== f);
    commit('removed');
  },
  delWeight: (el) => {
    const w = S.weights.find((x) => x.id === el.dataset.id);
    if (!w || !confirm(`delete ${round1(w.w)} ${unitW()} on ${fmtDay(w.date)}?`)) return;
    S.weights = S.weights.filter((x) => x !== w); commit('deleted');
  },
  delWorkout: (el) => {
    if (!confirm('delete this workout?')) return;
    S.workouts = S.workouts.filter((x) => x.id !== el.dataset.id); closeSheet(); commit('workout deleted');
  },
  delTx: (el) => {
    if (!confirm('delete this transaction?')) return;
    S.tx = S.tx.filter((x) => x.id !== el.dataset.id); closeSheet(); commit('deleted');
  },
  delGoal: (el) => {
    if (!confirm('delete this goal?')) return;
    S.goals = S.goals.filter((x) => x.id !== el.dataset.id); closeSheet(); commit('goal deleted');
  },
  delClass: (el) => {
    if (!confirm('delete this class?')) return;
    S.classes = S.classes.filter((x) => x.id !== el.dataset.id); closeSheet(); commit('class deleted');
  },
  delLearn: (el) => {
    if (!confirm('delete this entry?')) return;
    S.learning = S.learning.filter((x) => x.id !== el.dataset.id); closeSheet(); commit('deleted');
  },
  delHabit: (el) => {
    const h = findHabit(el.dataset.id);
    if (!h || !confirm(`delete “${h.name}” and its history?`)) return;
    S.habits = S.habits.filter((x) => x !== h);
    Object.values(S.checks).forEach((c) => delete c[h.id]);
    save(); render(); sheetHabits();
  },
  toggleHidden: (el) => {
    const h = findHabit(el.dataset.id); if (!h) return;
    h.hidden = !h.hidden; save(); render(); sheetHabits();
  },

  exportData: async () => {
    const json = JSON.stringify(S, null, 2);
    const name = `keel-backup-${todayKey()}.json`;
    const file = new File([json], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
    } catch (e) { if (e.name === 'AbortError') return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  },
  resetAll: () => {
    if (!confirm('erase all your data on this phone? this cannot be undone.')) return;
    if (!confirm('really sure? export a backup first if you might want it.')) return;
    S = defaultState(); closeSheet(); UI.tab = 'today'; commit('everything erased');
  }
};

/* ---------------- forms ---------------- */
function readSettings(fd, s) {
  const gym = Math.round(num(fd.get('gymPerWeek')));
  const kcal = Math.round(num(fd.get('calorieTarget')));
  if (!(gym >= 1 && gym <= 7)) { toast('gym days must be 1–7'); return false; }
  if (!(kcal > 0)) { toast('enter a daily calorie target'); return false; }
  const sw = num(fd.get('startWeight')), gw = num(fd.get('goalWeight'));
  s.name = String(fd.get('name') || '').trim();
  s.gymPerWeek = gym;
  s.calorieTarget = kcal;
  s.unit = fd.get('unit') === 'lb' ? 'lb' : 'kg';
  s.startWeight = Number.isFinite(sw) ? sw : null;
  s.goalWeight = Number.isFinite(gw) ? gw : null;
  return true;
}
const FORMS = {
  setup: (f, fd) => {
    const s = S.settings;
    if (!readSettings(fd, s)) return;
    if (s.startWeight != null) S.weights.push({ id: uid(), date: todayKey(), w: s.startWeight });
    s.setupDone = true;
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* optional */ }
    commit(`welcome${s.name ? ', ' + s.name.toLowerCase() : ''} ✓`);
  },
  settings: (f, fd) => {
    if (!readSettings(fd, S.settings)) return;
    S.settings.theme = fd.get('theme') || 'system';
    closeSheet(); commit('settings saved');
  },
  calories: (f, fd) => {
    const kcal = Math.round(num(fd.get('kcal')));
    if (!(kcal > 0)) return toast('enter calories');
    const k = todayKey();
    const before = kcalOn(k);
    (S.food[k] = S.food[k] || []).push({ id: uid(), kcal, label: String(fd.get('label') || '').trim() });
    closeSheet();
    const t = S.settings.calorieTarget;
    commit(before < t && kcalOn(k) >= t ? 'calorie target hit ✓' : `+${int(kcal)} kcal`);
  },
  weight: (f, fd) => {
    const w = num(fd.get('w'));
    if (!(w > 0)) return toast('enter your weight');
    const date = fd.get('date') || todayKey();
    S.weights = S.weights.filter((x) => x.date !== date);
    S.weights.push({ id: uid(), date, w: round1(w) });
    closeSheet(); commit('weight logged');
  },
  workout: (f, fd) => {
    const exercises = $$('.ex', f).map((ex) => ({
      name: $('.ex-name', ex).value.trim(),
      sets: $$('.setrow', ex).map((r) => ({ reps: Math.round(num($('.r', r).value)), w: num($('.w', r).value) }))
        .filter((s) => Number.isFinite(s.reps) || Number.isFinite(s.w))
        .map((s) => ({ reps: Number.isFinite(s.reps) ? s.reps : null, w: Number.isFinite(s.w) ? s.w : 0 }))
    })).filter((e) => e.name);
    const id = fd.get('id');
    const rec = { id: id || uid(), date: fd.get('date') || todayKey(), title: String(fd.get('title') || '').trim() || 'gym', exercises };
    if (id) S.workouts = S.workouts.map((w) => (w.id === id ? rec : w));
    else {
      // replace a quick "went today" tick on the same day with the full workout
      const quick = S.workouts.find((w) => w.date === rec.date && !w.exercises.length);
      if (quick) S.workouts = S.workouts.filter((w) => w !== quick);
      S.workouts.push(rec);
    }
    closeSheet(); commit('workout saved 💪');
  },
  tx: (f, fd) => {
    const amount = num(fd.get('amount'));
    if (!(amount > 0)) return toast('enter an amount');
    const id = fd.get('id');
    const rec = { id: id || uid(), date: fd.get('date') || todayKey(), type: fd.get('type') === 'in' ? 'in' : 'out', amount: Math.round(amount * 100) / 100, cat: fd.get('cat') || 'other', note: String(fd.get('note') || '').trim() };
    if (id) S.tx = S.tx.map((t) => (t.id === id ? rec : t)); else S.tx.push(rec);
    closeSheet(); commit(rec.type === 'in' ? `+${money(rec.amount)}` : `−${money(rec.amount)}`);
  },
  goal: (f, fd) => {
    const target = num(fd.get('target'));
    if (!(target > 0)) return toast('enter a target');
    const saved = num(fd.get('saved'));
    S.goals.push({ id: uid(), name: String(fd.get('name')).trim(), target, saved: Number.isFinite(saved) ? saved : 0 });
    closeSheet(); commit('goal created');
  },
  goalMove: (f, fd) => {
    const g = S.goals.find((x) => x.id === fd.get('id'));
    if (!g) return;
    const a = num(fd.get('amount'));
    const t = num(fd.get('target'));
    if (Number.isFinite(t) && t > 0) g.target = t;
    if (Number.isFinite(a) && a > 0) g.saved = Math.max(0, Math.round((g.saved + (fd.get('dir') === 'take out' ? -a : a)) * 100) / 100);
    closeSheet(); commit(g.saved >= g.target ? `${g.name}: goal reached 🎉` : 'goal updated');
  },
  class: (f, fd) => {
    const start = fd.get('start'), end = fd.get('end');
    if (end <= start) return toast('end time must be after start');
    const id = fd.get('id');
    const rec = { id: id || uid(), title: String(fd.get('title')).trim(), type: fd.get('type') || '', day: +fd.get('day'), start, end, room: String(fd.get('room') || '').trim() };
    if (id) S.classes = S.classes.map((c) => (c.id === id ? rec : c)); else S.classes.push(rec);
    UI.uniDay = rec.day;
    closeSheet(); commit('timetable updated');
  },
  learn: (f, fd) => {
    const mins = Math.round(num(fd.get('mins')));
    if (!(mins > 0)) return toast('enter minutes');
    const id = fd.get('id');
    const rec = { id: id || uid(), date: fd.get('date') || todayKey(), topic: String(fd.get('topic')).trim(), mins, note: String(fd.get('note') || '').trim() };
    if (id) S.learning = S.learning.map((l) => (l.id === id ? rec : l)); else S.learning.push(rec);
    closeSheet(); commit(`${fmtMins(mins)} of ${rec.topic} logged`);
  },
  habit: (f, fd) => {
    const name = String(fd.get('name') || '').trim();
    if (!name) return;
    const weekly = fd.get('kind') === 'x per week';
    const per = Math.min(7, Math.max(1, Math.round(num(fd.get('perWeek')) || 3)));
    S.habits.push({ id: uid(), name: name.toLowerCase(), detail: String(fd.get('detail') || '').trim(), icon: fd.get('icon') || 'star', kind: weekly ? 'weekly' : 'daily', perWeek: weekly ? per : undefined });
    save(); render(); sheetHabits(); toast('habit added');
  }
};

/* ---------------- wiring ---------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const fn = FORMS[f.dataset.form];
  if (fn) fn(f, new FormData(f));
});
document.addEventListener('change', (e) => {
  if (e.target.id !== 'importFile') return;
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data || typeof data !== 'object' || !data.settings || !Array.isArray(data.habits)) throw new Error('bad');
      if (!confirm('replace everything on this phone with this backup?')) return;
      S = migrate(data); closeSheet(); commit('backup restored ✓');
    } catch (err) { toast('that file is not a keel backup'); }
  };
  r.readAsText(file);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

// re-draw when coming back to the app (the day may have changed)
let lastDay = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== lastDay) { lastDay = todayKey(); UI.uniDay = dayIdx(today()); render(); }
});

let toastTimer;
function toast(m) {
  const t = $('#toast');
  t.textContent = m; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

render();
