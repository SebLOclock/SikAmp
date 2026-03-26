## Nouveautés

-

## Corrections

-

## Contributeurs

Merci à tous ceux qui ont contribué à cette release !

## Téléchargements

| OS | Fichier | Notes |
|---|---|---|
| Windows | `.exe` / `.msi` | Installeur non signé — voir notes ci-dessous |
| macOS | `.dmg` | Non signé — voir notes ci-dessous |
| Linux | `.AppImage` / `.deb` / `.rpm` | |

## Notes d'installation

### Windows

L'installeur n'est pas signé avec un certificat Authenticode. Windows SmartScreen peut afficher un avertissement :

1. Cliquer sur **"Plus d'infos"**
2. Cliquer sur **"Exécuter quand même"**

### macOS

L'application n'est pas signée avec un certificat Apple Developer. macOS Gatekeeper bloque l'ouverture par défaut :

1. **Clic droit** (ou Ctrl+clic) sur l'application dans le Finder
2. Sélectionner **"Ouvrir"**
3. Confirmer l'ouverture dans la boîte de dialogue

Cette manipulation n'est nécessaire qu'au premier lancement.

### Linux

Aucune manipulation particulière. Pour l'AppImage, rendre le fichier exécutable :

```bash
chmod +x SikAmp_*.AppImage
./SikAmp_*.AppImage
```

---

> **Note :** Les installeurs ne sont pas signés pour le moment (side project open-source). La signature de code est prévue dans une future version.
