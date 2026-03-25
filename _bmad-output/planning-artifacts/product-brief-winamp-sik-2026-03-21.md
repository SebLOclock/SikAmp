---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-03-21
author: Seb
---

# Product Brief: SikAmp

<!-- Content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

**SikAmp** est un lecteur musical desktop open-source qui ressuscite l'expérience iconique de Winamp pour une nouvelle ère. Né de la nostalgie et porté par une communauté ouverte, il vise à offrir aux fans du légendaire player une alternative moderne, accessible et transparente — sans avoir à fouiller les archives d'Internet ou se contenter de solutions qui ont trahi l'esprit original.

---

## Core Vision

### Problem Statement

Les nostalgiques de Winamp n'ont aujourd'hui aucune solution satisfaisante pour retrouver l'expérience qui les a marqués. Les alternatives actuelles (Spotify, VLC) sont des usines à gaz qui ne reproduisent ni l'esthétique, ni la simplicité, ni l'identité de Winamp. Les plus motivés en sont réduits à chercher d'anciennes versions sur Internet Archive — une démarche peu accessible au commun des mortels.

### Problem Impact

- Une communauté orpheline d'un player qui avait une vraie âme et une identité forte
- La reprise officielle par Llama Group a déçu : code pas réellement ouvert, direction floue, confiance brisée
- Aucune alternative ne combine simplicité, personnalisation (skins) et légèreté dans un client desktop

### Why Existing Solutions Fall Short

| Solution | Limitation |
|---|---|
| Winamp officiel (Llama Group) | Code source controversé, manque de transparence, direction incertaine |
| Spotify / VLC | Pas conçus pour reproduire l'expérience Winamp, trop lourds, pas personnalisables |
| Anciennes versions (Internet Archive) | Accessibilité faible, plus de mises à jour, pas de communauté active |
| Webamp (clone web) | Limité au navigateur, pas un vrai client desktop |

### Proposed Solution

Un lecteur musical desktop open-source qui :
- **Reproduit fidèlement l'expérience Winamp** : skins, gestion simple des playlists, le culte "it really whips the llama's ass"
- **Ajoute une touche 2026** : crossfade entre les morceaux (fade out/fade in simultané à la Spotify)
- **Mise sur l'ouverture totale** : code source open-source dès le jour 1, contributions communautaires bienvenues
- **Reste un client desktop** : une vraie application native, pas un compromis web

### Key Differentiators

1. **Open-source et transparent** — là où Winamp officiel a échoué sur la promesse d'ouverture, SikAmp l'incarne dès le départ
2. **Communauté au centre** — propositions de features, améliorations et correctifs par et pour les utilisateurs
3. **Crossfade natif** — une feature moderne que le Winamp original n'avait pas, inspirée des usages actuels
4. **Accessible à tous** — pas besoin de fouiller la Wayback Machine, juste télécharger et jouer
5. **Scope maîtrisé** — V1 focalisée sur l'essentiel, avec un potentiel d'évolution piloté par la communauté

## Target Users

### Primary Users

**Persona 1 : Marina, 34 ans — La Nostalgique**
- **Contexte** : Née en 1992, Marina a grandi avec Winamp sur le PC familial puis son propre ordi. Ado, elle enchaînait Britney Spears, Evanescence, les OST de Final Fantasy et les openings d'anime. Elle avait son skin préféré et passait des heures à organiser ses playlists.
- **Aujourd'hui** : Elle écoute sur Spotify par défaut, mais ça ne lui procure pas la même sensation. L'interface est froide, impersonnelle. Parfois elle tombe sur un meme Winamp et ça lui serre le cœur.
- **Ce qu'elle veut** : Retrouver cette expérience — lancer SikAmp, entendre "it really whips the llama's ass", charger un skin qui lui rappelle l'époque, et balancer sa playlist sans prise de tête.
- **Moment "aha!"** : La première fois qu'elle ouvre l'app, voit l'interface classique, et entend le jingle. C'est une madeleine de Proust instantanée.

**Persona 2 : Léo, 21 ans — Le Curieux Gen Z**
- **Contexte** : Né en 2005, Léo n'a jamais connu Winamp. Mais il est fasciné par la culture des années 2000 — il a un portable à clapet "pour le style", écoute du Y2K pop, et traîne sur des subreddits rétro.
- **Aujourd'hui** : Il découvre Winamp via des vidéos TikTok/YouTube nostalgiques et des memes. Il veut tester mais installer un vieux logiciel depuis Internet Archive, c'est trop compliqué.
- **Ce qu'il veut** : Un moyen simple de vivre l'expérience Winamp, comprendre ce qui rendait les gens fous, et partager ça avec ses potes.
- **Moment "aha!"** : Quand il personnalise son premier skin et que ses potes lui demandent "c'est quoi ce player trop stylé ?".

### Secondary Users

**Persona 3 : Alex, 29 ans — Le Contributeur Open-Source**
- **Contexte** : Développeur passionné, Alex cherche des projets open-source sympas auxquels contribuer. SikAmp l'attire par son concept nostalgique et son stack technique.
- **Rôle** : Contribue au code, propose des features, fix des bugs. N'est pas nécessairement un utilisateur quotidien du player, mais participe à le rendre meilleur.

### User Journey

| Étape | Marina (Nostalgique) | Léo (Gen Z) |
|---|---|---|
| **Découverte** | Voit un post Reddit/Twitter sur un "nouveau Winamp open-source" | Tombe sur une vidéo TikTok montrant le player |
| **Onboarding** | Télécharge, installe, entend le jingle — émotion immédiate | Télécharge par curiosité, explore les skins |
| **Usage quotidien** | Écoute sa musique locale avec ses playlists, profite du crossfade | Utilise pour le style rétro, partage des screenshots |
| **Moment de valeur** | "C'est exactement comme dans mes souvenirs, mais en mieux" | "Je comprends enfin pourquoi tout le monde kiffait ça" |
| **Long terme** | Player par défaut pour sa musique locale, propose des améliorations | Ambassadeur du projet auprès de sa génération |

## Success Metrics

### Métriques Utilisateur (respectueuses de la vie privée)

- **Téléchargements** — KPI principal, mesurable sans collecte de données personnelles (compteurs GitHub Releases / page de téléchargement)
- **Issues GitHub** — indicateur d'engagement communautaire : bugs remontés, feature requests, discussions
- **Principe éthique fondamental** : zéro collecte de données utilisateur. Pas de télémétrie, pas de tracking. On mesure le succès par ce que les gens font *publiquement* (téléchargements, issues, stars), jamais par ce qu'on collecte sur eux.

### Business Objectives

| Objectif | Priorité |
|---|---|
| Faire plaisir à la communauté nostalgique | Primaire |
| Démontrer la méthode BMAD de bout en bout via un article | Primaire |
| Gagner en visibilité personnelle | Secondaire, opportuniste |

### Key Performance Indicators

| KPI | Cible 3 mois | Cible 12 mois |
|---|---|---|
| Téléchargements | > 1 000 | > 5 000 |
| Contributeurs externes | 1 première contribution | 3 contributeurs |
| Article BMAD | Publié sur sebastienlemoine.fr | — |
| Stars GitHub | Pas de cible fixe (indicateur de tendance) | Pas de cible fixe |
| Issues ouvertes | Activité régulière | Communauté auto-alimentée |

### Alignement stratégique

- Les KPIs respectent le principe éthique : tout est mesurable via les données publiques GitHub
- Le succès de l'article BMAD dépend d'un projet suffisamment abouti (V1 fonctionnelle avec les features clés)
- La croissance communautaire (contributeurs, issues) valide l'approche open-source comme différenciateur

## MVP Scope

### Core Features

| Feature | Description | Justification |
|---|---|---|
| **Lecture audio locale** | Lecture de fichiers audio (MP3, FLAC, WAV, OGG) depuis le disque local | Fonctionnalité fondamentale du player |
| **Interface Winamp classique** | UI fidèle à l'esthétique Winamp (compacte, pixel art, boutons iconiques) | Cœur de l'expérience nostalgique |
| **Système de skins** | Chargement et application de skins personnalisés | Personnalisation = identité Winamp |
| **Gestion de playlists** | Créer, sauvegarder, charger des playlists simples | Usage quotidien essentiel |
| **Jingle culte** | "It really whips the llama's ass" au lancement | Le moment "madeleine de Proust" |
| **Crossfade** | Transition fade out/fade in entre les morceaux | Feature signature 2026, must-have |
| **Multi-plateforme** | Windows, macOS, Linux | Accessibilité maximale dès le jour 1 |

### Out of Scope for MVP

| Feature reportée | Raison | Horizon envisagé |
|---|---|---|
| **Visualiseur audio** | Nice-to-have, pas essentiel à l'expérience de base | V2 |
| **Égaliseur** | Nice-to-have, complexité technique supplémentaire | V2 |
| **Streaming intégré** | Hors du problème initial (musique locale) | V2+ |
| **Échange communautaire de skins/plugins** | Nécessite une infrastructure serveur, prématuré | V2-V3 |
| **Système de plugins** | Architecture à prévoir mais pas à implémenter en V1 | V2-V3 |

### MVP Success Criteria

Le MVP est validé quand les KPIs à 3 mois sont atteints :
- **> 1 000 téléchargements** sur les releases GitHub
- **1 premier contributeur externe** (PR mergée)
- **Article BMAD publié** sur sebastienlemoine.fr
- **Activité régulière** sur les issues GitHub (signe de vie communautaire)

Si ces seuils sont atteints → feu vert pour planifier la V2.

### Future Vision

**V2 (6-12 mois) :**
- Visualiseur audio
- Égaliseur graphique
- Bibliothèque de skins pré-installés

**V3 (12-24 mois) :**
- Plateforme communautaire d'échange de skins et plugins
- Système de plugins extensible
- Streaming intégré (exploration)
