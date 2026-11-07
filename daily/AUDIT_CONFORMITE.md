# Audit de conformité — Response Lab Daily 1.0 (7 novembre 2026)

## Spécification validée avec l'utilisateur

- Import d'**un fichier de séance par jour**.
- 6 QCM avec **40 secondes par question** et correction **immédiate** après un choix.
- 2 cas longs : **50 secondes de lecture**, puis **60 secondes de réponse écrite**.
- 3 confrontations orales : **contexte et confrontation visibles avant le départ**, dictée automatique navigateur et **40 secondes de réponse** ; départ de l'horloge après démarrage réel de la reconnaissance vocale.
- Export d'**un seul fichier de toutes les réponses** pour correction externe.
- Notes de qualité **saisies manuellement** (0–4 pour chaque exercice), séparées de la correction objective des QCM.

## Décisions de conception

- Pas de notation automatique des textes et voix par un système de mots-clés. La bonne réponse des QCM est fournie dans le fichier de séance et affichée une fois la réponse enregistrée ou expirée.
- Import avec validation de structure et de taille, refus d'ID dupliqués, protection des titres et questions contre l'injection HTML.
- Les fichiers importés et les données restent dans le navigateur ; un nouvel import du même identifiant ne supprime pas la progression.
- Timer basé sur `Date.now()`, sans prétendre mesurer la vitesse mentale. Une sortie de page ne réinitialise pas le chrono.
- Si le microphone refuse l'accès ou est indisponible, le temps **ne démarre pas** : le mode sans micro est proposé sans fausse transcription. Le micro peut être relancé pendant les 40 secondes restantes après interruption.
- Audio brut non enregistré : seules les transcriptions du navigateur sont sauvegardées. Le texte original est conservé séparément des corrections manuelles.
- Pression ressentie 0–10 facultative, uniquement déclarée par l'utilisateur.

## Tests

- 66 assertions automatisées dans `tests/test_flow.js` : validation de la séance, six QCM (dont expiration), deux cas, trois transcriptions simulées, onze notes, export complet et reprise.
- 21 assertions automatisées dans `tests/test_failures.js` : navigation pendant le chronomètre, dépassement de délai, refus d'accès au microphone, démarrage synchronisé, reprise d'un microphone interrompu, IDs dangereux.
- Tests statiques : fichiers du HTML présents, shell de service worker cohérent, JSON valide, `node --check` sans erreur.
- **Tests navigateur physique non exécutés** : l'environnement de test bloque la navigation Chromium (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), y compris sur localhost. Ces simulations ne prouvent ni la prise en charge ni la précision de la dictée sur chaque appareil.

## Limites résiduelles

- Reconnaissance Web Speech : peut dépendre de services du navigateur et d'Internet ; ne garantit pas une transcription hors ligne ni une confidentialité strictement locale de la voix.
- Les notes sont transférées par saisie manuelle : aucune intégration API ni import automatique de corrections, conformément au choix utilisateur.
- Les données sont liées au navigateur/appareil. Faire régulièrement l'export JSON ; aucun serveur ni synchronisation.
- La qualité pédagogique des séances quotidiennes suivantes dépend des fichiers générés. La détection automatique des répétitions entre fichiers n'est pas implémentée.
