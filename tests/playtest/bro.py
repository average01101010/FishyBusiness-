#!/usr/bin/env python3
"""bro: styr nettbrettet med spillet.

Bruk: bro <kommando> [argumenter]

  bilde                      ta et skjermbilde av nettbrettet (se på det med Read-verktøyet)
  trykk X Y                  trykk med fingeren på punktet (X, Y) i pikselkoordinater
  trykk "tekst"              trykk på en synlig knapp eller tekst som inneholder teksten
  hold X Y [sek]             hold fingeren nede (standard 1 s, maks 10)
  dra X1 Y1 X2 Y2 [ms]       dra fingeren fra ett punkt til et annet (f.eks. flytte kartet)
  knip X Y faktor            to fingre: faktor over 1 zoomer inn, under 1 zoomer ut
  rull X Y piksler           sveip for å rulle en liste (positivt tall ruller nedover)
  velg X Y "valg"            velg i en nedtrekksliste (trykk på lista først for å se valgene)
  skriv "tekst"              skriv med tastaturet i feltet som er valgt
  tast Enter                 trykk en tast (Enter, Tilbake, Esc)
  vent sek                   la tiden gå mens du ser på skjermen (maks 600 s)
  borte timer                legg fra deg nettbrettet i så mange timer (0,25 til 12), som å lukke appen og komme tilbake
  tekst                      les all synlig tekst på skjermen
  snu                        snu nettbrettet mellom liggende og stående
  lastinn                    last inn siden på nytt, som å lukke og åpne appen
  dagbok "tekst"             skriv i dagboka di

Tiden i spillet står stille mens du tenker. Hver handling bruker et par sekunder, som for en vanlig spiller.
Punktet (0, 0) er øverst til venstre. «bro bilde» forteller hvor stor skjermen er.
Hver kommando som endrer noe skriver ut stien til et nytt skjermbilde.
"""
import json, socket, sys

PORT = 8765


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ('hjelp', '-h', '--help'):
        print(__doc__.strip())
        return
    cmd, args = sys.argv[1], sys.argv[2:]
    try:
        s = socket.create_connection(('127.0.0.1', PORT), timeout=10)
    except OSError:
        print('Nettbrettet svarer ikke akkurat nå. Prøv igjen om litt.')
        sys.exit(1)
    s.settimeout(720)
    s.sendall((json.dumps({'cmd': cmd, 'args': args}, ensure_ascii=False) + '\n').encode('utf-8'))
    buf = b''
    while not buf.endswith(b'\n'):
        chunk = s.recv(65536)
        if not chunk:
            break
        buf += chunk
    s.close()
    try:
        print(json.loads(buf.decode('utf-8'))['text'])
    except Exception:
        print('Fikk ikke noe svar fra nettbrettet.')
        sys.exit(1)


if __name__ == '__main__':
    main()
