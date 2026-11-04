# Response Lab 2.3 — Guide de pratique orale et écrite

## Le but, en une phrase

**S'entraîner à répondre oralement avec plus de clarté et moins de blancs face à une objection, en produisant une réponse spontanée avant toute correction.** La transcription facilite l'analyse, mais **ne mesure ni l'intelligence ni la fluidité acoustique**. Le bénéfice dans la vie réelle reste à vérifier.

- Application : <https://anisschoupsi-bot.github.io/response-lab/>
- En priorité : **oral avec transcription** si le navigateur le permet ; sinon oral sans micro.
- Les textes, chronométrages, ressentis et évaluations IA importées sont stockés localement dans ton navigateur, pas sur le dépôt GitHub.
- **Attention au micro :** le service de reconnaissance vocale du navigateur peut traiter la voix sur un serveur externe. Aucune piste audio n'est enregistrée ni sauvegardée par Response Lab. La transcription peut être inexacte et n'est pas garantie hors ligne.

## 1. Scénario oral complet — le chemin le plus simple

1. Sur le tableau de bord, clique **🎙 Démarrer ma séance orale · 20 min**. Cela lance le chronomètre de séance et t'amène au premier micro-exercice. Pour une séance rapide, tu peux aussi ouvrir **Entraînement → Démarrer un défi** sans démarrer une séance de 20 minutes.
2. Sélectionne **🎙 Oral avec transcription** (mode proposé si SpeechRecognition est disponible). Lis le message de confidentialité. Tu peux toujours choisir **🗣 Oral sans micro**.
3. Clique **🎙 Activer le micro et lancer le défi**. Autorise le micro dans le navigateur si une fenêtre apparaît. **L'objection et le chronomètre ne démarrent qu'une fois le micro activé.**
4. Lis l'objection affichée, puis **réponds normalement à voix haute**, en une à trois phrases. Pas besoin de cliquer « Je commence à parler » : lorsque le navigateur signale la présence de parole, un repère indicatif est enregistré. Tu peux signaler le début manuellement si la détection manque.
5. Les mots reconnus apparaissent dans la zone **Transcription en direct**. Ne cherche pas à les relire pendant que tu parles : **priorité à une réponse spontanée**, pas au texte parfait.
6. Clique **■ J'ai terminé de parler**. Response Lab ferme l'écoute et recueille les derniers mots avant d'afficher la vérification.
7. **Vérifie le texte**. Corrige seulement les mots mal reconnus ; ne remplace pas ta réponse spontanée par une nouvelle réponse idéale, sinon le coach n'évaluera plus la performance réelle.
8. Indique éventuellement ton **stress (0–10)** et si tu as eu un **blanc**. Pas d'auto-notation de pertinence, de raisonnement ou de persuasion.
9. Clique **✓ Enregistrer et préparer l'analyse ChatGPT** : la tentative est sauvegardée et un rapport prêt à coller est copié dans le presse-papiers si la réponse contient du texte. Il **n'est pas envoyé automatiquement** à ChatGPT. Alternativement, clique **Enregistrer seulement**.
10. Colle le rapport dans la conversation où ton **Master Prompt Ultimate v3** est activé. ChatGPT renvoie une évaluation en JSON avec les trois notes (0–4) et une correction ciblée. Colle cette sortie dans **Historique → Évaluation JSON de ChatGPT → Importer le retour IA**. La note est associée à la même tentative (`attempt_id`) et ne crée pas de doublon.

**Exemple de défi :** « Votre proposition est trop chère. Pourquoi devrais-je payer davantage ? » Réponds à voix haute sans préparer de discours. Après seulement, corrige la transcription et demande une analyse.

## 2. Si le microphone ne fonctionne pas

- **Autorisation refusée** : Response Lab revient à **Oral sans micro** et le défi **n'est pas chronométré avant de pouvoir être commencé**.
- **Navigateur non compatible** : le mode avec transcription est désactivé ; le mode sans micro et le mode écrit restent disponibles.
- **Reconnaissance interrompue ou service indisponible** : tu peux choisir **Relancer la transcription**, ou terminer l'oral et écrire manuellement ce que tu as dit. Le texte déjà reconnu est conservé.
- **Tu quittes le défi ou masques la page** : le microphone est arrêté. Si une réponse partielle existe, elle reste récupérable comme tentative interrompue, hors statistiques de défis complets.
- **Langue** : choisis FR ou EN **avant** l'exercice. La reconnaissance essaiera `fr-FR` ou `en-US`.
- **Réseau** : la transcription peut échouer hors connexion, même si l'application reste utilisable en mode sans micro.

Le clic de début de parole et la détection par le navigateur sont des **repères approximatifs**. Un premier résultat de reconnaissance peut arriver avec un délai réseau ; il ne représente pas le début réel de la parole. Ne compare pas directement ces repères à la première frappe écrite.

## 3. Scénario écrit (alternatif)

1. Ouvre **Entraînement → Démarrer un défi**.
2. Choisis **⌨ Écrit** ; clique **Afficher le défi et écrire**.
3. Écris ta réponse directement dans la zone. L'application mesure la première frappe et la durée jusqu'à la fin.
4. Clique **Terminer ma réponse**, puis indique éventuellement stress et blocage.
5. Clique **Enregistrer et préparer l'analyse ChatGPT** ; l'analyse qualité passe par le même transfert manuel.

Le mode écrit sert à structurer des arguments, mais il **ne remplace pas l'entraînement oral** et ses secondes ne sont pas comparables.

## 4. Ta séance de 20 minutes

| Phase | Durée cible | Action |
|---|---:|---|
| Calibration | 2 min | Niveau, langue et stress initial facultatif |
| Échauffement | 3 min | Micro-exercice oral en une phrase |
| Objections | 9 min | Plusieurs réponses spontanées, niveau adaptatif |
| Négociation | 4 min | Au moins un échange du scénario |
| Bilan | 2 min | Ressenti, éventuellement retour de ChatGPT, validation |

Les phases sont des repères visuels : l'application ne change pas automatiquement de module. **Pour valider une séance** : 20 minutes comptabilisées, au moins un échauffement, une objection chronométrée et un tour de négociation enregistrés dans la séance ; clique ensuite **Valider la séance** depuis le tableau de bord. Le programme comprend **30 séances réalisées**, pas 30 dates calendaires.

### Niveaux

Niveau 1 = 30 s ; 2 = 20 s ; 3 = 15 s ; 4 = 10 s ; 5 = 5 s. Une réponse dépassant le délai peut être conservée : le délai n'est pas un arrêt forcé. Stress ≥8/10 ou blocages répétés peuvent élargir la difficulté ou la réduire. Pour progresser automatiquement, il faut trois objections distinctes et comparables, avec résultats de qualité suffisants importés depuis ChatGPT et sans blocage déclaré. Aucun score n'est inventé en l'absence d'analyse.

### Bilans

Aux séances 1, 7, 14, 21, 28 et 30, utilise **Entraînement → Bilan inédit · épreuves appariées**. Conserve la même langue et modalité pour comparer une réponse confortable et une réponse sous pression. Deux notes IA sont nécessaires pour calculer une différence ; cela reste une mesure exploratoire.

## 5. Historique, correction et confidentialité

- **Historique → Corriger** : corrige le stress, le blocage et, pour les réponses orales, la transcription. Si tu modifies une transcription déjà évaluée, **l'ancienne note de ChatGPT est annulée** car elle concernait un autre texte.
- **Historique → Export JSON** : fais une copie de tes données avant de changer d'appareil ou de navigateur. Le format `response-lab-backup-v1` est conservé depuis les premières versions. L'import fusionne par ID ; le CSV ne remplace pas une sauvegarde.
- **Données publiques sur GitHub ?** Le code de l'application est public, **pas ton historique local**. Ne publie pas ton fichier de sauvegarde ou de transcription dans le dépôt.
- **Mode vocal et vie privée :** si tu choisis la transcription automatique, le navigateur peut envoyer l'audio à un fournisseur externe. Pour éviter cela, choisis **Oral sans micro**. Ne dicte pas d'informations confidentielles concernant de vraies personnes.
- **Aucun enregistrement audio ni compte API payant dans l'application.** Aucune synchronisation automatique Windows ↔ Android.

## 6. Ce que cette version ne prétend pas faire

La reconnaissance vocale ne détecte pas avec certitude les hésitations, l'intonation, la confiance ou le temps de réflexion. Il n'existe pas d'évaluation automatique de la qualité sans envoyer le texte à ChatGPT. Les négociations restent scénarisées, sauf si tu y colles manuellement une relance générée par ton coach. Le comportement exact du microphone et de la transcription dépend du navigateur, de la permission et parfois du réseau.

## 7. Dépannage rapide

- **L'ancienne interface apparaît :** actualise la page. Si nécessaire, ferme puis rouvre l'onglet ou l'application installée. **Exporte d'abord ton historique** avant toute suppression du stockage.
- **Le texte ne s'affiche pas :** parle clairement dans un endroit calme, vérifie la permission du micro et la langue FR/EN. Si le service ne répond pas, relance la transcription ou utilise le mode sans micro.
- **Copier ne fonctionne pas :** utilise Chrome/Edge sur l'adresse HTTPS. Tu peux toujours copier une tentative depuis **Historique → ChatGPT**.
- **Plus de résultats sur un autre appareil :** importe ta sauvegarde JSON, car les navigateurs ne partagent pas l'historique.

**Version 2.3 — Une application d'entraînement à la communication sous pression, pas un dispositif médical ni une mesure validée d'amélioration cognitive générale.**