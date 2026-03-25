# Story 4.2 : Sélecteur de Skins et Retour au Défaut

Status: review

## Story

As a utilisateur,
I want parcourir mes skins disponibles et revenir au skin par défaut,
So that je puisse explorer et choisir l'apparence qui me plaît.

## Acceptance Criteria

1. **Given** l'utilisateur clique sur le bouton "SKN" dans l'ActionBar
   **When** le panneau SkinSelector s'ouvre
   **Then** il apparaît en overlay au-dessus du player (style du skin actif)
   **And** il affiche la liste des skins disponibles
   **And** le skin par défaut "Classic Faithful" est en tête de liste
   **And** le skin actif est en surbrillance

2. **Given** le panneau SkinSelector ouvert
   **When** l'utilisateur clique sur un skin dans la liste
   **Then** le skin est appliqué instantanément (preview en temps réel)
   **And** le panneau SkinSelector lui-même change d'apparence avec le nouveau skin

3. **Given** le panneau SkinSelector ouvert
   **When** l'utilisateur clique sur "Classic Faithful" (skin par défaut)
   **Then** l'interface revient instantanément à l'apparence par défaut (FR18)

4. **Given** le panneau SkinSelector ouvert
   **When** l'utilisateur clique en dehors du panneau, re-clique sur le bouton Skins, ou appuie sur Escape
   **Then** le panneau se ferme
   **And** le dernier skin appliqué est conservé

5. **Given** le dossier de skins de l'utilisateur
   **When** le SkinSelector s'ouvre
   **Then** la liste est peuplée via la commande Tauri IPC `list_skins`
   **And** les skins sont affichés avec leur nom

6. **Given** le SkinSelector ouvert
   **When** l'utilisateur navigue au clavier
   **Then** Tab donne le focus à la liste, flèches haut/bas parcourent les skins
   **And** Entrée applique le skin sélectionné
   **And** le rôle ARIA "listbox" est exposé avec chaque skin en rôle "option"
   **And** le skin sélectionné est annoncé par les lecteurs d'écran

7. **Given** le PreferencesPanel est déjà ouvert
   **When** l'utilisateur clique sur le bouton Skins
   **Then** le PreferencesPanel se ferme et le SkinSelector s'ouvre (un seul panneau à la fois)

## Tasks / Subtasks

### Backend Rust — Commande `list_skins`

- [x]**Task 1 : Commande IPC `list_skins`** (AC: #5)
  - [x]1.1 Créer la commande `list_skins` dans `src-tauri/src/skin_parser/mod.rs` qui énumère les fichiers `.wsz` dans `app_data_dir/skins/`
  - [x]1.2 Retourner un `Vec<SkinInfo>` avec `{ name: String, path: String }` (nom = nom du fichier sans extension)
  - [x]1.3 Gérer le cas où le dossier `skins/` n'existe pas encore (retourner une liste vide, pas d'erreur)
  - [x]1.4 Enregistrer la commande dans `src-tauri/src/lib.rs`
  - [x]1.5 Tests unitaires Rust : dossier vide, dossier avec .wsz, dossier inexistant, fichiers non-.wsz ignorés

### Frontend — Composant SkinSelector

- [x]**Task 2 : Créer `SkinSelector.vue`** (AC: #1, #2, #3, #4, #5)
  - [x]2.1 Créer `src/components/skin/SkinSelector.vue` en suivant le pattern de `PreferencesPanel.vue` (overlay + panel + header + body)
  - [x]2.2 Utiliser `skinStore.colors.*` pour le theming dynamique (le panneau s'adapte au skin actif)
  - [x]2.3 En-tête avec titre "Skins" et bouton fermer (×)
  - [x]2.4 Corps : liste scrollable des skins disponibles
  - [x]2.5 Entrée "Classic Faithful" toujours en tête de liste (hardcodée, pas issue de `list_skins`)
  - [x]2.6 Le skin actuellement actif est visuellement mis en surbrillance (couleur `skinStore.colors.activeTitlebar` ou équivalent)
  - [x]2.7 Clic sur un skin → appelle `skinStore.loadSkinFromWsz(path)` puis `preferencesStore.setSkinPath(path)` pour persister
  - [x]2.8 Clic sur "Classic Faithful" → appelle `skinStore.resetToDefaultSkin()` puis `preferencesStore.setSkinPath(null)`
  - [x]2.9 Fermeture : clic overlay, Escape, ou re-clic bouton SKN
  - [x]2.10 Transition conditionnelle (mode moderne uniquement, comme PreferencesPanel)

- [x]**Task 3 : Chargement de la liste des skins** (AC: #5)
  - [x]3.1 Au `onMounted` (ou à l'ouverture du panneau via watch sur une prop `visible`), appeler `invoke('list_skins')` pour récupérer la liste
  - [x]3.2 Stocker la liste dans un `ref` local au composant
  - [x]3.3 Afficher un état de chargement bref si nécessaire (pas de spinner — le chargement devrait être quasi instantané)
  - [x]3.4 Rafraîchir la liste à chaque ouverture du panneau (un nouveau .wsz peut avoir été drag & droppé entre-temps)

### Intégration dans App.vue et ActionBar

- [x]**Task 4 : Connecter le bouton SKN au SkinSelector** (AC: #1, #4, #7)
  - [x]4.1 Dans `ActionBar.vue`, émettre un événement `@skins` quand le bouton "skins" est cliqué (remplacer le `console.log` stub)
  - [x]4.2 Dans `App.vue`, écouter `@skins="toggleOverlay('skins')"` sur `<ActionBar>`
  - [x]4.3 Ajouter le composant `<SkinSelector>` dans le template de `App.vue`, conditionné par `activeOverlay === 'skins'`
  - [x]4.4 Vérifier que `toggleOverlay` gère déjà l'exclusivité (un seul panneau à la fois) — c'est le cas via le mécanisme existant `activeOverlay`

### Accessibilité

- [x]**Task 5 : Accessibilité clavier et lecteurs d'écran** (AC: #6)
  - [x]5.1 Le panneau overlay reçoit le focus à l'ouverture (focus trap comme PreferencesPanel)
  - [x]5.2 La liste utilise `role="listbox"` avec chaque skin en `role="option"`
  - [x]5.3 `aria-selected="true"` sur le skin actif
  - [x]5.4 Flèches haut/bas pour naviguer, Entrée pour appliquer
  - [x]5.5 `aria-label` sur le panneau : "Sélecteur de skins"
  - [x]5.6 Escape ferme le panneau et rend le focus au bouton SKN

### Tests

- [x]**Task 6 : Tests** (tous AC)
  - [x]6.1 Tests unitaires Rust : `list_skins` (dossier vide, avec .wsz, inexistant)
  - [x]6.2 Tests unitaires JS : `SkinSelector.vue` (rendu, clic skin, clic défaut, fermeture)
  - [x]6.3 Vérifier 0 régression sur les tests existants (342 tests JS, 29 tests Rust)

## Dev Notes

### Intelligence de la Story 4.1 (précédente)

**Code créé et réutilisable par cette story :**

| Fichier | Pertinence | Notes |
|---------|-----------|-------|
| `src/stores/useSkinStore.js` | Directe | `loadSkinFromWsz(path)`, `resetToDefaultSkin()`, `skinColors`, `skinVersion` — tout est prêt, NE PAS modifier ces actions |
| `src/stores/usePreferencesStore.js` | Directe | `setSkinPath(path)` et `currentSkinPath` — déjà persisté via Tauri Store |
| `src/components/shared/PreferencesPanel.vue` | Pattern | Modèle exact pour le SkinSelector (overlay, theming, transition, focus trap, Escape) |
| `src/components/player/ActionBar.vue` | Intégration | Bouton "skins" (`SKN`) déjà rendu, stub `console.log` à remplacer par `emit('skins')` |
| `src/App.vue` | Intégration | `activeOverlay` state et `toggleOverlay()` déjà en place, supportent `'skins'` comme valeur |
| `src-tauri/src/skin_parser/mod.rs` | Extension | Ajouter `list_skins` ici, à côté de `parse_skin`, `copy_skin_to_library`, `load_saved_skin` |
| `src-tauri/src/lib.rs` | Extension | Enregistrer `list_skins` dans le handler Tauri |

**Enseignements de Story 4.1 :**
1. Le `skinVersion` counter est le mécanisme de réactivité — quand un skin change, tous les composants Canvas re-dessinent via un `watch` sur `skinVersion`
2. Les images sont stockées dans un `Map` au niveau module (hors state Pinia) — ne jamais mettre d'objets `Image` dans le state
3. `loadSkinFromWsz` utilise un `loadGeneration` counter pour éviter les race conditions (important si l'utilisateur clique rapidement sur plusieurs skins)
4. `copy_skin_to_library` copie les .wsz dans `$APP_DATA/skins/` — c'est ce dossier que `list_skins` doit lister
5. Le fallback par asset fonctionne déjà : si un .wsz a des assets manquants, le rendu programmatique prend le relais
6. 342 tests JS + 29 tests Rust passent — baseline de non-régression

### Architecture — Patterns à respecter

**Overlay panel :** Suivre exactement le pattern de `PreferencesPanel.vue` :
- `<Transition>` wrapper (conditionnelle : mode moderne uniquement)
- Div overlay plein écran (`@click.self` pour fermer)
- Panel centré avec bordure
- Couleurs via `skinStore.colors.*` (inline `:style`)
- Background semi-transparent : `skinStore.colors.displayBg + 'EE'`

**IPC Tauri :** La commande `list_skins` doit utiliser `app_handle.path().app_data_dir()` pour trouver le dossier skins. Pattern identique à `copy_skin_to_library`.

**State management :** La liste des skins est un état local au composant (pas dans un store Pinia). Elle est rechargée à chaque ouverture du panneau.

**Langue :** Code en anglais, labels UI en français. Le titre du panneau est "Skins", l'entrée par défaut est "Classic Faithful".

**Tests JS :** Co-localisés : `SkinSelector.test.js` à côté de `SkinSelector.vue` dans `src/components/skin/`.
**Tests Rust :** Module `#[cfg(test)]` en bas de `skin_parser/mod.rs`.

### Project Structure Notes

**Fichiers à créer :**

| Fichier | Notes |
|---------|-------|
| `src/components/skin/SkinSelector.vue` | Nouveau composant (remplacer `.gitkeep`) |
| `src/components/skin/SkinSelector.test.js` | Tests co-localisés |

**Fichiers à modifier :**

| Fichier | Modification |
|---------|-------------|
| `src-tauri/src/skin_parser/mod.rs` | Ajouter struct `SkinInfo`, commande `list_skins`, tests |
| `src-tauri/src/lib.rs` | Enregistrer `list_skins` dans `.invoke_handler()` |
| `src/components/player/ActionBar.vue` | Remplacer le `console.log` stub par `emit('skins')` |
| `src/App.vue` | Ajouter `@skins="toggleOverlay('skins')"`, importer et rendre `<SkinSelector>` |

**Fichiers à NE PAS modifier :**
- `src/stores/useSkinStore.js` — les actions `loadSkinFromWsz` et `resetToDefaultSkin` sont déjà prêtes
- `src/stores/usePreferencesStore.js` — `setSkinPath` est déjà prêt
- `src/engine/skinRenderer.js` — aucun changement de rendu nécessaire
- `src/engine/audioEngine.js` — aucun impact audio

### Anti-patterns à éviter

1. **NE PAS stocker la liste des skins dans un store Pinia** — c'est un état local au composant SkinSelector, rechargé à chaque ouverture
2. **NE PAS créer un système de preview/thumbnail** — on applique directement le skin (preview = application réelle)
3. **NE PAS modifier `useSkinStore`** — tout ce dont on a besoin (`loadSkinFromWsz`, `resetToDefaultSkin`) existe déjà
4. **NE PAS utiliser de composants DOM pour le panel** quand on peut suivre le pattern HTML/CSS simple du PreferencesPanel
5. **NE PAS bloquer l'UI** pendant le chargement de la liste des skins — c'est une lecture de dossier, quasi instantanée
6. **NE PAS oublier de rafraîchir la liste** à chaque ouverture (un .wsz peut être drag & droppé entre deux ouvertures)

### Contraintes UX

- **Changement de skin = application instantanée** — pas de bouton "Appliquer", pas de confirmation. Un clic = le skin change.
- **Le panneau lui-même change d'apparence** quand un nouveau skin est appliqué (les couleurs se mettent à jour via la réactivité Vue sur `skinStore.colors`)
- **Un seul overlay à la fois** — géré par `activeOverlay` dans `App.vue`
- **Pas de barre de titre native Tauri custom** — feedback utilisateur existant (mémoire)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — Acceptance criteria, user story
- [Source: _bmad-output/planning-artifacts/architecture.md#Skin Engine] — IPC `list_skins`, Canvas rendering, asset:// protocole
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — Emplacement `src/components/skin/SkinSelector.vue`
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Pinia stores, composants Vue
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System] — Ce que les skins contrôlent vs ne contrôlent pas
- [Source: _bmad-output/implementation-artifacts/4-1-parseur-de-skins-wsz-et-chargement.md] — Code existant, enseignements, patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème bloquant rencontré.

### Completion Notes List

- Task 1 : Commande IPC `list_skins` — Créé `SkinInfo` struct + `list_skins_in_dir` (testable sans Tauri) + commande Tauri `list_skins`. 4 tests unitaires Rust ajoutés (dossier vide, inexistant, avec .wsz, ignore non-.wsz). Enregistrée dans `lib.rs`.
- Task 2 : `SkinSelector.vue` — Composant overlay suivant le pattern exact de `PreferencesPanel.vue` (overlay, panel, header, body). Theming dynamique via `skinStore.colors.*`. Liste scrollable avec "Classic Faithful" hardcodé en tête.
- Task 3 : Chargement de la liste — `invoke('list_skins')` appelé à chaque ouverture du panneau via `watch(visible, ..., { immediate: true })`. État local au composant (pas de store Pinia).
- Task 4 : Intégration ActionBar/App.vue — Remplacé le `console.log` stub par `emit('skins')` dans `ActionBar.vue`. Ajouté `@skins="toggleOverlay('skins')"` et `<SkinSelector>` dans `App.vue`. L'exclusivité overlay fonctionne via `activeOverlay`.
- Task 5 : Accessibilité — `role="listbox"` + `role="option"` + `aria-selected`. Navigation flèches haut/bas + Enter. Focus trap via `useFocusTrap`. Escape ferme le panneau. `aria-label` sur le panneau.
- Task 6 : Tests — 23 tests JS pour SkinSelector (rendu, liste, surbrillance, sélection, fermeture, accessibilité, theming). 33 tests Rust (4 nouveaux). 365 tests JS + 33 Rust = 0 régression.

### File List

**Fichiers créés :**
- `src/components/skin/SkinSelector.vue`
- `src/components/skin/SkinSelector.test.js`

**Fichiers modifiés :**
- `src-tauri/src/skin_parser/mod.rs` — Ajout `SkinInfo`, `list_skins_in_dir`, `list_skins`, 4 tests
- `src-tauri/src/lib.rs` — Enregistrement de `list_skins`
- `src/components/player/ActionBar.vue` — `emit('skins')` au lieu du stub
- `src/App.vue` — Import `SkinSelector`, `@skins` event, `<SkinSelector>` dans template

### Change Log

- 2026-03-25 : Implémentation complète de la Story 4.2 — Sélecteur de skins avec commande IPC `list_skins`, composant `SkinSelector.vue`, intégration ActionBar/App.vue, accessibilité clavier/ARIA, 23 tests JS + 4 tests Rust ajoutés.
