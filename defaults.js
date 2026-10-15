// SpeedGeek shared settings and helpers (used by the background, popup, options page and the page script).
if (!globalThis.SG) {
  globalThis.SG = {
    MIN: 0.1,
    MAX: 16,
    DEFAULTS: {
      mode: 'auto',          // 'auto' = every site (needs site access), 'click' = only after clicking the icon
      remember: true,        // remember the speed for each site
      force: true,           // put my speed back when the site changes it
      overlay: true,         // show the speed box on videos
      step: 0.1,             // S and D change the speed by this much
      seek: 10,              // Z and X jump this many seconds
      preferred: 1.8,        // G jumps to this speed (press again to go back to 1x)
      keys: { slower: 's', faster: 'd', reset: 'r', preferred: 'g', back: 'z', forward: 'x', box: 'v' },
      excluded: [],          // sites where SpeedGeek does nothing
    },
    QUICK: [1, 1.25, 1.5, 1.75, 2, 2.5, 3],
    clamp(s) {
      s = Number(s);
      if (!isFinite(s)) return 1;
      return Math.round(Math.min(SG.MAX, Math.max(SG.MIN, s)) * 100) / 100;
    },
    fmt(s) { return (Math.round(s * 100) / 100).toFixed(2).replace(/0$/, '') + '×'; },
    cfg(stored) {
      const d = SG.DEFAULTS, c = Object.assign({}, d, stored || {});
      c.keys = Object.assign({}, d.keys, (stored && stored.keys) || {});
      c.excluded = Array.isArray(c.excluded) ? c.excluded : [];
      return c;
    },
    // "www.youtube.com" and "youtube.com" count as the same site; a listed site covers its subdomains.
    bare(h) { return String(h || '').toLowerCase().replace(/^www\./, ''); },
    excluded(host, list) {
      const h = SG.bare(host);
      return !!h && (list || []).some((e) => { e = SG.bare(e); return e && (h === e || h.endsWith('.' + e)); });
    },
    cleanHost(text) {
      let t = String(text || '').trim().toLowerCase();
      if (!t) return '';
      try { if (/^[a-z]+:\/\//.test(t)) t = new URL(t).hostname; } catch {}
      t = t.replace(/^\*\./, '').split('/')[0].split(':')[0];
      return /^[a-z0-9.-]+$/.test(t) && t.includes('.') || t === 'localhost' ? SG.bare(t) : '';
    },
  };
}
