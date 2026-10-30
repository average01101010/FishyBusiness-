// The village contest's parts of the coast (core/03e-rules.js landsdel; docs/planer/oppdrag-2.md F3, 31.10.2026): the four regions by
// latitude and longitude, tried on towns along the whole coast, and the names the cards use.
export default function (t){
  const {landsdel, LANDSDEL, P, newState} = t.K;
  t.K.set('S', newState());
  const at = (lat, lon) => landsdel(P(lat, lon));
  t.eq(at(70.66, 23.68), 'nord', 'Hammerfest er Nord-Norge'); t.eq(at(69.65, 18.96), 'nord', 'Tromsø er Nord-Norge'); t.eq(at(67.28, 14.4), 'nord', 'Bodø er Nord-Norge'); t.eq(at(65.47, 12.2), 'nord', 'Brønnøysund er Nord-Norge');
  t.eq(at(64.86, 11.24), 'midt', 'Rørvik er Midt-Norge'); t.eq(at(63.43, 10.4), 'midt', 'Trondheim er Midt-Norge'); t.eq(at(62.47, 6.15), 'midt', 'Ålesund er Midt-Norge'); t.eq(at(62.98, 7.04), 'midt', 'Kristiansund er Midt-Norge');
  t.eq(at(61.93, 5.11), 'vest', 'Måløy er Vestlandet'); t.eq(at(60.39, 5.32), 'vest', 'Bergen er Vestlandet'); t.eq(at(58.97, 5.73), 'vest', 'Stavanger er Vestlandet'); t.eq(at(58.3, 6.66), 'vest', 'Flekkefjord er Vestlandet');
  t.eq(at(58.15, 8.0), 'sor', 'Kristiansand er Sørlandet'); t.eq(at(58.46, 8.77), 'sor', 'Arendal er Sørlandet'); t.eq(at(59.13, 10.22), 'sor', 'Tønsberg er Oslofjorden'); t.eq(at(59.21, 10.93), 'sor', 'Fredrikstad er Oslofjorden');
  t.ok(['nord', 'midt', 'vest', 'sor'].every(k => LANDSDEL[k] && LANDSDEL[k].length === 2), 'alle fire landsdelene har navn på begge språk');
}
