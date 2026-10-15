// SpeedGeek page script. It only looks for <video> and <audio>, sets their speed, listens for your speed keys
// and draws the small speed box. It reads nothing else on the page and sends nothing anywhere.
(() => {
  if (window.__speedGeek) return;
  const B = globalThis.browser || chrome;
  const S = { speed: 1, ready: false, off: false, hidden: false, tabMedia: false, host: '', cfg: SG.cfg() };
  const media = new Map();          // element -> { box, fixes, fixT }
  const roots = new WeakSet();
  let readyResolve; const readyP = new Promise((r) => { readyResolve = r; });
  const send = (m) => { try { return B.runtime.sendMessage(m).catch(() => {}); } catch { return Promise.resolve(); } };
  const isMedia = (n) => n instanceof HTMLMediaElement;

  // ---- finding media (also inside open shadow roots and in elements added later) ----
  function add(el) {
    if (media.has(el)) return;
    const rec = { box: null, fixes: 0, fixT: 0 };
    media.set(el, rec);
    for (const ev of ['ratechange', 'play', 'loadedmetadata', 'playing']) el.addEventListener(ev, onMediaEvent, true);
    if (media.size === 1) send({ type: 'media' });
    if (S.ready && !S.off) { apply(el); box(el); if (S.speed !== 1) flash(); }
  }
  function scan(root) {
    for (const el of root.querySelectorAll('video, audio')) add(el);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let n = w.currentNode; n; n = w.nextNode()) {
      if (n.shadowRoot && !roots.has(n.shadowRoot)) { roots.add(n.shadowRoot); watch(n.shadowRoot); }
      if (n.shadowRoot) scan(n.shadowRoot);
    }
  }
  let scanT = 0;
  const later = () => { if (!scanT) scanT = setTimeout(() => { scanT = 0; scan(document); }, 250); };
  function watch(root) {
    new MutationObserver((list) => {
      for (const m of list) for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (isMedia(n)) add(n);
        else if (n.firstElementChild || n.shadowRoot) { later(); return; }
      }
    }).observe(root, { childList: true, subtree: true });
  }
  // media events do not bubble, but a capturing listener on the document still hears them (light DOM only)
  for (const ev of ['loadedmetadata', 'play', 'ratechange']) document.addEventListener(ev, (e) => { if (isMedia(e.target)) add(e.target); }, true);

  // ---- speed ----
  function apply(el) {
    if (Math.abs(el.playbackRate - S.speed) > 0.001) { try { el.playbackRate = S.speed; } catch {} }
  }
  function onMediaEvent(e) {
    const el = e.currentTarget;
    if (!S.ready || S.off) return;
    if (e.type === 'play' || e.type === 'playing') S.last = el;
    if (e.type !== 'ratechange') { apply(el); return; }
    const r = el.playbackRate;
    if (Math.abs(r - S.speed) < 0.001) return;
    const rec = media.get(el);
    if (S.cfg.force && S.speed !== 1) {
      // the site changed the speed: put it back, unless it keeps fighting many times a second
      // (if it fights back over 100 times a second, slow down to 20 fixes a second so the page stays smooth)
      const now = Date.now();
      if (now - rec.fixT > 1000) { rec.fixT = now; rec.fixes = 0; }
      S.fixed = (S.fixed || 0) + 1;
      if (++rec.fixes <= 100) apply(el);
      else if (!rec.later) rec.later = setTimeout(() => { rec.later = 0; if (!S.off) apply(el); }, 50);
      return;
    }
    // follow the site's change (for example its own speed menu)
    setSpeed(r, 'page');
  }
  function setSpeed(s, src) { s = SG.clamp(s); S.speed = s; applyAll(); flash(); send({ type: 'speed', speed: s, src }); }
  function applyAll() { for (const el of media.keys()) apply(el); }
  function seek(d) {
    let list = [...media.keys()].filter((el) => el.isConnected && !el.paused && !el.ended);
    if (!list.length && S.last && S.last.isConnected) list = [S.last];
    if (!list.length) list = [...media.keys()].filter((el) => el.isConnected).sort((a, b) => area(b) - area(a)).slice(0, 1);
    for (const el of list) {
      const t = el.currentTime + d, end = isFinite(el.duration) ? el.duration : t;
      el.currentTime = Math.max(0, Math.min(end, t));
    }
    flash(d < 0 ? '« ' + Math.abs(d) + ' s' : '» ' + d + ' s');
    return list.length;
  }
  const area = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height; };

  // ---- keys ----
  function editable(t) {
    if (!t || t.nodeType !== 1) return false;
    if (t.isContentEditable) return true;
    const n = t.tagName;
    return n === 'INPUT' || n === 'TEXTAREA' || n === 'SELECT';
  }
  addEventListener('keydown', (e) => {
    if (!S.ready || S.off || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (!media.size && !S.tabMedia) { scan(document); if (!media.size) return; }
    const t = (e.composedPath && e.composedPath()[0]) || e.target;
    if (editable(t) || editable(document.activeElement)) return;
    const k = (e.key || '').toLowerCase(), K = S.cfg.keys;
    const act = Object.keys(K).find((a) => K[a] && K[a] === k);
    if (!act) return;
    e.preventDefault(); e.stopImmediatePropagation();
    run(act);
  }, true);
  function run(act) {
    const c = S.cfg;
    if (act === 'slower') setSpeed(S.speed - c.step, 'key');
    else if (act === 'faster') setSpeed(S.speed + c.step, 'key');
    else if (act === 'reset') setSpeed(1, 'key');
    else if (act === 'preferred') setSpeed(Math.abs(S.speed - c.preferred) < 0.001 ? 1 : c.preferred, 'key');
    else if (act === 'back' || act === 'forward') {
      const d = act === 'back' ? -c.seek : c.seek;
      if (!seek(d)) send({ type: 'relay', msg: { type: 'seek', d } });   // the video is in a frame
    } else if (act === 'box') { S.hidden = !S.hidden; for (const [el] of media) box(el); }
  }

  // ---- speed box ----
  const CSS = `:host{all:initial}.b{position:absolute;left:0;top:0;display:flex;align-items:center;gap:2px;padding:4px 5px;border-radius:8px;
    background:rgba(17,17,24,.78);color:#fff;font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;opacity:0;transition:opacity .4s;
    pointer-events:auto;user-select:none;cursor:move;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3)}
    .b.show,.b:hover{opacity:1;transition:opacity .1s}.b.dim{opacity:.55}.v{padding:3px 5px;min-width:38px;text-align:center}
    button{all:unset;display:none;cursor:pointer;padding:3px 6px;border-radius:5px;font:inherit;color:#fff}.b:hover button{display:inline-block}
    button:hover{background:#059669}`;
  function box(el) {
    const rec = media.get(el); if (!rec) return;
    const want = S.ready && !S.off && S.cfg.overlay && !S.hidden && el.isConnected && (el.tagName === 'VIDEO' || el.controls);
    if (!want) { if (rec.box) { rec.box.host.remove(); rec.box.ro.disconnect(); rec.box = null; } return; }
    if (rec.box) { if (!rec.box.host.isConnected && el.parentNode) el.parentNode.insertBefore(rec.box.host, el); place(el); return; }
    if (!el.parentNode) return;
    const host = document.createElement('speedgeek-box');
    host.style.cssText = 'position:absolute!important;z-index:2147483646!important;margin:0!important;padding:0!important;width:0!important;height:0!important;display:block!important;border:0!important;pointer-events:none!important';
    const sh = host.attachShadow({ mode: 'open' });
    const st = document.createElement('style'); st.textContent = CSS;
    const b = document.createElement('div'); b.className = 'b';
    for (const [a, t, title] of [['back', '\u00ab', 'Back'], ['slower', '\u2212', 'Slower'], ['', '', ''], ['faster', '+', 'Faster'], ['forward', '\u00bb', 'Forward'], ['box', '\u00d7', 'Hide']]) {
      const x = document.createElement(a ? 'button' : 'span');
      if (a) { x.dataset.a = a; x.title = title; x.textContent = t; } else x.className = 'v';
      b.append(x);
    }
    sh.append(st, b);
    rec.box = { host, b, v: sh.querySelector('.v'), dx: 8, dy: 8, ro: new ResizeObserver(() => place(el)), t: 0 };
    rec.box.ro.observe(el);
    el.parentNode.insertBefore(host, el);
    // clicks on the box must not reach the player (which would pause it)
    for (const ev of ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerup', 'touchstart']) b.addEventListener(ev, (e) => e.stopPropagation());
    b.addEventListener('click', (e) => { const a = e.target.closest('button'); if (a) run(a.dataset.a); });
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (e.target.closest('button')) return;
      const x0 = e.clientX, y0 = e.clientY, dx = rec.box.dx, dy = rec.box.dy;
      b.setPointerCapture(e.pointerId);
      const mv = (m) => { rec.box.dx = dx + m.clientX - x0; rec.box.dy = dy + m.clientY - y0; place(el); };
      const up = () => { b.removeEventListener('pointermove', mv); b.removeEventListener('pointerup', up); };
      b.addEventListener('pointermove', mv); b.addEventListener('pointerup', up);
    });
    // a faint box while the mouse is over the player
    if (!rec.mm) rec.mm = el.parentNode.addEventListener('mousemove', () => { if (rec.box && !rec.box.b.classList.contains('show')) { rec.box.b.classList.add('dim'); clearTimeout(rec.box.dt); rec.box.dt = setTimeout(() => rec.box && rec.box.b.classList.remove('dim'), 1500); } }) || 1;
    place(el); paint(el);
  }
  function place(el) {
    const rec = media.get(el); if (!rec || !rec.box) return;
    rec.box.host.style.setProperty('left', el.offsetLeft + rec.box.dx + 'px', 'important');
    rec.box.host.style.setProperty('top', el.offsetTop + rec.box.dy + 'px', 'important');
  }
  function paint(el, text) { const rec = media.get(el); if (rec && rec.box) rec.box.v.textContent = text || SG.fmt(S.speed); }
  function flash(text) {
    for (const [el, rec] of media) {
      box(el); if (!rec.box) continue;
      paint(el, text); place(el);
      const b = rec.box.b; b.classList.add('show'); clearTimeout(rec.box.t);
      rec.box.t = setTimeout(() => { b.classList.remove('show'); paint(el); }, 1600);
    }
  }

  // ---- start up and messages ----
  async function start() {
    const [r, st] = await Promise.all([send({ type: 'hello', top: window === top, host: location.hostname }), B.storage.local.get('cfg')]);
    S.cfg = SG.cfg(st.cfg);
    S.host = (r && r.host) || location.hostname;
    S.off = SG.excluded(S.host, S.cfg.excluded);
    if (r && r.speed) S.speed = SG.clamp(r.speed);
    if (r && r.tabMedia) S.tabMedia = true;
    S.ready = true; readyResolve();
    if (S.off) return;
    applyAll(); for (const el of media.keys()) box(el);
    if (S.speed !== 1) flash();   // show the remembered speed for a moment
  }
  B.runtime.onMessage.addListener((m) => {
    if (!m || !S.ready) return;
    if (m.type === 'apply') { const changed = Math.abs(m.speed - S.speed) > 0.001; S.speed = SG.clamp(m.speed); if (!S.off) { applyAll(); if (changed || m.src === 'popup') flash(); } }
    else if (m.type === 'tabMedia') S.tabMedia = true;
    else if (m.type === 'seek' && !S.off) seek(m.d);
  });
  B.storage.onChanged.addListener((ch, area) => {
    if (area !== 'local' || !ch.cfg) return;
    S.cfg = SG.cfg(ch.cfg.newValue);
    const off = SG.excluded(S.host, S.cfg.excluded);
    if (off && !S.off) { S.off = true; for (const el of media.keys()) { try { el.playbackRate = 1; } catch {} } }
    else if (!off && S.off) { S.off = false; applyAll(); }
    for (const el of media.keys()) box(el);
  });
  window.__speedGeek = {
    async info() { await Promise.race([readyP, new Promise((r) => setTimeout(r, 1500))]); scan(document);
      return { media: [...media.keys()].filter((e) => e.isConnected).length, speed: S.speed, off: S.off, host: S.host, ready: S.ready, top: window === top, fixed: S.fixed || 0 }; },
    // for tests
    _S: S, _media: media,
  };
  watch(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan(document), { once: true });
  scan(document);
  // players that build their insides later (for example in a shadow root) are picked up by a few more looks
  for (const t of [1000, 2500, 5000, 10000, 20000]) setTimeout(() => scan(document), t);
  start();
})();
