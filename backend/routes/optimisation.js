// ============================================
// ROUTES OPTIMISATION
// Gère la génération du planning optimisé
// ============================================

const express = require('express');
const router = express.Router();
const PlanificateurIntelligent = require('../services/Planificateur');

// ============================================
// ROUTE : Générer le planning optimisé
// ============================================
router.post('/generer', (req, res) => {
    try {
        const { utilisateur_id } = req.body;
        
        if (!utilisateur_id) {
            return res.status(400).json({
                success: false,
                message: '❌ L\'ID utilisateur est requis'
            });
        }
        
        // Créer une instance du planificateur
        const planificateur = new PlanificateurIntelligent(utilisateur_id);
        
        // Vérifier si l'utilisateur existe
        if (!planificateur.utilisateur) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }
        
        // Générer le plan optimisé
        const plan = planificateur.optimiserTaches();
        const recommandations = planificateur.genererRecommandations();
        const stats = planificateur.getStats();
        
        // Analyser le plan
        const analyse = analyserPlan(plan);
        
        res.json({
            success: true,
            message: '✅ Planning optimisé généré avec succès',
            plan: plan,
            analyse: analyse,
            recommandations: recommandations,
            stats: stats,
            resume: {
                total_taches_placees: plan.length,
                jours_utilises: [...new Set(plan.map(p => p.jour))].length,
                temps_total: plan.reduce((sum, p) => sum + (p.duree || 30), 0) + 'min'
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur optimisation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du planning optimisé',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Récupérer les statistiques
// ============================================
router.get('/stats/:utilisateur_id', (req, res) => {
    try {
        const { utilisateur_id } = req.params;
        
        const planificateur = new PlanificateurIntelligent(utilisateur_id);
        
        if (!planificateur.utilisateur) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }
        
        const stats = planificateur.getStats();
        
        // Ajouter des métriques supplémentaires
        const metriques = {
            ...stats,
            taux_occupation: calculerTauxOccupation(stats),
            repartition_types: calculerRepartitionTypes(planificateur.taches),
            jours_charges: calculerJoursCharges(planificateur.emplois)
        };
        
        res.json({
            success: true,
            stats: metriques,
            utilisateur: {
                nom: planificateur.utilisateur.nom,
                classe: planificateur.utilisateur.classe
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

// ============================================
// ROUTE : Obtenir des suggestions d'amélioration
// ============================================
router.post('/suggestions', (req, res) => {
    try {
        const { utilisateur_id } = req.body;
        
        const planificateur = new PlanificateurIntelligent(utilisateur_id);
        
        if (!planificateur.utilisateur) {
            return res.status(404).json({
                success: false,
                message: '❌ Utilisateur non trouvé'
            });
        }
        
        const suggestions = genererSuggestions(planificateur);
        
        res.json({
            success: true,
            suggestions: suggestions,
            priorite: suggestions.filter(s => s.priorite === 'haute'),
            nombre_suggestions: suggestions.length
        });
        
    } catch (error) {
        console.error('❌ Erreur suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération des suggestions',
            error: error.message
        });
    }
});

// ============================================
// FONCTIONS D'AIDE
// ============================================

/**
 * Analyse le plan généré
 */
function analyserPlan(plan) {
    if (!plan || plan.length === 0) {
        return {
            message: 'Aucune tâche à analyser',
            conseil: 'Ajoutez des tâches pour obtenir un planning personnalisé'
        };
    }
    
    // Distribution par type
    const types = {};
    const jours = {};
    let totalDuree = 0;
    
    for (const tache of plan) {
        types[tache.type] = (types[tache.type] || 0) + 1;
        jours[tache.jour] = (jours[tache.jour] || 0) + 1;
        totalDuree += (tache.duree || 30);
    }
    
    // Trouver le jour le plus chargé
    let jourMax = '';
    let maxTaches = 0;
    for (const [jour, count] of Object.entries(jours)) {
        if (count > maxTaches) {
            maxTaches = count;
            jourMax = jour;
        }
    }
    
    // Trouver le type le plus fréquent
    let typeMax = '';
    let maxType = 0;
    for (const [type, count] of Object.entries(types)) {
        if (count > maxType) {
            maxType = count;
            typeMax = type;
        }
    }
    
    return {
        total_taches: plan.length,
        total_duree: totalDuree + 'min',
        types: types,
        jours: jours,
        jour_plus_charge: jourMax,
        type_plus_frequent: typeMax,
        moyenne_par_jour: (plan.length / Object.keys(jours).length).toFixed(1),
        message: `📊 ${plan.length} tâches réparties sur ${Object.keys(jours).length} jours`
    };
}

/**
 * Calcule le taux d'occupation
 */
function calculerTauxOccupation(stats) {
    const totalHeures = stats.heures_cours || 0;
    const totalTaches = stats.total_taches || 0;
    const dureeTaches = totalTaches * 0.5; // Estimation: 30min par tâche
    
    const total = totalHeures + dureeTaches;
    const disponible = 15 * 7; // 15h par jour * 7 jours
    
    return Math.min(Math.round((total / disponible) * 100), 100);
}

/**
 * Calcule la répartition par type
 */
function calculerRepartitionTypes(taches) {
    const types = {
        domestique: 0,
        personnel: 0,
        etude: 0
    };
    
    for (const tache of taches) {
        types[tache.type] = (types[tache.type] || 0) + 1;
    }
    
    const total = Object.values(types).reduce((a, b) => a + b, 0);
    if (total === 0) return types;
    
    for (const type in types) {
        types[type] = Math.round((types[type] / total) * 100);
    }
    
    return types;
}

/**
 * Calcule les jours les plus chargés
 */
function calculerJoursCharges(emplois) {
    const jours = {
        lundi: 0,
        mardi: 0,
        mercredi: 0,
        jeudi: 0,
        vendredi: 0,
        samedi: 0,
        dimanche: 0
    };
    
    for (const cours of emplois) {
        jours[cours.jour] = (jours[cours.jour] || 0) + (cours.heure_fin - cours.heure_debut);
    }
    
    return jours;
}

/**
 * Génère des suggestions personnalisées
 */
function genererSuggestions(planificateur) {
    const suggestions = [];
    const stats = planificateur.getStats();
    const emplois = planificateur.emplois;
    const taches = planificateur.taches;
    
    // Suggestion 1: Temps d'étude
    if (stats.heures_cours < 20) {
        suggestions.push({
            titre: '📚 Augmenter le temps d\'étude',
            description: `Vous avez ${stats.heures_cours}h de cours par semaine. Essayez d'ajouter 30min d'étude par jour.`,
            priorite: 'haute',
            action: 'Ajoutez une session d\'étude de 30min chaque jour'
        });
    }
    
    // Suggestion 2: Répartition des tâches
    if (taches.length > 10) {
        suggestions.push({
            titre: '🧹 Répartir les tâches',
            description: `Vous avez ${taches.length} tâches. Essayez de les répartir sur plus de jours.`,
            priorite: 'moyenne',
            action: 'Planifiez vos tâches sur au moins 5 jours différents'
        });
    }
    
    // Suggestion 3: Jours de repos
    const joursAvecCours = new Set(emplois.map(e => e.jour));
    if (joursAvecCours.size >= 5) {
        suggestions.push({
            titre: '😌 Prendre un jour de repos',
            description: 'Vous avez des cours presque tous les jours. Pensez à prendre un jour pour vous reposer.',
            priorite: 'moyenne',
            action: 'Essayer de libérer au moins un jour dans la semaine'
        });
    }
    
    // Suggestion 4: Optimisation du matin
    const coursMatin = emplois.filter(e => e.heure_debut < 12);
    if (coursMatin.length < 3) {
        suggestions.push({
            titre: '🌅 Utiliser le matin',
            description: 'Le matin est propice à l\'apprentissage. Essayez d\'étudier le matin.',
            priorite: 'basse',
            action: 'Ajoutez une session d\'étude entre 8h et 10h'
        });
    }
    
    // Suggestion 5: Équilibre
    if (taches.filter(t => t.type === 'etude').length === 0) {
        suggestions.push({
            titre: '📖 Ajouter des sessions d\'étude',
            description: 'Vous n\'avez pas de session d\'étude planifiée. C\'est important pour progresser.',
            priorite: 'haute',
            action: 'Ajoutez au moins 3 sessions d\'étude par semaine'
        });
    }
    
    return suggestions;
}

// Exporter le routeur
module.exports = router;