# Contribuer à SikAmp

Merci de ton intérêt pour SikAmp ! Ce guide t'aidera à démarrer.

## Développement local

### Prérequis

- [Node.js](https://nodejs.org/) (v23+)
- [Rust](https://rustup.rs/) (stable)
- Dépendances système Linux : `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

### Installation

```bash
git clone https://github.com/SebLOclock/winamp-sik.git
cd winamp-sik
npm ci
```

### Lancer en mode développement

```bash
npm run tauri dev
```

### Lancer les tests

```bash
npm test                    # Tests JS (Vitest)
cd src-tauri && cargo test  # Tests Rust
```

### Linter

```bash
npm run lint                # ESLint
npm run format              # Prettier
cd src-tauri && cargo fmt   # rustfmt
cd src-tauri && cargo clippy # clippy
```

## Publication d'une Release

### Convention de versioning

SikAmp utilise le [Semantic Versioning](https://semver.org/) : `major.minor.patch`

- **patch** : corrections de bugs
- **minor** : nouvelles fonctionnalités rétrocompatibles
- **major** : changements non rétrocompatibles

### Convention de nommage des tags

Format : `v{major}.{minor}.{patch}` (ex: `v1.0.0`, `v1.0.1`, `v2.0.0-beta.1`)

### Workflow complet de release

1. **Bump la version** dans les 3 fichiers simultanément :

   ```bash
   ./scripts/bump-version.sh 1.0.0
   ```

   Ce script met à jour `package.json`, `src-tauri/tauri.conf.json` et `src-tauri/Cargo.toml`.

2. **Commit de release** :

   ```bash
   git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock
   git commit -m "chore: bump version to 1.0.0"
   ```

3. **Créer et pousser le tag** :

   ```bash
   git tag v1.0.0
   git push origin main --tags
   ```

4. **Attendre le build CI/CD** (~15-20 minutes) :
   - Le workflow `release.yml` se déclenche automatiquement sur le push du tag `v*`
   - Build en parallèle sur Windows, macOS et Linux
   - Les artefacts sont uploadés en draft release sur GitHub Releases

5. **Vérifier la draft release** sur GitHub Releases :
   - [ ] Artefacts Windows présents (.exe, .msi)
   - [ ] Artefact macOS présent (.dmg)
   - [ ] Artefacts Linux présents (.AppImage, .deb, .rpm)
   - [ ] Tailles < 100 Mo chacun

6. **Rédiger les release notes** :
   - Utiliser le template `.github/RELEASE_TEMPLATE.md` comme base
   - Lister les nouveautés, corrections, contributeurs
   - Inclure les notes d'installation (installeurs non signés)

7. **Publier la release** :
   - Passer la release de "draft" à "publique" sur GitHub

### Notes importantes

- Les installeurs ne sont **pas signés** (pas de certificat Apple Developer / Authenticode)
- macOS : les utilisateurs doivent faire clic droit > Ouvrir au premier lancement (Gatekeeper)
- Windows : les utilisateurs doivent cliquer "Plus d'infos" > "Exécuter quand même" (SmartScreen)
- Le fichier `latest.json` pour l'auto-update n'est pas généré sans signature de code
