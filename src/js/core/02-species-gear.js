// Placeholder prices (NOK/kg, grade A) – to be tuned
// Species data. av: monthly availability (1 = normal month, damped from 2025 landings); pm: market price, NOK per kg round weight,
// from 2025 fresh landings (Troms for cod/haddock/saithe, national for the rest; cod scaled to the 2026 price level);
// cls: size classes by round weight [from kg, minimum price NOK/kg round, label, hook premium] from Råfisklaget's minimum prices;
// uh: kg round weight per kg gutted without head (the official conversion factors, docs/planer/havsteget-h2-autoline.md 2b: the
// Norwegian-Russian table for 2023 for cod, haddock and Greenland halibut, the Norwegian one with J-128-2018 for the rest; H2b 05.11.2026); size: [median kg, log-spread]; minKg: minimum legal size (released below).
const SPECIES = {
  torsk:{no:'Torsk', en:'Cod', k:0.376, base:1.0, prod:0.6, dep:[70, 1.0], av:[1,1,1,1,1,1,1,1,1,1.1,1.1,1], skrei:[0.6,2.0,2.5,0.8,0,0,0,0,0,0,0,0.1],
    pmF:[54.3,54.5,53.8,53.5,52.4,52.8,52.9,55.3,58.9,64.1,66.5,60.4], pm:[52.6,55.0,54.5,52.9,43.7,42.4,39.9,42.0,43.3,51.5,51.7,50.9], sig:0.04, size:[2.0, 0.55], skreiSize:[5.0, 0.4], minKg:0.8, uh:1.5, liver:6.5, roe:10,
    cls:[[9, 45.33, 'Over 9 kg'], [6, 43.67, '6–9 kg'], [3.7, 42.00, '3,7–6 kg'], [1.5, 40.33, '1,5–3,7 kg'], [0, 38.67, 'Under 1,5 kg']], ref:2},
  hyse:{no:'Hyse', en:'Haddock', k:0.297, base:0.55, prod:0.62, dep:[110, 0.9], av:[1.7,2.0,1.4,0.7,0.6,0.6,0.8,0.6,0.8,1.0,0.9,0.8],
    pmF:[43.5,41.9,40.5,39.2,36.9,37.8,37.6,38.0,42.0,47.8,45.7,44.6], pm:[26.4,26.8,25.4,26.8,27.4,26.6,22.9,23.7,28.9,30.1,32.3,32.6], sig:0.03, size:[1.3, 0.4], minKg:0.5, uh:1.4, liver:3.5, roe:7,
    cls:[[1.1, 20.95, 'Over 1,1 kg', 1.128], [0.8, 18.09, '0,8–1,1 kg'], [0, 3.51, 'Under 0,8 kg']], ref:0},
  sei:{no:'Sei', en:'Saithe', k:0.9, base:0.8, prod:0.5, dep:[45, 1.2], av:[2.1,0.9,0.5,0.6,2.1,1.0,0.6,0.6,0.8,0.7,1.1,1.0],
    pmF:[21.8,22.8,22.2,21.5,22.5,23.2,24.2,23.9,24.9,25.2,23.1,22.5], pm:[21.2,22.4,21.9,20.7,17.6,18.0,17.0,19.1,22.7,24.4,26.2,26.9], sig:0.07, size:[2.0, 0.55], minKg:0.35, uh:1.35, liver:3.5, roe:7,
    cls:[[3.1, 20.51, 'Over 3,1 kg'], [1.6, 19.77, '1,6–3,1 kg'], [0.7, 18.22, '0,7–1,6 kg'], [0, 11.00, 'Under 0,7 kg']], ref:1},
  lyr:{no:'Lyr', en:'Pollack', k:0.136, base:0.12, prod:0.35, dep:[40, 0.9], av:[1.4,1.2,1.6,2.0,1.1,0.6,0.5,0.6,0.9,0.7,0.7,0.7],
    pm:[21.4,21.4,20.7,21.4,23.6,24.3,25.0,25.0,25.0,27.9,27.9,27.1], sig:0.03, size:[2.2, 0.4], minKg:0.5, uh:1.4,
    cls:[[2.8, 21.43, 'Over 2,8 kg'], [1.4, 17.14, '1,4–2,8 kg'], [0, 7.14, 'Under 1,4 kg']], ref:1},
  lange:{no:'Lange', en:'Ling', k:0.342, base:0.18, prod:0.65, dep:[250, 0.7], av:[1.0,1.0,1.3,1.6,2.0,1.0,0.5,0.6,0.9,0.7,0.8,0.6],
    pm:[12.9,12.9,13.6,13.6,15.0,14.3,13.6,12.9,13.6,14.3,15.7,15.7], sig:0.03, size:[4.0, 0.5], minKg:0.8, uh:1.4,
    cls:[[2.8, 13.57, 'Over 2,8 kg'], [1.0, 8.57, '1–2,8 kg'], [0, 4.30, 'Under 1 kg']], ref:0},
  brosme:{no:'Brosme', en:'Tusk', k:0.306, base:0.2, prod:0.65, dep:[220, 0.7], av:[1.1,1.1,1.0,0.9,0.8,0.9,0.6,0.7,1.1,1.1,1.5,1.2],
    pm:[12,12,13,12,13,12,11,12,12,12,13,14], sig:0.03, size:[2.2, 0.4], minKg:0.5, uh:1.4,
    cls:[[1.4, 8.57, 'Over 1,4 kg'], [0, 2.86, 'Under 1,4 kg']], ref:0},
  uer:{no:'Uer', en:'Redfish', k:0.337, base:0.1, prod:0.7, dep:[200, 0.7], av:[0.8,0.7,1.0,0.8,0.9,1.1,0.7,1.1,1.4,1.6,1.1,0.7],
    pm:[15,14,16,18,19,15,14,17,16,17,18,17], sig:0.03, size:[1.0, 0.35], minKg:0.3, uh:1.7,
    cls:[[0.7, 13.25, 'Over 0,7 kg'], [0, 7.00, 'Under 0,7 kg']], ref:0},
  kveite:{no:'Kveite', en:'Halibut', k:0.56, base:0.05, prod:0.7, dep:[120, 0.9], av:[0.6,0.6,0.6,0.7,0.8,0.8,0.6,0.9,1.5,1.3,1.7,1.8],
    pm:[64.6,63.7,65.5,77.9,87.6,91.2,90.3,93.8,84.1,91.2,98.2,100.9], sig:0.03, size:[12, 0.8], minKg:7.2, maxKg:100, uh:1.35,
    cls:[[67.8, 50.4, 'Over 60 kg'], [45.2, 59.3, '40–60 kg'], [22.6, 68.1, '20–40 kg'], [0, 72.6, '5,3–20 kg']], ref:3},
  // Greenland halibut (blåkveite, Reinhardtius hippoglossoides; 07.10.2026, tilbakemelding #10; the research and the plan in
  // docs/blakveite.md and docs/plan-blakveite.md). A fish of the shelf edge at 500-1000 m (HI): area 'egga' gives where it is along
  // the coast and its depth window (eggaArea in 03-simulation.js), stk its own stock layer, so cod fishing on the banks does not thin
  // it. Size from the coastal catch of 2026 (Råfisklaget: 4 % under 1 kg, 46 % 1-2 kg, 50 % over 2 kg: median 2 kg, spread 0.4);
  // minKg 0.9 kg is the minimum size of 45 cm (W = 4.06e-6 L^3.245, an East Greenland curve). cls: Råfisklaget's minimum prices for
  // fresh round A, week 27 2026 (46/47/48 kr under 1.2, 1.2-2.4 and over 2.4 kg); pm: 61 kr/kg was the season's mean in 2026, the
  // months around it an estimate. 98 % is landed round; uh 1.3 (round per gutted kg without head) is an estimate. late: its seeds come
  // after the crab's, so no other species' hotspots, day noise and prices move
  blakveite:{no:'Blåkveite', en:'Greenland halibut', late:true, area:'egga', stk:'bstk', jig:0.03, k:0.6, base:0.5, prod:0.6, dep:[700, 0.3],
    av:[0.8,0.8,0.8,0.9,1.1,1.25,1.25,1.15,1.0,0.9,0.85,0.8], pm:[58,58,58,58,60,61,61,62,62,60,58,58], sig:0.04, size:[2.0, 0.4], minKg:0.9, uh:1.32,
    cls:[[2.4, 48, 'Over 2,4 kg'], [1.2, 47, '1,2–2,4 kg'], [0, 46, 'Under 1,2 kg']], ref:1},
  // king crab (kongekrabbe, Paralithodes camtschaticus; the key stays 'krabbe' so saves carry over), the user 04.10.2026: «Det er
  // kongekrabbe som gjelder innen fiskerinæringen». Caught in pots and landed alive: Råfisklaget's minimum prices are for live crab
  // only, and dead crab is 0 kr (sell). West of the line at 26° E the fishing is free (J-138-2026: no quota, no minimum size, all king
  // crab caught must be landed, pots without escape vents); east of it is the quota area for Finnmark's own (J-136-2026, 03e-rules.js).
  // There is next to none in Troms (HI's surveys 2023–2026: 0–0.01 crab a pot), more from Sørøya, most west of Nordkapp (kingArea).
  // cls: Råfisklaget's minimum prices for live crab from 5.10.2026 (kr/kg: male A over 3.2 kg 296, 2.2–3.2 kg 291, 1.6–2.2 kg 246,
  // 0.8–1.6 kg 66 west of 26° E only, female 80, damaged male 100; under 0.8 kg is free pricing, 20 kr here is a guess).
  // pm: the first-hand price of male A crab by month, from Råfisklaget's statistics (2025: 436 kr/kg on average, from 151 kr in April to
  // 614 in January; 2026 so far January 608, April 218, June 461, September 398); the months between are interpolated, an estimate
  krabbe:{no:'Kongekrabbe', en:'King crab', shell:true, live:true, k:0.5, base:0.6, prod:0.3, dep:[80, 0.8], av:[1,1,1,1,1,1,1,1,1,1,1,1],
    pm:[610,560,380,190,300,460,450,420,400,420,470,560], sig:0.05, size:[1.5, 0.45], minKg:0, uh:1,
    cls:[[3.2, 296, 'Hann over 3,2 kg'], [2.2, 291, 'Hann 2,2–3,2 kg'], [1.6, 246, 'Hann 1,6–2,2 kg'], [0.8, 66, 'Hann 0,8–1,6 kg'], [0, 80, 'Hunnkrabbe'], [0, 100, 'Skadd hann'], [0, 20, 'Under 0,8 kg']], ref:1},
  // The ocean fleet's species (B2 of docs/planer/bestand-og-flaate.md, valg 4 = A, 01.11.2026): Norwegian spring-spawning herring,
  // mackerel and snow crab, for the fleet's pressure and AIS (B3, H1) only. npc: the player cannot fish, buy or sell them, and they are
  // not in the Fish guide, SP or SHELL until the ocean step; they come last in ALLSP, after the late ones, so no other species' seeds
  // move. Where and when they are is areaF and MIG in 03f-fiske.js (the landing notes and HI); av is flat for that reason. The prices
  // are the landing notes' means by month for 2025 from vessels of 28 m and over (Fiskeridirektoratet, fangstdata 2025, NLOD: Norwegian
  // spring-spawning herring and mackerel in RSW, snow crab frozen; H0 of docs/planer/havsteget.md, 03.11.2026), the months with no
  // landings filled between their neighbours; the class price is the lowest month's, the floor. size and dep are HI's typical figures.
  sild:{no:'Sild', en:'Herring', npc:true, k:1, base:1, prod:0.5, dep:[80, 1.4], av:[1,1,1,1,1,1,1,1,1,1,1,1],
    pm:[11.6,12.4,12.8,12.6,12.4,12.2,12.0,11.6,11.5,11.5,11.6,11.6], sig:0.05, size:[0.35, 0.2], minKg:0.1, uh:1, cls:[[0, 11.5, 'Sild']], ref:0},
  makrell:{no:'Makrell', en:'Mackerel', npc:true, k:1, base:1, prod:0.5, dep:[40, 1.4], av:[1,1,1,1,1,1,1,1,1,1,1,1],
    pm:[27.7,27.5,23.2,18.9,14.5,14.7,14.4,37.4,42.1,48.2,41.4,34.5], sig:0.05, size:[0.45, 0.25], minKg:0.1, uh:1, cls:[[0, 14.4, 'Makrell']], ref:0},
  // (H3a of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026) the snow crab is fished by the player's snow crab vessel too: lic names
  // the permit that may take it (the pots' catch, 10d-snokrabbe.js, not the jig or the fish guide, so it stays npc and last in ALLSP);
  // stk its own stock layer (S.sstk, stkK its size against the fish's). Each crab is drawn with sex, carapace width and weight (SNOC), so
  // size is not used. (H3b, 06.11.2026) It is no longer landed whole: the factory splits it in two clusters (the deck's «gutting»), cooks,
  // freezes and glazes them (the freezers, BOAT.freezeT), and uh is Fiskeridirektoratet's factor from clusters to round weight for the
  // year (snoUh in 10e-krabbefabrikk.js: 1.61 to 2025, 1.49 from 2026), so the hold fills by the clusters' weight and the quota and the
  // price go by the round weight; or it goes live into the tanks (VESSELS tank). cls: the clusters of a hard male and of a soft crab
  // (bløtkrabbe, J-237-2025 § 5), the dead crab (§ 51: landed too, round, for meal; sedlene 2025: 1 kr/kg), and the live crab by the
  // notes' size groups (Størrelsesgruppering) at Råfisklaget's minimum prices from 9.2.2026 (rundskriv 2/2026, a search snippet: 800 g
  // and over 60, 500-800 g 50, 350-500 g 30, under 350 g 5 kr/kg); the clusters' minimum price is 80 kr/kg of product (A, glazed; the
  // price report week 34/2026, a snippet), 54 kr/kg round weight with 1.49. pm and pmL: the price of the clusters and of the live crab by
  // month, kr/kg round weight, from the landing notes of several years (snoPrice in 10e-krabbefabrikk.js has the sources)
  snokrabbe:{no:'Snøkrabbe', en:'Snow crab', npc:true, lic:'krab', shell:true, stk:'sstk', stkK:6, k:1, base:1, prod:0.3, dep:[250, 0.6], av:[1,1,1,1,1,1,1,1,1,1,1,1],
    pm:[104.1,107.5,110.7,101.3,74.1,72.4,70.3,77.1,83.8,90.6,97.3,104.1], pmL:[74.5,75.8,78.7,72.5,69.7,71.1,61.5,64.1,66.7,69.3,71.9,74.5], sig:0.05, size:[0.6, 0.3], minKg:0,
    get uh(){ return typeof snoUh === 'function' ? snoUh() : 1.49; },
    cls:[[0, 54, 'Klør'], [0, 54, 'Klør, bløtkrabbe'], [0, 1, 'Død snøkrabbe'], [0.8, 60, 'Levende, 800 g og over'], [0.5, 50, 'Levende, 500–800 g'], [0.35, 30, 'Levende, 350–500 g'], [0, 5, 'Levende, under 350 g']], ref:0}
};
// pmF (cod, haddock, saithe): the price of fish frozen at sea, by month, from the landing notes for 2025 from vessels of 28 m and over
// (Fiskeridirektoratet, fangstdata 2025, NLOD; kroner a kilo round weight, the frozen lots only; November and December filled between
// their neighbours). A frozen lot sells at it instead of pm (clsPrice, 03-simulation.js). Jonas 03.11.2026: «Prisene skal reflektere
// virkeligheten» (until then frozen fish was paid as fresh, by Råfisklaget's minimum prices, which are the same for both).
// fish are caught by jig, line and net; shellfish only in pots. Everything that loops over fish uses SP; ALLSP adds the shellfish after
// the first fish, the late ones (added after the crab) and last the ocean fleet's (npc), so the per-species seeds (ALLSP.indexOf) keep
// their values. PLAYSP is ALLSP without the ocean fleet's: what the player can fish and the Fish guide and the records show.
const SP = Object.keys(SPECIES).filter(sp => !SPECIES[sp].shell && !SPECIES[sp].npc), SHELL = Object.keys(SPECIES).filter(sp => SPECIES[sp].shell && !SPECIES[sp].npc),
  ALLSP = SP.filter(sp => !SPECIES[sp].late).concat(SHELL, SP.filter(sp => SPECIES[sp].late), Object.keys(SPECIES).filter(sp => SPECIES[sp].npc)),
  PLAYSP = ALLSP.filter(sp => !SPECIES[sp].npc);
// ---------- vessels, equipment, crew ----------
// The vessels, from the open starter boat to the ocean fleet. Every rule reads these fields, never the key:
//  len, beam, draft (m), disp (displacement loaded, tonnes; an estimate), holdCap, iceCap (kg), fuelCap (L), hp, vmax, vcruise (kn),
//  accel (kn a minute), turnR (m, 3D), planing, outboard, diesel, fuelK, risk [hs warn, hs danger, wind warn, wind danger], sea (speed
//  lost per m of wave), crewMax (besides you), berths (bunks where the crew can rest at sea; none means only the quay counts as rest),
//  tubCap (bleeding tub, kg), land ('tub'; 'box' was the open boats' boxes before 04.11.2026), kar (an open boat's fish tubs on deck, core/07f-kar.js: n her own, max the places), std (equipment it comes with), rigs (the kinds of fishing it can be rigged for),
//  mottak (an ocean vessel's gear groups a plant must take in, mottak.json gear: Trål, Not, Konvensjonelle; 06b-coastports.js portWhy),
//  jukseMax, gearMax, svcH (engine hours between services), svcCost, svcJobH (yard hours until 05.10.2026; every yard job takes YARD_H now, core/06-services.js), cls ('open', 'kyst' or 'hav': the market
//  tab), price, isNew (built to order), year, desc.
// Schema v2 (docs/batplan.md del 4, Jonas 17.10.2026; vesseltest.py refuses a boat without every field): hullMat (tre, alu, glassfiber,
// stål), hold {kind: dekk (boxes and tubs on deck, no insulation), rom (a hold with ice), frys (freezer), rsw (chilled tanks); m3},
// deckCargo (kg of freight on deck, not in the hold), iceMaker and gutMachine (kg a day and kg an hour, 0 without; only over 14.99 m),
// freezeT and plantLph (an ocean vessel's plate freezers, kg of product a day, and her generators' litres an hour at sea while not under
// way; optional, H2b 05.11.2026: 05-vessels.js deckMinute and plantFuel),
// lph (litres an hour at cruising speed, the truth the burn curve is scaled to: fuelK is derived), cabins, fac {house: open, hardtop or
// hus; shelter over the working deck; galley: none, plate or bysse; wc; dry (drying room); mess}, stations {table, hauler: how many work
// there at once}, crane (tonnes, 0 without). vesselDerive adds fuelK, range (nm), watch (a 2+2 watch is possible), haulers and openOk.
const VESSELS = {
  skiff:{name:{no:'Aluminiumsbåt 19 fot (5,9 m), 60 hk påhengs', en:'19 ft aluminium boat (5.9 m), 60 hp outboard'}, len:5.9, beam:2.45, draft:0.6, disp:1.0, holdCap:500, iceCap:150, fuelCap:90, hp:60, engine:{no:'60 hk påhengsmotor, bensin', en:'60 hp petrol outboard'},
    vmax:24, vcruise:18, accel:10, turnR:35, planing:true, outboard:true, diesel:false, risk:[1.0, 1.8, 10.8, 13.9], sea:0.45, crewMax:1, berths:0, tubCap:60, land:'tub', std:[],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:2, gearMax:{garn:6, stamp:4, teine:4}, svcH:100, svcCost:3500, svcJobH:3, cls:'open', price:95000, year:2008,
    hullMat:'alu', kar:{n:1, max:1}, hold:{kind:'dekk', m3:0.8}, deckCargo:150, iceMaker:0, gutMachine:0, lph:11, cabins:0, fac:{house:'open', shelter:false, galley:'none', wc:false, dry:false, mess:false}, stations:{table:1, hauler:1}, crane:0,
    desc:{no:'Åpen aluminiumsbåt med midtkonsoll, sete og fordekk, og påhengsmotor. Rask og billig, men liten og våt i sjøgang.', en:'Open aluminium boat with a centre console, a seat, a casting deck and an outboard. Fast and cheap, but small and wet in a sea.'}},
  // Father's old boat, the first one (Jonas 05.10.2026: «en 23fot trebåt med innenbords semidiesel ... topphastigheten skal være 7
  // knop», the rest made up from the skiff's): hold, ice, crew and gear as the skiff, a semi-diesel single that sips diesel (semi: the
  // engine's own sound and its black puffs, ui/10e-sound.js and view3d.js; rpm 340 idle as in Jonas's video, 850 at most, his word), heavier and kinder in a sea than the aluminium boat
  trebat:{name:{no:'Trebåt 23 fot (7,0 m), 8 hk semidiesel', en:'23 ft wooden boat (7.0 m), 8 hp semi-diesel'}, len:7.0, beam:2.26, draft:0.62, disp:1.9, holdCap:500, iceCap:150, fuelCap:60, hp:8, engine:{no:'8 hk semidiesel, én sylinder', en:'8 hp semi-diesel, single cylinder'},
    vmax:7, vcruise:6, accel:2, turnR:28, planing:false, outboard:false, diesel:true, semi:true, rpm:[340, 850], risk:[1.2, 2.0, 11, 14.5], sea:0.3, crewMax:1, berths:0, tubCap:60, land:'tub', std:[],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:2, gearMax:{garn:6, stamp:4, teine:6}, svcH:120, svcCost:2000, svcJobH:4, cls:'open', price:45000, year:1956,
    hullMat:'tre', kar:{n:1, max:1}, hold:{kind:'dekk', m3:0.8}, deckCargo:200, iceMaker:0, gutMachine:0, lph:1.0, cabins:0, fac:{house:'open', shelter:false, galley:'none', wc:false, dry:false, mess:false}, stations:{table:1, hauler:1}, crane:0,
    desc:{no:'Gammel, klinkbygd og spissgattet trebåt med motorkasse midtskips og rorkult. Treverket er grått og slitt, men skroget er tett. Hun går i 7 knop og bruker nesten ikke diesel.', en:'An old clinker-built double-ended wooden boat with the engine box amidships and a tiller. The wood is grey and worn, but the hull is tight. She makes 7 knots and hardly uses any diesel.'}},
  snekke:{name:{no:'Plastsnekke 26 fot, 30 hk diesel', en:'26 ft fibreglass snekke, 30 hp diesel'}, len:7.9, beam:2.7, draft:1.2, disp:3.0, holdCap:1000, iceCap:400, fuelCap:220, hp:30, engine:{no:'30 hk innenbords diesel', en:'30 hp inboard diesel'},
    vmax:8, vcruise:7, accel:3, turnR:45, planing:false, outboard:false, diesel:true, risk:[1.5, 2.5, 12.5, 16], sea:0.22, crewMax:2, berths:0, tubCap:150, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:3, gearMax:{garn:15, stamp:10, teine:9}, svcH:250, svcCost:6000, svcJobH:5, cls:'open', price:245000, year:1994,
    hullMat:'glassfiber', kar:{n:2, max:2}, hold:{kind:'dekk', m3:1.8}, deckCargo:300, iceMaker:0, gutMachine:0, lph:3.0, cabins:0, fac:{house:'hardtop', shelter:false, galley:'none', wc:false, dry:false, mess:false}, stations:{table:1, hauler:1}, crane:0,
    desc:{no:'Plastsnekke med klinkmønster i skroget, ruff forut, vindskjerm med hardtopp over styreplassen og åpen cockpit akter til redskapen. Sparsommelig og sjøsterk for størrelsen.', en:'Fibreglass snekke with a clinker-look hull, a cabin forward, a windscreen with a hard top over the helm and an open cockpit aft for the gear. Economical and seaworthy for her size.'}},
  // the 31 ft fibreglass sjark that became the standard Norwegian sjark from the late 1970s (the Viksund 31 Sjark; the make is only named
  // here). Measures from the registers and used-boat listings read 17.10.2026: 9.26–9.45 x 3.05–3.30 m, draft 1.2–1.5 m by the load, 5–6 t
  // as a working boat, 68–120 hp, 8 knots (the sources are in tools/boats/plast31.py). A used one of 1992: step 3 of the ladder (docs/batplan.md del 9)
  plastsjark:{name:{no:'Plastsjark 31 fot (9,45 m), 100 hk', en:'31 ft fibreglass sjark (9.45 m), 100 hp'}, len:9.45, beam:3.3, draft:1.35, disp:6, holdCap:3500, iceCap:1200, fuelCap:600, hp:100, engine:{no:'100 hk diesel', en:'100 hp diesel'},
    vmax:8.5, vcruise:7.5, accel:3, turnR:60, planing:false, outboard:false, diesel:true, risk:[2.2, 3.5, 14, 18], sea:0.17, crewMax:2, berths:2, tubCap:250, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:4, gearMax:{garn:30, stamp:18, teine:12}, svcH:220, svcCost:9000, svcJobH:6, cls:'open', price:850000, year:1992,
    hullMat:'glassfiber', hold:{kind:'rom', m3:6}, deckCargo:800, iceMaker:0, gutMachine:0, lph:8, cabins:1, fac:{house:'hus', shelter:false, galley:'plate', wc:false, dry:false, mess:false}, stations:{table:1, hauler:1}, crane:0,
    desc:{no:'Den vanlige plastsjarken fra åttitallet: styrhus akter, åpent arbeidsdekk med lasterom midtskips og to køyer i ruffen forut. Langsom, sparsommelig og lett å drive alene.', en:'The common fibreglass sjark of the eighties: the wheelhouse aft, an open working deck with the hold amidships and two berths in the cabin forward. Slow, frugal and easy to run alone.'}},
  sjark:{name:{no:'Havsjark 35 fot (10,6 m) med bakk og styrhus', en:'35 ft havsjark (10.6 m) with forecastle and wheelhouse'}, len:10.57, beam:4.1, draft:1.6, disp:12, holdCap:6500, iceCap:2000, fuelCap:900, hp:180, engine:{no:'180 hk diesel', en:'180 hp diesel'},
    vmax:10, vcruise:8.5, accel:3, turnR:70, planing:false, outboard:false, diesel:true, risk:[2.5, 3.8, 15, 19], sea:0.14, crewMax:3, berths:4, tubCap:300, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:5, gearMax:{garn:40, stamp:24, teine:18}, svcH:250, svcCost:14000, svcJobH:8, cls:'open', price:1150000, year:1985,
    hullMat:'glassfiber', hold:{kind:'rom', m3:11}, deckCargo:1500, iceMaker:0, gutMachine:0, lph:12, cabins:1, fac:{house:'hus', shelter:false, galley:'plate', wc:true, dry:false, mess:false}, stations:{table:2, hauler:1}, crane:0,
    desc:{no:'Tung og sjøsterk havsjark med styrhus midtskips på en kort bakk, lasterom og redskapsrom akter og styttesegl på aktermasten. Rommet tar 6,5 tonn. Fisker med det meste.', en:'A heavy, seaworthy havsjark with the wheelhouse amidships on a short forecastle, the hold and a gear room aft and a riding sail on the mizzen. The hold takes 6.5 tonnes. Fishes with most gear.'}},
  hurtigsjark:{name:{no:'Brukt hurtigsjark 10,99 m, 500 hk', en:'Used 10.99 m speed sjark, 500 hp'}, len:10.99, beam:3.9, draft:1.6, disp:12, holdCap:5000, iceCap:1600, fuelCap:1500, hp:500, engine:{no:'500 hk diesel', en:'500 hp diesel'},
    vmax:22, vcruise:17, accel:9, turnR:75, planing:true, outboard:false, diesel:true, risk:[2.3, 3.6, 14.8, 18.5], sea:0.15, crewMax:2, berths:2, tubCap:350, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:6, gearMax:{garn:50, stamp:26, teine:18}, svcH:300, svcCost:18000, svcJobH:9, cls:'open', price:4900000, year:2009,
    hullMat:'glassfiber', hold:{kind:'rom', m3:8}, deckCargo:1200, iceMaker:0, gutMachine:0, lph:55, cabins:1, fac:{house:'hus', shelter:false, galley:'plate', wc:true, dry:false, mess:false}, stations:{table:2, hauler:1}, crane:0.5,
    desc:{no:'Planende sjark i glassfiber med styrhus forut. Rask til feltet og hjem igjen, men tørst.', en:'Planing fibreglass sjark with the wheelhouse forward. Fast to the grounds and home again, but thirsty.'}},
  sjarkny:{name:{no:'Ny hurtigsjark 10,99 m, 650 hk', en:'New 10.99 m speed sjark, 650 hp'}, len:10.99, beam:4.68, draft:2.06, disp:15, holdCap:7000, iceCap:2400, fuelCap:2000, hp:650, engine:{no:'650 hk diesel', en:'650 hp diesel'},
    vmax:25, vcruise:20, accel:10, turnR:80, planing:true, outboard:false, diesel:true, risk:[2.4, 3.8, 15, 19], sea:0.14, crewMax:3, berths:4, tubCap:400, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:6, gearMax:{garn:60, stamp:30, teine:21}, svcH:300, svcCost:22000, svcJobH:10, cls:'open', price:10500000, isNew:true, year:2027,
    hullMat:'glassfiber', hold:{kind:'rom', m3:12}, deckCargo:1800, iceMaker:0, gutMachine:0, lph:75, cabins:2, fac:{house:'hus', shelter:false, galley:'bysse', wc:true, dry:true, mess:false}, stations:{table:2, hauler:1}, crane:0.5,
    desc:{no:'Nybygd hurtigsjark fra verftet i Finnsnes, med styrhus forut og stort arbeidsdekk. Planende skrog og stor motor.', en:'Newly built speed sjark from the yard in Finnsnes, wheelhouse forward and a big working deck. Planing hull and a big engine.'}},
  // drawn after the 36-foot Malo sjark (general arrangement and data sheet from Jemar Norpower): 10.99 x 4.20 m (4.40 over the
  // fenders), depth 2.34 m, hold 19 m3, fuel 3.4 m3, 300 hp, about 10 kn; the 3D model is the detailed GLB from tools/boats/malo36.py
  breisjark:{name:{no:'Sjark 36 fot med bakk og ly', en:'36 ft sjark with forecastle and shelter'}, len:10.99, beam:4.2, draft:2.0, disp:20, holdCap:10000, iceCap:2500, fuelCap:3400, hp:300, engine:{no:'300 hk diesel, seks sylindre', en:'300 hp six-cylinder diesel'},
    vmax:10.5, vcruise:9.5, accel:2.5, turnR:80, planing:false, outboard:false, diesel:true, risk:[2.6, 4.0, 15, 19], sea:0.13, crewMax:4, berths:4, tubCap:450, land:'tub', std:['plotter', 'vhf'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:6, gearMax:{garn:100, stamp:33, teine:20}, svcH:300, svcCost:22000, svcJobH:12, cls:'open', price:9000000, year:2015,
    hullMat:'glassfiber', hold:{kind:'rom', m3:19}, deckCargo:2500, iceMaker:0, gutMachine:0, lph:20, cabins:2, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:false}, stations:{table:2, hauler:1}, crane:0,
    desc:{no:'Den klassiske kystsjarken på 36 fot: høy baug med bakk, styrhus med panoramavinduer, ly over garnhaleren og lasterom på 19 kubikk. Sjødyktig og solid, med to lugarer.', en:'The classic 36-foot coastal sjark: a high bow with a forecastle, a wheelhouse with panoramic windows, a shelter over the net hauler and a 19 m3 hold. Seaworthy and solid, with two cabins.'}},
  kyst15:{name:{no:'Kystbåt 14,99 m med lugarer', en:'14.99 m coastal vessel with cabins'}, len:14.99, beam:6.6, draft:3.0, disp:75, holdCap:28000, iceCap:8000, fuelCap:9000, hp:750, engine:{no:'750 hk diesel', en:'750 hp diesel'},
    vmax:11.5, vcruise:10, accel:2, turnR:110, planing:false, outboard:false, diesel:true, risk:[3.3, 4.8, 17, 21.5], sea:0.1, crewMax:5, berths:6, tubCap:800, land:'tub', std:['plotter', 'vhf', 'ais'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:8, gearMax:{garn:160, stamp:33, teine:30}, svcH:400, svcCost:45000, svcJobH:16, cls:'kyst', price:18000000, year:2012,
    hullMat:'glassfiber', hold:{kind:'rom', m3:45}, deckCargo:6000, iceMaker:0, gutMachine:0, lph:60, cabins:3, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:3, hauler:2}, crane:1,
    desc:{no:'Kystbåt bygd til de magiske 15 meterne, med baksdekk, styrhus forut, haleport og lugarer til seks. Krever hjemmel i lukket gruppe.', en:'Coastal vessel built to the magic 15 metres, with a shelter deck, the wheelhouse forward, a hauling port and cabins for six. Needs a closed-group licence.'}},
  kyst21:{name:{no:'Eldre kystbåt 21 m, garn og line', en:'Older 21 m coastal vessel, nets and line'}, len:21, beam:7.2, draft:3.4, disp:190, holdCap:55000, iceCap:15000, fuelCap:25000, hp:900, engine:{no:'900 hk diesel', en:'900 hp diesel'},
    vmax:11, vcruise:10, accel:1.5, turnR:150, planing:false, outboard:false, diesel:true, risk:[3.8, 5.5, 18, 23], sea:0.08, crewMax:6, berths:8, tubCap:1200, land:'tub', std:['plotter', 'vhf', 'ais'],
    rigs:['juksa', 'line', 'garn', 'teiner'], jukseMax:8, gearMax:{garn:240, stamp:33, teine:30}, svcH:400, svcCost:70000, svcJobH:24, cls:'kyst', price:9000000, year:1978,
    hullMat:'stål', hold:{kind:'rom', m3:90}, deckCargo:10000, iceMaker:0, gutMachine:0, lph:80, cabins:4, fac:{house:'hus', shelter:false, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:3, hauler:2}, crane:2,
    desc:{no:'Stålbåt fra 70-tallet med bakk, rundgatt og galge. Fra 15 meter kan hun ikke fiske innenfor fjordlinja.', en:'Steel boat from the 70s with a forecastle, a cruiser stern and a gallows. From 15 metres she may not fish inside the fjord line.'}},
  // the ocean fleet: shown in the market with the full spec, bought when the ocean grounds open (west of today's chart)
  snokrabbe:{name:{no:'Snøkrabbefartøy 50 m med fryseri', en:'50 m snow crab vessel with a freezing plant'}, len:50, beam:11, draft:6, disp:1800, holdCap:500000, iceCap:0, fuelCap:350000, hp:3600, engine:{no:'3 600 hk diesel', en:'3,600 hp diesel'},
    vmax:13.5, vcruise:11, accel:1, turnR:300, planing:false, outboard:false, diesel:true, risk:[6, 9, 24, 30], sea:0.04, crewMax:22, berths:26, tubCap:2000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    // (H3a, 06.11.2026) pot: her conical snow crab pots (POTS.sno in 10-gear.js); gearMax.teine the cap of høstingsforskriften § 28
    // (8 000 a vessel): the fleet carries up to 12 000 pots a trip (Olsen et al. 2019, a search snippet), the conical pots stack, so the
    // deck is not what limits her. Bought with her snow crab permit (havOffer, 03d-quota.js), no longer locked
    rigs:['teiner'], pot:'sno', jukseMax:0, gearMax:{garn:0, stamp:0, teine:8000}, svcH:600, svcCost:400000, svcJobH:72, mottak:['Konvensjonelle'], cls:'hav', price:60000000, year:2001,
    // (H3c, 06.11.2026, V3 B) the ice class: she goes in drift ice up to the limit of her class (ICE_CLS, seaIceLim in 03h-is.js). DNV
    // ICE-1C is an assumption for a 50 m vessel from 2001: of the snow crab fleet Frøyanes (69.9 m, 2024) has Ice 1B, Polarbris (43.5 m)
    // ICE-C and Prestfjord Ice 1B (Baird Maritime and Kleven, search snippets); Polar Pioneer, Arctic Pioneer and Kvitungen have none given
    iceClass:'1C',
    // (H3b, 06.11.2026) the crew by the landing notes' «Besetning» (50-53 m freezing 21-29 aboard, median 22 in 2025 and 21-23 in
    // 2026): the six key people, a deck team of 8 and a factory team of 8, two crews (rot) that go five weeks on and five off (rotD
    // days; the hearing answer of Polar Pioneer AS et al., fiskeridir.no 22.9.2023, read: «to skift under sesongen, hvor mannskapet er
    // 5 uker på og 5 uker av»; Polar Pioneer 52 m has berths for 32, Arctic Pioneer 45 m and Kvitungen 47.5 m for 21), 26 berths
    crew:{key:['skipper', 'styrmann', 'maskinsjef', '2. maskinist', 'kokk', 'bas'], teams:[{role:'dekk', n:8}, {role:'fabrikk', n:8}], rot:2, rotD:35},
    // (H3b) the factory: the clusters cooked, frozen and glazed, 12 t of product a day (freezeT, 18 t round weight; no Norwegian figure
    // found: the Russian crab vessels Arktur, Zenith and Vaigach «30 tonnes of raw snow crab per 24 hours to generate 20 tonnes of
    // finished product», Frøyanes 20 t of legs a day with 35 aboard, the plant in Båtsfjord 8-10 t of clusters a day; all search snippets),
    // the generators for it, the tanks' pumps and the hotel (plantLph, 180 l an hour at sea; no litres found for group 014, an assumption
    // against its 4.9 MNOK of fuel in 2024), and the RSW tanks for live crab (tank: 400 m3, 40 t at 100 kg/m3; FHF 901919: «pumpes et
    // parti levende krabbe fra RSW-tank til lossekar», a 100 m3 tank; Nofima's trials at 100-200 kg/m3, snippets). provDays: provisions
    // for 30 days (the notes' frozen trips 15-28 days between landings, the live 7-15)
    hullMat:'stål', hold:{kind:'frys', m3:900}, deckCargo:40000, iceMaker:0, gutMachine:0, freezeT:12000, plantLph:180, tank:{m3:400, kg:40000}, provDays:30, lph:400, cabins:13, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:4, hauler:2}, crane:5,
    desc:{no:'Teinefartøy for snøkrabbe i Barentshavet, med fabrikk for klør og tanker for levende krabbe. Krever snøkrabbetillatelse.', en:'Pot vessel for snow crab in the Barents Sea, with a factory for the clusters and tanks for live crab. Needs a snow crab licence.'}},
  autoliner:{name:{no:'Autoliner 45 m med frysing', en:'45 m autoliner with freezing'}, len:45.4, beam:10.45, draft:3.8, disp:1050, holdCap:400000, iceCap:0, fuelCap:300000, hp:3000, engine:{no:'3 000 hk diesel', en:'3,000 hp diesel'},
    vmax:13, vcruise:11, accel:1, turnR:280, planing:false, outboard:false, diesel:true, risk:[6, 9, 24, 30], sea:0.04, crewMax:14, berths:16, tubCap:2000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:['line'], jukseMax:0, gearMax:{garn:0, stamp:0, teine:4}, autoHooks:40000, svcH:600, svcCost:350000, svcJobH:72, mottak:['Konvensjonelle'], cls:'hav', price:70000000, priceNew:300000000, year:1999,
    crew:{key:['skipper', 'styrmann', 'maskinsjef', '2. maskinist', 'kokk', 'bas'], teams:[{role:'dekk', n:4}, {role:'fabrikk', n:4}], rot:2},
    hullMat:'stål', hold:{kind:'frys', m3:700}, deckCargo:30000, iceMaker:0, gutMachine:2500, freezeT:15000, plantLph:95, lph:350, cabins:8, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:4, hauler:1}, crane:3,
    desc:{no:'Linebåt med egnemaskin som setter og trekker 40 000 kroker i døgnet, og fryser fisken om bord. Krever konsesjon for konvensjonelle havfiskefartøy.', en:'Longliner with a baiting machine that sets and hauls 40,000 hooks a day and freezes the catch aboard. Needs a licence for conventional ocean vessels.'}},
  bunntral:{name:{no:'Frysetråler 60 m med akterslipp', en:'60 m freezer trawler with a stern ramp'}, len:60.3, beam:12.5, draft:5.1, disp:2200, holdCap:800000, iceCap:0, fuelCap:700000, hp:8000, engine:{no:'8 000 hk diesel', en:'8,000 hp diesel'},
    vmax:15, vcruise:12, accel:0.8, turnR:400, planing:false, outboard:false, diesel:true, risk:[7, 10, 26, 33], sea:0.03, crewMax:25, berths:30, tubCap:3000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:[], jukseMax:0, gearMax:{garn:0, stamp:0, teine:4}, svcH:800, svcCost:900000, svcJobH:120, mottak:['Trål'], cls:'hav', price:150000000, priceNew:500000000, year:2004, lock:true,
    crew:{key:['skipper', 'styrmann', '2. styrmann', 'maskinsjef', '2. maskinist', 'elektriker', 'kokk', 'stuert', 'fabrikksjef'], teams:[{role:'dekk', n:4}, {role:'fabrikk', n:6}, {role:'fabrikk', n:6}], rot:2},
    hullMat:'stål', hold:{kind:'frys', m3:1400}, deckCargo:60000, iceMaker:0, gutMachine:4000, lph:900, cabins:15, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:6, hauler:2}, crane:5,
    desc:{no:'Bunntråler for torsk, hyse, sei og uer, med fabrikk og fryselager. Krever torsketrålkonsesjon.', en:'Bottom trawler for cod, haddock, saithe and redfish, with a factory and a freezer hold. Needs a cod trawl licence.'}},
  pelagisk:{name:{no:'Ringnot- og pelagisk tråler 75 m', en:'75 m purse seiner and pelagic trawler'}, len:75, beam:15.5, draft:7.5, disp:5000, holdCap:2000000, iceCap:0, fuelCap:650000, hp:9000, engine:{no:'9 000 hk diesel', en:'9,000 hp diesel'},
    vmax:17, vcruise:14, accel:0.8, turnR:450, planing:false, outboard:false, diesel:true, risk:[7, 10, 26, 33], sea:0.03, crewMax:12, berths:16, tubCap:3000, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:[], jukseMax:0, gearMax:{garn:0, stamp:0, teine:4}, svcH:800, svcCost:900000, svcJobH:120, mottak:['Not', 'Trål'], cls:'hav', price:250000000, priceNew:800000000, year:2010, lock:true,
    crew:{key:['skipper', 'styrmann', 'maskinsjef', '2. maskinist', 'kokk'], teams:[{role:'dekk', n:7}], rot:1},
    hullMat:'stål', hold:{kind:'rsw', m3:2800}, deckCargo:80000, iceMaker:0, gutMachine:0, lph:1000, cabins:8, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:2, hauler:2}, crane:5,
    desc:{no:'Ringnotsnurper og pelagisk tråler for sild, makrell og kolmule, med kjølte sjøvannstanker (RSW). Krever ringnotkonsesjon.', en:'Purse seiner and pelagic trawler for herring, mackerel and blue whiting, with refrigerated sea water tanks (RSW). Needs a purse seine licence.'}},
  // the pilot boat of the graphics plan (docs/planer/grafikk-batmodeller.md F4, docs/skipsmodeller/sulebas-pilot-grunnlag.md): a 38.55 m
  // multi-purpose purse seiner and fly-shooter built in Blender after a real boat's build report and photographs (tools/boats/ringnot38.py);
  // her place in the ladder is not decided (B1 = C), so she is locked like the ocean fleet. Data from the build report: Lpp 34.00, B 9.50,
  // 499 GT, fuel 78.6 m3, RSW 419.5 m3, 749 kW (1,018 hp) main engine
  ringnot38:{name:{no:'Kystnotbåt 38,55 m, ringnot og snurrevad', en:'38.55 m coastal purse seiner and fly-shooter'}, len:38.55, beam:9.5, draft:3.85, disp:800, holdCap:400000, iceCap:0, fuelCap:78600, hp:1018, engine:{no:'1 018 hk diesel', en:'1,018 hp diesel'},
    vmax:13, vcruise:11, accel:1.2, turnR:200, planing:false, outboard:false, diesel:true, risk:[5, 8, 22, 28], sea:0.05, crewMax:8, berths:10, tubCap:1200, land:'tub', std:['plotter', 'vhf', 'ais', 'chirp', 'sonar'],
    rigs:[], jukseMax:0, gearMax:{garn:0, stamp:0, teine:4}, svcH:600, svcCost:450000, svcJobH:80, mottak:['Not', 'Konvensjonelle'], cls:'hav', price:95000000, priceNew:180000000, year:2014, lock:true,
    crew:{key:['skipper', 'styrmann', 'maskinsjef', 'kokk'], teams:[{role:'dekk', n:4}], rot:1},
    hullMat:'stål', hold:{kind:'rsw', m3:420}, deckCargo:30000, iceMaker:0, gutMachine:0, lph:220, cabins:6, fac:{house:'hus', shelter:true, galley:'bysse', wc:true, dry:true, mess:true}, stations:{table:2, hauler:2}, crane:3,
    desc:{no:'Kystnotbåt med ringnot og snurrevad, kjølte sjøvannstanker (RSW) og fiskepumpe. Åpent arbeidsdekk på styrbord side.', en:'Coastal purse seiner and fly-shooter with refrigerated sea water tanks (RSW) and a fish pump. An open working deck on the starboard side.'}}
};
const BOAT = Object.assign({}, VESSELS.skiff);
const PRICE = {fuel:23.9, diesel:14.5, ice:1.5, iceBag:2.0, gear:1900, kgear:2490, tow:4500, rescue:6000, member:1250};
// The fuel's price at a port this week (the user's list 04.10.2026): the base times a weekly swing (an AR(1) over the weeks like the
// fish prices', within ±12 %, the same at every port) and the port's own level (±4 %, by its name). The base was checked 04.10.2026:
// Preem's anleggsdiesel was 16,28 kr/l without VAT on 29.08.2026, and a fishing vessel pays neither the mineral oil tax nor the CO2
// tax on it (Skatteetaten), so 14,50 kr/l stands; the petrol at a marina, 23,90 kr/l, too
const FWD = {};
function fuelWeek(w){ if (FWD[w] != null) return FWD[w]; let v = 0; for (let k = w - 16; k <= w; k++) v = 0.7 * v + 0.05 * gauss(h2(k * 13 + 5911, 811), h2(k * 17 + 5911, 812)); return FWD[w] = clamp(v, -0.12, 0.12); }
const fuelPortF = pid => pid ? (hashStr(pid) % 1000 / 1000 - 0.5) * 0.08 : 0;
function fuelPrice(H = S.t / 60, pid = S.boat && S.boat.port, diesel = BOAT.diesel){ return Math.round((diesel ? PRICE.diesel : PRICE.fuel) * (1 + fuelWeek(weekOfH(H))) * (1 + fuelPortF(pid)) * 100) / 100; }
const EQUIP = {
  // a bridge navigational watch alarm for a small boat (start price): it goes off when you doze at the wheel (core/15-energy.js)
  antigro:{price:18000, name:{no:'Antigro-belegg', en:'Antifouling coat'}, desc:{no:'Bunnstoff som holder groe og rur unna skroget. Båten gror til tre ganger så sakte, og holder farten og forbruket lenger.', en:'Bottom paint that keeps weed and barnacles off the hull. The boat fouls three times as slowly and keeps her speed and fuel use longer.'}},
  brovakt:{price:7900, name:{no:'Brovaktsalarm (BNWAS)', en:'Bridge watch alarm (BNWAS)'}, desc:{no:'Døser du av ved roret på sjøen, piper den etter tre minutter til du kvitterer med ACK. Du våkner, men er trøtt og kan døse av igjen til du har hvilt ved kai.', en:'If you doze off at the wheel at sea, it beeps after three minutes until you acknowledge with ACK. You wake, but stay drowsy and may doze off again until you have rested at the quay.'}},
  vhf:{price:6500, name:{no:'VHF-radio', en:'VHF radio'}, desc:{no:'Kulingvarsel fra kystradioen og nødanrop uten mobildekning.', en:'Gale warnings from coast radio and distress calls without mobile coverage.'}},
  ais:{price:4900, name:{no:'AIS-sender (klasse B)', en:'AIS transponder (class B)'}, desc:{no:'Andre båter og redningstjenesten ser deg på AIS. Raskere hjelp ved nød.', en:'Other boats and the rescue service see you on AIS. Faster help in an emergency.'}},
  plotter:{price:24900, name:{no:'Kartplotter 9" med dybdekart', en:'9" chart plotter with depth charts'}, desc:{no:'Plottervisning med dybdefarger, relieff og dybdekurver.', en:'Plotter view with depth colours, relief and contours.'}},
  // the radar (start prices, estimates: a 24" 4 kW radome is about 30 000 DKK at Raymarine's Danish shop, no Norwegian price was found;
  // a 4 ft open array is about three times that): a dome on the wheelhouse roof up to 12 m (not on an open boat), an open array on the mast from 10 m to 21 m (the sea-going ships have
  // their own radars in the model, as part of the ship)
  radar:{price:35000, fit:{maxLen:12, house:true}, name:{no:'Radar (kuppel)', en:'Radar (radome)'}, desc:{no:'Radarkuppel på styrhustaket, montert i verkstedet. Antennen går rundt når du er på sjøen.', en:'A radome on the wheelhouse roof, fitted at the yard. The antenna turns while you are at sea.'}},
  radarA:{price:95000, fit:{minLen:10, maxLen:21}, name:{no:'Radar (åpen antenne)', en:'Radar (open array)'}, desc:{no:'Åpen radarantenne på fire fot i masta, montert i verkstedet. Den går rundt når du er på sjøen.', en:'A four-foot open radar array on the mast, fitted at the yard. It turns while you are at sea.'}},
  chirp:{price:13900, name:{no:'CHIRP-ekkolodd', en:'CHIRP sounder'}, desc:{no:'Skarpere fiskeekko og bedre skille like over bunnen. Viser fisken 0,75 nm rundt båten i kartet, og du kan velge art.', en:'Sharper fish echoes and better separation near the bottom. Shows the fish 0.75 nm around the boat on the chart, and you can choose the species.'}},
  // a searchlight sonar on a hoist through the hull (start price: the parts of a Furuno CH-37BB are about 13 200 USD, before fitting)
  sonar:{price:150000, fit:{minLen:10}, name:{no:'Sonar (søkelys)', en:'Searchlight sonar'}, desc:{no:'Ser fisken 1,5 nm rundt båten, skiller torsk, hyse og sei og viser hvor stimene trekker. Monteres med senkerør gjennom skroget.', en:'Sees the fish 1.5 nm around the boat, tells cod, haddock and saithe apart and shows where the schools are heading. Fitted with a hoist through the hull.'}},
  jukse:{price:34000, multi:true, name:{no:'Juksamaskin', en:'Electric jigging reel'}, desc:{no:'Fisker omtrent dobbelt så mye som håndjuksa. Én person kan passe tre. Med maskiner om bord passer du dem og jukser ikke selv.', en:'Catches about twice as much as a hand jig. One person can tend three. With machines aboard you tend them and do not jig by hand.'}},
  motor90:{price:148000, fit:{outboard:true}, boost:{vmax:30, lph:15}, name:{no:'Påhengsmotor 90 hk', en:'90 hp outboard'}, desc:{no:'Toppfart 30 knop, men tørstere.', en:'Top speed 30 knots, but thirstier.'}},
  // haulers for passive gear (start prices): without one, nets and line come up by hand, slowly, and pots cannot be hauled at all
  linehaler:{price:68000, name:{no:'Linehaler', en:'Line hauler'}, desc:{no:'Trekker lina jevnt og raskt.', en:'Hauls the line steadily and fast.'}},
  garnhaler:{price:95000, fit:{minLen:7.5}, name:{no:'Garnhaler', en:'Net hauler'}, desc:{no:'Trekker garna. For hånd går det sakte.', en:'Hauls the nets. By hand it is slow.'}},
  teinehaler:{price:58000, name:{no:'Teinehaler', en:'Pot hauler'}, desc:{no:'Hiver teinene opp. Teiner kan ikke trekkes for hånd.', en:'Lifts the pots. Pots cannot be hauled by hand.'}},
  // a tank of running sea water for king crab (the price is an estimate): without it a crab lives about a day in the hold, and a dead
  // one is worth nothing (05-vessels.js, sell)
  krabbekar:{price:28000, fit:{minLen:6.5}, name:{no:'Krabbekar med sjøvann', en:'Live crab tank'}, desc:{no:'Kar med sirkulerende sjøvann som holder kongekrabben levende i flere døgn. Uten kar lever den rundt et døgn i lasten, og død krabbe er verdiløs.', en:'A tank of running sea water that keeps king crab alive for days. Without it a crab lives about a day in the hold, and a dead crab is worthless.'}},
  // the knives and the gaff in three tiers, per boat, bought at the tackle shop (OPP1 of docs/planer/oppgraderinger.md; Jonas 07.11.2026:
  // «en oppgradering kutter ned på tiden brukt samt kvaliteten på sløyingen. Høtten minsker risikoen for tap av fisk generelt»). Tier 1 is
  // what every boat has aboard from the start, bought by no one, and a save without the field is tier 1; S.equip[k] holds the tier bought
  // (2 or 3). No upkeep: the crew hones the knives aboard as before, and the gaff needs nothing. Not on the ocean fleet (fit.coast). Each
  // tier's numbers are shares of the base level that add up with the others (prinsipp 1, upgSum): gut, the gutting pace over DECK.gut;
  // slip, the share off the badly gutted fish and the cuts in crewSlip; rail, the share off a fish lost over the rail; jig, the share off
  // the slip at a half hit in the jig game (JIG_SLIP); haul, the share off the time to haul a tub of line (gopUnitMin). kr is the tier's
  // price, for the knives per gutting place (VESSELS stations.table, per:'table'); tierKr. No price of its own (the shop's other lists,
  // the gifts and the web shop leave a tiered item alone)
  kniv:{tiers:[{no:'Knivene om bord', en:'The knives aboard', gut:0, slip:0, kr:0},
    {no:'Nye sløyekniver', en:'New gutting knives', gut:0.1, slip:0.3, kr:1500, per:'table'},
    {no:'Sløyekniver i ett stykke og stålhansker', en:'One-piece gutting knives and steel gloves', gut:0.2, slip:0.5, kr:4500, per:'table'}],
    fit:{coast:true}, name:{no:'Sløyekniver', en:'Gutting knives'}, desc:{no:'Skarpere kniver sløyer fortere, og færre fisk blir stygt sløyd. Mannskapet sliper dem om bord.', en:'Sharper knives gut faster, and fewer fish are gutted badly. The crew hones them aboard.'}},
  hott:{tiers:[{no:'Høtten om bord', en:'The gaff aboard', rail:0, jig:0, haul:0, kr:0},
    {no:'Stålhøtt', en:'Steel gaff', rail:0.3, jig:0.2, haul:0.04, kr:900},
    {no:'Lang høtt med krok av stål', en:'Long gaff with a steel hook', rail:0.6, jig:0.4, haul:0.08, kr:2900}],
    fit:{coast:true}, name:{no:'Høtt', en:'Gaff'}, desc:{no:'En bedre høtt tar fisken som henger løst ved ripa, så færre glipper. Lina kommer litt fortere om bord.', en:'A better gaff takes the fish that hangs loose at the rail, so fewer slip. The line comes aboard a little faster.'}}
};
// whether an item fits a vessel type: by length, and outboards only on boats with an outboard; the tiered knives and gaff not on the
// ocean fleet (coast: their factories and machines have their own numbers)
function equipFits(k, type){ const f = EQUIP[k] && EQUIP[k].fit, V = VESSELS[type]; if (!f || !V) return !!V; return !(f.minLen && V.len < f.minLen) && !(f.maxLen && V.len > f.maxLen) && !(f.outboard && !V.outboard) && !(f.house && V.fac.house === 'open') && !(f.coast && V.cls === 'hav'); }
// ---- the upgrades in tiers (OPP1 of docs/planer/oppgraderinger.md, 07.11.2026)
// The rule (prinsipp 1; Jonas 07.11.2026: «jeg mener ikke vi skal ha en renters rente-effekt på oppgraderingene. Om det står 10% økning
// feks, så betyr det at økningen er 10% opp fra grunnnivået»): every tier's per cent is of the base level, and the shares add up, never
// compound: base × upgSum(a, b) = base × (1 + a + b), not base × (1 + a) × (1 + b). A share that takes time off is negative.
function upgSum(...p){ return 1 + p.reduce((a, x) => a + (+x || 0), 0); }
// the tier a boat has of a tiered item: 1 without the field (an old save, a new boat), the tier bought otherwise; 1 on a boat it does
// not fit (the ocean fleet), whatever the field says. eq: the boat's equipment (S.equip of the boat bound now), type: her type
function equipLv(k, eq = S.equip, type = S.boat && S.boat.type){
  const E = EQUIP[k]; if (!E || !E.tiers) return 0; if (type && !equipFits(k, type)) return 1;
  const v = eq && eq[k]; return Math.max(1, Math.min(E.tiers.length, v === true ? 2 : Math.round(+v || 1)));
}
function equipTier(k, eq, type){ return EQUIP[k].tiers[equipLv(k, eq, type) - 1]; }
// what a tier costs a boat type: the knives per gutting place (tierUnits: stations.table), the gaff once
function tierUnits(k, lv, type = S.boat && S.boat.type){ const T = EQUIP[k].tiers[lv - 1], V = VESSELS[type]; return T && T.per === 'table' ? (V && V.stations && V.stations.table) || 1 : 1; }
function tierKr(k, lv, type = S.boat && S.boat.type){ const T = EQUIP[k].tiers[lv - 1]; return T ? T.kr * tierUnits(k, lv, type) : 0; }
// the knife's gutting pace over DECK.gut (deckMinute, deckEta, the work's left.sloy), and the gaff's shares (rail, jig, haul)
function knifeX(eq, type){ return upgSum(equipTier('kniv', eq, type).gut); }
function hookX(f, eq, type){ return equipTier('hott', eq, type)[f] || 0; }
// the slip at a half hit in the jig game (ui/10-rod-acts.js land): half the time at tier 1, less with a better gaff
const JIG_SLIP = 0.5;
function jigSlip(eq, type){ return JIG_SLIP * upgSum(-hookX('jig', eq, type)); }
// the burn curve's shape at speed v (knots): a planing hull has a hump before it planes, a displacement hull climbs past 90 % of top
// speed; fuelLph (03-simulation.js) scales it by fuelK, which vesselDerive sets so the boat burns V.lph at cruising speed
function fuelBase(v, vmax, planing){ return planing ? 1.0 + 0.03 * v * v + 3 * Math.exp(-(((v - vmax * 0.42) / 3) ** 2)) : 1 + 0.1 * v * v + (v > vmax * 0.9 ? (v - vmax * 0.9) * 6 : 0); }
function fuelKOf(V){ return V.lph / fuelBase(V.vcruise, V.vmax, V.planing); }
// what follows from the schema, worked out once here and never in the UI (docs/batplan.md del 4)
function vesselDerive(V){
  V.fuelK = fuelKOf(V); V.range = Math.round(V.fuelCap / V.lph * V.vcruise);
  V.watch = V.fac.house === 'hus' && V.berths >= 2; V.openOk = V.len < 11 && V.cls !== 'hav';
  V.haulers = Object.keys(EQUIP).filter(k => /haler$/.test(k) && equipFits(k, V.key));
  V.lsa = lsaOf(V);
  // the gear the rules ask for comes with the boat (V6 A, Jonas 28.10.2026): it is in std, and the shop sells it only where it is optional
  V.req = reqOf(V); V.std = [...new Set([...(V.std || []), ...V.req])];
  return V;
}
// the electronics the rules ask for, so they follow the boat and are never sold to her (Ø11.5, read on Lovdata 06.11.2026): a VHF with
// DSC on every decked boat and open boat with a wheelhouse (FOR-2013-11-22-1404 §§ 64 and 68; from 15 m FOR-2000-06-13-660 § 9-6); AIS
// from 15 m (§ 10-4a; under 15 m only an AIS-SART, which is kept inside); a bridge watch alarm from 10.67 m on a boat with an autopilot
// (every boat with a wheelhouse here has Autonav) and a vessel instruction beyond fjordfiske (§ 77; from 15 m § 10-7)
function reqOf(V){
  const house = V.fac.house !== 'open' || V.len >= 15, r = [];
  if (house) r.push('vhf'); if (V.len >= 15) r.push('ais'); if (house && V.len >= 10.67) r.push('brovakt');
  return r;
}
// a boat's equipment with what the rules ask for added, free (a boat bought, traded in or from an old save); the keys it added
function reqFill(eq, type){ const V = VESSELS[type]; if (!eq || !V) return []; const add = V.req.filter(k => !eq[k]); for (const k of add) eq[k] = true; return add; }
// the life-saving gear the rules ask for, so every boat carries it from the yard (forskrift om fiskefartøy under 15 meter,
// FOR-2013-11-22-1404, read on Lovdata 19.10.2026): a type-approved liferaft for everyone aboard on a decked boat over 6 m, hydrostatically
// released (§ 38; with three or fewer aboard a four-person ISO 9650-1 raft will do); a lifebuoy for every third person, at least one with
// 30 m of floating line under 10.67 m and two from there to 15 m, one with a line on each side, half of them with a light, all marked
// with the boat's name and home port (§ 43). From 15 m (forskrift om fiskefartøy fra 15 m, FOR-2000-06-13-660, read as a summary on
// Lovdata 05.11.2026, Ø11.5): rafts for 200 % of those aboard, one each side (§ 7-5); lifebuoys 3 under 24 m, 4 for 24-45 m, 6 for
// 45-75 m and 8 from 75 m, a light on half of them (under 24 m at least one), a smoke signal on at least two (under 24 m one), a 30 m
// line on one each side (§ 7-10); the smoke is the MOB light with smoke on its bracket (tools/deck/sikker.py mobroyk), which is the
// light as well, so smoke <= lights. A rescue boat (MOB boat, tools/deck/mob.py) from 45 m (§ 7-5; 24-45 m only from bankfiske II,
// which no boat here has). The raft's size is the smallest common one for the most aboard (skipper and crew).
const RAFT_CAP = [4, 6, 8, 10, 12, 16, 20, 25];
function lsaOf(V){
  const n = 1 + V.crewMax, cap = RAFT_CAP.find(c => c >= n) || 25, L = V.len, big = L >= 15;
  const buoys = big ? (L < 24 ? 3 : L < 45 ? 4 : L < 75 ? 6 : 8) : Math.max(L >= 10.67 ? 2 : 1, Math.ceil(n / 3));
  return {persons:n, rafts:big ? 2 : V.fac.house !== 'open' && L > 6 ? 1 : 0, cap, buoys, lines:big || L >= 10.67 ? 2 : 1, lights:Math.ceil(buoys / 2),
    smoke:!big ? 0 : L < 24 ? 1 : 2, mob:L >= 45 ? 1 : 0};
}
for (const k in VESSELS){ VESSELS[k].key = k; vesselDerive(VESSELS[k]); }
