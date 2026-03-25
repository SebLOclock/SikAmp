# Story 1.9 : Double Mode de Rendu et Redimensionnement

Status: review

## Story

As a utilisateur,
I want choisir entre un mode rétro pixel-perfect et un mode moderne lisse, et redimensionner la fenêtre librement,
So that je profite de l'expérience visuelle qui me convient sur mon écran.

## Contexte Business

Le double mode de rendu est un choix UX central de SikAmp : le mode rétro satisfait la nostalgie authentique (Marina), le mode moderne crée l'aesthetic partageable (Léo). Le redimensionnement adaptatif garantit une expérience fluide sur tous les écrans (Full HD → 4K). Ces deux features clôturent l'Epic 1 et rendent le player visuellement complet pour le MVP.

- **FR16** : Interface compacte dans une fenêtre unique redimensionnable
- **UX-DR15** : Double mode de rendu — rétro (nearest-neighbor) et moderne (anti-aliasing)
- **UX-DR20** : Stratégie de redimensionnement — taille minimale 800x400px, hauteur fixe player, playlist extensible

## Acceptance Criteria

1. **Given** le panneau de préférences
   **When** l'utilisateur bascule le toggle "Mode de rendu"
   **Then** le mode rétro utilise nearest-neighbor (imageSmoothingEnabled=false, pixels nets)
   **And** le mode moderne utilise anti-aliasing (imageSmoothingEnabled=true) appliqué aux sprites et textures

2. **Given** le mode rétro actif
   **When** les contrôles changent d'état (normal → hover → pressed)
   **Then** la transition est instantanée, sans animation

3. **Given** le mode moderne actif
   **When** les contrôles changent d'état
   **Then** la transition dure 100ms avec easing ease-out

4. **Given** le panneau overlay (SkinSelector ou PreferencesPanel)
   **When** il s'ouvre en mode rétro
   **Then** l'apparition est instantanée
   **When** il s'ouvre en mode moderne
   **Then** l'apparition est un fade-in de 150ms

5. **Given** un seul panneau overlay peut être ouvert à la fois
   **When** l'utilisateur ouvre le SkinSelector alors que le PreferencesPanel est ouvert
   **Then** le PreferencesPanel se ferme et le SkinSelector s'ouvre
   **And** Escape ou clic en dehors ferme le panneau ouvert

6. **Given** la fenêtre du player
   **When** l'utilisateur redimensionne la fenêtre
   **Then** la taille minimale est 800x400 pixels
   **And** la fenêtre principale (contrôles + afficheur) a une hauteur fixe, la largeur s'adapte
   **And** la playlist prend tout l'espace vertical restant
   **And** la colonne "Titre" s'étire, "Artiste" et "Durée" gardent leur largeur fixe

7. **Given** la taille et position de la fenêtre
   **When** l'utilisateur quitte l'application
   **Then** la taille et la position sont sauvegardées via Tauri Store
   **And** au prochain lancement, la fenêtre s'ouvre aux mêmes dimensions et position

8. **Given** l'utilisateur a activé `prefers-reduced-motion` dans son OS
   **When** le mode moderne est actif
   **Then** toutes les animations sont désactivées (transitions instantanées comme en mode rétro)

9. **Given** le premier lancement sur un écran donné
   **When** le facteur de scale est déterminé automatiquement
   **Then** l'interface choisit 2x pour Full HD, 3x pour 4K

## Tasks / Subtasks

- [x] Task 1 : Ajouter le toggle "Mode de rendu" dans PreferencesPanel (AC: #1)
  - [x] Ajouter une option toggle rétro/moderne dans `PreferencesPanel.vue`
  - [x] Brancher sur `useSkinStore.setRenderMode(mode)` (déjà existant)
  - [x] Persister le choix dans `usePreferencesStore` via Tauri Store
  - [x] Charger la préférence au démarrage et l'appliquer au `useSkinStore`
  - [x] Label ARIA en français : "Mode de rendu" avec valeurs "Rétro" / "Moderne"

- [x] Task 2 : Appliquer le mode de rendu sur tous les canvas (AC: #1)
  - [x] Vérifier que `skinRenderer.setupCanvas()` applique `imageSmoothingEnabled` selon `renderMode` (déjà implémenté)
  - [x] S'assurer que le changement de mode déclenche un re-render immédiat de tous les canvas (PlayerDisplay, TransportControls, SeekBar, VolumeSlider, ActionBar)
  - [x] Watcher réactif : quand `skinStore.renderMode` change → re-render canvas

- [x] Task 3 : Transitions conditionnelles selon le mode (AC: #2, #3, #4)
  - [x] CSS : définir les transitions 100ms ease-out en mode moderne via une classe `.render-modern` sur le container principal
  - [x] CSS : en mode rétro, `transition: none` (classe `.render-retro`)
  - [x] Appliquer la classe dynamiquement sur `.app` selon `skinStore.renderMode`
  - [x] PreferencesPanel : fade-in 150ms en mode moderne, apparition instantanée en mode rétro
  - [x] Respecter `prefers-reduced-motion` : si actif, forcer `transition: none` même en mode moderne (AC: #8)

- [x] Task 4 : Gestion exclusive des panneaux overlay (AC: #5)
  - [x] S'assurer qu'un seul panneau overlay est ouvert à la fois (PreferencesPanel / SkinSelector)
  - [x] State dans App.vue ou store : `activeOverlay: null | 'preferences' | 'skins'`
  - [x] Ouvrir un panneau ferme automatiquement l'autre
  - [x] Escape ferme le panneau actif (déjà géré par `useKeyboardShortcuts`)
  - [x] Clic en dehors du panneau le ferme

- [x] Task 5 : Redimensionnement adaptatif de la fenêtre (AC: #6)
  - [x] Vérifier que `tauri.conf.json` a `minWidth: 800, minHeight: 400, resizable: true` (déjà en place)
  - [x] Layout CSS : la zone player (Display + Controls + ActionBar) a une hauteur fixe
  - [x] La PlaylistPanel utilise `flex: 1` pour prendre l'espace vertical restant (supprimer le `max-height: 300px` existant)
  - [x] Le canvas PlayerDisplay s'adapte en largeur à la fenêtre
  - [x] Ajouter un listener de resize pour re-render les canvas à la bonne taille
  - [x] Colonnes playlist : Titre flexible (`flex: 1`), Artiste et Durée à largeur fixe

- [x] Task 6 : Persistance taille et position de la fenêtre (AC: #7)
  - [x] Utiliser l'API Tauri `getCurrentWindow()` pour lire/écrire la taille et position
  - [x] Sauvegarder `{ width, height, x, y }` dans `usePreferencesStore` via Tauri Store
  - [x] Debounce la sauvegarde lors du resize/move (500ms)
  - [x] Au démarrage : restaurer la position/taille depuis les préférences
  - [x] Fallback si pas de préférence sauvegardée : utiliser la taille par défaut de `tauri.conf.json`

- [x] Task 7 : Auto-détection du facteur de scale (AC: #9)
  - [x] Lire `window.devicePixelRatio` au démarrage
  - [x] Si DPR ≥ 2 et pas de préférence sauvegardée : utiliser scale 2x (Full HD) ou 3x (4K, DPR ≥ 3)
  - [x] Stocker le facteur de scale dans `usePreferencesStore`
  - [x] Le `skinRenderer.setupCanvas()` utilise déjà `devicePixelRatio` pour le scaling HiDPI (confirmer)

- [x] Task 8 : Tests (AC: #1-#9)
  - [x] Test : le toggle mode de rendu dans PreferencesPanel change `skinStore.renderMode`
  - [x] Test : `imageSmoothingEnabled` est `false` en mode rétro, `true` en mode moderne
  - [x] Test : la classe CSS `.render-retro` / `.render-modern` est appliquée sur le container
  - [x] Test : la préférence `renderMode` est persistée et restaurée
  - [x] Test : un seul panneau overlay est ouvert à la fois
  - [x] Test : le canvas se redimensionne quand la fenêtre change de taille
  - [x] Test : la taille/position de fenêtre est sauvegardée (debounced)
  - [x] Tous les tests existants continuent de passer (212 tests + nouveaux — 0 régression)

## Dev Notes

### État Actuel du Code — Infrastructure Déjà en Place

L'analyse du codebase révèle que **~80% de l'infrastructure existe déjà** :

**Ce qui EXISTE déjà :**
- `useSkinStore.js` : state `renderMode: 'retro'` + action `setRenderMode(mode)` avec validation 'retro'/'modern'
- `skinRenderer.js` : `setupCanvas(canvas, width, height, renderMode)` applique `ctx.imageSmoothingEnabled = renderMode === 'modern'` et gère le scaling HiDPI via `devicePixelRatio`
- `PlayerDisplay.vue` : passe déjà `skinStore.renderMode` à `setupCanvas()`
- `tauri.conf.json` : `minWidth: 800, minHeight: 400, resizable: true` déjà configuré
- `usePreferencesStore.js` : mécanisme de persistance Tauri Store avec debounce 500ms
- `useKeyboardShortcuts.js` : Escape ferme déjà les panneaux overlay

**Ce qui MANQUE (scope de cette story) :**
- Toggle mode de rendu dans PreferencesPanel
- Persistance de `renderMode` dans les préférences
- CSS transitions conditionnelles (rétro=instantané, moderne=100ms)
- Animations overlay conditionnelles (rétro=instantané, moderne=fade 150ms)
- Gestion exclusive des panneaux overlay
- Canvas PlayerDisplay responsive en largeur
- Listener de resize pour re-render les canvas
- Persistance taille/position fenêtre via Tauri API
- Layout flex pour que la playlist s'étire verticalement (supprimer `max-height: 300px`)

### Feedback Utilisateur — IMPORTANT

**Rendu moderne ≠ pixelisé :** L'utilisateur (Seb) a explicitement demandé que le mode "moderne" soit crisp et adapté aux écrans HiDPI, pas une reproduction basse résolution. Les canvas utilisent déjà `devicePixelRatio` pour le scaling — c'est le bon pattern. Le mode "rétro" est le mode nearest-neighbor (pixels nets), le mode "moderne" est anti-aliasé.

**Pas de TitleBar custom :** Le layout utilise la barre de titre native Tauri (`decorations: true`). Ne pas créer de composant TitleBar.

### Architecture CSS — Transitions Conditionnelles

Pattern à utiliser pour appliquer les transitions selon le mode :

```css
/* Mode rétro — pas de transitions */
.render-retro * {
  transition: none !important;
}

/* Mode moderne — transitions fluides */
.render-modern .overlay-panel {
  transition: opacity 150ms ease-out;
}

/* Respecter prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

Appliquer `.render-retro` ou `.render-modern` sur l'élément `.app` dans `App.vue` en réaction à `skinStore.renderMode`.

### Canvas Responsive — Pattern de Resize

Pour que le canvas PlayerDisplay s'adapte à la largeur de la fenêtre :

```javascript
// Composable useCanvasResize ou directement dans PlayerDisplay
const resizeObserver = new ResizeObserver((entries) => {
  const { width } = entries[0].contentRect
  // Recalculer la taille du canvas
  setupCanvas(canvas, width, CANVAS_HEIGHT, skinStore.renderMode)
  // Re-render
  renderFrame()
})
resizeObserver.observe(containerRef.value)
```

Le canvas a actuellement des dimensions hardcodées (800x110). Adapter la largeur dynamiquement tout en gardant la hauteur fixe. Les autres canvas (TransportControls, SeekBar, etc.) peuvent garder leur taille fixe si le layout flex les gère.

### Persistance Fenêtre — API Tauri

```javascript
import { getCurrentWindow } from '@tauri-apps/api/window'

// Sauvegarder (debounced)
const window = getCurrentWindow()
window.onResized(debounce(async () => {
  const size = await window.innerSize()
  const position = await window.outerPosition()
  preferencesStore.saveWindowState({ width: size.width, height: size.height, x: position.x, y: position.y })
}, 500))

// Restaurer au démarrage
const windowState = preferencesStore.windowState
if (windowState) {
  await window.setSize(new LogicalSize(windowState.width, windowState.height))
  await window.setPosition(new LogicalPosition(windowState.x, windowState.y))
}
```

Importer `LogicalSize` et `LogicalPosition` depuis `@tauri-apps/api/dpi`.

### Gestion Exclusive des Overlays

Pattern simple dans App.vue :

```javascript
const activeOverlay = ref(null) // null | 'preferences' | 'skins'

function toggleOverlay(name) {
  activeOverlay.value = activeOverlay.value === name ? null : name
}
```

Les deux panneaux (PreferencesPanel, SkinSelector si implémenté) écoutent `activeOverlay` pour s'afficher/masquer. Un seul est visible à la fois.

### Layout Flex — Playlist Extensible

Modifier le CSS de `App.vue` pour que la playlist prenne l'espace restant :

```css
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.player-window {
  flex-shrink: 0; /* Hauteur fixe */
}

.playlist-panel {
  flex: 1; /* Prend tout l'espace restant */
  min-height: 120px;
  overflow-y: auto;
  /* Supprimer max-height: 300px */
}
```

### Colonnes Playlist — Titre Flexible

Dans `PlaylistPanel.vue` / `PlaylistItem.vue`, la colonne Titre doit s'étirer :

```css
.track-title { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.track-artist { width: 150px; flex-shrink: 0; }
.track-duration { width: 60px; flex-shrink: 0; text-align: right; }
```

### Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/stores/usePreferencesStore.js` | Ajouter `renderMode`, `windowState`, `scaleFactor` dans le state + persistance |
| `src/stores/useSkinStore.js` | Charger `renderMode` depuis les préférences au démarrage |
| `src/components/shared/PreferencesPanel.vue` | Ajouter toggle "Mode de rendu" (rétro/moderne) |
| `src/App.vue` | Classe dynamique `.render-retro`/`.render-modern`, gestion exclusive overlays, layout flex `height: 100vh` |
| `src/components/player/PlayerDisplay.vue` | Canvas responsive en largeur (ResizeObserver) |
| `src/components/playlist/PlaylistPanel.vue` | `flex: 1`, supprimer `max-height`, colonnes Titre flexible |
| `src/assets/focus-styles.css` | Ajouter les règles transitions conditionnelles + `prefers-reduced-motion` |

### Nouveaux Fichiers à Créer

| Fichier | Rôle |
|---------|------|
| `src/composables/useWindowState.js` | Composable pour sauvegarder/restaurer taille et position fenêtre via Tauri API |
| `src/composables/useWindowState.test.js` | Tests du composable |

### Dépendances — Aucun Nouveau Package

Toutes les APIs nécessaires sont déjà disponibles :
- `@tauri-apps/api/window` — `getCurrentWindow()` pour taille/position
- `@tauri-apps/api/dpi` — `LogicalSize`, `LogicalPosition`
- `@tauri-apps/plugin-store` — déjà utilisé dans `usePreferencesStore`
- `ResizeObserver` — API web standard, disponible dans la webview Tauri
- `window.devicePixelRatio` — API web standard

### Intelligence de la Story 1.8

Patterns confirmés à réutiliser :
- Focus trap et focus visible sur les panneaux overlay — respecter lors de l'ajout du toggle
- `useKeyboardShortcuts.js` gère Escape pour fermer les overlays — s'appuyer dessus
- `prefers-reduced-motion` est déjà géré dans `focus-styles.css` — étendre avec les transitions
- Tests Vitest co-localisés — 212 tests existants à ne pas casser
- Labels ARIA en français sur tous les contrôles

### Git Intelligence

Patterns des derniers commits :
- Messages en anglais, préfixe `feat:` / `fix:`
- Tests systématiquement ajoutés
- Conventions JS/Vue respectées (camelCase fichiers JS, PascalCase composants Vue)
- Le rebranding SikAmp vient d'être appliqué (commit a212d24)

### Anti-Patterns à Éviter

- **NE PAS** créer de composant TitleBar — la barre native Tauri est utilisée (`decorations: true`)
- **NE PAS** utiliser des dimensions canvas fixes 275x116 (dimensions Winamp originales) — utiliser des dimensions modernes HiDPI
- **NE PAS** utiliser `alert()`, `confirm()`, `prompt()` — jamais
- **NE PAS** muter le state hors des stores Pinia
- **NE PAS** ajouter de dépendance npm pour les transitions/animations — CSS pur
- **NE PAS** dupliquer le mécanisme de persistance — réutiliser `usePreferencesStore` avec son debounce existant

### Project Structure Notes

- Tous les fichiers s'inscrivent dans la structure existante
- Le nouveau `useWindowState.js` va dans `src/composables/`
- Tests co-localisés avec le code source
- Pas de fichier Rust nécessaire — tout côté frontend JS/CSS

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.9, lignes 497-548]
- [Source: _bmad-output/planning-artifacts/prd.md — FR16, UX-DR15, UX-DR20]
- [Source: _bmad-output/planning-artifacts/architecture.md — Skin Engine, Canvas 2D, Rendu double mode, Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Stratégie de Scaling (lignes 1089-1101), Comportement au redimensionnement (lignes 1080-1088), PreferencesPanel (ligne 868)]
- [Source: _bmad-output/implementation-artifacts/1-8-accessibilite-clavier-et-lecteurs-d-ecran.md — Dev Notes, Patterns, File List]
- [Source: memory/feedback_modern_rendering.md — Rendu HiDPI crisp, pas pixelisé]
- [Source: memory/feedback_tauri_native_titlebar.md — Pas de TitleBar custom]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- ✅ Toggle mode de rendu ajouté dans PreferencesPanel avec labels ARIA en français (Rétro/Moderne)
- ✅ `usePreferencesStore` étendu avec `renderMode`, `windowState`, `scaleFactor` et persistance Tauri Store
- ✅ Tous les canvas (PlayerDisplay, TransportControls, SeekBar, VolumeSlider, ActionBar) re-rendus au changement de mode — watchers déjà en place
- ✅ CSS transitions conditionnelles : `.render-retro` (transition: none), `.render-modern` (transitions fluides), `prefers-reduced-motion` respecté
- ✅ PreferencesPanel : fade-in 150ms en mode moderne via `<Transition>` Vue, instantané en mode rétro
- ✅ Gestion exclusive des overlays via `activeOverlay` ref dans App.vue — un seul panneau à la fois
- ✅ Layout flex adaptatif : `height: 100vh` sur `.app`, `flex-shrink: 0` sur `.player-window`, `flex: 1` sur `.playlist-panel` (max-height: 300px supprimé)
- ✅ Canvas PlayerDisplay responsive en largeur via ResizeObserver
- ✅ Composable `useWindowState` créé : sauvegarde/restauration taille+position fenêtre via Tauri API avec debounce 500ms
- ✅ Auto-détection facteur de scale (2x Full HD, 3x 4K) au premier lancement
- ✅ 227 tests passent (15 nouveaux + 212 existants — 0 régression)

### Change Log

- 2026-03-25 : Implémentation complète Story 1.9 — double mode de rendu, redimensionnement adaptatif, persistance fenêtre, gestion overlays

### File List

**Modifiés :**
- src/stores/usePreferencesStore.js
- src/stores/usePreferencesStore.test.js
- src/components/shared/PreferencesPanel.vue
- src/App.vue
- src/components/player/PlayerDisplay.vue
- src/components/playlist/PlaylistPanel.vue
- src/assets/focus-styles.css

**Créés :**
- src/composables/useWindowState.js
- src/composables/useWindowState.test.js
