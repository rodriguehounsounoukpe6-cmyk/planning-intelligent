# Notes de version

## 2.0.0 — sécurité et planification

### Corrigé
- Accès sans authentification aux cours, tâches, statistiques, comptes et PDF.
- Réponse API d'inscription avec empreinte de mot de passe.
- Connexion sans session contrôlée et déconnexion uniquement locale.
- Risque de doublons de cours avec horaires chevauchants.
- Incohérence des valeurs et validation manquante à la modification.
- Révisions automatiques qui épuisent les créneaux avant les devoirs.
- Horaires décimaux difficilement lisibles, URL API Render codée en dur.
- Absence de tests, d'instructions de déploiement sécurisé et présence de PDF générés dans l'archive d'origine.

### À faire avant large diffusion
- Installer les dépendances, puis tester manuellement inscription, connexion, navigation, création/suppression, export PDF et déconnexion.
- Migrer JSON vers PostgreSQL sur hébergement pérenne.
- Ajouter tests d'intégration HTTP et tests E2E du navigateur.
- Mettre en place une politique de protection des données et une configuration de production surveillée.
