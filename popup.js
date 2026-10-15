const $ = (id) => document.getElementById(id);
const B = globalThis.browser || chrome;
const ALL = ['http://*/*', 'https://*/*'];
// "?tab=<id>" lets the popup be opened in a normal tab for testing and demo recordings. It only picks which tab to show.
const forced = Number(new URLSearchParams(location.search).get('tab')) || 0;
let tab, host = '', cfg = SG.cfg(), speed = 1, web = false;

const LOG = Math.log(SG.MAX / SG.MIN);
const toPos = (s) => Math.round(Math.log(s / SG.MIN) / LOG * 1000);
function fromPos(p) {
  const s = SG.MIN * Math.exp(LOG * p / 1000), step = s < 4 ? 0.05 : 0.25;
  return SG.clamp(Math.round(s / step) * step);
}

async function init() {
  tab = forced ? await B.tabs.get(forced) : (await B.tabs.query({ active: true, currentWindow: true }))[0];
  try { const u = new URL(tab.url || ''); if (/^https?:$/.test(u.protocol)) { web = true; host = u.hostname; } } catch {}
  $('host').textContent = host || tab.title || 'This tab';
  cfg = SG.cfg((await B.storage.local.get('cfg')).cfg);
  for (const q of SG.QUICK) {
    const b = document.createElement('button'); b.textContent = q + '×'; b.dataset.s = q;
    b.onclick = () => set(q); $('quick').append(b);
  }
  // scale labels sit under the right place on the slider
  const lab = $('slider').parentNode.querySelectorAll('.scale span');
  [0.1, 1, 4, 16].forEach((s, i) => { lab[i].style.left = (toPos(s) / 10) + '%'; });
  const k = cfg.keys, up = (x) => (x || '').toUpperCase();
  const kb = (x) => { const b = document.createElement('b'); b.textContent = up(x); return b; };
  for (const [a, t] of [['slower', ' slower '], ['faster', ' faster '], ['reset', ' 1\u00d7 '], ['preferred', ' ' + SG.fmt(cfg.preferred) + ' '], ['back', '/'], ['forward', ' ' + cfg.seek + ' s']]) {
    if (k[a]) $('keys').append(kb(k[a]), t);
  }
  $('offHere').checked = SG.excluded(host, cfg.excluded);
  $('offHere').disabled = !web;
  if (!web) {
    for (const id of ['minus', 'plus', 'slider']) $(id).disabled = true;
    for (const b of document.querySelectorAll('#quick button')) b.disabled = true;
    $('status').textContent = 'SpeedGeek cannot work on this page. Browsers keep their own pages, like settings and the add-on store, off limits.';
    render(); return;
  }
  const access = await B.permissions.contains({ origins: ALL });
  if (cfg.mode === 'click' || !access) {
    $('accessBox').hidden = false;
    if (cfg.mode === 'click') { $('accessText').textContent = 'Click mode: SpeedGeek works on this tab now, and its keys work until the page reloads.'; $('allow').hidden = true; }
  }
  // Add the page script to this tab (the click on the icon allows it), unless it is already there.
  try { await B.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['defaults.js', 'content.js'] }); } catch {}
  await refresh();
  setInterval(refresh, 1000);
}

async function refresh() {
  let res = [];
  try { res = await B.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: () => window.__speedGeek ? window.__speedGeek.info() : null }); } catch {}
  const infos = res.map((r) => r && r.result).filter(Boolean);
  const topInfo = (res.find((r) => r.frameId === 0) || {}).result || infos[0];
  if (!infos.length) { $('status').textContent = 'SpeedGeek could not reach this page. Try reloading it.'; render(); return; }
  if (topInfo) speed = topInfo.speed;
  const n = infos.reduce((a, i) => a + i.media, 0);
  const off = infos.some((i) => i.off);
  $('status').textContent = off ? 'Turned off on this site.'
    : n ? `${n} ${n === 1 ? 'video or audio' : 'videos or audio'} on this page.`
    : 'No video or audio on this page yet. SpeedGeek will pick it up when it appears.';
  render();
}

function render() {
  $('speed').textContent = SG.fmt(speed);
  if (document.activeElement !== $('slider')) $('slider').value = toPos(speed);
  for (const b of document.querySelectorAll('#quick button')) b.classList.toggle('on', Math.abs(Number(b.dataset.s) - speed) < 0.001);
}

async function set(s) {
  speed = SG.clamp(s); render();
  const r = await B.runtime.sendMessage({ type: 'speed', tabId: tab.id, url: tab.url, speed, src: 'popup' });
  if (r && r.speed) { speed = r.speed; render(); }
}

$('minus').onclick = () => set(speed - cfg.step);
$('plus').onclick = () => set(speed + cfg.step);
$('slider').oninput = () => { speed = fromPos(Number($('slider').value)); $('speed').textContent = SG.fmt(speed); };
$('slider').onchange = () => set(fromPos(Number($('slider').value)));
$('offHere').onchange = async () => {
  cfg = SG.cfg((await B.storage.local.get('cfg')).cfg);
  const h = SG.bare(host);
  cfg.excluded = cfg.excluded.filter((e) => !SG.excluded(host, [e]));
  if ($('offHere').checked) cfg.excluded.push(h);
  await B.storage.local.set({ cfg });
  setTimeout(refresh, 200);
};
$('allow').onclick = async () => {
  const ok = await B.permissions.request({ origins: ALL }).catch(() => false);
  if (ok) {
    cfg = SG.cfg((await B.storage.local.get('cfg')).cfg); cfg.mode = 'auto'; await B.storage.local.set({ cfg });
    await B.runtime.sendMessage({ type: 'sync' });
    $('accessBox').hidden = true;
  }
};
init();
