// ============================================
// SERVICE PLANIFICATEUR INTELLIGENT
// AVEC GESTION DES MATIÈRES ET TEMPS D'ÉTUDE VARIABLE
// ============================================

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');

// Configuration des matières et temps d'étude recommandé
const MATIERES_CONFIG = {
    'mathématiques': { temps: 2, difficulte: 'eleve' },
    'maths': { temps: 2, difficulte: 'eleve' },
    'physique': { temps: 1.5, difficulte: 'eleve' },
    'physique-chimie': { temps: 1.5, difficulte: 'eleve' },
    'chimie': { temps: 1.5, difficulte: 'eleve' },
    'français': { temps: 1.5, difficulte: 'moyen' },
    'anglais': { temps: 1, difficulte: 'moyen' },
    'espagnol': { temps: 1, difficulte: 'moyen' },
    'allemand': { temps: 1, difficulte: 'moyen' },
    'histoire': { temps: 1.5, difficulte: 'moyen' },
    'géographie': { temps: 1.5, difficulte: 'moyen' },
    'svt': { temps: 1.5, difficulte: 'moyen' },
    'sciences': { temps: 1.5, difficulte: 'moyen' },
    'philosophie': { temps: 1.5, difficulte: 'eleve' },
    'ses': { temps: 1.5, difficulte: 'moyen' },
    'economie': { temps: 1.5, difficulte: 'moyen' },
    'droit': { temps: 1.5, difficulte: 'moyen' },
    'informatique': { temps: 1.5, difficulte: 'moyen' },
    'nsi': { temps: 1.5, difficulte: 'moyen' },
    'art': { temps: 1, difficulte: 'faible' },
    'musique': { temps: 1, difficulte: 'faible' },
    'eps': { temps: 0.5, difficulte: 'faible' },
    'sport': { temps: 0.5, difficulte: 'faible' }
};

// Temps par défaut pour les matières non listées
const TEMPS_DEFAUT = 1.5;

class PlanificateurIntelligent {
    constructor(utilisateurId) {
        this.utilisateurId = utilisateurId;
        this.donnees = this.lireDonnees();
        this.utilisateur = this.donnees.utilisateurs.find(u => u.id === utilisateurId);
        this.emplois = this.donnees.emplois.filter(e => e.utilisateur_id === utilisateurId);
        this.taches = this.donnees.taches.filter(t => t.utilisateur_id === utilisateurId);
        
        // Extraire les matières uniques de l'emploi du temps
        this.matieres = [...new Set(this.emplois.map(e => e.matiere.toLowerCase()))];
    }

    lireDonnees() {
        if (!fs.existsSync(DATA_FILE)) {
            const dataVide = { utilisateurs: [], emplois: [], taches: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(dataVide, null, 2));
            return dataVide;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }

    // ==========================================
    // OBTENIR LE TEMPS D'ÉTUDE RECOMMANDÉ POUR UNE MATIÈRE
    // ==========================================
    getTempsEtude(matiere) {
        const matiereKey = matiere.toLowerCase();
        // Chercher une correspondance exacte ou partielle
        for (const [key, config] of Object.entries(MATIERES_CONFIG)) {
            if (matiereKey.includes(key) || key.includes(matiereKey)) {
                return config.temps;
            }
        }
        return TEMPS_DEFAUT;
    }

    getDifficulte(matiere) {
        const matiereKey = matiere.toLowerCase();
        for (const [key, config] of Object.entries(MATIERES_CONFIG)) {
            if (matiereKey.includes(key) || key.includes(matiereKey)) {
                return config.difficulte;
            }
        }
        return 'moyen';
    }

    // ==========================================
    // TROUVER LES PLAGES LIBRES AVEC PAUSES
    // ==========================================
    trouverPlagesLibres(jour) {
        const plages = [];
        const emploisJour = this.emplois.filter(e => e.jour === jour);
        
        let debut = 7;
        let fin = 22;
        
        if (emploisJour.length === 0) {
            return this._decouperAvecPause(debut, fin);
        }
        
        const coursTries = emploisJour.sort((a, b) => a.heure_debut - b.heure_debut);
        let currentTime = debut;
        
        for (const cours of coursTries) {
            if (currentTime < cours.heure_debut) {
                const duree = cours.heure_debut - currentTime;
                if (duree >= 0.33) {
                    plages.push({
                        debut: currentTime,
                        fin: cours.heure_debut,
                        duree: duree
                    });
                }
            }
            currentTime = Math.max(currentTime, cours.heure_fin);
        }
        
        if (currentTime < fin) {
            const duree = fin - currentTime;
            if (duree >= 0.33) {
                plages.push({
                    debut: currentTime,
                    fin: fin,
                    duree: duree
                });
            }
        }
        
        return this._decouperAvecPauseSurPlages(plages);
    }

    // ==========================================
    // DÉCOUPER AVEC PAUSE DÉJEUNER (12h-14h)
    // ==========================================
    _decouperAvecPause(debut, fin) {
        const plages = [];
        const pauseDebut = 12;
        const pauseFin = 14;
        
        if (debut < pauseDebut && pauseDebut - debut >= 0.33) {
            plages.push({ debut: debut, fin: pauseDebut, duree: pauseDebut - debut });
        }
        if (pauseFin < fin && fin - pauseFin >= 0.33) {
            plages.push({ debut: pauseFin, fin: fin, duree: fin - pauseFin });
        }
        return plages;
    }

    _decouperAvecPauseSurPlages(plages) {
        const resultats = [];
        const pauseDebut = 12;
        const pauseFin = 14;
        
        for (const plage of plages) {
            if (plage.debut < pauseFin && plage.fin > pauseDebut) {
                if (plage.debut < pauseDebut && pauseDebut - plage.debut >= 0.33) {
                    resultats.push({ debut: plage.debut, fin: pauseDebut, duree: pauseDebut - plage.debut });
                }
                if (plage.fin > pauseFin && plage.fin - pauseFin >= 0.33) {
                    resultats.push({ debut: pauseFin, fin: plage.fin, duree: plage.fin - pauseFin });
                }
            } else {
                resultats.push(plage);
            }
        }
        return resultats;
    }

    // ==========================================
    // GÉNÉRER DES SESSIONS D'ÉTUDE PAR MATIÈRE
    // ==========================================
    genererSessionsEtude(jour, plages) {
        const sessions = [];
        
        if (this.matieres.length === 0) {
            // Si pas de matières, on ajoute une session générique
            if (plages.length > 0) {
                const plage = plages[0];
                if (plage.duree >= 1) {
                    sessions.push({
                        jour: jour,
                        tache: '📚 Session d\'étude libre',
                        heure_debut: Math.round(plage.debut * 10) / 10,
                        heure_fin: Math.round((plage.debut + 1) * 10) / 10,
                        duree: 60,
                        priorite: 3,
                        type: 'etude',
                        matiere: 'Libre',
                        automatique: true
                    });
                    plage.debut += 1;
                    plage.duree -= 1;
                }
            }
            return sessions;
        }

        // Calculer le temps d'étude total disponible dans la journée
        let tempsTotalDisponible = plages.reduce((sum, p) => sum + p.duree, 0);
        
        // Limiter à 6h d'étude par jour (sauf si beaucoup de temps)
        const maxEtude = Math.min(tempsTotalDisponible, 6);
        let tempsRestant = maxEtude;

        // Distribuer le temps entre les matières selon leur importance
        const matieresAvecCoeff = this.matieres.map(matiere => {
            const difficulte = this.getDifficulte(matiere);
            let coeff = 1;
            if (difficulte === 'eleve') coeff = 2;
            else if (difficulte === 'moyen') coeff = 1.5;
            return { matiere, coeff };
        });

        const totalCoeff = matieresAvecCoeff.reduce((sum, m) => sum + m.coeff, 0);
        const tempsParMatiere = matieresAvecCoeff.map(m => ({
            matiere: m.matiere,
            temps: Math.round((m.coeff / totalCoeff) * tempsRestant * 10) / 10,
            dureeReelle: 0
        }));

        // Ajuster pour avoir au moins 1h par matière
        for (let i = 0; i < tempsParMatiere.length; i++) {
            if (tempsParMatiere[i].temps < 1 && tempsRestant > 0) {
                tempsParMatiere[i].temps = Math.min(1, tempsRestant);
                tempsRestant -= 1;
            }
        }

        // Placer les sessions dans les plages disponibles
        let plageIndex = 0;
        for (const session of tempsParMatiere) {
            if (session.temps < 0.5) continue; // Ignorer les sessions trop courtes
            
            // Chercher une plage disponible
            while (plageIndex < plages.length) {
                const plage = plages[plageIndex];
                if (plage.duree >= session.temps) {
                    const heureDebut = Math.round(plage.debut * 10) / 10;
                    const heureFin = Math.round((plage.debut + session.temps) * 10) / 10;
                    
                    sessions.push({
                        jour: jour,
                        tache: `📚 Étude : ${session.matiere.charAt(0).toUpperCase() + session.matiere.slice(1)}`,
                        heure_debut: heureDebut,
                        heure_fin: heureFin,
                        duree: Math.round(session.temps * 60),
                        priorite: 4,
                        type: 'etude',
                        matiere: session.matiere,
                        automatique: true
                    });
                    
                    plage.debut += session.temps;
                    plage.duree -= session.temps;
                    session.dureeReelle = session.temps;
                    break;
                }
                plageIndex++;
            }
        }

        return sessions;
    }

    // ==========================================
    // OPTIMISATION PRINCIPALE
    // ==========================================
    optimiserTaches() {
        const plan = [];
        const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        
        const pref = this.utilisateur ? this.utilisateur.preferences : {};
        const momentOptimal = pref.moment_optimal || 'matin';
        
        // Séparer les tâches
        const tachesEtude = this.taches.filter(t => t.type === 'etude' && !t.terminee);
        const tachesDomestiques = this.taches.filter(t => t.type === 'domestique' && !t.terminee);
        const tachesPersonnelles = this.taches.filter(t => t.type === 'personnel' && !t.terminee);
        
        tachesEtude.sort((a, b) => b.priorite - a.priorite);
        tachesDomestiques.sort((a, b) => b.priorite - a.priorite);
        tachesPersonnelles.sort((a, b) => b.priorite - a.priorite);
        
        const tachesTriees = [...tachesEtude, ...tachesDomestiques, ...tachesPersonnelles];
        
        // Traiter chaque jour
        for (const jour of jours) {
            const plages = this.trouverPlagesLibres(jour);
            let plagesDisponibles = plages.map(p => ({ ...p }));
            
            const aDesCours = this.emplois.some(e => e.jour === jour);
            
            // Si pas de cours OU temps libre suffisant, ajouter des sessions d'étude
            const tempsTotalDisponible = plagesDisponibles.reduce((sum, p) => sum + p.duree, 0);
            
            // Générer des sessions d'étude (même les jours avec cours s'il y a assez de temps)
            if (tempsTotalDisponible >= 1) {
                // Ne générer des sessions que si on a au moins 2h de libre
                const sessions = this.genererSessionsEtude(jour, plagesDisponibles);
                plan.push(...sessions);
            }
            
            // Placer les tâches de l'utilisateur
            const tachesJour = tachesTriees.filter(t => t.jours && t.jours.includes(jour));
            
            for (const tache of tachesJour) {
                const dureeEnHeures = tache.duree / 60;
                
                let meilleurePlage = null;
                let meilleurScore = -1;
                
                for (let i = 0; i < plagesDisponibles.length; i++) {
                    const plage = plagesDisponibles[i];
                    if (plage.duree >= dureeEnHeures) {
                        const score = this._evaluerPlage(plage, momentOptimal);
                        if (score > meilleurScore) {
                            meilleurScore = score;
                            meilleurePlage = i;
                        }
                    }
                }
                
                if (meilleurePlage !== null) {
                    const plage = plagesDisponibles[meilleurePlage];
                    const heureDebut = Math.round(plage.debut * 10) / 10;
                    const heureFin = Math.round((plage.debut + dureeEnHeures) * 10) / 10;
                    
                    plan.push({
                        jour: jour,
                        tache: tache.nom,
                        tache_id: tache.id,
                        heure_debut: heureDebut,
                        heure_fin: heureFin,
                        duree: tache.duree,
                        priorite: tache.priorite,
                        type: tache.type || 'domestique',
                        moment: this._determinerMoment(heureDebut)
                    });
                    
                    plage.debut += dureeEnHeures;
                    plage.duree -= dureeEnHeures;
                }
            }
        }
        
        // Trier le plan
        const ordreJours = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6 };
        plan.sort((a, b) => {
            if (ordreJours[a.jour] !== ordreJours[b.jour]) {
                return ordreJours[a.jour] - ordreJours[b.jour];
            }
            return a.heure_debut - b.heure_debut;
        });
        
        return plan;
    }

    // ==========================================
    // ÉVALUER UNE PLAGE
    // ==========================================
    _evaluerPlage(plage, momentOptimal) {
        let score = 0;
        const heure = plage.debut;
        
        if (plage.duree >= 1.5) score += 5;
        else if (plage.duree >= 1) score += 3;
        else score += 1;
        
        if (momentOptimal === 'matin' && heure >= 8 && heure <= 11) score += 10;
        else if (momentOptimal === 'apres-midi' && heure >= 14 && heure <= 17) score += 10;
        else if (momentOptimal === 'soir' && heure >= 18 && heure <= 21) score += 10;
        
        if (heure > 21) score -= 2;
        if (heure > 22) score -= 5;
        
        return score;
    }

    // ==========================================
    // DÉTERMINER LE MOMENT DE LA JOURNÉE
    // ==========================================
    _determinerMoment(heure) {
        if (heure < 12) return 'matin';
        if (heure < 18) return 'apres-midi';
        return 'soir';
    }

    // ==========================================
    // RECOMMANDATIONS
    // ==========================================
    genererRecommandations() {
        const recs = [];
        const stats = this.getStats();
        
        // Matières étudiées
        if (this.matieres.length > 0) {
            recs.push({
                type: 'info',
                message: `📚 ${this.matieres.length} matière(s) à étudier : ${this.matieres.join(', ')}`,
                action: 'Voir les sessions d\'étude'
            });
        }
        
        // Temps d'étude
        if (stats.heures_cours < 20) {
            recs.push({
                type: 'info',
                message: `📖 ${stats.heures_cours}h de cours. Prévoyez des sessions d'étude.`,
                action: 'Ajouter des sessions d\'étude'
            });
        }
        
        return recs;
    }

    // ==========================================
    // STATISTIQUES
    // ==========================================
    getStats() {
        const totalCours = this.emplois.length;
        const totalTaches = this.taches.length;
        const tachesTerminees = this.taches.filter(t => t.terminee).length;
        const heuresCours = this.emplois.reduce((sum, e) => sum + (e.heure_fin - e.heure_debut), 0);
        
        return {
            total_cours: totalCours,
            total_taches: totalTaches,
            taches_terminees: tachesTerminees,
            heures_cours: heuresCours,
            taux_completion: totalTaches > 0 ? Math.round((tachesTerminees / totalTaches) * 100) : 0,
            matieres: this.matieres
        };
    }
}

module.exports = PlanificateurIntelligent;