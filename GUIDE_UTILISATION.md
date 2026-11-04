# Response Lab 2.4 — Guide pratique de l'entraînement oral

## Ton objectif

Apprendre à répondre **oralement**, de manière pertinente, brève et assertive, face à une objection inattendue. L'application t'aide à pratiquer et à observer certains indicateurs ; elle ne peut ni mesurer ton intelligence ni garantir une amélioration générale de tes capacités cognitives.

## La méthode la plus simple : 1 objection = 1 boucle complète

**1. Répondre.** Ouvre [Response Lab](https://anisschoupsi-bot.github.io/response-lab/) → **Tableau de bord → Exercice oral ciblé**. L'application choisit une objection correspondant à la compétence du jour et au niveau en cours. Choisis **Oral avec transcription** (ou **Oral sans micro** en cas d'indisponibilité). L'objection et le chronomètre démarrent quand la reconnaissance est prête. Réponds à haute voix, spontanément. N'essaie pas de produire une phrase parfaite.

**2. Conserver les mots réellement prononcés.** Clique **J'ai terminé de parler**. Relis le texte. Corrige uniquement les erreurs de reconnaissance (« contrat » entendu comme « contact », mots oubliés) ; **ne réécris pas** ton argument pour le rendre meilleur après coup. Si tu utilises le mode sans micro, tu peux retranscrire fidèlement ce que tu as dit ; l'analyse IA sera impossible sans texte.

**3. Évaluer le ressenti.** Indique ton stress (0–10, facultatif) et si tu as ressenti un blocage. Tu ne notes **pas** toi-même la pertinence, la logique et la persuasion. Enregistre la tentative.

**4. Faire analyser.** Le bouton « Enregistrer et préparer l'analyse ChatGPT » copie normalement la fiche sur les navigateurs qui autorisent le presse-papiers ; sinon utilise « Copier la fiche pour ChatGPT ». Clique « Ouvrir ChatGPT » ou ouvre ta conversation avec ton **Master Prompt Ultimate v3**, et colle le texte. **Il n'y a pas de connexion directe entre l'application et ChatGPT.** Demande les trois notes et **une** correction concrète.

**5. Importer.** Copie **uniquement le JSON** de ChatGPT et colle-le dans la zone « Importer l'évaluation IA » sous la tentative enregistrée (ou dans Historique). Aucun fichier à fabriquer. Les évaluations enrichissent l'ID existant sans créer une nouvelle tentative.

**6. Appliquer la correction.** Une fois le JSON importé, deux choix sont disponibles :

- **Réessayer la même objection — 30 s ou plus** : consolidation de la nouvelle formulation. C'est un exercice de récupération, non une preuve d'amélioration sur une situation nouvelle.
- **Nouvelle objection ciblée** : défi différent travaillant la compétence sélectionnée (clarifier, prendre position, argumenter, désamorcer, négocier, rebondir). C'est un **transfert d'entraînement**, enregistré et lié à la tentative d'origine.

L'objectif est d'**appliquer une correction précise**, pas d'obtenir un maximum de notes IA.

## Six compétences, cinq étapes

| Compétence | Ce que tu travailles à voix haute |
|---|---|
| Clarifier | Trouver le vrai désaccord, reformuler, poser une question précise |
| Prendre position | Dire oui, non ou une condition avec une justification courte |
| Argumenter | Séparer fait, hypothèse et critère de vérification |
| Désamorcer | Accueillir la tension et répondre sans escalade ni soumission |
| Négocier | Proposer une concession conditionnelle ou une alternative réaliste |
| Rebondir après un blanc | Revenir à une idée simple ou demander une précision après une hésitation |

Le parcours comprend **30 séances**, organisées en cinq phases de six séances : (1) prise de parole, (2) structure, (3) pression dosée, (4) transfert à de nouvelles situations, (5) consolidation. Le programme de chaque séance identifie explicitement une compétence et un critère. La difficulté s'ajuste au stress/aux blocages déclarés et aux résultats oraux évalués, **pas à une note inventée**.

La bibliothèque comporte **200 objections FR et 200 EN**, 40 par niveau (5 niveaux), et **10 scénarios de négociation par langue** à trois tours. L'application limite les répétitions en préférant les situations jamais rencontrées ; après épuisement d'un sous-ensemble, des répétitions espacées peuvent revenir. Ce n'est pas une génération illimitée d'objections.

### Les niveaux

- Niveau 1 : 30 secondes ; niveau 2 : 20 secondes ; niveau 3 : 15 secondes ; niveau 4 : 10 secondes ; niveau 5 : 5 secondes.
- Les niveaux sont **indépendants entre FR et EN**.
- Seules trois objections **orales** chronométrées, distinctes, au même niveau, satisfaisant les critères de qualité, de stress et de délai, peuvent déclencher une montée de niveau.
- Le mode **écrit** n'augmente pas le niveau oral.
- Après un stress très élevé ou des blocages répétés, utilise un délai plus large ; l'objectif n'est pas de forcer la pression.

## Programme quotidien de 20 minutes

Depuis **Tableau de bord → Démarrer ma séance orale · 20 min** :

- 2 min : calibration (langue, niveau, stress si tu veux).
- 3 min : échauffement de 20 secondes sur la compétence du jour.
- 9 min : objections orales ciblées, avec une ou plusieurs boucles d'analyse/correction si le temps le permet.
- 4 min : négociation à trois tours, ou au moins un tour enregistré.
- 2 min : bilan, stress final et consultation de la progression.

Pour valider une séance : **20 minutes effectivement comptabilisées**, au moins **un échauffement**, **une objection chronométrée** et **un tour de négociation** enregistrés dans cette séance. Le chronomètre guide les phases mais ne navigue pas automatiquement entre les modules ; utilise le bouton « Exercice de cette phase ».

Aux séances **1, 7, 14, 21, 28 et 30**, des épreuves de bilan appariées permettent de comparer prudemment une réponse confortable et une réponse sous pression, avec notes ChatGPT si disponibles. Ces comparaisons ne sont pas des mesures psychométriques validées.

## Mode anglais 🇬🇧

Sélectionne **EN · English** en haut à droite **avant de démarrer** un exercice. La reconnaissance vocale est configurée en `en-US` et les exercices sont en anglais. Dans la même application, choisis **FR · Français** pour passer à `fr-FR`. L'interface des boutons demeure majoritairement française. Ne change pas de langue pendant un défi actif : termine-le d'abord.

## Format ChatGPT et exemple

Après avoir collé la fiche générée par l'application, demande : « Note uniquement le contenu observable de ma réponse ; retourne un objet JSON `cognitive-response-v1`, conserve exactement mon `attempt_id` et mon `challenge_id`, choisis une seule correction concrète et une `priority_skill` parmi les six compétences. »

Exemple **illustratif** (les IDs sont ceux que tu obtiens réellement dans l'application) :

```json
{
  "schema": "cognitive-response-v1",
  "language": "FR",
  "attempts": [{
    "attempt_id": "ID_REEL_DE_LA_TENTATIVE",
    "challenge_id": "ID_REEL_DE_L_OBJECTION",
    "relevance_0_4": 3,
    "reasoning_0_4": 2,
    "strategy_0_4": 3,
    "feedback_note": "L'idée est pertinente, mais la preuve manque.",
    "priority_skill": "evidence",
    "next_step": "Cite un fait observable avant ta proposition."
  }]
}
```

N'invente jamais des notes si la transcription est absente. Tu peux conserver seulement les champs classiques si ChatGPT ne comprend pas les nouveaux champs pédagogiques. **N'utilise pas les identifiants fictifs ci-dessus**, sinon l'import ne sera pas relié à ta tentative.

## Tableau de bord

Dans **Progrès**, commence par sélectionner **oral** ou **écrit**. La section **Progresser par compétence** détaille le nombre de tentatives, de notes importées et de blocages signalés, et affiche une moyenne de notes sur 4 **uniquement lorsque l'IA a réellement évalué les réponses**. Les notes ne prouvent pas une amélioration généralisable à la vie réelle. Les chronos de parole détectée par navigateur et de parole signalée par clic ne doivent pas être interprétés comme équivalents à un temps de pensée exact.

## Confidentialité, appareils et dépannage

- Le code et les exercices sont publics sur GitHub ; **tes réponses, évaluations et progrès restent dans le stockage local du navigateur** tant que tu ne les copies/exportes pas volontairement.
- Ce stockage n'est **pas chiffré** ; une personne avec accès à ton appareil/navigateur pourrait le consulter. Ne dicte pas de données confidentielles sur des personnes réelles.
- La reconnaissance vocale est fournie par ton navigateur. Elle peut dépendre d'Internet et envoyer des données audio au prestataire du navigateur. Response Lab **ne conserve pas de fichier audio**.
- Les transcriptions que tu colles dans ChatGPT sont transmises à ChatGPT pour analyse ; elles ne sont pas automatiquement publiques.
- Si le micro est refusé, choisis **Oral sans micro** et saisis une transcription fidèle après l'exercice, ou utilise l'écrit.
- **Historique → Export JSON** pour une sauvegarde complète. Import JSON sur un autre appareil. Les sauvegardes antérieures restent compatibles. **Ne vide jamais le stockage local avant d'avoir exporté tes données**.
- Sur Windows, Chrome/Edge ; sur Android, Chrome compatible. Le support réel de la reconnaissance vocale et les autorisations dépendent du navigateur/appareil. Les tests automatisés simulent un moteur vocal ; ils ne garantissent pas le fonctionnement de ton micro.

**L'application mesure la pratique et aide à corriger la communication orale ; ce n'est ni une thérapie, ni un dispositif médical, ni une mesure validée de la performance cognitive générale.**
