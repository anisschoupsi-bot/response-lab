# Response Lab 3.0 — Cognitive & Verbal Training (prototype autonome)

**Objectif :** entraîner ensemble le repérage de l'information décisive, le raisonnement, la décision, la flexibilité mentale, la formulation orale et la récupération sous pression. L'application est un **outil d'entraînement, pas un test de QI ni un instrument médical**.

## Démarrage

- En ligne : `https://anisschoupsi-bot.github.io/response-lab/v3/` après publication de ce dossier dans le dépôt GitHub Pages.
- En local : télécharge le ZIP, décompresse-le et ouvre `index.html` dans ton navigateur. Les fichiers JavaScript de scénarios sont inclus : ils fonctionnent sans API ou connexion.
- Sur téléphone : ouvre une première fois l'URL en ligne, puis installe depuis le navigateur si proposé ; le service worker met les fichiers de l'application en cache. Teste le mode avion sur ton appareil.
- **Ancienne version préservée** : l'application v2.5.1 reste à la racine ; cette version 3 utilise un stockage distinct (`response-lab-v3-state-v1`) et n'efface pas l'ancien historique.

## Déroulement d'un scénario (7 étapes)

1. Choisir son niveau de pression (4 niveaux) et indiquer son stress ressenti avant.
2. **Attention / compréhension** : identifier le fait ou la vérification décisive parmi trois propositions.
3. **Stratégie** : choisir la première démarche la plus adaptée, parmi trois propositions ; la réponse commande le ton de la relance scénarisée ultérieure.
4. **Réponse orale 1** : répondre spontanément avec un chronomètre visible, facultativement suivre 15 s de régulation respiratoire, et marquer manuellement le début de la parole ou activer le micro local.
5. **Nouveau fait** : une information inattendue change la situation. Choisir la meilleure adaptation parmi trois démarches.
6. **Réponse orale 2** : reformuler une réponse adaptée au nouvel élément. L'interlocuteur scénarisé réagit au **choix de stratégie**, pas à une compréhension automatique de la parole.
7. **Bilan** : précision objective sur les trois choix, temps de clic mesurés, indicateur de début de parole approximatif, auto-vérification de deux critères de réponse, stress ressenti après. Enregistrement local.

Le chronomètre n'exige pas de répondre avant zéro : si la cible est dépassée, l'exercice reste possible afin de ne pas encourager une réponse précipitée. La pression temporelle s'ajuste automatiquement d'un cran après **trois séances comparables, exactes et dans la cible**, sans stress élevé déclaré ; elle est réduite après deux échecs comparables. Réglage manuel toujours disponible.

## 100 scénarios FR/EN

20 situations originales dans chacune des cinq compétences : **attention, raisonnement, décision, flexibilité, réponse sous pression**. Chaque situation dispose d'une version française et anglaise avec une objection/situation, un élément essentiel, deux fausses pistes et une nouvelle information. Ce sont **100 scénarios bilingues** — pas 100 traductions comptées comme scénarios différents.

## Import de nouveaux packs

Depuis « Ajouter des scénarios », importe soit :

1. Un fichier `.json` avec `schema: response-lab-scenario-pack-v1`, `scenarios: [...]`. Chaque objet contient `id`, `domain` (attention, reasoning, decision, flexibility, pressure), et `fr` et/ou `en`. Pour chaque langue : `title`, `cue`, `focus`, `distractor1`, `distractor2`, `twist`. L'interface fournit un modèle téléchargeable.
2. Un fichier `.txt` : une ligne par scénario, six champs séparés par `|` : `titre | situation | élément décisif | fausse piste 1 | fausse piste 2 | nouvelle information`. Choisis la compétence du pack dans l'interface. Un fichier DOCX ou PDF peut être exporté en TXT structuré, mais l'application ne convertit pas automatiquement des documents libres sans IA.

Les imports sont validés (identifiants, domaines, champs, limites de taille) et dédupliqués. Maximum **1 000 scénarios personnalisés**. La bibliothèque initiale reste inchangée. Les données restent sur l'appareil jusqu'à l'export volontaire d'une sauvegarde.

## Mesures et confidentialité

- **Score automatique** : 0–3, uniquement pour les **trois questions à correction déterministe**. Aucune note de qualité orale n'est inventée.
- **Oral** : mesure approximative du premier son détecté quand le micro local est activé, ou marqueur manuel ; elle ne mesure pas directement la vitesse de pensée ou la fluidité orale.
- **Enregistrement audio** : `getUserMedia` + `MediaRecorder`, local en mémoire seulement, facultatif, non envoyé au serveur, non conservé dans l'historique. Pas de reconnaissance vocale Web Speech ni d'appel IA.
- **Stress** : deux déclarations subjectives 0–10 et une courte régulation facultative. Il n'est ni diagnostiqué ni déduit du microphone.
- **Stockage** : localStorage, non chiffré ; export de sauvegardes disponible. Pas de compte, de publicité, de réseau tiers ni de suivi.
- **Limites** : les résultats d'exercices ne prouvent pas une accélération générale de la cognition ; une comparaison sur la durée demande des tâches équivalentes et de la prudence.

## Tests

```bash
node --check assets/app.js
node tests/test_engine.js
python -m pytest tests/test_invariants.py -q
```

Des essais sur de vrais appareils (microphone, installation PWA, mode avion, interface tactile) restent nécessaires. Les tests de moteur sont réalisés dans un DOM simulé ; la navigation Chromium automatisée est bloquée par les politiques du navigateur du conteneur, ce qui est signalé plutôt que caché.