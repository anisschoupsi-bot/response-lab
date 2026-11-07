# Audit de fiabilité — Daily 2.1

## Diagnostic initial

1. Collision d'identifiant de séance : une réimportation rouvrait une tentative locale existante et affichait à tort un message désignant le fichier comme « ancien ».
2. Absence de remise à zéro (globale et par séance) avec restauration fiable.
3. Restauration ancienne : les doublons étaient ignorés ; après remise à zéro en conservant les scénarios, la sauvegarde n'aurait pas récupéré les résultats de ces mêmes scénarios.
4. `renderQuiz`, `renderCase`, `renderOral` initialisaient des réponses vides pendant le seul affichage.
5. Les anciens chargements se limitaient à 250 séances alors que l'interface annonçait une capacité de 500.
6. Les QCM expirés en mode temps multiplié enregistraient 40 s au lieu de la limite réelle.
7. Changer de mode de temps entre exercices faussait la comparabilité des tendances.

## Correctifs appliqués

- Détection explicite des séances déjà commencées, avertissement clair ; mise à jour sans perte autorisée seulement si la séance est intacte.
- Réinitialisation individuelle ou globale avec deux confirmations et sauvegarde préalable téléchargeable. Aucun reset après annulation / erreur explicite de téléchargement / échec du stockage.
- Restauration conflictuelle uniquement après consentement explicite, avec validation de l'intégralité de la sauvegarde avant écriture.
- Opérations destructives transactionnelles : nouvel état écrit avant substitution dans la mémoire de l'application.
- Initialisation des réponses uniquement lorsqu'un exercice est effectivement démarré ou qu'une réponse est apportée.
- Chargement jusqu'à 500 séances, corrections du chronométrage ×2/×10 et verrouillage du mode de temps une fois la séance commencée.
- Bascule des liens CSS/JS vers `v=2.1.0` et nouveau cache de service worker pour forcer la mise à jour.

## Tests exécutables

- `tests/test_flow.js` — 72 vérifications, parcours des onze exercices.
- `tests/test_failures.js` — 21 vérifications, interruptions et erreurs de microphone simulées.
- `tests/test_migration_backup.js` — 28 vérifications, migration et historique.
- `tests/test_reset_integrity.js` — 38 vérifications, remise à zéro, double confirmation, restauration en conflit, retour après chargement, échec quota et 310 séances.
- `tests/test_assets.js` — 23 vérifications, liens/caches/pack.
- `tests/test_browser_ui.py` — validation Chromium en DOM et CSS calculé : les onze étapes, transcription simulée, fichier exporté, notes 0–5, bouton réinitialisation, fenêtre 390 px, absence de débordement et d'exception JS.

## Limites de vérification

Les tests navigateur ont chargé HTML, CSS et JS locaux avec un faux stockage dans une page sans navigation réseau, car l'environnement bloque la navigation vers `file:` et `http:`. Ils vérifient un **vrai rendu et de vrais clics dans Chromium**, mais ne constituent **pas** un test du service worker en conditions réseau. La reconnaissance vocale a été **simulée** : microphone physique, autorisations système, navigateur de l'utilisateur, transcription anglaise réelle et comportement hors connexion restent à valider. L'absence absolue de bug ne peut pas être garantie sans ces tests sur appareil réel.
