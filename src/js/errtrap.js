// ===== THE ERROR TRAP (02.11.2026; Jonas: «det viktigste er at vi klarer å fange opp så mange feil automatisk som mulig slik at vi
// slipper at brukere må rapportere alt de opplever») =====
// The first script on the page, before the fonts, the data and the game: everything that goes wrong from here on is caught, also while
// the page loads and before the sign-in, when ui/10f-cloud.js is not up yet. Until the cloud takes over (errTake sets DSB_ERRTRAP.to),
// the errors wait in DSB_ERRTRAP.q. Caught: errors thrown and not caught (window 'error'), promises rejected and not handled
// ('unhandledrejection'), files the page could not load (a script, a picture or a style: an 'error' on the element, seen in the capture
// phase), and console.error: the game's own catch blocks write there what they caught and go on (51 places on 02.11.2026), so those
// faults never stopped anything and were never seen. console.error still writes to the console as before.
(function(){
  var T = window.DSB_ERRTRAP = {q:[], to:null, busy:false};
  function put(msg, src, stack, kind){
    if (T.busy) return;   // an error while one is being handed on (the cloud's own console.error) is not caught again
    T.busy = true;
    try { if (T.to) T.to(msg, src, stack, kind); else if (T.q.length < 40) T.q.push([msg, src, stack, kind, Date.now()]); } catch (e){}
    T.busy = false;
  }
  T.put = put;
  addEventListener('error', function(e){
    var t = e.target;
    if (t && t !== window && t.tagName){   // a file the page could not load: what and from where, without its query
      var u = String(t.src || t.href || t.currentSrc || '').split(/[?#]/)[0];
      if (u) put('resource: ' + t.tagName.toLowerCase() + ' ' + u.slice(0, 160), 'resource', '', 'resource');
      return;
    }
    put(e.message || 'error', (e.filename || '') + ':' + (e.lineno || '') + ':' + (e.colno || ''), e.error && e.error.stack, e.error ? 'throw' : 'error');
  }, true);
  addEventListener('unhandledrejection', function(e){
    var r = e.reason;
    put(r && r.message ? (r.name && r.name !== 'Error' ? r.name + ': ' : '') + r.message : String(r), 'promise', r && r.stack, 'promise');
  });
  // something the page's Content-Security-Policy stopped (L1e, 11.11.2026, build.mjs CSP_OF): the policy is made from what a first
  // trip, the phone, the plotter and three places along the coast do, so a thing that happens rarely (a worker, a blob: address, a
  // sound) may be stopped at a player's and nowhere else. It is told here: which directive, and what was stopped (an address without
  // its query, or «inline», «eval»). What a browser extension put into the page is not the game's and is left out.
  addEventListener('securitypolicyviolation', function(e){
    var b = String(e.blockedURI || ''), f = String(e.sourceFile || '');
    if (/^[a-z-]*extension/i.test(b) || /^[a-z-]*extension/i.test(f)) return;
    put('csp: ' + (e.effectiveDirective || e.violatedDirective || '') + ' ' + b.split(/[?#]/)[0].slice(0, 160), f.split(/[?#]/)[0] + ':' + (e.lineNumber || '') + ':' + (e.columnNumber || ''), '', 'csp');
  });
  // console.warn too, but only when it is handed an Error: the catches that go on after a fault (the missions, the coast guard, the
  // plan's builder, a 3D layer that falls back) write it there; a warning in words alone is a note, not a fault
  var cw = console.warn;
  console.warn = function(){
    cw.apply(console, arguments);
    if (T.busy) return;
    try {
      var err = null, parts = [];
      for (var i = 0; i < arguments.length; i++){ var a = arguments[i]; if (a instanceof Error && !err) err = a; parts.push(a instanceof Error ? String(a) : typeof a === 'string' ? a : ''); }
      if (err) put(parts.join(' ').trim(), 'warn', err.stack, 'warn');
    } catch (e){}
  };
  var ce = console.error;
  console.error = function(){
    ce.apply(console, arguments);
    if (T.busy) return;
    try {
      var parts = [], err = null;
      for (var i = 0; i < arguments.length; i++){
        var a = arguments[i];
        if (a instanceof Error){ if (!err) err = a; parts.push(String(a)); }
        else if (typeof a === 'string') parts.push(a);
        else { try { parts.push(JSON.stringify(a).slice(0, 200)); } catch (e){ parts.push(String(a)); } }
      }
      // with no Error, where console.error was called from: the stack of a new one (its first line is this function)
      put(parts.join(' '), 'console', err ? err.stack : String(new Error('console.error').stack || '').split('\n').slice(2).join('\n'), 'console');
    } catch (e){}
  };
})();
