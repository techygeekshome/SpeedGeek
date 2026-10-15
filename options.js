const $ = (id) => document.getElementById(id);
const B = globalThis.browser || chrome;
const ALL = ['http://*/*', 'https://*/*'];
const NAMES = { slower: 'Slower', faster: 'Faster', reset: 'Back to 1×', preferred: 'Preferred speed', back: 'Back a few seconds', forward: 'Forward a few seconds', box: 'Hide or show the speed box' };
let cfg = SG.cfg(), waiting = null;

function el(tag, cls, kid) {
  const e = document.createElement(tag); if (cls) e.className = cls;
  if (kid != null) e.append(kid);
  return e;
}
const save = () => B.storage.local.set({ cfg });
const label = (k) => k === ' ' ? 'Space' : k ? (k.length === 1 ? k.toUpperCase() : k) : 'None';

async function load() {
  cfg = SG.cfg((await B.storage.local.get('cfg')).cfg);
  if (location.hash === '#welcome') { $('where').classList.add('welcome'); $('welcomeText').hidden = false; $('whereTitle').textContent = 'Welcome to SpeedGeek'; }
  await showAccess();
  keys();
  for (const id of ['step', 'seek', 'preferred']) $(id).value = cfg[id];
  for (const id of ['remember', 'force', 'overlay']) $(id).checked = cfg[id];
  $('excluded').value = cfg.excluded.join('\n');
  await sites();
}

async function showAccess() {
  const access = await B.permissions.contains({ origins: ALL });
  for (const r of document.querySelectorAll('input[name=mode]')) r.checked = r.value === cfg.mode;
  $('cAuto').classList.toggle('on', cfg.mode === 'auto'); $('cClick').classList.toggle('on', cfg.mode === 'click');
  const p = $('access');
  if (cfg.mode === 'auto' && access) { p.textContent = 'Working on every site'; p.className = 'pill'; $('grant').hidden = true; }
  else if (cfg.mode === 'auto') { p.textContent = 'Not allowed yet: works only when you click the icon'; p.className = 'pill bad'; $('grant').hidden = false; }
  else { p.textContent = access ? 'Only when you click the icon (site access will be removed)' : 'Only when you click the icon'; p.className = 'pill'; $('grant').hidden = true; }
}

for (const r of document.querySelectorAll('input[name=mode]')) r.onchange = async () => {
  cfg.mode = r.value;
  if (cfg.mode === 'auto') {
    // must be asked straight from the click
    const ok = await B.permissions.request({ origins: ALL }).catch(() => false);
    if (!ok) { await save(); return showAccess(); }
  } else {
    await B.permissions.remove({ origins: ALL }).catch(() => false);
  }
  await save();
  await B.runtime.sendMessage({ type: 'sync' }).catch(() => {});
  showAccess();
};
$('grant').onclick = async () => {
  const ok = await B.permissions.request({ origins: ALL }).catch(() => false);
  if (ok) { cfg.mode = 'auto'; await save(); await B.runtime.sendMessage({ type: 'sync' }).catch(() => {}); }
  showAccess();
};

function keys() {
  const tb = $('keys').querySelector('tbody'); tb.textContent = '';
  for (const a of Object.keys(NAMES)) {
    const tr = document.createElement('tr');
    const k = el('button', 'key', label(cfg.keys[a])); k.dataset.a = a;
    const c = el('button', 'link', 'Turn off'); c.dataset.clear = a;
    tr.append(el('td', '', NAMES[a]), el('td', '', k), el('td', '', c));
    tb.append(tr);
  }
}
$('keys').addEventListener('click', async (e) => {
  const k = e.target.closest('button.key'), c = e.target.closest('button[data-clear]');
  if (c) { cfg.keys[c.dataset.clear] = ''; await save(); keys(); return; }
  if (!k) return;
  keys();
  waiting = k.dataset.a;
  const b = $('keys').querySelector(`button.key[data-a="${waiting}"]`); b.textContent = 'Press a key'; b.classList.add('wait');
});
addEventListener('keydown', async (e) => {
  if (!waiting) return;
  e.preventDefault();
  if (e.key === 'Escape') { waiting = null; keys(); return; }
  if (e.ctrlKey || e.altKey || e.metaKey || ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  // one key, one job
  for (const a of Object.keys(cfg.keys)) if (cfg.keys[a] === k) cfg.keys[a] = '';
  cfg.keys[waiting] = k; waiting = null;
  await save(); keys();
});

for (const id of ['step', 'seek', 'preferred']) $(id).onchange = () => {
  let v = Number($(id).value);
  if (id === 'step') v = Math.min(4, Math.max(0.05, Math.round(v * 100) / 100 || 0.1));
  if (id === 'seek') v = Math.min(600, Math.max(1, Math.round(v) || 10));
  if (id === 'preferred') v = SG.clamp(v || 1.8);
  cfg[id] = v; $(id).value = v; save();
};
for (const id of ['remember', 'force', 'overlay']) $(id).onchange = () => { cfg[id] = $(id).checked; save(); };
$('saveEx').onclick = async () => {
  cfg.excluded = [...new Set($('excluded').value.split(/[\s,]+/).map(SG.cleanHost).filter(Boolean))];
  $('excluded').value = cfg.excluded.join('\n');
  await save();
  $('savedEx').classList.add('show'); setTimeout(() => $('savedEx').classList.remove('show'), 1500);
};

async function sites() {
  const saved = (await B.storage.local.get('sites')).sites || {};
  const tb = $('sites').querySelector('tbody'); tb.textContent = '';
  const list = Object.keys(saved).sort();
  $('noSites').hidden = list.length > 0;
  for (const h of list) {
    const tr = document.createElement('tr');
    const f = el('button', 'link', 'Forget'), td = el('td', '', f); td.style.textAlign = 'right';
    tr.append(el('td', '', h), el('td', '', SG.fmt(saved[h])), td);
    f.onclick = async () => { const s = (await B.storage.local.get('sites')).sites || {}; delete s[h]; await B.storage.local.set({ sites: s }); sites(); };
    tb.append(tr);
  }
}
B.storage.onChanged.addListener((ch, area) => {
  if (area !== 'local') return;
  if (ch.sites) sites();
  // settings changed somewhere else (the popup, or another options tab): show them
  if (ch.cfg && JSON.stringify(SG.cfg(ch.cfg.newValue)) !== JSON.stringify(cfg)) {
    cfg = SG.cfg(ch.cfg.newValue);
    if (!waiting) keys();
    for (const id of ['step', 'seek', 'preferred']) if (document.activeElement !== $(id)) $(id).value = cfg[id];
    for (const id of ['remember', 'force', 'overlay']) $(id).checked = cfg[id];
    if (document.activeElement !== $('excluded')) $('excluded').value = cfg.excluded.join('\n');
    showAccess();
  }
});
addEventListener('hashchange', load);
load();
