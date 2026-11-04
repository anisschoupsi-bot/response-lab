# Response Lab 2.1

Application statique en français/anglais pour travailler les réponses spontanées, les objections et la négociation sous contraintes temporelles. Fonctionne localement, sans clé API, avec export/import manuel pour ChatGPT/DeepSeek.

## Démarrer

Ouvrir https://anisschoupsi-bot.github.io/response-lab/ dans Chrome/Edge ou Android. Lire [GUIDE_UTILISATION.md](GUIDE_UTILISATION.md).

## Évolutions v2.1

- Récupération et réessai réellement allégé après stress/blocage ; promotion uniquement après trois objections distinctes comparables, sans compter les tours de négociation.
- Rapport ChatGPT relié à sa tentative via `attempt_id` : scores coach et scores personnels séparés ; retours non appariés en attente d'association.
- 30 séances **validées**, pas 30 jours calendaires ; contrôle minimal de réalisation des blocs et bilan initial/final de stress.
- Épreuves réservées comparables aux jours 1,7,14,21,28,30 ; statistiques filtrées par modalité, niveau et langue.
- Récupération d'un exercice interrompu sans prétendre que son temps est encore valable ; historique modifiable et suppression sélective.
- Ajout d'objections variées : 50 FR + 50 EN, plus 12 exercices de bilan réservés par langue ; relance facultative manuelle de négociation via ChatGPT.
- Interface responsive renforcée, cache service worker mis à jour, icônes d'installation PNG et SVG.

## Données et sécurité

- Les données sont conservées dans `localStorage` pour l'origine GitHub Pages uniquement : elles **ne sont pas synchronisées** ni sauvegardées sur GitHub.
- L'export conserve le format `response-lab-backup-v1` et la clé historique `response-lab-state-v1` pour les versions antérieures.
- Le dépôt GitHub est public : **ne pas y publier de prompts personnels, rapports, réponses réelles ni de sauvegardes**.
- Les évaluations sont des observations pédagogiques et des auto-ratings, sans diagnostic ou promesse de transfert cognitif.

## Développement/test

Site statique : `index.html`, `assets/app.js`, `assets/app.css`, `manifest.webmanifest`, `sw.js`, `icons/`. Le script `tests/test_regression.py` exerce les principaux parcours avec Playwright/Chromium (test local, non requis pour les utilisateurs).
