---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-e-01-discovery, step-e-02-review, step-e-03-edit]
inputDocuments: [product-brief-winamp-sik-2026-03-21.md]
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
  projectContext: 0
classification:
  projectType: desktop_app
  domain: general
  complexity: low
  projectContext: greenfield
workflowType: 'prd'
date: '2026-03-21'
lastEdited: '2026-03-21'
editHistory:
  - date: '2026-03-21'
    changes: 'Corrections mesurabilité (FR16, FR35, NFR2, NFR9, NFR11), suppression implementation leakage (FR30, FR38-40), harmonisation langue headers'
---

# Product Requirements Document - SikAmp

**Author:** Seb
**Date:** 2026-03-21

## Executive Summary

**SikAmp** est un lecteur musical desktop open-source qui répond à une question simple : "Et si Winamp était sorti en 2026 ?" Le projet cible les nostalgiques de Winamp (nés entre 1985 et 1995) ainsi que la Gen Z curieuse de la culture des années 2000. Il résout un problème concret : aucune solution actuelle ne combine la simplicité, l'esthétique et l'identité du Winamp original dans un client desktop moderne et respectueux de ses utilisateurs.

Le player fonctionne en lecture locale (MP3, FLAC, WAV, OGG), avec skins personnalisables, gestion de playlists, le jingle culte au démarrage, et un crossfade natif entre les morceaux — sa feature signature 2026. Multi-plateforme (Windows, macOS, Linux), open-source dès le jour 1, zéro collecte de données.

### Ce qui rend SikAmp unique

SikAmp est l'anti-thèse du streaming moderne :
- **Pas de compte** — tu télécharges, tu lances, tu écoutes
- **Pas d'abonnement** — gratuit et open-source, pour toujours
- **Pas de prise de tête** — une interface simple et fidèle à l'esprit Winamp
- **Pas de data mining** — zéro télémétrie, zéro tracking, respect total de l'utilisateur

Là où Llama Group a échoué à relancer Winamp avec transparence, SikAmp incarne l'ouverture dès sa conception. La communauté n'est pas un argument marketing — c'est le moteur du projet.

## Project Classification

- **Type :** Application desktop multi-plateforme
- **Domaine :** Multimédia / Divertissement
- **Complexité :** Faible — pas de réglementation spécifique, pas de données sensibles
- **Contexte :** Greenfield — construction from scratch

## Success Criteria

### Succès Utilisateur

- **Expérience nostalgique immédiate** — l'utilisateur doit ressentir le "c'est Winamp" dès le premier lancement
- **Simplicité d'usage** — pas de compte, pas de configuration complexe. Télécharger → installer → écouter
- **Satisfaction mesurée** — formulaire opt-in via mise à jour à 3 mois et 12 mois, centré sur le qualitatif et l'émotionnel ("Qu'avez-vous ressenti ?", "Quel souvenir ça vous a rappelé ?", "Qu'est-ce qui manque ?")
- **Taux de réponse cible** : > 5% des téléchargements
- **Engagement** : les retours alimentent concrètement la roadmap V2

### Succès Business

| Métrique | Cible 3 mois | Cible 12 mois |
|---|---|---|
| Téléchargements | > 1 000 | > 5 000 |
| Contributeurs externes | 1 PR mergée | 3 contributeurs |
| Article BMAD | Publié sur sebastienlemoine.fr | — |
| Stars GitHub | Tendance croissante | Tendance croissante |
| Retours formulaire | Première campagne, taux > 5% | Deuxième campagne, analyse comparative |
| Landing page | En ligne (pré-lancement) | Mise à jour avec liens de téléchargement |

### Succès Technique

- **Lancement de l'application** < 5 secondes
- **Taille de l'installeur** < 100 Mo
- **Installation** < 2 minutes sur Windows, macOS et Linux
- **Crossfade** configurable de 1 à 12 secondes, sans coupure ni craquement audible
- **Anomalies GitHub** — résolution rapide des bugs critiques
- **Builds stables** sur les 3 plateformes

### Résultats Mesurables

- Formulaire qualitatif à 3 mois : taux de réponse > 5%, verbatims analysés pour alimenter la V2
- Formulaire à 12 mois : comparaison avec la première campagne, priorisation des features demandées
- Ratio issues bugs vs feature requests comme indicateur de stabilité

## Product Scope

Voir la section [Project Scoping & Phased Development](#project-scoping--phased-development) pour le détail complet des phases, le feature set MVP, et la roadmap post-MVP.

## User Journeys

### Journey 1 : Marina — Le Retour à la Maison (Happy Path)

**Opening Scene** : Marina, 34 ans, scrolle sur Reddit un dimanche soir. Elle tombe sur un post dans r/nostalgia : "Someone rebuilt Winamp for 2026, open-source and everything." Son cœur fait un bond. Elle clique.

**Rising Action** : La landing page s'affiche — design rétro, le logo familier, le pitch "Et si Winamp était sorti en 2026 ?". Elle sourit. Un bouton "Télécharger pour macOS". Elle clique, l'installeur fait moins de 100 Mo, c'est installé en une minute. Elle lance l'app.

**Climax** : "It really whips the llama's ass." La voix résonne dans ses enceintes. L'interface compacte apparaît, exactement comme dans ses souvenirs. Elle glisse-dépose son dossier de MP3 — Evanescence, Britney, les OST de Final Fantasy VIII. Elle applique un skin classique. Le crossfade enchaîne "Bring Me To Life" sur "My Immortal" avec une fluidité qu'elle n'avait jamais eue à l'époque. Ses yeux brillent.

**Resolution** : Marina crée sa première playlist "2003 vibes", la sauvegarde. SikAmp devient son player par défaut pour la musique locale. Deux semaines plus tard, elle ouvre sa première issue GitHub : "Feature request: import de playlists .m3u depuis l'ancien Winamp."

**Capabilities révélées** : glisser-déposer de fichiers/dossiers, lecture multi-format, système de skins, gestion de playlists (créer/sauvegarder/charger), crossfade, jingle au lancement

---

### Journey 2 : Marina — Le Format Maudit (Edge Case)

**Opening Scene** : Marina, ravie de son nouveau player, décide de charger toute sa collection. Elle glisse un dossier entier de 200 fichiers dans SikAmp.

**Rising Action** : La playlist se remplit. Lecture lancée. Tout roule pendant 15 morceaux. Puis un fichier .wma ne se lance pas. Le player affiche un message clair : "Format non supporté : track16.wma — Formats supportés : MP3, FLAC, WAV, OGG." Le morceau est automatiquement sauté, le crossfade enchaîne sur le suivant sans interruption.

**Climax** : Marina ne panique pas. Le message est clair, le player ne plante pas, la musique continue. Elle note mentalement qu'il faudra convertir ses vieux .wma.

**Resolution** : Elle voit dans le README que les formats supportés sont documentés. Elle ouvre une issue "Support WMA ?" et découvre que c'est déjà dans la roadmap V2. Elle se sent écoutée.

**Capabilities révélées** : gestion gracieuse des formats non supportés, messages d'erreur clairs, skip automatique sans interruption de lecture, résilience de la playlist face aux erreurs

---

### Journey 3 : Léo — La Découverte Rétro (Parcours Gen Z)

**Opening Scene** : Léo, 21 ans, voit une vidéo TikTok : quelqu'un montre un player avec une esthétique pixel art et un son de lama au lancement. Les commentaires sont en feu : "omg winamp is back ???". Il veut tester.

**Rising Action** : Il cherche "SikAmp" — la landing page GitHub Pages apparaît en premier résultat. Le design Y2K l'accroche immédiatement. Il clique "Télécharger pour Windows", installe en deux clics. Premier lancement : le jingle. Il rigole, filme son écran.

**Climax** : Il explore les skins, en trouve un aux couleurs néon qui colle parfaitement à son aesthetic. Il charge un mix de PinkPantheress et de Daft Punk. Le crossfade est smooth. Il screenshot le player et l'envoie sur son groupe Discord : "regardez ce player trop stylé les gars."

**Resolution** : Trois de ses potes téléchargent SikAmp dans l'heure. Léo met une star sur le repo GitHub sans vraiment savoir ce que ça fait, mais il veut "supporter le projet."

**Capabilities révélées** : landing page attractive et SEO-friendly, installation rapide et sans friction, exploration de skins intuitive, apparence "partageable" (screenshot-worthy)

---

### Journey 4 : Alex — La Première Contribution (Contributeur OSS)

**Opening Scene** : Alex, 29 ans, développeur frontend, tombe sur SikAmp via GitHub Trending. Le concept le fait sourire, il star le repo et commence à lire le README.

**Rising Action** : Le README est clair : stack technique, guide de contribution (CONTRIBUTING.md), issues tagguées "good first issue". Alex fork le repo, clone en local, lance le projet. Le setup dev fonctionne du premier coup. Il repère une issue "good first issue" : améliorer l'accessibilité clavier du player.

**Climax** : Il code le fix en 2 heures, écrit les tests, ouvre sa PR. La description est claire grâce au template de PR fourni. Seb review la PR dans les 48h, laisse un commentaire encourageant avec une suggestion mineure. Alex ajuste, la PR est mergée.

**Resolution** : Alex reçoit un message de remerciement. Son nom apparaît dans les contributeurs. Il a envie de continuer — il regarde les issues "help wanted" pour sa prochaine contribution.

**Capabilities révélées** : README et CONTRIBUTING.md clairs, issues bien tagguées, templates de PR, setup dev documenté et fonctionnel, process de review accueillant

---

### Journey 5 : Seb — Le Mainteneur (Gestion Releases & PR)

**Opening Scene** : Seb a mergé 3 PR cette semaine et fixé 2 bugs. Il est temps de publier une nouvelle release.

**Rising Action** : Il met à jour le changelog, bumpe la version dans le package. Il pousse un tag Git. La CI/CD GitHub Actions se déclenche automatiquement : build Windows (.exe), macOS (.dmg), Linux (.AppImage/.deb). Les 3 builds passent. Les artefacts sont uploadés en draft release.

**Climax** : Seb vérifie les builds sur ses machines de test, rédige les release notes (nouvelles features, bugs fixés, contributeurs remerciés). Il publie la release. La landing page GitHub Pages se met à jour automatiquement avec les nouveaux liens de téléchargement.

**Resolution** : Les téléchargements commencent à affluer. Une issue arrive : "Le crossfade craque sur Linux Mint." Seb trie, labellise "bug" et "linux", et assigne la priorité. Le cycle continue.

**Capabilities révélées** : pipeline CI/CD multi-plateforme (GitHub Actions), build automatisé pour 3 OS, release notes, mise à jour automatique de la landing page, gestion des issues (triage, labels, priorités)

---

### Synthèse des capabilities par journey

| Domaine de capability | Journeys source |
|---|---|
| Lecture audio & formats supportés | Marina happy path, Marina edge case |
| Gestion d'erreurs & résilience | Marina edge case |
| Interface & skins | Marina happy path, Léo |
| Playlists (CRUD) | Marina happy path |
| Crossfade configurable | Marina happy path, Léo |
| Jingle au lancement | Marina happy path, Léo |
| Landing page statique | Léo, Seb (mise à jour auto) |
| Installation multi-plateforme | Marina happy path, Léo |
| Documentation contributeur | Alex |
| CI/CD & releases automatisées | Seb |
| Gestion des issues & communauté | Marina edge case, Alex, Seb |

## Domain-Specific Requirements

### Propriété Intellectuelle

- **Jingle** : création originale inspirée de l'esprit "it really whips the llama's ass", pas de réutilisation du son original (droits Nullsoft/AOL)
- **Skins** : skins originaux créés pour SikAmp, inspirés de l'esthétique Winamp classique sans copier les assets sous copyright
- **Nom du projet** : "SikAmp" — initialement nommé "winamp-sik", renommé pour éviter les problèmes de marque déposée

### Formats Audio & Codecs

- **V1 : formats libres uniquement** — MP3, FLAC, WAV, OGG
- **Politique stricte** : aucun format nécessitant des licences propriétaires (AAC, WMA)
- **Cohérence** : cette décision renforce le positionnement open-source et élimine tout risque légal lié aux codecs

### Distribution & Signature

Voir la section [Desktop App Specific Requirements > Platform Support](#platform-support) pour le détail par OS. Budget à prévoir : ~150-200$/an pour les certificats de signature (Apple Developer Program + Authenticode Windows).

### Accessibilité

- **Engagement éthique** : intégrer l'accessibilité dès la V1, cohérent avec le respect de l'utilisateur au cœur du projet
- **Amélioration par rapport à l'original** : l'accessibilité est un domaine où SikAmp fait mieux que Winamp, pas juste "aussi bien"
- Voir les exigences détaillées en [NFR9-NFR12](#accessibility) et [FR33-FR35](#accessibilité-1)

## Desktop App Specific Requirements

### Vue d'ensemble du type de projet

SikAmp est une application desktop multi-plateforme (Windows, macOS, Linux) fonctionnant en mode offline-first. L'expérience est cohérente sur les 3 OS avec des adaptations mineures aux conventions de chaque plateforme. La simplicité d'usage est prioritaire : auto-update, intégration système native, zéro dépendance à une connexion internet pour les fonctions cœur.

### Support des Plateformes

| Plateforme | Format de distribution | Signature | Adaptations spécifiques |
|---|---|---|---|
| **Windows** | .exe (installeur) | Authenticode | Barre de tâches, notifications, associations fichiers via registre |
| **macOS** | .dmg | Apple Developer Program | Menu bar, contrôles media Notification Center, associations fichiers via Info.plist |
| **Linux** | AppImage / .deb | Non requise | Intégration desktop via .desktop file, associations fichiers via xdg-mime |

- **Expérience cohérente** sur les 3 OS avec différences mineures respectant les conventions de chaque plateforme
- **Un seul codebase** — framework cross-platform à déterminer en phase d'architecture

### Intégration Système

- **Associations de fichiers** : double-clic sur MP3/FLAC/WAV/OGG → ouvre SikAmp (optionnel à l'installation, pas forcé)
- **Contrôles media OS** : play/pause/suivant/précédent via les contrôles natifs (barre de tâches Windows, Control Center macOS, MPRIS Linux)
- **Raccourcis clavier globaux** : contrôle du player même quand l'app n'est pas au premier plan
- **Icône dans la zone de notification / system tray** : accès rapide aux contrôles sans ouvrir la fenêtre principale

### Stratégie de Mise à Jour

- **Auto-update obligatoire** — vérification automatique au lancement (si connexion disponible)
- **Notification non-intrusive** : informe l'utilisateur qu'une mise à jour est disponible, ne force pas le redémarrage
- **Téléchargement en arrière-plan** : la mise à jour se télécharge sans interrompre l'écoute
- **Application au prochain lancement** : la mise à jour s'installe au redémarrage de l'app
- **C'est aussi le vecteur du formulaire de satisfaction** à 3 et 12 mois

### Capacités Hors Ligne

- **Offline-first** : toutes les fonctions cœur (lecture, playlists, skins, crossfade) fonctionnent sans connexion
- **Dégradation gracieuse** sans connexion :
  - Lecture audio : ✅ fonctionne normalement
  - Playlists & skins : ✅ fonctionnent normalement
  - Vérification de mises à jour : ❌ silencieusement ignorée
  - Formulaire de satisfaction : ❌ non affiché
- **Aucun blocage** : l'absence de connexion n'empêche jamais l'utilisation du player

### Considérations d'Implémentation

- Le choix du framework cross-platform (Electron, Tauri, etc.) sera déterminant pour l'auto-update, la taille de l'installeur (< 100 Mo), et les intégrations système
- L'auto-update doit être compatible avec la distribution signée sur chaque OS
- Les intégrations système (associations fichiers, contrôles media) varient significativement par OS — prévoir une couche d'abstraction

## Project Scoping & Phased Development

### Stratégie & Philosophie MVP

**Approche MVP :** Experience MVP — le minimum pour que l'utilisateur vive l'expérience "Et si Winamp était sorti en 2026 ?" Le crossfade est un deal-breaker : sans lui, le pitch ne tient pas. Les intégrations système OS sont repoussées en Phase 1.5 pour accélérer le lancement.

**Ressources :** Seb, développeur solo, assisté par la méthode BMAD et les outils IA.

### Feature Set MVP (Phase 1)

**Core User Journeys Supportés :**
- Marina happy path (lecture, skins, playlists, crossfade, jingle)
- Marina edge case (gestion gracieuse des formats non supportés)
- Léo découverte (landing page → téléchargement → premier lancement)

**Must-Have Capabilities :**

| Capability | Justification |
|---|---|
| Landing page statique | Premier point de contact, pré-lancement |
| Lecture audio locale (MP3, FLAC, WAV, OGG) | Fonction fondamentale |
| Interface Winamp classique | Cœur de l'expérience nostalgique |
| Système de skins | Personnalisation = identité Winamp |
| Gestion de playlists (CRUD) | Usage quotidien |
| Jingle original au lancement | Moment "madeleine de Proust" |
| Crossfade configurable (1-12s) | Feature signature 2026, **deal-breaker** |
| Builds multi-plateforme (Win/Mac/Linux) | Accessibilité maximale |
| Gestion gracieuse des erreurs (formats non supportés) | Résilience, pas de crash |
| Auto-update | Simplicité, vecteur du formulaire satisfaction |

### Phase 1.5 — Intégrations Système

Repoussées pour accélérer le lancement, mais prévues rapidement après :

- Associations de fichiers (double-clic .mp3 → SikAmp)
- Contrôles media OS (barre de tâches, Notification Center, MPRIS)
- Raccourcis clavier globaux
- Icône system tray

### Features Post-MVP

**Phase 2 (Growth) :**
- Visualiseur audio
- Égaliseur graphique
- Bibliothèque de skins pré-installés
- Documentation contributeur complète (CONTRIBUTING.md, templates)

**Phase 3 (Expansion) :**
- Plateforme communautaire d'échange de skins et plugins
- Système de plugins extensible
- Streaming intégré (exploration)

### Stratégie de Mitigation des Risques

| Risque | Impact | Mitigation |
|---|---|---|
| **Crossfade complexe** | Deal-breaker — bloque le lancement | Valider la faisabilité du crossfade dès le choix du framework. Si le framework choisi ne le supporte pas nativement, c'est un critère éliminatoire |
| **Dev solo** | Rythme lent, burnout | Scope MVP réduit (pas d'intégrations OS), méthode BMAD pour structurer, ouvrir aux contributions dès la V1 |
| **Signature code (coût)** | ~200$/an, bloquant pour macOS | Budget à prévoir avant le lancement. Sans signature macOS, warning Gatekeeper = perte d'utilisateurs |
| **Propriété intellectuelle** | Nom "winamp" potentiellement problématique | Créer jingle et skins originaux. Surveiller le risque sur le nom, prévoir un plan B |

## Functional Requirements

### Lecture Audio

- **FR1** : L'utilisateur peut lire des fichiers audio aux formats MP3, FLAC, WAV et OGG depuis son disque local
- **FR2** : L'utilisateur peut mettre en pause et reprendre la lecture
- **FR3** : L'utilisateur peut passer au morceau suivant ou revenir au précédent
- **FR4** : L'utilisateur peut naviguer dans un morceau (avance/retour rapide)
- **FR5** : L'utilisateur peut régler le volume
- **FR6** : L'utilisateur peut ajouter des fichiers et dossiers par glisser-déposer dans le player

### Crossfade

- **FR7** : L'utilisateur peut activer/désactiver le crossfade entre les morceaux
- **FR8** : L'utilisateur peut configurer la durée du crossfade (de 1 à 12 secondes)
- **FR9** : Le système effectue un fondu enchaîné (fade out du morceau en cours + fade in du suivant) de manière fluide et sans artefact audio

### Playlists

- **FR10** : L'utilisateur peut créer une nouvelle playlist
- **FR11** : L'utilisateur peut ajouter et retirer des morceaux d'une playlist
- **FR12** : L'utilisateur peut réordonner les morceaux dans une playlist
- **FR13** : L'utilisateur peut sauvegarder une playlist sur le disque
- **FR14** : L'utilisateur peut charger une playlist sauvegardée
- **FR15** : L'utilisateur peut voir les métadonnées d'un morceau (titre, artiste, durée)

### Interface & Skins

- **FR16** : L'utilisateur voit une interface compacte composée d'une barre de titre, de contrôles de lecture (play/pause/stop/prev/next), d'une barre de progression, d'un affichage des métadonnées (titre, artiste, durée) et d'une liste de lecture, dans une fenêtre unique redimensionnable
- **FR17** : L'utilisateur peut charger et appliquer un skin personnalisé
- **FR18** : L'utilisateur peut revenir au skin par défaut
- **FR19** : Le système fournit au moins un skin par défaut inspiré de l'esthétique Winamp classique

### Jingle & Identité

- **FR20** : Le système joue un jingle original au lancement de l'application (inspiré de "it really whips the llama's ass")
- **FR21** : L'utilisateur peut désactiver le jingle au lancement

### Gestion des Erreurs

- **FR22** : Le système affiche un message clair lorsqu'un format audio non supporté est rencontré
- **FR23** : Le système saute automatiquement les fichiers non supportés sans interrompre la lecture
- **FR24** : Le système maintient la stabilité de la playlist même en cas d'erreurs multiples

### Installation & Mise à Jour

- **FR25** : L'utilisateur peut installer l'application sur Windows, macOS et Linux
- **FR26** : Le système vérifie automatiquement les mises à jour au lancement (si connexion disponible)
- **FR27** : Le système télécharge les mises à jour en arrière-plan sans interrompre la lecture
- **FR28** : Le système applique la mise à jour au prochain lancement de l'application
- **FR29** : Le système fonctionne normalement sans connexion internet (offline-first)

### Landing Page

- **FR30** : Le visiteur peut consulter une page de présentation statique du projet (landing page)
- **FR31** : Le visiteur peut télécharger l'installeur correspondant à son OS depuis la landing page
- **FR32** : La landing page se met à jour automatiquement avec les liens de téléchargement à chaque nouvelle release

### Accessibilité

- **FR33** : L'utilisateur peut naviguer et contrôler toutes les fonctions du player au clavier
- **FR34** : Le système expose les contrôles aux technologies d'assistance (lecteurs d'écran)
- **FR35** : Les skins par défaut respectent un ratio de contraste d'au moins 4.5:1 pour le texte normal et d'au moins 3:1 pour le texte de grande taille, vérifiable via un outil d'analyse de contraste (conformément à WCAG AA)

### Formulaire de Satisfaction

- **FR36** : Le système présente un formulaire de satisfaction opt-in à 3 mois et 12 mois (via le mécanisme de mise à jour)
- **FR37** : L'utilisateur peut ignorer le formulaire sans impact sur l'utilisation du player

### CI/CD & Releases (Mainteneur)

- **FR38** : Le mainteneur peut déclencher un build automatisé pour les 3 plateformes
- **FR39** : Le système génère les artefacts d'installation signés pour les 3 plateformes
- **FR40** : Le mainteneur peut publier une release avec notes de version

## Non-Functional Requirements

### Performance

- **NFR1** : L'application démarre et est prête à l'usage en moins de 5 secondes
- **NFR2** : Le crossfade entre deux morceaux s'exécute sans interruption audible ni artefact audio (craquement, pop, silence) détectable lors d'un test d'écoute manuel sur les 3 plateformes, avec des durées de crossfade de 1s, 6s et 12s
- **NFR3** : Le chargement d'une playlist de 500+ morceaux ne bloque pas l'interface utilisateur
- **NFR4** : La consommation mémoire et CPU sera évaluée via le formulaire de satisfaction — pas de seuil fixe en V1, on fait confiance au framework mais on écoute les retours

### Sécurité

- **NFR5** : Les mises à jour automatiques sont signées et vérifiées côté client avant installation (protection contre les attaques man-in-the-middle)
- **NFR6** : Le canal de distribution des mises à jour utilise HTTPS exclusivement
- **NFR7** : Aucune donnée utilisateur n'est collectée, transmise ou stockée en dehors de la machine locale (zéro télémétrie)
- **NFR8** : Le formulaire de satisfaction ne transmet que les réponses explicitement saisies par l'utilisateur, rien d'autre

### Accessibilité

- **NFR9** : Navigation clavier complète : tous les contrôles de lecture, playlists et skins accessibles via Tab/Entrée/Espace. Les contrôles principaux (play/pause/stop/prev/next/volume) sont navigables, activables au clavier et annoncés par VoiceOver (macOS) et NVDA (Windows) en V1
- **NFR10** : Pas de certification WCAG formelle visée en V1 — amélioration progressive dans une future phase
- **NFR11** : Les skins par défaut respectent un ratio de contraste d'au moins 4.5:1 pour le texte normal et d'au moins 3:1 pour le texte de grande taille, vérifiable via un outil d'analyse de contraste tel que Colour Contrast Analyser (conformément à WCAG AA)
- **NFR12** : L'accessibilité complète (WCAG AA) est un objectif à atteindre dans une phase ultérieure

### Compatibilité

- **NFR13** : L'application fonctionne sur les versions actuelles et n-1 de Windows (10+), macOS (dernières 2 versions majeures) et les distributions Linux majeures (Ubuntu, Fedora, Debian)
- **NFR14** : L'installeur pèse moins de 100 Mo
- **NFR15** : L'installation complète prend moins de 2 minutes sur les 3 plateformes
