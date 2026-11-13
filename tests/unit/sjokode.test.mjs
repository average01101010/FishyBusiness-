// seaCode (core/03b-sea.js): the sea state by its significant wave height, the Douglas scale. It was called seaState until deckcrew.js got
// a seaState() of its own (the crew's sea legs, FB4) and took its place in the page's one scope: seaHere().code became an object, and the
// Vær app said «0,1 m · undefined» (found in D5, 13.11.2026).
export default function (t){
  const {seaCode} = t.K;
  t.eq([0.02, 0.07, 0.3, 1, 2, 3, 5, 7, 10, 15].map(seaCode).join(), '0,1,2,3,4,5,6,7,8,9', 'the Douglas scale from glassy to phenomenal');
}
