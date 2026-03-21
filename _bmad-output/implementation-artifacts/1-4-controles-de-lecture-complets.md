# Story 1.4 : Controles de Lecture Complets

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want naviguer dans mes morceaux et controler le volume,
So that j'aie un controle total sur mon experience d'ecoute.

## Acceptance Criteria (BDD)

1. **Given** un morceau en cours de lecture et une playlist avec plusieurs morceaux
   **When** l'utilisateur clique sur le bouton Next
   **Then** le morceau suivant de la playlist demarre
   **And** les metadonnees (titre, artiste, duree) se mettent a jour dans l'afficheur

2. **Given** un morceau en cours de lecture et au moins un morceau precedent dans la playlist
   **When** l'utilisateur clique sur le bouton Previous
   **Then** le morceau precedent de la playlist demarre

3. **Given** un morceau en cours de lecture
   **When** l'utilisateur clique sur la barre de progression (SeekBar) ou drag le curseur
   **Then** la lecture saute a la position correspondante dans le morceau
   **And** le temps affiche se met a jour instantanement

4. **Given** un morceau en cours de lecture
   **When** l'utilisateur drag le slider de volume
   **Then** le volume change en temps reel de 0% a 100%
   **And** l'icone de volume change selon le niveau (mute/bas/moyen/fort)

5. **Given** un morceau en cours de lecture
   **When** l'utilisateur clique sur l'icone de volume
   **Then** le son est mute (volume 0, icone barree)
   **And** un second clic restaure le volume precedent

6. **Given** un fichier audio charge
   **When** les metadonnees sont lues
   **Then** le titre, l'artiste et la duree sont affiches dans l'afficheur (Display)
   **And** le titre scrolle dans l'afficheur si le texte est plus long que la zone d'affichage

## Tasks / Subtasks

### Analyse de l'existant : ce qui fonctionne deja

La Story 1.3 a implemente la majorite de l'infrastructure UI et des stores. Voici ce qui est **deja fonctionnel** :
- SeekBar.vue : clic et drag pour seek, mise a jour du temps — **entierement cable** (AC #3)
- VolumeSlider.vue : drag du slider, 4 icones (mute/bas/moyen/fort), toggle mute/unmute — **entierement cable** (AC #4, #5)
- TransportControls.vue : boutons play/pause/stop cables a playerStore, boutons prev/next emettent des events — **cables dans App.vue via @prev/@next → playlistStore.playPrevious()/playNext()** (AC #1, #2)
- PlayerDisplay.vue : titre scrollant, temps ecoule/restant (bascule au clic), bitrate/frequence/stereo — **affichage fonctionnel** (AC #6)
- usePlayerStore : play, pause, resume, stop, seek, setVolume — tous fonctionnels
- usePlaylistStore : playNext, playPrevious, playTrack, addTracks — tous fonctionnels avec gestion repeatMode
- audioEngine.js : loadAndPlay, pause, resume, stop, seek, setVolume — tous fonctionnels

### Ce qui reste a faire pour cette story

- [x] Task 1 : Validation end-to-end du flux Next/Previous (AC: #1, #2)
  - [x] 1.1 Verifier que le clic sur Next dans TransportControls → emit 'next' → App.vue → playlistStore.playNext() → playerStore.play(nextTrack.path) fonctionne correctement avec une playlist de 3+ morceaux
  - [x] 1.2 Verifier que Previous fonctionne de meme, y compris au debut de la playlist (wrap-around en mode repeat: 'all', ne rien faire en mode repeat: 'none')
  - [x] 1.3 Verifier que les metadonnees (titre, artiste, duree) se mettent a jour dans PlayerDisplay apres changement de morceau
  - [x] 1.4 Verifier que le morceau en surbrillance dans PlaylistPanel change apres next/previous
  - [x] 1.5 Si des bugs sont trouves dans le flux, les corriger

- [x] Task 2 : Validation end-to-end du seek (AC: #3)
  - [x] 2.1 Verifier que le clic sur SeekBar saute a la bonne position (proportionnelle)
  - [x] 2.2 Verifier que le drag du curseur fonctionne en temps reel
  - [x] 2.3 Verifier que le temps dans PlayerDisplay se met a jour instantanement pendant le seek
  - [x] 2.4 Verifier que le seek fonctionne sur des fichiers MP3, FLAC, WAV et OGG
  - [x] 2.5 Si des bugs sont trouves, les corriger

- [x] Task 3 : Validation end-to-end du volume (AC: #4, #5)
  - [x] 3.1 Verifier que le drag du slider change le volume en temps reel (0% a 100%)
  - [x] 3.2 Verifier que l'icone de volume change selon le niveau : mute (X), bas 1-33% ()), moyen 34-66% ())), fort 67-100% ())))
  - [x] 3.3 Verifier que le clic sur l'icone mute le son (volume 0, icone barree)
  - [x] 3.4 Verifier qu'un second clic sur l'icone restaure le volume precedent
  - [x] 3.5 Si des bugs sont trouves, les corriger

- [x] Task 4 : Extraction et affichage des metadonnees reelles (AC: #6)
  - [x] 4.1 **ACTUELLEMENT :** le bitrate (128 kbps), la frequence (44.1 kHz) et le mode stereo/mono sont **hardcodes** dans PlayerDisplay.vue. Les remplacer par des valeurs reelles
  - [x] 4.2 Enrichir `audioEngine.js` : a l'evenement `loadedmetadata` de l'element `<audio>`, extraire les metadonnees techniques disponibles via l'API Web Audio / HTMLAudioElement :
    - `audioElement.duration` → duree (deja fait)
    - Pas de bitrate/frequence natif dans l'API Web — utiliser une bibliotheque JS de parsing de tags ID3/metadata OU extraire cote Rust via Tauri IPC
  - [x] 4.3 **Option recommandee :** Utiliser la crate Rust `lofty` (https://crates.io/crates/lofty) pour extraire les metadonnees completes (titre, artiste, album, bitrate, sample rate, channels) cote backend, et les envoyer au frontend via une commande Tauri IPC `get_audio_metadata(path) → { title, artist, album, duration, bitrate, sampleRate, channels }`
  - [x] 4.4 Creer la commande Rust `get_audio_metadata` dans `src-tauri/src/commands/` qui utilise `lofty` pour lire les tags ID3v2/Vorbis/FLAC et les proprietes audio
  - [x] 4.5 Mettre a jour `usePlaylistStore.addTracks()` : pour chaque fichier ajoute, appeler `get_audio_metadata` via Tauri invoke et stocker le resultat dans l'objet track (title, artist, album, bitrate, sampleRate, channels)
  - [x] 4.6 Mettre a jour `PlayerDisplay.vue` : remplacer les valeurs hardcodees par les valeurs du track courant (`currentTrack.bitrate`, `currentTrack.sampleRate`, `currentTrack.channels === 2 ? 'stereo' : 'mono'`)
  - [x] 4.7 Gestion du fallback : si les metadonnees sont absentes (pas de tags), afficher le nom du fichier comme titre, "Inconnu" comme artiste, et ne pas afficher bitrate/frequence/stereo

- [x] Task 5 : Raccourcis clavier pour les controles de lecture (AC: implicite, UX-DR19)
  - [x] 5.1 Implementer les raccourcis clavier globaux dans App.vue (ou un composable `useKeyboardShortcuts.js`) :
    - Espace : play/pause toggle
    - S : stop
    - N : morceau suivant
    - P : morceau precedent
    - Fleche droite : seek +5 secondes
    - Fleche gauche : seek -5 secondes
    - Fleche haut : volume +5%
    - Fleche bas : volume -5%
    - M : mute/unmute toggle
  - [x] 5.2 Les raccourcis ne doivent s'activer que quand aucun champ de saisie n'a le focus
  - [x] 5.3 Prevenir les actions par defaut du navigateur pour les touches utilisees (ex: Espace ne doit pas scroller)

- [x] Task 6 : Persistance du volume (AC: #4, UX implicite)
  - [x] 6.1 Sauvegarder le niveau de volume dans `usePreferencesStore` via Tauri Store quand l'utilisateur change le volume
  - [x] 6.2 Au lancement de l'application, restaurer le volume depuis les preferences sauvegardees
  - [x] 6.3 Si aucune preference n'existe, utiliser le volume par defaut (0.8 — DEFAULT_VOLUME)

- [x] Task 7 : Tests (AC: tous)
  - [x] 7.1 Creer/mettre a jour `src/stores/usePlayerStore.test.js` : tester seek(), setVolume(), comportement play/pause/stop sequence
  - [x] 7.2 Creer/mettre a jour `src/stores/usePlaylistStore.test.js` : tester playNext() avec repeatMode 'none'/'all'/'one', playPrevious(), changement de currentIndex
  - [x] 7.3 Si la commande Rust `get_audio_metadata` est creee : tester dans `src-tauri/src/commands/` avec des fichiers de test MP3/FLAC
  - [x] 7.4 Tester le composable `useKeyboardShortcuts` : verifier que les raccourcis appellent les bonnes actions

## Dev Notes

### Architecture existante — NE PAS reinventer

Tout le cablage UI (Canvas, hit-testing, stores Pinia, audioEngine) existe deja depuis la Story 1.3. **Cette story est principalement une story d'integration, de validation, et d'enrichissement des metadonnees.**

Les composants suivants sont deja fonctionnels et NE DOIVENT PAS etre recrees :
- `src/components/player/TransportControls.vue` — boutons prev/play/pause/stop/next avec rendu Canvas
- `src/components/player/SeekBar.vue` — barre de progression avec drag
- `src/components/player/VolumeSlider.vue` — slider + mute toggle
- `src/components/player/PlayerDisplay.vue` — afficheur avec titre scrollant et temps
- `src/stores/usePlayerStore.js` — play, pause, resume, stop, seek, setVolume
- `src/stores/usePlaylistStore.js` — playNext, playPrevious, addTracks, repeatMode
- `src/engine/audioEngine.js` — Web Audio API avec MediaElementAudioSourceNode

### Connexion Next/Previous (deja fait)

Dans `App.vue`, les events sont deja cables :
```javascript
playlistStore.playPrevious()  // @prev de TransportControls
playlistStore.playNext()      // @next de TransportControls
```
Verifier que ca fonctionne end-to-end, corriger si besoin.

### Extraction de metadonnees — Decision technique

La Web Audio API et HTMLAudioElement ne fournissent **pas** le bitrate, le sample rate ni les tags ID3 nativement. Deux options :

**Option A (recommandee) : Crate Rust `lofty`**
- Ajouter `lofty = "0.22"` dans `src-tauri/Cargo.toml`
- Creer une commande Tauri IPC `get_audio_metadata`
- Avantage : extraction complete et fiable de tous les formats (ID3v2, Vorbis, FLAC tags)
- Coherent avec l'architecture Tauri : operations lourdes cote Rust

**Option B (alternative legere) : JS library `music-metadata-browser`**
- Parsing cote frontend, pas d'IPC
- Moins performant sur gros fichiers, mais plus simple a implementer

Choisir l'option A si possible — elle s'aligne avec le pattern architectural Tauri (operations FS cote Rust).

### Pattern Tauri IPC existant

Suivre le pattern etabli dans `src-tauri/src/commands/` :
```rust
#[tauri::command]
fn get_audio_metadata(path: String) -> Result<AudioMetadata, String> {
    // utiliser lofty pour lire les tags
}
```

Enregistrer la commande dans `main.rs` avec `.invoke_handler(tauri::generate_handler![...])`.

### Raccourcis clavier — Architecture

Creer un composable `src/composables/useKeyboardShortcuts.js` (ou dans `src/utils/`) :
- Ecouter `keydown` global sur `document`
- Verifier que `event.target` n'est pas un input/textarea
- Map des touches vers les actions des stores
- Appeler dans `App.vue` au montage

Ref UX-DR19 pour la liste complete des raccourcis.

### Persistance volume — Pattern existant

Verifier si `usePreferencesStore` existe deja. Si oui, ajouter le volume. Si non, le creer avec :
- Tauri Store plugin (`@tauri-apps/plugin-store`)
- Sauvegarde automatique a chaque changement de volume (debounce 500ms recommande)

### Rendu Canvas — Style Modern HiDPI

**Feedback utilisateur important :** garder le style Winamp classique mais avec un rendu crisp HiDPI, pas pixelise. Le mode par defaut doit etre 'modern' (imageSmoothingEnabled = true, anti-aliasing).

### Barre de titre — Native Tauri

**Feedback utilisateur important :** utiliser la barre de titre native Tauri, pas de composant custom. TitleBar.vue existe mais gere les interactions supplementaires (affichage titre morceau), pas le chrome de la fenetre.

### Conventions de code

- Code source en anglais, UI en francais
- Tests co-localises (ex: `audioEngine.test.js` a cote de `audioEngine.js`)
- Composants Vue en PascalCase, fichiers JS en camelCase, fichiers Rust en snake_case
- Stores Pinia : `use[Nom]Store`
- Variables/fonctions JS : camelCase
- Constantes : UPPER_SNAKE_CASE

### Project Structure Notes

Fichiers a modifier/creer :
- `src-tauri/Cargo.toml` — ajouter dependance `lofty`
- `src-tauri/src/commands/` — nouvelle commande `get_audio_metadata`
- `src-tauri/src/main.rs` — enregistrer la commande
- `src/stores/usePlaylistStore.js` — enrichir addTracks avec metadonnees
- `src/components/player/PlayerDisplay.vue` — connecter metadonnees reelles
- `src/composables/useKeyboardShortcuts.js` — nouveau composable raccourcis clavier
- `src/App.vue` — monter useKeyboardShortcuts
- `src/stores/usePreferencesStore.js` — ajouter persistance volume (si pas deja fait)

### References

- [Source: epics.md - Story 1.4] Acceptance criteria et user story
- [Source: architecture.md - Audio & Crossfade] Web Audio API, controle audio cote frontend
- [Source: architecture.md - Frontend Architecture] Stores Pinia modulaires, pattern Canvas
- [Source: architecture.md - Implementation Patterns] Conventions de nommage, structure
- [Source: ux-design-specification.md - UX-DR3] SeekBar spec
- [Source: ux-design-specification.md - UX-DR4] TransportControls spec
- [Source: ux-design-specification.md - UX-DR5] VolumeSlider spec (4 etats, mute toggle)
- [Source: ux-design-specification.md - UX-DR19] Raccourcis clavier complets
- [Source: 1-3-interface-skinnee-classic-faithful.md] Story precedente — patterns etablis, composants crees

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun blocage majeur. Bug trouve et corrige dans playPrevious() (repeat:none et repeat:one non geres).

### Completion Notes List

- Task 1 : Validation end-to-end Next/Previous — Bug corrige dans `playPrevious()` : ajout du support `repeat: 'one'` et correction du comportement `repeat: 'none'` a l'index 0 (ne rien faire au lieu de rejouer le meme morceau)
- Task 2 : Validation end-to-end du seek — SeekBar fonctionnel (clic et drag), temps mis a jour en temps reel
- Task 3 : Validation end-to-end du volume — VolumeSlider fonctionnel (drag, 4 icones, mute/unmute toggle)
- Task 4 : Extraction de metadonnees via la crate Rust `lofty` — Commande Tauri IPC `get_audio_metadata` creee, metadonnees enrichies (titre, artiste, bitrate, sample rate, channels) extraites et affichees dans PlayerDisplay, fallback gere (nom de fichier comme titre, "Inconnu" comme artiste, champs vides si pas de tags)
- Task 5 : Raccourcis clavier — Composable `useKeyboardShortcuts` cree avec support Espace (play/pause), S (stop), N (next), P (prev), fleches (seek/volume), M (mute). Guard sur focus input/textarea.
- Task 6 : Persistance du volume — `usePreferencesStore` implemente avec Tauri Store plugin (`@tauri-apps/plugin-store`), sauvegarde debounce 500ms, restauration au lancement
- Task 7 : Tests — 124 tests JS (6 fichiers) + 2 tests Rust, tous passent. 14 nouveaux tests pour useKeyboardShortcuts, tests mis a jour pour playlistStore (repeat:one) et playerStore (mock preferences).

### File List

**Nouveaux fichiers :**
- `src-tauri/src/commands/audio_commands.rs` — commande Rust get_audio_metadata avec lofty
- `src/composables/useKeyboardShortcuts.js` — composable raccourcis clavier globaux
- `src/composables/useKeyboardShortcuts.test.js` — tests du composable (14 tests)

**Fichiers modifies :**
- `src-tauri/Cargo.toml` — ajout dependances lofty et tauri-plugin-store
- `src-tauri/src/commands/mod.rs` — export du module audio_commands
- `src-tauri/src/lib.rs` — enregistrement de get_audio_metadata et plugin store
- `src/stores/usePlaylistStore.js` — correction playPrevious, enrichissement metadonnees via Tauri IPC, import invoke
- `src/stores/usePlaylistStore.test.js` — ajout test repeat:one, mock invoke, mise a jour assertions
- `src/stores/usePlayerStore.js` — integration usePreferencesStore, actions setVolume/restoreVolume
- `src/stores/usePlayerStore.test.js` — ajout mock tauri-plugin-store
- `src/stores/usePreferencesStore.js` — implementation complete (volume persistence via Tauri Store)
- `src/components/player/PlayerDisplay.vue` — remplacement valeurs hardcodees par metadonnees reelles du playlistStore
- `src/App.vue` — montage useKeyboardShortcuts, appel restoreVolume au demarrage

### Change Log

- 2026-03-21 : Implementation complete de la Story 1.4 — correction bug playPrevious, extraction metadonnees Rust (lofty), raccourcis clavier, persistance volume
