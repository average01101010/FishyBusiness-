// No quay built out over another boat's place (steg 36, 13.11.2026; Jonas: «vi kan ikke ha det sånn at det er kaier på innsiden av andre
// kaier»): core/05-vessels.js quayClear, the test moorHarbour puts each place through. A face along x (its water to +z), a boat of 10 m
// at a = 0 with her quay 8 m out: the quay from 3 m in on the land to 8 m out, 7 m each way along the face (her length and 2 m each end).
export default function (t){
  const {quayClear} = t.K, f = {x:0, z:0, ux:1, uz:0, nx:0, nz:1}, hd = Math.PI / 2;   // (a boat lying along the face)
  const boat = (x, z, L = 10, B = 3.5) => ({p:{x:x / 1000, y:z / 1000}, hd, L, B});
  t.eq(quayClear(f, 0, 10, 8, []), true, 'ingen båt: kaia kan bygges');
  t.eq(quayClear(f, 0, 10, 8, [boat(0, 5)]), false, 'en båt 5 m ut midt foran: kaia ut til 8 m ville stått over henne');
  t.eq(quayClear(f, 0, 10, 8, [boat(0, 12)]), true, 'en båt 12 m ut (sida 10,25 m): klar av kaia');
  t.eq(quayClear(f, 0, 10, 8, [boat(9, 5)]), false, 'nabobåten 9 m langs kaia og 5 m ut: kaias ende (7 m) står over baugen hennes (4 m)');
  t.eq(quayClear(f, 0, 10, 8, [boat(13, 5)]), true, 'nabobåten 13 m langs kaia: klar (hun begynner 8 m bort, kaia slutter 7 m)');
  t.eq(quayClear(f, 0, 10, 8, [Object.assign(boat(0, 5), {q:true})]), true, 'en annen kai (q) er ikke en båt: kaiene kan møtes');
  t.eq(quayClear(f, 0, 10, 0.2, [boat(0, 5)]), true, 'ingen kai bygd ut (0,2 m): ingenting å stå over');
  t.eq(quayClear(f, 20, 10, 8, [boat(0, 5)]), true, 'kaia 20 m bort langs fronten: klar av båten ved a = 0');
}
