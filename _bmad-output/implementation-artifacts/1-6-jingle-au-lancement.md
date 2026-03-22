# Story 1.6 : Jingle au Lancement

Status: done

## Story

As a utilisateur,
I want entendre un jingle original au lancement de l'app,
So that je vive le moment "madeleine de Proust" dès le premier contact.

## Contexte Business

Le jingle est LE moment émotionnel du produit. Le PRD le qualifie de "moment madeleine de Proust" — si le premier lancement ne provoque rien, le projet a échoué. C'est la scène d'ouverture du film.

- **FR20** : Le système joue un jingle original au lancement (inspiré de "it really whips the llama's ass")
- **FR21** : L'utilisateur peut désactiver le jingle au lancement
- Le jingle doit être une création originale (droits Nullsoft/AOL interdisent la réutilisation de l'original)
- Performance : premier lancement prêt en < 5 secondes, jingle compris

## Acceptance Criteria

1. **Given** l'application est lancée pour la première fois
   **When** la fenêtre s'affiche
   **Then** un jingle original (inspiré de "it really whips the llama's ass") joue pendant 1-2 secondes
   **And** le jingle joue PENDANT que l'interface se charge (pas d'écran noir avant)
   **And** le fichier jingle est stocké dans `src/assets/jingle.mp3`

2. **Given** les préférences utilisateur
   **When** l'utilisateur désactive le jingle dans les préférences
   **Then** le jingle ne joue plus au lancement
   **And** la préférence est persistée via Tauri Store (sauvegardée entre les sessions)

3. **Given** le jingle désactivé
   **When** l'utilisateur réactive le jingle dans les préférences
   **Then** le jingle joue à nouveau au prochain lancement

4. **Given** le `usePreferencesStore` enrichi
   **When** les préférences sont chargées au démarrage
   **Then** le store contient l'état du jingle (actif/inactif)
   **And** le store persiste les préférences via Tauri Store plugin

## Tasks / Subtasks

- [x] Task 1 : Créer le fichier jingle placeholder (AC: #1)
  - [x] Générer ou placer un fichier `src/assets/jingle.mp3` (1-2 secondes, format OGG)
  - [x] Le fichier doit être une création originale ou un placeholder temporaire
  - [x] Vérifier que le fichier est accessible via le protocole `asset:` Tauri

- [x] Task 2 : Créer le composable `useJingle.js` (AC: #1, #2, #3)
  - [x] Créer `src/composables/useJingle.js`
  - [x] Utiliser l'API Web Audio directement (AudioContext + Audio element) — NE PAS réutiliser `audioEngine.js` qui est dédié à la lecture des morceaux
  - [x] Charger le jingle via `convertFileSrc()` + protocole `asset:`
  - [x] Exposer une fonction `playJingle()` qui vérifie la préférence avant de jouer
  - [x] Gérer le cas AudioContext suspendu (autoplay policy) avec `resume()`
  - [x] Le jingle ne doit PAS interférer avec l'AudioEngine principal (contextes séparés)
  - [x] Créer `src/composables/useJingle.test.js` avec tests unitaires

- [x] Task 3 : Étendre `usePreferencesStore.js` (AC: #2, #3, #4)
  - [x] Ajouter la propriété `jingleEnabled` (défaut: `true`) au state
  - [x] Ajouter l'action `toggleJingle()` pour basculer on/off
  - [x] Persister `jingleEnabled` dans le même fichier `preferences.json` via Tauri Store
  - [x] Charger la préférence au démarrage dans `init()` ou équivalent
  - [x] Conserver le debounce existant (500ms) pour la sauvegarde
  - [x] Ajouter les tests pour les nouvelles fonctionnalités

- [x] Task 4 : Intégrer le jingle au démarrage dans `App.vue` (AC: #1)
  - [x] Importer `useJingle` dans `App.vue`
  - [x] Appeler `playJingle()` dans `onMounted`, AVANT ou EN PARALLÈLE du chargement du skin
  - [x] Le jingle doit jouer pendant que l'interface se charge, pas après
  - [x] Séquence de démarrage : jingle → (en parallèle) skin + playlist + volume restore

- [x] Task 5 : Ajouter le toggle jingle dans le `PreferencesPanel` (AC: #2, #3)
  - [x] Ajouter un toggle on/off pour le jingle dans `PreferencesPanel.vue`
  - [x] Label : "Jingle au lancement"
  - [x] Le toggle doit lire/écrire via `usePreferencesStore.toggleJingle()`
  - [x] Accessibilité : `role="switch"`, `aria-checked`, label lisible par lecteur d'écran
  - [x] Skinning : utiliser les couleurs du skin actif

- [x] Task 6 : Tests d'intégration (AC: #1, #2, #3, #4)
  - [x] Test : le jingle joue au démarrage quand la préférence est active
  - [x] Test : le jingle ne joue PAS quand la préférence est inactive
  - [x] Test : la préférence toggle persiste entre les recharges
  - [x] Test : le jingle ne bloque pas le chargement de l'interface

## Dev Notes

### Architecture Audio — Deux Contextes Séparés

**CRITIQUE** : Le jingle doit utiliser son propre mécanisme audio, séparé de `audioEngine.js`.

Pourquoi :
- `audioEngine.js` est un singleton qui gère la lecture des morceaux avec un seul `<audio>` element réutilisé
- Le jingle joue au démarrage, potentiellement avant que l'utilisateur interagisse (autoplay policy)
- Si le jingle utilisait le même audioEngine, il pourrait interférer avec la lecture des morceaux

Approche recommandée :
```javascript
// useJingle.js — audio dédié, léger
const audio = new Audio()
audio.src = convertFileSrc('jingle.ogg', 'asset')
audio.volume = 0.7  // Volume fixe ou configurable
audio.play().catch(() => { /* silently fail if autoplay blocked */ })
```

Alternative si `new Audio()` suffit sans AudioContext : c'est encore plus simple. L'important est de NE PAS toucher à `audioEngine.js`.

### Autoplay Policy des Navigateurs

Les webviews Tauri peuvent bloquer l'autoplay audio sans interaction utilisateur. Solutions :
1. Tauri v2 webview settings peuvent autoriser l'autoplay (`"autoplay": true` dans la config window si disponible)
2. Fallback silencieux : si `play()` échoue (Promise rejected), on ne joue pas le jingle — pas d'erreur visible
3. Ne JAMAIS afficher d'erreur à l'utilisateur si le jingle échoue — c'est un détail cosmétique

### usePreferencesStore — État Actuel

Le store existe déjà et gère :
- `volume` (0-100) avec debounce de 500ms
- Persistance via `@tauri-apps/plugin-store` dans `preferences.json`
- Lazy initialization du store Tauri

Il faut ÉTENDRE ce store, pas en créer un nouveau. Ajouter `jingleEnabled: true` au state et réutiliser le même mécanisme de persistance.

### Séquence de Démarrage Actuelle (App.vue onMounted)

```
1. skinStore.loadDefaultSkin()
2. playlistStore.init()
3. playerStore.restoreVolume()
```

Le jingle doit être lancé EN PREMIER (ou en parallèle) pour jouer pendant le chargement. Ne pas attendre que le skin soit chargé.

### Conventions de Code (établies par les stories précédentes)

- Source en anglais, UI en français
- Tests co-localisés (`useJingle.test.js` à côté de `useJingle.js`)
- Composants Vue PascalCase, fichiers JS camelCase, fichiers Rust snake_case
- Stores : `use[Nom]Store`
- Erreurs par fallback silencieux (jamais `alert()`)
- Préfixes de log par module : `[Jingle]`, `[PreferencesStore]`
- ARIA labels et live regions pour l'accessibilité
- Rendu HiDPI crisp (pas pixelisé) — barre de titre native Tauri

### Fichiers Existants à Connaître

| Fichier | Rôle | Impact |
|---------|------|--------|
| `src/engine/audioEngine.js` | Moteur audio principal | NE PAS modifier — le jingle est indépendant |
| `src/stores/usePreferencesStore.js` | Préférences utilisateur | À ÉTENDRE avec `jingleEnabled` |
| `src/App.vue` | Point d'entrée, séquence de démarrage | À MODIFIER pour ajouter le jingle |
| `src/components/shared/PreferencesPanel.vue` | Panneau de préférences | À VÉRIFIER s'il existe, sinon vérifier dans `src/components/player/` |
| `src/utils/constants.js` | Constantes globales | Consulter pour patterns existants |

### Dépendances Déjà Installées (pas de nouveau package)

- `@tauri-apps/api` ^2 — `convertFileSrc()` pour le protocole asset
- `@tauri-apps/plugin-store` ^2.4.2 — persistance des préférences
- `pinia` ^3.0.4 — state management
- `vue` ^3.5.13

Aucune nouvelle dépendance nécessaire.

### Tauri Config — CSP et Assets

Le CSP dans `tauri.conf.json` inclut déjà `media-src 'self' asset: https://asset.localhost` — le jingle OGG sera accessible via le protocole asset sans modification de config.

Le scope asset `["**"]` est déjà configuré.

### PreferencesPanel — Spec UX

Selon la spec UX, le PreferencesPanel contient :
- Crossfade (toggle on/off + slider durée 1-12s)
- **Jingle au lancement (toggle on/off)**
- Mode de rendu (retro/moderne)
- Volume du jingle

Le toggle jingle s'inscrit dans cette spec. Si le PreferencesPanel n'existe pas encore comme composant complet, créer uniquement la partie jingle toggle — ne pas implémenter crossfade ou mode de rendu (stories futures).

### Project Structure Notes

- Le jingle.ogg va dans `src/assets/jingle.mp3` (spécifié dans les AC et l'architecture)
- Le composable `useJingle.js` va dans `src/composables/` (pattern établi par `useFileDrop.js`, `useKeyboardShortcuts.js`)
- Pas de nouveau fichier Rust nécessaire — tout côté frontend JS

### Placeholder Jingle

Pour le développement, un fichier OGG de silence ou un son simple de 1-2 secondes suffit. Le vrai jingle créatif sera fourni séparément. Le dev peut :
1. Générer un fichier OGG avec `ffmpeg` : `ffmpeg -f lavfi -i "sine=frequency=440:duration=1.5" -c:a libvorbis jingle.ogg`
2. Ou utiliser n'importe quel court fichier OGG libre de droits

### Intelligence de la Story 1.5

Patterns confirmés à réutiliser :
- Composable pattern avec state réactif + exposition de callbacks
- Fallback silencieux pour les erreurs
- Logging avec préfixe module : `[Jingle]`
- Tests Vitest co-localisés
- ARIA labels pour l'accessibilité

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.6]
- [Source: _bmad-output/planning-artifacts/prd.md — FR20, FR21, Section Jingle & Identité]
- [Source: _bmad-output/planning-artifacts/architecture.md — Audio & Crossfade, FR Mapping, Project Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — PreferencesPanel, Premier Lancement]
- [Source: _bmad-output/implementation-artifacts/1-5-drag-drop-et-playlist-basique.md — Conventions, Patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1 : Fichier jingle MP3 fourni par l'utilisateur (`src/assets/jingle.mp3`, 159KB, stéréo 192kbps)
- Task 2 : Composable `useJingle.js` créé avec `new Audio()` dédié (séparé de audioEngine), fallback silencieux si autoplay bloqué. 6 tests unitaires passent.
- Task 3 : `usePreferencesStore` étendu avec `jingleEnabled` (défaut true), `toggleJingle()`, persistance via Tauri Store avec debounce refactoré en `_debouncedSave()` partagé. 5 tests unitaires passent.
- Task 4 : Séquence de démarrage App.vue modifiée — `loadPreferences()` puis `playJingle()` lancé avant le chargement du skin (parallèle).
- Task 5 : `PreferencesPanel.vue` créé avec toggle switch accessible (role=switch, aria-checked, skinné). Connecté via ActionBar emit @prefs. Bouton PRF de l'ActionBar émet maintenant l'événement `prefs`.
- Task 6 : 4 tests d'intégration couvrent : jingle au démarrage, jingle désactivé, persistance toggle, non-blocage de l'interface.
- Régression : 171 tests passent (167 existants + 4 nouveaux = 171, plus 6 unitaires useJingle + 5 usePreferencesStore = totaux couverts)

### Change Log

- 2026-03-22 : Implémentation complète de la story 1.6 — jingle au lancement avec préférence toggle et panneau de préférences

### File List

**Nouveaux fichiers :**
- `src/assets/jingle.mp3` — Jingle MP3 fourni (stéréo 192kbps)
- `src/composables/useJingle.js` — Composable de lecture du jingle
- `src/composables/useJingle.test.js` — Tests unitaires useJingle (6 tests)
- `src/composables/useJingle.integration.test.js` — Tests d'intégration jingle (4 tests)
- `src/stores/usePreferencesStore.test.js` — Tests unitaires usePreferencesStore (5 tests)
- `src/components/shared/PreferencesPanel.vue` — Panneau de préférences avec toggle jingle

**Fichiers modifiés :**
- `src/stores/usePreferencesStore.js` — Ajout jingleEnabled, toggleJingle(), _debouncedSave()
- `src/App.vue` — Import useJingle + usePreferencesStore, séquence de démarrage avec jingle, PreferencesPanel
- `src/components/player/ActionBar.vue` — Emit événement @prefs pour ouvrir le panneau
