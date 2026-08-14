// ============================================
// ROUTES D'AUTHENTIFICATION
// Gère la création et la récupération des utilisateurs
// ============================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcryptjs'); // ✅ Ajouté pour la vérification

// Chemin du fichier de données
const DATA_FILE = path.join(__dirname, '../data.json');

/**
 * Fonction pour lire les données depuis le fichier JSON
 * @returns {object} Données du fichier
 */
function lireDonnees() {
    // Si le fichier n'existe pas, créer un fichier vide
    if (!fs.existsSync(DATA_FILE)) {
        const dataVide = {
            utilisateurs: [],
            emplois: [],
            taches: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(dataVide, null, 2));
        return dataVide;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

/**
 * Fonction pour écrire les données dans le fichier JSON
 * @param {object} donnees - Données à écrire
 */
function ecrireDonnees(donnees) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(donnees, null, 2));
}

// ============================================
// ROUTE : Créer un nouvel utilisateur
// ============================================
router.post('/register', (req, res) => {
    try {
        const donnees = lireDonnees();
        const { nom, classe, email, password, serie, preferences } = req.body;
        
        // Validation des données
        if (!nom || nom.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '❌ Le nom est requis'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: '❌ L\'email est requis'
            });
        }

        // Vérifier si l'email existe déjà
        const emailExists = donnees.utilisateurs.some(u => u.email === email);
        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: '❌ Cet email est déjà utilisé'
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '❌ Le mot de passe doit contenir au moins 6 caractères'
            });
        }
        
        // Créer un nouvel utilisateur
        const userId = Date.now().toString();
        const user = new User(
            userId,
            nom.trim(),
            classe || 'Non spécifié',
            email,
            password,
            { 
                ...preferences, 
                serie: serie || '',
                matieres: preferences?.matieres || []
            }
        );
        
        // Ajouter à la base de données
        const userData = user.toJSON();
        donnees.utilisateurs.push(userData);
        ecrireDonnees(donnees);
        
        // Réponse de succès
        res.status(201).json({
            success: true,
            message: '✅ Utilisateur créé avec succès',
            utilisateur: userData,
            conseil: '📝 Notez votre ID pour vous reconnecter plus tard'
        });
        
    } catch (error) {
        console.error('❌ Erreur création utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'utilisateur',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Mettre à jour un utilisateur
// ============================================
router.put('/user/:id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const userId = req.params.id;
        const { nom, classe, preferences } = req.body;
        
        // Chercher l'utilisateur
        const userIndex = donnees.utilisateurs.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }
        
        // Mettre à jour les données
        const user = donnees.utilisateurs[userIndex];
        if (nom) user.nom = nom.trim();
        if (classe) user.classe = classe;
        if (preferences) {
            user.preferences = {
                ...user.preferences,
                ...preferences
            };
        }
        
        donnees.utilisateurs[userIndex] = user;
        ecrireDonnees(donnees);
        
        res.json({
            success: true,
            message: '✅ Utilisateur mis à jour avec succès',
            utilisateur: user
        });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'utilisateur',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Supprimer un utilisateur
// ============================================
router.delete('/user/:id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const userId = req.params.id;
        
        // Vérifier si l'utilisateur existe
        const userExists = donnees.utilisateurs.some(u => u.id === userId);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }
        
        // Supprimer l'utilisateur et toutes ses données
        donnees.utilisateurs = donnees.utilisateurs.filter(u => u.id !== userId);
        donnees.emplois = donnees.emplois.filter(e => e.utilisateur_id !== userId);
        donnees.taches = donnees.taches.filter(t => t.utilisateur_id !== userId);
        
        ecrireDonnees(donnees);
        
        res.json({
            success: true,
            message: '✅ Utilisateur et toutes ses données supprimés avec succès'
        });
        
    } catch (error) {
        console.error('❌ Erreur suppression utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'utilisateur',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Liste de tous les utilisateurs (admin)
// ============================================
router.get('/users', (req, res) => {
    try {
        const donnees = lireDonnees();
        
        // Version simplifiée des utilisateurs
        const utilisateurs = donnees.utilisateurs.map(u => ({
            id: u.id,
            nom: u.nom,
            classe: u.classe,
            date_creation: u.date_creation,
            nb_cours: donnees.emplois.filter(e => e.utilisateur_id === u.id).length,
            nb_taches: donnees.taches.filter(t => t.utilisateur_id === u.id).length
        }));
        
        res.json({
            success: true,
            total: utilisateurs.length,
            utilisateurs: utilisateurs
        });
        
    } catch (error) {
        console.error('❌ Erreur liste utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la liste',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Connexion avec email et mot de passe (CORRIGÉE)
// ============================================
router.post('/login', (req, res) => {
    try {
        const donnees = lireDonnees();
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '❌ Email et mot de passe requis'
            });
        }

        const utilisateur = donnees.utilisateurs.find(u => u.email === email);
        if (!utilisateur) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }

        // ✅ VÉRIFICATION DIRECTE AVEC BCRYPT
        const isValid = bcrypt.compareSync(password, utilisateur.password);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: '❌ Mot de passe incorrect'
            });
        }

        // Mettre à jour la dernière connexion
        utilisateur.derniere_connexion = new Date().toISOString();
        const userIndex = donnees.utilisateurs.findIndex(u => u.id === utilisateur.id);
        donnees.utilisateurs[userIndex] = utilisateur;
        ecrireDonnees(donnees);

        res.json({
            success: true,
            message: '✅ Connexion réussie',
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                classe: utilisateur.classe,
                email: utilisateur.email,
                matieres: utilisateur.matieres || []
            }
        });

    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la connexion',
            error: error.message
        });
    }
});

// Exporter le routeur
module.exports = router;