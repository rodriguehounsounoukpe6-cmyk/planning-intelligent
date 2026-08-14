# 📚 Mon Planning Intelligent

Une application web complète pour aider les élèves à optimiser leur temps entre cours, devoirs et tâches domestiques.

---

## 📱 Fonctionnalités

### 🎯 Gestion du temps
- ✅ **Emploi du temps scolaire** : Ajoutez et gérez vos cours
- ✅ **Tâches domestiques** : Planifiez vos tâches ménagères
- ✅ **Sessions d'étude** : Programmez vos révisions par matière
- ✅ **Optimisation automatique** : Placement intelligent des tâches dans vos trous libres

### 📊 Suivi et analyse
- ✅ **Statistiques** : Visualisez votre progression
- ✅ **Recommandations** : Conseils personnalisés pour améliorer votre organisation
- ✅ **Tableau de bord** : Vue d'ensemble de votre semaine

### 📄 Export et partage
- ✅ **Export PDF** : Téléchargez votre planning en PDF
- ✅ **Partage** : Générez un lien pour partager votre planning

### 🔐 Authentification
- ✅ **Inscription** : Créez votre compte avec email et mot de passe
- ✅ **Connexion** : Sécurisée avec bcrypt
- ✅ **Déconnexion** : Simple et rapide

---

## 🛠️ Technologies utilisées

| Catégorie | Technologies |
|-----------|--------------|
| **Backend** | Node.js, Express, bcryptjs, PDFKit |
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla) |
| **Stockage** | JSON (fichier local) |
| **Déploiement** | Render (gratuit) |

---

## 📦 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm ou yarn

### Étapes d'installation

```bash
# 1. Cloner le projet
git clone https://github.com/rodriguehounsounoukpe6-cmyk/planning-intelligent.git
cd planning-intelligent

# 2. Installer les dépendances
cd backend
npm install

# 3. Initialiser la base de données
node scripts/database_setup.js

# 4. Lancer le serveur
node server.js