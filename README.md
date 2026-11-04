# Response Lab 2.0

Application web statique, locale, dédiée à la réactivité verbale et aux réponses aux objections sous pression.

**Ouvrir :** https://anisschoupsi-bot.github.io/response-lab/

Cette version apporte :

- Mode **oral sans microphone** : début de parole signalé manuellement, fin de réponse chronométrée, transcription optionnelle.
- Mode **écrit** : première saisie et durée totale mesurées.
- Micro-exercices d'échauffement ciblés, objections à cinq niveaux, simulations de négociation.
- Parcours indicatif de 30 jours, séance de 20 minutes et récupération après blocage.
- Comparaison exploratoire référence/pression, sans prétention psychométrique.
- Copie vers le coach ChatGPT Ultimate v3 ; sans appel à une API payante.
- Conservation de la clé de stockage v1 et des formats d'import/export JSON existants.

📖 [Guide d'utilisation](GUIDE_UTILISATION.md)

## Architecture

Sans compilation ni backend : `index.html`, `assets/app.css`, `assets/app.js`, `manifest.webmanifest`, `sw.js`, `icons/icon.svg`.

## Confidentialité

Seul le code du site est public. Les données d'entraînement restent dans le stockage du navigateur jusqu'à export explicite ou copie manuelle vers une IA. Ne pas pousser au dépôt les sauvegardes de l'utilisateur ni le master prompt privé.

## Validation

Lancer localement `python -m http.server 8765` puis ouvrir `http://localhost:8765`. Tests de navigation, exercice écrit/oral, score, historique, progression, et import à effectuer avant publication.