// ============================================
// ROUTES TÂCHES
// Gère les tâches domestiques et d'étude
// ============================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Tache = require('../models/Tache');

const DATA_FILE = path.join(__dirname, '../data.json');

function lireDonnees() {
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

function ecrireDonnees(donnees) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(donnees, null, 2));
}

// ============================================
// ROUTE : Ajouter une tâche
// ============================================
router.post('/add', (req, res) => {
    try {
        const donnees = lireDonnees();
        const { utilisateur_id, nom, duree, jours, priorite, type } = req.body;

        if (!utilisateur_id) {
            return res.status(400).json({
                success: false,
                message: '❌ L\'ID utilisateur est requis'
            });
        }

        const userExists = donnees.utilisateurs.some(u => u.id === utilisateur_id);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }

        const tache = new Tache(
            utilisateur_id,
            nom,
            duree || 30,
            jours || ['lundi'],
            priorite || 1,
            type || 'domestique'
        );

        const tacheData = tache.toJSON();
        donnees.taches.push(tacheData);
        ecrireDonnees(donnees);

        res.status(201).json({
            success: true,
            message: '✅ Tâche ajoutée avec succès',
            tache: tacheData
        });

    } catch (error) {
        console.error('❌ Erreur ajout tâche:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de la tâche',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Récupérer toutes les tâches d'un utilisateur
// ============================================
router.get('/:utilisateur_id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const utilisateur_id = req.params.utilisateur_id;

        const userExists = donnees.utilisateurs.some(u => u.id === utilisateur_id);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }

        const taches = donnees.taches.filter(t => t.utilisateur_id === utilisateur_id);

        // Statistiques
        const total = taches.length;
        const terminees = taches.filter(t => t.terminee).length;
        const parType = {
            domestique: taches.filter(t => t.type === 'domestique').length,
            personnel: taches.filter(t => t.type === 'personnel').length,
            etude: taches.filter(t => t.type === 'etude').length
        };

        res.json({
            success: true,
            total: total,
            terminees: terminees,
            en_attente: total - terminees,
            par_type: parType,
            taches: taches
        });

    } catch (error) {
        console.error('❌ Erreur récupération tâches:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des tâches',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Récupérer les tâches d'un jour spécifique
// ============================================
router.get('/:utilisateur_id/:jour', (req, res) => {
    try {
        const donnees = lireDonnees();
        const { utilisateur_id, jour } = req.params;

        const joursValides = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        if (!joursValides.includes(jour)) {
            return res.status(400).json({
                success: false,
                message: `❌ Jour invalide. Utilisez: ${joursValides.join(', ')}`
            });
        }

        const taches = donnees.taches.filter(t =>
            t.utilisateur_id === utilisateur_id &&
            t.jours && t.jours.includes(jour)
        );

        const total = taches.length;
        const dureeTotale = taches.reduce((sum, t) => sum + t.duree, 0);

        res.json({
            success: true,
            jour: jour,
            total: total,
            duree_totale: dureeTotale + 'min',
            taches: taches
        });

    } catch (error) {
        console.error('❌ Erreur récupération jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des tâches du jour',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Mettre à jour une tâche
// ============================================
router.put('/:id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const tacheId = req.params.id;
        const { nom, duree, jours, priorite, type, terminee } = req.body;

        const tacheIndex = donnees.taches.findIndex(t => t.id === tacheId);
        if (tacheIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '❌ Tâche non trouvée'
            });
        }

        const tache = donnees.taches[tacheIndex];
        if (nom) tache.nom = nom;
        if (duree) tache.duree = duree;
        if (jours) tache.jours = jours;
        if (priorite) tache.priorite = priorite;
        if (type) tache.type = type;
        if (terminee !== undefined) {
            tache.terminee = terminee;
            if (terminee) {
                tache.date_realisation = new Date().toISOString();
            } else {
                tache.date_realisation = null;
            }
        }

        donnees.taches[tacheIndex] = tache;
        ecrireDonnees(donnees);

        res.json({
            success: true,
            message: '✅ Tâche mise à jour avec succès',
            tache: tache
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour tâche:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la tâche',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Supprimer une tâche
// ============================================
router.delete('/:id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const tacheId = req.params.id;

        const tacheExists = donnees.taches.some(t => t.id === tacheId);
        if (!tacheExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Tâche non trouvée'
            });
        }

        donnees.taches = donnees.taches.filter(t => t.id !== tacheId);
        ecrireDonnees(donnees);

        res.json({
            success: true,
            message: '✅ Tâche supprimée avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur suppression tâche:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la tâche',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Marquer une tâche comme terminée
// ============================================
router.patch('/:id/complete', (req, res) => {
    try {
        const donnees = lireDonnees();
        const tacheId = req.params.id;

        const tacheIndex = donnees.taches.findIndex(t => t.id === tacheId);
        if (tacheIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '❌ Tâche non trouvée'
            });
        }

        const tache = donnees.taches[tacheIndex];
        tache.terminee = !tache.terminee;
        tache.date_realisation = tache.terminee ? new Date().toISOString() : null;

        donnees.taches[tacheIndex] = tache;
        ecrireDonnees(donnees);

        res.json({
            success: true,
            message: tache.terminee ? '✅ Tâche marquée comme terminée' : '🔄 Tâche réouverte',
            tache: tache
        });

    } catch (error) {
        console.error('❌ Erreur complétion tâche:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de statut',
            error: error.message
        });
    }
});

module.exports = router;