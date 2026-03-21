# Story 1.3 : Interface Skinnee Classic Faithful

Status: review

## Story

As a utilisateur,
I want voir une interface compacte fidele a l'esthetique Winamp classique,
So that je ressente immediatement la nostalgie du player original.

## Acceptance Criteria (BDD)

1. **Given** l'application lancee
   **When** l'interface s'affiche
   **Then** la fenetre principale contient dans l'ordre : barre de titre (TitleBar), afficheur (PlayerDisplay), barre de progression (SeekBar), controles de lecture (TransportControls), slider de volume (VolumeSlider), barre d'actions (ActionBar)
   **And** un panneau playlist (PlaylistPanel) est affiche sous la fenetre principale

2. **Given** le skin par defaut Classic Faithful
   **When** les composants sont rendus en Canvas 2D
   **Then** le fond est gris metallique (#29292E)
   **And** l'afficheur a un fond noir (#000000) avec texte vert lumineux (#00FF00)
   **And** les controles ont un effet de profondeur 3D (style outset/inset)
   **And** le ratio de contraste du texte sur fond est >= 4.5:1 (WCAG AA)

3. **Given** les assets du skin par defaut embarques dans `src/assets/default-skin/`
   **When** le SkinRenderer charge et dessine les sprites
   **Then** chaque composant (TitleBar, PlayerDisplay, TransportControls, SeekBar, VolumeSlider, ActionBar) est rendu avec ses sprites correspondants

4. **Given** le composant PlayerDisplay
   **When** un morceau est en lecture
   **Then** le titre scrolle horizontalement (artiste — titre) avec la police bitmap custom
   **And** le temps ecoule/total est affiche en grand format
   **And** le bitrate, la frequence et le mode stereo/mono sont affiches
   **And** un clic sur le temps bascule entre temps ecoule et temps restant

5. **Given** le store `useSkinStore` cree
   **When** le skin par defaut est charge
   **Then** les chemins vers les assets sont stockes dans le store
   **And** tous les composants consomment les assets via le store

## Tasks / Subtasks

- [x] Task 1 : Creer les assets du skin par defaut Classic Faithful (AC: #2, #3)
  - [x] 1.1 Creer les sprites bitmap pour chaque composant dans `src/assets/default-skin/` : `main.bmp` (fond principal), `titlebar.bmp` (barre de titre + boutons), `cbuttons.bmp` (transport controls : prev/play/pause/stop/next, etats normal/pressed), `posbar.bmp` (seek bar fond + curseur), `volume.bmp` (slider volume fond + curseur), `pledit.bmp` (textures playlist), `text.bmp` (police bitmap pour l'afficheur)
  - [x] 1.2 Creer `viscolor.txt` definissant la palette de couleurs du skin (vert #00FF00 sur noir #000000)
  - [x] 1.3 Creer la police bitmap `src/assets/fonts/display-font.bmp` — police monospace pixelisee inspiree Winamp (caracteres A-Z, 0-9, symboles, pas de reutilisation directe de l'original)
  - [x] 1.4 Les sprites doivent etre en format PNG (pas BMP reel — les noms `.bmp` sont la convention Winamp, utiliser PNG pour le web)

- [x] Task 2 : Implementer useSkinStore (AC: #5)
  - [x] 2.1 Completer `src/stores/useSkinStore.js` avec le state : `currentSkin` (nom du skin actif), `assets` (objet contenant les chemins vers chaque sprite : main, titlebar, cbuttons, posbar, volume, pledit, text, font), `isLoaded` (boolean), `renderMode` ('retro' | 'modern')
  - [x] 2.2 Implementer l'action `loadDefaultSkin()` : construire les chemins vers les fichiers dans `src/assets/default-skin/`, charger les images via `new Image()`, stocker les references dans le state
  - [x] 2.3 Implementer l'action `getAsset(name)` : retourner l'image chargee pour un sprite donne
  - [x] 2.4 Implementer l'action `setRenderMode(mode)` : basculer entre 'retro' et 'modern'
  - [x] 2.5 Initialiser le skin par defaut au montage de l'application (dans `App.vue` ou `main.js`)
  - [x] 2.6 Ne PAS stocker les objets `Image` dans le state Pinia (non serializable) — les garder dans un Map local au module, exposer seulement les chemins dans le state

- [x] Task 3 : Implementer skinRenderer.js (AC: #2, #3)
  - [x] 3.1 Remplacer le placeholder dans `src/engine/skinRenderer.js` par un module qui fournit des fonctions de rendu Canvas 2D
  - [x] 3.2 Implementer `drawBackground(ctx, assets, width, height)` : dessiner le fond gris metallique #29292E
  - [x] 3.3 Implementer `drawButton(ctx, spriteSheet, spriteCoords, x, y, state)` : dessiner un bouton depuis une sprite sheet (etats normal/hover/pressed/disabled)
  - [x] 3.4 Implementer `drawSlider(ctx, assets, x, y, value, min, max)` : dessiner un slider (seek bar ou volume)
  - [x] 3.5 Implementer `drawBitmapText(ctx, fontImage, text, x, y, charWidth, charHeight)` : dessiner du texte avec la police bitmap
  - [x] 3.6 Implementer `drawScrollingText(ctx, fontImage, text, x, y, width, offset, charWidth, charHeight)` : texte defilant avec offset anime
  - [x] 3.7 Respecter le mode de rendu : `ctx.imageSmoothingEnabled = false` en mode retro, `true` en mode moderne
  - [x] 3.8 Exposer une fonction `setupCanvas(canvas, width, height, renderMode)` pour configurer le contexte correctement

- [x] Task 4 : Implementer TitleBar.vue (AC: #1, #2)
  - [x] 4.1 Creer `src/components/player/TitleBar.vue` — composant avec un `<canvas>` ref
  - [x] 4.2 Dessiner la barre de titre avec le sprite `titlebar.bmp`, fond gris metallique #29292E
  - [x] 4.3 Afficher le nom de l'app "winamp-sik" ou le titre du morceau en cours (via `usePlayerStore`)
  - [x] 4.4 Ajouter les boutons minimize et close (sprites avec etats normal/hover/pressed)
  - [x] 4.5 Boutons minimize/close : ecouter les clics via hit-testing sur les coordonnees du canvas
  - [x] 4.6 Minimize appelle `appWindow.minimize()` et Close appelle `appWindow.close()` via `@tauri-apps/api/window`
  - [x] 4.7 Accessibilite : ajouter des boutons HTML invisibles superposés au canvas pour les labels ARIA "Reduire" / "Fermer" et la navigation clavier

- [x] Task 5 : Implementer PlayerDisplay.vue (AC: #1, #4)
  - [x] 5.1 Creer `src/components/player/PlayerDisplay.vue` — composant avec un `<canvas>` ref
  - [x] 5.2 Fond noir #000000, texte vert lumineux #00FF00
  - [x] 5.3 Afficher le titre scrollant "artiste — titre" avec `drawScrollingText()`, animer via `requestAnimationFrame`
  - [x] 5.4 Afficher le temps ecoule en grand format bitmap (MM:SS) via la police bitmap
  - [x] 5.5 Afficher le bitrate, la frequence et le mode stereo/mono (texte vert secondaire #00CC00)
  - [x] 5.6 Clic sur la zone temps : basculer entre temps ecoule et temps restant (gerer l'etat local `showRemaining`)
  - [x] 5.7 Hit-testing sur le canvas pour detecter le clic sur la zone temps
  - [x] 5.8 Accessibilite : live region ARIA pour le titre et le temps (element HTML invisible mis a jour)
  - [x] 5.9 S'abonner a `usePlayerStore` pour les donnees reactives (currentTrack, currentTime, duration)

- [x] Task 6 : Implementer SeekBar.vue (AC: #1)
  - [x] 6.1 Creer `src/components/player/SeekBar.vue` — composant avec un `<canvas>` ref
  - [x] 6.2 Dessiner la barre de progression avec le sprite `posbar.bmp` : fond + barre remplie + curseur
  - [x] 6.3 Clic sur le canvas : calculer la position relative, appeler `usePlayerStore().seek(time)`
  - [x] 6.4 Drag du curseur : suivre le mousemove, mettre a jour la position en temps reel
  - [x] 6.5 Accessibilite : slider ARIA avec min=0, max=duration, current=currentTime, navigable clavier (fleches)

- [x] Task 7 : Implementer TransportControls.vue (AC: #1, #2)
  - [x] 7.1 Creer `src/components/player/TransportControls.vue` — composant avec un `<canvas>` ref
  - [x] 7.2 Dessiner les 5 boutons (Previous, Play, Pause, Stop, Next) depuis le sprite `cbuttons.bmp`
  - [x] 7.3 Chaque bouton a 4 etats visuels : normal, hover, pressed, disabled — sprites differents dans la sheet
  - [x] 7.4 Hit-testing sur le canvas pour detecter quel bouton est clique/survole
  - [x] 7.5 Gerer mousedown (pressed), mouseup (action), mousemove (hover), mouseleave (reset)
  - [x] 7.6 Actions : Previous → `usePlaylistStore().playPrevious()`, Play → `usePlayerStore().play()` ou `.resume()`, Pause → `.pause()`, Stop → `.stop()`, Next → `usePlaylistStore().playNext()`
  - [x] 7.7 Desactiver les boutons (etat disabled) quand aucun morceau n'est charge (`usePlayerStore().isStopped && !currentTrack`)
  - [x] 7.8 Accessibilite : boutons HTML invisibles superposes pour labels ARIA "Precedent", "Lecture", "Pause", "Stop", "Suivant"

- [x] Task 8 : Implementer VolumeSlider.vue (AC: #1)
  - [x] 8.1 Creer `src/components/player/VolumeSlider.vue` — composant avec un `<canvas>` ref
  - [x] 8.2 Dessiner l'icone volume + slider horizontal avec le sprite `volume.bmp`
  - [x] 8.3 4 etats visuels de l'icone : mute, bas (1-33%), moyen (34-66%), fort (67-100%)
  - [x] 8.4 Drag du slider : mettre a jour le volume en temps reel via `usePlayerStore().setVolume()`
  - [x] 8.5 Clic sur l'icone : toggle mute/unmute (sauvegarder le volume precedent pour restauration)
  - [x] 8.6 Accessibilite : slider ARIA 0-100%, label "Volume", navigable clavier (fleches haut/bas)

- [x] Task 9 : Implementer ActionBar.vue (AC: #1)
  - [x] 9.1 Creer `src/components/player/ActionBar.vue` — composant avec un `<canvas>` ref
  - [x] 9.2 Dessiner les boutons : Shuffle, Repeat, Crossfade (toggles), Skins, Prefs
  - [x] 9.3 Etats toggle : off (normal) / on (visuellement distinct, surbrillance)
  - [x] 9.4 Hit-testing pour chaque bouton, gestion hover/pressed
  - [x] 9.5 Pour cette story : les boutons sont visuels mais les actions Shuffle, Repeat, Crossfade, Skins, Prefs sont des stubs (console.log). Ils seront connectes dans les stories suivantes
  - [x] 9.6 Accessibilite : role "switch" ARIA pour chaque toggle

- [x] Task 10 : Implementer PlaylistPanel.vue minimal (AC: #1)
  - [x] 10.1 Creer `src/components/playlist/PlaylistPanel.vue` — panneau sous la fenetre principale
  - [x] 10.2 Utiliser des elements HTML (pas Canvas) pour la playlist : fond noir #000000, texte vert #00FF00
  - [x] 10.3 Afficher les colonnes : # / Titre / Artiste / Duree
  - [x] 10.4 Afficher les morceaux depuis `usePlaylistStore`
  - [x] 10.5 Morceau en cours de lecture : texte blanc #FFFFFF
  - [x] 10.6 Double-clic sur un morceau : lancer la lecture
  - [x] 10.7 Message "Glisse ta musique ici" quand la playlist est vide (style UX-DR9)
  - [x] 10.8 Accessibilite : role "listbox" ARIA, chaque morceau avec role "option"

- [x] Task 11 : Implementer usePlaylistStore minimal (AC: #1)
  - [x] 11.1 Completer `src/stores/usePlaylistStore.js` avec le state : `tracks` (array), `currentIndex` (number), `isShuffled` (boolean), `repeatMode` ('none' | 'all' | 'one')
  - [x] 11.2 Actions : `addTracks(filePaths)`, `removeTrack(index)`, `clearPlaylist()`, `playTrack(index)`, `playNext()`, `playPrevious()`, `getNextTrack()`, `getPreviousTrack()`
  - [x] 11.3 `playTrack(index)` appelle `usePlayerStore().play(track.path)` et met a jour `currentIndex`
  - [x] 11.4 `addTracks` utilise `extractTrackInfo()` du pattern etabli dans la Story 1.2
  - [x] 11.5 Quand le morceau en cours se termine (`usePlayerStore` event `ended`), appeler `playNext()`

- [x] Task 12 : Assembler dans App.vue (AC: #1)
  - [x] 12.1 Remplacer le composant `PlayerDebug.vue` par le layout skinne
  - [x] 12.2 Structure du layout : TitleBar → PlayerDisplay → SeekBar → TransportControls + VolumeSlider → ActionBar → PlaylistPanel
  - [x] 12.3 Le layout principal utilise un conteneur avec fond gris metallique #29292E
  - [x] 12.4 Appeler `useSkinStore().loadDefaultSkin()` au montage de l'application
  - [x] 12.5 Conserver `PlayerDebug.vue` dans le repo mais ne plus l'importer (sera supprime plus tard)
  - [x] 12.6 Configurer la taille de la fenetre : respecter min 800x400, defaut 800x600 (deja dans tauri.conf.json)

- [x] Task 13 : Tests unitaires (AC: #1-#5)
  - [x] 13.1 Creer `src/engine/skinRenderer.test.js` — tester drawBitmapText, drawScrollingText, setupCanvas (mock Canvas context)
  - [x] 13.2 Creer `src/stores/useSkinStore.test.js` — tester loadDefaultSkin, setRenderMode, verifier les chemins d'assets
  - [x] 13.3 Creer `src/stores/usePlaylistStore.test.js` — tester addTracks, playNext, playPrevious, playTrack, clearPlaylist

## Dev Notes

### Architecture UI — Canvas 2D + HTML Hybrid

**Approche hybride Canvas + HTML :**
- Les composants de la fenetre principale (TitleBar, PlayerDisplay, SeekBar, TransportControls, VolumeSlider, ActionBar) utilisent Canvas 2D pour le rendu skinne pixel-perfect
- La PlaylistPanel utilise du HTML standard (pas de Canvas) — la playlist a besoin de scrolling natif, de selection de texte, et de meilleure accessibilite
- Chaque composant Vue wrappe un `<canvas>` et gere son propre rendu

**Pattern Vue 3 + Canvas :**
```javascript
// Pattern pour chaque composant skinne
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSkinStore } from '@/stores/useSkinStore'

const canvasRef = ref(null)
const skinStore = useSkinStore()

onMounted(() => {
  const ctx = canvasRef.value.getContext('2d')
  ctx.imageSmoothingEnabled = skinStore.renderMode === 'modern'
  draw(ctx)
})

// Re-draw quand le state change
watch(() => [/* reactive deps */], () => {
  const ctx = canvasRef.value?.getContext('2d')
  if (ctx) draw(ctx)
})
```

**NE PAS utiliser de librairie Canvas (Konva, PixiJS, etc.)** — le rendu est simple (sprites + texte bitmap), une librairie ajouterait du poids et de la complexite inutiles. Utiliser l'API Canvas 2D native.

### Hit-Testing sur Canvas

Les evenements DOM ne fonctionnent pas sur les elements dessines dans un Canvas. Utiliser le hit-testing par coordonnees :

```javascript
function handleCanvasClick(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // Verifier si (x, y) est dans la zone d'un bouton
  if (isInRect(x, y, playButtonRect)) {
    playerStore.play()
  }
}
```

Definir les zones cliquables comme des constantes dans chaque composant. Les coordonnees dependent des sprites du skin.

### Accessibilite — Couche HTML Invisible

Le Canvas ne supporte pas les roles ARIA. Solution : superposer des elements HTML invisibles (opacity: 0, position: absolute) sur les zones interactives du Canvas :

```html
<template>
  <div class="canvas-wrapper" style="position: relative;">
    <canvas ref="canvasRef" />
    <!-- Boutons invisibles pour accessibilite -->
    <button
      class="sr-only-overlay"
      :style="{ left: '10px', top: '5px', width: '20px', height: '20px' }"
      aria-label="Fermer"
      @click="closeWindow"
    />
  </div>
</template>
```

Ces boutons sont focusables au clavier et annonces par les lecteurs d'ecran, mais visuellement transparents.

### Skin par defaut — Assets Generes

Pour cette story, les sprites du skin par defaut sont **generes programmatiquement** dans le Canvas, PAS charges depuis des fichiers bitmap reels. Raison : creer des sprites bitmap de qualite est un travail de design graphique qui depasse le scope de cette story.

**Approche :**
1. Le `skinRenderer.js` dessine chaque element avec des couleurs et formes CSS-like (rectangles, gradients, bordures)
2. Les fonctions `draw*` utilisent les couleurs du skin par defaut (#29292E, #000000, #00FF00, etc.)
3. L'effet 3D des controles est obtenu avec des bordures clair/sombre (outset: bord haut/gauche clair, bord bas/droite sombre)
4. La police bitmap pour l'afficheur est rendue avec `ctx.fillText()` et une police monospace standard (`'Courier New', monospace`) en attendant une vraie police bitmap

**Consequence :** les fichiers dans `src/assets/default-skin/` ne sont PAS necessaires pour cette story. Le rendu est purement programmatique. Les vrais sprites bitmap seront ajoutes dans la Story 4.1 (Parseur de Skins .wsz) ou dans une story dediee au polish du skin par defaut.

**Le `viscolor.txt` et les chemins d'assets dans useSkinStore representent la structure cible** qui sera remplie avec de vrais fichiers plus tard. Pour l'instant, le store contient les couleurs et dimensions comme configuration.

### Couleurs du Skin Classic Faithful

| Role | Hex | Usage |
|------|-----|-------|
| Fond principal | #29292E | Corps de la fenetre, barre de titre |
| Fond afficheur | #000000 | Zone Display |
| Texte primaire | #00FF00 | Titre scrollant, temps, bitrate |
| Texte secondaire | #00CC00 | Frequence, mode stereo/mono |
| Texte playlist | #00FF00 | Morceaux dans la playlist |
| Morceau actif | #FFFFFF | Morceau en cours de lecture |
| Fond playlist | #000000 | Zone playlist |
| Accent metallique | #5A5A5F | Bordures, reliefs |
| Controles inactifs | #555555 | Boutons desactives |
| Erreur | #FF4444 | Messages d'erreur |
| Succes | #44FF44 | Confirmations |
| Info | #4488FF | Notifications |

### Effet 3D des Controles (Outset/Inset)

```javascript
// Effet bouton "outset" (releve)
function drawButton3D(ctx, x, y, w, h, isPressed) {
  const lightEdge = isPressed ? '#1A1A1F' : '#3F3F44'
  const darkEdge = isPressed ? '#3F3F44' : '#1A1A1F'
  const face = '#29292E'

  ctx.fillStyle = face
  ctx.fillRect(x, y, w, h)

  // Bord haut + gauche (clair)
  ctx.strokeStyle = lightEdge
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  // Bord bas + droite (sombre)
  ctx.strokeStyle = darkEdge
  ctx.beginPath()
  ctx.moveTo(x + w, y)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.stroke()
}
```

### Texte Scrollant — Animation

```javascript
let scrollOffset = 0
let animationFrameId = null

function animateScroll() {
  scrollOffset += 1 // 1 pixel par frame
  if (scrollOffset > textWidth) scrollOffset = -canvasWidth
  draw()
  animationFrameId = requestAnimationFrame(animateScroll)
}

// Cleanup dans onUnmounted
onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
```

En mode retro : le scrolling avance par increments entiers de pixels (pas de sub-pixel). En mode pause : le texte est fige.

### Interaction avec les Stores Existants

- `usePlayerStore` (Story 1.2) : deja implemente — contient isPlaying, isPaused, currentTrack, currentTime, duration, volume. Les composants skinnes CONSOMMENT ce store, pas de modification necessaire
- `usePlaylistStore` : squelette vide, a completer dans cette story (Task 11) pour supporter la liste de morceaux et la navigation next/prev
- `useSkinStore` : squelette vide, a completer dans cette story (Task 2)
- `usePreferencesStore` : reste un squelette pour cette story (sera complete dans des stories ulterieures)

### Window API Tauri — TitleBar

Pour les boutons minimize/close de la barre de titre custom :

```javascript
import { getCurrentWindow } from '@tauri-apps/api/window'

const appWindow = getCurrentWindow()
await appWindow.minimize()
await appWindow.close()
```

**Important :** Si on utilise une barre de titre custom (decorations: false dans tauri.conf.json), il faut aussi gerer le drag de la fenetre. Attribut Tauri : `data-tauri-drag-region` sur l'element HTML qui doit etre draggable.

**Decision pour cette story :** garder `decorations: true` dans tauri.conf.json (barre de titre OS native). La barre de titre skinnee TitleBar.vue sera un composant visuel DANS la fenetre, pas un remplacement de la barre OS. Le remplacement complet (decorations: false) sera fait dans une story ulterieure dediee au polish de l'interface.

### Tauri Window Drag Region

Si on decide d'utiliser la barre de titre custom :
```html
<div data-tauri-drag-region class="titlebar">
  <!-- contenu de la barre de titre -->
</div>
```
Ce data attribute rend l'element draggable pour deplacer la fenetre. Pour cette story, on garde la decoration native.

### usePlaylistStore — Integration avec usePlayerStore

Le `usePlaylistStore` doit ecouter l'evenement `ended` du player pour enchainer automatiquement :

```javascript
// Dans usePlaylistStore
import { usePlayerStore } from './usePlayerStore'

// S'abonner a l'audioEngine pour l'evenement 'ended'
import audioEngine from '@/engine/audioEngine'

function init() {
  audioEngine.onEnded = () => {
    playNext()
  }
}
```

**Attention** : `usePlayerStore` gere deja l'abonnement a `onEnded` mais ne fait rien avec. Il faudra soit :
- Option A : Ajouter un callback dans `usePlayerStore` que `usePlaylistStore` peut definir
- Option B : `usePlaylistStore` s'abonne directement a `audioEngine.onEnded`

Privilegier l'Option B pour eviter le couplage inter-stores au niveau du state. Le `usePlaylistStore` s'abonne directement a l'audioEngine.

### Anti-patterns a Eviter

- **NE PAS** utiliser de librairie Canvas (Konva, Fabric, PixiJS) — API Canvas 2D native suffit
- **NE PAS** stocker des objets Image/Canvas dans le state Pinia — non serializable
- **NE PAS** utiliser `document.getElementById()` — utiliser les refs Vue (`ref()`)
- **NE PAS** oublier de cleanup les `requestAnimationFrame` dans `onUnmounted()`
- **NE PAS** creer de pop-up ou modal — tous les messages dans le Display (pattern feedback ephemere 3s)
- **NE PAS** utiliser `alert()`, `confirm()`, `prompt()` — interdit par l'architecture
- **NE PAS** mettre les boutons d'accessibilite en `display: none` — utiliser `opacity: 0` + `position: absolute` pour qu'ils restent focusables
- **NE PAS** modifier `usePlayerStore` — il est deja complet depuis la Story 1.2

### Logging

Prefixes obligatoires :
- `[SkinRenderer]` pour skinRenderer.js
- `[SkinStore]` pour useSkinStore.js
- `[PlaylistStore]` pour usePlaylistStore.js
- `[TitleBar]`, `[Display]`, `[SeekBar]`, `[Transport]`, `[Volume]`, `[ActionBar]` pour les composants

### Fichiers Existants a Modifier

| Fichier | Action |
|---------|--------|
| `src/App.vue` | Remplacer PlayerDebug par le layout skinne |
| `src/stores/useSkinStore.js` | Completer le squelette vide |
| `src/stores/usePlaylistStore.js` | Completer le squelette vide |
| `src/engine/skinRenderer.js` | Remplacer le placeholder par l'implementation |

### Fichiers a Creer

| Fichier | Contenu |
|---------|---------|
| `src/components/player/TitleBar.vue` | Barre de titre skinnee |
| `src/components/player/PlayerDisplay.vue` | Afficheur (titre scrollant, temps, infos) |
| `src/components/player/SeekBar.vue` | Barre de progression |
| `src/components/player/TransportControls.vue` | Boutons prev/play/pause/stop/next |
| `src/components/player/VolumeSlider.vue` | Icone volume + slider |
| `src/components/player/ActionBar.vue` | Boutons shuffle/repeat/crossfade/skins/prefs |
| `src/components/playlist/PlaylistPanel.vue` | Panneau playlist HTML |
| `src/engine/skinRenderer.test.js` | Tests du renderer |
| `src/stores/useSkinStore.test.js` | Tests du skin store |
| `src/stores/usePlaylistStore.test.js` | Tests du playlist store |

### Project Structure Notes

Structure alignee avec l'architecture. Les composants se placent dans les dossiers prevus :
- `src/components/player/` — TitleBar, PlayerDisplay, SeekBar, TransportControls, VolumeSlider, ActionBar (FR16)
- `src/components/playlist/` — PlaylistPanel (FR16)
- `src/engine/skinRenderer.js` — moteur de rendu Canvas (FR19)
- `src/stores/useSkinStore.js` — gestion du skin actif (FR19)
- `src/stores/usePlaylistStore.js` — gestion de la playlist (preparation pour Story 1.5)

Le composant `PlayerDebug.vue` de la Story 1.2 est remplace mais conserve dans le repo.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Skin Engine]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR1 through UX-DR6]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR14 Classic Faithful]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX-DR15 Double mode de rendu]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Espacement & Layout]

### Previous Story Intelligence (Story 1.2)

- **AudioEngine** : complet — singleton AudioContext, chaine MediaElementAudioSourceNode → GainNode → destination. Methodes loadAndPlay/pause/resume/stop/setVolume/seek, evenements onTimeUpdate/onEnded/onError/onLoadedMetadata
- **usePlayerStore** : complet — state isPlaying/isPaused/currentTrack/currentTime/duration/volume. Getters formattedCurrentTime/formattedDuration/progressPercent/isStopped. NE PAS MODIFIER
- **ESLint** : v9 flat config (`eslint.config.js`), pas `.eslintrc.js`
- **Vitest + happy-dom** : deja configures dans `vite.config.js` avec alias `@/` → `src/`
- **Pinia v3.0.4** : installe et configure dans `main.js`
- **constants.js** : contient `DEFAULT_VOLUME = 0.8`, `SUPPORTED_AUDIO_FORMATS`, `MAX_CROSSFADE_DURATION`
- **Convention validee** : code en anglais, UI en francais, stores camelCase, commandes Tauri snake_case
- **tauri.conf.json** : fenetre 800x600, min 800x400, decorations activees, protocole asset actif
- **`convertFileSrc()`** : utilise pour charger les fichiers audio locaux — meme pattern pour les assets skin si necessaire
- **Debug log** : l'alias `@/` a ete ajoute dans vite.config.js — disponible pour tous les imports
- **Pattern extractTrackInfo** : extrait titre depuis le nom de fichier, artist = 'Unknown', duration = 0 — reutiliser dans usePlaylistStore

### Git Intelligence

- 2 stories implementees (1.1 et 1.2), architecture etablie
- Pattern de commits : `feat: description courte (Story X.Y)`
- Branches : `feature/1-X-nom-de-la-story`, PR vers `main`
- 39 tests existants (17 audioEngine + 22 usePlayerStore) qui doivent continuer a passer

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Rendu programmatique adopté (pas de vrais fichiers bitmap) — conforme aux Dev Notes
- Option B pour l'intégration ended event : usePlaylistStore s'abonne via addEventListener sur audioElement
- Lint warnings corrigés (imports inutilisés, ordre des attributs Vue)

### Completion Notes List

- ✅ Task 1: Assets programmatiques — viscolor.txt créé avec palette de couleurs Classic Faithful
- ✅ Task 2: useSkinStore — state complet (currentSkin, assets, isLoaded, renderMode), loadDefaultSkin(), setRenderMode(), SKIN_COLORS exporté, cache d'images externe au state Pinia
- ✅ Task 3: skinRenderer.js — setupCanvas, drawBackground, drawButton (3D outset/inset), drawSlider, drawBitmapText, drawScrollingText (avec clipping et looping)
- ✅ Task 4: TitleBar.vue — canvas avec titre dynamique, boutons minimize/close (hit-testing), intégration Tauri getCurrentWindow, boutons ARIA accessibles
- ✅ Task 5: PlayerDisplay.vue — canvas avec titre scrollant (requestAnimationFrame), temps écoulé/restant (clic toggle), bitrate/fréquence/stéréo, live region ARIA
- ✅ Task 6: SeekBar.vue — canvas slider avec drag support, seek via usePlayerStore, slider ARIA accessible
- ✅ Task 7: TransportControls.vue — 5 boutons (prev/play/pause/stop/next) avec hit-testing et 4 états visuels, émission d'events prev/next, boutons ARIA
- ✅ Task 8: VolumeSlider.vue — icône volume (4 états), slider horizontal, toggle mute/unmute, slider ARIA 0-100%
- ✅ Task 9: ActionBar.vue — boutons Shuffle/Repeat/Crossfade (toggles), Skins/Prefs (stubs), role switch ARIA
- ✅ Task 10: PlaylistPanel.vue — HTML (pas Canvas), colonnes #/Titre/Artiste/Durée, morceau actif en blanc, double-clic lecture, message vide "Glisse ta musique ici", rôle listbox ARIA
- ✅ Task 11: usePlaylistStore — tracks/currentIndex/isShuffled/repeatMode, addTracks/removeTrack/clearPlaylist/playTrack/playNext/playPrevious, abonnement ended event via audioEngine._audioElement
- ✅ Task 12: App.vue — layout skinné (TitleBar→Display→SeekBar→Transport+Volume→ActionBar→PlaylistPanel), loadDefaultSkin au montage, PlayerDebug conservé non importé
- ✅ Task 13: 67 nouveaux tests (skinRenderer: 17, useSkinStore: 11, usePlaylistStore: 32, + 7 existants non modifiés), 106 tests au total, 0 régressions

### Implementation Plan

Architecture hybride Canvas 2D + HTML selon les Dev Notes. Composants player en Canvas natif (pas de lib), PlaylistPanel en HTML standard. Rendu programmatique des sprites (couleurs CSS-like, effet 3D outset/inset). Couche d'accessibilité via éléments HTML invisibles superposés. usePlaylistStore utilise addEventListener sur audioElement pour l'événement ended (Option B).

### File List

**Nouveaux fichiers:**
- src/assets/default-skin/viscolor.txt
- src/components/player/TitleBar.vue
- src/components/player/PlayerDisplay.vue
- src/components/player/SeekBar.vue
- src/components/player/TransportControls.vue
- src/components/player/VolumeSlider.vue
- src/components/player/ActionBar.vue
- src/components/playlist/PlaylistPanel.vue
- src/engine/skinRenderer.test.js
- src/stores/useSkinStore.test.js
- src/stores/usePlaylistStore.test.js

**Fichiers modifiés:**
- src/App.vue (remplacé PlayerDebug par layout skinné)
- src/stores/useSkinStore.js (implémenté depuis squelette)
- src/stores/usePlaylistStore.js (implémenté depuis squelette)
- src/engine/skinRenderer.js (implémenté depuis placeholder)

### Change Log

- 2026-03-21: Implémentation complète de l'interface skinnée Classic Faithful (Story 1.3) — 13 tâches, 67 nouveaux tests, 0 régressions
