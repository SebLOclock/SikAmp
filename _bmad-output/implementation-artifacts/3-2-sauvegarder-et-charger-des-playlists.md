# Story 3.2: Sauvegarder et Charger des Playlists

Status: done

## Story

As a utilisateur,
I want sauvegarder mes playlists sur le disque et les recharger plus tard,
So that je retrouve mes selections de musique d'une session a l'autre.

## Acceptance Criteria (BDD)

1. **Given** une playlist avec des morceaux
   **When** l'utilisateur sauvegarde la playlist (Ctrl+S ou menu contextuel "Sauvegarder")
   **And** la playlist n'a pas encore de nom
   **Then** une boite de dialogue native demande le nom de la playlist
   **And** la playlist est ecrite au format M3U8 via la commande Tauri IPC `save_playlist`
   **And** un message "Playlist sauvegardee" s'affiche dans l'afficheur pendant 3 secondes (couleur succes #44FF44)

2. **Given** une playlist deja nommee et sauvegardee
   **When** l'utilisateur sauvegarde a nouveau (Ctrl+S)
   **Then** la sauvegarde est instantanee (pas de dialogue de nom)
   **And** le fichier M3U8 existant est mis a jour

3. **Given** l'utilisateur veut charger une playlist
   **When** il utilise Ctrl+L ou le menu contextuel "Charger playlist"
   **Then** le selecteur de fichier natif de l'OS s'ouvre
   **And** seuls les fichiers M3U/M3U8 sont affiches par defaut

4. **Given** un fichier M3U/M3U8 valide selectionne
   **When** la playlist est chargee via la commande Tauri IPC `load_playlist`
   **Then** les morceaux de la playlist apparaissent dans le panneau playlist
   **And** la lecture est prete (controles actifs)
   **And** les fichiers introuvables dans la playlist sont marques visuellement (grises)

5. **Given** l'utilisateur annule le selecteur de fichier
   **When** aucun fichier n'est selectionne
   **Then** la playlist courante reste inchangee

## Tasks / Subtasks

- [x] Task 1 — Backend Rust : module playlist_io.rs (AC: #1, #2, #4)
  - [x] Creer `src-tauri/src/file_manager/playlist_io.rs` avec fonctions `write_m3u8()` et `read_m3u()`
  - [x] Format M3U8 : header `#EXTM3U`, lignes `#EXTINF:duration,artist - title` puis chemin absolu
  - [x] Lecture : parser M3U et M3U8 (avec et sans lignes #EXTINF), retourner Vec de chemins
  - [x] Mettre a jour `src-tauri/src/file_manager/mod.rs` pour exporter le module
  - [x] Tests Rust unitaires dans le meme fichier (#[cfg(test)])

- [x] Task 2 — Backend Rust : commandes Tauri IPC save_playlist / load_playlist (AC: #1, #2, #4)
  - [x] Creer `src-tauri/src/commands/playlist_commands.rs` avec commandes `save_playlist` et `load_playlist`
  - [x] `save_playlist(path: String, tracks: Vec<TrackInfo>)` — appelle `playlist_io::write_m3u8()`
  - [x] `load_playlist(path: String) -> Vec<PlaylistEntry>` — appelle `playlist_io::read_m3u()`, verifie existence de chaque fichier, retourne `{ path, exists: bool }`
  - [x] Enregistrer les commandes dans `src-tauri/src/lib.rs` (ajouter au `.invoke_handler()`)
  - [x] Mettre a jour `src-tauri/src/commands/mod.rs` pour exporter le nouveau module

- [x] Task 3 — Plugin dialog Tauri + permissions (AC: #1, #3)
  - [x] Ajouter la dependance `tauri-plugin-dialog` dans `src-tauri/Cargo.toml`
  - [x] Ajouter `@tauri-apps/plugin-dialog` dans `package.json`
  - [x] Enregistrer le plugin dans `src-tauri/src/lib.rs` (`.plugin(tauri_plugin_dialog::init())`)
  - [x] Ajouter `"dialog:default"` dans `src-tauri/capabilities/default.json`

- [x] Task 4 — Frontend : actions savePlaylist / loadPlaylist dans usePlaylistStore (AC: #1, #2, #3, #4, #5)
  - [x] Ajouter state : `playlistName` (String|null), `playlistPath` (String|null) — le chemin du fichier M3U8 associe
  - [x] Action `savePlaylist()` : si `playlistPath` existe → invoke `save_playlist` directement ; sinon → ouvrir dialog "save" via `@tauri-apps/plugin-dialog` → invoke `save_playlist`
  - [x] Action `loadPlaylist()` : ouvrir dialog "open" filtree M3U/M3U8 via `@tauri-apps/plugin-dialog` → invoke `load_playlist` → remplacer tracks + marquer fichiers manquants
  - [x] `newPlaylist()` et `clearPlaylist()` doivent reinitialiser `playlistName` et `playlistPath` a null
  - [x] Ajouter propriete `missing` (boolean) sur chaque track pour les fichiers introuvables
  - [x] Tests unitaires pour savePlaylist, loadPlaylist, reset du path

- [x] Task 5 — Frontend : raccourcis clavier Ctrl+S et Ctrl+L (AC: #1, #3)
  - [x] Dans `useKeyboardShortcuts.js` : remplacer les stubs console.log de Ctrl+S et Ctrl+L par des callbacks `onSavePlaylist` et `onLoadPlaylist`
  - [x] Dans `App.vue` : enregistrer les callbacks qui appellent `playlistStore.savePlaylist()` et `playlistStore.loadPlaylist()`
  - [x] Tests : verifier que les callbacks sont appeles sur Ctrl+S et Ctrl+L

- [x] Task 6 — Frontend : feedback visuel (AC: #1, #4)
  - [x] Apres sauvegarde reussie : afficher "Playlist sauvegardee" dans le PlayerDisplay pendant 3s, couleur #44FF44
  - [x] Utiliser le pattern de message ephemere existant dans le player (verifier FeedbackMessage.vue ou PlayerDisplay.vue)
  - [x] Fichiers introuvables : ajouter style `.playlist-track--missing` avec `opacity: 0.4` et `text-decoration: line-through`
  - [x] Tests : message ephemere affiche apres save, style missing applique aux tracks introuvables

- [x] Task 7 — Accessibilite (AC: #1, #3, #4)
  - [x] Annonce ARIA apres sauvegarde : "Playlist sauvegardee" via aria-live region existante
  - [x] Annonce ARIA apres chargement : "Playlist chargee, N morceaux" via aria-live region
  - [x] Les fichiers manquants ont un `aria-label` explicatif : "Morceau introuvable : [titre]"
  - [x] Tests : annonces ARIA correctes

## Dev Notes

### Architecture et contexte technique

**Ce qui existe deja (Story 3.1 terminee) :**
- `usePlaylistStore.js` : actions `addTracks()`, `removeTrack()`, `moveTrack()`, `newPlaylist()`, `clearPlaylist()`, `playTrack()`, `playNext()`, `playPrevious()`
- `PlaylistPanel.vue` : drag & drop reordonnement, keyboard navigation, ARIA live region, empty state "Glisse ta musique ici"
- `useKeyboardShortcuts.js` : systeme de callbacks, Ctrl+S / Ctrl+L / Ctrl+O sont stubs (console.log) — **a remplacer par de vrais callbacks**
- `App.vue` : enregistre les callbacks de raccourcis via `registerShortcutCallbacks()`

**Ce qui n'existe PAS encore (a creer) :**
- `playlist_commands.rs` — aucune commande Tauri IPC pour les playlists
- `playlist_io.rs` — `file_manager/mod.rs` est un stub vide avec un commentaire
- Plugin dialog Tauri — pas installe, pas dans les capabilities
- Aucun code M3U/M3U8 dans le projet

### Format M3U8

```
#EXTM3U
#EXTINF:234,Evanescence - Bring Me To Life
/Users/marina/music/evanescence/bring_me_to_life.mp3
#EXTINF:276,Daft Punk - One More Time
/Users/marina/music/daft_punk/one_more_time.flac
```

- Header `#EXTM3U` obligatoire
- `#EXTINF:duree_en_secondes,artiste - titre` (duree en entier, arrondi)
- Ligne suivante : chemin absolu du fichier
- Encodage UTF-8 (d'ou M3U8 et non M3U)
- La lecture doit aussi supporter les fichiers M3U simples (juste les chemins, sans #EXTINF)

### Plugin tauri-plugin-dialog

**Installation :**
```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-dialog = "2"
```

```json
// package.json
"@tauri-apps/plugin-dialog": "^2"
```

```rust
// src-tauri/src/lib.rs — ajouter dans la chaine .plugin()
.plugin(tauri_plugin_dialog::init())
```

```json
// src-tauri/capabilities/default.json — ajouter dans permissions
"dialog:default"
```

**Usage frontend :**
```js
import { save, open } from '@tauri-apps/plugin-dialog'

// Sauvegarder
const path = await save({
  filters: [{ name: 'Playlist', extensions: ['m3u8'] }],
  defaultPath: 'ma-playlist.m3u8'
})

// Charger
const path = await open({
  filters: [{ name: 'Playlist', extensions: ['m3u', 'm3u8'] }],
  multiple: false
})
```

### Commandes IPC a creer

**`save_playlist`** (JS → Rust)
- Params : `{ path: string, tracks: Array<{ path: string, title: string, artist: string, duration: number }> }`
- Rust ecrit le fichier M3U8 au chemin indique
- Retour : `Result<(), String>`

**`load_playlist`** (JS → Rust → JS)
- Params : `{ path: string }`
- Rust lit le M3U/M3U8 et verifie l'existence de chaque fichier
- Retour : `Vec<{ path: String, title: Option<String>, artist: Option<String>, duration: Option<u64>, exists: bool }>`
- Les metadonnees extraites du M3U8 (#EXTINF) sont retournees — le frontend peut les utiliser en attendant l'enrichissement complet via `get_audio_metadata`

### Pattern de communication inter-stores

Pour le message ephemere dans PlayerDisplay, utiliser le pattern existant :
- Verifier comment `FeedbackMessage.vue` ou le PlayerDisplay gere les messages temporaires
- Si un mecanisme existe deja (ex: `usePlayerStore` avec une propriete `displayMessage`), le reutiliser
- Sinon, ajouter une action `showTemporaryMessage(text, color, duration)` dans le store adequate

### Fichiers introuvables (missing tracks)

Quand `load_playlist` retourne des tracks avec `exists: false` :
- Ajouter la propriete `missing: true` sur l'objet track dans le store
- Dans `PlaylistPanel.vue`, appliquer la classe `.playlist-track--missing` conditionnellement
- Style : `opacity: 0.4`, `text-decoration: line-through`
- Le morceau reste dans la playlist (l'utilisateur peut voir ce qui manque)
- Si l'utilisateur tente de lire un morceau manquant, le comportement existant de gestion d'erreur (skip automatique) s'applique

### Reinitialisation du state playlist

`newPlaylist()` et `clearPlaylist()` doivent aussi :
- Remettre `playlistName` a `null`
- Remettre `playlistPath` a `null`
- Le nouveau state doit signifier "playlist non sauvegardee"

### Patterns de code a suivre

- **Convention IPC Tauri** : `invoke('save_playlist', { path, tracks })` — commande snake_case, params camelCase
- **Retour Rust** : `Result<T, String>` cote Rust, catch cote JS avec message user-friendly
- **Tests co-localises** : tests JS a cote du code source, tests Rust en `#[cfg(test)]`
- **Logging** : `console.log('[PlaylistStore] Playlist saved: path')`, `console.warn('[PlaylistStore] Failed to save: reason')`
- **Labels UI en francais** : "Playlist sauvegardee", "Playlist chargee"
- **Code en anglais** : variables, fonctions, commentaires en anglais
- **Pas de nouvelles dependances npm** sauf `@tauri-apps/plugin-dialog` (obligatoire pour les dialogues natifs)

### Anti-patterns interdits

- `alert()`, `confirm()`, `prompt()` — interdit, utiliser les dialogues natifs Tauri
- Ecrire des fichiers depuis le frontend (tout I/O disque passe par Rust/IPC)
- Dialogue de fichier custom en HTML — utiliser le dialogue natif OS via le plugin
- Stocker le contenu complet de la playlist dans Tauri Store — les playlists sont des fichiers M3U8 sur disque

### Project Structure Notes

**Fichiers a creer :**
- `src-tauri/src/file_manager/playlist_io.rs` — module lecture/ecriture M3U8
- `src-tauri/src/commands/playlist_commands.rs` — commandes IPC

**Fichiers a modifier :**
- `src-tauri/src/file_manager/mod.rs` — exporter playlist_io
- `src-tauri/src/commands/mod.rs` — exporter playlist_commands
- `src-tauri/src/lib.rs` — enregistrer les commandes + plugin dialog
- `src-tauri/Cargo.toml` — ajouter tauri-plugin-dialog
- `src-tauri/capabilities/default.json` — ajouter dialog:default
- `package.json` — ajouter @tauri-apps/plugin-dialog
- `src/stores/usePlaylistStore.js` — ajouter state playlistName/playlistPath + actions save/load
- `src/stores/usePlaylistStore.test.js` — tests save/load
- `src/composables/useKeyboardShortcuts.js` — remplacer stubs Ctrl+S / Ctrl+L
- `src/composables/useKeyboardShortcuts.test.js` — tests callbacks
- `src/App.vue` — enregistrer callbacks save/load
- `src/components/playlist/PlaylistPanel.vue` — style tracks manquants

**Aucun fichier a supprimer.**

### Contexte des stories precedentes

- **Story 3.1** (done) : creation/edition playlist, drag & drop reordonnement, Ctrl+N, amelioration removeTrack/clearPlaylist. 289 tests passent. Pattern de callbacks dans useKeyboardShortcuts etabli.
- **Story 1.5** : a cree PlaylistPanel, usePlaylistStore, drag & drop fichiers depuis l'OS
- **Story 2.1-2.2** : crossfade dans playNext/peekNextTrack — ne pas casser ce flow lors du load

### Git Intelligence

Derniers commits pertinents :
- `13b6de3` chore: update sprint status and story tracking for Story 3.1
- `6128025` feat: add playlist creation, editing and reordering (Story 3.1)
- Pattern de commit : `feat: description courte en anglais (Story X.Y)`
- Pattern de branche : `feature/3-2-sauvegarder-et-charger-des-playlists`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.2 (lignes 669-703)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Sections Data Architecture (M3U/M3U8), Architectural Boundaries (save_playlist, load_playlist)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Raccourcis Ctrl+S/Ctrl+L, feedback couleur #44FF44]
- [Source: src/stores/usePlaylistStore.js — State et actions existantes]
- [Source: src/composables/useKeyboardShortcuts.js — Stubs Ctrl+S/Ctrl+L a remplacer]
- [Source: src-tauri/src/commands/file_commands.rs — Pattern commandes IPC existant]
- [Source: src-tauri/capabilities/default.json — Permissions actuelles]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- All 302 JS tests pass (16 test files), 20 Rust tests pass
- No regressions introduced

### Completion Notes List
- Task 1: Created `playlist_io.rs` with `write_m3u8()` and `read_m3u()` functions, supporting extended M3U8 and simple M3U formats. 12 unit tests covering roundtrip, missing files, edge cases.
- Task 2: Created `playlist_commands.rs` with `save_playlist` and `load_playlist` IPC commands. Registered in `lib.rs` invoke handler.
- Task 3: Added `tauri-plugin-dialog` (Rust + npm), registered plugin, added `dialog:default` capability.
- Task 4: Added `playlistName`/`playlistPath` state, `savePlaylist()` (dialog on first save, direct on subsequent), `loadPlaylist()` (replaces tracks, marks missing), reset in `newPlaylist()`/`clearPlaylist()`. 12 new store tests.
- Task 5: Replaced Ctrl+S/Ctrl+L stubs in App.vue with actual `savePlaylist()`/`loadPlaylist()` calls. 5 new keyboard tests.
- Task 6: Feedback messages via existing `showFeedback('success')` pattern (#44FF44, 3s). Added `.playlist-track--missing` CSS (opacity 0.4, line-through).
- Task 7: ARIA announcements via existing `role="alert"` region in PlayerDisplay. Missing tracks get `aria-label="Morceau introuvable : [titre]"`.

### File List
- `src-tauri/src/file_manager/playlist_io.rs` (new)
- `src-tauri/src/file_manager/mod.rs` (modified)
- `src-tauri/src/commands/playlist_commands.rs` (new)
- `src-tauri/src/commands/mod.rs` (modified)
- `src-tauri/src/lib.rs` (modified)
- `src-tauri/Cargo.toml` (modified)
- `src-tauri/capabilities/default.json` (modified)
- `package.json` (modified)
- `src/stores/usePlaylistStore.js` (modified)
- `src/stores/usePlaylistStore.test.js` (modified)
- `src/App.vue` (modified)
- `src/composables/useKeyboardShortcuts.test.js` (modified)
- `src/components/playlist/PlaylistPanel.vue` (modified)

### Change Log
- 2026-03-25: Story 3.2 implementation complete — M3U8 save/load with native dialogs, keyboard shortcuts, visual feedback, ARIA accessibility
