# Audit de conception et de correction — Response Lab 2.3

## Objectif vérifié

Entraîner l'accès rapide à une réponse orale utile en situation d'objection et de négociation. **Le fonctionnement doit privilégier la parole spontanée, mesurer sans inventer et permettre une analyse après l'effort.** Le transfert des acquis au quotidien n'est pas prouvé par ce seul dispositif.

## Incohérences identifiées dans v2.2 et résolutions en v2.3

| Incohérence / risque | Traitement 2.3 | Statut |
|---|---|---|
| Le mode oral ne transcrivait aucun mot | Web Speech API avec affichage live, transcription éditable après l'exercice | Implémenté, dépend du navigateur |
| Clic « Je commence à parler » distrayant | Repère vocal `speechstart` quand disponible ; clic manuel facultatif/fallback | Implémenté ; estimation seulement |
| Popup permission consommait le délai | Défi masqué et timer non lancé avant l'événement `onstart` | Testé en simulation |
| Service inaccessible empêchant de s'entraîner | Bascule explicite vers oral sans micro, puis saisie facultative de transcription | Testé |
| Coupure de service effaçant le texte | Reconnaissance conservée, bouton de relance, dernier texte préservé | Testé en simulation |
| Départ de l'onglet laissant écouter ou perdre le texte | Arrêt du micro, tentative interrompue classée séparément et brouillon conservé | Testé |
| Auto-évaluation écrite/orale alourdie | Qualité évaluée par ChatGPT, ressenti seul saisi par l'utilisateur | Conservé depuis 2.2 |
| Trop d'étapes « enregistrer puis copier » | Un bouton « Enregistrer et préparer l'analyse ChatGPT », sans envoi automatique | Implémenté |
| Édition tardive du texte et notes IA obsolètes | Si transcription modifiée en historique, ancienne évaluation IA annulée | Implémenté |
| Moyennes de départ oral hétérogènes | Moyenne masquée en cas de détection mixte (clic/détection/service) | Implémenté |
| Nombreux `localStorage.setItem` pour chaque résultat partiel | Écriture de brouillons limitée à une fois toutes les ~450 ms | Implémenté |
| Bouton séance 20 min lançait seulement une horloge | Ouvre maintenant directement le premier micro-exercice | Implémenté |
| Confidentialité « 100 % local » trompeuse pour le micro | Message explicite sur le traitement vocal potentiellement externe | Implémenté |

## Tests réalisés

- R1–R10 : adaptation, fusion des retours IA, historique, progression de séances, modes de bilan, rendu mobile.
- R11–R16 : réponses sans auto-note, import JSON direct, promotion conditionnelle, absence de qualité inventée.
- R17–R24 : microphone simulé, autorisation refusée, démarrage chronomètre, transcription partielle et finale, reconnexion, interruption et fallback.
- Vérification syntaxique JavaScript, manifest JSON, liens PWA et mise en page mobile avec Chromium en mode headless.

**Limite de preuve :** les tests vocaux utilisent un faux moteur `SpeechRecognition` ; ils ne valident pas la qualité de reconnaissance vocale sur des micros réels Android/Windows ou dans chaque navigateur.

## Limites résiduelles / décisions de conception

1. **Disponibilité Web Speech API :** non universelle. Certaines implémentations dépendent d'un moteur distant ; la connexion et la permission sont nécessaires. Pas d'alternative serveur payante dans cette version.
2. **Pas d'analyse acoustique :** l'application ne peut pas déduire la fluidité, l'intonation, l'assurance, les micro-pauses ou le temps exact de réflexion. Seules des informations de chronométrage de l'appareil et des repères approximatifs sont collectées.
3. **Reconnaissance potentiellement imparfaite :** la transcription peut omettre ou modifier des mots. L'utilisateur doit relire et corriger fidèlement avant l'analyse IA.
4. **Pas d'analyse LLM en direct :** la copie vers ChatGPT est manuelle, sans API et sans synchronisation implicite. Les notes restent des jugements du coach sur le texte, pas des mesures cliniques.
5. **Transfert en situation réelle non validé :** aucun niveau ou score ne prouve une amélioration générale des capacités cognitives. Tester avec des situations nouvelles et une pratique régulière.
6. **Cohérence de programme :** les 20 minutes restent un cadre, pas un tutoriel automatique à chaque seconde. Le suivi des séances exige les exercices requis.
7. **Sécurité locale :** le texte et l'historique ne sont pas chiffrés dans `localStorage`. Les fichiers de sauvegarde doivent être protégés. Ne pas dicter de données sensibles.

## Bibliographie technique

- MDN, SpeechRecognition : https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- MDN, Web Speech API : https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API

## Vérification humaine conseillée après déploiement

Sur Chrome ou Edge HTTPS Windows puis Chrome Android : demander l'autorisation micro, prononcer un défi complet en FR et EN, vérifier le texte, l'arrêt du micro, le brouillon en cas de changement d'onglet, la restauration d'historique et le transfert des évaluations ChatGPT. Aucun test automatisé ne remplace ces contrôles sur matériel réel.