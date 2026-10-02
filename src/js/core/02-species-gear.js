// Placeholder prices (NOK/kg, grade A) – to be tuned
// Species data. av: monthly availability (1 = normal month, damped from 2025 landings); pm: market price, NOK per kg round weight,
// from 2025 fresh landings (Troms for cod/haddock/saithe, national for the rest; cod scaled to the 2026 price level);
// cls: size classes by round weight [from kg, minimum price NOK/kg round, label, hook premium] from Råfisklaget's minimum prices;
// uh: kg round weight per kg gutted without head; size: [median kg, log-spread]; minKg: minimum legal size (released below).
const SPECIES = {
  torsk:{no:'Torsk', en:'Cod', k:0.37, base:1.0, prod:0.6, dep:[70, 1.0], av:[1,1,1,1,1,1,1,1,1,1.1,1.1,1], skrei:[0.6,2.0,2.5,0.8,0,0,0,0,0,0,0,0.1],
    pm:[52.6,55.0,54.5,52.9,43.7,42.4,39.9,42.0,43.3,51.5,51.7,50.9], sig:0.04, size:[2.0, 0.55], skreiSize:[5.0, 0.4], minKg:0.8, uh:1.5, liver:6.5, roe:10,
    cls:[[9, 45.33, 'Over 9 kg'], [6, 43.67, '6–9 kg'], [3.7, 42.00, '3,7–6 kg'], [1.5, 40.33, '1,5–3,7 kg'], [0, 38.67, 'Under 1,5 kg']], ref:2},
  hyse:{no:'Hyse', en:'Haddock', k:0.3, base:0.55, prod:0.62, dep:[110, 0.9], av:[1.7,2.0,1.4,0.7,0.6,0.6,0.8,0.6,0.8,1.0,0.9,0.8],
    pm:[26.4,26.8,25.4,26.8,27.4,26.6,22.9,23.7,28.9,30.1,32.3,32.6], sig:0.03, size:[1.3, 0.4], minKg:0.5, uh:1.4, liver:3.5, roe:7,
    cls:[[1.1, 20.95, 'Over 1,1 kg', 1.128], [0.8, 18.09, '0,8–1,1 kg'], [0, 3.51, 'Under 0,8 kg']], ref:0},
  sei:{no:'Sei', en:'Saithe', k:0.6, base:0.8, prod:0.5, dep:[45, 1.2], av:[2.1,0.9,0.5,0.6,2.1,1.0,0.6,0.6,0.8,0.7,1.1,1.0],
    pm:[21.2,22.4,21.9,20.7,17.6,18.0,17.0,19.1,22.7,24.4,26.2,26.9], sig:0.07, size:[2.0, 0.55], minKg:0.35, uh:1.35, liver:3.5, roe:7,
    cls:[[3.1, 20.51, 'Over 3,1 kg'], [1.6, 19.77, '1,6–3,1 kg'], [0.7, 18.22, '0,7–1,6 kg'], [0, 11.00, 'Under 0,7 kg']], ref:1},
  lyr:{no:'Lyr', en:'Pollack', k:0.3, base:0.12, prod:0.35, dep:[40, 0.9], av:[1.4,1.2,1.6,2.0,1.1,0.6,0.5,0.6,0.9,0.7,0.7,0.7],
    pm:[21.4,21.4,20.7,21.4,23.6,24.3,25.0,25.0,25.0,27.9,27.9,27.1], sig:0.03, size:[2.2, 0.4], minKg:0.5, uh:1.4,
    cls:[[2.8, 21.43, 'Over 2,8 kg'], [1.4, 17.14, '1,4–2,8 kg'], [0, 7.14, 'Under 1,4 kg']], ref:1},
  lange:{no:'Lange', en:'Ling', k:0.3, base:0.18, prod:0.65, dep:[250, 0.7], av:[1.0,1.0,1.3,1.6,2.0,1.0,0.5,0.6,0.9,0.7,0.8,0.6],
    pm:[12.9,12.9,13.6,13.6,15.0,14.3,13.6,12.9,13.6,14.3,15.7,15.7], sig:0.03, size:[4.0, 0.5], minKg:0.8, uh:1.4,
    cls:[[2.8, 13.57, 'Over 2,8 kg'], [1.0, 8.57, '1–2,8 kg'], [0, 4.30, 'Under 1 kg']], ref:0},
  brosme:{no:'Brosme', en:'Tusk', k:0.35, base:0.2, prod:0.65, dep:[220, 0.7], av:[1.1,1.1,1.0,0.9,0.8,0.9,0.6,0.7,1.1,1.1,1.5,1.2],
    pm:[12,12,13,12,13,12,11,12,12,12,13,14], sig:0.03, size:[2.2, 0.4], minKg:0.5, uh:1.4,
    cls:[[1.4, 8.57, 'Over 1,4 kg'], [0, 2.86, 'Under 1,4 kg']], ref:0},
  uer:{no:'Uer', en:'Redfish', k:0.5, base:0.1, prod:0.7, dep:[200, 0.7], av:[0.8,0.7,1.0,0.8,0.9,1.1,0.7,1.1,1.4,1.6,1.1,0.7],
    pm:[15,14,16,18,19,15,14,17,16,17,18,17], sig:0.03, size:[1.0, 0.35], minKg:0.3, uh:1,
    cls:[[0.7, 13.25, 'Over 0,7 kg'], [0, 7.00, 'Under 0,7 kg']], ref:0},
  kveite:{no:'Kveite', en:'Halibut', k:0.35, base:0.05, prod:0.7, dep:[120, 0.9], av:[0.6,0.6,0.6,0.7,0.8,0.8,0.6,0.9,1.5,1.3,1.7,1.8],
    pm:[64.6,63.7,65.5,77.9,87.6,91.2,90.3,93.8,84.1,91.2,98.2,100.9], sig:0.03, size:[12, 0.8], minKg:7.2, maxKg:100, uh:1.13,
    cls:[[67.8, 50.4, 'Over 60 kg'], [45.2, 59.3, '40–60 kg'], [22.6, 68.1, '20–40 kg'], [0, 72.6, '5,3–20 kg']], ref:3},
  // brown crab (taskekrabbe): caught in pots and landed alive, sorted into female and male with both big claws on (Råfisklaget prices
  // them that way); carapace width decides the legal size, 13 cm north of 59°30' (høstingsforskriften kap. X). The season is July–October
  // (spec) and there is most crab south of Senja (IMR 2023–24). Prices are placeholders until Råfisklaget's circular 8/2025 is read.
  // cw: carapace width in cm [median, log-spread]; weight kg = 0.00018 × cw³ (13 cm ≈ 0.4 kg; a start value)
  krabbe:{no:'Taskekrabbe', en:'Brown crab', shell:true, live:true, k:0.5, base:0.6, prod:0.3, dep:[20, 0.8], av:[0.05,0.05,0.05,0.1,0.15,0.3,0.8,1.2,1.4,1.2,0.4,0.1],
    pm:[15,15,15,15,15,15,15,15,16,17,17,16], sig:0.03, size:[0.6, 0.3], cw:[14.6, 0.09], minCw:13, minKg:0, uh:1,
    cls:[[0, 17, 'Hunnkrabbe'], [0, 14, 'Hannkrabbe'], [0, 0, 'Under 13 cm'], [0, 0, 'Rognkrabbe']], ref:1}
};
// fish are caught by jig, rod, line and net; shellfish only in pots. Everything that loops over fish uses SP; ALLSP adds the shellfish last,
// so the per-species seeds (SP.indexOf) keep their values
const SP = Object.keys(SPECIES).filter(sp => !SPECIES[sp].shell), SHELL = Object.keys(SPECIES).filter(sp => SPECIES[sp].shell), ALLSP = SP.concat(SHELL);
// ---------- vessels, equipment, crew ----------
// The vessels, from the open starter boat to the ocean fleet. Every rule reads these fields, never the key:
//  len, beam, draft (m), disp (displacement loaded, tonnes; an estimate), holdCap, iceCap (kg), fuelCap (L), hp, vmax, vcruise (kn),
//  accel (kn a minute), turnR (m, 3D), planing, outboard, diesel, fuelK, risk [hs warn, hs danger, wind warn, wind danger], sea (speed
//  lost per m of wave), crewMax (besides you), berths (bunks where the crew can rest at sea; none means only the quay counts as rest),
//  tubCap (bleeding tub, kg), land ('box' or 'tub'), std (equipment it comes with), rigs (the kinds of fishing it can be rigged for),
//  jukseMax, gearMax, svcH (engine hours between services), svcCost, svcJobH (yard hours), cls ('open', 'kyst' or 'hav': the market
//  tab), price, isNew (built to order), year, desc.
const VESSELS = {
  skiff:{name:{no:'Åpen plastbåt 19 fot, 60 hk påhengs', en:'Open 19 ft fibreglass boat, 60 hp outboard'}, len:5.8, beam:2.2, draft:0.6, disp:1.0, holdCap:350, iceCap:150, fuelCap:90, hp:60, engine:{no:'60 hk påhengsmotor, bensin', en:'60 hp petrol outboard'},
    vmax:24, vcruise:18, accel:10, turnR:35, planing:true, outboard:true, diesel:false, fuelK:1, risk:[1.0, 1.8, 10.8, 13.9], sea:0.45, crewMax:1, berths:0, tubCap:60, land:'box', std:[],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:2, gearMax:{garn:6, stamp:4, teine:20}, svcH:100, svcCost:3500, svcJobH:3, cls:'open', price:95000, year:2008,
    desc:{no:'Åpen plastbåt med konsoll og påhengsmotor. Rask og billig, men liten og våt i sjøgang.', en:'Open fibreglass boat with a console and an outboard. Fast and cheap, but small and wet in a sea.'}},
  trebat:{name:{no:'Gammel tresnekke 22 fot, 10 hk Sabb', en:'Old 22 ft wooden snekke, 10 hp Sabb'}, len:6.7, beam:2.2, draft:0.9, disp:1.8, holdCap:500, iceCap:200, fuelCap:40, hp:10, engine:{no:'Sabb 10 hk, én sylinder', en:'Sabb 10 hp, single cylinder'},
    vmax:6.5, vcruise:5.5, accel:2, turnR:30, planing:false, outboard:false, diesel:true, fuelK:0.25, risk:[1.2, 2.0, 11, 14.5], sea:0.3, crewMax:1, berths:0, tubCap:80, land:'box', std:[],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:2, gearMax:{garn:8, stamp:6, teine:30}, svcH:150, svcCost:2500, svcJobH:4, cls:'open', price:60000, year:1962,
    desc:{no:'Åpen, spissgattet tresnekke med motorkasse midtskips og rorkult. Treg og billig, og bunken kjenner hver bølge.', en:'Open double-ended wooden snekke with the engine box amidships and a tiller. Slow and cheap, and she feels every wave.'}},
  snekke:{name:{no:'Plastsnekke 26 fot, 30 hk diesel', en:'26 ft fibreglass snekke, 30 hp diesel'}, len:7.9, beam:2.7, draft:1.2, disp:3.0, holdCap:900, iceCap:400, fuelCap:220, hp:30, engine:{no:'30 hk innenbords diesel', en:'30 hp inboard diesel'},
    vmax:8, vcruise:7, accel:3, turnR:45, planing:false, outboard:false, diesel:true, fuelK:0.45, risk:[1.5, 2.5, 12.5, 16], sea:0.22, crewMax:2, berths:0, tubCap:150, land:'box', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:3, gearMax:{garn:15, stamp:10, teine:50}, svcH:250, svcCost:6000, svcJobH:5, cls:'open', price:245000, year:1994,
    desc:{no:'Spissgattet plastsnekke med lite styrhus. Sparsommelig og sjøsterk for størrelsen.', en:'Double-ended fibreglass snekke with a small wheelhouse. Economical and seaworthy for her size.'}},
  jukesjark:{name:{no:'Plastsjark 29 fot (8,9 m), jukse og garn', en:'29 ft fibreglass sjark (8.9 m), jigging and nets'}, len:8.9, beam:3.2, draft:1.2, disp:5.5, holdCap:1800, iceCap:700, fuelCap:400, hp:150, engine:{no:'150 hk diesel', en:'150 hp diesel'},
    vmax:10, vcruise:8.5, accel:3, turnR:50, planing:false, outboard:false, diesel:true, fuelK:0.8, risk:[1.8, 2.9, 13.5, 17], sea:0.19, crewMax:2, berths:2, tubCap:200, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:4, gearMax:{garn:25, stamp:14, teine:80}, svcH:250, svcCost:9000, svcJobH:6, cls:'open', price:750000, year:1998,
    desc:{no:'Plastsjark med styrhus akter og to køyer i baugen. Plass til fire juksamaskiner og et lite garnlag.', en:'Fibreglass sjark with the wheelhouse aft and two bunks forward. Room for four jigging reels and a small fleet of nets.'}},
  sjark:{name:{no:'Havsjark 35 fot (10,6 m) med bakk og styrhus', en:'35 ft havsjark (10.6 m) with forecastle and wheelhouse'}, len:10.57, beam:4.1, draft:1.6, disp:12, holdCap:6500, iceCap:2000, fuelCap:900, hp:180, engine:{no:'180 hk diesel', en:'180 hp diesel'},
    vmax:10, vcruise:8.5, accel:3, turnR:70, planing:false, outboard:false, diesel:true, fuelK:1.25, risk:[2.5, 3.8, 15, 19], sea:0.14, crewMax:3, berths:2, tubCap:300, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:5, gearMax:{garn:40, stamp:24, teine:150}, svcH:250, svcCost:14000, svcJobH:8, cls:'open', price:1150000, year:1985,
    desc:{no:'Tung og sjøsterk havsjark (Viksund 35) med styrhus midtskips på en kort bakk, lasterom og redskapsrom akter og styttesegl på aktermasten. Rommet tar 6,5 tonn. Fisker med det meste.', en:'A heavy, seaworthy havsjark (Viksund 35) with the wheelhouse amidships on a short forecastle, the hold and a gear room aft and a riding sail on the mizzen. The hold takes 6.5 tonnes. Fishes with most gear.'}},
  hurtigsjark:{name:{no:'Brukt hurtigsjark 10,99 m, 500 hk', en:'Used 10.99 m speed sjark, 500 hp'}, len:10.99, beam:3.9, draft:1.6, disp:12, holdCap:5000, iceCap:1600, fuelCap:1500, hp:500, engine:{no:'500 hk diesel', en:'500 hp diesel'},
    vmax:22, vcruise:17, accel:9, turnR:75, planing:true, outboard:false, diesel:true, fuelK:4.2, risk:[2.3, 3.6, 14.8, 18.5], sea:0.15, crewMax:3, berths:2, tubCap:350, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:6, gearMax:{garn:50, stamp:26, teine:180}, svcH:300, svcCost:18000, svcJobH:9, cls:'open', price:4900000, year:2009,
    desc:{no:'Planende sjark i glassfiber med styrhus forut. Rask til feltet og hjem igjen, men tørst.', en:'Planing fibreglass sjark with the wheelhouse forward. Fast to the grounds and home again, but thirsty.'}},
  sjarkny:{name:{no:'Ny hurtigsjark 10,99 m, 650 hk', en:'New 10.99 m speed sjark, 650 hp'}, len:10.99, beam:4.3, draft:1.8, disp:15, holdCap:7000, iceCap:2400, fuelCap:2000, hp:650, engine:{no:'650 hk diesel', en:'650 hp diesel'},
    vmax:25, vcruise:20, accel:10, turnR:80, planing:true, outboard:false, diesel:true, fuelK:5.5, risk:[2.4, 3.8, 15, 19], sea:0.14, crewMax:3, berths:3, tubCap:400, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:6, gearMax:{garn:60, stamp:30, teine:200}, svcH:300, svcCost:22000, svcJobH:10, cls:'open', price:10500000, isNew:true, year:2027,
    desc:{no:'Nybygd hurtigsjark fra verftet i Finnsnes, med styrhus forut og stort arbeidsdekk. Planende skrog og stor motor.', en:'Newly built speed sjark from the yard in Finnsnes, wheelhouse forward and a big working deck. Planing hull and a big engine.'}},
  // drawn after the 36-foot Malo sjark (general arrangement and data sheet from Jemar Norpower): 10.99 x 4.20 m (4.40 over the
  // fenders), depth 2.34 m, hold 19 m3, fuel 3.4 m3, 300 hp, about 10 kn; the 3D model is the detailed GLB from tools/boats/malo36.py
  breisjark:{name:{no:'Sjark 36 fot med bakk og ly', en:'36 ft sjark with forecastle and shelter'}, len:10.99, beam:4.2, draft:2.0, disp:20, holdCap:10000, iceCap:2500, fuelCap:3400, hp:300, engine:{no:'300 hk diesel, seks sylindre', en:'300 hp six-cylinder diesel'},
    vmax:10.5, vcruise:9.5, accel:2.5, turnR:80, planing:false, outboard:false, diesel:true, fuelK:1.6, risk:[2.6, 4.0, 15, 19], sea:0.13, crewMax:4, berths:4, tubCap:450, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:6, gearMax:{garn:100, stamp:36, teine:350}, svcH:300, svcCost:22000, svcJobH:12, cls:'open', price:9000000, year:2015,
    desc:{no:'Den klassiske kystsjarken på 36 fot: høy baug med bakk, styrhus med panoramavinduer, ly over garnhaleren og lasterom på 19 kubikk. Sjødyktig og solid, med to lugarer.', en:'The classic 36-foot coastal sjark: a high bow with a forecastle, a wheelhouse with panoramic windows, a shelter over the net hauler and a 19 m3 hold. Seaworthy and solid, with two cabins.'}},
  kyst15:{name:{no:'Kystbåt 14,99 m med lugarer', en:'14.99 m coastal vessel with cabins'}, len:14.99, beam:6.6, draft:3.0, disp:75, holdCap:28000, iceCap:8000, fuelCap:9000, hp:750, engine:{no:'750 hk diesel', en:'750 hp diesel'},
    vmax:11.5, vcruise:10, accel:2, turnR:110, planing:false, outboard:false, diesel:true, fuelK:3.5, risk:[3.3, 4.8, 17, 21.5], sea:0.1, crewMax:5, berths:6, tubCap:800, land:'tub', std:['plotter', 'vhf', 'ais'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:8, gearMax:{garn:160, stamp:60, teine:500}, svcH:400, svcCost:45000, svcJobH:16, cls:'kyst', price:18000000, year:2012,
    desc:{no:'Kystbåt bygd til de magiske 15 meterne, med baksdekk, styrhus forut, haleport og lugarer til seks. Krever hjemmel i lukket gruppe.', en:'Coastal vessel built to the magic 15 metres, with a shelter deck, the wheelhouse forward, a hauling port and cabins for six. Needs a closed-group licence.'}},
  kyst21:{name:{no:'Eldre kystbåt 21 m, garn og line', en:'Older 21 m coastal vessel, nets and line'}, len:21, beam:7.2, draft:3.4, disp:190, holdCap:55000, iceCap:15000, fuelCap:25000, hp:900, engine:{no:'900 hk diesel', en:'900 hp diesel'},
    vmax:11, vcruise:10, accel:1.5, turnR:150, planing:false, outboard:false, diesel:true, fuelK:5, risk:[3.8, 5.5, 18, 23], sea:0.08, crewMax:6, berths:8, tubCap:1200, land:'tub', std:['plotter', 'vhf', 'ais'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:8, gearMax:{garn:300, stamp:120, teine:800}, svcH:400, svcCost:70000, svcJobH:24, cls:'kyst', price:9000000, year:1978,
    desc:{no:'Stålbåt fra 70-tallet med bakk, rundgatt og galge. Fra 15 meter kan hun ikke fiske innenfor fjordlinja.', en:'Steel boat from the 70s with a forecastle, a cruiser stern and a gallows. From 15 metres she may not fish inside the fjord line.'}},
  // the ocean fleet: shown in the market with the full spec, bought when the ocean grounds open (west of today's chart)
  snokrabbe:{name:{no:'Snøkrabbefartøy 50 m med fryseri', en:'50 m snow crab vessel with a freezing plant'}, len:50, beam:11, draft:6, disp:1800, holdCap:500000, iceCap:0, fuelCap:350000, hp:3600, engine:{no:'3 600 hk diesel', en:'3,600 hp diesel'},
    vmax:13.5, vcruise:11, accel:1, turnR:300, planing:false, outboard:false, diesel:true, fuelK:40, risk:[6, 9, 24, 30], sea:0.04, crewMax:14, berths:18, tubCap:2000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:['teiner'], jukseMax:0, gearMax:{garn:0, stamp:0, teine:7000}, svcH:600, svcCost:400000, svcJobH:72, cls:'hav', price:60000000, year:2001, lock:true,
    crew:{key:['skipper', 'styrmann', 'maskinsjef', '2. maskinist', 'kokk', 'bas'], teams:[{role:'dekk', n:4}, {role:'fabrikk', n:4}], rot:2},
    desc:{no:'Teinefartøy for snøkrabbe i Barentshavet, med fryseri om bord. Krever snøkrabbetillatelse.', en:'Pot vessel for snow crab in the Barents Sea, with a freezing plant aboard. Needs a snow crab licence.'}},
  autoliner:{name:{no:'Autoliner 45 m med frysing', en:'45 m autoliner with freezing'}, len:45, beam:10.5, draft:6, disp:1500, holdCap:400000, iceCap:0, fuelCap:300000, hp:3000, engine:{no:'3 000 hk diesel', en:'3,000 hp diesel'},
    vmax:13, vcruise:11, accel:1, turnR:280, planing:false, outboard:false, diesel:true, fuelK:35, risk:[6, 9, 24, 30], sea:0.04, crewMax:14, berths:16, tubCap:2000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:['line'], jukseMax:0, gearMax:{garn:0, stamp:0, teine:0}, autoHooks:40000, svcH:600, svcCost:350000, svcJobH:72, cls:'hav', price:70000000, priceNew:300000000, year:1999, lock:true,
    crew:{key:['skipper', 'styrmann', 'maskinsjef', '2. maskinist', 'kokk', 'bas'], teams:[{role:'dekk', n:4}, {role:'fabrikk', n:4}], rot:2},
    desc:{no:'Linebåt med egnemaskin som setter og trekker 40 000 kroker i døgnet, og fryser fisken om bord. Krever konsesjon for konvensjonelle havfiskefartøy.', en:'Longliner with a baiting machine that sets and hauls 40,000 hooks a day and freezes the catch aboard. Needs a licence for conventional ocean vessels.'}},
  bunntral:{name:{no:'Frysetråler 62 m med akterslipp', en:'62 m freezer trawler with a stern ramp'}, len:62, beam:14, draft:6.5, disp:3000, holdCap:800000, iceCap:0, fuelCap:700000, hp:8000, engine:{no:'8 000 hk diesel', en:'8,000 hp diesel'},
    vmax:15, vcruise:12, accel:0.8, turnR:400, planing:false, outboard:false, diesel:true, fuelK:90, risk:[7, 10, 26, 33], sea:0.03, crewMax:25, berths:30, tubCap:3000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:[], jukseMax:0, gearMax:{garn:0, stamp:0, teine:0}, svcH:800, svcCost:900000, svcJobH:120, cls:'hav', price:150000000, priceNew:500000000, year:2004, lock:true,
    crew:{key:['skipper', 'styrmann', '2. styrmann', 'maskinsjef', '2. maskinist', 'elektriker', 'kokk', 'stuert', 'fabrikksjef'], teams:[{role:'dekk', n:4}, {role:'fabrikk', n:6}, {role:'fabrikk', n:6}], rot:2},
    desc:{no:'Bunntråler for torsk, hyse, sei og uer, med fabrikk og fryselager. Krever torsketrålkonsesjon.', en:'Bottom trawler for cod, haddock, saithe and redfish, with a factory and a freezer hold. Needs a cod trawl licence.'}},
  pelagisk:{name:{no:'Ringnot- og pelagisk tråler 75 m', en:'75 m purse seiner and pelagic trawler'}, len:75, beam:15.5, draft:7.5, disp:5000, holdCap:2000000, iceCap:0, fuelCap:650000, hp:9000, engine:{no:'9 000 hk diesel', en:'9,000 hp diesel'},
    vmax:17, vcruise:14, accel:0.8, turnR:450, planing:false, outboard:false, diesel:true, fuelK:100, risk:[7, 10, 26, 33], sea:0.03, crewMax:12, berths:16, tubCap:3000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:[], jukseMax:0, gearMax:{garn:0, stamp:0, teine:0}, svcH:800, svcCost:900000, svcJobH:120, cls:'hav', price:250000000, priceNew:800000000, year:2010, lock:true,
    crew:{key:['skipper', 'styrmann', 'maskinsjef', '2. maskinist', 'kokk'], teams:[{role:'dekk', n:7}], rot:1},
    desc:{no:'Ringnotsnurper og pelagisk tråler for sild, makrell og kolmule, med kjølte sjøvannstanker (RSW). Krever ringnotkonsesjon.', en:'Purse seiner and pelagic trawler for herring, mackerel and blue whiting, with refrigerated sea water tanks (RSW). Needs a purse seine licence.'}}
};
const BOAT = Object.assign({}, VESSELS.skiff);
const PRICE = {fuel:23.9, diesel:14.5, ice:1.5, iceBag:2.0, gear:1900, kgear:2490, tow:4500, rescue:6000, member:1250};
const fuelPrice = () => BOAT.diesel ? PRICE.diesel : PRICE.fuel;
const EQUIP = {
  vhf:{price:6500, name:{no:'VHF-radio', en:'VHF radio'}, desc:{no:'Kulingvarsel fra kystradioen og nødanrop uten mobildekning.', en:'Gale warnings from coast radio and distress calls without mobile coverage.'}},
  ais:{price:4900, name:{no:'AIS-sender (klasse B)', en:'AIS transponder (class B)'}, desc:{no:'Andre båter og redningstjenesten ser deg på AIS. Raskere hjelp ved nød.', en:'Other boats and the rescue service see you on AIS. Faster help in an emergency.'}},
  plotter:{price:24900, name:{no:'Kartplotter 9" med dybdekart', en:'9" chart plotter with depth charts'}, desc:{no:'Plottervisning med dybdefarger, relieff og dybdekurver.', en:'Plotter view with depth colours, relief and contours.'}},
  chirp:{price:13900, name:{no:'CHIRP-ekkolodd', en:'CHIRP sounder'}, desc:{no:'Skarpere fiskeekko og bedre skille like over bunnen. Viser fisken 0,75 nm rundt båten i kartet, og du kan velge art.', en:'Sharper fish echoes and better separation near the bottom. Shows the fish 0.75 nm around the boat on the chart, and you can choose the species.'}},
  // a searchlight sonar on a hoist through the hull (start price: the parts of a Furuno CH-37BB are about 13 200 USD, before fitting)
  sonar:{price:150000, fit:{minLen:10}, name:{no:'Sonar (søkelys)', en:'Searchlight sonar'}, desc:{no:'Ser fisken 1,5 nm rundt båten, skiller torsk, hyse og sei og viser hvor stimene trekker. Monteres med senkerør gjennom skroget.', en:'Sees the fish 1.5 nm around the boat, tells cod, haddock and saithe apart and shows where the schools are heading. Fitted with a hoist through the hull.'}},
  jukse:{price:34000, multi:true, name:{no:'Juksamaskin', en:'Electric jigging reel'}, desc:{no:'Fisker omtrent dobbelt så mye som håndjuksa. Én person kan passe tre.', en:'Catches about twice as much as a hand jig. One person can tend three.'}},
  motor90:{price:148000, fit:{outboard:true}, boost:{vmax:30, fuelK:1.35}, name:{no:'Påhengsmotor 90 hk', en:'90 hp outboard'}, desc:{no:'Toppfart 30 knop, men tørstere.', en:'Top speed 30 knots, but thirstier.'}},
  // haulers for passive gear (start prices): without one, nets and line come up by hand, slowly, and big pots cannot be hauled at all
  elhaler:{price:38000, fit:{maxLen:8.5}, name:{no:'Elektrisk haler (12 V)', en:'Electric hauler (12 V)'}, desc:{no:'Trekker line og små teiner. Passer små båter.', en:'Hauls line and small pots. Suits small boats.'}},
  linehaler:{price:68000, fit:{minLen:7.5}, name:{no:'Hydraulisk linehaler', en:'Hydraulic line hauler'}, desc:{no:'Trekker lina jevnt og raskt.', en:'Hauls the line steadily and fast.'}},
  garnhaler:{price:95000, fit:{minLen:7.5}, name:{no:'Hydraulisk garnhaler', en:'Hydraulic net hauler'}, desc:{no:'Trekker garna. For hånd går det sakte.', en:'Hauls the nets. By hand it is slow.'}},
  teinehaler:{price:58000, fit:{minLen:7.5}, name:{no:'Teinehaler med davit', en:'Pot hauler with davit'}, desc:{no:'Hiver teinene opp. Store teiner kan ikke trekkes for hånd.', en:'Lifts the pots. Big pots cannot be hauled by hand.'}}
};
// whether an item fits a vessel type: by length, and outboards only on boats with an outboard
function equipFits(k, type){ const f = EQUIP[k] && EQUIP[k].fit, V = VESSELS[type]; if (!f || !V) return !!V; return !(f.minLen && V.len < f.minLen) && !(f.maxLen && V.len > f.maxLen) && !(f.outboard && !V.outboard); }
