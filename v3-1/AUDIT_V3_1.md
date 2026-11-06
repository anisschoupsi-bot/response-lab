# Response Lab 3.1 — Audit logique, UX, oral et hors ligne

## Portée et méthode

Audit statique de `v3/assets/app.js` (ancien moteur), puis des modules v3.1, du CSS, du parcours d'exercice, des exports et du service worker v3.0. Étude des principes documentés de visibilité d'état, réduction des manipulations, retour immédiat, révision des erreurs et répétition espacée. Régression par Node VM (moteur et simulation microphone), assertions Python sur les invariants et analyse calculée des contrastes. **Le contrôle de navigation sous Chromium n'a pas été possible dans cet environnement (`ERR_BLOCKED_BY_ADMINISTRATOR`, y compris sur une page data: et localhost) : aucun test navigateur réel n'est prétendu réussi.** Les tests sur Android, Safari, micro physique et mode avion restent indispensables.

## Défaillances détectées dans la v3.0

| Priorité | Défaillance | Impact | État 3.1 |
|---|---|---|---|
| P0 | `beginOral()` démarrait le chronomètre puis `enableMic()` était une seconde action. Temps du dialogue de permission compté comme réaction. | Mesure invalide ; friction | Corrigé : un bouton unique ; départ seulement après événement `MediaRecorder.start` ; mode sans micro explicite. |
| P0 | Les `Blob` audio étaient convertis en URL éphémère dans `session.clips`, puis révoqués à `finalize()`. | Enregistrement oral supprimé au bilan. | Corrigé : IndexedDB pour les blobs, lecture et téléchargement depuis Progrès. |
| P0 | Aucune transcription, malgré l'attente d'un texte. | L'utilisateur ne retrouvait aucune trace verbale. | Ajout d'une dictée **strictement sur l'appareil** lorsqu'elle est disponible et d'une zone de texte à corriger ; sinon audio local et notes manuelles, sans prétendre à une transcription inexistante. |
| P1 | Couleurs très sombres, niveaux visuels homogènes, actions primaires noyées dans les secondaires. | Lisibilité et compréhension | Nouvelle palette claire bleu-ardoise/vert pétrole, états explicites, tailles tactiles et indicateurs de focus. |
| P1 | Le micro refusé déclenchait simplement une notice, après départ du chronomètre. | Confusion et mesure incorrecte | Le refus garde le chrono à l'arrêt ; mode manuel distinct. |
| P1 | Le parcours invitait à appuyer sur « activer micro » après le départ, puis « terminer ». | Erreurs de séquence | Départ micro+chrono atomique ; barre de statut et réécoute immédiatement après le tour. |
| P1 | Les échecs cognitifs étaient rarement revisités avant d'avoir parcouru 100 scénarios. | Consolider les erreurs difficile | Une révision ciblée après environ quatre séances si plusieurs autres situations sont passées depuis l'erreur. |
| P1 | Les critères de promotion pouvaient utiliser trois répétitions d'un même scénario. | Surapprentissage interprété comme progression | Promotion/réduction fondées sur scénarios différents. |
| P2 | Le code ne différenciait pas clairement audio effectivement sauvegardé et simple tour « terminé ». | Informations trompeuses | Indication de l'audio enregistré, résultat de stockage et solution d'export en cas d'échec. |
| P2 | Sauvegardes JSON ne contiennent pas les `Blob` audio, cache navigateur non garanti pour toujours. | Risque de perte silencieuse à long terme | Documentation et téléchargement manuel d'un enregistrement à la fois ; demande de stockage persistant si navigateur l'autorise. La sauvegarde audio en ZIP n'est pas encore implémentée. |

## Ce qui est mesuré, et ce qui ne l'est pas

- Mesuré : choix exacts sur 3 étapes fermées, temps entre présentation et clic, durée du tour oral, premier son approximatif si analyseur audio disponible, stress déclaré (0-10).
- Conservé : textes de dictée locale lorsqu'ils existent, notes manuelles, audio dans IndexedDB après enregistrement réussi de la séance.
- **Non mesuré** : latence mentale exacte, intelligence, qualité sémantique des réponses libres, stress physiologique, gestion réelle de conflit. Les 2 coches d'auto-évaluation sont des déclarations, pas des scores automatiques.
- **Risque restant** : scénarios parfois proches dans leur structure, relances générées selon un choix et non selon la sémantique de la parole ; absence d'évaluation aveugle en conditions réelles. N'ajoutez pas des scores non vérifiés.

## Décisions inspirées de références existantes (non copiées)

1. **Duolingo Practice / adaptive lessons** : réviser des erreurs plutôt que rallonger seulement la liste d'exercices. https://blog.duolingo.com/guide-to-duolingo-practice-hub/
2. **Anki** : rappel actif et répétitions étalées ; ici une heuristique légère, pas l'algorithme FSRS d'Anki. https://docs.ankiweb.net/background.html
3. **Nielsen Norman Group** : visible status, error prevention, recognition over recall, consistent actions. https://www.nngroup.com/articles/ten-usability-heuristics/
4. **MDN MediaRecorder** : `dataavailable` est émis avant `stop`, ne pas supposer que le blob existe immédiatement lors du clic. https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop
5. **MDN speech recognition on-device** : `processLocally=true` est expérimental ; ne jamais activer un mode distant pour respecter la promesse hors ligne. https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally
6. **WCAG 2.2** : contraste des textes 4,5:1 minimum (3:1 pour grand texte). https://www.w3.org/TR/WCAG22/

## Tests exécutés

- `node tests/test_engine.js` : exercices, choix, progression, bilingue et import.
- `node tests/test_audio_workflow.js` : autorisation différée du micro, événement de démarrage du recorder, arrêt/Blob, sauvegarde IndexedDB simulée, relecture, refus de permission, interdiction du moteur de dictée non garanti local.
- `python -m pytest tests/test_invariants.py -q` : 8 tests de structure et sécurité locale.
- Contraste calculé : corps #172d3a sur blanc **14,26:1**, texte secondaire #435967 sur blanc **7,33:1**, blanc sur bouton #0b5965 **7,98:1**.
- **Non réussi** : tests visuels E2E sous Chromium, bloqués par une politique du navigateur. Les captures réelles et micro mobile ne sont pas validés.

## À faire avant de remplacer la v3 en production

- Essais physiques Android + Chrome/Edge/Safari pour enregistrement et type MIME, permission refusée, interruptions de l'application, écoute après redémarrage, navigation hors ligne.
- Tester le modèle de reconnaissance vocale locale pour fr-FR et en-US : disponibilité réelle dépend du navigateur et du pack.
- Réduire la proximité de certains scénarios et diversifier les branches ; revoir la qualité pédagogique avec un panel d'utilisateurs.
- Ajouter une fonction « Exporter tous les audios » et un nettoyage explicite des enregistrements par séance.
- Vérifier la taille du stockage audio et la conservation après éviction par le système ou réinstallation du navigateur.
