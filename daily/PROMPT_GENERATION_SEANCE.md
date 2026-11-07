# Prompt de génération quotidienne — Response Lab Daily 2.0

Tu es mon concepteur d'entraînement cognitif et oral. Crée un **véritable fichier JSON téléchargeable** nommé `Response_Lab_Seance_YYYY-MM-DD.json`, conforme au schéma `response-lab-daily-session-v1` (ce schéma reste compatible avec la version Daily 2.0).

La séance contient :

1. `schema`: valeur exacte `response-lab-daily-session-v1`, `session_id`: identifiant unique ASCII sans espaces ni caractères spéciaux, `date`: YYYY-MM-DD, `language`: `FR` ou `EN`, `title`: titre concis, éventuellement `objectives`.
2. `quiz`: **exactement 6** questions à résoudre en **40 secondes chacune** ; chaque objet contient `id` unique, `skill`, `question`, `options` (4 réponses distinctes et non ambiguës), `correct_index` (entier 0 à 3), `explanation` (pourquoi la bonne option convient) et **`option_explanations` (quatre explications indexées, l'une par option, décrivant pourquoi elle convient ou non)**. Faire varier attention, analyse de contraintes, raisonnement, flexibilité, inhibition, décision et mémoire de travail ; éviter de récompenser les intuitions superficielles.
3. `cases`: **exactement 2** situations, `id`, `skill`, `title`, `context`, `task`. **L'utilisateur dispose de 110 secondes CONTINUES pour lire le contexte et rédiger simultanément sa réponse ou sa posture.** Le scénario doit être lisible et traitable dans ce délai ; ne pas imposer d'étape de lecture séparée.
4. `oral`: **exactement 3** confrontations, `id`, `skill`, `context`, `confrontation`, et de préférence `keywords` (liste optionnelle de 3 à 8 termes utiles au contexte pour la reconnaissance vocale, non destinés à imposer des mots à l'utilisateur). Le contexte est visible AVANT le lancement. Réponse orale en 40 secondes. Diversifier négociation, objections, décisions, pression, interruptions et rebondissements crédibles.

Le contenu peut être français ou anglais selon `language`, avec écriture et difficulté cohérentes. Les questions doivent tester de vraies opérations mentales, sans réponses douteuses. Ne répète pas une séance précédente et varie les niveaux. N'invente ni performances ni réponses de l'utilisateur. La correction de l'écrit et de l'oral sera effectuée dans ChatGPT, et la notation finale sera saisie manuellement sur **0–5**.

Valide par un programme ou une inspection : JSON syntaxiquement valide, 6 QCM, 2 cas, 3 oraux, tous les IDs uniques, aucun piège de formulation trompeur, `correct_index` entre 0 et 3, `option_explanations` de longueur 4. Retourne le fichier sans ajouter de texte dans le JSON. Si tu ne peux pas créer le fichier, indique cette limite et affiche le JSON en secours.
