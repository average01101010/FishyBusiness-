// The dredged pocket at a rorbu's and the naust's berth (core/07-harbours.js sitePockE, siteOut; steg 126 AS1, 14.11.2026): it reaches
// out as far as the quay is built to her (quayOut with the 15 m limit). At the naust on Kvitsøy and Smøla nord the fine coast lay 16 m
// out from the naust's face, she lay 20 m out, and the pocket's 14 m left her on 2.0 m (tests/allesteder.py, «for grunt der hun ligger»).
// A site's face at (0, 0) along the z axis: out to sea is -x.
export default function (t){
  const K = t.K, keep = K.get('quayOut'), OUT = K.get('SITE_OUT'), W = K.get('SITE_POCK').w;
  const s = {o:[0, 0], u:[0, 1]};
  try {
    K.set('quayOut', () => 0); OUT.clear();
    t.eq(K.sitePockE(s, -10, 0), 0, 'sitePockE: 10 m ut fra fronten er i lomma når kaia ikke er bygd ut');
    t.near(K.sitePockE(s, -20, 0), 20 - W, 1e-9, 'sitePockE: 20 m ut er utenfor lomma på 14 m når kaia ikke er bygd ut');
    K.set('quayOut', () => 16); OUT.clear();
    t.eq(K.sitePockE(s, -20, 0), 0, 'sitePockE: med kaia bygd 16 m ut er 20 m ut (der hun ligger) i lomma (Kvitsøy)');
    t.near(K.sitePockE(s, -32, 0), 2, 1e-9, 'sitePockE: lomma når 14 m forbi kaias ende, ikke lenger');
    t.eq(K.siteOut(s), 16, 'siteOut: kaia ut til henne, regnet for 15 m');
    K.set('quayOut', () => -1); OUT.clear();
    t.eq(K.siteOut(s), K.get('QOUT').max, 'siteOut: vannet lenger ut enn kaia kan bygges: kaia så langt den går (QOUT.max)');
    K.set('quayOut', () => NaN); OUT.clear();
    t.ok(Number.isNaN(K.siteOut(s)) && K.sitePockE(s, -10, 0) === 0 && OUT.size === 0, 'siteOut: ukjent før kysten er lastet (ikke husket), og lomma er som før da');
  } finally { K.set('quayOut', keep); OUT.clear(); }
}
