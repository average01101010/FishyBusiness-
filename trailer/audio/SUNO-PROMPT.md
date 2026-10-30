# Musikken: bestilling til Suno

*Valgt 30.10.2026. Jonas lot valget stå til oss. Vi velger retning A, «nordisk og nedpå», fordi traileren bæres av musikken alene (ingen stemme i masteren, motorlyden kommer eventuelt senere), fordi hovedpublikummet er kystfolk som kjenner igjen trebåten, og fordi en varm, akustisk låt skiller seg fra alt annet i TikTok-strømmen, der det meste er elektronisk. Retning B lages som reserve i samme økt, så vi kan sammenligne på bildene.*

## Krav som gjelder begge

- **Lengde:** 90 sekunder eller mer, så vi har nok å klippe fra. Vi klipper selv til rundt 62 s, slag mot slag.
- **Tempo:** 96 BPM. Det ligger nær tomgangspulsen til en semidiesel, så motoren kan legges i samme puls senere.
- **Form:** stille start i 8–10 s uten trommer (plass til reallyd eller stillhet), tydelig oppbygning, ett tydelig drop rundt 40 s, en rolig hale etter droppet, og ett kraftig, rent sluttslag med etterklang (logoen ligger på det).
- **Ingen vokal, ingen tekst.** Humming eller kor uten ord går.
- **Mastring:** åpen og luftig, ikke presset. Vi mikser selv til −14 LUFS.
- **Lag 3 versjoner av A og 2 av B.** Last ned i høyeste kvalitet (WAV om mulig) til `trailer/audio/suno/`.

## Retning A, hovedvalget: nordisk og nedpå

Stil-prompt (lim inn i Suno sitt stilfelt):

> cinematic nordic folk, hardanger fiddle lead, soft accordion, warm upright bass, slow build, deep taiko-like drum hits on the drop, wide reverb, melancholic but hopeful, northern norway coast, 96 bpm, instrumental, no vocals

Beskrivelse (lim inn i tekst- eller beskrivelsesfeltet, eller bruk som «Custom» uten tekst):

> Opens quiet: a single fiddle over the sound of a calm sea, sparse accordion chords. Slowly adds bass and a soft pulse. Builds for forty seconds, then a big, warm drop with deep drums and the fiddle melody in full. After the drop a calm, open passage with long notes. Ends on one strong final hit with a long tail.

Det vi lytter etter når vi velger: at første drop er umiskjennelig (det er bildet av snurperen under brua), at det stille partiet før droppet tåler å ha bare bilde på seg, og at sluttslaget er rent nok til å bære logoen.

## Retning B, reserven: moderne kyst

> cinematic electronic, soft four-on-the-floor pulse, airy synth pads, one acoustic instrument on top (nyckelharpa or cello), slow build, big clean drop, nordic, cold and bright, 96 bpm, instrumental, no vocals

> Starts with pads and distant sea. A quiet pulse comes in, then the cello melody. Builds steadily to a wide, clean drop at about forty seconds. Calm outro with pads only. One final hit with reverb tail.

## Etter nedlasting

1. Filene legges i `trailer/audio/suno/` med navn `A1.wav`, `A2.wav`, `A3.wav`, `B1.wav`, `B2.wav`.
2. Vi analyserer tempo, slag, takter og nivå per takt (`tools/beats.py`, lages i F3), og legger hver låt under kontaktarkene og forhåndsvisningene.
3. Vi velger én, klipper den til lengden slag mot slag og skriver klippekartet `audio/music-edit-1.json`. Alle tider i opptakslista flyttes så til slagene i kartet.
