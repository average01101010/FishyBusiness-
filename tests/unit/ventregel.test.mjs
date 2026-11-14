// FB7 (steg 125, sixth session; Jonas 14.11.2026, «Valg A»): the waiting rule. Nobody starts a take while another stands in the
// way of the thing: the hauler does not gaff while the bleeder is down at the fish in the sweep, the gutter does not take a fish from
// the tub through the man beside him, the packer does not go for ice while somebody passes where the shovel swings. The rule's own
// reckoning (deckcrew.js VENT), without a browser: who stands in the way of a reach from a to b, and how the wait comes on and goes.
export const scripts = ['js/figpose.js', 'js/vessel3d.js', 'js/deckcrew.js'];
export const data = true;

export default function (t){
  const {VENT} = t.K;
  t.ok(!!VENT && typeof VENT.inWay === 'function', 'ventregelen finnes (deckcrew.js VENT)'); if (!VENT) return;
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  t.ok(near(VENT.seg([0.5, 0.3], [0, 0], [1, 0]), 0.3) && near(VENT.seg([-0.4, 0.3], [0, 0], [1, 0]), 0.5) && near(VENT.seg([1.3, 0.4], [0, 0], [1, 0]), 0.5) && near(VENT.seg([0.2, 0], [0, 0], [0, 0]), 0.2), 'avstanden til veien fra a til b: midt på, forbi begge endene, og når a og b er samme punkt');
  t.ok(VENT.inWay([0, 0], [1.2, 0], [[0.6, 0.2]], VENT.pass) === true, 'en som står 20 cm fra veien, står i veien');
  t.ok(VENT.inWay([0, 0], [1.2, 0], [[0.6, VENT.pass + 0.01]], VENT.pass) === false && VENT.inWay([0, 0], [1.2, 0], [], VENT.pass) === false, 'en som står lenger unna enn grensa, og ingen, står ikke i veien');
  t.ok(VENT.inWay([0, 0], [1.2, 0], [[3, 3], [1.5, 0.1]], VENT.shovel) === true, 'en som står like bak målet (isen), står i veien for spaden');
  // the wait comes on and goes over VENT.ease s, whatever the frame rate, and stays between 0 and 1
  let w = 0; for (let i = 0; i < 10; i++) w = VENT.blend(w, true, VENT.ease / 10); t.ok(near(w, 1), 'ventingen er helt på etter VENT.ease sekunder i ti steg', w);
  t.ok(near(VENT.blend(0, true, VENT.ease), 1) && near(VENT.blend(0.2, true, 60), 1) && near(VENT.blend(0.7, false, 60), 0), 'og i ett steg, og aldri over 1 eller under 0 etter en lang pause');
  t.ok(near(VENT.blend(0.5, true, 0), 0.5) && near(VENT.blend(0.5, false, 0), 0.5), 'uten tid endres ingenting (testene tegner om igjen uten at klokka går)');
  t.ok(VENT.bleed > 0.6 && VENT.bleed <= 1.75, 'haleren venter til bløggeren er oppe med fisken (nede til 0,6 s), og ikke lenger enn et høttetak', VENT.bleed);
}
