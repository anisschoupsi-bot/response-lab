# Response Lab 2.3 — Entraînement oral d'objections

Application web statique et installable (PWA) pour pratiquer des réponses spontanées en français et en anglais, mesurer les délais de réponse et suivre l'entraînement de manière local-first.

**Ouvrir :** https://anisschoupsi-bot.github.io/response-lab/

## 2.3 : parole d'abord

- Choix **oral + transcription**, **oral sans micro**, **écrit**. Le mode avec transcription est proposé quand l'API `SpeechRecognition` est disponible.
- Compte à rebours démarré **après activation de la reconnaissance**, sans consommer le temps dans la boîte de permission du navigateur.
- Affichage de transcription intermédiaire et finale, édition humaine à la fin de l'exercice ; la voix elle-même n'est ni enregistrée ni stockée par l'application.
- Gestion de permission refusée, reconnaissance interrompue, reconnexion manuelle, onglet masqué, navigation et conservation du brouillon.
- Statistiques distinguant les méthodes de début de réponse ; délai vocal toujours indicatif.
- **Enregistrer et préparer l'analyse ChatGPT** en un geste : copie, sans transfert automatique. Notes de qualité importées plus tard sans doublons.
- Transcription corrigée après l'analyse → invalidation des notes IA devenues obsolètes.
- Sauvegarde locale conservant `response-lab-state-v1`, export `response-lab-backup-v1` compatible avec v1/2.
- Sessions de 20 minutes, 30 séances validées, bilans et adaptation déjà présents.

## Confidentialité et disponibilité

Le site GitHub et son code sont publics ; les réponses et résultats de l'utilisateur sont dans `localStorage` sur son appareil. **Le moteur de reconnaissance vocale du navigateur peut transmettre l'audio à son fournisseur**, selon son implémentation. La transcription n'est pas garantie en mode hors ligne. Choisir **oral sans micro** pour éviter cette fonctionnalité. L'application ne téléverse pas l'historique vers GitHub et n'enregistre aucun fichier audio.

Aucune API d'IA payante, pas d'envoi automatique à ChatGPT/DeepSeek. Les sauvegardes JSON et les textes collés volontairement dans un coach doivent être traités comme des données privées.

## Développer et tester

Pas de compilation requise : `index.html`, `assets/app.js`, `assets/app.css`, `sw.js`, `manifest.webmanifest` et icônes. Les tests se lancent avec Python, Playwright et Chromium :

```bash
python tests/test_regression.py
python tests/test_ai_first.py
python tests/test_speech_first.py
```

Les tests de `test_speech_first.py` utilisent un **SpeechRecognition simulé** ; ils ne prouvent pas le fonctionnement matériel du micro sur chaque téléphone.

Voir [GUIDE_UTILISATION.md](GUIDE_UTILISATION.md) pour le parcours détaillé et [AUDIT_V2_3.md](AUDIT_V2_3.md) pour les limites résiduelles.
