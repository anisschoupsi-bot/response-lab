# Response Lab Daily 2.0 — entraînement cognitif et verbal quotidien

Application web installable (PWA) et utilisable gratuitement, sans clé d'API. **Chemin GitHub Pages prévu :** `/response-lab/daily/`. Le déploiement est distinct des anciennes versions v2.x et v3.x, mais la refonte remplace la version Daily 1.0 à cette adresse.

## Parcours convenu

1. Importer chaque jour un fichier de session JSON (`response-lab-daily-session-v1`, conservé pour compatibilité).
2. **Six QCM**, **40 s** chacun, correction immédiate ; les fichiers récents donnent une explication spécifique de chaque mauvais choix (`option_explanations`) en plus de l'explication générale.
3. **Deux cas écrits**, **110 s par cas**, avec contexte et réponse **simultanément** à partir du démarrage : rien n'est dévoilé avant la mise en route, la réponse se sauvegarde à chaque saisie.
4. **Trois confrontations orales**, contexte visible à l'avance. Le **40 s** démarre uniquement après le signal `SpeechRecognition.onstart` ; la transcription est affichée et conservée. Français et variantes d'anglais (`en-US`, `en-GB`, `en-AU`, `en-IN`) au choix. Un **test de dictée hors chronomètre** est disponible et des alternatives de reconnaissance peuvent être montrées lorsqu'elles existent. Il est possible de corriger les fautes de transcription après l'exercice ; texte brut et texte corrigé restent distincts.
5. Exporter toutes les réponses dans un unique JSON (`response-lab-daily-answers-v2`) à joindre dans ChatGPT. La correction est effectuée **dans le chat**, sans moteur IA embarqué.
6. Recopier **manuellement** dans l'application les **cinq repères** notés sur **0 à 5** (analyse, raisonnement, décision, formulation, adaptation), leurs recommandations et, si souhaité, les 11 notes détaillées sur 0–5. Les réponses QCM sont corrigées automatiquement et séparément.

**Chronomètre :** grands chiffres persistants en **haut à droite** de l'écran, également sur mobile. Les délais de référence sont 40/110/40 secondes ; les aménagements ×2 et ×10 sont proposés avant chaque exercice pour l'accessibilité. Ces séances adaptées ne sont pas mélangées aux moyennes de performances à temps standard.

## Historique et stockage

- Historique dans « Mes séances » avec succès QCM, notes des cinq repères, et moyennes par repère sur les 7/14/30 dernières séances comparables ; « — » si aucune note réelle n'a été saisie.
- Les cinq notes ne sont agrégées en note de séance que si elles sont **toutes** renseignées.
- Stockage local `response-lab-daily-state-v2` ; au premier démarrage, l'ancienne clé `response-lab-daily-state-v1` est **copiée et migrée sans suppression de l'original**.
- Les notes historiques **0–4 restent dans `legacyGrades`** : elles apparaissent dans le détail mais **ne sont jamais converties automatiquement** en 0–5 ni intégrées aux tendances.
- Export de secours des réponses **même pour une séance incomplète** (champ `completed: false`).
- « Sauvegarder toutes mes séances » produit un JSON complet (`response-lab-daily-backup-v2`) ; une restauration fusionne les séances sans écraser celles déjà présentes. Limite volontaire de 500 séances dans le navigateur : exporter/archiver avant saturation.
- Pas de synchronisation entre navigateurs/appareils. Une suppression des données du navigateur peut effacer l'historique si aucune sauvegarde n'a été effectuée.

## Limites honnêtes de la reconnaissance vocale

La Web Speech API ne fonctionne pas sur tous les navigateurs et peut utiliser un service externe : même si **les transcriptions et notes sont conservées localement**, la promesse de transcription 100 % hors ligne n'est **pas** faite. Les accents configurables, les indices de vocabulaire `keywords` et les hypothèses alternatives visent une meilleure reconnaissance, sans la garantir. **La transcription n'évalue pas la prononciation.** Aucun audio brut n'est enregistré dans l'application Daily.

## Tests

```bash
node tests/test_flow.js
node tests/test_failures.js
node tests/test_migration_backup.js
node tests/test_assets.js
```

Les tests utilisent un navigateur simulé pour valider logique, stockage, minuteries et machine à états. Ils ne démontrent pas un fonctionnement physique du microphone, ni un rendu graphique validé sur téléphone. Teste manuellement sur Chrome Android et navigateurs de bureau avant de considérer la fonctionnalité vocale comme validée.

## Fichiers

- `index.html`, `assets/styles.css`, `assets/app.js`, `sw.js` — interface, moteur, cache hors ligne.
- `seance_2026-11-07.json` — séance de démonstration (6 QCM avec raisons des distracteurs, 2 cas, 3 oraux).
- `PROMPT_GENERATION_SEANCE.md` — prompt pour fabriquer une nouvelle séance quotidienne.
- `PROMPT_CORRECTION.md` — consignes pour une correction avec ChatGPT.
- `AUDIT_V2.md` — défauts de la v1 et corrections apportées ; limitations restantes.
