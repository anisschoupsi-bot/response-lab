# Response Lab 2.0 — Guide d'utilisation

## Objectif

Response Lab entraîne la capacité à répondre de façon **utile, claire et assertive sous pression**, en particulier face aux objections et dans les négociations. C'est un outil de pratique et de suivi, **pas un diagnostic ni un test d'intelligence**.

L'application est accessible sur : https://anisschoupsi-bot.github.io/response-lab/

## 1. Avant ton premier exercice

1. Ouvre l'application sur Windows ou Android dans un navigateur moderne.
2. Choisis `FR` ou `EN` dans l'en-tête (les niveaux sont séparés par langue).
3. Ouvre `Historique` → **Export JSON** pour conserver une sauvegarde de tes résultats si tu utilisais déjà la v1.1. La v2 garde la même clé de stockage local `response-lab-state-v1` et relit normalement les tentatives existantes sur le **même navigateur et le même domaine**.
4. Dans `Entraînement`, sélectionne **Référence confortable · 60 s** pour disposer d'un point de départ. Évalue tes réponses honnêtement.

## 2. Ton programme quotidien de 20 minutes

Le tableau de bord montre le **jour indicatif de ton parcours de 30 jours** et le thème de travail recommandé. Le jour est calculé à partir du début de programme (ou de tes premiers résultats) ; cela ne signifie pas que les séances ont réellement été effectuées.

| Temps | Étape | Ce que tu fais |
|---|---|---|
| 2 minutes | Calibration | Note mentalement ton état et choisis FR ou EN ; réduis la difficulté si nécessaire. |
| 3 minutes | Échauffement | `Entraînement` → `Réflexe en une phrase` → `Faire un micro-défi`. |
| 9 minutes | Objections | `Entraînement` → `Démarrer un défi`, puis 2 à 4 réponses selon le temps disponible. |
| 4 minutes | Négociation | `Négociation` → un scénario à trois objections. |
| 2 minutes | Bilan | Note ton stress et le blocage ressenti ; consulte `Progrès`, puis sauvegarde si nécessaire. |

Le bouton **Démarrer ma séance de 20 min** active uniquement le chronomètre global. Les phases ne naviguent pas automatiquement : tu sélectionnes les exercices toi-même.

## 3. Le mode oral — conseillé pour ton objectif

1. Va dans `Entraînement` → `Démarrer un défi`.
2. Choisis **Réponse orale** (sans microphone et sans enregistrement).
3. Clique sur **Afficher l'objection et démarrer** pour afficher la phrase à laquelle répondre.
4. Au moment où tu commences **réellement** à parler, clique **Je commence à parler**. Cela mesure approximativement le délai entre l'affichage et ton signalement ; ce n'est **pas une reconnaissance vocale**.
5. Réponds à voix haute, idéalement en une à trois phrases, puis clique **J'ai terminé ma réponse**.
6. Saisis facultativement un résumé/transcript de ce que tu as dit.
7. Renseigne le stress ressenti, le blocage (oui / non / inconnu) et tes notes (0–4). Clique **Enregistrer la tentative**.

**Important :** si tu oublies de signaler le début de parole, la mesure reste inconnue. La durée totale inclut les clics manuels. Sans transcription, ChatGPT ne peut pas évaluer ton contenu oral.

## 4. Le mode écrit

Choisis **Réponse écrite**, puis saisis la réponse dans le champ. L'application mesure **le délai avant la première saisie** et **la durée totale jusqu'au clic sur Terminer**. Cela inclut l'écriture : ne compare pas directement ces temps avec les temps du mode oral.

## 5. Comment analyser une tentative avec ChatGPT

Après avoir enregistré, clique **Copier pour ChatGPT** ; ou ouvre `Historique` et clique **Copier** sur une tentative précédente. Colle dans ta conversation configurée avec le *Master Prompt Ultimate v3* et demande :

> Analyse ma réponse face à l'objection. Identifie une force, mon principal point faible et une correction concrète. Note la pertinence, le raisonnement et la communication stratégique de 0 à 4 **uniquement si je fournis le contenu de ma réponse**. Propose un micro-exercice de réessai. Ne déduis pas ma fluidité orale d'une transcription et n'invente pas de temps.

L'application **n'envoie aucune donnée automatiquement** à ChatGPT. Tu contrôles les copies.

## 6. Adaptation de difficulté

- Niveaux : 1 = 30 s ; 2 = 20 s ; 3 = 15 s ; 4 = 10 s ; 5 = 5 s.
- **Progression :** trois tentatives chronométrées comparables, notées au moins 3/4 dans chaque dimension, sans blocage, dans le délai et avec stress déclaré au plus à 6/10.
- **Allègement :** stress déclaré ≥ 8/10, ou deux blocages consécutifs sur des défis chronométrés.
- Les exercices de référence (60 s), échauffements (20 s) et réessais ne provoquent pas de promotion automatique.
- Les seuils sont des **heuristiques de coaching**, pas des seuils cliniques.

## 7. Tableau de progression

`Progrès` présente l'activité, les blocages rapportés, les délais observés et les notes auto-évaluées. Le nouveau panneau **Référence vs pression** n'est qu'une comparaison exploratoire : les tâches peuvent différer, donc un écart ne prouve pas un gain cognitif ni un transfert aux interactions réelles.

Les temps en mode oral correspondent à un signalement manuel, pas à une détection acoustique.

## 8. Sauvegarde, transfert et confidentialité

- `Historique` → **Export JSON** : sauvegarde complète locale, format `response-lab-backup-v1` conservé pour compatibilité.
- `Historique` → **Import JSON** : réimport de sauvegardes v1.1/v2 ou rapports IA compatibles `cognitive-response-v1`.
- **Export CSV** : tableau de tentatives pour analyses personnelles.
- `Réglages` → **Effacer les données locales** : suppression de l'historique sur cet appareil. **Exporte d'abord**.
- Stockage du navigateur : pas de synchronisation entre appareils, pas de compte et pas de base distante. GitHub Pages héberge **le code public seulement**, pas tes réponses.
- Ne colle pas de noms ou d'informations sensibles de clients dans tes simulations.

## 9. Installer sur téléphone et ordinateur

- **Android :** ouvre l'URL via Chrome, menu ⋮ → **Ajouter à l'écran d'accueil** / **Installer l'application** si proposé. Selon le navigateur, l'ajout du raccourci peut fonctionner même si l'installation PWA n'est pas proposée.
- **Windows :** ouvre le site avec Chrome ou Edge, puis le menu du navigateur → **Installer ce site comme une application** si l'option existe. Sinon, un simple favori suffit.
- Après une mise à jour, recharge la page en ligne. Une ancienne version peut être temporairement servie par le cache du navigateur ou le service worker.

## 10. Dépannage

**Mes données semblent avoir disparu :** vérifie le navigateur, le profil, le domaine exact et le mode privé ; chaque profil possède son propre stockage. Restaure le fichier JSON précédemment exporté.

**La copie vers ChatGPT ne fonctionne pas :** utilise HTTPS, autorise le presse-papiers du navigateur, ou copie manuellement le texte de la tentative depuis l'application.

**Le niveau ne monte pas :** les notes, le stress et les blocages doivent être renseignés ; il faut trois tentatives valides. L'entraînement ne cherche pas à augmenter la pression en permanence.

**J'ai un blocage répété :** choisis une réponse d'une phrase, reporte la pression et reprends au niveau inférieur. Arrête l'exercice si le stress devient trop important.

---

Version : 2.0 · Local-first · Gratuit hors coût de connexion / abonnement existant éventuel.