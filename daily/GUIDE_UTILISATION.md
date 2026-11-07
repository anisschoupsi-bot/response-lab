# Guide — Response Lab Daily

1. Ouvre **Séance quotidienne** et importe le fichier `.json` reçu du coach. Pour un premier essai, clique sur **Essayer la séance modèle**.
2. Effectue les six QCM. Le compte à rebours de **40 s commence au clic** sur « Commencer la question ». Chaque sélection affiche aussitôt la bonne réponse et sa justification.
3. Réalise les deux cas. Au clic sur « Afficher le contexte », le texte apparaît pour **50 s** de lecture. La zone de rédaction se déverrouille automatiquement ensuite pour **60 s**. Les brouillons sont sauvegardés pendant la saisie.
4. Réalise les trois confrontations orales. Lis librement le contexte **avant** de démarrer. Clique sur **« Activer le micro et démarrer »** : le temps commence seulement lorsque le navigateur confirme la reconnaissance. Parle pendant **40 s**, relis le texte transcrit et corrige uniquement les erreurs de reconnaissance. Sans micro, utilise le mode secours (parole chronométrée, puis saisie manuelle).
5. Une fois les 11 exercices achevés, clique sur **Télécharger le fichier de mes réponses**. Joins ce fichier au coach ChatGPT et demande une correction par identifiant d'exercice.
6. Dans le bilan, entre **manuellement chaque note 0–4** et éventuellement le conseil du coach, sans collage de JSON. Les notes sont sauvegardées automatiquement.

## Détail du fichier quotidien

Il doit avoir `schema: "response-lab-daily-session-v1"`, un identifiant `session_id`, `date` YYYY-MM-DD, `language: "FR"` ou `"EN"`, un `title` et :

- `quiz`: tableau de **6** objets contenant `id`, `skill`, `question`, `options` (4 choix), `correct_index` (de 0 à 3), `explanation`.
- `cases`: tableau de **2** objets contenant `id`, `skill`, `title`, `context`, `task`.
- `oral`: tableau de **3** objets contenant `id`, `skill`, `context`, `confrontation`.

La bibliothèque journalière est extensible par fichiers, sans modification du code. Une réimportation du même `session_id` ouvre la séance enregistrée au lieu d'effacer les réponses.

## Précisions techniques

La reconnaissance vocale dépend du navigateur ; son traitement peut être distant. En cas d'indisponibilité, l'application ne prétend pas que le mode manuel est une transcription automatique. L'audio brut n'est pas stocké. L'export conserve la transcription originale séparément de la transcription corrigée. Les résultats sont locaux à l'appareil et au navigateur ; ne vide pas son stockage sans avoir exporté tes réponses.
