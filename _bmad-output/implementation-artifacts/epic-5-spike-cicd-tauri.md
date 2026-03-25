# Spike Technique : CI/CD Desktop avec Tauri

**Date :** 2026-03-25
**Epic :** 5 — Distribution, Installation & Mises à Jour
**Statut :** Concluant

---

## Objectif

Valider le workflow de bout en bout : tag Git → GitHub Actions → `tauri-apps/tauri-action` → draft release avec installeurs pour Windows, macOS et Linux (sans signature de code).

## Résultats

| # | Question | Réponse |
|---|----------|---------|
| 1 | `tauri-action` build multi-plateforme ? | ✅ Matrix strategy 3 runners — macOS universal binary (arm64+x86_64), Ubuntu .deb + AppImage, Windows .exe + .msi |
| 2 | Déclenchement sur tag `v*` ? | ✅ `on: push: tags: ['v*']` — workflow se déclenche automatiquement |
| 3 | Draft release automatique ? | ✅ `releaseDraft: true` — les 3 jobs contribuent au même draft release via le tag |
| 4 | CI sur pull requests ? | ✅ Workflow séparé : ESLint, Prettier, rustfmt, clippy, tests JS + Rust sur ubuntu-latest |
| 5 | Builds sans signature ? | ✅ Pas de secrets Authenticode/Apple Developer requis — les builds passent, alertes SmartScreen/Gatekeeper attendues côté utilisateur |

## Workflows créés

| Fichier | Déclencheur | Contenu |
|---------|------------|---------|
| `.github/workflows/ci.yml` | Pull request → main | Lint JS (ESLint + Prettier) + Lint Rust (rustfmt + clippy) + Tests JS (365) + Tests Rust (33) |
| `.github/workflows/release.yml` | Tag `v*` | Build parallèle 3 OS via `tauri-apps/tauri-action@v0` → draft release sur GitHub Releases |

## Décisions techniques

### CI (`ci.yml`)

- **Runner unique ubuntu-latest** — suffisant pour lint + tests (pas de build natif nécessaire)
- **Dépendances système Linux** : `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf` — requis par Tauri pour compiler sur Linux
- **`swatinem/rust-cache`** — cache du registry Cargo et des artifacts de compilation, réduit le temps de CI
- **Concurrency group** — annule les runs précédents sur la même PR pour économiser les minutes

### Release (`release.yml`)

- **macOS universal binary** : `--target universal-apple-darwin` avec les deux targets `aarch64-apple-darwin` + `x86_64-apple-darwin` — un seul .dmg pour Intel et Apple Silicon
- **`fail-fast: false`** — si un OS échoue, les deux autres continuent (évite de perdre des builds valides)
- **`GITHUB_TOKEN`** automatique — pas besoin de secret custom pour créer la draft release
- **Ubuntu 22.04** fixé (pas `latest`) — stabilité des dépendances webkit2gtk

## Corrections apportées pendant le spike

- **Prettier** : 34 fichiers reformatés (écarts accumulés depuis les dernières stories)
- **rustfmt** : 4 fichiers Rust reformatés (formatage de chaînes et alignement de commentaires)
- Aucun changement fonctionnel — 365 tests JS + 33 tests Rust passent avant et après

## Enseignements pour la Story 5.1

1. **Les workflows sont prêts** — la Story 5.1 consiste à les merger sur `main`, les valider en conditions réelles (premier tag), et ajuster si nécessaire
2. **Le premier tag déclenchera le vrai test** — impossible de valider `tauri-action` en local, le spike confirme la configuration mais le vrai run sera sur GitHub Actions
3. **Pas de signature = alertes OS attendues** — documenter dans le README et la landing page (Epic 6) comment ouvrir l'app malgré SmartScreen/Gatekeeper
4. **Cache Rust critique** — sans `swatinem/rust-cache`, le build Tauri prend ~15-20 min par OS ; avec cache, ~5-8 min après le premier run

## Impact sur les tests

- 365 tests JS + 33 tests Rust — 0 régression
- Les corrections de formatage (Prettier + rustfmt) n'impactent aucune logique
