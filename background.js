// SpeedGeek background. Keeps each tab's speed, passes speed changes to every frame in the tab, remembers
// speeds per site, shows the speed on the icon, and adds the page script to every site only if you allowed it.
if (typeof importScripts === 'function' && !globalThis.SG) importScripts('defaults.js');
const B = globalThis.browser || chrome;
const ALL = ['http://*/*', 'https://*/*'];
const SCRIPT_ID = 'speedgeek';
const PAGE_FILES = ['defaults.js', 'content.js'];

const getCfg = async () => SG.cfg((await B.storage.local.get('cfg')).cfg);
const hasAccess = () => B.permissions.contains({ origins: ALL });
const tabKey = (id) => 't:' + id;
const getTab = async (id) => (await B.storage.session.get(tabKey(id)))[tabKey(id)] || null;
const setTab = (id, v) => B.storage.session.set({ [tabKey(id)]: v });
const hostOf = (u) => { try { const x = new URL(u); return /^(https?|file):$/.test(x.protocol) ? x.hostname : ''; } catch { return ''; } };

// ---- the page script on every site (only when allowed) ----
let syncing = Promise.resolve();
function syncScripts() { return (syncing = syncing.then(syncNow, syncNow)); }
async function syncNow() {
  const cfg = await getCfg();
  const want = cfg.mode === 'auto' && await hasAccess();
  let have = [];
  try { have = await B.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] }); } catch {}
  if (want && !have.length) {
    const base = { id: SCRIPT_ID, js: PAGE_FILES, matches: ALL, allFrames: true, runAt: 'document_start' };
    try { await B.scripting.registerContentScripts([{ ...base, matchOriginAsFallback: true }]); }
    catch { await B.scripting.registerContentScripts([base]).catch(() => {}); }
    // add it to tabs that are already open, so you do not have to reload them
    for (const t of await B.tabs.query({})) {
      if (/^https?:/.test(t.url || '')) B.scripting.executeScript({ target: { tabId: t.id, allFrames: true }, files: PAGE_FILES }).catch(() => {});
    }
  } else if (!want && have.length) {
    await B.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] }).catch(() => {});
  }
  return want;
}

// ---- icon badge ----
function badge(tabId, speed) {
  if (tabId == null || tabId < 0) return;
  let t = '';
  if (Math.abs(speed - 1) > 0.001) t = speed < 1 ? String(speed).replace(/^0/, '') : String(speed).slice(0, 4);
  B.action.setBadgeText({ tabId, text: t }).catch(() => {});
  B.action.setBadgeBackgroundColor({ tabId, color: '#059669' }).catch(() => {});
  if (B.action.setBadgeTextColor) B.action.setBadgeTextColor({ tabId, color: '#ffffff' }).catch(() => {});
}

// ---- speed changes ----
async function setSpeed(tabId, speed, src, url) {
  speed = SG.clamp(speed);
  const st = (await getTab(tabId)) || { host: hostOf(url || ''), speed: 1 };
  if (!st.host && url) st.host = hostOf(url);
  st.speed = speed; st.media = st.media || false;
  await setTab(tabId, st);
  badge(tabId, speed);
  const cfg = await getCfg();
  if (cfg.remember && src !== 'page' && st.host) {
    const h = SG.bare(st.host), { sites = {} } = await B.storage.local.get('sites');
    if (speed === 1) delete sites[h]; else sites[h] = speed;
    await B.storage.local.set({ sites });
  }
  await B.tabs.sendMessage(tabId, { type: 'apply', speed, src }).catch(() => {});
  return speed;
}

B.runtime.onMessage.addListener((m, sender, reply) => {
  // the popup names the tab it is about (it can also be open in a tab of its own, for tests and the demo)
  const tab = m.tabId ? null : sender.tab, tabId = m.tabId || (tab && tab.id);
  (async () => {
    if (m.type === 'hello') {
      // A new page in the tab starts from the remembered speed for the site; frames inside it follow the page.
      const host = hostOf(tab && tab.url) || m.host || '';
      if (m.top) {
        const cfg = await getCfg(), { sites = {} } = await B.storage.local.get('sites');
        const speed = cfg.remember && sites[SG.bare(host)] ? SG.clamp(sites[SG.bare(host)]) : 1;
        await setTab(tabId, { host, speed, media: false });
        if (!SG.excluded(host, cfg.excluded)) badge(tabId, speed); else badge(tabId, 1);
        return { host, speed };
      }
      const st = await getTab(tabId);
      if (st && st.host === host) return { host, speed: st.speed, tabMedia: st.media };
      const cfg = await getCfg(), { sites = {} } = await B.storage.local.get('sites');
      return { host, speed: cfg.remember && sites[SG.bare(host)] ? SG.clamp(sites[SG.bare(host)]) : (st ? st.speed : 1) };
    }
    if (m.type === 'speed') return { speed: await setSpeed(tabId, m.speed, m.src, tab ? tab.url : m.url) };
    if (m.type === 'media') {
      // a frame found a video or audio: let the top page know, so its keys work for a video inside a frame
      const st = await getTab(tabId);
      if (st && !st.media) { st.media = true; await setTab(tabId, st); }
      if (sender.frameId) B.tabs.sendMessage(tabId, { type: 'tabMedia' }, { frameId: 0 }).catch(() => {});
      return true;
    }
    if (m.type === 'relay') { await B.tabs.sendMessage(tabId, m.msg).catch(() => {}); return true; }
    if (m.type === 'sync') return { on: await syncScripts() };
    return null;
  })().then(reply, () => reply(null));
  return true;
});

B.tabs.onRemoved.addListener((id) => { B.storage.session.remove(tabKey(id)).catch(() => {}); });
B.permissions.onAdded.addListener(syncScripts);
B.permissions.onRemoved.addListener(syncScripts);
B.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch.cfg && (!ch.cfg.oldValue || ch.cfg.oldValue.mode !== (ch.cfg.newValue || {}).mode)) syncScripts();
});
B.runtime.onInstalled.addListener(async (d) => {
  if (d.reason === 'install') {
    if (!(await B.storage.local.get('cfg')).cfg) await B.storage.local.set({ cfg: SG.cfg() });
    if (!(await hasAccess())) B.tabs.create({ url: B.runtime.getURL('options.html#welcome') });
  }
  syncScripts();
});
B.runtime.onStartup.addListener(syncScripts);
syncScripts();
