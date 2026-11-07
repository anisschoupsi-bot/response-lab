# Response Lab Daily 1.0 — Séances quotidiennes par fichier

**Version distincte des anciennes v2.5.1 / v3.1.1.** Aucune suppression ni migration d'historique : clé locale `response-lab-daily-state-v1`.

## Parcours convenu

- Une séance `.json` à importer chaque jour. Format strict `response-lab-daily-session-v1` : **6 QCM + 2 cas écrits + 3 confrontations orales**.
- QCM : **40 secondes** par question, une réponse, puis **correction immédiate** (ou expiration et correction).
- Cas écrits : **50 secondes** de lecture (rédaction verrouillée), puis **60 secondes** pour rédiger une réponse / posture. Sauvegarde du texte pendant la saisie.
- Oral : la confrontation est **visible avant** le début ; un bouton active le microphone et démarre les **40 secondes après activation réelle de la reconnaissance vocale**. Transcription en direct, texte brut conservé, correction manuelle possible après la réponse. Mode secours sans micro disponible.
- À la fin des 11 exercices : **un seul export JSON des réponses** (`response-lab-daily-answers-v1`) à joindre dans ChatGPT pour une correction globale ; **11 notes 0–4 saisies manuellement dans l'application**, avec champs de conseils facultatifs. Aucune importation de fichier de correction requise.
- Les QCM ont une exactitude calculée objectivement ; la notation de qualité 0–4 reste manuelle, pour éviter toute confusion.

## Confidentialité et limites

- Séances, textes et notes dans `localStorage` de ce navigateur. **Aucune synchronisation**, et la suppression des données du navigateur efface l'historique. Exporter les réponses régulièrement. Un grand nombre de longues sessions peut saturer le quota local.
- L'application elle-même fonctionne après mise en cache hors ligne. Toutefois, la **Web Speech API utilisée pour retranscrire automatiquement la parole n'est pas garantie hors ligne** et peut acheminer l'audio vers le fournisseur du navigateur. En cas d'échec, mode sans micro et transcription manuelle clairement identifiés.
- L'horloge suit le temps réel, même si l'onglet n'est pas actif ; cela ne mesure pas la vitesse du raisonnement. Aucun diagnostic de stress ou de fluidité orale n'est effectué. Pas de stockage de l'audio brut.
- La note 0–4 est saisie par l'utilisateur sur la base d'une correction externe ; le logiciel ne prétend pas analyser sémantiquement les réponses libres.

## Tests

`python -m pytest tests/ -q` puis `python -m http.server 8765` pour l'interface sur `http://localhost:8765/`. Tests du navigateur avec Playwright si Chromium est installé.

## Ajout d'une nouvelle séance

Le fichier `seance_2026-11-07.json` est une séance réelle d'exemple. Pour le jour suivant, demander au coach : « Crée mon fichier quotidien Response Lab au schéma response-lab-daily-session-v1, avec 6 QCM, 2 cas écrits et 3 confrontations orales, sans reprendre les questions précédentes. »
