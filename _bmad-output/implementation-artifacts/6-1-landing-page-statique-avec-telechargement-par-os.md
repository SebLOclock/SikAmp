# Story 6.1: Landing Page Statique avec Téléchargement par OS

Status: review

## Story

As a visiteur,
I want découvrir SikAmp sur une page web attractive et télécharger l'installeur pour mon OS,
So that je puisse installer et essayer le player rapidement.

## Acceptance Criteria

1. **Hosting et affichage initial** — La page est hébergée via GitHub Pages (dossier `docs/`). Un visiteur accédant à l'URL voit une landing page statique au design rétro Y2K, avec le logo, le pitch "Et si Winamp était sorti en 2026 ?", et une description courte du projet.

2. **Détection OS et section téléchargement** — Des boutons de téléchargement sont affichés pour Windows (.exe), macOS (.dmg) et Linux (AppImage/.deb). Le bouton correspondant à l'OS détecté du visiteur est mis en avant visuellement.

3. **Mise à jour automatique des liens (FR32)** — Après publication d'une nouvelle release GitHub, un workflow CI/CD met à jour automatiquement les liens de téléchargement sur la landing page. Aucune intervention manuelle requise.

4. **Comportement des liens** — Un clic sur un bouton de téléchargement lance le download de l'installeur depuis GitHub Releases (lien direct vers l'artefact, pas de redirection intermédiaire).

5. **SEO et accessibilité** — Balises meta (title, description, og:image) configurées. La page est accessible et lisible sans JavaScript.

6. **Responsive mobile** — La page est responsive. Sur mobile, les boutons de téléchargement desktop sont visibles avec mention "Application desktop uniquement".

## Tasks / Subtasks

- [x] Task 1 — Créer la structure landing page dans `docs/` (AC: #1)
  - [x] 1.1 Créer `docs/index.html` avec structure HTML sémantique
  - [x] 1.2 Créer `docs/style.css` avec design Y2K/rétro
  - [x] 1.3 Organiser `docs/assets/` (logo, screenshots, favicon)
  - [x] 1.4 Ajouter fichier `.nojekyll` dans `docs/`

- [x] Task 2 — Implémenter le contenu de la page (AC: #1, #5, #6)
  - [x] 2.1 Section hero : logo + pitch + description courte
  - [x] 2.2 Section features : points forts du player (crossfade, skins, offline)
  - [x] 2.3 Section screenshots : captures d'écran de l'app (lien vers GitHub Releases comme alternative)
  - [x] 2.4 Balises meta SEO (title, description, og:image, og:url)
  - [x] 2.5 Design responsive mobile-first

- [x] Task 3 — Implémenter la détection OS et boutons de téléchargement (AC: #2, #4)
  - [x] 3.1 Détection OS via `navigator.userAgent` (vanilla JS inline)
  - [x] 3.2 Boutons de téléchargement pour les 3 OS avec liens GitHub Releases
  - [x] 3.3 Mise en avant visuelle du bouton correspondant à l'OS détecté
  - [x] 3.4 Fallback sans JS : tous les boutons visibles, pas de mise en avant
  - [x] 3.5 Mention "Application desktop uniquement" sur mobile

- [x] Task 4 — Workflow de mise à jour automatique des liens (AC: #3)
  - [x] 4.1 Créer ou étendre le workflow release pour mettre à jour `docs/index.html`
  - [x] 4.2 Script qui extrait les URLs des artefacts de la release et met à jour les liens
  - [x] 4.3 Commit automatique des changements dans `docs/` après release

- [x] Task 5 — Configuration GitHub Pages (AC: #1)
  - [x] 5.1 Documenter l'activation de GitHub Pages (source: branche main, dossier /docs)

## Dev Notes

### Architecture et contraintes

- **Pas de framework JS** — La landing page est un site statique pur (HTML/CSS/JS vanilla). Ne PAS utiliser Vue.js, Vite, ou tout bundler. C'est indépendant de l'app Tauri.
- **Hébergement** — GitHub Pages depuis le dossier `docs/` de la branche `main`. Pas de branche `gh-pages` séparée.
- **Fichier `.nojekyll`** — Obligatoire dans `docs/` pour désactiver le processing Jekyll de GitHub Pages.

### Design Y2K/Rétro

- Fond gris métallique (#29292E) avec gradients subtils
- Texte vert lumineux (#00FF00) pour les accents, rappelant l'afficheur Winamp
- Effet de profondeur sur les boutons (style 3D classique)
- Le design doit évoquer l'esthétique Winamp 2.x sans être une copie pixel-perfect
- Utiliser le logo existant : `docs/sikamp-logo-transparent.png`

### Détection OS

```javascript
// Logique de détection OS — inline dans index.html, pas de fichier JS séparé
function detectOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'windows';
  if (ua.includes('Mac')) return 'macos';
  if (ua.includes('Linux')) return 'linux';
  return null;
}
```

- Sans JS : tous les boutons sont visibles, aucun n'est mis en avant → la page reste fonctionnelle (AC #5)
- Sur mobile (viewport < 768px) : afficher les boutons avec la mention "Application desktop uniquement"

### Liens de téléchargement

Les URLs des artefacts GitHub Releases suivent ce pattern :
```
https://github.com/SebLOclock/winamp-sik/releases/latest/download/{filename}
```

Noms d'artefacts attendus (basés sur le workflow release existant avec `tauri-apps/tauri-action`) :
- **Windows** : `SikAmp_1.0.0_x64-setup.exe` (ou pattern similaire)
- **macOS** : `SikAmp_1.0.0_universal.dmg`
- **Linux** : `SikAmp_1.0.0_amd64.deb` et/ou `SikAmp_1.0.0_amd64.AppImage`

**Important** : Utiliser les URLs `/releases/latest/download/` pour pointer toujours vers la dernière release, plutôt que des URLs versionnées. Cela simplifie la mise à jour automatique (AC #3).

**Alternative pour AC #3** : Si les noms de fichiers contiennent la version (ex: `SikAmp_1.0.0_x64-setup.exe`), les URLs `/releases/latest/download/` ne suffisent pas car le nom change à chaque version. Dans ce cas :
- Option A : Renommer les artefacts en noms fixes dans le workflow release (ex: `SikAmp-windows.exe`)
- Option B : Workflow qui met à jour `docs/index.html` avec les URLs exactes après chaque release

Privilégier l'**option A** (noms fixes) car plus simple et ne nécessite pas de commit automatique.

### Workflow CI/CD existant

- `.github/workflows/release.yml` — Déclenché par push de tag `v*`, build matrix 3 OS, utilise `tauri-apps/tauri-action@v0`
- La release est créée en draft puis publiée manuellement
- Si option A (noms fixes) : modifier `release.yml` pour renommer les artefacts uploadés
- Si option B (mise à jour auto) : ajouter un job `update-landing-page` dans `release.yml` ou créer un workflow séparé déclenché par `release: published`

### SEO

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SikAmp — Et si Winamp était sorti en 2026 ?</title>
<meta name="description" content="SikAmp est un lecteur audio desktop open source inspiré de Winamp, avec crossfade, skins personnalisés et une esthétique Y2K. Disponible sur Windows, macOS et Linux.">
<meta property="og:title" content="SikAmp — Et si Winamp était sorti en 2026 ?">
<meta property="og:description" content="Lecteur audio desktop open source inspiré de Winamp. Crossfade, skins, offline-first.">
<meta property="og:image" content="https://seblOclock.github.io/winamp-sik/assets/og-image.png">
<meta property="og:url" content="https://seblOclock.github.io/winamp-sik/">
<meta property="og:type" content="website">
```

### Project Structure Notes

- Le dossier `docs/` existe déjà avec des logos et fichiers .wsz (skins de démo)
- Les fichiers .wsz NE SONT PAS des assets de la landing page — ne pas les supprimer
- Structure cible :
  ```
  docs/
  ├── .nojekyll
  ├── index.html
  ├── style.css
  ├── assets/
  │   ├── og-image.png          # Image OpenGraph (à créer ou dériver du logo)
  │   ├── favicon.ico           # Favicon (à créer ou dériver du logo)
  │   └── screenshots/          # Captures d'écran de l'app (optionnel pour v1)
  ├── sikamp-logo-transparent.png  # Déjà existant
  ├── logo-sikamp.png              # Déjà existant
  ├── Garfield.wsz                 # Skin démo — ne pas supprimer
  ├── PSXkin.wsz                   # Skin démo — ne pas supprimer
  ├── netscape_winamp.wsz          # Skin démo — ne pas supprimer
  └── winamp_skin_wsz_06.wsz       # Skin démo — ne pas supprimer
  ```

### Parcours utilisateurs clés

- **Marina (nostalgique)** : "Le logo familier, le pitch 'Et si Winamp était sorti en 2026 ?'. Elle sourit. Un bouton 'Télécharger pour macOS'."
- **Léo (Gen Z)** : "Le design Y2K l'accroche immédiatement. Il clique 'Télécharger pour Windows', installe en deux clics."
- La landing page est le **premier point de contact** — l'émotion visée est curiosité + sourire.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure]
- [Source: _bmad-output/planning-artifacts/prd.md#FR30-FR32]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Journey]
- [Source: .github/workflows/release.yml]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Landing page statique créée dans `docs/` avec HTML/CSS/JS vanilla (aucun framework)
- Design Y2K/rétro : fond gris métallique, texte vert lumineux, boutons 3D, police monospace
- 3 boutons de téléchargement (Windows .exe, macOS .dmg, Linux .deb) pointant vers les artefacts réels de la release v1.0.0
- Détection OS par `navigator.userAgent` inline — le bouton de l'OS détecté reçoit la classe `download__btn--detected`
- Fallback sans JS : tous les boutons visibles, aucun highlight, page fonctionnelle
- Responsive mobile : boutons empilés, mention "Application desktop uniquement" visible sous 768px
- SEO : balises meta title, description, og:title, og:description, og:image, og:url, og:type
- Favicon SVG dans `docs/assets/favicon.svg`
- OG image : copie du logo dans `docs/assets/og-image.png`
- Workflow `update-landing-page.yml` : déclenché sur `release: published`, extrait les noms d'artefacts via `gh release view`, met à jour les href et la version affichée dans `docs/index.html`, commit automatique
- `.nojekyll` ajouté pour désactiver le processing Jekyll
- Fichiers .wsz existants dans `docs/` préservés intacts
- 365/365 tests passent (aucune régression), 0 erreurs ESLint

### File List

- docs/.nojekyll (nouveau)
- docs/index.html (nouveau)
- docs/style.css (nouveau)
- docs/assets/favicon.svg (nouveau)
- docs/assets/og-image.png (nouveau — copie du logo)
- .github/workflows/update-landing-page.yml (nouveau)
