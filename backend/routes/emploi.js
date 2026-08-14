// ============================================
// ROUTES EMPLOI DU TEMPS
// Gère les cours et l'emploi du temps scolaire
// ============================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const EmploiDuTemps = require('../models/EmploiDuTemps');

// Chemin du fichier de données
const DATA_FILE = path.join(__dirname, '../data.json');

/**
 * Fonction pour lire les données depuis le fichier JSON
 */
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

/**
 * Fonction pour écrire les données dans le fichier JSON
 */
function ecrireDonnees(donnees) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(donnees, null, 2));
}

// ============================================
// ROUTE : Ajouter un cours
// ============================================
router.post('/add', (req, res) => {
    try {
        const donnees = lireDonnees();
        const { utilisateur_id, jour, heure_debut, heure_fin, matiere, priorite } = req.body;
        
        // Validation des données
        if (!utilisateur_id) {
            return res.status(400).json({
                success: false,
                message: '❌ L\'ID utilisateur est requis'
            });
        }
        
        // Vérifier si l'utilisateur existe
        const userExists = donnees.utilisateurs.some(u => u.id === utilisateur_id);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé. Veuillez créer un compte d\'abord.'
            });
        }
        
        // Créer le cours
        const cours = new EmploiDuTemps(
            utilisateur_id,
            jour,
            heure_debut,
            heure_fin,
            matiere,
            priorite || 3
        );
        
        // Ajouter à la base de données
        const coursData = cours.toJSON();
        donnees.emplois.push(coursData);
        ecrireDonnees(donnees);
        
        res.status(201).json({
            success: true,
            message: '✅ Cours ajouté avec succès',
            cours: coursData,
            conseil: '📊 Vous pouvez maintenant ajouter des tâches à optimiser'
        });
        
    } catch (error) {
        console.error('❌ Erreur ajout cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du cours',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Récupérer l'emploi du temps d'un utilisateur
// ============================================
router.get('/:utilisateur_id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const utilisateur_id = req.params.utilisateur_id;
        
        // Vérifier si l'utilisateur existe
        const userExists = donnees.utilisateurs.some(u => u.id === utilisateur_id);
        if (!userExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }
        
        // Récupérer les cours
        const emplois = donnees.emplois.filter(e => e.utilisateur_id === utilisateur_id);
        
        // Organiser par jour
        const emploisParJour = {
            lundi: [],
            mardi: [],
            mercredi: [],
            jeudi: [],
            vendredi: [],
            samedi: [],
            dimanche: []
        };
        
        for (const cours of emplois) {
            if (emploisParJour[cours.jour]) {
                emploisParJour[cours.jour].push(cours);
            }
        }
        
        // Trier les cours par heure
        for (const jour in emploisParJour) {
            emploisParJour[jour].sort((a, b) => a.heure_debut - b.heure_debut);
        }
        
        // Calculer les statistiques
        const totalHeures = emplois.reduce((sum, e) => sum + (e.heure_fin - e.heure_debut), 0);
        const nbCours = emplois.length;
        const matieres = [...new Set(emplois.map(e => e.matiere))];
        
        res.json({
            success: true,
            total_cours: nbCours,
            total_heures: totalHeures,
            nb_matieres: matieres.length,
            matieres: matieres,
            emplois: emplois,
            emplois_par_jour: emploisParJour,
            resume: {
                message: `📚 ${nbCours} cours répartis sur ${Object.keys(emploisParJour).filter(j => emploisParJour[j].length > 0).length} jours`,
                jours_avec_cours: Object.keys(emploisParJour).filter(j => emploisParJour[j].length > 0)
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération emploi du temps:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'emploi du temps',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Supprimer un cours
// ============================================
router.delete('/:id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const coursId = req.params.id;
        
        // Vérifier si le cours existe
        const coursExists = donnees.emplois.some(e => e.id === coursId);
        if (!coursExists) {
            return res.status(404).json({
                success: false,
                message: '❌ Cours non trouvé'
            });
        }
        
        // Supprimer le cours
        donnees.emplois = donnees.emplois.filter(e => e.id !== coursId);
        ecrireDonnees(donnees);
        
        res.json({
            success: true,
            message: '✅ Cours supprimé avec succès'
        });
        
    } catch (error) {
        console.error('❌ Erreur suppression cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du cours',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Mettre à jour un cours
// ============================================
router.put('/:id', (req, res) => {
    try {
        const donnees = lireDonnees();
        const coursId = req.params.id;
        const { jour, heure_debut, heure_fin, matiere, priorite } = req.body;
        
        // Trouver le cours
        const coursIndex = donnees.emplois.findIndex(e => e.id === coursId);
        if (coursIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '❌ Cours non trouvé'
            });
        }
        
        // Mettre à jour
        const cours = donnees.emplois[coursIndex];
        if (jour) cours.jour = jour;
        if (heure_debut !== undefined) cours.heure_debut = heure_debut;
        if (heure_fin !== undefined) cours.heure_fin = heure_fin;
        if (matiere) cours.matiere = matiere;
        if (priorite) cours.priorite = priorite;
        
        donnees.emplois[coursIndex] = cours;
        ecrireDonnees(donnees);
        
        res.json({
            success: true,
            message: '✅ Cours mis à jour avec succès',
            cours: cours
        });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du cours',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Récupérer l'emploi du temps pour un jour spécifique
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
        
        const emplois = donnees.emplois.filter(e => 
            e.utilisateur_id === utilisateur_id && 
            e.jour === jour
        );
        
        // Trier par heure
        emplois.sort((a, b) => a.heure_debut - b.heure_debut);
        
        // Calculer les plages libres
        const plagesLibres = calculerPlagesLibres(emplois);
        
        res.json({
            success: true,
            jour: jour,
            cours: emplois,
            nb_cours: emplois.length,
            plages_libres: plagesLibres,
            total_heures_libres: plagesLibres.reduce((sum, p) => sum + p.duree, 0)
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du jour',
            error: error.message
        });
    }
});

// ============================================
// FONCTION : Calculer les plages libres
// ============================================
function calculerPlagesLibres(emplois) {
    const plages = [];
    const debut = 7;
    const fin = 22;
    
    if (emplois.length === 0) {
        return [{ debut: debut, fin: fin, duree: fin - debut }];
    }
    
    // Trier par heure de début
    const coursTries = emplois.sort((a, b) => a.heure_debut - b.heure_debut);
    let currentTime = debut;
    
    for (const cours of coursTries) {
        if (currentTime < cours.heure_debut) {
            plages.push({
                debut: currentTime,
                fin: cours.heure_debut,
                duree: cours.heure_debut - currentTime
            });
        }
        currentTime = Math.max(currentTime, cours.heure_fin);
    }
    
    if (currentTime < fin) {
        plages.push({
            debut: currentTime,
            fin: fin,
            duree: fin - currentTime
        });
    }
    
    return plages;
}

// Exporter le routeur
module.exports = router;