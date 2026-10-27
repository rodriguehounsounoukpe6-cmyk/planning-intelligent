# Mon Planning Intelligent — V2 (correctifs)

Application web pour organiser les cours, les tâches personnelles et les révisions. Cette V2 **conserve l'architecture et les pages originales** tout en renforçant le serveur et la planification.

## Fonctionnalités et correctifs

- **Authentification** : inscription et connexion par email/mot de passe, sessions signées en cookie `HttpOnly`, expiration au bout de 7 jours, déconnexion côté serveur. Les empreintes bcrypt ne sont jamais renvoyées dans les réponses API.
- **Confidentialité** : chaque utilisateur ne peut lire, modifier ou supprimer que ses propres tâches, cours, données de compte et PDF. L'ancien endpoint public `/api/auth/users` est supprimé.
- **Validation** : cours et tâches validés lors de la création **et** de la modification ; les cours qui se chevauchent sont refusés.
- **Planification** : tâches manuelles prioritaires avant les révisions automatiques, pause déjeuner (12h–14h), pas de chevauchement de créneaux, petite pause entre activités, limite de 3h de travail ajouté par jour, dimanche sans révision automatique. Les tâches impossibles à placer sont signalées par `non_placees`.
- **Interface** : client API en URL relative au site (localhost ou domaine déployé), affichage des heures au format `HHhMM`, échappement des champs utilisateurs dans les principaux écrans, déconnexion effective.
- **Données** : conservation du format JSON d'origine, écriture atomique. Aucun PDF personnel ni mot de passe en clair dans l'archive.
- **PDF** : génération conservée et téléchargement réservé au compte concerné.

## Installation locale

**Prérequis :** Node.js 20 ou 22 et npm.

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Ouvrez <http://localhost:3000>, créez un compte et commencez la planification. Pour les comptes déjà enregistrés dans `backend/data.json`, conserver ce fichier privé et se connecter avec leur email et mot de passe habituels.

### Tests

```bash
cd backend
npm test
```

Ce projet comprend des tests unitaires de validation, de conflits horaires, et de tâche terminée. **Dans l'environnement de préparation de cette archive, les tests de planification ont été exécutés avec succès ; les tests HTTP et PDF n'ont pas pu être exécutés faute de dépendances npm installées.** Réaliser des tests manuels complets après `npm install` avant de publier.

## Publication sur GitHub

1. Décompressez cette archive et sauvegardez une copie de votre dépôt actuel.
2. Remplacez les fichiers du dépôt existant par ceux de la V2 (sans écraser votre éventuel `backend/data.json`).
3. Depuis GitHub, utilisez **Add file > Upload files** ou effectuez un commit depuis votre ordinateur.
4. **Ne publiez jamais** `backend/data.json`, `.env`, `backend/pdfs/` ni vos clés secrètes. Le `.gitignore` est configuré pour ces fichiers.
5. Déployez le projet avec le répertoire de démarrage `backend`, la commande `npm install` (build) et `npm start` (start).

## Sécurité en production

- Obligatoire : définir `NODE_ENV=production` et `JWT_SECRET` avec **au moins 32 caractères aléatoires** dans les variables privées de votre hébergeur ; HTTPS requis pour les cookies Secure.
- Obligatoire : configurer **un stockage persistant** via `DATA_FILE` sur un disque monté, sinon une instance éphémère (Render gratuit par exemple) peut perdre les comptes et les plannings à chaque redéploiement / redémarrage.
- Pour une forte fréquentation : migrer les données vers PostgreSQL et employer une limite de tentatives partagée entre instances (Redis, etc.). Le JSON atomique de la V2 est adapté à un petit déploiement mono-instance, pas à une base multi-instance.
- Prévoir une vraie politique de confidentialité, la minimisation des données des élèves et une vérification des obligations légales avant d'ouvrir au grand public.
- Aucun mot de passe ni jeton JWT ne doit être envoyé dans ce chat ou commité sur GitHub.

## Limites connues

- Planification **hebdomadaire basée sur des règles**, et non IA d'apprentissage automatique. Les dates limites de devoirs, les notifications, la modification manuelle avancée du planning et les fonctions `partager` / `sauvegarder` de l'ancien client API ne sont pas encore implémentées côté serveur.
- Certaines copies historiques d'écrans sous `frontend/pages` et `frontend/js/frontend` restent dans le dépôt, mais la navigation principale utilise les pages sous `frontend/`.
- La session peut expirer : une nouvelle connexion sera alors requise. En local, fournir une clé `JWT_SECRET` stable évite d'invalider les sessions à chaque redémarrage.

## Principaux dossiers

- `frontend/` : pages HTML, CSS et JavaScript.
- `backend/server.js` : API HTTP, protections et PDF.
- `backend/routes/` : authentification, cours, tâches et optimisation.
- `backend/middleware/auth.js` : cookie signé, identification et autorisations.
- `backend/lib/store.js` : stockage JSON centralisé.
- `backend/services/Planificateur.js` : moteur de planification.
- `backend/tests/` : tests unitaires.
