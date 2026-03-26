# Story 5.2 : Publication de Releases

Status: in-progress

## Story

As a mainteneur,
I want publier une release avec des notes de version,
So that les utilisateurs puissent télécharger la dernière version de SikAmp.

## Acceptance Criteria

1. **AC1 — Revue de la draft release**
   - **Given** une draft release créée par le pipeline CI/CD (Story 5.1) avec les artefacts des 3 plateformes
   - **When** le mainteneur ouvre la draft release sur GitHub
   - **Then** il peut rédiger les release notes (nouvelles features, bugs fixés, contributeurs remerciés)
   - **And** il peut vérifier la présence des artefacts pour les 3 OS

2. **AC2 — Publication de la release**
   - **Given** les release notes rédigées
   - **When** le mainteneur publie la release
   - **Then** la release est visible publiquement sur GitHub Releases
   - **And** les liens de téléchargement sont accessibles pour chaque OS

3. **AC3 — Installation fonctionnelle**
   - **Given** l'installation sur chaque plateforme
   - **When** l'utilisateur télécharge et installe l'artefact correspondant à son OS
   - **Then** l'installation se complète en moins de 2 minutes (NFR15)
   - **And** l'application se lance correctement après installation

## Tâches / Sous-tâches

- [x] Tâche 1 — Créer le script de bump de version (AC: #1)
  - [x] 1.1 Créer un script `scripts/bump-version.sh` qui met à jour la version dans `package.json` ET `src-tauri/tauri.conf.json` simultanément (les deux fichiers DOIVENT rester synchronisés)
  - [x] 1.2 Le script accepte un argument `major.minor.patch` (ex: `./scripts/bump-version.sh 1.0.0`)
  - [x] 1.3 Le script valide le format semver avant d'appliquer
  - [x] 1.4 Le script affiche un résumé des changements effectués

- [x] Tâche 2 — Créer le template de release notes (AC: #1)
  - [x] 2.1 Créer un fichier `.github/RELEASE_TEMPLATE.md` avec les sections : Nouveautés, Corrections, Contributeurs, Téléchargements (liens par OS), Notes d'installation
  - [x] 2.2 Inclure les avertissements de sécurité pour les installeurs non signés (macOS Gatekeeper, Windows SmartScreen)
  - [x] 2.3 Inclure des instructions d'installation par OS (macOS : clic droit > Ouvrir pour contourner Gatekeeper ; Windows : "Plus d'infos" > Exécuter quand même)

- [x] Tâche 3 — Documenter le processus de release dans CONTRIBUTING.md (AC: #1, #2)
  - [x] 3.1 Ajouter une section "Publication d'une Release" dans CONTRIBUTING.md (ou créer le fichier s'il n'existe pas)
  - [x] 3.2 Documenter le workflow complet : bump version → commit → tag → push → vérifier draft → rédiger notes → publier
  - [x] 3.3 Documenter la convention de nommage des tags : `v{major}.{minor}.{patch}` (ex: `v1.0.0`)
  - [x] 3.4 Documenter la checklist de vérification avant publication (artefacts 3 OS présents, tailles < 100 Mo, notes rédigées)

- [ ] Tâche 4 — Publier la première release officielle v1.0.0 (AC: #1, #2, #3) **[MANUEL — Seb]**
  - [ ] 4.1 Bump la version à `1.0.0` via le script créé en Tâche 1
  - [ ] 4.2 Créer un commit de release + tag `v1.0.0` + push
  - [ ] 4.3 Attendre le workflow release (build 3 OS ~15-20 min)
  - [ ] 4.4 Vérifier la draft release : présence des artefacts (.exe/.msi, .dmg, .AppImage/.deb/.rpm), tailles < 100 Mo
  - [ ] 4.5 Rédiger les release notes à partir du template
  - [ ] 4.6 Publier la release (passer de draft à publique)

- [ ] Tâche 5 — Test d'installation post-release (AC: #3) **[MANUEL — Seb]**
  - [ ] 5.1 Télécharger et installer sur macOS (vérifier contournement Gatekeeper)
  - [ ] 5.2 Vérifier le lancement de l'application après installation
  - [ ] 5.3 Documenter tout problème rencontré dans les Completion Notes

## Dev Notes

### Contexte — Pipeline CI/CD déjà opérationnel (Story 5.1)

Le pipeline de build est entièrement fonctionnel. La Story 5.1 a validé :
- `ci.yml` : lint + tests sur chaque PR (ESLint, Prettier, rustfmt, clippy, vitest, cargo test)
- `release.yml` : build multi-plateforme sur push de tag `v*`, draft release automatique
- Test réel avec tag `v0.1.0-rc.1` : 7 artefacts générés (.exe 3Mo, .dmg 11Mo, .AppImage 80Mo, .deb 6Mo, .rpm 6Mo, .msi 5Mo) — tous < 100 Mo
- `tauri-plugin-updater` configuré dans `src-tauri/tauri.conf.json` (section `plugins.updater`) pour activation future

**Cette story est principalement de la documentation et du process, PAS de l'infrastructure.**

### Scope révisé — Pas de signature de code

La signature de code est hors scope (pas de licence Apple Developer / Authenticode). Conséquences :
- macOS : Gatekeeper affiche un avertissement. L'utilisateur doit faire clic droit > Ouvrir pour contourner
- Windows : SmartScreen peut bloquer. L'utilisateur doit cliquer "Plus d'infos" > "Exécuter quand même"
- Linux : pas d'impact (pas de signature requise)
- `latest.json` : NON généré par `tauri-action` car la signature est requise pour le fichier de mise à jour. Le AC2 mentionne `latest.json` mais il ne sera pas disponible tant que la signature n'est pas en place (Story 5.3 reportée). **Documenter cette limitation dans les release notes.**

### Synchronisation des versions — Point critique

Les versions DOIVENT être identiques dans :
- `package.json` → champ `version`
- `src-tauri/tauri.conf.json` → champ `version`

Actuellement les deux sont à `0.1.0`. Le script de bump doit modifier les deux fichiers atomiquement.

### Convention de tags

- Format : `v{semver}` (ex: `v1.0.0`, `v1.0.1`, `v2.0.0-beta.1`)
- Le workflow `release.yml` se déclenche sur `push tags: v*`
- Le tag est utilisé comme `tagName` et dans `releaseName: 'SikAmp ${{ github.ref_name }}'`

### Artefacts attendus par la draft release

| OS | Artefacts | Taille attendue |
|---|---|---|
| Windows | `.exe`, `.msi` | ~3-5 Mo |
| macOS | `.dmg`, `.app.tar.gz` | ~11 Mo |
| Linux | `.AppImage`, `.deb`, `.rpm` | ~6-80 Mo |

### Anti-patterns à éviter

- **NE PAS modifier `release.yml`** — le workflow fonctionne, cette story est documentation/process
- **NE PAS ajouter de signature de code** — hors scope
- **NE PAS automatiser la publication** (passer draft → publique) — la revue manuelle est voulue (Journey 5 de Seb dans le PRD)
- **NE PAS créer de CHANGELOG.md séparé** — les release notes GitHub suffisent pour un side project solo
- **NE PAS utiliser de release-please, semantic-release ou autre outil** — overkill pour un dev solo, un simple script bash suffit

### Contraintes architecturales

| Décision | Choix | Source |
|---|---|---|
| CI/CD | GitHub Actions + `tauri-apps/tauri-action` | [architecture.md#Infrastructure & Deployment] |
| Déclenchement release | Push de tag Git `v*` | [architecture.md#Infrastructure & Deployment] |
| Draft release | `releaseDraft: true` dans tauri-action | [release.yml] |
| Auto-update | `tauri-plugin-updater` configuré (inactif sans signature) | [tauri.conf.json#plugins.updater] |
| Taille installeur | < 100 Mo (NFR14) | [prd.md#NFR14] |
| Installation | < 2 minutes (NFR15) | [prd.md#NFR15] |
| Langue code | Anglais | [architecture.md#Process Patterns] |

### Structure des fichiers concernés

```
Fichiers à CRÉER :
  scripts/bump-version.sh          # Script de bump de version
  .github/RELEASE_TEMPLATE.md      # Template de release notes

Fichiers à MODIFIER :
  CONTRIBUTING.md                   # Ajouter section release process (créer si inexistant)
  package.json                      # Bump version → 1.0.0
  src-tauri/tauri.conf.json         # Bump version → 1.0.0

Fichiers à NE PAS TOUCHER :
  .github/workflows/release.yml    # Fonctionnel, validé Story 5.1
  .github/workflows/ci.yml         # Fonctionnel, validé Story 5.1
```

### Project Structure Notes

- Le dossier `scripts/` n'existe pas encore — à créer à la racine du projet
- Le fichier `CONTRIBUTING.md` n'a pas été vérifié — peut ne pas exister
- Les fichiers `.github/RELEASE_TEMPLATE.md` (template de notes) est distinct de `.github/PULL_REQUEST_TEMPLATE.md` (template de PR)

### Références

- [Source: epics.md#Story 5.2 — lignes 873-896]
- [Source: architecture.md#Infrastructure & Deployment]
- [Source: prd.md#FR38-FR40 — CI/CD & Releases]
- [Source: prd.md#NFR14-NFR15 — Compatibilité]
- [Source: Story 5.1 — Completion Notes (pipeline validé, artefacts confirmés)]
- [Source: release.yml — workflow de release existant]
- [Source: tauri.conf.json — config updater en place]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Tâche 1 : Script `scripts/bump-version.sh` créé et testé — met à jour `package.json`, `src-tauri/tauri.conf.json` et `src-tauri/Cargo.toml` simultanément. Validations : format semver, version identique ignorée, message d'erreur clair.
- Tâche 2 : Template `.github/RELEASE_TEMPLATE.md` créé — sections Nouveautés, Corrections, Contributeurs, Téléchargements par OS, Notes d'installation (Gatekeeper macOS, SmartScreen Windows, AppImage Linux).
- Tâche 3 : `CONTRIBUTING.md` créé — guide dev local (prérequis, install, tests, lint) + section "Publication d'une Release" complète (bump, commit, tag, push, vérification draft, rédaction notes, publication).
- Tâches 4-5 : Réservées au mainteneur (Seb) — instructions fournies ci-dessous.

### File List

- `scripts/bump-version.sh` (nouveau — script de bump de version)
- `.github/RELEASE_TEMPLATE.md` (nouveau — template de release notes)
- `CONTRIBUTING.md` (nouveau — guide de contribution et release process)
