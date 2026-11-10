# GPU-maskinen: slik kobler du den til

*10.11.2026. Jonas har leid en GPU-maskin (Xesktop). Claude gjør alt arbeidet på den gjennom Remote Control. Det eneste Jonas gjør, er å koble maskinen til.*

## Krav

- **Linux (Ubuntu) eller Mac.** Remote Control virker ikke fra Windows. Velg et Ubuntu-skrivebord hos Xesktop hvis det går. Er det bare Windows, si fra, så lages et eget skript for det.
- NVIDIA-driver installert (det følger normalt med GPU-maskinen).
- Samme Claude-konto som denne økta.

## Steg 1: lim inn dette i en terminal på maskinen

```bash
sudo apt-get update && sudo apt-get install -y git curl ffmpeg python3-pip python3-venv nodejs npm
pip3 install --break-system-packages playwright==1.63.0
npx -y playwright@1.63.0 install --with-deps chromium
curl -fsSL https://claude.ai/install.sh | bash
mkdir -p ~/trailer && cd ~/trailer
```

Hvis `pip3` klager på `--break-system-packages`, kjør linja uten den.

## Steg 2: logg inn og start Remote Control

```bash
claude
```

Følg innloggingen (samme konto). Avslutt med `/exit`. Så:

```bash
cd ~/trailer && claude remote-control
```

La terminalen stå åpen. Skriv i chatten at maskinen er klar.

## Steg 3: ingenting

Resten gjør Claude fra denne økta: kloner repoet til `~/trailer`, henter kartet for hele kysten, bygger spillet, filmer alle klippene i 1080×1920 med GPU, klipper musikken, setter sammen og mikser. Filene havner i `~/trailer/FishyBusiness-/trailer/rough/` og til slutt i `levering/`.

## Musikken

Låta er det eneste Claude ikke kan lage selv uten en konto. To veier, Jonas velger:

1. **Suno:** lag versjonene etter `audio/SUNO-PROMPT.md` (5–10 minutter) og legg filene i `trailer/audio/suno/` på GPU-maskinen, eller send dem i chatten.
2. **ElevenLabs:** har Jonas en betalt ElevenLabs-konto, kan Claude lage musikken selv gjennom Eleven Music med en API-nøkkel som legges inn i det sikre skjemaet (aldri i chatten). Da gjør Jonas ingenting.
