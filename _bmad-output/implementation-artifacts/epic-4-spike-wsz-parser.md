# Spike Technique : Parseur de Skins .wsz

**Date :** 2026-03-25
**Epic :** 4 — Skins Personnalisés
**Statut :** Concluant

---

## Objectif

Valider le pipeline de bout en bout : décompression d'un .wsz en Rust → service des assets via `asset://` → affichage d'un sprite dans un Canvas 2D côté frontend.

## Résultats

| # | Question | Réponse |
|---|----------|---------|
| 1 | Décompression .wsz en Rust ? | ✅ Crate `zip` v2 — API propre, extraction fiable |
| 2 | Servir les assets via `asset://` ? | ✅ `convertFileSrc()` de Tauri sert les .bmp extraits sans friction |
| 3 | Affichage Canvas d'un sprite ? | ✅ `main.bmp` du skin Netscape affiché dans un canvas de test |

## Skin de test

- **Fichier :** `docs/netscape_winamp.wsz` (skin communautaire Netscape, année 2000)
- **Contenu :** 17 fichiers, ~975 Ko
- **Structure confirmée :** ZIP renommé contenant uniquement des `.bmp` et `.txt`

### Fichiers extraits

```
titlebar.bmp, cbuttons.bmp, shufrep.bmp, monoster.bmp, posbar.bmp,
numbers.bmp, text.bmp, playpaus.bmp, volume.bmp, balance.bmp,
viscolor.txt, main.bmp, eq_ex.bmp, pledit.bmp, pledit.txt,
eqmain.bmp, mb.bmp
```

## Code produit (conservé)

| Fichier | Changement |
|---------|-----------|
| `src-tauri/Cargo.toml` | Ajout `zip = "2"` |
| `src-tauri/src/skin_parser/mod.rs` | Commande IPC `parse_skin` — décompresse dans `$TMPDIR/sikamp-skins/{nom}/`, retourne la liste des fichiers |
| `src-tauri/src/lib.rs` | `parse_skin` enregistrée dans le handler Tauri |

## Code jetable (supprimé)

- `src/components/skin/SkinSpikeTest.vue` — composant de test avec dialogue natif + canvas
- Modifications temporaires dans `App.vue` (toggle Ctrl+Shift+K) — revertées

## Enseignements pour la Story 4.1

1. **Le format .wsz est trivial** — pas de compression exotique, pas de format propriétaire. Un ZIP standard avec des BMP
2. **`asset://` fonctionne out of the box** — le protocole est déjà configuré dans `tauri.conf.json` (scope `**`)
3. **Extraction dans $TMPDIR est suffisante** — pas besoin de stocker les assets extraits dans l'app data pour le moment
4. **Filtrage nécessaire** — ignorer `__MACOSX/` et fichiers cachés (déjà implémenté dans `parse_skin`)
5. **Edge cases à traiter en Story 4.1** : archives corrompues, assets manquants, zip slip (chemins malicieux), skins avec sous-dossiers

## Impact sur les tests

- 328 tests existants — 0 régression
- Tests Rust pour `parse_skin` à écrire en Story 4.1
