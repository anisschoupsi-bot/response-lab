# Response Lab 2.2 — entraînement cognitif et coach ChatGPT

Application web locale, sans clé API ni abonnement supplémentaire. Elle chronomètre les réponses orales (repère manuel) et écrites (première frappe), entraîne les objections et négociations, suit la pression déclarée et conserve les séances localement. **La qualité des arguments est évaluée par ChatGPT lorsque tu lui transmets une réponse**, pas par des boutons de note personnelle.

Site : https://anisschoupsi-bot.github.io/response-lab/
Guide : [GUIDE_UTILISATION.md](GUIDE_UTILISATION.md)

## Démarrage

1. **Historique → Export JSON** pour conserver toute sauvegarde préalable.
2. **Entraînement → Démarrer un défi** ; choisir oral ou écrit et répondre.
3. Indiquer, si souhaité, le **stress** et le **blocage** ; **Enregistrer la tentative**. Aucun score de qualité à remplir.
4. Cliquer sur **Copier pour ChatGPT** ; coller dans le chat contenant le Master Prompt Ultimate v3. La réponse attendue est un objet JSON d’évaluation `cognitive-response-v1`.
5. Dans Response Lab, **coller le JSON directement** après la tentative ou dans **Historique → Évaluation JSON de ChatGPT** ; cliquer **Importer le retour IA**.
6. Consulter **Progrès** pour les notes du coach, les délais, les blocages et le suivi des 30 séances.

### Données et migration

- Clé navigateur : `response-lab-state-v1`, inchangée depuis v1.
- Sauvegarde : `response-lab-backup-v1`, compatible avec les archives historiques.
- Les anciennes auto-notes sont conservées dans les sauvegardes, mais la version 2.2 ne demande plus à en saisir et n'en dépend pas pour promouvoir le niveau.
- Les données ne sont pas automatiquement synchronisées entre Windows et Android.
- Le site GitHub est public ; l’historique reste local au navigateur, sauf export ou copie volontaire.

## Tests

```bash
python tests/test_regression.py
python tests/test_ai_first.py
```

Nécessite Python, Playwright et Chromium. Les tests de navigateur ne démontrent pas à eux seuls un gain de compétence réelle et ne remplacent pas des essais sur les appareils de l'utilisateur.