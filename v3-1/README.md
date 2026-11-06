# Response Lab 3.1 — Preview : entraînement cognitif et oral local

Ce dossier est **une version d'essai séparée** de Response Lab 3.0. Il n'écrase pas le code de la v3.0 ni l'historique v2.x. Il partage volontairement la clé v3 `response-lab-v3-state-v1` afin de retrouver les anciens exercices de la v3.

## Mode oral réellement utilisable

1. Commencer une situation, répondre aux 2 questions cognitives fermées.
2. À l'étape orale, cliquer **« Démarrer micro + chrono »** : le navigateur demande la permission, puis le chronomètre ne commence qu'à l'événement de démarrage effectif de l'enregistrement local.
3. Si le microphone est refusé ou indisponible, aucun chrono ne démarre. Sélectionner **« Sans micro · chrono + signal manuel »**.
4. Terminer la réponse, écouter l'enregistrement local et vérifier la **transcription locale si disponible**. Sans dictée locale installée, saisir des notes facultatives dans le champ texte ou laisser vide : aucun texte ne sera inventé.
5. Suivre la relance, répondre une seconde fois, enregistrer le bilan. Les **audios des tours enregistrés** sont sauvegardés localement dans IndexedDB et accessibles dans Progrès. L'historique cognitif et les notes textuelles sont dans localStorage.

## Dictée vraiment locale et gratuite

La Web Speech API classique peut envoyer l'audio à un serveur. Response Lab ne l'utilise **jamais** en mode distant. La dictée est tentée seulement si `SpeechRecognition.available({langs,processLocally:true})` indique un pack local disponible ET si l'objet reconnaisseur supporte `processLocally=true`. Le bouton d'accueil **« Vérifier / installer la dictée locale »** permet d'installer un pack linguistique si le navigateur le propose (téléchargement unique éventuel). Cette fonction demeure expérimentale et n'est pas disponible partout. L'enregistrement via MediaRecorder fonctionne sans transcription, indépendamment de la disponibilité du pack.

## Hors ligne, stockage et sauvegardes

Aucun compte, aucune API payante, aucun `fetch` vers un serveur de traitement. Les fichiers d'application sont mis en cache par le service worker après la première installation. Les fichiers audio ne sont pas envoyés. Les préférences et les notes sont exportables en JSON, mais **le JSON de sauvegarde ne contient pas les gros fichiers audio**. On peut télécharger chaque enregistrement depuis Progrès. Les données du navigateur peuvent être effacées, notamment en navigation privée ou après suppression des données du site. Une demande de stockage persistant est effectuée si elle est disponible, sans garantie d'accord.

## Entraînement et limites

100 scénarios, 5 domaines × 20 scénarios, en français et anglais ; 3 décisions vérifiables, 2 réponses parlées, une relance selon la stratégie, pression adaptée aux résultats et révision des erreurs après plusieurs séances. Les scores ne mesurent pas directement la vitesse de pensée ni la qualité sémantique des réponses libres. Le délai de parole issu de la détection sonore est approximatif.

Tests : `node tests/test_engine.js`, `node tests/test_audio_workflow.js`, `python -m pytest tests/test_invariants.py -q`.

Lire [`AUDIT_V3_1.md`](AUDIT_V3_1.md) pour les anomalies corrigées, limites et vérifications qui restent nécessaires sur appareils réels.


## Correctif 3.1.1 — Bibliothèque bloquée au chargement

La page GitHub Pages 3.1 chargeait un fichier JavaScript absent, `assets/app.js`, plutôt que les deux véritables modules `assets/app-core.js` et `assets/app-runtime.js`. Ce défaut empêchait l'initialisation et les 100 scénarios n'apparaissaient jamais. La page pointe maintenant vers les bons modules ; un chargeur de compatibilité `assets/app.js` débloque les anciennes pages mises en cache lors de leur prochaine connexion. Le service worker passe en network-first pour la navigation et garde le cache hors ligne pour les assets. Les données locales restent intactes.
