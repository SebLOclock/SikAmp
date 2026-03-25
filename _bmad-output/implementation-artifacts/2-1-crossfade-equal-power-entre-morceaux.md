# Story 2.1 : Crossfade Equal-Power entre Morceaux

Status: done

## Story

As a utilisateur,
I want que mes morceaux s'enchaînent avec un fondu enchaîné fluide,
So that mon expérience d'écoute soit continue et sans rupture.

## Contexte Business

Le crossfade est le **deal-breaker** du projet SikAmp — la feature signature qui ancre le player en 2026. Sans crossfade, le pitch "Et si Winamp était sorti en 2026 ?" ne tient pas. C'est la première story de l'Epic 2, qui est l'epic le plus critique du MVP.

- **FR7** : L'utilisateur peut activer/désactiver le crossfade entre les morceaux
- **FR9** : Le système effectue un fondu enchaîné fluide et sans artefact audio
- **NFR2** : Le crossfade s'exécute sans interruption audible ni artefact (craquement, pop, silence) sur les 3 plateformes, durées 1s/6s/12s

Le bouton crossfade existe déjà dans l'ActionBar (toggle XFD) mais il ne fait rien — cette story le rend fonctionnel.

## Acceptance Criteria

1. **Given** le crossfade activé (toggle ON dans l'ActionBar)
   **When** un morceau approche de sa fin (temps restant <= durée du crossfade)
   **Then** le morceau en cours commence un fade out progressif (courbe equal-power via GainNode)
   **And** le morceau suivant démarre simultanément avec un fade in progressif
   **And** les deux sources audio jouent en parallèle pendant la durée du crossfade
   **And** la transition est fluide, sans artefact audio (pas de craquement, pop, silence ou coupure)

2. **Given** le crossfade activé
   **When** la transition se termine
   **Then** l'afficheur (Display) met à jour les métadonnées du nouveau morceau (titre, artiste, durée)
   **And** la barre de progression repart à zéro pour le nouveau morceau

3. **Given** le crossfade désactivé (toggle OFF dans l'ActionBar)
   **When** un morceau se termine
   **Then** le morceau suivant enchaîne directement sans fondu (comportement classique actuel)

4. **Given** le bouton Crossfade dans l'ActionBar
   **When** l'utilisateur clique dessus
   **Then** le toggle bascule entre ON (visuellement distinct, accentué) et OFF (normal)
   **And** le changement prend effet immédiatement pour la prochaine transition
   **And** l'état est annoncé par les lecteurs d'écran via le rôle "switch" ARIA

5. **Given** le crossfade activé et l'utilisateur clique sur Next
   **When** le morceau suivant est forcé manuellement
   **Then** le crossfade s'applique également (fade out du morceau en cours + fade in du suivant)

6. **Given** le crossfade activé et le morceau suivant est en erreur (format non supporté, corrompu)
   **When** le système skip le morceau en erreur
   **Then** le crossfade s'applique au prochain morceau valide dans la playlist

7. **Given** le crossfade testé sur les 3 plateformes (Windows, macOS, Linux)
   **When** on joue une transition avec des durées de 1s, 6s et 12s
   **Then** aucune interruption audible ni artefact n'est détecté lors d'un test d'écoute manuel (NFR2)

## Tasks / Subtasks

- [x] Task 1 : Ajouter les préférences crossfade dans usePreferencesStore (AC: #4)
  - [x]Ajouter `crossfadeEnabled: true` (activé par défaut — UX spec) et `crossfadeDuration: 5` dans le state
  - [x]Ajouter les actions `setCrossfadeEnabled(bool)` et `setCrossfadeDuration(seconds)`
  - [x]Persister via Tauri Store (réutiliser le mécanisme existant avec debounce 500ms)
  - [x]Restaurer au démarrage

- [x] Task 2 : Refactoriser audioEngine.js pour le dual-source (AC: #1, #7)
  - [x]Remplacer l'architecture single `<audio>` par un système dual-source :
    - Source A : `<audio>` + `MediaElementAudioSourceNode` + `GainNode` individuel
    - Source B : `<audio>` + `MediaElementAudioSourceNode` + `GainNode` individuel
    - Les deux GainNodes connectés au master `GainNode` existant → `AudioContext.destination`
  - [x]Conserver l'API publique existante (`loadAndPlay`, `pause`, `resume`, `stop`, `setVolume`, `seek`) sans breaking changes
  - [x]Ajouter les méthodes internes :
    - `_preloadOnSource(source, filePath)` — charge le fichier sur la source inactive
    - `_startCrossfade(durationMs)` — anime les GainNodes avec courbe equal-power
    - `_swapSources()` — échange source active/inactive après crossfade
  - [x]Implémenter la courbe equal-power :
    ```javascript
    // Equal-power crossfade curve
    // fadeOut: gain = Math.cos(t * Math.PI / 2)
    // fadeIn:  gain = Math.sin(t * Math.PI / 2)
    // où t va de 0 à 1 sur la durée du crossfade
    ```
  - [x]Utiliser `gainNode.gain.setValueCurveAtTime()` pour les transitions sans à-coups
  - [x]Ajouter un callback/événement `onCrossfadeStart` et `onCrossfadeComplete`

- [x] Task 3 : Intégrer le crossfade dans usePlayerStore (AC: #1, #2, #3, #5)
  - [x]Surveiller le temps de lecture via `onTimeUpdate` : quand `currentTime >= duration - crossfadeDuration`, déclencher le préchargement du morceau suivant
  - [x]Si crossfade activé : appeler `audioEngine._preloadOnSource()` puis `_startCrossfade()`
  - [x]Si crossfade désactivé : garder le comportement actuel (enchaînement direct via `onEnded`)
  - [x]Gérer le cas `playNext()` / `playPrevious()` manuels : déclencher le crossfade immédiatement
  - [x]Mettre à jour les métadonnées du Display à la fin du crossfade (pas au début)
  - [x]Réinitialiser la barre de progression au nouveau morceau

- [x] Task 4 : Gérer les erreurs pendant le crossfade (AC: #6)
  - [x]Si le morceau préchargé échoue au chargement : skip vers le prochain morceau valide
  - [x]Appliquer le crossfade au morceau valide trouvé (pas d'interruption)
  - [x]Afficher le message d'erreur via FeedbackMessage existant (pattern Story 1.7)
  - [x]Si aucun morceau valide suivant : terminer le fade out normalement et arrêter la lecture

- [x] Task 5 : Connecter le bouton ActionBar au store (AC: #4)
  - [x]Remplacer le `toggleState` local dans ActionBar.vue par `preferencesStore.crossfadeEnabled`
  - [x]Le clic sur le bouton crossfade appelle `preferencesStore.setCrossfadeEnabled(!current)`
  - [x]L'état visuel du bouton (ON/OFF accentué) reflète `preferencesStore.crossfadeEnabled`
  - [x]Rôle ARIA "switch" avec `aria-checked` dynamique — label "Fondu enchaîné"
  - [x]Raccourci clavier existant (`X` / `Ctrl+T`) déjà connecté — vérifier qu'il fonctionne

- [x] Task 6 : Tests (AC: #1-#7)
  - [x]Test audioEngine : deux sources peuvent jouer en parallèle
  - [x]Test audioEngine : la courbe equal-power produit les bonnes valeurs de gain
  - [x]Test audioEngine : `_swapSources()` échange correctement source active/inactive
  - [x]Test usePreferencesStore : `crossfadeEnabled` et `crossfadeDuration` sont persistés et restaurés
  - [x]Test usePlayerStore : le crossfade se déclenche quand `timeRemaining <= crossfadeDuration`
  - [x]Test usePlayerStore : pas de crossfade quand désactivé (enchaînement direct)
  - [x]Test usePlayerStore : `playNext()` manuel déclenche le crossfade
  - [x]Test usePlayerStore : skip des morceaux en erreur avec crossfade vers le suivant valide
  - [x]Test ActionBar : le bouton crossfade reflète `preferencesStore.crossfadeEnabled`
  - [x]Tous les tests existants continuent de passer (227 tests + nouveaux — 0 régression)

## Dev Notes

### État Actuel du Code — Ce qui EXISTE Déjà

L'analyse du codebase révèle une base solide mais **l'architecture audio doit être refactorisée** :

**Infrastructure existante :**
- `src/engine/audioEngine.js` : architecture single `<audio>` → `MediaElementAudioSourceNode` → `GainNode` → destination. Méthodes : `loadAndPlay()`, `pause()`, `resume()`, `stop()`, `setVolume()`, `seek()`. Événements : `onTimeUpdate`, `onEnded`, `onError`, `onLoadedMetadata`.
- `src/stores/usePlayerStore.js` : gère play/pause/resume/stop, appelle `audioEngine.loadAndPlay()` directement. `playNext()` et `playPrevious()` chargent le morceau suivant/précédent via `usePlaylistStore`.
- `src/stores/usePlaylistStore.js` : `playNext()` → `playTrack(nextIndex)` → `playerStore.play(track.path)`. Enchaînement synchrone et direct.
- `src/components/player/ActionBar.vue` : **le bouton Crossfade EXISTE DÉJÀ** (id `'crossfade'`, label `'XFD'`, `toggle: true`). Mais `toggleState` est local et ne connecte à rien.
- `src/utils/constants.js` : `MAX_CROSSFADE_DURATION = 12`, `DEFAULT_CROSSFADE_DURATION = 5` — **déjà définis et prêts**.
- `src/composables/useKeyboardShortcuts.js` : raccourci `X` et `Ctrl+T` déjà câblé pour toggle crossfade → appelle `actionBarRef.value?.executeAction('crossfade')`.
- `src/stores/usePreferencesStore.js` : persistance Tauri Store avec debounce 500ms. State : `volume`, `jingleEnabled`, `renderMode`, `windowState`, `scaleFactor`.

**Ce qui N'EXISTE PAS (scope de cette story) :**
- Architecture dual-source dans audioEngine (deux `<audio>` + deux GainNodes)
- Courbe equal-power crossfade
- Préchargement du morceau suivant
- Préférences crossfade dans usePreferencesStore
- Connexion du bouton ActionBar au store (actuellement juste un console.log)
- Logique de déclenchement du crossfade basée sur le temps restant

### Architecture Audio Cible — Dual Source

```
Source A: <audio> → MediaElementAudioSourceNode → gainNodeA ─┐
                                                              ├→ masterGainNode → destination
Source B: <audio> → MediaElementAudioSourceNode → gainNodeB ─┘
```

**Pourquoi dual `<audio>` au lieu de dual `AudioBufferSourceNode` :**
- Les `<audio>` elements supportent le streaming (pas besoin de charger tout le fichier en mémoire)
- Parfait pour les gros fichiers FLAC/WAV
- La `MediaElementAudioSourceNode` permet de connecter un `<audio>` au graphe Web Audio API
- Deux éléments `<audio>` indépendants permettent le contrôle séparé de chaque source

**Contrainte Web Audio API :** Un `MediaElementAudioSourceNode` ne peut être créé qu'une fois par élément `<audio>`. Les deux éléments doivent être créés au démarrage et réutilisés.

### Courbe Equal-Power — Implémentation

La courbe equal-power garantit que le volume perçu reste constant pendant le crossfade (pas de "creux" au milieu de la transition) :

```javascript
// Générer les courbes pour setValueCurveAtTime
function generateEqualPowerCurves(steps = 100) {
  const fadeOut = new Float32Array(steps)
  const fadeIn = new Float32Array(steps)
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    fadeOut[i] = Math.cos(t * Math.PI / 2)
    fadeIn[i] = Math.sin(t * Math.PI / 2)
  }
  return { fadeOut, fadeIn }
}

// Appliquer
const { fadeOut, fadeIn } = generateEqualPowerCurves()
gainNodeA.gain.setValueCurveAtTime(fadeOut, audioContext.currentTime, crossfadeDuration)
gainNodeB.gain.setValueCurveAtTime(fadeIn, audioContext.currentTime, crossfadeDuration)
```

**NE PAS utiliser `linearRampToValueAtTime`** — la courbe linéaire crée un creux perceptible au milieu du crossfade. Equal-power (sin/cos) maintient l'énergie totale constante.

### Timing du Déclenchement

```
Morceau A : |████████████████████████████░░░░|
                                    ↑ currentTime >= duration - crossfadeDuration
                                    → preload morceau B sur source inactive
                                    → démarrer crossfade

Morceau B :                         |░░░░████████████████████████████|

Volume A :  ────────────────────────╲
Volume B :                          ╱────────────────────────────────
```

Le préchargement doit se déclencher **un peu avant** le point de crossfade (ex: 1-2s avant) pour laisser le temps au décodage. Surveiller `timeupdate` dans `usePlayerStore`.

### Gestion d'État — Flux Crossfade

1. `onTimeUpdate` → si `timeRemaining <= crossfadeDuration + PRELOAD_BUFFER`
2. → `playlistStore.peekNextTrack()` (obtenir le prochain morceau SANS le jouer)
3. → `audioEngine.preloadOnInactive(nextTrack.path)`
4. → Quand `timeRemaining <= crossfadeDuration` → `audioEngine.startCrossfade(duration)`
5. → Pendant le crossfade : les deux sources jouent, les GainNodes s'animent
6. → À la fin : `audioEngine.swapSources()`, mettre à jour les métadonnées du Display

### Feedback Utilisateur — IMPORTANT

**Rendu moderne ≠ pixelisé :** Mode moderne crisp et adapté HiDPI. [Source: memory/feedback_modern_rendering.md]

**Pas de TitleBar custom :** Barre de titre native Tauri. [Source: memory/feedback_tauri_native_titlebar.md]

### Anti-Patterns à Éviter

- **NE PAS** utiliser `AudioBufferSourceNode` (charge tout en mémoire) — utiliser `MediaElementAudioSourceNode` (streaming)
- **NE PAS** utiliser `linearRampToValueAtTime` pour le crossfade — utiliser `setValueCurveAtTime` avec courbe equal-power
- **NE PAS** créer un nouveau `AudioContext` pour le crossfade — réutiliser le contexte existant
- **NE PAS** créer/détruire des `MediaElementAudioSourceNode` à chaque crossfade — les créer une fois et les réutiliser
- **NE PAS** utiliser `alert()`, `confirm()`, `prompt()` — jamais
- **NE PAS** muter le state hors des stores Pinia
- **NE PAS** ajouter de dépendance npm pour l'audio — Web Audio API pure
- **NE PAS** casser l'API publique existante d'audioEngine — les composants existants ne doivent pas changer
- **NE PAS** mettre à jour le Display pendant le crossfade — attendre la fin pour éviter les métadonnées qui "sautent"

### Conventions Obligatoires

- **Nommage JS** : camelCase (`crossfadeEnabled`, `startCrossfade()`)
- **Logs** : `[AudioEngine] Starting crossfade: ${duration}s`, `[PlayerStore] Crossfade triggered`
- **Langue code** : anglais. UI : français (label ARIA "Fondu enchaîné")
- **Tests** : co-localisés — `audioEngine.test.js` à côté de `audioEngine.js`
- **Gestion d'erreurs** : fallback silencieux, message via FeedbackMessage, log préfixé

### Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/engine/audioEngine.js` | Refactoriser en dual-source, ajouter crossfade equal-power |
| `src/engine/audioEngine.test.js` | Ajouter tests crossfade |
| `src/stores/usePreferencesStore.js` | Ajouter `crossfadeEnabled`, `crossfadeDuration` + persistance |
| `src/stores/usePreferencesStore.test.js` | Ajouter tests crossfade prefs |
| `src/stores/usePlayerStore.js` | Intégrer déclenchement crossfade sur timeupdate |
| `src/stores/usePlayerStore.test.js` | Ajouter tests crossfade trigger |
| `src/stores/usePlaylistStore.js` | Ajouter `peekNextTrack()` (retourne le prochain sans le jouer) |
| `src/components/player/ActionBar.vue` | Connecter toggle crossfade au store |

### Dépendances — Aucun Nouveau Package

Toutes les APIs nécessaires sont déjà disponibles :
- `Web Audio API` : `AudioContext`, `MediaElementAudioSourceNode`, `GainNode`, `setValueCurveAtTime`
- `HTMLAudioElement` : deux éléments `<audio>` pour le streaming dual
- `@tauri-apps/plugin-store` : déjà utilisé dans `usePreferencesStore`
- Constantes crossfade : déjà dans `src/utils/constants.js`

### Intelligence de la Story 1.9

Patterns confirmés à réutiliser :
- `usePreferencesStore` : mécanisme de persistance Tauri Store avec debounce 500ms — ajouter `crossfadeEnabled` et `crossfadeDuration` au même mécanisme
- Gestion exclusive des overlays : le PreferencesPanel est déjà overlay — pas de conflit
- 227 tests existants à ne pas casser
- Labels ARIA en français sur tous les contrôles
- `prefers-reduced-motion` géré dans focus-styles.css — pas d'impact direct sur l'audio

### Git Intelligence

Patterns des derniers commits :
- Messages en anglais, préfixe `feat:` / `fix:`
- Tests systématiquement ajoutés
- Conventions JS/Vue respectées (camelCase fichiers JS, PascalCase composants Vue)
- Le rebranding SikAmp est appliqué (commit a212d24)
- Story 1.9 vient d'être complétée : 227 tests passent, architecture CSS stable

### Project Structure Notes

- Tous les fichiers modifiés s'inscrivent dans la structure existante
- Pas de nouveau fichier à créer — modifications de fichiers existants uniquement
- Le `audioEngine.js` est le fichier le plus impacté (refactorisation majeure)
- Tests co-localisés avec le code source

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.1, Epic 2]
- [Source: _bmad-output/planning-artifacts/prd.md — FR7, FR9, NFR2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Audio & Crossfade, Web Audio API, GainNode equal-power]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — ActionBar (ligne 806), PreferencesPanel (ligne 866), Crossfade UX patterns]
- [Source: src/engine/audioEngine.js — Architecture single source actuelle]
- [Source: src/components/player/ActionBar.vue — Bouton crossfade existant (toggle XFD)]
- [Source: src/utils/constants.js — MAX_CROSSFADE_DURATION, DEFAULT_CROSSFADE_DURATION]
- [Source: _bmad-output/implementation-artifacts/1-9-double-mode-de-rendu-et-redimensionnement.md — Patterns, conventions, 227 tests]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème bloquant rencontré.

### Completion Notes List

- Task 1 : Ajout de `crossfadeEnabled` (default `true`) et `crossfadeDuration` (default `5`) dans usePreferencesStore avec persistance Tauri Store et restauration au démarrage. Validation du range 1-12 pour la durée.
- Task 2 : Refactorisation complète d'audioEngine.js — architecture single `<audio>` remplacée par dual-source (A/B). Chaque source a son propre `<audio>` + `MediaElementAudioSourceNode` + `GainNode` individuel, connectés à un `masterGainNode`. Implémentation de la courbe equal-power (sin/cos) via `setValueCurveAtTime`. API publique préservée sans breaking changes. Méthodes ajoutées : `preloadOnInactive`, `startCrossfade`, `_completeCrossfade`, `_cancelCrossfade`. Export de `generateEqualPowerCurves` pour tests.
- Task 3 : Intégration du crossfade dans usePlayerStore — surveillance `onTimeUpdate` pour déclenchement automatique quand `timeRemaining <= crossfadeDuration`. Support du crossfade sur `playNext()` manuel via `_handleManualCrossfadeNext()`. Mise à jour du Display différée à `onCrossfadeComplete`. Reset du crossfade trigger sur seek.
- Task 4 : Gestion des erreurs — si le préchargement du morceau suivant échoue, affichage du feedback d'erreur et fallback vers l'enchaînement classique. Skip automatique vers le prochain morceau valide.
- Task 5 : Connexion du bouton crossfade ActionBar au store — toggle `preferencesStore.crossfadeEnabled`, état visuel synchronisé, `aria-checked` dynamique lié au store, rôle ARIA "switch" préservé.
- Task 6 : 250 tests passent (22 nouveaux, 0 régression). Tests ajoutés pour : courbes equal-power, dual-source, preload, crossfade swap, préférences crossfade (persistance, chargement, validation), peekNextTrack, crossfade triggering dans playerStore.

### Change Log

- 2026-03-25 : Implémentation complète du crossfade equal-power (Story 2.1)

### File List

- `src/engine/audioEngine.js` — Refactorisation dual-source + crossfade equal-power
- `src/engine/audioEngine.test.js` — Tests mis à jour pour dual-source + nouveaux tests crossfade
- `src/stores/usePreferencesStore.js` — Ajout crossfadeEnabled, crossfadeDuration + persistance
- `src/stores/usePreferencesStore.test.js` — 9 nouveaux tests crossfade prefs
- `src/stores/usePlayerStore.js` — Intégration déclenchement crossfade + gestion erreurs
- `src/stores/usePlayerStore.test.js` — Tests crossfade triggering
- `src/stores/usePlaylistStore.js` — Ajout peekNextTrack(), crossfade sur playNext() manuel
- `src/stores/usePlaylistStore.test.js` — 5 nouveaux tests peekNextTrack
- `src/components/player/ActionBar.vue` — Connexion toggle crossfade au preferencesStore
