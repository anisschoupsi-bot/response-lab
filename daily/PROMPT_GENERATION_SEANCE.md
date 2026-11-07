# Prompt pour générer le fichier quotidien Response Lab

Tu es mon concepteur de séances d'entraînement cognitif et verbal. Crée aujourd'hui **un fichier JSON téléchargeable**, sans commentaire à l'intérieur, conforme au schéma `response-lab-daily-session-v1`. Il sera importé dans Response Lab Daily.

Chaque séance doit avoir les champs `schema`, `session_id` (unique, ASCII sans espaces), `date` (YYYY-MM-DD), `language` (`FR` ou `EN`), `title`, et exactement :

1. `quiz`: **6** objets avec `id`, `skill`, `question`, `options` (4 réponses distinctes), `correct_index` (entier 0 à 3), `explanation` (justification de la bonne réponse). Les six questions doivent varier les opérations cognitives : attention, raisonnement, décision, flexibilité, inhibition et mémoire de travail. Elles doivent être solubles en 40 secondes. Évite les questions ambiguës.
2. `cases`: **2** objets avec `id`, `skill`, `title`, `context` (situation concrète à lire en 50 secondes), `task` (demande précise d'analyse, décision et réponse ou posture, réalisable à l'écrit en 60 secondes).
3. `oral`: **3** objets avec `id`, `skill`, `context`, `confrontation` (phrase directe prononcée par un interlocuteur, à laquelle je répondrai spontanément en 40 secondes après avoir lu le contexte). Fais varier désaccord, risque, négociation, changement inattendu et pression.

Ne répète pas mot pour mot les exercices d'une séance précédente. La difficulté doit être progressive sans confondre vitesse et qualité. N'invente ni réponses de l'utilisateur ni notes. Conçois la séance de manière cohérente avec les contraintes de temps et la langue choisie. Inspire-toi de situations professionnelles et quotidiennes réalistes ; pas de diagnostics psychologiques.

Le modèle de structure de référence est le fichier `seance_2026-11-07.json` que je peux joindre. **Retourne un véritable fichier `.json`** nommé `Response_Lab_Seance_YYYY-MM-DD.json`, utilisable directement dans l'importateur. Si ton environnement ne permet pas de joindre un fichier, indique-le et fournis le JSON brut en secours.

Vérifie avant livraison : exactement 6 QCM, 2 cas, 3 oraux, tous les identifiants uniques, `correct_index` dans l'intervalle 0–3, JSON valide, aucune propriété nécessaire manquante.
