# Story 2.2 : Configuration de la Durée du Crossfade

Status: review

## Story

As a utilisateur,
I want régler la durée du crossfade entre 1 et 12 secondes,
So that je personnalise la fluidité des transitions selon mes goûts.

## Contexte Business

Cette story complète l'Epic 2 (Crossfade — La Feature Signature) en exposant la configuration du crossfade à l'utilisateur. La Story 2.1 a implémenté le moteur crossfade equal-power et le toggle ON/OFF — cette story ajoute l'interface de réglage fin (toggle + slider de durée) dans le PreferencesPanel, conformément à FR8 et au design UX spec.

- **FR8** : L'utilisateur peut configurer la durée du crossfade (de 1 à 12 secondes)
- **FR7** : L'utilisateur peut activer/désactiver le crossfade entre les morceaux (toggle dans les préférences, synchronisé avec l'ActionBar)

Le PreferencesPanel est actuellement minimal (2 contrôles : jingle + mode de rendu). Cette story y ajoute la section crossfade (toggle + slider), conformément au design UX : "Crossfade (toggle on/off + slider durée 1-12s)".

## Acceptance Criteria

1. **Given** le panneau de préférences ouvert
   **When** l'utilisateur voit la section crossfade
   **Then** un toggle on/off est affiché pour activer/désactiver le crossfade
   **And** un slider de durée est affiché avec une plage de 1 à 12 secondes
   **And** la valeur courante est affichée à côté du slider (ex: "5s")

2. **Given** le slider de durée du crossfade
   **When** l'utilisateur drag le slider ou clique sur une position
   **Then** la durée change en temps réel
   **And** le changement prend effet à la prochaine transition (pas de perturbation de la transition en cours)

3. **Given** une durée de crossfade configurée
   **When** l'utilisateur quitte l'application
   **Then** la durée est persistée via Tauri Store (usePreferencesStore)
   **And** au prochain lancement, la durée est restaurée

4. **Given** le crossfade désactivé via le toggle des préférences
   **When** l'utilisateur regarde l'ActionBar
   **Then** le bouton Crossfade de l'ActionBar reflète l'état OFF
   **And** les deux contrôles (ActionBar toggle et préférences toggle) sont synchronisés

5. **Given** le slider de durée dans les préférences
   **When** l'utilisateur navigue au clavier
   **Then** le slider est focusable via Tab
   **And** Flèche gauche/droite ajuste la durée par pas de 1 seconde
   **And** le label ARIA annonce "Durée du fondu enchaîné : [N] secondes"

## Tasks / Subtasks

- [x] Task 1 : Ajouter le toggle crossfade dans PreferencesPanel (AC: #1, #4)
  - [x] Ajouter une section "Fondu enchaîné" avec un toggle on/off identique au pattern des toggles existants (jingle, rendu)
  - [x] Le toggle lit/écrit `preferencesStore.crossfadeEnabled` via `preferencesStore.setCrossfadeEnabled()`
  - [x] Le bouton crossfade de l'ActionBar et le toggle des préférences sont synchronisés automatiquement (même source de vérité : `preferencesStore.crossfadeEnabled`)
  - [x] Rôle ARIA "switch" avec `aria-checked` dynamique, label "Fondu enchaîné : activé/désactivé"

- [x] Task 2 : Ajouter le slider de durée du crossfade (AC: #1, #2, #5)
  - [x] Ajouter un `<input type="range">` avec `min="1"`, `max="12"`, `step="1"` sous le toggle crossfade
  - [x] Afficher la valeur courante à côté du slider (ex: "5s") avec couleur `skinStore.colors.textPrimary`
  - [x] Le slider lit/écrit `preferencesStore.crossfadeDuration` via `preferencesStore.setCrossfadeDuration()`
  - [x] Désactiver visuellement le slider quand le crossfade est désactivé (opacity réduite, curseur `not-allowed`)
  - [x] Styliser le slider pour respecter le skin actif (couleurs `skinStore.colors`)
  - [x] Accessibilité : `role="slider"`, `aria-valuemin="1"`, `aria-valuemax="12"`, `aria-valuenow`, `aria-label="Durée du fondu enchaîné : [N] secondes"`, navigable flèches gauche/droite par pas de 1s

- [x] Task 3 : Vérifier la persistance (AC: #3)
  - [x] La durée est déjà persistée par `usePreferencesStore` (implémenté en Story 2.1) — vérifier que le mécanisme fonctionne end-to-end avec le nouveau slider
  - [x] Tester que la valeur est restaurée au lancement

- [x] Task 4 : Tests (AC: #1-#5)
  - [x] Test PreferencesPanel : le toggle crossfade est affiché et synchronisé avec le store
  - [x] Test PreferencesPanel : le slider de durée est affiché avec les bonnes valeurs min/max/current
  - [x] Test PreferencesPanel : le slider met à jour `preferencesStore.crossfadeDuration` au changement
  - [x] Test PreferencesPanel : le slider est désactivé visuellement quand crossfade est OFF
  - [x] Test PreferencesPanel : les attributs ARIA sont corrects (slider + toggle)
  - [x] Test PreferencesPanel : le toggle synchronisé avec ActionBar (même source de vérité)
  - [x] Tous les 265 tests (250 existants + 15 nouveaux) passent — 0 régression

## Dev Notes

### État Actuel du Code — Ce qui EXISTE Déjà

**Infrastructure crossfade complète (Story 2.1) :**
- `src/stores/usePreferencesStore.js` : `crossfadeEnabled: true`, `crossfadeDuration: DEFAULT_CROSSFADE_DURATION (5)`, actions `setCrossfadeEnabled(bool)` et `setCrossfadeDuration(seconds)` avec persistance Tauri Store debounce 500ms et validation range 1-12
- `src/engine/audioEngine.js` : dual-source A/B avec crossfade equal-power, `startCrossfade(durationMs)` — supporte déjà les durées variables
- `src/stores/usePlayerStore.js` : lit `preferencesStore.crossfadeDuration` pour déclencher le crossfade (lignes 125, 172, 206, 231)
- `src/components/player/ActionBar.vue` : toggle XFD connecté à `preferencesStore.crossfadeEnabled`
- `src/utils/constants.js` : `MAX_CROSSFADE_DURATION = 12`, `DEFAULT_CROSSFADE_DURATION = 5`

**PreferencesPanel actuel (`src/components/shared/PreferencesPanel.vue`) :**
- 2 contrôles : toggle "Jingle au lancement" + toggle "Mode de rendu" (Rétro/Moderne)
- Pattern de toggle existant : `<button role="switch" :aria-checked="..." class="toggle-switch">` avec knob animé CSS
- Overlay avec fond semi-transparent `skinStore.colors.displayBg + 'EE'`, panneau skinné
- Focus trap via `useFocusTrap()` composable
- Transition fade en mode moderne
- Pas de tests existants pour PreferencesPanel

**Ce qui N'EXISTE PAS (scope de cette story) :**
- Section crossfade dans le PreferencesPanel (toggle + slider)
- Slider HTML range stylisé
- Tests pour PreferencesPanel

### Pattern de Toggle à Réutiliser

Le toggle existant dans PreferencesPanel suit exactement ce pattern — le copier pour le crossfade :

```vue
<label class="pref-row" :style="{ color: skinStore.colors.textSecondary }">
  <span>Jingle au lancement</span>
  <button
    role="switch"
    :aria-checked="preferencesStore.jingleEnabled"
    :aria-label="'Jingle au lancement : ' + (preferencesStore.jingleEnabled ? 'activé' : 'désactivé')"
    class="toggle-switch"
    :class="{ active: preferencesStore.jingleEnabled }"
    :style="{
      backgroundColor: preferencesStore.jingleEnabled ? skinStore.colors.textPrimary : skinStore.colors.disabledControls,
      borderColor: skinStore.colors.accentMetallic
    }"
    @click="handleToggleJingle"
  >
    <span class="toggle-knob" :style="{ backgroundColor: skinStore.colors.background }" />
  </button>
</label>
```

### Slider HTML Range — Style Skinné

Le slider doit utiliser un `<input type="range">` natif stylisé via CSS pour respecter le skin actif. Utiliser les pseudo-éléments `::-webkit-slider-thumb` et `::-webkit-slider-runnable-track` pour le styling cross-browser.

```css
/* Pattern recommandé pour le slider */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
}
```

Les couleurs dynamiques doivent être appliquées via `style` binding Vue (pas de CSS statique pour les couleurs du skin).

### Positionnement dans le Panel

Ordre des préférences dans le body (conformément à l'UX spec qui liste les éléments dans cet ordre) :
1. **Fondu enchaîné** (toggle on/off) — **NOUVEAU**
2. **Durée du fondu** (slider 1-12s) — **NOUVEAU** — indenté ou visuellement groupé sous le toggle
3. Jingle au lancement (toggle) — existant
4. Mode de rendu (toggle Rétro/Moderne) — existant

Le crossfade est listé en premier dans la spec UX : "Crossfade (toggle on/off + slider durée 1-12s), jingle au lancement (toggle on/off), mode de rendu (retro/moderne)".

### Synchronisation ActionBar ↔ Préférences

Les deux contrôles (bouton XFD dans ActionBar et toggle dans PreferencesPanel) lisent/écrivent la MÊME source : `preferencesStore.crossfadeEnabled`. Aucune logique de synchronisation n'est nécessaire — la réactivité Vue/Pinia s'en charge automatiquement.

### Feedback Utilisateur — IMPORTANT

**Rendu moderne ≠ pixelisé :** Mode moderne crisp et adapté HiDPI.
**Pas de TitleBar custom :** Barre de titre native Tauri.

### Anti-Patterns à Éviter

- **NE PAS** créer un state local pour le toggle crossfade — utiliser `preferencesStore.crossfadeEnabled` directement
- **NE PAS** dupliquer la logique de persistance — `setCrossfadeDuration()` gère déjà la validation (clamp 1-12) et la persistance
- **NE PAS** utiliser `alert()`, `confirm()`, `prompt()` — jamais
- **NE PAS** utiliser un composant slider tiers — `<input type="range">` natif suffit
- **NE PAS** créer un fichier composant séparé pour le slider — l'intégrer directement dans PreferencesPanel
- **NE PAS** toucher à audioEngine.js ou usePlayerStore.js — tout le backend crossfade fonctionne déjà
- **NE PAS** ajouter de nouvelles dépendances npm

### Conventions Obligatoires

- **Nommage JS** : camelCase (`handleCrossfadeDurationChange`)
- **Logs** : `[PreferencesPanel] Crossfade duration changed: ${seconds}s`
- **Langue code** : anglais. UI : français (labels "Fondu enchaîné", "Durée du fondu enchaîné")
- **Tests** : co-localisés — créer `src/components/shared/PreferencesPanel.test.js`
- **Gestion d'erreurs** : fallback silencieux, pas de blocage UI

### Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/shared/PreferencesPanel.vue` | Ajouter section crossfade (toggle + slider de durée) |
| `src/components/shared/PreferencesPanel.test.js` | **NOUVEAU** — tests du panel complet (toggle + slider + ARIA) |

### Dépendances — Aucun Nouveau Package

Tout est déjà disponible :
- `preferencesStore.crossfadeEnabled` et `preferencesStore.crossfadeDuration` (Story 2.1)
- `preferencesStore.setCrossfadeEnabled()` et `preferencesStore.setCrossfadeDuration()` (Story 2.1)
- `skinStore.colors` pour le styling dynamique
- `MAX_CROSSFADE_DURATION` et `DEFAULT_CROSSFADE_DURATION` dans `src/utils/constants.js`
- `<input type="range">` natif HTML — pas de lib nécessaire

### Intelligence de la Story 2.1

Patterns confirmés à réutiliser :
- Toggle pattern dans PreferencesPanel (jingle + rendu) — copier le pattern exact
- Persistance Tauri Store avec debounce 500ms — déjà câblé, rien à faire
- Labels ARIA en français sur tous les contrôles
- Overlay exclusif : un seul panneau ouvert à la fois (SkinSelector ou PreferencesPanel)
- 250 tests existants à ne pas casser
- Focus trap via `useFocusTrap()` composable — déjà actif

### Git Intelligence

Patterns des derniers commits :
- Messages en anglais, préfixe `feat:` / `fix:`
- Tests systématiquement ajoutés
- Conventions JS/Vue respectées (camelCase fichiers JS, PascalCase composants Vue)
- Story 2.1 vient d'être complétée : 250 tests passent, crossfade moteur opérationnel

### Project Structure Notes

- Modification d'un seul fichier existant : `PreferencesPanel.vue`
- Création d'un seul fichier de test : `PreferencesPanel.test.js`
- Pas de nouveau composant, pas de nouveau store, pas de nouvelle dépendance
- Le test file est co-localisé : `src/components/shared/PreferencesPanel.test.js`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.2, Epic 2]
- [Source: _bmad-output/planning-artifacts/prd.md — FR7, FR8]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Pinia stores, Naming Patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — PreferencesPanel (ligne 866-872), ActionBar (ligne 808)]
- [Source: src/components/shared/PreferencesPanel.vue — Toggle patterns existants]
- [Source: src/stores/usePreferencesStore.js — Actions crossfade déjà implémentées]
- [Source: src/utils/constants.js — MAX_CROSSFADE_DURATION, DEFAULT_CROSSFADE_DURATION]
- [Source: _bmad-output/implementation-artifacts/2-1-crossfade-equal-power-entre-morceaux.md — Patterns, conventions, 250 tests]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build Vite : OK (614ms, 0 erreur)
- Tests PreferencesPanel : 15/15 passent (60ms)
- Suite complète : 265/265 passent (0 régression)

### Completion Notes List

- Toggle crossfade ajouté dans PreferencesPanel, positionné en premier (avant jingle et rendu) conformément à la spec UX
- Slider `<input type="range">` natif avec min=1, max=12, step=1, stylisé via CSS custom properties pour respecter le skin actif
- Toggle et slider utilisent directement `preferencesStore.crossfadeEnabled` et `preferencesStore.crossfadeDuration` — pas d'état local
- Synchronisation ActionBar ↔ Préférences automatique via réactivité Pinia (même source de vérité)
- Slider désactivé visuellement (opacity 0.4, cursor not-allowed) quand crossfade est OFF
- Accessibilité complète : toggle role="switch" avec aria-checked, slider role="slider" avec aria-valuemin/max/now et aria-label en français
- Persistance end-to-end vérifiée (déjà câblée par Story 2.1, aucune modification nécessaire)
- 15 tests unitaires créés couvrant toggle, slider, ARIA, synchronisation, et état désactivé
- Cross-browser slider styling via ::-webkit-slider-thumb et ::-moz-range-thumb

### Change Log

- 2026-03-25 : Implémentation complète de la Story 2.2 — section crossfade (toggle + slider durée 1-12s) dans PreferencesPanel + 15 tests

### File List

- `src/components/shared/PreferencesPanel.vue` — modifié (ajout section crossfade : toggle on/off + slider durée + styles CSS)
- `src/components/shared/PreferencesPanel.test.js` — **NOUVEAU** (15 tests : toggle, slider, ARIA, synchronisation, état désactivé)
