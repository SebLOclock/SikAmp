# SikAmp

> Lecteur audio desktop open-source qui recree l'experience Winamp classique avec des technologies modernes.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![Vue.js](https://img.shields.io/badge/Vue.js-3-green)
![Rust](https://img.shields.io/badge/Rust-backend-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## Fonctionnalites

- Lecture audio MP3, FLAC, WAV et OGG
- Interface fidelement inspiree du skin Winamp classique
- Controles complets : play, pause, stop, previous, next, seek, volume
- Extraction et affichage des metadonnees (titre, artiste, duree)
- Drag & drop de fichiers et dossiers pour alimenter la playlist
- Playlist avec surlignage du morceau en cours
- Chargement progressif des grandes playlists (500+ pistes)
- Rendu Canvas 2D crisp pour ecrans HiDPI

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Vue.js 3, Pinia, Canvas 2D |
| Build | Vite |
| Backend | Rust |
| Desktop | Tauri v2 |
| Audio | Web Audio API |
| Metadonnees | lofty (Rust) |
| Tests | Vitest, Vue Test Utils |

## Prerequis

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) 1.70+
- [Tauri CLI v2](https://tauri.app/start/)

## Installation

```bash
git clone https://github.com/SebLOclock/winamp-sik.git
cd winamp-sik
npm install
```

## Utilisation

### Developpement

```bash
npm run tauri dev
```

Lance le serveur Vite avec hot reload et compile le backend Rust. L'application desktop s'ouvre automatiquement.

### Build de production

```bash
npm run tauri build
```

Genere les binaires natifs et installeurs dans `src-tauri/target/release/bundle/`.

### Autres commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur Vite seul (sans Tauri) |
| `npm run lint` | Verification ESLint |
| `npm run lint:fix` | Correction automatique ESLint |
| `npm run format` | Formatage Prettier |
| `npm run test` | Tests Vitest |
| `npm run test:watch` | Tests en mode watch |

## Structure du projet

```
winamp-sik/
├── src/                    # Frontend Vue.js
│   ├── components/
│   │   ├── player/         # TitleBar, Display, Controls, Seek, Volume
│   │   └── playlist/       # PlaylistPanel, PlaylistItem, DropZone
│   ├── composables/        # Logique reutilisable (file drop, keyboard)
│   ├── engine/             # audioEngine.js, skinRenderer.js
│   ├── stores/             # Pinia (player, playlist, skin, preferences)
│   └── utils/              # Constantes, formatters, IPC
├── src-tauri/              # Backend Rust
│   ├── src/
│   │   ├── commands/       # Commandes IPC (fichiers, audio)
│   │   ├── file_manager/   # Operations fichiers
│   │   └── skin_parser/    # Parsing .wsz
│   └── tauri.conf.json     # Configuration Tauri
└── docs/                   # Landing page GitHub Pages
```

## Plateformes supportees

- Windows 10+
- macOS (2 dernieres versions)
- Linux (Ubuntu, Fedora, Debian)

## Contribuer

Les contributions sont les bienvenues ! N'hesitez pas a ouvrir une issue ou une pull request.

## Licence

MIT
