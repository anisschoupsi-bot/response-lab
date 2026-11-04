# Response Lab 2.1 — Guide d'utilisation

## 1. À quoi sert l'application ?

Response Lab est un outil d'entraînement **local-first** aux réponses spontanées, à la gestion des objections et à la négociation. Il chronomètre les essais et garde ton historique **dans le navigateur de cet appareil**. ChatGPT/DeepSeek peuvent analyser des tentatives que tu leur transmets volontairement ; aucune API ni compte supplémentaire n'est nécessaire.

- Site : https://anisschoupsi-bot.github.io/response-lab/
- Utilisation : Windows (Chrome/Edge), Android (Chrome ou navigateur compatible)
- Langues des exercices : français et anglais. L'interface reste principalement en français.
- Données : stockage local non chiffré dans le navigateur, sauvegarde/export/import manuel.
- Pas de diagnostic, pas de garantie d'amélioration générale : le suivi mesure la pratique et les réponses à des exercices.

## 2. Première précaution : exporter les anciennes données

Si tu as déjà utilisé la v1 ou la v2 sur ce navigateur, commence par **Historique → Export JSON**. Conserve le fichier de sauvegarde en lieu sûr. La v2.1 reprend la même clé de stockage local (`response-lab-state-v1`) et le format de sauvegarde `response-lab-backup-v1` ; les anciennes tentatives sont conservées. Les séances antérieures à cette version ne sont **pas automatiquement considérées comme des jours validés**.

## 3. Ta séance quotidienne de 20 minutes

1. **Tableau de bord → Démarrer ma séance de 20 min.** Sélectionne ton stress de départ (0–10, facultatif).
2. **2 min — Calibration.** Vérifie le niveau FR/EN et le stress ; ne cherche pas à augmenter la pression artificiellement.
3. **3 min — Échauffement.** Clique **Micro-exercice · 20 s** ; entraîne une réponse très courte.
4. **9 min — Objections.** Ouvre **Entraînement → Démarrer un défi** ; réponds à plusieurs objections selon le temps disponible.
5. **4 min — Négociation.** Ouvre **Négociation**, choisis un scénario et effectue au moins un tour ; trois tours sont proposés.
6. **2 min — Bilan.** Dans l'historique/progrès, observe les mesures, puis indique le stress final (facultatif).
7. Reviens sur le **Tableau de bord → Valider la séance**. Pour faire avancer le parcours, il faut 20 minutes écoulées, au moins un échauffement, une objection chronométrée et un tour de négociation enregistrés **dans cette séance**.

Tu peux interrompre et reprendre une séance ; le temps passé dans un onglet masqué n'est pas censé compter comme du temps d'entraînement. La progression est calculée **à partir des séances validées**, pas à partir du nombre de jours calendaires écoulés. Les activités anciennes restent dans l'historique, mais ne valident pas rétroactivement une séance.

## 4. Réponses orales (mode recommandé)

1. Dans **Entraînement**, sélectionne **Réponse orale**.
2. Clique **Afficher l'objection et démarrer**.
3. Au premier mot prononcé, clique **Je commence à parler** : il s'agit d'un repère **manuel approximatif**.
4. Réponds en une à trois phrases, puis clique **J'ai terminé ma réponse**.
5. Ajoute éventuellement une transcription fidèle ; note pertinence, raisonnement et stratégie (0–4) seulement si tu peux les apprécier. Renseigne stress et blocage si connus.
6. Clique **Enregistrer la tentative**.

L'application **n'écoute pas** ta voix ; les clics et délais manuels ne permettent pas de juger la fluidité acoustique, le débit ou les hésitations.

## 5. Réponses écrites

Choisis **Réponse écrite** ; l'application relève le délai de première frappe et la durée jusqu'au clic de fin. Ces mesures incluent la rédaction et **ne doivent pas être comparées directement** à celles du mode oral.

## 6. Réessai après blocage et progression adaptative

- **Niveaux** : 1=30 s, 2=20 s, 3=15 s, 4=10 s, 5=5 s.
- Si tu déclares un stress de 8/10 ou plus, ou deux blocages successifs comparables, le niveau est maintenu ou réduit. **Réessayer** utilise désormais le niveau courant et un délai élargi si nécessaire.
- La promotion automatique requiert trois **objections chronométrées distinctes**, au même niveau et dans la même langue/modalité, avec trois scores ≥3/4, sans blocage déclaré, stress ≤6/10 et réponse dans le délai. Les tours de négociation, bilans, échauffements et réessais ne provoquent pas de promotion.
- Les seuils sont des règles pédagogiques de départ, **pas des normes cliniques**. Ne poursuis pas si le stress devient excessif.

## 7. Programme de 30 séances et bilans périodiques

Le panneau **Jour du parcours** indique la prochaine séance à accomplir. Même après une semaine sans entraînement, il **n'avance pas tout seul**.

Aux étapes **1, 7, 14, 21, 28 et 30**, ouvre **Entraînement → Bilan inédit · épreuves appariées** :

- Une objection confortable (60 secondes), suivie d'une autre formulation de même thème sous pression ; les tâches sont réservées aux bilans et ne servent pas à l'entraînement courant.
- Évalue les deux réponses de la même manière et conserve la même modalité FR/EN.
- Dans **Progrès**, une comparaison n'est affichée que si les deux parties existent, sont notées et partagent le même niveau. Les scores restent subjectifs et les formulations ne sont pas parfaitement équivalentes.

L'application donne la préférence à certains sujets selon le jour du parcours, **dans la limite du niveau et des exercices disponibles**. Le programme est adaptatif, pas un plan rigide qui raccourcit obligatoirement les délais.

## 8. Négociations avec ou sans ChatGPT

Dans **Négociation**, lance un scénario de trois tours. Les objections restent scénarisées par défaut, donc ne dépendent pas automatiquement de tes réponses.

Pour une simulation plus réaliste sans API : après un tour, colle dans le champ facultatif **la prochaine objection formulée par ChatGPT** à partir de ton précédent argument. Clique ensuite **Prochaine objection**. Cette relance manuelle remplace celle du script. Évite les informations confidentielles sur de vraies personnes.

## 9. Utiliser ChatGPT 6 / DeepSeek et réimporter une évaluation

1. Après la tentative, clique **Copier pour ChatGPT**, ou **Historique → ChatGPT** sur une tentative précédente.
2. Colle la fiche dans la conversation où ton Master Prompt Ultimate v3 est chargé. Il doit évaluer uniquement le contenu observable.
3. Pour réimporter les notes du coach, demande un rapport JSON `cognitive-response-v1` qui inclut **`attempts[0].attempt_id`**, l'identifiant de ta tentative.
4. **Historique → Import JSON**. Les notes du coach s'ajoutent à la tentative existante, dans des champs **distincts** des auto-notes. L'import ne crée plus une deuxième tentative si l'identifiant correspond.
5. Si la tentative ne peut pas être associée sans ambiguïté, son retour reste dans une **boîte de réception IA non associée** de l'historique. Tu peux choisir la bonne tentative manuellement avec **Associer**.

Ce fonctionnement est **manuel** : l'application ne se connecte pas automatiquement à ChatGPT et ne récupère pas le contenu d'autres conversations.

## 10. Tableau de bord et historique

Dans **Progrès**, choisis d'abord **oral/écrit** puis **niveau**. Le tableau calcule séparément :

- blocages rapportés ;
- délai avant réponse (clic oral manuel ou première frappe écrite) ;
- qualité auto-évaluée (0–4) ;
- qualité éventuellement évaluée par le coach, sur les mêmes tentatives ;
- bilan apparié confortable/pression pour les épreuves réservées.

Chaque valeur indique le nombre d'essais renseignés. Les scores de différentes modalités ou sources ne sont pas ajoutés les uns aux autres. L'activité ne démontre pas à elle seule un gain de capacité cognitive générale.

Dans **Historique**, tu peux **corriger une auto-évaluation**, **supprimer une tentative** ou **copier** son contenu. Corriger une ancienne note ne recalcule pas rétroactivement la suite des niveaux déjà attribués.

## 11. Sauvegarde, migration et installation

- **Export JSON** : sauvegarde locale complète (`response-lab-backup-v1`), compatible avec les sauvegardes antérieures. Exporte régulièrement, notamment avant de changer de navigateur ou d'appareil.
- **Import JSON** : fusion par identifiant de tentative et de séance, sans duplication. Les sauvegardes ne synchronisent pas automatiquement les appareils.
- **Export CSV** : tableau de travail ; ce n'est **pas** une sauvegarde de restauration.
- **Installation Windows** : dans Chrome ou Edge, ouvre l'URL HTTPS puis menu → installer ce site comme application, si proposé.
- **Installation Android** : dans Chrome, ouvre l'URL HTTPS puis menu ⋮ → Installer / Ajouter à l'écran d'accueil, selon disponibilité.
- Le site conserve les fichiers de l'application pour un usage hors ligne **après une première visite** sous un navigateur compatible, mais le cache et les mises à jour doivent être vérifiés sur l'appareil réel.

En cas d'ancienne version affichée après la mise en ligne : ferme et rouvre le site, actualise, ou vide le cache du site **après** avoir exporté les données (vider le stockage pourrait effacer l'historique).

## 12. Limites connues

Le mode oral ne détecte pas la voix, les scénarios de négociation ne réagissent pas automatiquement à tes réponses, et l'interface n'est pas entièrement traduite en anglais. La validité des évaluations et le transfert des performances à la vie réelle ne sont pas garantis. Les tests automatisés locaux ne remplacent pas une vérification sur tes appareils Windows/Android.

**Version : 2.1 · Données locales · Aucune API payante · Usage pédagogique, pas médical.**
