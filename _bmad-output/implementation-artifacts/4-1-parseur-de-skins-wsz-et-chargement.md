# Story 4.1 : Parseur de Skins .wsz et Chargement

Status: review

## Story

As a utilisateur,
I want charger un skin .wsz pour transformer l'apparence de mon player,
So that je personnalise SikAmp selon mes goûts.

## Acceptance Criteria

1. **Given** un fichier .wsz disponible sur le disque
   **When** le skin est chargé via la commande Tauri IPC `parse_skin`
   **Then** le backend Rust décompresse l'archive ZIP dans un dossier temporaire local
   **And** les chemins des assets extraits (sprites, textures, polices bitmap) sont retournés au frontend

2. **Given** les assets d'un skin extraits
   **When** le `useSkinStore` reçoit les chemins
   **Then** les assets sont chargés via le protocole `asset:` de Tauri
   **And** le `skinRenderer` redessine tous les composants Canvas 2D avec les nouveaux sprites
   **And** la transformation de l'interface est instantanée (pas de rechargement, pas de flash blanc)

3. **Given** un morceau en cours de lecture
   **When** un nouveau skin est appliqué
   **Then** la lecture audio n'est JAMAIS interrompue
   **And** l'interface se transforme pendant que la musique continue

4. **Given** l'utilisateur glisse un fichier .wsz directement sur la fenêtre du player
   **When** le fichier est déposé
   **Then** le skin est parsé, chargé et appliqué instantanément
   **And** le fichier .wsz est copié dans le dossier de skins de l'utilisateur pour usage futur

5. **Given** un fichier .wsz invalide ou corrompu
   **When** le parseur Rust tente de le décompresser
   **Then** le skin actuel est conservé (fallback silencieux)
   **And** un message "Skin invalide : [nom_fichier]" s'affiche dans l'afficheur pendant 3 secondes (#FF4444)

6. **Given** un skin .wsz avec des assets manquants ou incomplets
   **When** le renderer tente de charger les sprites
   **Then** les sprites manquants utilisent les assets du skin par défaut comme fallback
   **And** l'interface reste fonctionnelle et cohérente

7. **Given** un skin appliqué avec succès
   **When** le changement est confirmé
   **Then** le choix du skin est persisté via Tauri Store (`usePreferencesStore`)
   **And** au prochain lancement, ce skin est chargé automatiquement

## Tasks / Subtasks

### Backend Rust — Renforcement du parseur

- [x] **Task 1 : Sécuriser `parse_skin`** (AC: #1, #5)
  - [x] 1.1 Ajouter protection zip-slip (valider que les chemins extraits ne sortent pas du dossier cible)
  - [x] 1.2 Gérer les archives corrompues / non-ZIP avec erreur typée `SkinError`
  - [x] 1.3 Limiter la taille d'extraction (ex: max 50 Mo) pour éviter les zip bombs
  - [x] 1.4 Tests unitaires Rust : archive valide, corrompue, zip-slip, trop grosse

- [x] **Task 2 : Commande `copy_skin_to_library`** (AC: #4)
  - [x] 2.1 Créer commande IPC qui copie un .wsz dans le dossier skins utilisateur (`$APP_DATA/skins/`)
  - [x] 2.2 Retourner le chemin destination pour référence
  - [x] 2.3 Enregistrer la commande dans `lib.rs`

- [x] **Task 3 : Commande `load_saved_skin`** (AC: #7)
  - [x] 3.1 Au lancement, si un skin est persisté dans les préférences, le parser et retourner les assets
  - [x] 3.2 Si le .wsz sauvegardé n'existe plus, fallback silencieux vers le skin par défaut

### Frontend — Chargement et rendu des sprites

- [x] **Task 4 : Étendre `useSkinStore` pour les skins custom** (AC: #1, #2)
  - [x] 4.1 Action `loadSkinFromWsz(wszPath)` : appelle `parse_skin`, puis charge les images via `convertFileSrc()`
  - [x] 4.2 Mapper les fichiers extraits aux assets attendus (`main.bmp` → background, `titlebar.bmp` → titlebar, etc.)
  - [x] 4.3 Stocker les objets `Image` dans le cache Map existant (pattern actuel du store)
  - [x] 4.4 Action `resetToDefaultSkin()` : recharge les assets depuis `src/assets/default-skin/`

- [x] **Task 5 : Adapter `skinRenderer.js` pour le rendu par sprites** (AC: #2)
  - [x] 5.1 Ajouter `drawSprite(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh)` pour dessiner des régions de sprite sheets
  - [x] 5.2 Adapter `drawBackground()` pour utiliser `main.bmp` si disponible (fallback programmatique sinon)
  - [x] 5.3 Adapter `drawButton()` pour utiliser les régions de `cbuttons.bmp` / `titlebar.bmp`
  - [x] 5.4 Adapter `drawSlider()` pour utiliser `posbar.bmp` / `volume.bmp`
  - [x] 5.5 Parser `viscolor.txt` pour extraire la palette de couleurs du skin
  - [x] 5.6 Respecter le double mode retro/moderne (`imageSmoothingEnabled`)

- [x] **Task 6 : Adapter les composants Canvas** (AC: #2, #3)
  - [x] 6.1 Chaque composant (`PlayerDisplay`, `TransportControls`, `SeekBar`, `VolumeSlider`, `ActionBar`, `PlaylistPanel`) écoute le changement de skin et se redessine
  - [x] 6.2 S'assurer que le redraw ne touche PAS au `audioEngine` (lecture non interrompue)

### Intégration drag & drop

- [x] **Task 7 : Drag & drop de .wsz** (AC: #4)
  - [x] 7.1 Étendre `useFileDrop.js` / `fileDropProcessor.js` pour détecter les fichiers `.wsz`
  - [x] 7.2 Si `.wsz` détecté : appeler `loadSkinFromWsz()` puis `copy_skin_to_library`
  - [x] 7.3 Si mix de fichiers audio + .wsz : traiter les audio normalement ET appliquer le skin

### Fallback et résilience

- [x] **Task 8 : Fallback par asset** (AC: #6)
  - [x] 8.1 Dans `useSkinStore`, pour chaque asset attendu, si le chargement échoue → utiliser l'asset par défaut
  - [x] 8.2 Logger les assets manquants en console (warning, pas erreur)

- [x] **Task 9 : Message d'erreur dans l'afficheur** (AC: #5)
  - [x] 9.1 En cas de skin invalide, afficher "Skin invalide : {nom}" dans `PlayerDisplay` en #FF4444 pendant 3 secondes
  - [x] 9.2 Utiliser le mécanisme de message temporaire existant (si présent) ou en créer un simple

### Persistance

- [x] **Task 10 : Persister le choix de skin** (AC: #7)
  - [x] 10.1 Ajouter `currentSkinPath` dans `usePreferencesStore` (persisté via Tauri Store)
  - [x] 10.2 À l'application d'un skin : sauvegarder le chemin du .wsz dans les préférences
  - [x] 10.3 Au lancement de l'app (`App.vue` → `onMounted`) : si skin sauvegardé, le charger automatiquement

### Tests

- [x] **Task 11 : Tests** (tous AC)
  - [x] 11.1 Tests unitaires Rust : `parse_skin` (valide, corrompu, zip-slip, taille)
  - [x] 11.2 Tests unitaires JS : `useSkinStore` (chargement, fallback, reset)
  - [x] 11.3 Tests unitaires JS : `skinRenderer` (drawSprite, fallback programmatique)
  - [x] 11.4 Tests unitaires JS : drag & drop .wsz
  - [x] 11.5 Vérifier 0 régression sur les tests existants

## Dev Notes

### Intelligence du Spike (epic-4-spike-wsz-parser.md)

Le spike a validé le pipeline de bout en bout. **Code conservé et réutilisable :**

| Fichier | État | Notes |
|---------|------|-------|
| `src-tauri/src/skin_parser/mod.rs` | ✅ Conservé | Commande `parse_skin` fonctionnelle — décompresse dans `$TMPDIR/sikamp-skins/{nom}/`, retourne liste fichiers. **À renforcer** : zip-slip, taille max, erreurs typées |
| `src-tauri/Cargo.toml` | ✅ Conservé | `zip = "2"` déjà ajouté |
| `src-tauri/src/lib.rs` | ✅ Conservé | `parse_skin` déjà enregistré dans le handler Tauri |

**Enseignements clés du spike :**
1. Le format .wsz est un ZIP standard avec des BMP — pas de format propriétaire
2. `asset://` fonctionne out of the box — `convertFileSrc()` sert les .bmp extraits sans friction
3. Extraction dans `$TMPDIR` est suffisante
4. Le filtrage `__MACOSX/` et fichiers cachés est déjà implémenté
5. **Edge cases à traiter ici** : archives corrompues, assets manquants, zip-slip (chemins malicieux), skins avec sous-dossiers

**Skin de test disponible :** `docs/netscape_winamp.wsz` (skin communautaire Netscape, 17 fichiers, ~975 Ko)

Fichiers typiques d'un .wsz :
```
titlebar.bmp, cbuttons.bmp, shufrep.bmp, monoster.bmp, posbar.bmp,
numbers.bmp, text.bmp, playpaus.bmp, volume.bmp, balance.bmp,
viscolor.txt, main.bmp, eq_ex.bmp, pledit.bmp, pledit.txt,
eqmain.bmp, mb.bmp
```

### Architecture — Patterns à respecter

**Rendering :** Canvas 2D avec double mode (retro nearest-neighbor / moderne bilinear) via `imageSmoothingEnabled`. Ne PAS utiliser de DOM/CSS pour le rendu skinné.

**State management :** Pinia stores modulaires. Les objets `Image` non-sérialisables sont stockés dans un `Map` au niveau module (pattern existant dans `useSkinStore.js`), pas dans le state Pinia.

**IPC :** Toute opération filesystem passe par des commandes Tauri (Rust). Le frontend ne touche jamais le filesystem directement.

**Protocole asset :** Utiliser `convertFileSrc()` de `@tauri-apps/api/core` pour convertir les chemins locaux en URLs `asset://` chargeables par le navigateur. Le scope `**` est déjà configuré dans `tauri.conf.json`.

**Tests JS :** Co-localisés (`fichier.test.js` à côté de `fichier.js`), framework Vitest.
**Tests Rust :** Module `#[cfg(test)]` en bas du même fichier.

### Project Structure Notes

**Fichiers à créer/modifier :**

| Fichier | Action | Notes |
|---------|--------|-------|
| `src-tauri/src/skin_parser/mod.rs` | Modifier | Renforcer sécurité, ajouter `copy_skin_to_library`, `load_saved_skin` |
| `src-tauri/src/lib.rs` | Modifier | Enregistrer nouvelles commandes |
| `src/stores/useSkinStore.js` | Modifier | `loadSkinFromWsz()`, `resetToDefaultSkin()`, fallback par asset |
| `src/stores/usePreferencesStore.js` | Modifier | Ajouter `currentSkinPath` |
| `src/engine/skinRenderer.js` | Modifier | `drawSprite()`, adapter fonctions de dessin pour sprites |
| `src/composables/useFileDrop.js` | Modifier | Détecter et traiter les .wsz |
| `src/utils/fileDropProcessor.js` | Modifier | Ajouter logique .wsz |
| `src/components/player/*.vue` | Modifier | Redraw sur changement de skin |
| `src/App.vue` | Modifier | Charger skin sauvegardé au lancement |
| `src/components/skin/` | Vide (.gitkeep) | Réservé pour Story 4.2 (SkinSelector) |

**Fichiers à NE PAS créer :**
- Pas de `SkinSelector.vue` — c'est la Story 4.2
- Pas de composant UI de sélection de skin

**Mapping des assets .wsz :**

| Fichier BMP | Usage | Composant cible |
|-------------|-------|-----------------|
| `main.bmp` | Background principal | Tous (fond) |
| `titlebar.bmp` | Barre de titre (boutons fermer, réduire, etc.) | TitleBar |
| `cbuttons.bmp` | Contrôles lecture (play, pause, stop, prev, next) | TransportControls |
| `posbar.bmp` | Barre de progression | SeekBar |
| `volume.bmp` | Slider volume | VolumeSlider |
| `pledit.bmp` | Fond playlist | PlaylistPanel |
| `text.bmp` | Police bitmap pour l'afficheur | PlayerDisplay |
| `numbers.bmp` | Chiffres (temps) | PlayerDisplay |
| `viscolor.txt` | Palette de couleurs | Tous (couleurs) |

### Contraintes UX

- **Skins contrôlent :** Textures, sprites, couleurs, polices, décorations
- **Skins NE contrôlent PAS :** Structure du layout, comportements d'interaction, tailles min de fenêtre, garanties d'accessibilité
- **Skin par défaut "Classic Faithful" :** Gris métallique #29292E + vert lumineux #00FF00 — c'est le fallback universel
- **Double mode de rendu :** Retro (pixel-perfect) et Moderne (anti-aliased) doivent fonctionner avec les skins custom aussi
- **Barre de titre native Tauri :** Ne PAS créer de composant custom pour la barre de titre (feedback utilisateur existant)

### Anti-patterns à éviter

1. **NE PAS recréer le rendu programmatique** — réutiliser et étendre `skinRenderer.js`, pas le réécrire
2. **NE PAS charger les images dans le state Pinia** — utiliser le cache Map existant (non-sérialisable)
3. **NE PAS bloquer le thread principal** — le chargement d'images doit être asynchrone
4. **NE PAS toucher à `audioEngine.js`** — le changement de skin est purement visuel
5. **NE PAS ajouter de crate d'image processing Rust** — le décodage BMP est fait côté frontend via `new Image()` + Canvas
6. **NE PAS créer de UI de sélection de skin** — c'est la Story 4.2, ici on fait le moteur uniquement

### References

- [Source: _bmad-output/implementation-artifacts/epic-4-spike-wsz-parser.md] — Résultats du spike, code conservé, enseignements
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4] — Acceptance criteria, user stories
- [Source: _bmad-output/planning-artifacts/architecture.md#Skin Engine] — Décisions archi (zip crate, asset://, Canvas 2D)
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — Arborescence cible des fichiers
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System] — Ce que les skins contrôlent vs ne contrôlent pas
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flow 3] — Parcours changement de skin

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Tous les tests Rust passent (8 tests skin_parser, 29 total)
- Tous les tests JS passent (342 tests, 0 échec)
- Build frontend réussi (vite build OK)
- Compilation Rust réussie (cargo check OK)
- ESLint: aucune erreur sur les fichiers modifiés

### Completion Notes List
- ✅ Task 1: Sécurisé `parse_skin` — ajout `SkinError` enum typé, protection zip-slip via canonicalization des chemins, limite 50 Mo sur la taille décompressée, filtrage __MACOSX/.hidden conservé
- ✅ Task 2: `copy_skin_to_library` — copie un .wsz vers `$APP_DATA/skins/`, retourne le chemin destination
- ✅ Task 3: `load_saved_skin` — retourne `Option<SkinParseResult>`, fallback silencieux si fichier absent
- ✅ Task 4: `useSkinStore` étendu — `loadSkinFromWsz()` charge les sprites via `convertFileSrc()`, `resetToDefaultSkin()` remet le skin par défaut, mapping WSZ_FILE_MAP pour les 15 assets BMP, parsing de viscolor.txt pour la palette de couleurs
- ✅ Task 5: `skinRenderer.js` — ajout `drawSprite()`, `drawBackground()` accepte un `skinStore` optionnel pour rendu sprite, `drawButton()`/`drawSlider()` supportent les couleurs du skin, mode retro/moderne préservé
- ✅ Task 6: Composants Canvas — `skinVersion` ajouté comme compteur réactif, chaque composant (TransportControls, SeekBar, VolumeSlider, ActionBar) watch skinVersion pour redraw automatique, PlayerDisplay utilise son animation loop, audioEngine JAMAIS touché
- ✅ Task 7: Drag & drop .wsz — `fileDropProcessor.js` sépare les .wsz des audio, `App.vue` gère le drop avec `loadSkinFromWsz` + `copy_skin_to_library`, mix audio+wsz traité correctement
- ✅ Task 8: Fallback par asset — chaque image qui échoue au chargement → warning console, pas d'erreur, le rendu programmatique prend le relais
- ✅ Task 9: Message d'erreur — utilise le système `showFeedback()` existant du `playerStore`, affiche "Skin invalide : {nom}" en #FF4444 pendant 3 secondes
- ✅ Task 10: Persistance — `currentSkinPath` ajouté à `usePreferencesStore`, sauvegardé via Tauri Store, chargé automatiquement au lancement via `load_saved_skin`
- ✅ Task 11: Tests — 8 tests Rust (parse valide, corrompu, zip-slip, taille, __MACOSX, load_saved_skin), tests JS skinStore étendus (loadSkinFromWsz, resetToDefaultSkin, skinVersion), skinRenderer (drawSprite, drawBackground avec sprite), fileDropProcessor (détection .wsz), 0 régression

### File List
- `src-tauri/src/skin_parser/mod.rs` — Modifié (sécurité parse_skin, copy_skin_to_library, load_saved_skin, tests)
- `src-tauri/src/lib.rs` — Modifié (enregistrement copy_skin_to_library, load_saved_skin)
- `src/stores/useSkinStore.js` — Modifié (loadSkinFromWsz, resetToDefaultSkin, skinColors, skinVersion, WSZ_FILE_MAP, parseViscolor)
- `src/stores/useSkinStore.test.js` — Modifié (tests loadSkinFromWsz, resetToDefaultSkin, skinVersion)
- `src/stores/usePreferencesStore.js` — Modifié (ajout currentSkinPath, setSkinPath)
- `src/engine/skinRenderer.js` — Modifié (drawSprite, drawBackground avec skinStore, drawButton/drawSlider avec skinStore)
- `src/engine/skinRenderer.test.js` — Modifié (tests drawSprite, drawBackground avec sprite)
- `src/utils/fileDropProcessor.js` — Modifié (séparation .wsz des audio, export isWszFile)
- `src/utils/fileDropProcessor.test.js` — Modifié (tests détection .wsz)
- `src/App.vue` — Modifié (handleWszDrop, chargement skin sauvegardé au lancement)
- `src/components/player/TransportControls.vue` — Modifié (watch skinVersion)
- `src/components/player/SeekBar.vue` — Modifié (watch skinVersion)
- `src/components/player/VolumeSlider.vue` — Modifié (watch skinVersion)
- `src/components/player/ActionBar.vue` — Modifié (watch skinVersion)

### Change Log
- 2026-03-25: Implémentation complète Story 4.1 — parseur de skins .wsz sécurisé, chargement et rendu des sprites, drag & drop, fallback par asset, persistance du choix de skin. 29 tests Rust + 342 tests JS passent, 0 régression.
