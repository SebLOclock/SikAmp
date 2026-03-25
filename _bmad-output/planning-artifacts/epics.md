---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-21'
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# SikAmp - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SikAmp, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- **FR1** : L'utilisateur peut lire des fichiers audio aux formats MP3, FLAC, WAV et OGG depuis son disque local
- **FR2** : L'utilisateur peut mettre en pause et reprendre la lecture
- **FR3** : L'utilisateur peut passer au morceau suivant ou revenir au precedent
- **FR4** : L'utilisateur peut naviguer dans un morceau (avance/retour rapide)
- **FR5** : L'utilisateur peut regler le volume
- **FR6** : L'utilisateur peut ajouter des fichiers et dossiers par glisser-deposer dans le player
- **FR7** : L'utilisateur peut activer/desactiver le crossfade entre les morceaux
- **FR8** : L'utilisateur peut configurer la duree du crossfade (de 1 a 12 secondes)
- **FR9** : Le systeme effectue un fondu enchaine (fade out du morceau en cours + fade in du suivant) de maniere fluide et sans artefact audio
- **FR10** : L'utilisateur peut creer une nouvelle playlist
- **FR11** : L'utilisateur peut ajouter et retirer des morceaux d'une playlist
- **FR12** : L'utilisateur peut reordonner les morceaux dans une playlist
- **FR13** : L'utilisateur peut sauvegarder une playlist sur le disque
- **FR14** : L'utilisateur peut charger une playlist sauvegardee
- **FR15** : L'utilisateur peut voir les metadonnees d'un morceau (titre, artiste, duree)
- **FR16** : L'utilisateur voit une interface compacte composee d'une barre de titre, de controles de lecture (play/pause/stop/prev/next), d'une barre de progression, d'un affichage des metadonnees (titre, artiste, duree) et d'une liste de lecture, dans une fenetre unique redimensionnable
- **FR17** : L'utilisateur peut charger et appliquer un skin personnalise
- **FR18** : L'utilisateur peut revenir au skin par defaut
- **FR19** : Le systeme fournit au moins un skin par defaut inspire de l'esthetique Winamp classique
- **FR20** : Le systeme joue un jingle original au lancement de l'application (inspire de "it really whips the llama's ass")
- **FR21** : L'utilisateur peut desactiver le jingle au lancement
- **FR22** : Le systeme affiche un message clair lorsqu'un format audio non supporte est rencontre
- **FR23** : Le systeme saute automatiquement les fichiers non supportes sans interrompre la lecture
- **FR24** : Le systeme maintient la stabilite de la playlist meme en cas d'erreurs multiples
- **FR25** : L'utilisateur peut installer l'application sur Windows, macOS et Linux
- **FR26** : Le systeme verifie automatiquement les mises a jour au lancement (si connexion disponible)
- **FR27** : Le systeme telecharge les mises a jour en arriere-plan sans interrompre la lecture
- **FR28** : Le systeme applique la mise a jour au prochain lancement de l'application
- **FR29** : Le systeme fonctionne normalement sans connexion internet (offline-first)
- **FR30** : Le visiteur peut consulter une page de presentation statique du projet (landing page)
- **FR31** : Le visiteur peut telecharger l'installeur correspondant a son OS depuis la landing page
- **FR32** : La landing page se met a jour automatiquement avec les liens de telechargement a chaque nouvelle release
- **FR33** : L'utilisateur peut naviguer et controler toutes les fonctions du player au clavier
- **FR34** : Le systeme expose les controles aux technologies d'assistance (lecteurs d'ecran)
- **FR35** : Les skins par defaut respectent un ratio de contraste d'au moins 4.5:1 pour le texte normal et d'au moins 3:1 pour le texte de grande taille (WCAG AA)
- **FR36** : Le systeme presente un formulaire de satisfaction opt-in a 3 mois et 12 mois (via le mecanisme de mise a jour)
- **FR37** : L'utilisateur peut ignorer le formulaire sans impact sur l'utilisation du player
- **FR38** : Le mainteneur peut declencher un build automatise pour les 3 plateformes
- **FR39** : Le systeme genere les artefacts d'installation signes pour les 3 plateformes
- **FR40** : Le mainteneur peut publier une release avec notes de version

### NonFunctional Requirements

- **NFR1** : L'application demarre et est prete a l'usage en moins de 5 secondes
- **NFR2** : Le crossfade entre deux morceaux s'execute sans interruption audible ni artefact audio (craquement, pop, silence) detectable lors d'un test d'ecoute manuel sur les 3 plateformes, avec des durees de crossfade de 1s, 6s et 12s
- **NFR3** : Le chargement d'une playlist de 500+ morceaux ne bloque pas l'interface utilisateur
- **NFR4** : La consommation memoire et CPU sera evaluee via le formulaire de satisfaction — pas de seuil fixe en V1
- **NFR5** : Les mises a jour automatiques sont signees et verifiees cote client avant installation (protection contre les attaques man-in-the-middle)
- **NFR6** : Le canal de distribution des mises a jour utilise HTTPS exclusivement
- **NFR7** : Aucune donnee utilisateur n'est collectee, transmise ou stockee en dehors de la machine locale (zero telemetrie)
- **NFR8** : Le formulaire de satisfaction ne transmet que les reponses explicitement saisies par l'utilisateur, rien d'autre
- **NFR9** : Navigation clavier complete : tous les controles de lecture, playlists et skins accessibles via Tab/Entree/Espace. Les controles principaux sont navigables, activables au clavier et annonces par VoiceOver (macOS) et NVDA (Windows) en V1
- **NFR10** : Pas de certification WCAG formelle visee en V1 — amelioration progressive dans une future phase
- **NFR11** : Les skins par defaut respectent un ratio de contraste d'au moins 4.5:1 pour le texte normal et d'au moins 3:1 pour le texte de grande taille (WCAG AA)
- **NFR12** : L'accessibilite complete (WCAG AA) est un objectif a atteindre dans une phase ulterieure
- **NFR13** : L'application fonctionne sur les versions actuelles et n-1 de Windows (10+), macOS (dernieres 2 versions majeures) et les distributions Linux majeures (Ubuntu, Fedora, Debian)
- **NFR14** : L'installeur pese moins de 100 Mo
- **NFR15** : L'installation complete prend moins de 2 minutes sur les 3 plateformes

### Additional Requirements

Exigences techniques issues du document d'Architecture :

- **Starter template** : Tauri v2 + Vue.js via `cargo create-tauri-app winamp-sik --template vue` — ceci sera la premiere story d'implementation (Epic 1, Story 1)
- **Stack technique** : Frontend JavaScript + Vue.js 3 + Pinia, Backend Rust (Tauri core), Communication via Tauri IPC
- **Build tooling** : Vite pour le frontend, Cargo pour le backend Rust, Tauri CLI pour le packaging
- **Moteur audio** : Web Audio API — crossfade equal-power via AudioContext + GainNode, deux sources simultanees
- **Parsing skins .wsz** : Rust (crate zip) + extraction temp dir + protocole asset: Tauri
- **Rendu skins** : Canvas 2D — double mode retro (nearest-neighbor) / moderne (anti-aliasing) via imageSmoothingEnabled
- **State management** : Pinia (stores modulaires : usePlayerStore, usePlaylistStore, useSkinStore, usePreferencesStore)
- **Stockage local** : Tauri Store (preferences) + fichiers M3U/M3U8 (playlists)
- **CI/CD** : GitHub Actions + tauri-apps/tauri-action, build matrix 3 OS, declenchement sur push de tag Git
- **Auto-update** : tauri-plugin-updater + latest.json sur GitHub Releases, signature obligatoire
- **Landing page** : GitHub Pages (dossier docs/ ou branche gh-pages)
- **Qualite code** : ESLint + Prettier (JS/Vue), rustfmt + clippy (Rust)
- **Conventions** : code en anglais, UI en francais, tests co-localises, erreurs par fallback silencieux
- **Gap mineur** : decodage FLAC dans WebView2 (Windows) a verifier — fallback possible via lib JS
- **Gap mineur** : skin par defaut embarque en fichiers separes (pas en .wsz) — le SkinRenderer doit supporter les deux sources

### UX Design Requirements

- **UX-DR1** : Composant TitleBar — barre de titre skinnee avec drag pour deplacer la fenetre, boutons minimize/close, etats actif/inactif, labels ARIA "Reduire"/"Fermer"
- **UX-DR2** : Composant Display (Afficheur) — titre scrollant (artiste — titre), temps ecoule/total, bitrate, frequence, stereo/mono, format. Clic sur le temps pour basculer ecoule/restant. Live region ARIA pour lecteurs d'ecran
- **UX-DR3** : Composant SeekBar — barre de progression avec clic pour sauter a une position, drag du curseur pour scrubber. Slider ARIA avec valeur min/max/current, navigable au clavier
- **UX-DR4** : Composant TransportControls — 5 boutons (Previous/Play/Pause/Stop/Next) avec etats normal/hover/pressed/disabled. Sprites skinnes, labels ARIA, navigation clavier
- **UX-DR5** : Composant VolumeSlider — icone volume + slider horizontal, clic sur icone pour mute/unmute. 4 etats visuels (mute/bas/moyen/fort). Slider ARIA 0-100%, label "Volume"
- **UX-DR6** : Composant ActionBar — boutons Shuffle, Repeat, Crossfade (toggles on/off), Skins, Prefs. Role "switch" ARIA avec etat annonce
- **UX-DR7** : Composant PlaylistPanel — panneau detachable avec header, colonnes (#/Titre/Artiste/Duree), liste de morceaux, barre de statut. Role "listbox" ARIA, annonce du nombre de morceaux
- **UX-DR8** : Composant PlaylistItem — ligne individuelle (numero, titre, artiste, duree). Double-clic pour lire, clic droit pour menu, drag pour reordonner. Role "option" ARIA
- **UX-DR9** : Composant PlaylistDropZone — message "Glisse ta musique ici" + icone quand playlist vide, illumination pendant le drag. Label ARIA "Zone de depot de fichiers"
- **UX-DR10** : Composant SkinSelector — panneau de selection avec miniatures, skin actif en surbrillance, drag & drop de .wsz pour ajouter. Role "listbox" ARIA
- **UX-DR11** : Composant ContextMenu — menu contextuel au clic droit avec actions contextuelles. Role "menu" ARIA, navigation fleches + Entree
- **UX-DR12** : Composant FeedbackMessage — messages ephemeres dans l'afficheur (3s). Couleurs semantiques : erreur #FF4444, succes #44FF44, info #4488FF. Live region ARIA "polite"
- **UX-DR13** : Composant PreferencesPanel — panneau minimal : crossfade toggle + slider 1-12s, jingle toggle, mode rendu retro/moderne, volume jingle. Navigation clavier
- **UX-DR14** : Skin par defaut "Classic Faithful" — fond gris metallique #29292E, afficheur noir #000000, texte vert lumineux #00FF00, controles 3D, playlist vert sur noir, morceau actif en blanc. Ratio contraste 15.3:1
- **UX-DR15** : Double mode de rendu — retro (scaling multiples entiers, nearest-neighbor, pas d'animation) et moderne (scaling libre, anti-aliasing, transitions 100-150ms ease-out)
- **UX-DR16** : Systeme de feedback dans l'afficheur — messages remplacent temporairement le titre scrollant (3s), pas de pop-up/modal. En rafale, seul le dernier message est affiche
- **UX-DR17** : Etats des controles — Normal/Hover/Pressed/Disabled/Active(toggle). Transition instantanee en retro, 100ms ease-out en moderne
- **UX-DR18** : Panneau overlay pour SkinSelector et PreferencesPanel — un seul ouvert a la fois, fermeture par bouton/clic dehors/Escape. Apparition instantanee (retro) ou fade-in 150ms (moderne)
- **UX-DR19** : Raccourcis clavier locaux — Espace (play/pause), S (stop), fleches (seek/volume), N/P (next/prev), R (repeat), H (shuffle), X (crossfade), M (mute), Ctrl+S (sauvegarder), Ctrl+O (ouvrir), Ctrl+L (charger playlist)
- **UX-DR20** : Strategie de redimensionnement — taille minimale 800x400px, fenetre principale hauteur fixe/largeur adaptative, playlist prend l'espace vertical restant, colonne Titre s'etire
- **UX-DR21** : Indicateurs de focus — contour pointille 1px (retro) ou contour lisse 2px avec glow (moderne). Jamais masque par le skin, overlay independant
- **UX-DR22** : Respect de `prefers-reduced-motion` — si active cote OS, toutes les animations sont desactivees meme en mode moderne
- **UX-DR23** : Ordre de tabulation : TitleBar → Display → SeekBar → TransportControls → VolumeSlider → ActionBar → PlaylistPanel
- **UX-DR24** : Onboarding premier lancement — jingle joue PENDANT le chargement de l'interface, controles grises/inactifs, message "Glisse ta musique ici" dans la zone centrale, lecture auto au premier drop
- **UX-DR25** : Police bitmap custom pour l'afficheur (inspiree Winamp, pas de reutilisation directe), polices systeme pour playlist/menus/preferences
- **UX-DR26** : Espacement base 2px scale — micro 2px, petit 4px, moyen 8px, grand 12px. Facteur de scale auto selon resolution ecran

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Lecture audio MP3/FLAC/WAV/OGG |
| FR2 | Epic 1 | Pause et reprise |
| FR3 | Epic 1 | Morceau suivant/precedent |
| FR4 | Epic 1 | Navigation dans un morceau (seek) |
| FR5 | Epic 1 | Reglage du volume |
| FR6 | Epic 1 | Drag & drop fichiers/dossiers |
| FR7 | Epic 2 | Activer/desactiver crossfade |
| FR8 | Epic 2 | Configurer duree crossfade 1-12s |
| FR9 | Epic 2 | Fondu enchaine fluide sans artefact |
| FR10 | Epic 3 | Creer une playlist |
| FR11 | Epic 3 | Ajouter/retirer des morceaux |
| FR12 | Epic 3 | Reordonner les morceaux |
| FR13 | Epic 3 | Sauvegarder playlist sur disque |
| FR14 | Epic 3 | Charger playlist sauvegardee |
| FR15 | Epic 1 | Metadonnees (titre, artiste, duree) |
| FR16 | Epic 1 | Interface compacte Winamp |
| FR17 | Epic 4 | Charger/appliquer un skin .wsz |
| FR18 | Epic 4 | Revenir au skin par defaut |
| FR19 | Epic 1 | Skin par defaut Classic Faithful |
| FR20 | Epic 1 | Jingle au lancement |
| FR21 | Epic 1 | Desactiver le jingle |
| FR22 | Epic 1 | Message format non supporte |
| FR23 | Epic 1 | Skip auto fichiers non supportes |
| FR24 | Epic 1 | Stabilite playlist en cas d'erreurs |
| FR25 | Epic 5 | Installation multi-plateforme |
| FR26 | Epic 5 | Verification auto des mises a jour |
| FR27 | Epic 5 | Telechargement MAJ en arriere-plan |
| FR28 | Epic 5 | Application MAJ au prochain lancement |
| FR29 | Epic 1 | Fonctionnement offline-first |
| FR30 | Epic 6 | Landing page statique |
| FR31 | Epic 6 | Telechargement par OS |
| FR32 | Epic 6 | MAJ auto des liens de telechargement |
| FR33 | Epic 1 | Navigation clavier complete |
| FR34 | Epic 1 | Exposition aux technologies d'assistance |
| FR35 | Epic 1 | Contraste WCAG AA du skin par defaut |
| FR36 | Epic 7 | Formulaire satisfaction opt-in |
| FR37 | Epic 7 | Formulaire ignorable |
| FR38 | Epic 5 | Build automatise 3 plateformes |
| FR39 | Epic 5 | Artefacts signes |
| FR40 | Epic 5 | Publication release avec notes |

## Epic List

### Epic 1 : Premier Lancement & Lecture Audio
L'utilisateur lance l'app, entend le jingle, glisse sa musique et ecoute ses morceaux avec l'interface Classic Faithful.
**FRs couverts :** FR1-FR6, FR15, FR16, FR19, FR20, FR21, FR22-FR24, FR29, FR33-FR35

### Epic 2 : Crossfade — La Feature Signature
L'utilisateur profite de transitions fluides et configurables entre ses morceaux, de 1 a 12 secondes.
**FRs couverts :** FR7, FR8, FR9

### Epic 3 : Gestion des Playlists
L'utilisateur cree, organise, sauvegarde et charge ses playlists pour un usage quotidien.
**FRs couverts :** FR10, FR11, FR12, FR13, FR14

### Epic 4 : Skins Personnalises
L'utilisateur charge des skins .wsz communautaires et personnalise l'apparence de son player en un clic.
**FRs couverts :** FR17, FR18

### Epic 5 : Distribution, Installation & Mises a Jour
L'utilisateur installe l'app sur son OS. Le mainteneur publie des releases multi-plateforme via CI/CD. _(Scope révisé : signature retirée, Story 5.3 reportée)_
**FRs couverts :** FR25, FR38, FR40 _(FR26-28 et FR39 reportés avec Story 5.3)_

### Epic 6 : Landing Page
Le visiteur decouvre SikAmp via une page web attractive et telecharge l'installeur pour son OS.
**FRs couverts :** FR30, FR31, FR32

### Epic 7 : Formulaire de Satisfaction
L'utilisateur peut donner son feedback via un formulaire opt-in discret a 3 mois et 12 mois.
**FRs couverts :** FR36, FR37

## Epic 1 : Premier Lancement & Lecture Audio

L'utilisateur lance l'app, entend le jingle, glisse sa musique et ecoute ses morceaux avec l'interface Classic Faithful. Cet epic couvre l'initialisation du projet, le moteur audio, l'interface skinnee, le drag & drop, le jingle, la gestion d'erreurs et l'accessibilite de base.

### Story 1.1 : Initialisation du Projet Tauri + Vue.js

As a developpeur,
I want initialiser le projet SikAmp avec Tauri v2, Vue.js 3, Pinia et le tooling de qualite,
So that la base technique est prete pour construire toutes les features du player.

**Acceptance Criteria:**

**Given** qu'aucun projet n'existe encore
**When** on execute `cargo create-tauri-app winamp-sik --template vue` avec JavaScript comme flavor
**Then** le projet est cree avec la structure `src/` (frontend Vue) et `src-tauri/` (backend Rust)

**Given** le projet initialise
**When** on installe les dependances et on configure le tooling
**Then** Pinia est installe et configure comme state management
**And** ESLint + Prettier sont configures pour JS/Vue
**And** rustfmt + clippy sont configures pour Rust
**And** Vite est configure comme build tool frontend

**Given** la structure de dossiers definie dans l'architecture
**When** on organise le projet
**Then** les dossiers suivants existent : `src/components/player/`, `src/components/playlist/`, `src/components/skin/`, `src/components/shared/`, `src/stores/`, `src/engine/`, `src/utils/`, `src/assets/`, `src-tauri/src/commands/`, `src-tauri/src/skin_parser/`, `src-tauri/src/file_manager/`

**Given** le projet configure
**When** on lance `cargo tauri dev`
**Then** une fenetre d'application s'ouvre en moins de 5 secondes
**And** le hot module replacement fonctionne (modification d'un fichier Vue → rechargement automatique)

### Story 1.2 : Moteur Audio et Lecture de Base

As a utilisateur,
I want lire un fichier audio depuis mon disque,
So that je puisse ecouter ma musique dans SikAmp.

**Acceptance Criteria:**

**Given** l'application lancee
**When** on charge un fichier MP3 via une commande Tauri IPC (`list_audio_files`)
**Then** le fichier est decode par la Web Audio API via un AudioContext
**And** le son est joue a travers les enceintes/casque de l'utilisateur

**Given** un fichier audio en cours de lecture
**When** l'utilisateur clique sur le bouton Pause
**Then** la lecture se met en pause instantanement
**And** un second clic reprend la lecture a la position exacte ou elle a ete mise en pause

**Given** un fichier audio en cours de lecture
**When** l'utilisateur clique sur le bouton Stop
**Then** la lecture s'arrete et la position revient au debut du morceau

**Given** l'AudioEngine initialise
**When** on charge des fichiers aux formats MP3, FLAC, WAV et OGG
**Then** les quatre formats sont lus correctement sans erreur

**Given** le store Pinia `usePlayerStore` cree
**When** l'etat de lecture change (play/pause/stop)
**Then** le store reflette l'etat courant (isPlaying, isPaused, currentTrack)
**And** les composants Vue connectes reagissent aux changements d'etat

### Story 1.3 : Interface Skinnee Classic Faithful

As a utilisateur,
I want voir une interface compacte fidele a l'esthetique Winamp classique,
So that je ressente immediatement la nostalgie du player original.

**Acceptance Criteria:**

**Given** l'application lancee
**When** l'interface s'affiche
**Then** la fenetre principale contient dans l'ordre : barre de titre, afficheur (Display), barre de progression (SeekBar), controles de lecture (TransportControls), slider de volume (VolumeSlider), barre d'actions (ActionBar)
**And** un panneau playlist est affiche sous la fenetre principale

**Given** le skin par defaut Classic Faithful
**When** les composants sont rendus en Canvas 2D
**Then** le fond est gris metallique (#29292E)
**And** l'afficheur a un fond noir (#000000) avec texte vert lumineux (#00FF00)
**And** les controles ont un effet de profondeur 3D (style outset/inset)
**And** le ratio de contraste du texte sur fond est >= 4.5:1 (WCAG AA)

**Given** les assets du skin par defaut embarques dans `src/assets/default-skin/`
**When** le SkinRenderer charge et dessine les sprites
**Then** chaque composant (TitleBar, Display, TransportControls, SeekBar, VolumeSlider, ActionBar) est rendu avec ses sprites correspondants

**Given** le composant Display
**When** un morceau est en lecture
**Then** le titre scrolle horizontalement (artiste — titre) avec la police bitmap custom
**And** le temps ecoule/total est affiche en grand format
**And** le bitrate, la frequence et le mode stereo/mono sont affiches
**And** un clic sur le temps bascule entre temps ecoule et temps restant

**Given** le store `useSkinStore` cree
**When** le skin par defaut est charge
**Then** les chemins vers les assets sont stockes dans le store
**And** tous les composants consomment les assets via le store

### Story 1.4 : Controles de Lecture Complets

As a utilisateur,
I want naviguer dans mes morceaux et controler le volume,
So that j'aie un controle total sur mon experience d'ecoute.

**Acceptance Criteria:**

**Given** un morceau en cours de lecture et une playlist avec plusieurs morceaux
**When** l'utilisateur clique sur le bouton Next
**Then** le morceau suivant de la playlist demarre
**And** les metadonnees (titre, artiste, duree) se mettent a jour dans l'afficheur

**Given** un morceau en cours de lecture et au moins un morceau precedent dans la playlist
**When** l'utilisateur clique sur le bouton Previous
**Then** le morceau precedent de la playlist demarre

**Given** un morceau en cours de lecture
**When** l'utilisateur clique sur la barre de progression (SeekBar) ou drag le curseur
**Then** la lecture saute a la position correspondante dans le morceau
**And** le temps affiche se met a jour instantanement

**Given** un morceau en cours de lecture
**When** l'utilisateur drag le slider de volume
**Then** le volume change en temps reel de 0% a 100%
**And** l'icone de volume change selon le niveau (mute/bas/moyen/fort)

**Given** un morceau en cours de lecture
**When** l'utilisateur clique sur l'icone de volume
**Then** le son est mute (volume 0, icone barree)
**And** un second clic restaure le volume precedent

**Given** un fichier audio charge
**When** les metadonnees sont lues
**Then** le titre, l'artiste et la duree sont affiches dans l'afficheur (Display)
**And** le titre scrolle dans l'afficheur si le texte est plus long que la zone d'affichage

### Story 1.5 : Drag & Drop et Playlist Basique

As a utilisateur,
I want glisser-deposer mes fichiers audio dans le player,
So that je puisse ecouter ma musique immediatement sans configuration.

**Acceptance Criteria:**

**Given** l'application lancee avec une playlist vide
**When** aucun morceau n'est charge
**Then** la zone centrale affiche le message "Glisse ta musique ici" avec une icone
**And** les controles de lecture sont grises/inactifs (disabled)

**Given** l'utilisateur glisse un ou plusieurs fichiers audio sur la fenetre du player
**When** les fichiers survolent la zone de drop
**Then** un feedback visuel immediat apparait (zone illuminee, < 100ms)

**Given** l'utilisateur depose des fichiers audio (MP3, FLAC, WAV, OGG)
**When** le drop est effectue
**Then** les fichiers apparaissent dans la playlist en moins d'1 seconde
**And** la lecture demarre automatiquement sur le premier morceau
**And** le message "Glisse ta musique ici" disparait
**And** les controles s'activent (plus grises)

**Given** l'utilisateur glisse un dossier contenant des fichiers audio
**When** le dossier est depose
**Then** tous les fichiers audio supportes du dossier sont ajoutes a la playlist
**And** les fichiers non-audio sont ignores silencieusement

**Given** une playlist avec des morceaux affiches
**When** l'utilisateur regarde la playlist
**Then** chaque morceau affiche son numero, titre, artiste et duree
**And** le morceau en cours de lecture est mis en surbrillance (highlight fort)
**And** un double-clic sur un morceau lance sa lecture

**Given** une playlist de 500+ morceaux
**When** les fichiers sont charges
**Then** l'interface reste reactive et la lecture demarre des le premier fichier charge (NFR3)
**And** les fichiers restants se chargent progressivement en arriere-plan

**Given** l'application fonctionne
**When** aucune connexion internet n'est disponible
**Then** toutes les fonctions de lecture, playlist et interface fonctionnent normalement (FR29)

### Story 1.6 : Jingle au Lancement

As a utilisateur,
I want entendre un jingle original au lancement de l'app,
So that je vive le moment "madeleine de Proust" des le premier contact.

**Acceptance Criteria:**

**Given** l'application est lancee pour la premiere fois
**When** la fenetre s'affiche
**Then** un jingle original (inspire de "it really whips the llama's ass") joue pendant 1-2 secondes
**And** le jingle joue PENDANT que l'interface se charge (pas d'ecran noir avant)
**And** le fichier jingle est stocke dans `src/assets/jingle.ogg`

**Given** les preferences utilisateur
**When** l'utilisateur desactive le jingle dans les preferences
**Then** le jingle ne joue plus au lancement
**And** la preference est persistee via Tauri Store (sauvegardee entre les sessions)

**Given** le jingle desactive
**When** l'utilisateur reactive le jingle dans les preferences
**Then** le jingle joue a nouveau au prochain lancement

**Given** le `usePreferencesStore` cree
**When** les preferences sont chargees au demarrage
**Then** le store contient l'etat du jingle (actif/inactif)
**And** le store persiste les preferences via Tauri Store plugin

### Story 1.7 : Gestion Gracieuse des Erreurs

As a utilisateur,
I want que le player gere les erreurs sans jamais planter ni interrompre ma musique,
So that j'aie confiance dans la stabilite du player.

**Acceptance Criteria:**

**Given** une playlist contenant un fichier au format non supporte (ex: .wma, .aac)
**When** le player tente de lire ce fichier
**Then** le fichier est saute automatiquement sans interruption de lecture
**And** un message "Format non supporte : [nom_fichier]" s'affiche dans l'afficheur (Display) pendant 3 secondes en couleur erreur (#FF4444)
**And** l'affichage normal du titre reprend apres 3 secondes

**Given** une playlist contenant un fichier corrompu
**When** le player tente de lire ce fichier
**Then** le fichier est saute automatiquement
**And** un message "Impossible de lire : [nom_fichier]" s'affiche pendant 3 secondes

**Given** une playlist contenant un fichier qui a ete deplace ou supprime
**When** le player tente de lire ce fichier
**Then** le fichier est saute automatiquement
**And** un message "Fichier introuvable : [nom_fichier]" s'affiche pendant 3 secondes

**Given** plusieurs erreurs consecutives (ex: 5 fichiers non supportes d'affilee)
**When** les erreurs se produisent en rafale
**Then** seul le dernier message d'erreur est affiche (pas d'empilement)
**And** la playlist reste stable et navigable

**Given** TOUS les fichiers restants de la playlist sont en erreur
**When** le player a epuise les fichiers valides
**Then** la lecture s'arrete proprement
**And** le dernier message d'erreur reste affiche
**And** les controles restent actifs (l'utilisateur peut agir)

**Given** un message d'erreur affiche
**When** l'utilisateur interagit avec le player (clic, raccourci)
**Then** l'interaction est traitee normalement — le message ne bloque JAMAIS l'interaction

### Story 1.8 : Accessibilite Clavier et Lecteurs d'Ecran

As a utilisateur en situation de handicap,
I want naviguer et controler le player entierement au clavier et avec un lecteur d'ecran,
So that je puisse profiter de SikAmp quelle que soit ma situation.

**Acceptance Criteria:**

**Given** l'application lancee avec le focus sur la fenetre
**When** l'utilisateur navigue avec la touche Tab
**Then** le focus suit l'ordre : TitleBar → Display → SeekBar → TransportControls → VolumeSlider → ActionBar → PlaylistPanel
**And** chaque element focusable a un indicateur de focus visible (contour pointille 1px en mode retro)

**Given** le focus sur un bouton de transport (Play/Pause/Stop/Next/Prev)
**When** l'utilisateur appuie sur Entree ou Espace
**Then** l'action correspondante est declenchee

**Given** le focus sur la SeekBar
**When** l'utilisateur appuie sur Fleche droite/gauche
**Then** la position avance/recule de 5 secondes

**Given** le focus sur le VolumeSlider
**When** l'utilisateur appuie sur Fleche haut/bas
**Then** le volume augmente/diminue de 5%

**Given** le focus sur la PlaylistPanel
**When** l'utilisateur navigue avec Fleche haut/bas
**Then** la selection se deplace entre les morceaux
**And** Entree lance la lecture du morceau selectionne

**Given** les raccourcis clavier locaux definis (UX-DR19)
**When** le player a le focus
**Then** Espace = play/pause, S = stop, N = next, P = prev, M = mute, R = repeat, H = shuffle, X = crossfade, Ctrl+S = sauvegarder, Ctrl+O = ouvrir, Ctrl+L = charger playlist

**Given** un lecteur d'ecran actif (VoiceOver macOS ou NVDA Windows)
**When** le focus arrive sur un controle
**Then** le lecteur annonce le label ARIA en francais : "Lecture", "Pause", "Arret", "Morceau precedent", "Morceau suivant", "Volume", "Position dans le morceau", "Lecture aleatoire", "Repetition", "Fondu enchaine"

**Given** un morceau en cours de lecture
**When** le morceau change
**Then** le Display (live region ARIA status) annonce automatiquement le nouveau titre aux lecteurs d'ecran

**Given** un message de feedback (erreur, succes, info)
**When** le message apparait dans l'afficheur
**Then** la live region ARIA "polite" annonce le message aux lecteurs d'ecran

### Story 1.9 : Double Mode de Rendu et Redimensionnement

As a utilisateur,
I want choisir entre un mode retro pixel-perfect et un mode moderne lisse, et redimensionner la fenetre librement,
So that je profite de l'experience visuelle qui me convient sur mon ecran.

**Acceptance Criteria:**

**Given** le panneau de preferences
**When** l'utilisateur bascule le toggle "Mode de rendu"
**Then** le mode retro utilise un scaling par multiples entiers (2x, 3x, 4x) avec nearest-neighbor (pixels nets, pas d'interpolation)
**And** le mode moderne utilise un scaling libre avec anti-aliasing applique aux sprites et textures

**Given** le mode retro actif
**When** les controles changent d'etat (normal → hover → pressed)
**Then** la transition est instantanee, sans animation

**Given** le mode moderne actif
**When** les controles changent d'etat
**Then** la transition dure 100ms avec easing ease-out

**Given** le panneau overlay (SkinSelector ou PreferencesPanel)
**When** il s'ouvre en mode retro
**Then** l'apparition est instantanee
**When** il s'ouvre en mode moderne
**Then** l'apparition est un fade-in de 150ms

**Given** un seul panneau overlay peut etre ouvert a la fois
**When** l'utilisateur ouvre le SkinSelector alors que le PreferencesPanel est ouvert
**Then** le PreferencesPanel se ferme et le SkinSelector s'ouvre
**And** Escape ou clic en dehors ferme le panneau ouvert

**Given** la fenetre du player
**When** l'utilisateur redimensionne la fenetre
**Then** la taille minimale est 800x400 pixels
**And** la fenetre principale (controles + afficheur) a une hauteur fixe, la largeur s'adapte
**And** la playlist prend tout l'espace vertical restant
**And** la colonne "Titre" s'etire, "Artiste" et "Duree" gardent leur largeur fixe

**Given** la taille et position de la fenetre
**When** l'utilisateur quitte l'application
**Then** la taille et la position sont sauvegardees via Tauri Store
**And** au prochain lancement, la fenetre s'ouvre aux memes dimensions et position

**Given** l'utilisateur a active `prefers-reduced-motion` dans son OS
**When** le mode moderne est actif
**Then** toutes les animations sont desactivees (transitions instantanees comme en mode retro)

**Given** le premier lancement sur un ecran donne
**When** le facteur de scale est determine automatiquement
**Then** l'interface choisit 2x pour Full HD, 3x pour 4K

## Epic 2 : Crossfade — La Feature Signature

L'utilisateur profite de transitions fluides et configurables entre ses morceaux. Le crossfade est le deal-breaker du projet — la feature qui ancre SikAmp en 2026.

### Story 2.1 : Crossfade Equal-Power entre Morceaux

As a utilisateur,
I want que mes morceaux s'enchainent avec un fondu enchaine fluide,
So that mon experience d'ecoute soit continue et sans rupture.

**Acceptance Criteria:**

**Given** le crossfade active (toggle ON dans l'ActionBar)
**When** un morceau approche de sa fin (temps restant <= duree du crossfade)
**Then** le morceau en cours commence un fade out progressif (courbe equal-power via GainNode)
**And** le morceau suivant demarre simultanement avec un fade in progressif
**And** les deux sources audio jouent en parallele pendant la duree du crossfade
**And** la transition est fluide, sans artefact audio (pas de craquement, pop, silence ou coupure)

**Given** le crossfade active
**When** la transition se termine
**Then** l'afficheur (Display) met a jour les metadonnees du nouveau morceau (titre, artiste, duree)
**And** la barre de progression repart a zero pour le nouveau morceau

**Given** le crossfade desactive (toggle OFF dans l'ActionBar)
**When** un morceau se termine
**Then** le morceau suivant enchaine directement sans fondu (comportement classique)

**Given** le bouton Crossfade dans l'ActionBar
**When** l'utilisateur clique dessus
**Then** le toggle bascule entre ON (visuellement distinct, accentue) et OFF (normal)
**And** le changement prend effet immediatement pour la prochaine transition
**And** l'etat est annonce par les lecteurs d'ecran via le role "switch" ARIA

**Given** le crossfade active et l'utilisateur clique sur Next
**When** le morceau suivant est force manuellement
**Then** le crossfade s'applique egalement (fade out du morceau en cours + fade in du suivant)

**Given** le crossfade active et le morceau suivant est en erreur (format non supporte, corrompu)
**When** le systeme skip le morceau en erreur
**Then** le crossfade s'applique au prochain morceau valide dans la playlist

**Given** le crossfade teste sur les 3 plateformes (Windows, macOS, Linux)
**When** on joue une transition avec des durees de 1s, 6s et 12s
**Then** aucune interruption audible ni artefact n'est detecte lors d'un test d'ecoute manuel (NFR2)

### Story 2.2 : Configuration de la Duree du Crossfade

As a utilisateur,
I want regler la duree du crossfade entre 1 et 12 secondes,
So that je personnalise la fluidite des transitions selon mes gouts.

**Acceptance Criteria:**

**Given** le panneau de preferences ouvert
**When** l'utilisateur voit la section crossfade
**Then** un toggle on/off est affiche pour activer/desactiver le crossfade
**And** un slider de duree est affiche avec une plage de 1 a 12 secondes
**And** la valeur courante est affichee a cote du slider

**Given** le slider de duree du crossfade
**When** l'utilisateur drag le slider ou clique sur une position
**Then** la duree change en temps reel
**And** le changement prend effet a la prochaine transition (pas de perturbation de la transition en cours)

**Given** une duree de crossfade configuree
**When** l'utilisateur quitte l'application
**Then** la duree est persistee via Tauri Store (usePreferencesStore)
**And** au prochain lancement, la duree est restauree

**Given** le crossfade desactive via le toggle des preferences
**When** l'utilisateur regarde l'ActionBar
**Then** le bouton Crossfade de l'ActionBar reflette l'etat OFF
**And** les deux controles (ActionBar toggle et preferences toggle) sont synchronises

**Given** le slider de duree dans les preferences
**When** l'utilisateur navigue au clavier
**Then** le slider est focusable via Tab
**And** Fleche gauche/droite ajuste la duree par pas de 1 seconde
**And** le label ARIA annonce "Duree du fondu enchaine : [N] secondes"

## Epic 3 : Gestion des Playlists

L'utilisateur cree, organise, sauvegarde et charge ses playlists pour un usage quotidien. La playlist basique de l'Epic 1 devient un outil complet de gestion de musique.

### Story 3.1 : Creer et Editer des Playlists

As a utilisateur,
I want creer des playlists et en organiser le contenu,
So that je puisse structurer ma musique selon mes envies.

**Acceptance Criteria:**

**Given** une playlist en cours
**When** l'utilisateur cree une nouvelle playlist (via menu contextuel ou Ctrl+N)
**Then** la playlist courante est videe
**And** le message "Glisse ta musique ici" reapparait
**And** la lecture s'arrete si un morceau etait en cours

**Given** une playlist avec des morceaux
**When** l'utilisateur selectionne un morceau et choisit "Retirer" (clic droit ou touche Suppr)
**Then** le morceau est retire de la playlist (pas du disque)
**And** si c'etait le morceau en cours de lecture, la lecture passe au suivant

**Given** une playlist avec des morceaux
**When** l'utilisateur choisit "Retirer tout" dans le menu contextuel
**Then** tous les morceaux sont retires de la playlist
**And** le message "Glisse ta musique ici" reapparait

**Given** une playlist avec plusieurs morceaux
**When** l'utilisateur grab un morceau et le drag vers une autre position
**Then** le morceau est reordonne a la nouvelle position
**And** la numerotation se met a jour
**And** si un morceau est en cours de lecture, la lecture n'est pas interrompue

**Given** une playlist en cours de lecture
**When** l'utilisateur ajoute de nouveaux fichiers par drag & drop
**Then** les fichiers sont ajoutes en fin de playlist
**And** la lecture en cours n'est jamais interrompue

### Story 3.2 : Sauvegarder et Charger des Playlists

As a utilisateur,
I want sauvegarder mes playlists sur le disque et les recharger plus tard,
So that je retrouve mes selections de musique d'une session a l'autre.

**Acceptance Criteria:**

**Given** une playlist avec des morceaux
**When** l'utilisateur sauvegarde la playlist (Ctrl+S ou menu contextuel "Sauvegarder")
**And** la playlist n'a pas encore de nom
**Then** une boite de dialogue demande le nom de la playlist
**And** la playlist est ecrite au format M3U/M3U8 via la commande Tauri IPC `save_playlist`
**And** un message "Playlist sauvegardee" s'affiche dans l'afficheur pendant 3 secondes (couleur succes #44FF44)

**Given** une playlist deja nommee et sauvegardee
**When** l'utilisateur sauvegarde a nouveau (Ctrl+S)
**Then** la sauvegarde est instantanee (pas de dialogue de nom)
**And** le fichier M3U/M3U8 existant est mis a jour

**Given** l'utilisateur veut charger une playlist
**When** il utilise Ctrl+L ou le menu contextuel "Charger playlist"
**Then** le selecteur de fichier natif de l'OS s'ouvre
**And** seuls les fichiers M3U/M3U8 sont affiches par defaut

**Given** un fichier M3U/M3U8 valide selectionne
**When** la playlist est chargee via la commande Tauri IPC `load_playlist`
**Then** les morceaux de la playlist apparaissent dans le panneau playlist
**And** la lecture est prete (controles actifs)
**And** les fichiers introuvables dans la playlist sont marques visuellement (grises)

**Given** l'utilisateur annule le selecteur de fichier
**When** aucun fichier n'est selectionne
**Then** la playlist courante reste inchangee

### Story 3.3 : Menu Contextuel Playlist

As a utilisateur,
I want acceder aux actions de playlist via un clic droit,
So that je puisse gerer ma musique rapidement sans quitter le player.

**Acceptance Criteria:**

**Given** la zone de playlist
**When** l'utilisateur fait un clic droit
**Then** un menu contextuel apparait positionne au curseur
**And** le menu contient les options : "Ouvrir fichier", "Ouvrir dossier", "Nouvelle playlist", "Sauvegarder playlist", "Charger playlist", "Retirer le morceau", "Retirer tout"

**Given** le clic droit sur un morceau specifique
**When** le menu contextuel s'affiche
**Then** l'option "Retirer le morceau" est disponible et cible le morceau clique

**Given** le menu contextuel ouvert
**When** l'utilisateur clique sur une option
**Then** l'action correspondante est executee
**And** le menu se ferme

**Given** le menu contextuel ouvert
**When** l'utilisateur clique en dehors du menu ou appuie sur Escape
**Then** le menu se ferme sans action

**Given** le menu contextuel
**When** l'utilisateur navigue au clavier (Shift+F10 ou touche Menu pour ouvrir)
**Then** les fleches haut/bas parcourent les options
**And** Entree selectionne l'option focusee
**And** le role ARIA "menu" est expose avec chaque option en role "menuitem"

**Given** l'option "Ouvrir fichier" selectionnee
**When** l'utilisateur clique dessus
**Then** le selecteur de fichier natif s'ouvre filtre sur les formats audio supportes (MP3, FLAC, WAV, OGG)
**And** les fichiers selectionnes sont ajoutes a la playlist courante

## Epic 4 : Skins Personnalises

L'utilisateur charge des skins .wsz communautaires et personnalise l'apparence de son player en un clic. Le moment ou l'outil devient "son" outil.

### Story 4.1 : Parseur de Skins .wsz et Chargement

As a utilisateur,
I want charger un skin .wsz pour transformer l'apparence de mon player,
So that je personnalise SikAmp selon mes gouts.

**Acceptance Criteria:**

**Given** un fichier .wsz disponible sur le disque de l'utilisateur
**When** le skin est charge via la commande Tauri IPC `parse_skin`
**Then** le backend Rust decompresse l'archive ZIP (.wsz) dans un dossier temporaire local
**And** les chemins des assets extraits (sprites, textures, polices bitmap) sont retournes au frontend

**Given** les assets d'un skin extraits
**When** le `useSkinStore` recoit les chemins
**Then** les assets sont charges via le protocole `asset:` de Tauri
**And** le `skinRenderer` redessine tous les composants Canvas 2D avec les nouveaux sprites
**And** la transformation de l'interface est instantanee (pas de rechargement, pas de flash blanc)

**Given** un morceau en cours de lecture
**When** un nouveau skin est applique
**Then** la lecture audio n'est JAMAIS interrompue
**And** l'interface se transforme pendant que la musique continue

**Given** l'utilisateur glisse un fichier .wsz directement sur la fenetre du player
**When** le fichier est depose
**Then** le skin est parse, charge et applique instantanement
**And** le fichier .wsz est copie dans le dossier de skins de l'utilisateur pour usage futur

**Given** un fichier .wsz invalide ou corrompu
**When** le parseur Rust tente de le decompresser
**Then** le skin actuel est conserve (fallback silencieux)
**And** un message "Skin invalide : [nom_fichier]" s'affiche dans l'afficheur pendant 3 secondes (#FF4444)

**Given** un skin .wsz avec des assets manquants ou incomplets
**When** le renderer tente de charger les sprites
**Then** les sprites manquants utilisent les assets du skin par defaut comme fallback
**And** l'interface reste fonctionnelle et coherente

**Given** un skin applique avec succes
**When** le changement est confirme
**Then** le choix du skin est persiste via Tauri Store (usePreferencesStore)
**And** au prochain lancement, ce skin est charge automatiquement

### Story 4.2 : Selecteur de Skins et Retour au Defaut

As a utilisateur,
I want parcourir mes skins disponibles et revenir au skin par defaut,
So that je puisse explorer et choisir l'apparence qui me plait.

**Acceptance Criteria:**

**Given** l'utilisateur clique sur le bouton "Skins" dans l'ActionBar
**When** le panneau SkinSelector s'ouvre
**Then** il apparait en overlay au-dessus du player (style du skin actif)
**And** il affiche la liste des skins disponibles
**And** le skin par defaut "Classic Faithful" est en tete de liste
**And** le skin actif est en surbrillance

**Given** le panneau SkinSelector ouvert
**When** l'utilisateur clique sur un skin dans la liste
**Then** le skin est applique instantanement (preview en temps reel)
**And** le panneau SkinSelector lui-meme change d'apparence avec le nouveau skin

**Given** le panneau SkinSelector ouvert
**When** l'utilisateur clique sur "Classic Faithful" (skin par defaut)
**Then** l'interface revient instantanement a l'apparence par defaut (FR18)

**Given** le panneau SkinSelector ouvert
**When** l'utilisateur clique en dehors du panneau, re-clique sur le bouton Skins, ou appuie sur Escape
**Then** le panneau se ferme
**And** le dernier skin applique est conserve

**Given** le dossier de skins de l'utilisateur
**When** le SkinSelector s'ouvre
**Then** la liste est peuplee via la commande Tauri IPC `list_skins`
**And** les skins sont affiches avec leur nom

**Given** le SkinSelector ouvert
**When** l'utilisateur navigue au clavier
**Then** Tab donne le focus a la liste, fleches haut/bas parcourent les skins
**And** Entree applique le skin selectionne
**And** le role ARIA "listbox" est expose avec chaque skin en role "option"
**And** le skin selectionne est annonce par les lecteurs d'ecran

**Given** le PreferencesPanel est deja ouvert
**When** l'utilisateur clique sur le bouton Skins
**Then** le PreferencesPanel se ferme et le SkinSelector s'ouvre (un seul panneau a la fois)

## Epic 5 : Distribution, Installation & Mises a Jour

L'utilisateur installe l'app sur son OS. Le mainteneur publie des releases multi-plateforme via CI/CD.

> **Scope révisé (rétro Epic 4, 2026-03-25) :** Signature de code retirée (pas de licence Apple Developer / Authenticode pour un side project solo). Story 5.3 (Auto-Update Signé) reportée — dépend de la signature.

### Story 5.1 : Pipeline CI/CD Multi-Plateforme

As a mainteneur,
I want un pipeline automatise qui build SikAmp pour Windows, macOS et Linux,
So that chaque release produise des installeurs pour les 3 plateformes.

**Acceptance Criteria:**

**Given** le repository GitHub configure
**When** un workflow CI est cree dans `.github/workflows/ci.yml`
**Then** il se declenche sur chaque pull request
**And** il execute ESLint + Prettier sur le code JS/Vue
**And** il execute rustfmt + clippy sur le code Rust
**And** il execute les tests JS et Rust

**Given** le workflow de release dans `.github/workflows/release.yml`
**When** un tag Git est pousse (ex: `v1.0.0`)
**Then** le workflow se declenche automatiquement
**And** il build en parallele sur 3 runners : windows-latest, macos-latest, ubuntu-latest
**And** il utilise `tauri-apps/tauri-action` pour le build et le packaging

**Given** le build termine sur les 3 plateformes
**When** les artefacts sont generes
**Then** Windows produit un installeur .exe (non signe)
**And** macOS produit un .dmg (non signe)
**And** Linux produit un AppImage et un .deb
**And** chaque installeur pese moins de 100 Mo (NFR14)

**Given** les artefacts generes
**When** le workflow termine
**Then** les artefacts sont uploades en tant que draft release sur GitHub Releases
**And** un fichier `latest.json` est genere pour le systeme d'auto-update

### Story 5.2 : Publication de Releases

As a mainteneur,
I want publier une release avec des notes de version,
So that les utilisateurs puissent telecharger la derniere version de SikAmp.

**Acceptance Criteria:**

**Given** une draft release creee par le pipeline CI/CD avec les artefacts des 3 plateformes
**When** le mainteneur ouvre la draft release sur GitHub
**Then** il peut rediger les release notes (nouvelles features, bugs fixes, contributeurs remercies)
**And** il peut verifier la presence des artefacts pour les 3 OS

**Given** les release notes redigees
**When** le mainteneur publie la release
**Then** la release est visible publiquement sur GitHub Releases
**And** les liens de telechargement sont accessibles pour chaque OS
**And** le fichier `latest.json` est disponible pour le systeme d'auto-update

**Given** l'installation sur chaque plateforme
**When** l'utilisateur telecharge et installe l'artefact correspondant a son OS
**Then** l'installation se complete en moins de 2 minutes (NFR15)
**And** l'application se lance correctement apres installation

### Story 5.3 : Auto-Update Signe [REPORTÉE]

> **Reportée (rétro Epic 4, 2026-03-25) :** Dépend de la signature de code (licence Apple Developer / Authenticode). Sera réintroduite si le projet justifie l'investissement.

~~As a utilisateur,
I want recevoir les mises a jour automatiquement sans interrompre mon ecoute,
So that j'aie toujours la derniere version sans effort.~~

<details><summary>Acceptance Criteria (gelés)</summary>

**Given** l'application lancee avec une connexion internet disponible
**When** le systeme verifie les mises a jour au demarrage
**Then** `tauri-plugin-updater` consulte le fichier `latest.json` sur GitHub Releases via HTTPS exclusivement (NFR6)
**And** la verification est silencieuse (pas de blocage de l'interface)

**Given** une mise a jour disponible
**When** le systeme detecte une version plus recente
**Then** une notification discrète s'affiche dans l'afficheur : "Mise a jour disponible" (couleur info #4488FF, 3 secondes)
**And** la mise a jour se telecharge en arriere-plan sans interrompre la lecture (FR27)

**Given** une mise a jour telechargee
**When** le telechargement est termine
**Then** la mise a jour est verifiee (signature validee cote client avant installation — NFR5)
**And** la mise a jour n'est PAS appliquee immediatement

**Given** une mise a jour prete a etre installee
**When** l'utilisateur quitte et relance l'application
**Then** la mise a jour est appliquee automatiquement au lancement (FR28)
**And** l'application demarre avec la nouvelle version

**Given** aucune connexion internet disponible
**When** le systeme tente de verifier les mises a jour
**Then** la verification est silencieusement ignoree (pas de message d'erreur)
**And** toutes les fonctions du player restent operationnelles (offline-first)

**Given** une mise a jour avec une signature invalide
**When** la verification echoue
**Then** la mise a jour est rejetee silencieusement
**And** aucun message n'est affiche a l'utilisateur
**And** l'application continue de fonctionner normalement avec la version actuelle

**Given** le systeme d'auto-update
**When** des donnees sont transmises au serveur
**Then** aucune donnee utilisateur n'est envoyee — seule la version actuelle est communiquee pour la comparaison (NFR7)

</details>

## Epic 6 : Landing Page

Le visiteur decouvre SikAmp via une page web attractive et telecharge l'installeur pour son OS. C'est le premier point de contact avec le projet.

### Story 6.1 : Landing Page Statique avec Telechargement par OS

As a visiteur,
I want decouvrir SikAmp sur une page web attractive et telecharger l'installeur pour mon OS,
So that je puisse installer et essayer le player rapidement.

**Acceptance Criteria:**

**Given** la page hebergee sur GitHub Pages (dossier `docs/` ou branche gh-pages)
**When** un visiteur accede a l'URL du projet
**Then** une landing page statique s'affiche avec un design inspire de l'esthetique Y2K/retro
**And** le logo du projet est visible
**And** le pitch "Et si Winamp etait sorti en 2026 ?" est affiche clairement
**And** une description courte du projet est presentee

**Given** la landing page chargee
**When** le visiteur voit la section de telechargement
**Then** des boutons de telechargement sont affiches pour Windows (.exe), macOS (.dmg) et Linux (AppImage/.deb)
**And** le bouton correspondant a l'OS detecte du visiteur est mis en avant visuellement

**Given** une nouvelle release publiee sur GitHub Releases
**When** le workflow CI/CD termine
**Then** les liens de telechargement sur la landing page sont automatiquement mis a jour pour pointer vers les derniers artefacts (FR32)
**And** aucune intervention manuelle n'est necessaire pour mettre a jour les liens

**Given** le visiteur clique sur un bouton de telechargement
**When** le telechargement se lance
**Then** l'installeur correspondant a l'OS selectionne est telecharge depuis GitHub Releases
**And** le lien pointe directement vers l'artefact (pas de redirection intermediaire)

**Given** la landing page
**When** elle est indexee par les moteurs de recherche
**Then** les balises meta (title, description, og:image) sont configurees pour le SEO
**And** la page est accessible et lisible sans JavaScript

**Given** la landing page sur mobile
**When** un visiteur accede depuis un telephone
**Then** la page est responsive et lisible
**And** les boutons de telechargement desktop sont visibles avec une mention "Application desktop uniquement"

## Epic 7 : Formulaire de Satisfaction

L'utilisateur peut donner son feedback via un formulaire opt-in discret a 3 mois et 12 mois, permettant d'alimenter la roadmap V2.

### Story 7.1 : Formulaire de Satisfaction Opt-In

As a utilisateur,
I want pouvoir donner mon avis sur SikAmp via un formulaire simple,
So that mes retours contribuent a ameliorer le player.

**Acceptance Criteria:**

**Given** l'application installee depuis 3 mois (premiere campagne) ou 12 mois (deuxieme campagne)
**When** une mise a jour est detectee et le delai est atteint
**Then** un formulaire de satisfaction opt-in est propose a l'utilisateur
**And** la proposition est discrète : un message dans l'afficheur "Votre avis nous interesse" avec un lien/bouton pour ouvrir le formulaire

**Given** le formulaire propose
**When** l'utilisateur choisit de l'ignorer
**Then** le message disparait apres 3 secondes
**And** aucun impact sur l'utilisation du player (FR37)
**And** le formulaire n'est pas repropose avant la prochaine campagne prevue

**Given** l'utilisateur ouvre le formulaire
**When** le formulaire s'affiche
**Then** il contient des questions qualitatives et emotionnelles : "Qu'avez-vous ressenti ?", "Quel souvenir ca vous a rappele ?", "Qu'est-ce qui manque ?"
**And** tous les champs sont optionnels
**And** un bouton "Envoyer" et un bouton "Annuler" sont presents

**Given** l'utilisateur remplit et envoie le formulaire
**When** les reponses sont transmises
**Then** seules les reponses explicitement saisies par l'utilisateur sont envoyees (NFR8)
**And** aucune donnee systeme, metadonnee ou information d'usage n'est ajoutee a l'envoi
**And** la transmission se fait via HTTPS
**And** un message "Merci pour votre retour !" s'affiche (couleur succes #44FF44, 3 secondes)

**Given** l'utilisateur annule le formulaire
**When** il clique sur "Annuler" ou ferme le panneau
**Then** aucune donnee n'est transmise
**And** le player reprend son fonctionnement normal

**Given** aucune connexion internet disponible
**When** le delai de campagne est atteint
**Then** le formulaire n'est pas propose (pas de message d'erreur)
**And** le player fonctionne normalement
