# Story 1.5 : Drag & Drop et Playlist Basique

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want glisser-deposer mes fichiers audio dans le player,
So that je puisse ecouter ma musique immediatement sans configuration.

## Acceptance Criteria (BDD)

1. **Given** l'application lancee avec une playlist vide
   **When** aucun morceau n'est charge
   **Then** la zone centrale affiche le message "Glisse ta musique ici" avec une icone
   **And** les controles de lecture sont grises/inactifs (disabled)

2. **Given** l'utilisateur glisse un ou plusieurs fichiers audio sur la fenetre du player
   **When** les fichiers survolent la zone de drop
   **Then** un feedback visuel immediat apparait (zone illuminee, < 100ms)

3. **Given** l'utilisateur depose des fichiers audio (MP3, FLAC, WAV, OGG)
   **When** le drop est effectue
   **Then** les fichiers apparaissent dans la playlist en moins d'1 seconde
   **And** la lecture demarre automatiquement sur le premier morceau
   **And** le message "Glisse ta musique ici" disparait
   **And** les controles s'activent (plus grises)

4. **Given** l'utilisateur glisse un dossier contenant des fichiers audio
   **When** le dossier est depose
   **Then** tous les fichiers audio supportes du dossier sont ajoutes a la playlist
   **And** les fichiers non-audio sont ignores silencieusement

5. **Given** une playlist avec des morceaux affiches
   **When** l'utilisateur regarde la playlist
   **Then** chaque morceau affiche son numero, titre, artiste et duree
   **And** le morceau en cours de lecture est mis en surbrillance (highlight fort)
   **And** un double-clic sur un morceau lance sa lecture

6. **Given** une playlist de 500+ morceaux
   **When** les fichiers sont charges
   **Then** l'interface reste reactive et la lecture demarre des le premier fichier charge (NFR3)
   **And** les fichiers restants se chargent progressivement en arriere-plan

7. **Given** l'application fonctionne
   **When** aucune connexion internet n'est disponible
   **Then** toutes les fonctions de lecture, playlist et interface fonctionnent normalement (FR29)

## Tasks / Subtasks

### Task 1 : Ecoute des evenements Tauri drag-and-drop (AC: #2, #3, #4)

- [x] 1.1 Utiliser l'API Tauri v2 `onDragDropEvent` de `@tauri-apps/api/webview` pour ecouter les evenements natifs de drag & drop sur la fenetre. Cela donne acces aux chemins natifs des fichiers (pas l'API HTML5 limitee)
- [x] 1.2 Gerer les 3 types d'evenements :
  - `drag-over` : activer le feedback visuel (zone illuminee)
  - `drop` : collecter les chemins de fichiers, les traiter
  - `drag-leave` / `cancelled` : desactiver le feedback visuel
- [x] 1.3 Creer un composable `src/composables/useFileDrop.js` qui encapsule la logique Tauri drag-and-drop et expose un etat reactif (`isDragging`) + un callback `onFilesDropped(paths)`
- [x] 1.4 Monter `useFileDrop` dans `App.vue` et connecter le callback a la logique de traitement des fichiers

### Task 2 : Traitement des fichiers et dossiers deposes (AC: #3, #4, #6)

- [x] 2.1 Filtrer les chemins recus : separer fichiers et dossiers
- [x] 2.2 Pour les fichiers : ne garder que ceux avec extensions supportees (mp3, flac, wav, ogg) — ignorer silencieusement les autres
- [x] 2.3 Pour les dossiers : utiliser la commande Rust existante `list_audio_files` OU creer une version recursive `list_audio_files_recursive` dans `src-tauri/src/commands/file_commands.rs` pour scanner recursivement les sous-dossiers
  - **IMPORTANT** : `list_audio_files` actuel ne scanne qu'un seul niveau. Il faut le rendre recursif (utiliser `walkdir` ou `std::fs::read_dir` recursif) pour supporter les dossiers avec sous-dossiers
- [x] 2.4 Collecter tous les chemins valides et appeler `playlistStore.addTracks(paths)`
- [x] 2.5 Si c'est le premier drop (playlist etait vide) : demarrer automatiquement la lecture du premier morceau via `playlistStore.playTrack(0)`

### Task 3 : Feedback visuel du drag-over (AC: #2)

- [x] 3.1 Quand `isDragging` est `true`, afficher un overlay visuel sur toute la fenetre (ou sur la zone PlaylistPanel) avec un effet d'illumination (bordure ou fond colore semi-transparent)
- [x] 3.2 Le feedback doit apparaitre en < 100ms (utiliser des transitions CSS rapides)
- [x] 3.3 Le feedback disparait des que le drag quitte la fenetre ou que le drop est effectue
- [x] 3.4 Style : bordure interne ou halo lumineux utilisant les couleurs du skin actif (`skinStore.colors`)

### Task 4 : Etat vide et controles disabled (AC: #1)

- [x] 4.1 Ameliorer l'etat vide existant dans `PlaylistPanel.vue` : ajouter une icone (emoji ou SVG simple) au message "Glisse ta musique ici"
- [x] 4.2 Ajouter un getter `isEmpty` dans `usePlaylistStore` (deja existant, le reutiliser)
- [x] 4.3 Dans `TransportControls.vue` : griser/desactiver les boutons quand la playlist est vide. Utiliser le getter `playlistStore.isEmpty` pour conditionner l'etat disabled
- [x] 4.4 Les boutons disabled ne doivent pas reagir aux clics ni aux raccourcis clavier
- [x] 4.5 Ajouter l'attribut `aria-disabled="true"` sur les controles inaccessibles quand la playlist est vide
- [x] 4.6 Quand un morceau est ajoute (playlist non vide), les controles se reactivent automatiquement (reactivite Vue)

### Task 5 : Chargement progressif pour grosses playlists (AC: #6)

- [x] 5.1 Pour les drops de 500+ fichiers : traiter les fichiers par lots (ex: par tranches de 50) pour ne pas bloquer l'UI
- [x] 5.2 Demarrer la lecture des le premier lot traite (ne pas attendre tous les fichiers)
- [x] 5.3 L'enrichissement des metadonnees (`_enrichMetadata`) s'execute deja en arriere-plan — s'assurer qu'il ne bloque pas l'UI pour de grosses playlists (il est deja asynchrone, verifier qu'il n'y a pas de goulot d'etranglement)
- [x] 5.4 Afficher le nombre total de morceaux dans une zone de statut du PlaylistPanel (ex: "42 morceaux" en bas)

### Task 6 : Label ARIA et accessibilite de la zone de drop (AC: #1)

- [x] 6.1 Ajouter `aria-label="Zone de depot de fichiers"` sur la zone de drop
- [x] 6.2 Quand des fichiers sont deposes, annoncer le nombre de fichiers ajoutes via une live region ARIA `aria-live="polite"`
- [x] 6.3 Quand les controles passent de disabled a actif, s'assurer que le changement est annonce aux lecteurs d'ecran

### Task 7 : Tests (AC: tous)

- [x] 7.1 Tester le composable `useFileDrop` : mock de `onDragDropEvent`, verifier que `isDragging` bascule correctement, verifier que le callback est appele avec les bons chemins
- [x] 7.2 Tester le filtrage des fichiers : extensions supportees vs non-supportees, separation fichiers/dossiers
- [x] 7.3 Tester le comportement auto-play : verifier que `playTrack(0)` est appele uniquement au premier drop sur playlist vide
- [x] 7.4 Tester l'etat disabled des controles : verifier qu'ils sont disabled quand `isEmpty` est true
- [x] 7.5 Si une commande Rust recursive est creee : tester dans `src-tauri/src/commands/` avec une arborescence de test

## Dev Notes

### Architecture existante — NE PAS reinventer

Les composants suivants existent deja et NE DOIVENT PAS etre recrees :
- `src/components/playlist/PlaylistPanel.vue` — affichage des morceaux, etat vide "Glisse ta musique ici", double-clic pour lire. **A enrichir** avec drag-drop feedback et zone de statut
- `src/stores/usePlaylistStore.js` — `addTracks()`, `playTrack()`, `isEmpty` getter, enrichissement metadonnees async. **Reutiliser tel quel**
- `src/stores/usePlayerStore.js` — `play()`, `pause()`, `stop()`, etc. Fonctionnel
- `src/engine/audioEngine.js` — Web Audio API, fonctionnel
- `src/composables/useKeyboardShortcuts.js` — raccourcis clavier existants. **A ajuster** pour respecter l'etat disabled
- `src-tauri/src/commands/file_commands.rs` — `list_audio_files(dir_path)` qui scanne un dossier pour trouver les fichiers audio (mp3/flac/wav/ogg). **Scanne un seul niveau, doit devenir recursif**
- `src-tauri/src/commands/audio_commands.rs` — `get_audio_metadata(path)` via lofty

### Tauri v2 Drag & Drop — Decision technique

**Utiliser l'API native Tauri, PAS l'API HTML5 Drag & Drop.**

En Tauri v2, l'API `onDragDropEvent` de `@tauri-apps/api/webview` permet d'intercepter les fichiers deposes sur la fenetre avec les chemins natifs du systeme de fichiers. L'API HTML5 (ondrop/ondragover) ne donne pas acces aux chemins natifs dans un contexte Tauri.

```javascript
import { getCurrentWebview } from '@tauri-apps/api/webview'

const webview = getCurrentWebview()
const unlisten = await webview.onDragDropEvent((event) => {
  if (event.payload.type === 'over') {
    // feedback visuel : fichiers survolent la fenetre
  } else if (event.payload.type === 'drop') {
    // event.payload.paths contient les chemins natifs
  } else if (event.payload.type === 'leave') {
    // drag quitte la fenetre
  }
})
```

Les chemins fournis par `event.payload.paths` sont des chemins absolus natifs (pas des File/Blob) — ils peuvent etre directement passes a `addTracks()` ou a la commande Rust `list_audio_files`.

### Scan recursif de dossiers

`list_audio_files` actuel dans `file_commands.rs` ne scanne qu'un seul niveau (`read_dir`). Pour supporter le drop de dossiers avec sous-dossiers, deux options :

**Option A (recommandee) : Ajouter la crate `walkdir`**
```toml
# Cargo.toml
walkdir = "2"
```
```rust
use walkdir::WalkDir;
#[command]
pub fn list_audio_files_recursive(dir_path: String) -> Result<Vec<String>, String> {
    let extensions = ["mp3", "flac", "wav", "ogg"];
    let mut files = Vec::new();
    for entry in WalkDir::new(&dir_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if extensions.contains(&ext.to_lowercase().as_str()) {
                    files.push(path.to_string_lossy().into_owned());
                }
            }
        }
    }
    files.sort();
    Ok(files)
}
```

**Option B : Recursion manuelle avec std::fs**
Fonctionnel mais moins robuste (symlinks, permissions). Preferer walkdir.

N'oublier PAS d'enregistrer la nouvelle commande dans `lib.rs` avec `tauri::generate_handler![...]`.

### Filtrage des fichiers cote frontend

Les chemins recus de Tauri drag-drop sont des chemins mixtes (fichiers + dossiers). Logic cote JS :
1. Verifier si chaque chemin est un fichier ou dossier (appel Rust ou check extension)
2. Fichiers avec extension supportee → directement dans `addTracks()`
3. Dossiers → appeler `invoke('list_audio_files_recursive', { dirPath })` → concatener les resultats
4. Paths sans extension reconnue → ignorer silencieusement (pas d'erreur, pas de log visible par l'utilisateur)

Extensions supportees : `.mp3`, `.flac`, `.wav`, `.ogg` — definir dans une constante `SUPPORTED_EXTENSIONS` partagee (ex: `src/utils/constants.js`).

### Etat disabled des controles

`TransportControls.vue` utilise un rendu Canvas avec hit-testing. Pour l'etat disabled :
- Ajouter une prop `disabled` au composant
- Quand disabled : ne pas reagir aux clics (retourner early dans le hit-test handler)
- Visuellement : dessiner les boutons avec une opacite reduite (ex: `globalAlpha = 0.4`) ou en gris
- Le composable `useKeyboardShortcuts.js` doit aussi verifier `playlistStore.isEmpty` avant de declencher les actions

### Performance 500+ morceaux

L'enrichissement des metadonnees (`_enrichMetadata`) est deja asynchrone et sequentiel (un invoke par track). Pour 500+ morceaux :
- `addTracks()` ajoute les tracks instantanement (synchrone, juste `extractTrackInfo`)
- `_enrichMetadata()` tourne en arriere-plan sans bloquer
- La lecture demarre immediatement sans attendre les metadonnees
- Pas besoin de batching pour `addTracks()` lui-meme (push synchrone est rapide)
- Le batching est recommande uniquement si le drop de 500+ chemins provoque un gel : dans ce cas, decouvrir par tranches de 50 avec `requestAnimationFrame` entre chaque tranche

### Rendu Canvas — Style Modern HiDPI

**Feedback utilisateur important :** garder le style Winamp classique mais avec un rendu crisp HiDPI, pas pixelise. Le mode par defaut doit etre 'modern' (imageSmoothingEnabled = true, anti-aliasing).

### Barre de titre — Native Tauri

**Feedback utilisateur important :** utiliser la barre de titre native Tauri, pas de composant custom.

### Conventions de code

- Code source en anglais, UI en francais
- Tests co-localises (ex: `useFileDrop.test.js` a cote de `useFileDrop.js`)
- Composants Vue en PascalCase, fichiers JS en camelCase, fichiers Rust en snake_case
- Stores Pinia : `use[Nom]Store`
- Commandes Tauri IPC : snake_case (`list_audio_files_recursive`)
- Constantes : UPPER_SNAKE_CASE (`SUPPORTED_EXTENSIONS`)
- Erreurs par fallback silencieux, jamais de `alert()` / modal
- Logs prefixes par module : `[FileDrop]`, `[PlaylistStore]`

### Project Structure Notes

Fichiers a creer :
- `src/composables/useFileDrop.js` — composable drag & drop Tauri
- `src/composables/useFileDrop.test.js` — tests du composable
- `src/utils/constants.js` — constantes partagees (SUPPORTED_EXTENSIONS) — verifier si ce fichier existe deja

Fichiers a modifier :
- `src/App.vue` — monter useFileDrop, connecter au playlistStore, passer isDragging au template
- `src/components/playlist/PlaylistPanel.vue` — ajouter overlay de drag feedback, icone etat vide, zone de statut (nombre de morceaux)
- `src/components/player/TransportControls.vue` — ajouter prop/support disabled
- `src/composables/useKeyboardShortcuts.js` — respecter l'etat disabled (ne pas agir si playlist vide)
- `src-tauri/src/commands/file_commands.rs` — ajouter `list_audio_files_recursive`
- `src-tauri/Cargo.toml` — ajouter dependance `walkdir`
- `src-tauri/src/lib.rs` — enregistrer la nouvelle commande

### References

- [Source: epics.md - Story 1.5] Acceptance criteria et user story
- [Source: architecture.md - Audio & Crossfade] Web Audio API, controle audio cote frontend
- [Source: architecture.md - Frontend Architecture] Stores Pinia modulaires
- [Source: architecture.md - Implementation Patterns] Conventions de nommage, gestion d'erreurs
- [Source: architecture.md - Project Structure] Organisation des fichiers
- [Source: ux-design-specification.md - UX-DR7] PlaylistPanel spec (header, colonnes, scroll, role listbox)
- [Source: ux-design-specification.md - UX-DR8] PlaylistItem spec (double-clic, drag, role option)
- [Source: ux-design-specification.md - UX-DR9] PlaylistDropZone spec (message, illumination, label ARIA)
- [Source: ux-design-specification.md - UX-DR24] Onboarding premier lancement (controles grises, "Glisse ta musique ici", lecture auto au premier drop)
- [Source: 1-4-controles-de-lecture-complets.md] Story precedente — patterns etablis, commande Rust IPC, composable pattern, enrichissement metadonnees async

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Rust `cargo check` et `cargo test` passent sans erreur
- Vitest : 153 tests JS passent (dont 6 nouveaux pour useFileDrop, 11 pour fileDropProcessor, 5 pour disabled state keyboard)
- Rust : 6 tests passent (dont 4 nouveaux pour list_audio_files_recursive)

### Completion Notes List

- Task 1 : Composable `useFileDrop.js` cree avec API Tauri v2 `onDragDropEvent`, monte dans App.vue avec callback connecte au playlistStore
- Task 2 : `fileDropProcessor.js` cree pour filtrer fichiers/dossiers, commande Rust `list_audio_files_recursive` ajoutee avec `walkdir`, enregistree dans `lib.rs`
- Task 3 : Overlay drag-and-drop dans PlaylistPanel avec bordure coloree selon le skin actif, transition CSS 50ms
- Task 4 : Controles TransportControls desactives quand `playlistStore.isEmpty`, `aria-disabled` ajoute, raccourcis clavier respectent l'etat disabled (volume/mute restent actifs)
- Task 5 : Batching par tranches de 50 avec `requestAnimationFrame` pour drops 500+, lecture demarre au premier lot, compteur de morceaux dans la status bar
- Task 6 : `aria-label` sur zone de drop, live region ARIA annonce les ajouts, `aria-disabled` sur boutons accessibles
- Task 7 : Tests complets — useFileDrop (6 tests), fileDropProcessor (11 tests), disabled keyboard shortcuts (5 tests), Rust recursive (4 tests)

### File List

Fichiers crees :
- src/composables/useFileDrop.js
- src/composables/useFileDrop.test.js
- src/utils/fileDropProcessor.js
- src/utils/fileDropProcessor.test.js

Fichiers modifies :
- src/App.vue
- src/components/playlist/PlaylistPanel.vue
- src/components/player/TransportControls.vue
- src/composables/useKeyboardShortcuts.js
- src/composables/useKeyboardShortcuts.test.js
- src-tauri/src/commands/file_commands.rs
- src-tauri/src/lib.rs
- src-tauri/Cargo.toml
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/1-5-drag-drop-et-playlist-basique.md

### Change Log

- 2026-03-21 : Implementation complete de la story 1.5 — drag & drop Tauri natif, playlist basique avec feedback visuel, controles disabled, chargement progressif, accessibilite ARIA, scan recursif Rust avec walkdir
