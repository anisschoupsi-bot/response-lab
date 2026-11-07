# Audit de refonte Daily 2.0 — 7 novembre 2026

| Défaut identifié en Daily 1.0 | Correction en Daily 2.0 | Test ou limite |
|---|---|---|
| Chronomètre dans le corps de la page, petit et peu visible | Chronomètre fixe **en haut à droite**, grands chiffres contrastés | Présence et CSS vérifiés ; rendu physique non vérifié |
| Cas écrit « 50 s lecture seule + 60 s écriture » | **110 s simultanés**, contexte + textarea dès le départ | Tests de phase et d'expiration |
| Contexte pourrait être lu hors chrono | Contexte du cas masqué avant démarrage, puis affiché avec la saisie | Contrôle du modèle d'interface |
| Historique limité à « X/11 » | Historique complet et moyennes par compétence sur 7/14/30 séances standard, sans calcul fictif des notes manquantes | Tests de l'historique |
| Anciennes notes 0–4 comparées à 0–5 | Migration non destructive ; `legacyGrades` archivé, nouveau référentiel 0–5 séparé | Test de migration v1 → v2 |
| Transcription anglaise imposée `en-US` | Variantes `en-GB`, `en-AU`, `en-IN`, test de dictée hors chrono, `maxAlternatives=3`, vocabulaire contextuel expérimental | Tests avec reconnaissance simulée ; compatibilité physique à vérifier |
| Fin de la dictée pouvant perdre une transcription partielle | Attente d'`onend`, conservation de transcription brute/finale, relecture et variantes affichées | Tests de logique ; la précision dépend du fournisseur |
| Retour QCM général uniquement | Nouvelle propriété `option_explanations` optionnelle pour expliquer chaque choix erroné | Exemple fourni avec six jeux d'explications |
| Pas d'axes enregistrables sur une base comparable | Cinq repères 0–5 + commentaires + synthèse + 11 notes optionnelles 0–5 | Test de saisie / export |
| Pas d'export avant 11/11 | Export de secours d'une séance incomplète avec `completed:false` | Test de parcours |
| Pas de sauvegarde complète importable | Sauvegarde globale + restauration fusionnée sans écrasement | Tests de backup et de conflits |
| Risque de JS obsolète en cache PWA | URLs d'assets versionnées et service worker Daily v2 | Test de chemins ; déploiement à vérifier |

**Limitations assumées :** l'application ne contient pas d'IA ni de moteur de notation des réponses libres. Web Speech n'est pas fiable/présent sur tous les navigateurs et peut traiter l'audio via un serveur tiers. La transcriptibilité ne mesure pas la prononciation. Le stockage est local à un appareil : une sauvegarde régulière est indispensable. Les tests unitaires et DOM simulé ne remplacent pas des essais Chrome/Android réels.

**Recommandations de validation manuelle après publication :**

1. Mode avion après première visite et installation, import JSON, session reprise.
2. Chronomètre visible en haut à droite lors des QCM, écrits et oraux, sur téléphone et PC.
3. Contextes écrits visibles **au même moment** que la zone de saisie, et aucune révélation avant clic.
4. Dictée `en-GB`, puis `en-US` avec un même court texte, vérifier les erreurs réelles.
5. Refus micro : chrono à zéro, mode secours disponible.
6. Export réponse partielle, sauvegarde complète, restauration sur second navigateur.
7. Notes anciennes 0–4 conservées et exclues des moyennes 0–5.
