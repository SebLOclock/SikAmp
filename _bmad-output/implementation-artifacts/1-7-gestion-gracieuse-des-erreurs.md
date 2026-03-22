# Story 1.7 : Gestion Gracieuse des Erreurs

Status: review

## Story

As a utilisateur,
I want que le player gère les erreurs sans jamais planter ni interrompre ma musique,
So that j'aie confiance dans la stabilité du player.

## Contexte Business

La gestion d'erreurs est le filet de sécurité du produit. Le PRD la qualifie de "résilience silencieuse" — le player ne crash JAMAIS. Le user journey de Marina (edge case) repose entièrement sur cette story : elle glisse 200 fichiers dont des .wma, et le player les skip gracieusement sans interruption.

- **FR22** : Le système affiche un message clair lorsqu'un format audio non supporté est rencontré
- **FR23** : Le système saute automatiquement les fichiers non supportés sans interrompre la lecture
- **FR24** : Le système maintient la stabilité de la playlist même en cas d'erreurs multiples

## Acceptance Criteria

1. **Given** une playlist contenant un fichier au format non supporté (ex: .wma, .aac)
   **When** le player tente de lire ce fichier
   **Then** le fichier est sauté automatiquement sans interruption de lecture
   **And** un message "Format non supporté : [nom_fichier]" s'affiche dans l'afficheur (Display) pendant 3 secondes en couleur erreur (#FF4444)
   **And** l'affichage normal du titre reprend après 3 secondes

2. **Given** une playlist contenant un fichier corrompu
   **When** le player tente de lire ce fichier
   **Then** le fichier est sauté automatiquement
   **And** un message "Impossible de lire : [nom_fichier]" s'affiche pendant 3 secondes

3. **Given** une playlist contenant un fichier qui a été déplacé ou supprimé
   **When** le player tente de lire ce fichier
   **Then** le fichier est sauté automatiquement
   **And** un message "Fichier introuvable : [nom_fichier]" s'affiche pendant 3 secondes

4. **Given** plusieurs erreurs consécutives (ex: 5 fichiers non supportés d'affilée)
   **When** les erreurs se produisent en rafale
   **Then** seul le dernier message d'erreur est affiché (pas d'empilement)
   **And** la playlist reste stable et navigable

5. **Given** TOUS les fichiers restants de la playlist sont en erreur
   **When** le player a épuisé les fichiers valides
   **Then** la lecture s'arrête proprement
   **And** le dernier message d'erreur reste affiché
   **And** les contrôles restent actifs (l'utilisateur peut agir)

6. **Given** un message d'erreur affiché
   **When** l'utilisateur interagit avec le player (clic, raccourci)
   **Then** l'interaction est traitée normalement — le message ne bloque JAMAIS l'interaction

## Tasks / Subtasks

- [x] Task 1 : Créer le système de feedback messages dans le PlayerDisplay (AC: #1, #2, #3, #6)
  - [x] Ajouter un état réactif `feedbackMessage` (texte + couleur + timer) dans `PlayerDisplay.vue`
  - [x] Quand un `feedbackMessage` est actif, l'afficher en remplacement du titre scrollant (zone de texte du haut)
  - [x] Couleur erreur : `#FF4444` (constante dans `constants.js`)
  - [x] Le message disparaît après 3 secondes (timer auto-clear)
  - [x] Si un nouveau message arrive pendant l'affichage, remplacer l'ancien (pas d'empilement — AC #4)
  - [x] Ajouter une live region ARIA pour annoncer les messages d'erreur aux lecteurs d'écran
  - [x] Le canvas continue d'afficher le temps et les infos normalement — seule la zone titre est remplacée

- [x] Task 2 : Ajouter la détection de format non supporté dans le playlistStore (AC: #1)
  - [x] Créer une fonction `isSupportedFormat(filePath)` dans `src/utils/formatValidator.js`
  - [x] Utiliser `SUPPORTED_AUDIO_FORMATS` de `constants.js` pour la validation
  - [x] **ATTENTION** : `constants.js` contient actuellement `aac` et `m4a` dans `SUPPORTED_AUDIO_FORMATS` — les RETIRER car le PRD spécifie "formats libres uniquement : MP3, FLAC, WAV, OGG" (pas de AAC/M4A qui nécessitent des licences)
  - [x] Avant d'appeler `playerStore.play()`, vérifier le format du fichier
  - [x] Si format non supporté : émettre un événement d'erreur et appeler `playNext()` automatiquement

- [x] Task 3 : Gérer les erreurs audio (fichier corrompu / introuvable) dans le playerStore (AC: #2, #3)
  - [x] Dans le callback `audioEngine.onError`, distinguer le type d'erreur :
    - `MEDIA_ERR_SRC_NOT_SUPPORTED` ou erreur de décodage → "Impossible de lire : [fichier]"
    - Erreur réseau / fichier introuvable → "Fichier introuvable : [fichier]"
  - [x] Émettre un événement d'erreur avec le message approprié
  - [x] Déclencher automatiquement `playlistStore.playNext()` après une erreur
  - [x] **CRITIQUE** : Ajouter une protection anti-boucle infinie — si N erreurs consécutives = tous les fichiers restants, arrêter (AC #5)

- [x] Task 4 : Créer le mécanisme d'événement d'erreur inter-stores (AC: #1, #2, #3, #4)
  - [x] Utiliser une approche réactive : ajouter `feedbackMessage` et `showFeedback(message, type)` dans `usePlayerStore`
  - [x] Le `PlayerDisplay.vue` observe `playerStore.feedbackMessage` et l'affiche
  - [x] Types de messages : `error` (#FF4444), `success` (#44FF44), `info` (#4488FF)
  - [x] Le store gère le timer de 3 secondes et le clear automatique
  - [x] **Pattern inter-stores** : `playlistStore` et `playerStore` appellent `playerStore.showFeedback()` quand une erreur survient

- [x] Task 5 : Gérer l'arrêt propre quand tous les fichiers sont en erreur (AC: #5)
  - [x] Tracker le nombre d'erreurs consécutives dans `playlistStore`
  - [x] Si `consecutiveErrors >= tracks.length` (ou si on a parcouru toute la playlist sans succès), arrêter la lecture proprement
  - [x] Le dernier message d'erreur reste affiché (pas de clear automatique dans ce cas)
  - [x] Les contrôles restent actifs — `playerStore.isStopped` redevient `true`
  - [x] Réinitialiser le compteur d'erreurs consécutives dès qu'un fichier joue avec succès

- [x] Task 6 : Tests (AC: #1-#6)
  - [x] Test unitaire : `formatValidator.test.js` — formats supportés/non supportés
  - [x] Test unitaire : `usePlayerStore` — `showFeedback()` affiche le message, timer auto-clear 3s, remplacement d'un message par un autre
  - [x] Test intégration : skip automatique d'un fichier non supporté → message affiché → lecture du suivant
  - [x] Test intégration : fichier corrompu → message approprié → skip
  - [x] Test intégration : tous les fichiers en erreur → arrêt propre, dernier message visible
  - [x] Test intégration : erreurs en rafale → seul le dernier message affiché

## Dev Notes

### Gestion des Erreurs — État Actuel du Code

L'audioEngine et les stores ont déjà des try-catch et des callbacks `onError`, mais :
- **Aucun message n'est affiché à l'utilisateur** — tout est uniquement en `console.error()`
- **Aucun skip automatique** — quand `onError` est déclenché dans `playerStore`, il reset juste `isPlaying`/`isPaused` mais n'appelle pas `playNext()`
- **Aucune validation de format** avant la tentative de lecture
- **Pas de composant FeedbackMessage** — le Display ne gère aucun message de feedback

### Architecture des Messages — Dans le Display, PAS un Composant Séparé

Selon la spec UX : "Les messages d'erreur sont affichés dans l'afficheur existant (pas de pop-up, pas de modal)". Le `FeedbackMessage` n'est PAS un composant Vue séparé — c'est un état du `PlayerDisplay.vue` qui remplace temporairement le titre scrollant.

Concrètement dans `PlayerDisplay.vue` :
- La zone titre (ligne 84-93 du draw) affiche normalement le `scrollingTitle`
- Quand un feedback est actif, on affiche le message en couleur sémantique à la place du titre scrollant
- Le reste du display (temps, bitrate, info) continue normalement

### audioEngine.onError — Distinguer les Types d'Erreur

L'`<audio>` element expose `error.code` via `MediaError` :
- `MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4) : format non supporté ou fichier corrompu
- `MediaError.MEDIA_ERR_NETWORK` (code 2) : fichier introuvable / erreur réseau
- `MediaError.MEDIA_ERR_DECODE` (code 3) : erreur de décodage
- `MediaError.MEDIA_ERR_ABORTED` (code 1) : lecture annulée (ignorable)

Pour le message utilisateur :
- Code 4 ou 3 → "Impossible de lire : [fichier]"
- Code 2 → "Fichier introuvable : [fichier]"
- Code 1 → ignorer silencieusement

### Protection Anti-Boucle Infinie — CRITIQUE

Si on a 50 fichiers dont 50 sont corrompus, le `playNext()` récursif va boucler indéfiniment. Solution :
- Compteur `_consecutiveErrors` dans `playlistStore` (reset à 0 quand un fichier joue avec succès)
- Si `_consecutiveErrors >= tracks.length`, on arrête la lecture (on a parcouru toute la playlist sans succès)
- Le callback `onEnded` de l'audioEngine (lecture réussie terminée) reset le compteur

### Validation de Format — PRE-CHECK avant loadAndPlay

Deux couches de protection :
1. **PRE-CHECK** (dans `playlistStore.playTrack()`) : vérifier l'extension du fichier AVANT de tenter la lecture. Si format non supporté → message + skip immédiat. Plus rapide et plus fiable que d'attendre l'erreur audio.
2. **POST-ERROR** (dans `audioEngine.onError`) : attraper les erreurs runtime (fichier corrompu, introuvable) et skip.

### SUPPORTED_AUDIO_FORMATS — Correction Nécessaire

`constants.js` contient actuellement `['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']`. Le PRD et la spec domaine disent explicitement : "V1 : formats libres uniquement — MP3, FLAC, WAV, OGG". Il faut **retirer `aac` et `m4a`** de cette liste.

### Messages d'Erreur en Français

Selon les conventions : code en anglais, UI en français. Les messages affichés :
- `"Format non supporté : [nom_fichier]"`
- `"Impossible de lire : [nom_fichier]"`
- `"Fichier introuvable : [nom_fichier]"`

Utiliser le nom du fichier (pas le chemin complet) pour la lisibilité.

### playlistStore._subscribeToEnded — Attention au Timing

Actuellement, `_subscribeToEnded()` attache un listener `ended` directement sur `audioEngine._audioElement`. Ce listener appelle `playNext()`. Problème : le callback `onError` de l'audioEngine ne déclenche PAS `ended` — il faut donc ajouter le skip automatique AUSSI dans le flux d'erreur, pas uniquement dans `ended`.

### Séquence d'Événements pour un Skip d'Erreur

```
playTrack(index)
  → isSupportedFormat(track.path) ?
    → NON : showFeedback("Format non supporté: fichier.wma", "error") + playNext()
    → OUI : playerStore.play(track.path)
      → audioEngine.loadAndPlay(filePath)
        → <audio> error event
          → audioEngine.onError callback
            → playerStore: showFeedback("Impossible de lire: fichier.mp3", "error")
            → playlistStore.playNext()
```

### Couleurs Sémantiques — Constantes

Ajouter dans `constants.js` :
```javascript
export const FEEDBACK_COLORS = {
  error: '#FF4444',
  success: '#44FF44',
  info: '#4488FF'
}
export const FEEDBACK_DURATION = 3000 // ms
```

### Fichiers Existants à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/player/PlayerDisplay.vue` | Afficher les feedbackMessage à la place du titre scrollant |
| `src/stores/usePlayerStore.js` | Ajouter `feedbackMessage`, `showFeedback()`, timer |
| `src/stores/usePlaylistStore.js` | Ajouter validation format dans `playTrack()`, skip auto, compteur erreurs |
| `src/engine/audioEngine.js` | Aucune modification — le callback `onError` est déjà en place |
| `src/utils/constants.js` | Retirer `aac`/`m4a`, ajouter `FEEDBACK_COLORS`, `FEEDBACK_DURATION` |

### Nouveaux Fichiers à Créer

| Fichier | Rôle |
|---------|------|
| `src/utils/formatValidator.js` | `isSupportedFormat(filePath)` — validation d'extension |
| `src/utils/formatValidator.test.js` | Tests unitaires validation de format |

### Dépendances Déjà Installées (aucun nouveau package)

- `vue` ^3.5.13 — computed/ref/watch pour le feedback réactif
- `pinia` ^3.0.4 — state management pour le feedbackMessage
- `vitest` — tests co-localisés

### Intelligence de la Story 1.6

Patterns confirmés à réutiliser :
- Composable pattern avec state réactif + exposition de callbacks
- Fallback silencieux pour les erreurs — jamais `alert()`
- Logging avec préfixe module : `[PlayerStore]`, `[PlaylistStore]`, `[FormatValidator]`
- Tests Vitest co-localisés
- ARIA labels et live regions pour l'accessibilité
- Le PreferencesPanel existe maintenant dans `src/components/shared/PreferencesPanel.vue`
- `usePreferencesStore` utilise un pattern `_debouncedSave()` partagé

### Git Intelligence

Patterns des derniers commits :
- Commits en anglais, messages concis avec préfixe `feat:` / `fix:`
- Fichiers modifiés groupés par story
- Tests ajoutés systématiquement
- Conventions JS/Vue respectées (camelCase fichiers JS, PascalCase composants Vue)

### Project Structure Notes

- Tous les fichiers s'inscrivent dans la structure existante : `src/stores/`, `src/utils/`, `src/components/player/`
- Pas de nouveau dossier à créer
- Tests co-localisés avec le code source
- Pas de fichier Rust nécessaire — tout côté frontend JS

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.7]
- [Source: _bmad-output/planning-artifacts/prd.md — FR22, FR23, FR24, Section Gestion des Erreurs]
- [Source: _bmad-output/planning-artifacts/architecture.md — Process Patterns: Gestion d'erreurs, Anti-patterns interdits]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Flow 2: Gestion des Erreurs, FeedbackMessage spec, Feedback et États, Gestion d'Erreurs]
- [Source: _bmad-output/implementation-artifacts/1-6-jingle-au-lancement.md — Conventions, Patterns, File List]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1 : `PlayerDisplay.vue` affiche maintenant les `feedbackMessage` en remplacement du titre scrollant. Couleur sémantique, auto-clear 3s, live region ARIA. Le temps/bitrate/info continue de s'afficher normalement.
- Task 2 : `formatValidator.js` créé avec `isSupportedFormat()` et `extractFileName()`. `SUPPORTED_AUDIO_FORMATS` corrigé : `aac` et `m4a` retirés (PRD V1 = formats libres uniquement). 10 tests unitaires.
- Task 3 : `audioEngine.onError` dans `usePlayerStore` distingue les codes d'erreur MediaError (code 2 = introuvable, code 3/4 = impossible de lire, code 1 = ignoré). Auto-skip via dynamic import de `usePlaylistStore._handlePlaybackError()`.
- Task 4 : `showFeedback(text, type, persistent)` et `clearFeedback()` ajoutés à `usePlayerStore`. Timer auto-clear 3s, remplacement de message (pas d'empilement). `FEEDBACK_COLORS` et `FEEDBACK_DURATION` dans `constants.js`.
- Task 5 : `_consecutiveErrors` tracker dans `usePlaylistStore`. `_handlePlaybackError()` incrémente et arrête si `>= tracks.length`. Reset à 0 sur lecture réussie et sur `clearPlaylist()`. Mode persistent pour le dernier message d'erreur.
- Task 6 : 10 tests unitaires (formatValidator) + 18 tests d'intégration (errorHandling.integration.test.js) couvrant les 6 AC. 199 tests totaux passent (0 régression).
- Régression : 199 tests passent (181 existants + 18 nouveaux = 199)

### Change Log

- 2026-03-22 : Implémentation complète de la story 1.7 — gestion gracieuse des erreurs avec feedback visuel, skip automatique, protection anti-boucle infinie

### File List

**Nouveaux fichiers :**
- `src/utils/formatValidator.js` — Validation de format audio + extraction de nom de fichier
- `src/utils/formatValidator.test.js` — Tests unitaires formatValidator (10 tests)
- `src/stores/errorHandling.integration.test.js` — Tests d'intégration gestion d'erreurs (18 tests)

**Fichiers modifiés :**
- `src/utils/constants.js` — Retrait aac/m4a de SUPPORTED_AUDIO_FORMATS, ajout FEEDBACK_COLORS et FEEDBACK_DURATION
- `src/stores/usePlayerStore.js` — Ajout feedbackMessage state, showFeedback(), clearFeedback(), onError enrichi avec messages français et auto-skip
- `src/stores/usePlaylistStore.js` — Ajout _consecutiveErrors, _handlePlaybackError(), format pre-check dans playTrack(), playTrack devenu async
- `src/components/player/PlayerDisplay.vue` — Affichage des feedbackMessage en remplacement du titre scrollant, ariaAnnouncement pour les lecteurs d'écran
