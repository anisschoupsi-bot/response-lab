# Response Lab 2.4 — Entraînement cognitif oral par compétences

Site public : https://anisschoupsi-bot.github.io/response-lab/

Application web/PWA gratuite, **local-first** (réponses et scores sauvegardés dans `localStorage`), en français et en anglais. Aucune clé API, serveur de données personnelles ou abonnement supplémentaire. La reconnaissance vocale du navigateur peut **transmettre la voix à son fournisseur** ; la copie vers ChatGPT est volontaire et manuelle.

## Nouveautés 2.4

- **Bibliothèque réelle : 200 objections FR + 200 EN**, dont 150 nouveaux défis originaux par langue ; 40 objections par niveau et par langue (50 historiques + 150 nouvelles = 200).
- **10 négociations par langue**, chacune avec 3 tours ; réponses libres, relances par défaut scénarisées ou manuellement remplacées par une objection générée dans ChatGPT.
- **30 leçons guidées FR/EN** : six compétences × cinq phases, avec objectif et critère de réponse par séance. La leçon du jour commande le choix d'un défi inédit de la compétence concernée.
- **Boucle analyse → correction → nouvel essai** : importer un JSON du coach enrichit la tentative existante ; l'application propose un réessai avec un délai plus souple ou une nouvelle objection de transfert ciblant la compétence choisie par le coach. Les tentatives sont liées par `parentAttemptId`.
- **Tableau de bord par compétence** : nombre d'essais et d'évaluations IA par compétence, séparé par langue et mode (oral/écrit). Aucune note n'est fabriquée.
- **Mode oral prioritaire** : la promotion automatique ne se produit plus à partir d'une performance écrite. L'écriture demeure un mode complémentaire.
- **30 séances validées** (et non simplement 30 dates calendaires), bilan réservé aux étapes 1, 7, 14, 21, 28 et 30.

## Démarrage

1. **Avant mise à jour, exporter l'historique** dans Historique → Export JSON.
2. Tableau de bord → « Exercice oral ciblé » (ou « Démarrer ma séance orale · 20 min » pour la routine complète).
3. Choisir oral avec transcription / oral sans micro / écrit ; écouter/lire l'objection seulement après activation ; répondre **sans correction en direct**.
4. Arrêter le chronomètre, vérifier et corriger **uniquement les erreurs de transcription**, renseigner stress et éventuel blocage ; enregistrer.
5. Cliquer « Copier la fiche pour ChatGPT » (ou « Enregistrer et préparer l'analyse ChatGPT »), ouvrir ChatGPT et coller la fiche ; demander un JSON de retour `cognitive-response-v1`.
6. Coller le JSON dans la tentative enregistrée ; sélectionner « Nouvelle objection ciblée » ou « Réessayer la même objection ».
7. Consulter Progrès → « Progresser par compétence ».

**IMPORTANT** : le champ `attempt_id` du JSON doit rester identique à l'ID de la tentative. Les champs pédagogiques optionnels `priority_skill` et `next_step` personnalisent le transfert ; les anciens retours IA restent importables.

## Données et migration

- Clé inchangée : `response-lab-state-v1` ; sauvegarde JSON inchangée : `response-lab-backup-v1`.
- Ancien historique préservé ; les nouvelles métadonnées de compétence ne sont pas ajoutées arbitrairement aux tentatives historiques : affichage indicatif par inférence de catégorie seulement.
- Historique non envoyé à GitHub ; le dépôt public contient les **énoncés et le code**, pas tes réponses personnelles. Évite de mettre tes sauvegardes JSON dans GitHub.
- Les données ne sont ni chiffrées ni synchronisées entre appareils. Export/import manuel recommandé.
- Réponses enregistrées localement, **pas de fichiers audio**. Le navigateur et son fournisseur de reconnaissance peuvent traiter la voix hors de l'appareil.

## Tests

```bash
python tests/test_regression.py
python tests/test_ai_first.py
python tests/test_speech_first.py
python tests/test_curriculum_v24.py
python tests/test_deployed_assets.py
```

Ces tests simulent la reconnaissance vocale. Ils ne valident ni le microphone réel, ni la qualité de transcription en conditions réelles, ni l'efficacité scientifique du programme sur 30 jours.

Documents : [Guide](GUIDE_UTILISATION.md), [Programme des 30 séances](PROGRAMME_30_SEANCES.md), [Historique des changements](CHANGELOG.md).
