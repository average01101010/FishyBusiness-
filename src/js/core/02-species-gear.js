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
    cls:[[67.8, 50.4, 'Over 60 kg'], [45.2, 59.3, '40–60 kg'], [22.6, 68.1, '20–40 kg'], [0, 72.6, '5,3–20 kg']], ref:3}
};
const SP = Object.keys(SPECIES);
// ---------- vessels, equipment, crew ----------
const VESSELS = {
  skiff:{name:{no:'Åpen 19-fot, 60 hk påhengs', en:'Open 19 ft, 60 hp outboard'}, draft:0.6, len:5.8, vmax:24, fuelCap:90, iceCap:150, holdCap:350, crewMax:1, diesel:false, fuelK:1, planing:true, risk:[1.0, 1.8, 10.8, 13.9], sea:0.45, price:95000, jukseMax:2, svcH:100, svcCost:3500},
  snekke:{name:{no:'Snekke 26 fot, 30 hk diesel', en:'26 ft snekke, 30 hp diesel'}, draft:1.2, len:7.9, vmax:8, fuelCap:220, iceCap:400, holdCap:900, crewMax:2, diesel:true, fuelK:0.45, planing:false, risk:[1.5, 2.5, 12.5, 16], sea:0.22, price:245000, jukseMax:3, svcH:250, svcCost:6000},
  sjark:{name:{no:'Sjark 34 fot (10,4 m), styrhus', en:'34 ft sjark (10.4 m), wheelhouse'}, draft:1.7, len:10.4, vmax:10, fuelCap:600, iceCap:1200, holdCap:3000, crewMax:3, diesel:true, fuelK:1.25, planing:false, risk:[2.2, 3.4, 14.5, 18], sea:0.16, price:1150000, jukseMax:5, svcH:250, svcCost:14000},
  sjarkny:{name:{no:'Ny sjark 10,99 m, 400 hk', en:'New 10.99 m sjark, 400 hp'}, draft:1.8, len:11, vmax:22, fuelCap:1500, iceCap:2000, holdCap:6000, crewMax:3, diesel:true, fuelK:5, planing:true, risk:[2.4, 3.8, 15, 19], sea:0.14, price:6400000, jukseMax:6, svcH:300, svcCost:22000, isNew:true}
};
const BOAT = Object.assign({}, VESSELS.skiff);
const PRICE = {fuel:23.9, diesel:14.5, ice:1.5, gear:1900, kgear:2490, tow:4500, rescue:6000, member:1250};
const fuelPrice = () => BOAT.diesel ? PRICE.diesel : PRICE.fuel;
const EQUIP = {
  vhf:{price:6500, name:{no:'VHF-radio', en:'VHF radio'}, desc:{no:'Kulingvarsel fra kystradioen og nødanrop uten mobildekning.', en:'Gale warnings from coast radio and distress calls without mobile coverage.'}},
  ais:{price:4900, name:{no:'AIS-sender (klasse B)', en:'AIS transponder (class B)'}, desc:{no:'Andre båter og redningstjenesten ser deg på AIS. Raskere hjelp ved nød.', en:'Other boats and the rescue service see you on AIS. Faster help in an emergency.'}},
  plotter:{price:24900, name:{no:'Kartplotter 9" med dybdekart', en:'9" chart plotter with depth charts'}, desc:{no:'Plottervisning med dybdefarger, relieff og dybdekurver.', en:'Plotter view with depth colours, relief and contours.'}},
  chirp:{price:13900, name:{no:'CHIRP-ekkolodd', en:'CHIRP sounder'}, desc:{no:'Skarpere fiskeekko og bedre skille like over bunnen.', en:'Sharper fish echoes and better separation near the bottom.'}},
  jukse:{price:34000, multi:true, name:{no:'Juksamaskin', en:'Electric jigging reel'}, desc:{no:'Fisker jevnere enn håndsnøre. Én person kan passe tre.', en:'Fishes more steadily than a handline. One person can tend three.'}},
  motor90:{price:148000, only:'skiff', name:{no:'Påhengsmotor 90 hk', en:'90 hp outboard'}, desc:{no:'Toppfart 30 knop, men tørstere.', en:'Top speed 30 knots, but thirstier.'}}
};
