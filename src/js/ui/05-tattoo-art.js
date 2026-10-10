// ---------- sailors' tattoos: the flash and the seated sailor they go on ----------
// Line art in navy ink on cream, after the old tattoo-flash charts: a sailor in a dixie cup and shorts on a bollard, a coil of rope at
// his feet, and each tattoo in its traditional place. Earned tattoos are inked; the rest show as a faint stencil. Pure SVG, no game state.
const TATART = (() => {
  const INK = '#1f2b4d', PAPER = '#fbf6ea', SKIN = '#fffaf0';
  const f = n => +n.toFixed(2);
  // a five-point nautical star: each point split into a dark and a light half
  function star(R, r){ let s = ''; for (let i = 0; i < 5; i++){ const a = -Math.PI / 2 + i * 2 * Math.PI / 5, b = a + Math.PI / 5, c = a - Math.PI / 5;
      const P = [f(Math.cos(a) * R), f(Math.sin(a) * R)], Q = [f(Math.cos(b) * r), f(Math.sin(b) * r)], U = [f(Math.cos(c) * r), f(Math.sin(c) * r)];
      s += '<path d="M0,0 L' + P + ' L' + Q + ' Z" fill="' + INK + '"/><path d="M0,0 L' + P + ' L' + U + ' Z" fill="' + PAPER + '"/>'; }
    let o = ''; for (let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; o += (i ? ' L' : 'M') + f(Math.cos(a) * rr) + ',' + f(Math.sin(a) * rr); }
    return s + '<path d="' + o + ' Z" fill="none" stroke="' + INK + '" stroke-width="1.3" stroke-linejoin="round"/>'; }
  const anchor = (k) => '<g fill="none" stroke="' + INK + '" stroke-width="' + (2.4 * (k || 1)) + '" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="0" cy="-17" r="3.2"/><path d="M0,-13.8 V16"/><path d="M-9,-8 H9"/><path d="M-15,5 C-13,13 -6,17 0,17 C6,17 13,13 15,5"/></g>' +
    '<path d="M-15,5 l-3.4,3.4 l5.2,1.4 Z M15,5 l3.4,3.4 l-5.2,1.4 Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="1" stroke-linejoin="round"/>' +
    '<circle cx="-9.6" cy="-8" r="1.7" fill="' + INK + '"/><circle cx="9.6" cy="-8" r="1.7" fill="' + INK + '"/>';
  // a laid rope along an ellipse arc: outline, body and the slanted lay of the strands
  function ropeArc(cx, cy, rx, ry, a0, a1, w){
    const n = Math.max(8, Math.round(Math.abs(a1 - a0) * (rx + ry) / 2 / (w * 0.72)));
    let d = '', lay = '';
    for (let i = 0; i <= n; i++){ const t = a0 + (a1 - a0) * i / n, x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry; d += (i ? ' L' : 'M') + f(x) + ',' + f(y);
      if (i && i < n){ let tx = -Math.sin(t) * rx, ty = Math.cos(t) * ry; const l = Math.hypot(tx, ty); tx /= l; ty /= l; const nx = -ty, ny = tx, h = w * 0.42, k = w * 0.3;
        lay += 'M' + f(x - nx * h - tx * k) + ',' + f(y - ny * h - ty * k) + ' L' + f(x + nx * h + tx * k) + ',' + f(y + ny * h + ty * k) + ' '; } }
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + w + '" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="' + PAPER + '" stroke-width="' + (w - 4.4) + '" stroke-linecap="round"/>' +
      '<path d="' + lay + '" stroke="' + INK + '" stroke-width="' + (w > 10 ? 1.3 : 1) + '" stroke-linecap="round"/>'; }
  const K = (d, fill, w) => '<path d="' + d + '" fill="' + (fill || INK) + '" stroke="' + INK + '" stroke-width="' + (w || 1.1) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const H = (d, w, c) => '<path d="' + d + '" fill="none" stroke="' + (c || INK) + '" stroke-width="' + (w || 1.1) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const ART = {
    // a swallow in flight, head to the right: far wing up, near wing swept down, a long forked tail
    swallow:'<g transform="translate(1,2) scale(.86) rotate(-12)">' +
      K('M6,-4 C2,-14 -8,-24 -21,-29 C-17,-21 -12,-13 -6,-4 Z') + H('M0,-8 C-5,-14 -10,-19 -15,-23', .8, PAPER) +
      K('M-9,-1 L-31,-9 L-19,1 L-31,10 L-9,4 Z') + H('M-12,1 L-26,-5 M-12,2.5 L-26,7', .7, PAPER) +
      K('M19,-5 C10,-9 -4,-7 -12,-2 L-12,2 C-4,6 10,8 19,5 Z', PAPER) + K('M19,-5 C10,-9 -4,-7 -12,-2 L-12,0 C-2,-2 8,-2 17,-1 Z') +
      H('M-6,3 C-3,5 0,5 2,4 M2,5 C5,6 8,6 10,5', .8) +
      K('M9,0 C6,9 -2,18 -15,25 C-12,17 -8,9 -4,1 Z') + H('M5,5 C2,11 -3,16 -9,20 M1,3 C-2,8 -5,12 -9,15', .8, PAPER) +
      K('M14,-6.5 C18,-9 23,-7 23,-3 C23,1 19,3.5 15,3 Z') + K('M15,1 C17,4 21,4 23,1 C22,-1 18,-1 15,1 Z', PAPER, .8) +
      K('M22.6,-3.4 L29,-1.6 L22.6,0 Z') + '<circle cx="18.6" cy="-3.6" r="1.4" fill="' + PAPER + '"/><circle cx="18.9" cy="-3.6" r=".6" fill="' + INK + '"/></g>',
    star:star(19, 7.8),
    anchor:anchor() + H('M-5,-14.6 C4,-12 -7,-6 3,-1 C12,3 0,9 6,13 C9,15 12,13 12,10', 1.3),
    xanchors:'<g transform="rotate(-36) scale(.9)">' + anchor(1.1) + '</g><g transform="rotate(36) scale(.9)">' + anchor(1.1) + '</g>',
    // a whaling harpoon with a barbed head, its line wound round the shaft
    harpoon:'<g transform="rotate(-40)">' + K('M-30,-1.6 L14,-1.6 L14,1.6 L-30,1.6 Z', PAPER) +
      K('M13,-1.6 L20,-7 L31,0 L20,7 L13,1.6 Z') + K('M17,-4.4 L12,-8.6 L14,-3 Z M17,4.4 L12,8.6 L14,3 Z') + H('M20,0 L28,0', .8, PAPER) +
      K('M-30,-2.6 L-24,-2.6 L-24,2.6 L-30,2.6 Z') + H('M-20,0 C-16,-6 -12,-6 -8,0 C-4,6 0,6 4,0 C6,-3 8,-5 12,-5', 1.2) + H('M-30,0 C-33,6 -28,9 -32,13', 1.1) + '</g>',
    // a rope round the wrist, knotted, the ends hanging
    rope:'<g transform="translate(0,-3)">' + ropeArc(0, 0, 21, 9, Math.PI, 2 * Math.PI, 6.4) + ropeArc(0, 0, 21, 9, 0, Math.PI, 6.4) +
      K('M-4,6 C-6,12 -8,18 -6,24 L-2,24 C-4,18 -2,12 0,8 Z', PAPER) + K('M4,6 C6,12 9,18 8,24 L4,24 C4,18 2,12 0,8 Z', PAPER) + H('M-6.6,15 l3,1.2 M-6.6,19 l3,1.2 M5,15 l3,-1.2 M5.8,19 l3,-1.2', .9) +
      '<ellipse cx="0" cy="8" rx="5.2" ry="4.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.1"/>' + H('M-3,6 C-1,10 1,10 3,6 M-4,9 C-1,7 1,7 4,9', .9) + '</g>',
    turtle:'<g stroke-linejoin="round">' +
      K('M-7,-7 C-16,-13 -21,-8 -22,-2 C-17,-4 -12,-4 -8,-2 Z M7,-7 C16,-13 21,-8 22,-2 C17,-4 12,-4 8,-2 Z M-6,7 C-12,10 -14,16 -13,19 C-9,16 -6,13 -3,10 Z M6,7 C12,10 14,16 13,19 C9,16 6,13 3,10 Z') +
      H('M-10,-7 C-14,-8 -17,-7 -19,-4 M10,-7 C14,-8 17,-7 19,-4', .7, PAPER) +
      K('M-2,11 L0,17 L2,11 Z') + K('M-3.8,-12 C-4.4,-16 -2,-19 0,-19 C2,-19 4.4,-16 3.8,-12 Z', PAPER) + '<circle cx="-1.5" cy="-15.6" r=".8" fill="' + INK + '"/><circle cx="1.5" cy="-15.6" r=".8" fill="' + INK + '"/>' +
      '<ellipse cx="0" cy="0" rx="11" ry="13" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.3"/><ellipse cx="0" cy="0" rx="8.4" ry="10.4" fill="none" stroke="' + INK + '" stroke-width=".8"/>' +
      K('M-4,-5 L4,-5 L6.4,.6 L3.2,6 L-3.2,6 L-6.4,.6 Z') + H('M-4,-5 L-5.6,-9.6 M4,-5 L5.6,-9.6 M6.4,.6 L8.4,.6 M-6.4,.6 L-8.4,.6 M3.2,6 L4.6,9.6 M-3.2,6 L-4.6,9.6', 1) + '</g>',
    // a hula girl: flower in her long hair, a lei, a grass skirt, arms raised
    hula:'<g transform="translate(0,1) scale(.94)">' + K('M-4,-19 C-7,-23 -11,-25 -13,-29 M4,-19 C8,-22 11,-25 12,-29', PAPER, 2.4) + H('M-4,-19 C-7,-23 -11,-25 -13,-29 M4,-19 C8,-22 11,-25 12,-29', 1, PAPER) +
      K('M-4,-20 C-4.6,-14 -3,-10 -4,-6 C-2,-3 2,-3 4,-6 C3,-10 4.6,-14 4,-20 C2,-21 -2,-21 -4,-20 Z', PAPER) +
      K('M-4,-8 C-3,-4 -2,-2 -4.6,2 L4.6,2 C2,-2 3,-4 4,-8 Z', PAPER) + H('M-2,-5 C-1,-4.4 1,-4.4 2,-5', .8) +
      K('M-3.6,-26 C-5.6,-22 -7,-16 -8,-8 C-6,-12 -5,-17 -3.2,-21 Z') + K('M3.6,-26 C5.4,-22 6,-18 6,-14 C5,-17 4,-20 3,-22 Z') +
      '<circle cx="0" cy="-25" r="4" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.1"/>' + K('M-4,-26 C-4,-30.4 4,-30.4 4,-26 C2,-27.4 -2,-27.4 -4,-26 Z') +
      '<circle cx="-1.4" cy="-25" r=".55" fill="' + INK + '"/><circle cx="1.4" cy="-25" r=".55" fill="' + INK + '"/>' + H('M-1,-23 C-.3,-22.4 .3,-22.4 1,-23', .7) +
      '<g fill="' + PAPER + '" stroke="' + INK + '" stroke-width=".8">' + [[4.6, -28.4], [6.2, -27], [5.8, -29.6]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.3"/>').join('') + '</g>' +
      '<g fill="' + PAPER + '" stroke="' + INK + '" stroke-width=".7">' + [[-3.6, -20.2], [-1.8, -19], [0, -18.6], [1.8, -19], [3.6, -20.2]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.2"/>').join('') + '</g>' +
      K('M-2.6,-15 C-1.4,-13.4 1.4,-13.4 2.6,-15 L2.4,-12.6 L-2.4,-12.6 Z') +
      K('M-5,1 C-8,8 -10,13 -12,17 C-6,18 6,18 12,17 C10,13 8,8 5,1 Z', PAPER) +
      H('M-4,2 L-9,16 M-2.4,2 L-5.4,17 M-.8,2 L-1.8,17 M.8,2 L1.8,17 M2.4,2 L5.4,17 M4,2 L9,16 M-11,17 l-.6,2 M-7,17.6 l-.3,2 M-3,17.8 v2 M3,17.8 v2 M7,17.6 l.3,2 M11,17 l.6,2', .8) +
      K('M-3.4,17.6 C-3.8,22 -3,25 -4,29 L-2,29 C-1.4,25 -1,22 -.8,17.8 Z', PAPER, 1) + K('M3.4,17.6 C3.8,22 4.6,25 5,29 L3,29 C2.4,25 1.6,22 .8,17.8 Z', PAPER, 1) + H('M-4.6,29 h3 M2.6,29 h3.2', 1.2) + '</g>',
    pig:'<g stroke-linejoin="round">' + H('M-7,5 v7 M-3,6 v7 M4,6 v7 M8,5 v7', 2.2) + H('M-12,-1 C-15,-4 -18,-1 -15,1 C-12,3 -12,-3 -16,-4', 1.1) +
      '<ellipse cx="0" cy="0" rx="12.5" ry="8.4" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.2"/>' + H('M-5,-5 C-1,-7 3,-7 6,-6 M-8,3 C-4,5 0,5 3,4', .8) +
      K('M11,-9 C16,-9 19,-5 18,-1 C17,3 12,4 9,2 Z', PAPER, 1.2) + K('M9.6,-8.6 L10.6,-14 L14,-8.4 Z') +
      '<ellipse cx="18.8" cy="-2.4" rx="2.3" ry="3.1" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.1"/><circle cx="18.9" cy="-3.3" r=".55" fill="' + INK + '"/><circle cx="18.9" cy="-1.5" r=".55" fill="' + INK + '"/><circle cx="14" cy="-5" r=".9" fill="' + INK + '"/></g>',
    rooster:'<g stroke-linejoin="round">' + H('M-2,7 L-3,14 M3,7 L3,14 M-3,14 h-3.4 M-3,14 l1.6,1.8 M3,14 h3.4 M3,14 l-1.6,1.8', 1.4) +
      K('M-7,-1 C-12,-10 -14,-17 -10,-21 C-9,-15 -6,-10 -4,-7 Z M-5,0 C-13,-6 -18,-10 -20,-16 C-14,-13 -9,-9 -5,-5 Z M-4,2 C-12,0 -18,-1 -21,-7 C-15,-6 -9,-3 -4,-2 Z') +
      H('M-8,-4 C-10,-9 -11,-13 -10,-17 M-9,-2 C-13,-6 -16,-9 -17,-12', .7, PAPER) +
      K('M-6,1 C-6,-5 0,-7 5,-6 C7,-10 7,-14 10,-15 C13,-15 14,-12 13,-9 C12,-5 12,0 9,5 C6,8 -2,8 -6,1 Z', PAPER) +
      K('M-3,1 C0,-2 4,-1 6,2 C3,4 0,4 -3,1 Z') + K('M13.4,-12.4 L17.4,-11.4 L13.4,-10.2 Z') +
      K('M9,-15 C9,-18.4 11,-18.4 11,-16 C11,-19.4 13.2,-19.4 13,-16 C14,-18.4 16,-17.4 14,-14.4 Z') + K('M13.6,-9.8 C15.4,-9 15.2,-6.6 13.2,-6.8 Z') + '<circle cx="11.6" cy="-12.6" r=".8" fill="' + INK + '"/></g>',
    // King Neptune: crowned, long-bearded, trident in hand
    neptune:'<g stroke-linejoin="round">' + H('M14,28 L14,-18', 2) +
      K('M8,-20 C8,-14 20,-14 20,-20 L18.6,-20 C18,-16 10,-16 9.4,-20 Z') + K('M14,-15 L14,-20 M14,-29 L12,-24 L13.2,-24 L13.2,-19 L14.8,-19 L14.8,-24 L16,-24 Z') + K('M8.6,-20 L7,-27 L10.6,-22 Z M19.4,-20 L21,-27 L17.4,-22 Z') +
      K('M-13,-12 C-17,-4 -16,6 -12,12 C-14,4 -12,-4 -9,-10 Z M11,-12 C14,-4 13,4 9,10 C10,2 9,-4 7,-10 Z') +
      K('M-10,-4 C-12,6 -10,16 -3,26 C-2,20 0,18 1,26 C8,16 9,6 7,-4 Z') + H('M-7,2 C-7,10 -5,16 -3,20 M-2,4 C-2,12 -1,18 0,22 M3,2 C4,10 3,16 2,20', .8, PAPER) +
      '<ellipse cx="-1.4" cy="-6.6" rx="8.2" ry="9.4" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.2"/>' +
      H('M-6,-9.6 C-5,-11 -3,-11 -2.2,-10 M.8,-10 C1.6,-11 3.6,-11 4.6,-9.6', .9) + '<circle cx="-4" cy="-8.2" r=".9" fill="' + INK + '"/><circle cx="2.6" cy="-8.2" r=".9" fill="' + INK + '"/>' + H('M-.8,-8 C-1.4,-5.4 -2,-4 -.4,-3.6', .8) +
      K('M-1.2,-2.6 C-3,-4 -6,-3.6 -8,-1 C-5.6,-1.6 -3.6,-1.4 -1.2,-.6 C1.2,-1.4 3.2,-1.6 5.6,-1 C3.6,-3.6 .6,-4 -1.2,-2.6 Z') +
      K('M-9.4,-13 L-10.8,-24 L-6.4,-18 L-4.6,-26.6 L-1.4,-19 L1.8,-26.6 L3.6,-18 L8,-24 L6.6,-13 C1,-11 -4,-11 -9.4,-13 Z') + H('M-9,-14.6 C-3,-12.6 1,-12.6 7,-14.6', .9, PAPER) +
      '<circle cx="-4.6" cy="-26.6" r="1.1" fill="' + INK + '"/><circle cx="1.8" cy="-26.6" r="1.1" fill="' + INK + '"/>' + K('M12,-2 C12,-4 16,-4 16,-2 L16,2 C16,4 12,4 12,2 Z', PAPER) + '</g>',
    // a dagger driven down through a rose, a drop of blood at the tip
    rose:'<g stroke-linejoin="round">' + K('M-2.4,-30 L2.4,-30 L2.4,-19 L-2.4,-19 Z', PAPER) + H('M-2.4,-27 l4.8,2 M-2.4,-23.6 l4.8,2', .8) + '<circle cx="0" cy="-31.4" r="2.2" fill="' + INK + '"/>' +
      K('M-11,-19 L11,-19 L11,-16 L-11,-16 Z') + '<circle cx="-12.4" cy="-17.5" r="1.9" fill="' + INK + '"/><circle cx="12.4" cy="-17.5" r="1.9" fill="' + INK + '"/>' +
      K('M-3,-16 L3,-16 L2.4,16 L0,23 L-2.4,16 Z', PAPER) + H('M0,-14 L0,17', .8) + K('M0,25 C-1.6,27.4 -1.6,29.4 0,29.4 C1.6,29.4 1.6,27.4 0,25 Z') +
      K('M-8,0 C-15,-3 -21,1 -22,7 C-16,7.4 -11,5 -8,2 Z M8,2 C15,0 21,4 22,10 C16,10 11,7.6 8,4 Z') + H('M-9,1.4 C-13,1.4 -17,3.4 -19,5.6 M9,3.4 C13,3.4 17,5.6 19,8', .7, PAPER) +
      K('M-11,-4 C-14,-10 -9,-15 -4,-14 C-1,-17 6,-17 9,-13 C14,-11 14,-4 11,0 C12,6 6,10 0,10 C-6,10 -12,6 -11,-4 Z', PAPER, 1.2) +
      H('M-6,-8 C-4,-12 3,-12 5,-8 C7,-4 3,-1 -1,-2 C-4,-3 -4,-7 -1,-7 C1,-7 2,-5 1,-4', 1) + H('M-11,-4 C-8,0 -4,2 2,1 C6,0 9,-2 11,0 M-8,5 C-4,7 3,7 7,4 M9,-13 C7,-10 7,-7 8,-5', .9) +
      K('M-6,-8 C-4,-12 3,-12 5,-8 C2,-9.6 -3,-9.6 -6,-8 Z') + '</g>'
  };
  // where each tattoo sits on the seated sailor: x, y, scale, rotation, mirror
  const AT = {svale1:[173, 226, .92, -10, 0], svale2:[227, 226, .92, 10, 1], stjerne:[124, 228, .78, -8, 0], anker:[277, 232, .76, 6, 0], hula:[124, 294, 1.12, 2, 0], tau:[0, 0, 1, 0, 0],
    skilpadde:[157, 488, .5, -16, 0], harpun:[258, 404, .9, 30, 1], ankere:[243, 486, .44, 16, 0], rose:[140, 590, .84, -26, 0], neptun:[280, 612, .8, 0, 0], grishane:[0, 0, 1, 0, 0]};
  const ICON = {svale1:'swallow', svale2:'swallow', stjerne:'star', anker:'anchor', hula:'hula', tau:'rope', skilpadde:'turtle', harpun:'harpoon', ankere:'xanchors', rose:'rose', neptun:'neptune'};
  const place = (id, body) => { const [x, y, s, r, m] = AT[id]; return '<g transform="translate(' + x + ',' + y + ') rotate(' + r + ') scale(' + (m ? -s : s) + ',' + s + ')">' + body + '</g>'; };
  function tattoo(id){
    if (id === 'grishane') return '<g transform="translate(192,706) rotate(-20) scale(.46)">' + ART.rooster + '</g><g transform="translate(283,722) scale(.54)">' + ART.pig + '</g>';
    if (id === 'tau') return '<g transform="translate(151,446) rotate(-16)">' + ropeArc(0, 0, 13.5, 4, 0, Math.PI, 5.6) + '</g>';
    return place(id, ART[ICON[id]]);
  }
  // the sailor: seated on a bollard, hands on his knees, a coil of rope at his feet
  const L = (d, w) => '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  const F = (d, fill, w) => '<path d="' + d + '" fill="' + (fill || SKIN) + '" stroke="' + INK + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  // mirror an x coordinate for the right-hand side of the body
  const mir = (d, m) => m ? d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => (400 - +x) + ',' + y) : d;
  function sailor(){
    let s = '';
    // the coil of rope on the quay: the top turn's far side, the bollard, then the near sides from the bottom turn up
    s += ropeArc(200, 718, 150, 24, Math.PI + 0.03, 2 * Math.PI - 0.03, 16);
    s += F('M124,448 C124,438 276,438 276,448 L282,736 C250,748 150,748 118,736 Z', INK) + '<path d="M142,456 L138,730" stroke="#3e4f7c" stroke-width="6" stroke-linecap="round"/>';
    s += ropeArc(200, 750, 184, 26, 0.06, Math.PI - 0.06, 16) + ropeArc(200, 734, 168, 25, 0.04, Math.PI - 0.04, 16) + ropeArc(200, 718, 150, 24, 0.03, Math.PI - 0.03, 16);
    // right leg: shin straight down to a foot on the rope
    s += F('M254,514 C250,574 256,636 262,686 L262,702 C258,712 252,722 254,732 C258,742 272,744 284,744 L298,744 C308,744 312,736 308,726 C304,716 300,708 298,700 L298,686 C308,636 312,586 302,504 Z') +
      L('M258,738 q4,5 8,1 M267,740 q4,5 8,1 M276,741 q4,5 8,1 M285,741 q4,5 8,0', 1.2) + L('M264,698 C274,703 288,703 298,698', 1.2) + L('M294,560 C298,590 298,620 294,650', 1);
    // left leg: crossed back under him, the foot tucked in against the bollard, toes down
    s += F('M102,500 C108,560 132,616 164,666 L176,690 C178,702 178,714 184,724 C190,734 202,736 208,730 C214,724 212,712 208,702 L200,680 C188,628 166,566 148,516 Z') +
      L('M186,726 q2,5 7,4 M194,730 q3,4 8,2', 1.2) + L('M170,686 C178,690 190,688 200,682', 1.2) + L('M114,540 C124,580 140,612 156,636', 1);
    // thighs spread over the bollard, knees out
    s += F('M150,368 C132,404 114,446 102,484 C96,504 106,522 124,526 C138,528 148,522 152,514 C164,490 182,462 200,442 Z');
    s += F('M250,368 C268,404 286,446 298,484 C304,504 294,522 276,526 C262,528 252,522 248,514 C236,490 218,462 200,442 Z');
    s += L('M110,500 C116,512 130,516 142,510 M290,500 C284,512 270,516 258,510', 1.2);
    // white briefs
    s += F('M148,352 L252,352 L256,374 C242,396 224,420 210,446 L190,446 C176,420 158,396 144,374 Z') + L('M147,368 L253,368', 2) + L('M200,372 C198,392 196,408 197,426', 1.1);
    // torso
    s += F('M184,164 C176,176 160,182 144,186 L142,226 C146,266 150,306 148,354 L252,354 C250,306 254,266 258,226 L256,186 C240,182 224,176 216,164 Z');
    s += L('M154,270 C166,286 188,286 198,272 M202,272 C212,286 234,286 246,270', 1.8) + L('M200,292 L200,330', 1) + L('M197,338 q3,4 6,0', 1.4);
    s += L('M168,188 C180,194 192,194 198,190 M232,188 C220,194 208,194 202,190', 1.4) + L('M162,302 C170,306 176,308 184,308 M238,302 C230,306 224,308 216,308', 1);
    // arms: upper arms hang at his sides, forearms slant in, hands rest on his thighs by the knees
    const arm = m => F(mir('M144,186 C126,186 112,196 108,214 C104,234 106,250 108,264 C108,286 106,306 108,326 C108,338 110,346 112,352 C118,386 128,418 140,450 L162,444 C156,414 150,382 142,346 C141,334 141,322 141,308 C142,282 144,254 146,228 Z', m)) +
      L(mir('M112,318 C118,328 128,332 138,330', m), 1.1) + L(mir('M121,370 C124,384 128,396 132,406', m), .9);
    s += arm(0) + arm(1);
    const hand = m => F(mir('M139,446 C136,458 134,470 136,482 C138,494 144,506 150,512 C154,516 160,516 162,512 C166,516 172,514 172,508 C176,508 180,504 178,498 C182,494 180,488 176,486 C178,480 182,474 180,468 C178,462 172,462 168,466 L164,442 Z', m)) +
      L(mir('M150,486 C152,496 156,504 162,512 M158,484 C162,494 166,502 172,508 M166,480 C170,488 174,494 178,498', m), 1.1) + L(mir('M140,478 C150,482 162,478 170,470', m), 1);
    s += hand(0) + hand(1);
    // neck, ears, head, hair at the temples
    s += F('M184,140 L184,166 C192,172 208,172 216,166 L216,140 Z');
    s += F('M166,104 C160,98 154,112 160,122 C163,127 168,126 170,124 Z', SKIN, 2) + F('M234,104 C240,98 246,112 240,122 C237,127 232,126 230,124 Z', SKIN, 2);
    s += F('M166,96 C164,130 176,156 200,160 C224,156 236,130 234,96 C232,70 168,70 166,96 Z');
    s += L('M168,96 C164,104 164,110 166,116 M171,98 C169,104 169,108 170,112 M232,96 C236,104 236,110 234,116 M229,98 C231,104 231,108 230,112', 1.4);
    // dixie cup: a rolled brim round a soft crown
    s += F('M170,90 C166,66 180,52 200,51 C220,52 234,66 230,90 Z') + L('M186,58 C190,70 190,80 188,88 M214,58 C210,70 210,80 212,88', 1);
    s += F('M160,82 C182,74 218,74 240,82 L238,100 C216,92 184,92 162,100 Z') + L('M161,91 C184,83 216,83 239,91', 1);
    // brows, eyes, the nose, a handlebar moustache
    s += L('M178,108 C182,104 190,104 193,107 M207,107 C210,104 218,104 222,108', 1.8) + '<circle cx="186" cy="115" r="2.2" fill="' + INK + '"/><circle cx="214" cy="115" r="2.2" fill="' + INK + '"/>';
    s += L('M196,108 C195,118 192,126 194,131 C197,134 202,134 206,131', 1.6);
    s += F('M200,139 C196,135 186,134 180,139 C175,143 168,142 166,136 C164,131 170,128 172,132 C170,134 172,137 175,136 C180,133 188,130 194,132 C197,133 199,134 200,135 C201,134 203,133 206,132 C212,130 220,133 225,136 C228,137 230,134 228,132 C230,128 236,131 234,136 C232,142 225,143 220,139 C214,134 204,135 200,139 Z', INK, 1.2);
    s += L('M193,147 C197,149 203,149 207,147', 1.3);
    return s;
  }
  // the whole chart: every tattoo inked if earned, a faint stencil if not
  function figure(got, lock){
    let s = '<svg viewBox="10 36 380 750" style="width:100%;max-width:340px;display:block;margin:0 auto" role="img"><rect x="10" y="36" width="380" height="750" fill="' + PAPER + '"/>' + sailor();
    for (const id of Object.keys(AT)){ const on = got[id]; s += '<g data-tat="' + id + '"' + (on ? '' : ' opacity="' + (lock[id] ? 0.13 : 0.2) + '"') + '>' + tattoo(id) + '</g>'; }
    return s + '</svg>';
  }
  // one tattoo on its own, for the list
  function icon(id, on){
    const body = id === 'grishane' ? '<g transform="translate(-11,0) scale(.72)">' + ART.rooster + '</g><g transform="translate(12,2) scale(.66)">' + ART.pig + '</g>' : ART[ICON[id]];
    return '<svg viewBox="-32 -32 64 64" style="width:52px;height:52px;flex:none;background:' + PAPER + ';border-radius:10px' + (on ? '' : ';opacity:.3') + '">' + body + '</svg>';
  }
  return {figure, icon};
})();
