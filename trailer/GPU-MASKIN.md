# GPU-maskinen: steg for steg

*10.11.2026. Jonas har leid en GPU-maskin (Xesktop). Her står hva som må gjøres, i rekkefølge. Kommandoene for Windows er ikke sjekket mot Claude Codes dokumentasjon (code.claude.com/docs), så følg dokumentasjonen der hvis noe avviker.*

## Steg 0: finn ut hva maskinen er

Åpne maskinen og finn svar på tre ting:

1. **Operativsystem:** Ubuntu/Linux, Mac eller Windows.
2. **Grafikkort:** Windows: Oppgavebehandling, fanen Ytelse, GPU. Ubuntu: skriv `nvidia-smi` i en terminal.
3. **Kan du laste ned filer fra maskinen til nettbrettet eller mobilen?** (Xesktop har normalt en filoverføring eller du kan bruke en delt lenke.)

Send svarene til Claude i chatten. Så vet vi hvilken vei under som gjelder.

## Vei A: Ubuntu, Linux eller Mac (enklest, Claude jobber selv fra den gamle økta)

1. Åpne en terminal og lim inn:

```bash
sudo apt-get update && sudo apt-get install -y git curl ffmpeg python3-pip python3-venv nodejs npm
pip3 install --break-system-packages playwright==1.63.0
npx -y playwright@1.63.0 install --with-deps chromium
curl -fsSL https://claude.ai/install.sh | bash
mkdir -p ~/trailer && cd ~/trailer
```

På Mac: bytt første linje med `brew install git ffmpeg node` og hopp over `sudo` og `--with-deps`.

2. Skriv `claude`, logg inn med samme konto som her, skriv `/exit`.
3. Skriv:

```bash
cd ~/trailer && claude remote-control
```

4. La terminalen stå åpen og skriv «klar» i chatten.

Resten gjør Claude.

## Vei A for Mac (iMac): det Jonas bruker

Jonas bruker iMacen sin som filmmaskin. Den leide Xesktop-maskinen trengs bare hvis iMacen viser seg å være for treg i testen (steg 5 under).

1. Åpne Terminal (Cmd+mellomrom, skriv Terminal).
2. Installer Homebrew hvis det mangler. Hopp over steget hvis `brew --version` svarer:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Homebrew skriver to linjer til slutt under «Next steps». Kjør dem også.

3. Installer verktøyene:

```bash
brew install git ffmpeg node python
pip3 install --break-system-packages playwright==1.63.0
python3 -m playwright install chromium
curl -fsSL https://claude.ai/install.sh | bash
```

4. Lukk Terminal og åpne den på nytt. Så:

```bash
mkdir -p ~/trailer && cd ~/trailer
claude
```

Logg inn med samme konto som her, og skriv `/exit`. Start deretter Remote Control:

```bash
cd ~/trailer && claude remote-control
```

5. Åpne et nytt Terminal-vindu og hold Macen våken mens vi jobber:

```bash
caffeinate -dis
```

La begge vinduene stå åpne og skriv «klar» i chatten. Claude tester først hvor raskt iMacen tegner, og sier fra om den er for treg.

## Vei B: Windows (egen økt på maskinen)

Remote Control kobler ikke Windows til den gamle økta. Da kjører Claude Code direkte på maskinen, og Jonas snakker med den økta i stedet.

1. Installer **Git for Windows** fra git-scm.com (alle standardvalg).
2. Åpne PowerShell og installer Claude Code. Slik jeg kjenner det, er kommandoen under, men sjekk den mot installasjonssiden i dokumentasjonen:

```powershell
irm https://claude.ai/install.ps1 | iex
```

3. Installer **Node.js** (LTS, nodejs.org) og **Python 3.12 eller nyere** (python.org, huk av «Add to PATH»). Installer **ffmpeg**:

```powershell
winget install --id Gyan.FFmpeg -e
```

4. Hent spillet og start:

```powershell
mkdir C:\trailer; cd C:\trailer
git clone https://github.com/average01101010/FishyBusiness-.git
cd FishyBusiness-
git checkout ccr-d0173bf9-nbjlos
claude
```

Nettleseren åpnes for innlogging til både Claude og GitHub. Bruk samme kontoer som ellers.

5. Lim inn startmeldingen fra `trailer/tools/START-PA-GPU-MASKINEN.md` som første melding i den økta.

## Musikken (begge veier)

Låta må lages i en konto. Velg én:

1. **Suno:** lag versjonene etter `trailer/audio/SUNO-PROMPT.md` og legg filene i `trailer/audio/suno/` på maskinen.
2. **ElevenLabs:** har du en betalt konto, kan Claude lage musikken selv. Nøkkelen legges i et sikkert skjema, aldri i chatten.

Uten musikk filmer vi likevel alle klippene, og klipper til musikken når den kommer.

## Hva som skjer etterpå

- Claude filmer klippene i 1080×1920, tar stillbilder og kontaktark, og skyver de små kontaktarkene til repoet så du ser dem.
- Selve videofilene blir liggende på maskinen. Du henter dem derfra for å se dem på nettbrettet og skriver notater med tidskode.
