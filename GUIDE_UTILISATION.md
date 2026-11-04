# Response Lab 2.2 — Guide d’utilisation (ChatGPT évaluateur)

## Le principe en une phrase

**Tu t’entraînes ; Response Lab chronomètre et enregistre ; ChatGPT analyse la qualité des arguments.** Tu n’as plus à donner toi-même des notes de pertinence, de raisonnement et de stratégie.

- Application : https://anisschoupsi-bot.github.io/response-lab/
- Windows : Chrome ou Edge ; Android : Chrome ou navigateur compatible.
- Mode **oral** ou **écrit** ; français et anglais, niveaux indépendants.
- Données **locales** : la sauvegarde JSON est sous ta responsabilité ; aucune synchronisation automatique ni API payante.
- ChatGPT reçoit uniquement ce que tu décides de copier. N’y transfère pas d’informations confidentielles de tiers.

## 1. Avant de commencer

**Historique → Export JSON**, puis conserve cette sauvegarde. La version 2.2 conserve la clé locale et le format de sauvegarde des versions précédentes : une mise à jour normale ne doit pas effacer tes résultats. Les anciennes auto-notes, si présentes, demeurent dans l’historique pour compatibilité, mais **ne sont plus demandées ni utilisées pour les nouvelles promotions de niveau**.

Si ton navigateur affiche encore l’ancienne version, ferme et réouvre l’onglet, puis recharge la page. Ne supprime pas les données du site sans avoir réalisé une sauvegarde.

## 2. Scénario écrit : une objection client

1. Ouvre **Entraînement**, puis **Démarrer un défi**.
2. Dans le choix de modalité, sélectionne **Réponse écrite**.
3. Clique **Afficher l’objection et démarrer**. L’objection apparaît avec le chronomètre.
4. Rédige une réponse courte et crédible ; clique sur le bouton pour **terminer la tentative**.
5. Le bilan affiche le temps jusqu’à la première frappe, la durée totale et le délai cible. Indique **Stress (0 à 10)** et **Blocage : oui / non / inconnu**, si tu le souhaites. Tu peux ajouter une observation personnelle.
6. Clique **Enregistrer la tentative**. C’est terminé pour l’exercice ; aucune note de qualité n’est exigée.
7. Sur l’écran « Tentative enregistrée », clique **Copier pour ChatGPT**, colle la fiche dans ton coach ChatGPT (Master Prompt Ultimate v3).
8. ChatGPT est invité à produire **uniquement un objet JSON** au format `cognitive-response-v1`, avec la même valeur `attempt_id`.
9. Copie la réponse JSON de ChatGPT. Reviens dans Response Lab et colle-la directement dans le champ **Coller ici le JSON envoyé par ChatGPT**, puis clique **Importer l’évaluation IA**. Tu peux aussi le faire dans **Historique → Évaluation JSON de ChatGPT**.
10. La tentative est enrichie de l’évaluation de ChatGPT, **sans doublon**. Consulte **Progrès** pour voir les notes IA et les tendances.

Exemple d’objection : « Votre concurrent est moins cher. Pourquoi devrions-nous vous choisir ? ». Réponds spontanément **avant** de chercher une meilleure formulation.

**À distinguer :** le délai de première frappe n’est pas une mesure pure du temps de réflexion. La durée totale inclut l’écriture.

## 3. Scénario oral : confrontation professionnelle

1. Dans **Entraînement**, sélectionne **Réponse orale**.
2. Clique **Afficher l’objection et démarrer**.
3. Commence à parler réellement à haute voix, puis clique **Je commence à parler** au début de ta prise de parole (repère approximatif).
4. Termine ta réponse (une à trois phrases), puis clique **J’ai terminé ma réponse**.
5. Indique ton stress et ton éventuel blocage ; ajoute **facultativement une transcription fidèle de ce que tu as effectivement dit**.
6. Enregistre. Pour que ChatGPT évalue la **qualité du contenu oral**, la transcription est nécessaire : sans transcription, l’application conserve les mesures et ton ressenti, mais **la qualité reste non évaluée**.
7. Si tu as fourni une transcription, utilise **Copier pour ChatGPT → coller le JSON obtenu → Importer l’évaluation IA** comme en mode écrit.

L’application **n’écoute et n’enregistre pas** ta voix. Le clic « Je commence à parler » ne mesure pas le débit, les hésitations acoustiques, l’intonation ni la prononciation. Les temps oraux et écrits sont affichés séparément.

## 4. Séance quotidienne de 20 minutes

Dans **Tableau de bord → Démarrer ma séance de 20 min** :

| Durée | Étape |
|---|---|
| 2 min | Calibration : niveau et stress initial |
| 3 min | Échauffement : au moins un micro-exercice |
| 9 min | Objections chronométrées : au moins une tentative enregistrée |
| 4 min | Négociation : au moins un tour enregistré |
| 2 min | Bilan, stress final et validation |

Le chrono de séance suggère ces phases, mais ne change pas automatiquement de module. Pour **Valider la séance**, il faut 20 minutes réellement comptabilisées, un échauffement, une objection chronométrée et un tour de négociation dans la séance en cours. Le parcours avance selon les séances validées, jamais seulement selon les jours calendaires.

**Fréquence cible :** jusqu’à 20 minutes par jour, selon ta disponibilité et ton niveau de pression. Il est normal de ralentir après un blocage.

## 5. Qui attribue les notes et comment évolue la difficulté ?

- **Toi :** seulement le stress (0–10), le blocage et éventuellement un commentaire. Tous facultatifs.
- **Response Lab :** début de réponse, durée, délai, date, langue, modalité, niveau. Il ne juge pas automatiquement le contenu.
- **ChatGPT :** trois estimations de coach, entre 0 et 4 : **pertinence**, **raisonnement**, **stratégie**. Sans texte, pas de note.

La diminution de pression après stress élevé (≥ 8/10) ou blocages répétés reste **immédiate**. Une **montée automatique** demande trois objections chronométrées **distinctes et comparables**, même langue/modalité/niveau, chacune notée ≥ 3/4 **par ChatGPT**, dans le délai, avec stress connu ≤ 6/10 et absence déclarée de blocage. Sans évaluations IA ou données suffisantes, le niveau est **maintenu**, pas artificiellement abaissé.

Les seuils sont des heuristiques pédagogiques, pas des normes cliniques. Tu peux ajuster le niveau dans **Réglages**.

## 6. Coller le retour IA sans fichier

Après **Copier pour ChatGPT**, ChatGPT doit répondre avec un JSON contenant la structure suivante (valeurs illustratives uniquement) :

```json
{
  "schema": "cognitive-response-v1",
  "session_id": "response-lab-local",
  "language": "FR",
  "attempts": [{
    "attempt_id": "ID-EXACT-DE-LA-TENTATIVE",
    "challenge_id": "ID-EXACT-DU-DEFI",
    "language": "FR",
    "relevance_0_4": 3,
    "reasoning_0_4": 3,
    "strategy_0_4": 4,
    "feedback_note": "Une force ; une faiblesse ; une correction et un réessai."
  }]
}
```

Tu n'as pas à construire cet objet toi-même : le message **Copier pour ChatGPT** contient déjà les instructions et l’identifiant. Colle **la réponse JSON** (ou un bloc ```json ... ```) dans l'application. Ne colle pas le message de demande envoyé à ChatGPT. Le champ accepte aussi les blocs Markdown JSON seuls.

Si l’identifiant ne correspond pas à une tentative locale ou qu’un autre défi est indiqué, l’évaluation restera dans les **retours IA non associés**, avec association manuelle depuis l’Historique.

Si tu utilises le bouton **Import JSON**, il sert toujours à importer un **fichier** de sauvegarde ou d’évaluation, mais ce n’est plus nécessaire pour une seule analyse.

## 7. Bilan de progression

Dans **Progrès**, choisis la langue, puis la modalité oral/écrit et éventuellement le niveau. Tu verras :

- le nombre de blocages déclarés ;
- le temps moyen avant prise de parole signalée ou première frappe ;
- la **qualité évaluée par ChatGPT** et le nombre de tentatives évaluées ;
- le nombre de tentatives attendant encore un retour IA ;
- les comparaisons confortable/pression **seulement si les deux épreuves possèdent des notes IA**.

Les bilans de référence aux séances 1, 7, 14, 21, 28 et 30 restent disponibles. Les notes IA sont des jugements du coach, non des mesures psychométriques, et ne garantissent pas un transfert vers des situations réelles.

## 8. Sauvegarder et transférer tes résultats

- **Historique → Export JSON :** sauvegarde complète. Fais-le régulièrement, surtout avant de changer d’appareil.
- **Historique → Import JSON :** import/fusion d’une sauvegarde, sans créer de doublons pour les identifiants reconnus.
- **Export CSV :** tableau de consultation (ne remplace pas une sauvegarde JSON).
- Sur Android, utilise Chrome → ⋮ → **Installer** ou **Ajouter à l'écran d'accueil**, si proposé.
- Sur Windows, utilise l’option **Installer cette application** de Chrome/Edge, si proposée.

Les données sont enregistrées dans le navigateur, **pas** dans GitHub. Une suppression du stockage du site peut supprimer l’historique. La version de l’application est publique, tes séances restent locales tant que tu ne les copies pas ailleurs.

## 9. Limites

L'intégration ChatGPT est **manuelle**, sans API. Les négociations ne s’adaptent pas automatiquement sans relance copiée depuis ChatGPT. L’application ne réalise pas d’analyse audio. Les évaluations de ChatGPT sont approximatives et les progrès réels ne sont pas garantis. Pas de diagnostic clinique.

**Version 2.2 — zéro coût API additionnel ; Windows et Android.**