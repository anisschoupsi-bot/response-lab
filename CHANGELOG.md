# 2.5 — Évaluation ChatGPT par fichiers

- Télécharger une tentative unique `.json` à la fin de chaque exercice, ou depuis Historique.
- Fichier de demande minimal avec objectif, objection et transcription, ainsi que le modèle de réponse du coach.
- Import direct du fichier JSON d’évaluation dans l’historique, fusion sur `attempt_id` et compatibilité des anciennes sauvegardes.
- Copier/coller conservé comme solution alternative.
- Libellés et guide adaptés au nouveau parcours ; cache PWA renouvelé.

# Journal des versions — Response Lab

## 2.4 · Compétences, profondeur pédagogique et transfert

**Bibliothèque et programme**

- +150 objections originales par langue : **200 FR + 200 EN** ; 40 par niveau, six compétences explicitement entraînées.
- +6 négociations scénarisées par langue : **10 FR + 10 EN**, à trois échanges chacune.
- 30 leçons structurées par phase avec un objectif, une technique et un critère observable.
- Échauffements liés à la compétence du jour, sélection de défis ciblés et préférence aux objections non encore vues.

**Boucle de correction**

- Après import du JSON ChatGPT : notes, faiblesse/compétence prioritaire et micro-consigne sur la tentative existante.
- Nouveau bouton **« Nouvelle objection ciblée »** : autre situation pour appliquer le même apprentissage ; lien explicite `parentAttemptId` avec l'essai précédent.
- Réessai de consolidation sur la même objection (délai élargi), et reprise possible depuis l'historique.
- Champs optionnels `priority_skill`, `next_step` dans `cognitive-response-v1` ; **compatibilité conservée** avec les JSON des versions précédentes.
- Correction du texte après coup → les anciennes notes du coach et l'ancienne recommandation sont invalidées.
- Tableau de progression **par compétence**, par langue et par modalité. Aucun score inventé.

**Fiabilité / UX**

- Seuls les entraînements oraux évalués peuvent provoquer une promotion automatique du niveau oral. Le mode écrit reste complémentaire.
- Prévention de changement de langue pendant une réponse active ; la transcription est conservée et le microphone n'est pas abandonné silencieusement.
- Références CSS rendues explicites dans le code déployé ; cache PWA actualisé pour les nouveaux modules.
- Tests navigateur, contenu, rétrocompatibilité, résistance HTML malveillant dans les retours IA.

**Limites explicites** : transcription dépendante du navigateur, aucun traitement IA dans l'application, pas de garantie de transfert à la vie réelle, données stockées localement non chiffrées. Voir GUIDE_UTILISATION.md.
