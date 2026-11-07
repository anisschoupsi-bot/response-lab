# Response Lab Daily — audit QA 2.2

**Périmètre :** code source GitHub `daily/` de la version 2.1 (copie locale dont `git hash-object assets/app.js` = `46096b591ac2940e8f15b965eb385411963da4a5`), fichiers HTML/CSS/JS, service worker, schéma des séances et tests fournis. La version 2.2 documentée ici est la version corrigée. La demande « code complet ci-dessous » ne comportait pas de code supplémentaire ; l'audit porte sur le dépôt existant.

**Résumé : 22 constats**, dont **2 bloquants, 9 majeurs, 7 mineurs et 4 améliorations/limites**. Parmi eux, **14 constats confirmés par le code**, et **8 risques/limites conditionnels ou liés à l’environnement**. Les cinq priorités : démarrage micro `phrases-not-supported`, suppression fiable des données, choix FR/EN dans l'oral, protection des sauvegardes importées, diagnostic/reprise des erreurs vocales.

**Terminologie** : **C = confirmé dans le code**, **R = risque probable/conditionnel ou limite à tester**. « Corrigé » signifie corrigé dans le code 2.2 et couvert par les tests disponibles, **pas certifié sur tout navigateur ni avec un microphone réel**.

| ID | C/R | Catégorie | Gravité | Lieu v2.1 | Problème et cause | Correctif ou limite |
|---|---|---|---|---|---|---|
| E-001 | C | C · Audio | **Bloquant** | `prepareSpeech` ~210 | Affectation conditionnelle de `recognition.phrases` ; certains services retournent `phrases-not-supported` **asynchronement**, hors du `try/catch` de l'affectation | **Corrigé** : plus de `phrases`, `processLocally` ni grammaire expérimentale ; un seul nouvel essai sans options |
| E-002 | C | A/D · Sessions | **Bloquant** | `renderHistory`, `packHome`, `handleAction` | Réinitialiser les progrès existait, mais **supprimer une séance, supprimer toutes, réinitialiser l'application** manquaient | **Corrigé** : 3 commandes distinctes, 2 confirmations, sauvegarde proposée avant mutation, actualisation immédiate |
| E-003 | C | E/C · Langue | **Majeur** | `renderOral`, événement `speech-locale` | Liste filtrée par `s.pack.language`, anglais invisible sur une séance FR | **Corrigé** : liste commune FR + EN, choix retenu dans `s.speechLocale`, transmis à `recognition.lang` |
| E-004 | C | C/E · Erreurs | **Majeur** | `prepareSpeech.onerror`, `prepareSpeechTest.onerror` | Message générique avec code technique, sans cause ni action adaptée | **Corrigé** : messages distincts pour `not-allowed`, `service-not-allowed`, `audio-capture`, `no-speech`, `language-not-supported`, `network`, `aborted`, `phrases-not-supported` |
| E-005 | C | C · Audio | **Majeur** | `prepareSpeech.onerror/onend` | Aucune récupération automatique contrôlée après erreur reconnue récupérable | **Corrigé** : au maximum un nouveau démarrage ; la minuterie déjà lancée n'est pas remise à zéro ; pas de boucle automatique sur refus de permission |
| E-006 | C | C · Données vocales | **Majeur** | `prepareSpeech.onend` | `record.transcript=record.finalTranscript` pouvait supprimer les derniers résultats encore provisoires | **Corrigé** : conservation de la meilleure transcription brute capturée, plus champ final séparé, révision possible |
| E-007 | C | G/D · Sécurité | **Majeur** | `renderCase`, `renderOral`, `renderFinished` et `adaptSession` | Sauvegarde JSON importée : `elapsedSec` non typé interpolé dans `innerHTML`, `alternatives` mal typé pouvant bloquer le rendu ; risque d'injection de HTML/JS | **Corrigé** : assainissement des réponses/notes/temps/options à l'import, échappement défensif des métadonnées |
| E-008 | C | D/B · Rechargement | **Majeur** | `adaptSession`, `resumeTimers` | Un minuteur restauré avec un `stepId` incohérent pouvait rester dans un état actif sans minuterie utilisable | **Corrigé** : validation de l'étape, des bornes de temps, du curseur et de la phase ; retour à un état sûr avec texte conservé |
| E-009 | C | D · Suppression | **Majeur** | `resetProgress`, absence d'opération complète | Aucune procédure pour nettoyer stockage v1/v2, données temporaires et caches **propres à Daily** lors d'une suppression totale | **Corrigé** : suppression des clés de Daily, cache SW et IndexedDB namespacés quand accessibles ; marqueur v2 vide contre la remigration ; autres applications sur le domaine protégées |
| E-010 | R | B/C · Asynchronisme | **Majeur** | `endSpeech` | Minuteur de finalisation non conservé explicitement ; possible rappel tardif après changement de séance | **Corrigé préventivement** : identifiants des délais conservés, nettoyage à l'arrêt/réinitialisation, garde d'identité |
| E-011 | C | B/A · Chronométrage | **Majeur** | écouteur `input` de `manual-draft` | Une saisie tardive pouvait encore être enregistrée après l'échéance mais avant le prochain `setInterval` | **Corrigé** : contrôle direct de l'échéance avant chaque mise à jour du brouillon |
| E-012 | C | F/E · État | **Mineur** | `renderOral` phase `arming` | L'écran masquait le texte de la tentative automatique derrière un statut statique | **Corrigé** : état réel de la dictée affiché pendant l'autorisation et le repli |
| E-013 | R | F · Accessibilité | **Mineur** | `<main aria-live="polite">` | Zone englobante pouvant entraîner des annonces répétées lors du rafraîchissement des minuteries | **Corrigé préventivement** : `aria-live` supprimé de tout `<main>` ; statut dédié conservé |
| E-014 | C | H/E · Documentation | **Mineur** | `index.html`, manifest, SW, README | Numéro de version/cache non aligné sur la refonte ; risque de confusion au rechargement | **Corrigé** : version et cache 2.2 synchronisés |
| E-015 | C | H · Contrat | **Mineur** | `keywords` scénario, `PROMPT_GENERATION_SEANCE` | Annonce d'indices vocaux `keywords` sans garantie de support par le moteur | **Corrigé** : `keywords` reste toléré dans les fichiers pour compatibilité, mais n'est plus envoyé à la Web Speech API ; prompt clarifié |
| E-016 | R | G · Validation | **Mineur** | `chooseQuiz` | Une action injectée avec un indice de QCM non entier pouvait marquer une réponse erronée | **Corrigé défensivement** : vérification des indices 0–3 avant score |
| E-017 | R | D · Corruption | **Mineur** | `adaptSession` | Une séance dont `phase='finished'` mais `cursor<11` pouvait se présenter comme terminée | **Corrigé défensivement** : phase recalée, récupération conservée |
| E-018 | R | D · Stockage | **Mineur** | nettoyage `sessionStorage`, `CacheStorage`, IndexedDB | En navigation privée ou origine opaque, accéder aux API de stockage peut échouer | **Corrigé préventivement** : accès gardés par `try/catch`, origine temporaire signalée, échec partiel non masqué |
| E-019 | C | E · Localisation | **Amélioration** | interface générale | La langue du contenu et de la dictée peut être anglaise, mais la navigation reste en français | **Non inclus** : prévoir une internationalisation complète FR/EN séparément, y compris lecteur d'écran |
| E-020 | R | C · Compatibilité | **Amélioration** | navigateur, Web Speech API | Firefox, Safari, certains mobiles et certains accents peuvent ne pas prendre en charge SpeechRecognition ; reconnaissance peut dépendre d'un serveur | **Limite externe** : repli sans micro et tests par appareil ; aucune garantie hors ligne |
| E-021 | R | C/F · Validation physique | **Amélioration** | microphone réel, Android/iOS | Les événements vocaux simulés ne prouvent pas le fonctionnement réel des permissions et de la qualité de transcription | **À tester** avec des appareils réels ; matrice manuelle ci-dessous |
| E-022 | R | D · Téléchargements | **Amélioration** | `downloadFile`, sauvegarde avant suppression | Le navigateur ne fournit pas à cette page la preuve que le fichier a été réellement enregistré sur le disque | **Limite explicitée** : deux confirmations, avertissement demandant une vérification humaine ; pas de promesse trompeuse |

## Diagnostic prioritaire détaillé

**E-002 — sessions** : l'application 2.1 disposait déjà de `restartSession()` et `resetProgress()`, contrairement à une absence totale de fonctions de remise à zéro. Le problème était l'absence de suppression individuelle, de suppression complète et d'un nettoyage lié à la réinitialisation totale. La 2.2 conserve les anciens exercices par défaut ; chaque suppression requiert une sauvegarde proposée et deux validations. **Le nettoyage est volontairement limité aux clés, caches et bases appartenant à Response Lab Daily**, car toutes les versions de Response Lab partagent l'origine GitHub Pages. L'app laisse un marqueur v2 vide pour empêcher l'ancien stockage v1 de ressusciter les séances supprimées.

**E-003 — langue** : les six locales (`fr-FR`, `fr-CA`, `en-US`, `en-GB`, `en-AU`, `en-IN`) existaient déjà dans `LOCALES`. La restriction `LOCALES[s.pack.language]` empêchait de voir celles de l'autre langue. À présent elles s'affichent toutes et la valeur sélectionnée est appliquée au moteur par `rec.lang = s.speechLocale`. Une séance rédigée en anglais conserve ses questions en anglais, indépendamment du choix de langue de dictée.

**E-001 — micro** : `recognition.phrases` provoque l'événement `phrases-not-supported` lorsque le moteur de reconnaissance refuse le biais contextuel ; une vérification de présence de la propriété ne garantit pas le support par le **service de reconnaissance effectivement utilisé**. La 2.2 n'utilise plus de biais lexical, `processLocally` ou options expérimentales. Les erreurs récupérables ont un seul essai automatique ; les autres indiquent une action claire. Le chronomètre oral ne commence qu'à `onstart` et ne repart pas à zéro après un `onend` intermédiaire.

## Code modifié et emplacements exacts

Fichier principal : **`daily/assets/app.js`**. Le fichier `QA_PATCH_2_2.diff` expose uniquement les blocs modifiés (diff unifié entre Daily 2.1 et Daily 2.2), avec numéros de lignes de contexte. Les fonctions principales remplacées/ajoutées sont : `sanitizeSavedContent` avant `adaptSession`, `adaptSession`, `storedKeys`, `eraseOwnedStoredData`, `clearOwnedOfflineData`, `confirmDeletion`, `deleteSession`, `deleteAllSessions`, `resetApplication` avant `restartSession`, `speechErrorMessage`, `microphoneWarning`, `prepareSpeechTest`, `prepareSpeech`, `endSpeech` avant `startManualOral`, et les branches d'action `delete-session` / `delete-all` / `reset-app` dans `handleAction`.

Fichiers secondaires : `daily/index.html` (version + retrait du `aria-live` global), `daily/sw.js` (clé/cache 2.2), `daily/manifest.webmanifest`, documentation et tests. Le **ZIP** contient le code corrigé complet, les tests et le diff.

## Vérification et limites

Exécutions locales : `node --check assets/app.js` ; sept suites JavaScript (tests préexistants + nouvelles suites vocales/effacement et assainissement) ; deux suites de navigateur Chromium/Playwright (parcours 11 exercices, suppression, choix EN sur scénario FR, sauvegarde avant suppression, vue mobile). Les tests de Chromium injectent le code dans `about:blank` et **simulent la reconnaissance vocale**. La navigation HTTP du navigateur de test a renvoyé `ERR_BLOCKED_BY_ADMINISTRATOR` ; **aucune compatibilité réseau ou microphone physique n'est déduite de ces tests**.

**Fonctionnalités non présentes :** la pause du chronomètre n'est pas implémentée (choix pédagogique de décompte continu), l'interface anglaise intégrale n'est pas implémentée et l'audio brut des réponses n'est pas conservé par Daily. Ce ne sont pas des fonctions que ce correctif prétend livrer.

## Checklist manuelle (sur appareils réels)

1. Ouvrir le site en **HTTPS**, vérifier que Daily 2.2 apparaît et que la séance modèle contient 6 + 2 + 3 exercices.
2. Importer une séance FR, ouvrir un oral ; vérifier que le sélecteur propose **fr-FR, en-US et en-GB** et qu'un choix `en-GB` est bien conservé après rechargement.
3. Activer le micro, accorder la permission, parler pendant 5 secondes : texte visible, chrono démarré après `onstart`, 40 secondes seulement, sauvegarde texte intacte après réouverture.
4. Répéter avec refus de permission, micro débranché, silence, mode avion, puis bouton **Mode sans micro** : chaque cause doit produire un message intelligible et ne pas bloquer le parcours.
5. Sur Chrome/Edge : tester une séance dont le scénario possède des `keywords` ; aucun `phrases-not-supported` ne devrait être provoqué par l'application 2.2.
6. Répéter l'oral sur Chrome Android, Edge Windows, Safari iOS et Firefox si disponibles ; Firefox peut nécessiter le mode sans micro.
7. Faire les 6 QCM, vérifier correction immédiate et échéance 40 s ; faire les 2 cas, vérifier 110 s de lecture+rédaction simultanées et sauvegarde du texte à expiration.
8. Essayer la suppression d'une séance : **Annuler** aux deux étapes préserve tout ; confirmer après téléchargement supprime uniquement cette séance.
9. Faire **Supprimer toutes les séances**, recharger la page et vérifier que les anciennes séances ne réapparaissent pas ; les autres versions de Response Lab doivent rester intactes.
10. Faire **Réinitialiser l'application**, recharger en ligne et vérifier l'accueil vierge ; sauvegarder/réimporter ensuite un JSON de sauvegarde pour vérifier la restauration.
11. Tester sur écran étroit : pas de défilement horizontal, minuteur en haut à droite, boutons actionnables, focus clavier visible.
12. Tester hors ligne **après avoir visité le site en ligne** ; le cœur des exercices doit rester accessible, mais la transcription du navigateur peut échouer selon son service.

## Améliorations optionnelles non incluses

- Interface 100 % bilingue (traduction des menus, messages d'erreurs, lecteurs d'écran).
- Enregistrement audio local via `MediaRecorder` et réécoute ; actuellement seuls les mots transcrits sont conservés.
- Sauvegarde automatique des sessions exportées sous un fichier de sécurité périodique, avec vérification manuelle de sa présence.
- Reconnaissance vocale **réellement locale** via modèle embarqué : dépend de la taille du modèle, des appareils et des licences et ne peut pas être garantie à coût nul sur tout téléphone.
- Tests end-to-end sur appareils physiques avant chaque mise en production majeure.
