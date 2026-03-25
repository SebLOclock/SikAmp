---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-21'
inputDocuments:
  - product-brief-winamp-sik-2026-03-21.md
  - prd.md
  - prd-validation-report.md
  - ux-design-specification.md
workflowType: 'architecture'
project_name: 'SikAmp'
user_name: 'Seb'
date: '2026-03-21'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 40 FRs répartis en 10 domaines
- Coeur du player : lecture multi-format (MP3/FLAC/WAV/OGG), crossfade configurable (1-12s), playlists CRUD
- Système de skins .wsz avec changement en temps réel et double mode de rendu (retro/moderne)
- Infrastructure : auto-update signé, landing page statique avec liens dynamiques, CI/CD multi-plateforme
- Accessibilité : navigation clavier complète, labels ARIA, compatibilité lecteurs d'écran

**Non-Functional Requirements:**
- Performance : démarrage < 5s, crossfade sans artefact, chargement 500+ morceaux non-bloquant
- Sécurité : mises à jour signées HTTPS, zéro télémétrie, formulaire satisfaction opt-in minimal
- Compatibilité : Windows 10+, macOS (2 dernières versions majeures), Ubuntu/Fedora/Debian
- Installeur < 100 Mo, installation < 2 minutes

**Scale & Complexity:**
- Domaine primaire : Application desktop multi-plateforme
- Niveau de complexité : Moyen
- Composants architecturaux estimés : 6-8 modules majeurs (AudioEngine, SkinEngine, PlaylistManager, UpdateManager, UIComponents, EventBus, StorageLayer, CI/CD Pipeline)

### Technical Constraints & Dependencies

- Un seul codebase pour 3 OS — framework cross-platform obligatoire
- Crossfade = lecture simultanée de 2 flux audio avec mixing en temps réel — critère éliminatoire pour le choix du framework
- Skins .wsz = archives ZIP contenant des sprites bitmap — nécessite un parseur et un moteur de rendu custom
- Signature des binaires : Apple Developer Program (macOS), Authenticode (Windows) — budget ~200$/an
- Offline-first : toutes les fonctions coeur sans connexion, auto-update gracieux
- Open-source dès le jour 1 : architecture lisible, contribution facilitée
- Dev solo assisté par IA : l'architecture doit rester simple et maintenable

### Cross-Cutting Concerns Identified

1. **Skinning** — traverse TOUS les composants UI. Le SkinEngine est un service central qui alimente chaque composant en assets. Un changement de skin déclenche un refresh global instantané.
2. **Accessibilité** — chaque composant interactif expose des rôles et labels ARIA indépendamment du skin visuel. Les deux couches (visuelle et sémantique) sont découplées.
3. **Résilience / Gestion d'erreurs** — pattern transversal : aucune erreur ne doit interrompre la lecture ou bloquer l'UI. Skip automatique, fallback silencieux, messages éphémères.
4. **Persistance** — préférences (skin actif, volume, crossfade, mode rendu), position/taille de fenêtre, dernière playlist — sauvegarde automatique locale.
5. **Événements** — architecture événementielle (EventBus) pour découpler audio, UI, skins et playlists. Couplage faible entre les modules.

## Starter Template Evaluation

### Primary Technology Domain

Application desktop multi-plateforme — évaluation centrée sur les frameworks desktop cross-platform avec support Vue.js.

### Préférences Techniques de l'Utilisateur

- **Langages** : Très à l'aise en JavaScript, moins en TypeScript. Rust = découverte souhaitée.
- **Framework front** : À l'aise avec React, Vue, Svelte. Préférence pour Vue.js.
- **Priorité** : Performance avant tout.
- **CI/CD** : GitHub Actions.

### Starter Options Considered

| Critère | Tauri v2 + Vue | Electron + Vue |
|---|---|---|
| Taille installeur | ~5-15 Mo | ~80-150 Mo |
| Mémoire au repos | ~30-50 Mo | ~200-300 Mo |
| Démarrage | < 500 ms | 1-2 secondes |
| Backend | Rust (natif) | Node.js |
| Auto-update | Plugin officiel (tauri-plugin-updater), signature obligatoire, GitHub Releases | electron-updater |
| Audio/Crossfade | Web Audio API (webview native OS) | Web Audio API (Chromium embarqué) |
| Maturité | v2.10.3 stable, adoption +35%/an | Très mature, écosystème massif |

### Selected Starter: Tauri v2 + Vue.js (via create-tauri-app)

**Rationale for Selection:**
- Performance native supérieure (priorité utilisateur n°1) — démarrage < 500 ms, mémoire ~30-50 Mo
- Installeur ~5-15 Mo — largement sous la contrainte PRD de < 100 Mo
- Auto-update signé natif via `tauri-plugin-updater` + GitHub Releases (FR26-FR28, NFR5-NFR6)
- Web Audio API disponible dans la webview pour le crossfade equal-power (FR7-FR9)
- Backend Rust pour les opérations lourdes : parsing .wsz (ZIP), lecture système de fichiers, gestion audio bas niveau si nécessaire
- Aligné avec le souhait de découvrir Rust
- Open-source friendly, communauté active

**Initialization Command:**

```bash
cargo create-tauri-app winamp-sik --template vue
# Sélectionner JavaScript comme flavor
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Frontend : JavaScript + Vue.js 3
- Backend : Rust (Tauri core)
- Communication : Tauri IPC (invoke commands Rust depuis JS)

**Build Tooling:**
- Vite pour le frontend (HMR, build optimisé, tree-shaking)
- Cargo pour le backend Rust
- Tauri CLI pour le packaging multi-plateforme

**Code Organization:**
- `src/` — application Vue.js (frontend)
- `src-tauri/` — backend Rust (commandes Tauri, configuration)
- `src-tauri/tauri.conf.json` — configuration Tauri (fenêtre, permissions, plugins)

**Development Experience:**
- Hot Module Replacement via Vite (dev server localhost:5173)
- Rechargement automatique du backend Rust en dev
- DevTools intégrés dans la webview

**Note:** L'initialisation du projet via cette commande sera la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Framework desktop : Tauri v2 + Vue.js 3 + Vite + JavaScript/Rust
2. Moteur audio : Web Audio API (crossfade equal-power natif)
3. Parsing skins .wsz : Rust (crate zip) + extraction temp dir + protocole asset: Tauri
4. Rendu skins : Canvas 2D (double mode retro/moderne via imageSmoothingEnabled)

**Important Decisions (Shape Architecture):**
5. State management : Pinia (stores modulaires)
6. Stockage local : Tauri Store (préférences) + fichiers M3U/M3U8 (playlists)
7. CI/CD : GitHub Actions + tauri-apps/tauri-action
8. Landing page : GitHub Pages (statique)
9. Qualité code : ESLint + Prettier (JS/Vue), rustfmt + clippy (Rust)

**Deferred Decisions (Post-MVP):**
- Système de plugins (V2-V3)
- Streaming intégré (V2+)
- Plateforme d'échange de skins (V3)

### Data Architecture

| Décision | Choix | Rationale |
|---|---|---|
| Préférences utilisateur | Tauri Store (plugin-store) | Key-value persistant intégré, API simple côté JS, zéro config |
| Playlists | Fichiers M3U/M3U8 | Standard de l'industrie, compatible avec d'autres players, lisible |
| Cache skins | Dossier temporaire local | Extraction .wsz → temp dir, accès via protocole asset: Tauri |
| Position/taille fenêtre | Tauri Store | Persisté avec les autres préférences |

### Audio & Crossfade

| Décision | Choix | Rationale |
|---|---|---|
| Moteur audio | Web Audio API | Crossfade equal-power natif via AudioContext + GainNode, deux sources simultanées, API standard dans la webview Tauri |
| Décodage formats | Webview native | MP3, FLAC, WAV, OGG supportés nativement par les webviews modernes |
| Contrôle audio | Frontend JS (stores Pinia) | Volume, seek, play/pause/stop gérés côté Vue, pas d'IPC pour les contrôles temps réel |

### Skin Engine

| Décision | Choix | Rationale |
|---|---|---|
| Parsing .wsz | Rust (crate zip) | Décompression performante, accès natif au filesystem |
| Exposition assets | Extraction temp dir + protocole asset: Tauri | Léger, pas de sérialisation base64, chargement natif des images |
| Rendu | Canvas 2D | Contrôle pixel-perfect, nearest-neighbor natif pour mode rétro, bilinear pour mode moderne |
| Changement de skin | Extraction nouveau .wsz → mise à jour chemins → réactivité Vue | Instantané, pas de rechargement |

### Frontend Architecture

| Décision | Choix | Rationale |
|---|---|---|
| State management | Pinia | Standard Vue 3, stores modulaires, devtools intégrés |
| Stores prévus | usePlayerStore, usePlaylistStore, useSkinStore, usePreferencesStore | Découpage par domaine, couplage faible |
| Communication inter-stores | Actions Pinia (EventBus pattern) | Les actions d'un store déclenchent des effets dans les autres |
| Composants UI | Composants Vue wrappant des Canvas | Chaque composant (Display, Controls, Playlist) gère son propre canvas skinné |

### Infrastructure & Deployment

| Décision | Choix | Rationale |
|---|---|---|
| CI/CD | GitHub Actions + tauri-apps/tauri-action | Build multi-plateforme automatisé, signature, artefacts en draft release |
| Build matrix | windows-latest, macos-latest, ubuntu-latest | 3 OS en parallèle |
| Déclenchement | Push de tag Git | Release contrôlée par le mainteneur |
| Auto-update | tauri-plugin-updater + latest.json sur GitHub Releases | Signature obligatoire, HTTPS, intégré à Tauri |
| Landing page | GitHub Pages (dossier docs/ ou branche gh-pages) | Gratuit, intégré au repo, déploiement automatique |
| Linting JS | ESLint + Prettier | Standard communautaire |
| Linting Rust | rustfmt + clippy | Standard écosystème Rust |

### Project Structure

```
winamp-sik/
├── src/                    # Frontend Vue.js
│   ├── assets/             # Assets statiques (skin par défaut, jingle)
│   ├── components/         # Composants Vue (Display, Controls, Playlist...)
│   ├── stores/             # Stores Pinia (player, playlist, skin, prefs)
│   ├── engine/             # AudioEngine (Web Audio API), SkinRenderer (Canvas)
│   ├── utils/              # Helpers, constantes
│   ├── App.vue
│   └── main.js
├── src-tauri/              # Backend Rust
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/       # Commandes Tauri (IPC)
│   │   ├── skin_parser/    # Parseur .wsz
│   │   └── file_manager/   # Lecture fichiers audio, playlists
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                 # Fichiers publics (favicon, etc.)
├── docs/                   # Landing page (GitHub Pages)
└── .github/workflows/      # CI/CD GitHub Actions
```

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialisation Tauri + Vue + Pinia (starter)
2. Structure de dossiers + ESLint/Prettier + rustfmt/clippy
3. AudioEngine (Web Audio API) — lecture simple d'un fichier
4. SkinParser (Rust) — décompression .wsz + exposition via asset:
5. SkinRenderer (Canvas 2D) — rendu du skin par défaut
6. Composants UI skinnés (Display, Controls, Playlist)
7. Crossfade (deux AudioContext sources + GainNodes)
8. Gestion playlists (M3U/M3U8) + Tauri Store (préférences)
9. Auto-update (tauri-plugin-updater)
10. CI/CD (GitHub Actions + tauri-action)
11. Landing page (GitHub Pages)

**Cross-Component Dependencies:**
- SkinEngine → tous les composants UI (fournit les assets)
- AudioEngine → PlayerStore → composants contrôles (état de lecture)
- PlaylistStore → AudioEngine (file d'attente des morceaux)
- PreferencesStore → AudioEngine (crossfade on/off, durée) + SkinEngine (mode rendu)
- Tauri IPC → SkinParser (chargement .wsz) + FileManager (lecture fichiers audio/playlists)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Points de conflit potentiels identifiés :** 5 catégories majeures où des agents IA pourraient faire des choix divergents sans règles explicites.

### Naming Patterns

**Conventions de nommage :**

| Zone | Convention | Exemple |
|---|---|---|
| Fichiers Vue | PascalCase `.vue` | `PlayerDisplay.vue`, `SkinSelector.vue` |
| Fichiers JS | camelCase `.js` | `audioEngine.js`, `skinRenderer.js` |
| Fichiers Rust | snake_case `.rs` | `skin_parser.rs`, `file_manager.rs` |
| Dossiers | kebab-case | `src/components/`, `src/stores/` |
| Composants Vue | PascalCase | `<PlayerDisplay />`, `<TransportControls />` |
| Stores Pinia | `use[Nom]Store` camelCase | `usePlayerStore`, `useSkinStore` |
| Variables/fonctions JS | camelCase | `currentTrack`, `loadSkin()` |
| Fonctions Rust | snake_case | `parse_wsz()`, `read_audio_files()` |
| Commandes Tauri IPC | snake_case | `parse_skin`, `list_audio_files` |
| Événements Pinia | camelCase verbe+nom | `playTrack`, `loadSkin`, `toggleCrossfade` |
| Constantes | UPPER_SNAKE_CASE | `MAX_CROSSFADE_DURATION`, `SUPPORTED_FORMATS` |

### Structure Patterns

**Organisation du code :**

| Règle | Convention |
|---|---|
| Tests JS | Co-localisés : `audioEngine.test.js` à côté de `audioEngine.js` |
| Tests Rust | Module `#[cfg(test)]` en bas du même fichier |
| Composants | Par domaine fonctionnel : `components/player/`, `components/playlist/`, `components/skin/` |
| Un composant = un fichier | Pas de composants multiples dans un `.vue` |
| Assets statiques | `src/assets/` (skin par défaut, jingle, polices bitmap) |
| Config | `tauri.conf.json`, `vite.config.js`, `.eslintrc.js`, `.prettierrc` à la racine |

### Communication Patterns

**IPC Tauri :**

| Pattern | Convention |
|---|---|
| Appel JS → Rust | `invoke('commande_snake_case', { paramCamelCase })` |
| Retour Rust → JS | Objet JSON avec champs camelCase : `{ skinAssets: [...], metadata: {...} }` |
| Erreurs IPC | `Result<T, String>` côté Rust, catch côté JS avec message user-friendly |

**Inter-stores Pinia :**

| Pattern | Convention |
|---|---|
| Communication | Un store n'importe JAMAIS un autre store dans son state. Actions qui appellent d'autres stores. |
| Exemple | `usePlayerStore().playNext()` appelle `usePlaylistStore().getNextTrack()` |

**Canvas :**

| Pattern | Convention |
|---|---|
| Événements | Hit-testing par coordonnées, pas d'événements DOM sur le canvas |
| Mapping | Chaque composant gère son propre mapping (zone cliquable → action) |

### Process Patterns

**Gestion d'erreurs :**

| Situation | Pattern |
|---|---|
| Erreur audio | Skip silencieux + message éphémère dans le Display (3s). Jamais de `alert()`, jamais de modal |
| Erreur skin | Fallback sur le skin actuel. Jamais de crash UI |
| États de chargement | Propriété `isLoading` dans chaque store concerné. Pas de store global de loading |

**Logging :**

| Niveau | Usage | Exemple |
|---|---|---|
| `console.warn()` | Erreurs récupérables | `[SkinParser] Format non supporté: track.wma` |
| `console.error()` | Erreurs critiques | `[AudioEngine] AudioContext failed to initialize` |
| Préfixe | Toujours par module | `[AudioEngine]`, `[SkinParser]`, `[PlaylistStore]` |

**Langue :**

| Zone | Langue |
|---|---|
| Code (variables, fonctions, commentaires, commits) | Anglais |
| UI visible (labels ARIA, messages d'erreur affichés, textes) | Français |
| Commentaires | Anglais, uniquement quand la logique n'est pas évidente. Pas de JSDoc systématique |

### Enforcement Guidelines

**Tout agent IA DOIT :**
- Respecter les conventions de nommage ci-dessus sans exception
- Co-localiser les tests avec le code source
- Utiliser les stores Pinia pour tout état partagé (jamais de variables globales)
- Gérer les erreurs par fallback silencieux (jamais bloquer l'UI)
- Préfixer les logs par module
- Écrire le code en anglais, l'UI en français

**Anti-patterns interdits :**
- `alert()`, `confirm()`, `prompt()` — interdit
- `document.getElementById()` — utiliser les refs Vue
- State mutation directe hors des stores Pinia
- `try/catch` vide (catch silencieux sans log)
- Dépendances circulaires entre stores

## Project Structure & Boundaries

### Complete Project Directory Structure

```
winamp-sik/
├── .github/
│   └── workflows/
│       ├── ci.yml                      # Lint + tests sur chaque PR
│       └── release.yml                 # Build + sign + release (on tag push)
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── README.md
├── LICENSE
├── CONTRIBUTING.md
│
├── docs/                               # Landing page (GitHub Pages)
│   ├── index.html
│   ├── style.css
│   └── assets/
│       ├── logo.png
│       └── screenshots/
│
├── public/
│   └── favicon.ico
│
├── src/                                # Frontend Vue.js
│   ├── main.js
│   ├── App.vue
│   │
│   ├── assets/
│   │   ├── default-skin/              # Skin par défaut (Classic Faithful)
│   │   │   ├── main.bmp
│   │   │   ├── titlebar.bmp
│   │   │   ├── cbuttons.bmp
│   │   │   ├── posbar.bmp
│   │   │   ├── volume.bmp
│   │   │   ├── pledit.bmp
│   │   │   ├── text.bmp
│   │   │   └── viscolor.txt
│   │   ├── jingle.ogg
│   │   └── fonts/
│   │       └── display-font.bmp
│   │
│   ├── components/
│   │   ├── player/                    # FR1-FR6, FR16, FR20-FR21
│   │   │   ├── TitleBar.vue
│   │   │   ├── PlayerDisplay.vue
│   │   │   ├── SeekBar.vue
│   │   │   ├── TransportControls.vue
│   │   │   ├── VolumeSlider.vue
│   │   │   └── ActionBar.vue
│   │   ├── playlist/                  # FR10-FR15, FR22-FR24
│   │   │   ├── PlaylistPanel.vue
│   │   │   ├── PlaylistItem.vue
│   │   │   └── PlaylistDropZone.vue
│   │   ├── skin/                      # FR17-FR19
│   │   │   └── SkinSelector.vue
│   │   └── shared/
│   │       ├── ContextMenu.vue
│   │       ├── FeedbackMessage.vue
│   │       └── PreferencesPanel.vue
│   │
│   ├── stores/
│   │   ├── usePlayerStore.js
│   │   ├── usePlaylistStore.js
│   │   ├── useSkinStore.js
│   │   └── usePreferencesStore.js
│   │
│   ├── engine/
│   │   ├── audioEngine.js
│   │   ├── audioEngine.test.js
│   │   ├── skinRenderer.js
│   │   └── skinRenderer.test.js
│   │
│   └── utils/
│       ├── constants.js
│       ├── formatters.js
│       └── ipc.js
│
├── src-tauri/                          # Backend Rust
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── commands/
│       │   ├── mod.rs
│       │   ├── skin_commands.rs
│       │   ├── file_commands.rs
│       │   └── playlist_commands.rs
│       ├── skin_parser/
│       │   ├── mod.rs
│       │   ├── wsz_parser.rs
│       │   └── skin_metadata.rs
│       └── file_manager/
│           ├── mod.rs
│           ├── audio_scanner.rs
│           └── playlist_io.rs
│
├── package.json
└── vite.config.js
```

### Architectural Boundaries

**Frontière IPC (JS ↔ Rust) :**

| Commande Tauri | Direction | Responsabilité |
|---|---|---|
| `parse_skin` | JS → Rust → JS | Reçoit chemin .wsz, retourne chemins assets extraits |
| `list_skins` | JS → Rust → JS | Liste les skins disponibles dans le dossier utilisateur |
| `list_audio_files` | JS → Rust → JS | Scan d'un dossier, retourne fichiers audio supportés |
| `save_playlist` | JS → Rust | Reçoit playlist JSON, écrit fichier M3U/M3U8 |
| `load_playlist` | JS → Rust → JS | Lit M3U/M3U8, retourne liste de fichiers |

**Frontière Audio (tout côté JS) :**
- L'AudioEngine lit les fichiers via le protocole `asset:` Tauri
- Le crossfade gère 2 `AudioBufferSourceNode` + 2 `GainNode` + courbes equal-power
- Aucune communication IPC pour les contrôles temps réel (play/pause/seek/volume)

**Frontière Skin (Rust parse, JS rend) :**
- Rust : décompresse .wsz → temp dir → expose via `asset:`
- JS : charge les images, les dessine sur Canvas 2D
- Le `useSkinStore` est le médiateur : il déclenche le parsing (IPC) puis alimente le renderer

### Requirements to Structure Mapping

| Domaine PRD | Fichiers/Dossiers |
|---|---|
| FR1-FR6 (Lecture audio) | `engine/audioEngine.js`, `stores/usePlayerStore.js`, `components/player/*` |
| FR7-FR9 (Crossfade) | `engine/audioEngine.js`, `stores/usePreferencesStore.js`, `components/shared/PreferencesPanel.vue` |
| FR10-FR15 (Playlists) | `stores/usePlaylistStore.js`, `components/playlist/*`, `src-tauri/commands/playlist_commands.rs`, `src-tauri/file_manager/playlist_io.rs` |
| FR16-FR19 (Interface & Skins) | `engine/skinRenderer.js`, `stores/useSkinStore.js`, `components/skin/*`, `src-tauri/skin_parser/*` |
| FR20-FR21 (Jingle) | `stores/usePlayerStore.js`, `assets/jingle.ogg` |
| FR22-FR24 (Gestion erreurs) | `components/shared/FeedbackMessage.vue`, pattern transversal dans tous les stores |
| FR25-FR29 (Installation & MAJ) | `src-tauri/tauri.conf.json` (plugin-updater), `.github/workflows/release.yml` |
| FR30-FR32 (Landing page) | `docs/*` |
| FR33-FR35 (Accessibilité) | Labels ARIA dans tous les composants Vue |
| FR36-FR37 (Formulaire satisfaction) | Post-MVP, via mécanisme de mise à jour |
| FR38-FR40 (CI/CD) | `.github/workflows/*` |

### Data Flow

```
Utilisateur → Drag & Drop fichiers
  → PlaylistDropZone.vue
    → invoke('list_audio_files') → Rust scan → retour liste
      → usePlaylistStore.addTracks()
        → usePlayerStore.play()
          → audioEngine.loadAndPlay(filePath)
            → Web Audio API (AudioContext → decode → GainNode → destination)

Changement de skin :
  → SkinSelector.vue → invoke('parse_skin', { path })
    → Rust décompresse .wsz → temp dir
      → retour chemins assets
        → useSkinStore.loadAssets(paths)
          → skinRenderer.renderAll(assets)
            → Canvas 2D redraw tous les composants
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Tauri v2 + Vue.js 3 + Vite + Pinia — stack éprouvé, aucun conflit de versions
- Web Audio API dans la webview Tauri — compatible, la webview (WebKit/WebView2) supporte AudioContext
- Canvas 2D dans Vue — compatible via refs, pattern classique
- Tauri Store + M3U/M3U8 — deux systèmes de persistance indépendants, pas de conflit
- Rust crate zip + protocole asset: — mécanisme natif Tauri

**Pattern Consistency:**
- Conventions de nommage (camelCase JS / snake_case Rust / PascalCase Vue) suivent les standards de chaque écosystème
- Structure par domaine (player/playlist/skin) alignée avec les stores Pinia
- Communication IPC (snake_case commandes, camelCase params) cohérente avec les conventions Tauri

**Structure Alignment:**
- La structure de dossiers supporte toutes les décisions architecturales
- Les frontières IPC, Audio et Skin sont clairement séparées
- Les integration points sont mappés dans le data flow

### Requirements Coverage Validation ✅

**Functional Requirements:** 40/40 FRs couverts architecturalement
- FR1-FR6 (Lecture) → Web Audio API + usePlayerStore
- FR7-FR9 (Crossfade) → AudioEngine (2 sources + GainNodes equal-power)
- FR10-FR15 (Playlists) → usePlaylistStore + Rust M3U/M3U8
- FR16-FR19 (Skins) → SkinParser Rust + Canvas 2D + useSkinStore
- FR20-FR21 (Jingle) → usePlayerStore + asset jingle.ogg
- FR22-FR24 (Erreurs) → Pattern résilience silencieuse transversal
- FR25-FR29 (Install/MAJ) → tauri-plugin-updater + GitHub Actions
- FR30-FR32 (Landing) → GitHub Pages dans docs/
- FR33-FR35 (A11y) → Labels ARIA dans chaque composant Vue
- FR36-FR37 (Formulaire) → Reporté post-MVP, via mécanisme de mise à jour
- FR38-FR40 (CI/CD) → GitHub Actions + tauri-action

**Non-Functional Requirements:** 15/15 NFRs couverts
- NFR1 (démarrage < 5s) → Tauri démarre en < 500ms
- NFR2 (crossfade sans artefact) → Equal-power crossfade Web Audio API
- NFR3 (500+ morceaux non-bloquant) → Chargement progressif
- NFR5-NFR6 (MAJ signées HTTPS) → tauri-plugin-updater, signature obligatoire
- NFR7-NFR8 (zéro télémétrie) → Aucune connexion sauf auto-update
- NFR9-NFR12 (accessibilité) → ARIA + navigation clavier + contraste skin défaut
- NFR13-NFR15 (compatibilité) → Build matrix 3 OS, installeur ~10 Mo

### Implementation Readiness Validation ✅

**Decision Completeness:** Toutes les décisions critiques documentées avec rationale
**Structure Completeness:** Arborescence complète avec mapping FR → fichiers
**Pattern Completeness:** Conventions de nommage, communication, erreurs, logging couverts

### Gap Analysis Results

**Aucun gap critique.**

**Gaps mineurs (non bloquants) :**
1. **Décodage FLAC dans la webview** — WebView2 (Windows) : support FLAC variable selon la version. Fallback possible via lib JS de décodage (ex: flac.js). À vérifier lors de l'implémentation.
2. **Skin par défaut vs .wsz** — Le skin par défaut est embarqué en fichiers séparés (pas en .wsz). Le SkinRenderer doit supporter les deux sources.
3. **Fenêtre playlist détachable** — La spec UX mentionne un panneau détachable. Tauri v2 supporte les fenêtres multiples mais ça ajoute de la complexité. À considérer pour post-MVP.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé
- [x] Complexité et contraintes évaluées
- [x] Préoccupations transversales mappées

**✅ Architectural Decisions**
- [x] Stack technique complet (Tauri v2 + Vue 3 + Vite + Pinia + Rust)
- [x] Moteur audio (Web Audio API)
- [x] Skin engine (Rust zip + asset: + Canvas 2D)
- [x] Stockage (Tauri Store + M3U/M3U8)
- [x] CI/CD (GitHub Actions + tauri-action)

**✅ Implementation Patterns**
- [x] Conventions de nommage établies
- [x] Patterns de communication définis
- [x] Gestion d'erreurs standardisée
- [x] Règles d'enforcement documentées

**✅ Project Structure**
- [x] Structure de dossiers complète
- [x] Frontières architecturales définies
- [x] Mapping FR → fichiers/dossiers
- [x] Data flow documenté

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** Élevé

**Key Strengths:**
- Architecture simple et maintenable pour un dev solo
- Séparation claire Rust (I/O, parsing) / JS (UI, audio, state)
- Stack moderne avec installeur ultra-léger (~10 Mo)
- Patterns de résilience intégrés dès la conception
- Crossfade equal-power natif via Web Audio API

**Areas for Future Enhancement:**
- Support FLAC à valider/compléter si la webview ne le décode pas nativement
- Fenêtre playlist détachable (post-MVP si complexe)
- Tests E2E avec Tauri test framework
- Système de plugins (V2-V3)

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre toutes les décisions architecturales exactement comme documentées
- Utiliser les patterns d'implémentation de manière cohérente sur tous les composants
- Respecter la structure du projet et les frontières architecturales
- Se référer à ce document pour toute question architecturale

**Première priorité d'implémentation :**
```bash
cargo create-tauri-app winamp-sik --template vue
# Sélectionner JavaScript comme flavor
```

