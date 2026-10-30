// ---------- the phone ----------
const PHONE = (() => {
  const el = $('phone'), view = $('phView'), tEl = $('phTime'), nEl = $('phNet'), badge = $('phoneBadge');
  let app = 'home', sub = {}, isOpen = false, confirmMayday = false, shopPend = null, saveBox = null, haillPend = null, egnUI = null;
  const L = (no, en) => S.lang === 'no' ? no : en;
  const SVG = d => '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const IC = {
    nett:SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>'),
    guide:SVG('<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/><circle cx="12" cy="12" r=".9" fill="#fff"/>'),
    fiske:SVG('<path d="M15 3v9.5a4.5 4.5 0 0 1-9 0V10l-2.2 2.2"/><path d="M6 10l2.2 2.2"/><circle cx="15" cy="3" r="1.2"/><path d="M15 7l3 1.5"/>'),
    drift:SVG('<path d="M4 6h16M4 12h10M4 18h6"/><circle cx="18" cy="15" r="3.2"/><path d="M18 13.2v1.9l1.2.8"/>'),
    haill:SVG('<path d="M7 5v7a5 5 0 0 0 10 0V5"/><path d="M5 5h4M15 5h4"/><circle cx="7" cy="8.5" r=".7" fill="#fff"/><circle cx="17" cy="8.5" r=".7" fill="#fff"/><circle cx="8.2" cy="13.5" r=".7" fill="#fff"/><circle cx="15.8" cy="13.5" r=".7" fill="#fff"/>'),
    vaer:SVG('<circle cx="9" cy="9" r="3.2"/><path d="M9 2.5v1.6M3.3 9H1.8M4.4 4.4l1.1 1.1M13.6 4.4l-1.1 1.1"/><path d="M8 20h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A2.9 2.9 0 0 0 8 20z"/>'),
    post:SVG('<path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h4"/>'),
    salg:SVG('<path d="M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z"/><circle cx="7.5" cy="11" r=".8" fill="#fff"/>'),
    redning:SVG('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.8"/><path d="M6 6l3.3 3.3M18 6l-3.3 3.3M6 18l3.3-3.3M18 18l-3.3-3.3"/>'),
    fartoy:SVG('<path d="M3 15h18l-2.5 4.5H6z"/><path d="M8 15V9h6l2 6"/><path d="M11 9V5"/><path d="M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"/>'),
    utstyr:SVG('<path d="M14.5 5.5a4 4 0 0 0-5 5L3.8 16.2a1.8 1.8 0 0 0 2.5 2.5l5.7-5.7a4 4 0 0 0 5-5l-2.5 2.5-2.3-.5-.5-2.3z"/>'),
    bors:SVG('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><path d="M12.5 14.4c.9-.3 2.2-.4 3.5-.4 2.7 0 4.9 1.7 5.5 5"/>'),
    mannskap:SVG('<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c.5-3.5 3-5 5.5-5s5 1.5 5.5 5"/><path d="M14.5 14.2c2.8-.4 5.4.8 6.3 4.8"/>'),
    bank:SVG('<path d="M3 9l9-5 9 5"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 19.5h18"/>'),
    meld:SVG('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    verksted:SVG('<path d="M4 20l7-7"/><path d="M13.5 4.5l6 6-3 3-6-6z"/><path d="M10.5 7.5l6 6"/><path d="M3 21l2-2"/>'),
    havn:SVG('<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M8 10h8"/>'),
    last:SVG('<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>'),
    logg:SVG('<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
    rederi:SVG('<path d="M4 20V10l6-3v13"/><path d="M10 20V5l9 4v11"/><path d="M2 20h20"/><path d="M13 10h3M13 13h3M13 16h3M6 13h2M6 16h2"/>'),
    redskap:SVG('<circle cx="12" cy="16" r="4.5"/><path d="M12 11.5V3l5 2-5 2"/><path d="M3 21c3-1.5 6-1.5 9 0s6 1.5 9 0"/>'),
    sjomann:SVG('<circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M5.6 18.4l2.9-2.9M15.5 8.5l2.9-2.9"/>'),
    merker:SVG('<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 3l2 6.4M15.5 3l-2 6.4"/><path d="M12 11.6l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>'),
    notat:SVG('<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M4 7h4M4 12h4M4 17h4"/><path d="M11 8h4M11 11.5h4"/>'),
    sesong:SVG('<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M7 14c2-2 4 2 6 0s3-1 4 0"/>'),
    folk:SVG('<circle cx="9" cy="8" r="3"/><path d="M3.5 20c.6-3.6 2.8-5.5 5.5-5.5s4.9 1.9 5.5 5.5"/><path d="M15 5.5a3 3 0 0 1 0 5.6"/><path d="M17 14.8c2 .6 3.2 2.4 3.6 5.2"/>'),
    ordl:SVG('<path d="M8.5 3.5h7v3h-7z"/><path d="M8 5H5v16h14V5h-3"/><path d="M8 11l1.5 1.5L12 10M8 16l1.5 1.5L12 15M14 11h3M14 16h3"/>'),
    regler:SVG('<path d="M6 3h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z"/><path d="M6 17a2 2 0 0 1 2-2h11"/><path d="M9.5 8.6l1.8 1.8L15 6.7"/>'),
    kvote:SVG('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 2.6A9 9 0 0 1 21.4 9H15z"/>'),
    trim:SVG('<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4-5"/><circle cx="12" cy="15" r="1.6"/><path d="M6 19h12"/>'),
    kaiboden:SVG('<path d="M4 10h16l-1.6-5H5.6z"/><path d="M5 10v9h14v-9"/><path d="M10 19v-5h4v5"/>'),
    skip:SVG('<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M8 7h8M8 17h8M11 11l2 1-2 1"/>'),
    patch:SVG('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 15.5h7M9 19h4"/>'),
    handbok:SVG('<path d="M5 4h6a2 2 0 0 1 2 2v14a1.5 1.5 0 0 0-1.5-1.5H5z"/><path d="M19 4h-6a2 2 0 0 0-2 2v14a1.5 1.5 0 0 1 1.5-1.5H19z"/><path d="M7.5 8.5h3M7.5 11.5h3M13.5 8.5h3"/>'),
    garderobe:SVG('<path d="M12 6.5a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1"/><path d="M12 11.5L3.5 17a1 1 0 0 0 .6 1.8h15.8a1 1 0 0 0 .6-1.8z"/>'),
    tilbake:SVG('<path d="M4 5h16v11H10l-4.5 4V16H4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    innst:SVG('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    admin:SVG('<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M14.5 6.5L17 4l3 3-2.5 2.5"/><path d="M5 3l3 3M3 5l3 3"/>')};
  const APPS = [['vaer', 'Vær', 'Weather', '#2f7fd0'], ['post', 'Kystposten', 'Coast Post', '#b8402f'], ['meld', 'Meldinger', 'Messages', '#29a36a'], ['rederi', 'Rederi', 'Company', '#1f4e79'], ['salg', 'Salgslaget', 'Sales', '#1e8c6e'], ['kvote', 'Kvote', 'Quota', '#8a6a1c'], ['regler', 'Regler', 'Rules', '#2d6a4f'], ['drift', 'Driftsplan', 'Operations plan', '#2a6f97'], ['ordl', 'Oppdrag', 'Orders', '#2e7d4f'], ['nett', 'Nettet', 'The Net', '#2a5d8a'], ['kaiboden', 'Kaiboden', 'Kaiboden', '#8a5a2b'], ['haill', 'Haill', 'Luck', '#c9a227'], ['sesong', 'Sesong', 'Season', '#1e6f8c'], ['guide', 'Fiskeguide', 'Fish guide', '#177a8a'], ['folk', 'Venner', 'Friends', '#8a5a2b'], ['merker', 'Milepæler', 'Milestones', '#b0752a'], ['redning', 'Redning', 'Rescue', '#e0562b'], ['trim', 'Trim', 'Tuning', '#b3261e'], ['handbok', 'Håndboka', 'Handbook', '#3b6b5e'], ['garderobe', 'Garderoben', 'Wardrobe', '#6b4f8f'], ['patch', 'Patchnotes', 'Patch notes', '#5a4fa3'], ['tilbake', 'Tilbakemelding', 'Feedback', '#d0672f'], ['innst', 'Innstillinger', 'Settings', '#4a5560'], ['admin', 'Admin', 'Admin', '#7a2e8f']];
  // Kaiboden (Jonas 12.10.2026): haill, trim and Skippertak in one app, a tab each; the tabs are the old apps' pages, so a link to the
  // Haill or the Trim app (the first trip's guide, the handbook, the tests) opens Kaiboden on that tab
  const KBT = ['haill', 'trim', 'skip'];
  let kbLast = 'haill';
  const kbTabs = a => '<div class="kb-tabs">' + [['haill', 'Haill', 'Luck'], ['trim', 'Trim', 'Tuning'], ['skip', 'Skippertak', 'Skippertak']].map(([k, no, en]) => '<button class="kb-tab' + (k === a ? ' on' : '') + '" data-pa="open" data-a="' + k + '">' + L(no, en) + '</button>').join('') + '</div>';
  // the most for the money (Jonas 12.10.2026): the biggest of each, and it is true of each (tests/skiptest.py checks it)
  const kbBest = () => ' <span class="kb-best">' + L('Mest for pengene', 'Best value') + '</span>';
  const unread = () => S.msgs.filter(m => !m.read).length;
  // the Rederi app comes with the company: founded as an AS in the bank (Jonas 06.10.2026), or already more than one vessel
  // the Company app opens with a fleet to run: a company, more than one vessel, or crew aboard (Økonomi 2, Ø1, 27.10.2026; before it
  // opened only with the AS or a second vessel, Jonas 09.10.2026, which tied the fleet to the company form)
  const rederiOpen = () => S.form === 'AS' || (S.fleet && S.fleet.length > 1) || (S.fleet || []).some(v => (vget(v, 'crew') || []).length > 0);
  function setBadge(){ const n = unread(); for (const bd of [badge, $('phoneBadge2')]){ bd.hidden = !n; bd.textContent = n; } }
