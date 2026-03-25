# Story 3.3: Menu Contextuel Playlist

Status: review

## Story

As a utilisateur,
I want acceder aux actions de playlist via un clic droit,
So that je puisse gerer ma musique rapidement sans quitter le player.

## Acceptance Criteria (BDD)

1. **Given** la zone de playlist
   **When** l'utilisateur fait un clic droit
   **Then** un menu contextuel apparait positionne au curseur
   **And** le menu contient les options : "Ouvrir fichier", "Ouvrir dossier", "Nouvelle playlist", "Sauvegarder playlist", "Charger playlist", "Retirer le morceau", "Retirer tout"

2. **Given** le clic droit sur un morceau specifique
   **When** le menu contextuel s'affiche
   **Then** l'option "Retirer le morceau" est disponible et cible le morceau clique

3. **Given** le menu contextuel ouvert
   **When** l'utilisateur clique sur une option
   **Then** l'action correspondante est executee
   **And** le menu se ferme

4. **Given** le menu contextuel ouvert
   **When** l'utilisateur clique en dehors du menu ou appuie sur Escape
   **Then** le menu se ferme sans action

5. **Given** le menu contextuel
   **When** l'utilisateur navigue au clavier (Shift+F10 ou touche Menu pour ouvrir)
   **Then** les fleches haut/bas parcourent les options
   **And** Entree selectionne l'option focusee
   **And** le role ARIA "menu" est expose avec chaque option en role "menuitem"

6. **Given** l'option "Ouvrir fichier" selectionnee
   **When** l'utilisateur clique dessus
   **Then** le selecteur de fichier natif s'ouvre filtre sur les formats audio supportes (MP3, FLAC, WAV, OGG)
   **And** les fichiers selectionnes sont ajoutes a la playlist courante

## Tasks / Subtasks

- [x] Task 1 — Creer le composant ContextMenu.vue (AC: #1, #3, #4, #5)
  - [x] Creer `src/components/shared/ContextMenu.vue`
  - [x] Props : `visible` (Boolean), `x` / `y` (Number — position au curseur), `items` (Array d'objets `{ label, action, disabled? }`)
  - [x] Emits : `select(action)`, `close`
  - [x] Positionner le menu en `position: fixed` a (x, y), ajuster si depasse la fenetre (clamp aux bords)
  - [x] Fermer sur clic en dehors (event listener `mousedown` global quand visible)
  - [x] Fermer sur Escape
  - [x] Navigation clavier : fleches haut/bas, Entree pour selectionner, focus auto sur le premier item a l'ouverture
  - [x] ARIA : `role="menu"` sur le conteneur, `role="menuitem"` sur chaque option, `aria-disabled` si desactivee
  - [x] Style Winamp : fond `skinStore.colors.playlistBg`, texte `skinStore.colors.playlistText`, hover `skinStore.colors.activeTrack`, bordure `skinStore.colors.lightEdge`
  - [x] Tests : `src/components/shared/ContextMenu.test.js`

- [x] Task 2 — Integrer le ContextMenu dans PlaylistPanel.vue (AC: #1, #2, #3, #4)
  - [x] Importer et monter `<ContextMenu>` dans PlaylistPanel.vue
  - [x] State local : `contextMenu = ref({ visible: false, x: 0, y: 0, targetIndex: -1 })`
  - [x] Ecouter `@contextmenu.prevent` sur `.playlist-panel` pour ouvrir le menu
  - [x] Si clic droit sur un morceau : stocker l'index dans `targetIndex` pour cibler "Retirer le morceau"
  - [x] Si clic droit sur zone vide : `targetIndex = -1`, desactiver "Retirer le morceau"
  - [x] Definir la liste des items du menu avec les actions correspondantes
  - [x] Gerer `@select` pour dispatcher chaque action
  - [x] Gerer `@close` pour masquer le menu

- [x] Task 3 — Implementer les actions du menu contextuel (AC: #1, #3, #6)
  - [x] "Ouvrir fichier" : ouvrir dialog native `open()` filtree audio (MP3, FLAC, WAV, OGG, `multiple: true`), ajouter les fichiers a la playlist — reutiliser `@tauri-apps/plugin-dialog` deja installe
  - [x] "Ouvrir dossier" : ouvrir dialog native `open()` avec `directory: true`, puis `invoke('resolve_audio_paths', { paths: [dir] })` pour scanner, ajouter les fichiers — reutiliser le pattern de `fileDropProcessor.js`
  - [x] "Nouvelle playlist" : appeler `playlistStore.newPlaylist()` (Story 3.1)
  - [x] "Sauvegarder playlist" : appeler `playlistStore.savePlaylist()` (Story 3.2)
  - [x] "Charger playlist" : appeler `playlistStore.loadPlaylist()` (Story 3.2)
  - [x] "Retirer le morceau" : appeler `playlistStore.removeTrack(targetIndex)` — disponible seulement si targetIndex >= 0
  - [x] "Retirer tout" : appeler `playlistStore.clearPlaylist()` (Story 3.1)

- [x] Task 4 — Implementer Ctrl+O (ouvrir fichier) et "Ouvrir dossier" dans le store (AC: #6)
  - [x] Creer action `openFiles()` dans `usePlaylistStore.js` : ouvre le dialog fichier natif filtre audio, ajoute les fichiers selectionnes a la playlist
  - [x] Creer action `openFolder()` dans `usePlaylistStore.js` : ouvre le dialog dossier natif, scanne via `resolve_audio_paths`, ajoute les fichiers
  - [x] Remplacer le stub `onOpenFile` dans `App.vue` par `playlistStore.openFiles()`
  - [x] Tests : `openFiles()` et `openFolder()` dans usePlaylistStore.test.js

- [x] Task 5 — Ouverture clavier du menu contextuel (AC: #5)
  - [x] Dans `PlaylistPanel.vue`, ecouter `Shift+F10` et touche `ContextMenu` (key === 'ContextMenu') dans `handleKeyDown`
  - [x] Positionner le menu au niveau du morceau focuse (utiliser `getBoundingClientRect()` de l'element focuse)
  - [x] Si aucun morceau focuse, positionner au centre de la zone playlist
  - [x] Integrer `useFocusTrap` pour pieger le focus dans le menu contextuel quand ouvert

- [x] Task 6 — Accessibilite (AC: #5)
  - [x] Annonce ARIA a l'ouverture du menu : "Menu contextuel ouvert" via la live region existante
  - [x] Annonce ARIA a la fermeture : restaurer le focus sur l'element precedent (via `useFocusTrap.deactivate()`)
  - [x] Chaque `menuitem` a un `aria-label` explicite en francais
  - [x] Tests accessibilite dans ContextMenu.test.js

## Dev Notes

### Architecture et contexte technique

**Ce qui existe deja (Stories 3.1 + 3.2 terminees) :**
- `usePlaylistStore.js` : actions `addTracks()`, `removeTrack()`, `moveTrack()`, `newPlaylist()`, `clearPlaylist()`, `savePlaylist()`, `loadPlaylist()`, `playTrack()`, `playNext()`, `playPrevious()`
- `PlaylistPanel.vue` : drag & drop reordonnement, keyboard navigation (ArrowUp/Down, Enter, Delete, Home, End, Alt+Arrow), ARIA live region, empty state, missing tracks CSS
- `useKeyboardShortcuts.js` : systeme de callbacks enregistres depuis App.vue — **Ctrl+O est un stub** (`console.log('[App] Ctrl+O: open file (stub)')`)
- `useFocusTrap.js` : composable pret a l'emploi pour pieger le focus dans un overlay (Tab/Shift+Tab)
- `@tauri-apps/plugin-dialog` : deja installe et configure (Story 3.2) — `open()` et `save()` disponibles
- `fileDropProcessor.js` : pattern de resolution de chemins via `invoke('resolve_audio_paths', { paths })` — a reutiliser pour "Ouvrir dossier"
- `constants.js` : `SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'flac']` — utiliser pour les filtres de dialog

**Ce qui n'existe PAS encore (a creer) :**
- `ContextMenu.vue` — aucun composant de menu contextuel dans le projet (prevu dans l'architecture comme `src/components/shared/ContextMenu.vue`)
- `ContextMenu.test.js` — tests du composant
- Actions `openFiles()` et `openFolder()` dans le store playlist

### Composant ContextMenu — specification technique

**Props :**
```js
{
  visible: Boolean,     // controle la visibilite
  x: Number,            // position X (pixels, viewport)
  y: Number,            // position Y (pixels, viewport)
  items: Array           // [{ label: String, action: String, disabled: Boolean }]
}
```

**Emits :**
- `select(actionName)` — quand un item est clique ou selectionne par Entree
- `close` — quand le menu doit se fermer (clic dehors, Escape, selection)

**Positionnement :**
- `position: fixed; left: ${x}px; top: ${y}px`
- Clamper pour ne pas depasser `window.innerWidth` / `window.innerHeight`
- Si le menu depasse a droite, decaler vers la gauche ; si depasse en bas, afficher vers le haut

**Keyboard navigation :**
- Focus automatique sur le premier item a l'ouverture (via `nextTick` + `focus()`)
- ArrowDown/ArrowUp : parcourir les items (wrap autour)
- Entree : selectionner l'item focuse
- Escape : fermer sans action
- Tab : ne PAS sortir du menu (bloque via useFocusTrap)

### Integration dans PlaylistPanel.vue

**Evenement `contextmenu` :**
```js
function handleContextMenu(event) {
  event.preventDefault()
  // Determiner si le clic est sur un morceau ou sur la zone vide
  const trackEl = event.target.closest('.playlist-track')
  const targetIndex = trackEl ? parseInt(trackEl.id.replace('playlist-item-', '')) : -1
  contextMenu.value = { visible: true, x: event.clientX, y: event.clientY, targetIndex }
}
```

**Items du menu :**
```js
const contextMenuItems = computed(() => [
  { label: 'Ouvrir fichier', action: 'open-file' },
  { label: 'Ouvrir dossier', action: 'open-folder' },
  { label: 'separator' },
  { label: 'Nouvelle playlist', action: 'new-playlist' },
  { label: 'Sauvegarder playlist', action: 'save-playlist' },
  { label: 'Charger playlist', action: 'load-playlist' },
  { label: 'separator' },
  { label: 'Retirer le morceau', action: 'remove-track', disabled: contextMenu.value.targetIndex < 0 },
  { label: 'Retirer tout', action: 'remove-all', disabled: playlistStore.isEmpty }
])
```

**Gestion des separateurs :**
- Un item avec `label: 'separator'` est rendu comme un `<hr>` non focusable et non cliquable (pas de `role="menuitem"`)

### Actions "Ouvrir fichier" et "Ouvrir dossier"

**Ouvrir fichier** — reutiliser `@tauri-apps/plugin-dialog` :
```js
import { open } from '@tauri-apps/plugin-dialog'

async openFiles() {
  const paths = await open({
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac'] }],
    multiple: true
  })
  if (paths && paths.length > 0) {
    this.addTracks(paths)
  }
}
```

**Ouvrir dossier** — dialog natif + scan backend :
```js
async openFolder() {
  const dir = await open({ directory: true })
  if (!dir) return
  const files = await invoke('resolve_audio_paths', { paths: [dir] })
  if (files.length > 0) {
    this.addTracks(files)
  }
}
```

**Note :** `open()` avec `multiple: true` retourne un `Array<string>` ou `null`. `open()` avec `directory: true` retourne un `string` ou `null`. La commande IPC `resolve_audio_paths` existe deja et scanne recursivement les dossiers pour trouver les fichiers audio supportes.

### Pattern de communication inter-stores

- ContextMenu n'a PAS besoin de store — c'est un composant presentationnel pur
- Les actions sont dispatches depuis PlaylistPanel.vue via les stores existants
- Pour le feedback apres "Ouvrir fichier/dossier", les tracks ajoutees declenchent automatiquement l'annonce ARIA existante dans PlaylistPanel (`watch trackCount`)

### Skinning du menu contextuel

Couleurs a utiliser depuis `useSkinStore.colors` :
- Fond : `playlistBg` (#000000)
- Texte : `playlistText` (#00FF00)
- Hover/focus : `activeTrack` (#FFFFFF) sur fond `accentMetallic` (#5A5A5F)
- Bordure : `lightEdge` (#3F3F44)
- Texte desactive : `disabledControls` (#555555)
- Separateur : `lightEdge` (#3F3F44)

### Patterns de code a suivre

- **Convention composant Vue** : PascalCase, un composant par fichier, `<script setup>`
- **Tests co-localises** : `ContextMenu.test.js` a cote de `ContextMenu.vue` dans `src/components/shared/`
- **Logging** : `console.log('[ContextMenu] Menu opened at (x, y)')`, `console.warn('[ContextMenu] ...')`
- **Labels UI en francais** : "Ouvrir fichier", "Retirer le morceau", etc.
- **Code en anglais** : variables, fonctions, commentaires
- **Pas de nouvelles dependances npm** — tout est deja disponible
- **Pas de `alert()`, `confirm()`, `prompt()`** — interdit
- **Pas de `document.getElementById()`** — utiliser refs Vue

### Anti-patterns interdits

- NE PAS creer un store Pinia pour le menu contextuel — c'est du state local au composant
- NE PAS utiliser une librairie tierce de menu contextuel (vue-context-menu, etc.)
- NE PAS dupliquer la logique de `removeTrack`, `clearPlaylist`, `savePlaylist`, `loadPlaylist` — appeler les actions existantes du store
- NE PAS bloquer la lecture en cours lors de l'ouverture/fermeture du menu
- NE PAS utiliser `draggable="true"` HTML natif — c'est casse dans Tauri webview (cf. Story 3.1)

### Project Structure Notes

**Fichiers a creer :**
- `src/components/shared/ContextMenu.vue` — composant menu contextuel
- `src/components/shared/ContextMenu.test.js` — tests du composant

**Fichiers a modifier :**
- `src/components/playlist/PlaylistPanel.vue` — integrer ContextMenu, ajouter `@contextmenu.prevent`, Shift+F10
- `src/stores/usePlaylistStore.js` — ajouter actions `openFiles()` et `openFolder()`
- `src/stores/usePlaylistStore.test.js` — tests pour openFiles/openFolder
- `src/App.vue` — remplacer stub Ctrl+O par `playlistStore.openFiles()`

**Aucun fichier a supprimer.**

### Contexte des stories precedentes

- **Story 3.2** (done) : save/load playlist M3U8 avec dialogues natifs. 302 JS tests, 20 Rust tests. Plugin dialog installe. Pattern de feedback ephemere fonctionne. `showFeedback('success')` pour confirmations.
- **Story 3.1** (done) : creation/edition playlist, `newPlaylist()`, `clearPlaylist()`, `removeTrack()`, `moveTrack()`. Drag & drop reordonnement. Callbacks keyboard dans `useKeyboardShortcuts`.
- **Story 1.8** : `useFocusTrap.js` cree — pattern pret a reutiliser pour le menu contextuel. Integre dans PreferencesPanel, pas encore dans ContextMenu.
- **Epic 2 retro** : note "ContextMenu non implemente, necessaire pour Story 3-3, a creer from scratch. Pattern pret (useFocusTrap)."

### Git Intelligence

Derniers commits pertinents :
- `c04461c` Merge PR #15: M3U8 save/load (Story 3.2)
- `24a0acc` feat: add M3U8 playlist save/load with native dialogs (Story 3.2)
- `cf90772` Merge PR #14: Playlist creation/editing (Story 3.1)
- Pattern de commit : `feat: description courte en anglais (Story X.Y)`
- Pattern de branche : `feature/3-3-menu-contextuel-playlist`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Section Components (ContextMenu.vue dans shared/)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Composant ContextMenu spec, Flow 4 Gestion Playlists, Hierarchie d'Interaction, Raccourcis Clavier]
- [Source: src/components/shared/ — Emplacement prevu pour ContextMenu.vue]
- [Source: src/composables/useFocusTrap.js — Pattern focus trap a reutiliser]
- [Source: src/App.vue:43 — Stub Ctrl+O a remplacer]
- [Source: src/utils/fileDropProcessor.js — Pattern resolve_audio_paths a reutiliser pour "Ouvrir dossier"]
- [Source: src/stores/usePlaylistStore.js — Actions existantes a reutiliser]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun probleme majeur rencontre. Le seul ajustement a ete l'ajout de `{ immediate: true }` sur le watcher de `visible` dans ContextMenu.vue pour que le listener click-outside soit enregistre meme si le composant est monte avec `visible: true`.

### Completion Notes List

- ✅ Task 1 : Composant ContextMenu.vue cree avec props/emits, positionnement fixed clampe, navigation clavier (ArrowUp/Down/Enter/Escape), fermeture clic dehors, ARIA roles, style Winamp skinne. 20 tests unitaires.
- ✅ Task 2 : ContextMenu integre dans PlaylistPanel.vue avec @contextmenu.prevent, detection morceau vs zone vide via closest('.playlist-track'), computed items avec disabled dynamique.
- ✅ Task 3 : 7 actions du menu implementees via handleContextMenuSelect — dispatch vers les actions existantes du store (newPlaylist, clearPlaylist, removeTrack, savePlaylist, loadPlaylist) + nouvelles actions openFiles/openFolder.
- ✅ Task 4 : Actions openFiles() et openFolder() ajoutees au store avec dialog natif filtre audio. Stub Ctrl+O remplace dans App.vue. 6 tests unitaires ajoutes.
- ✅ Task 5 : Shift+F10 et touche ContextMenu ouvrent le menu positionne sur le morceau focuse (getBoundingClientRect) ou au centre si aucun focus. Focus trap via useFocusTrap.
- ✅ Task 6 : Annonces ARIA "Menu contextuel ouvert/ferme" via live region existante. aria-label sur chaque menuitem. Restauration focus via useFocusTrap.deactivate(). Tests ARIA dans ContextMenu.test.js.

### Change Log

- 2026-03-25 : Implementation complete de la Story 3.3 — Menu contextuel playlist avec 7 actions, navigation clavier, accessibilite ARIA, skinning Winamp. 328 tests passent (26 nouveaux).

### File List

**Fichiers crees :**
- src/components/shared/ContextMenu.vue
- src/components/shared/ContextMenu.test.js

**Fichiers modifies :**
- src/components/playlist/PlaylistPanel.vue
- src/stores/usePlaylistStore.js
- src/stores/usePlaylistStore.test.js
- src/App.vue
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/3-3-menu-contextuel-playlist.md
