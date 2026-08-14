// ============================================
// MODÈLE TÂCHE
// Gère les tâches domestiques et personnelles
// ============================================

class Tache {
    /**
     * Crée une nouvelle tâche
     * @param {string} utilisateur_id - ID de l'élève
     * @param {string} nom - Nom de la tâche
     * @param {number} duree - Durée en minutes
     * @param {array} jours - Jours où la tâche doit être faite
     * @param {number} priorite - Priorité (1-5)
     * @param {string} type - Type de tâche: 'domestique', 'personnel', 'etude'
     */
    constructor(utilisateur_id, nom, duree, jours, priorite = 1, type = 'domestique') {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        this.utilisateur_id = utilisateur_id;
        this.nom = nom;
        this.duree = duree; // en minutes
        this.jours = jours; // tableau de jours ['lundi', 'mercredi']
        this.priorite = priorite; // 1-5 (1=faible, 5=élevée)
        this.type = type; // 'domestique', 'personnel', 'etude'
        this.terminee = false;
        this.date_creation = new Date().toISOString();
        this.date_realisation = null;
        this.recurrente = false;
        this.notes = '';
        
        // Validation des données
        this._validerDonnees();
    }

    /**
     * Valide les données de la tâche
     * @throws {Error} Si les données sont invalides
     */
    _validerDonnees() {
        const joursValides = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const typesValides = ['domestique', 'personnel', 'etude'];
        
        if (!this.utilisateur_id) {
            throw new Error('L\'ID utilisateur est requis');
        }
        
        if (!this.nom || this.nom.trim() === '') {
            throw new Error('Le nom de la tâche est requis');
        }
        
        if (this.duree < 1) {
            throw new Error('La durée doit être d\'au moins 1 minute');
        }
        
        if (this.duree > 480) {
            throw new Error('La durée ne peut pas dépasser 480 minutes (8h)');
        }
        
        if (!this.jours || this.jours.length === 0) {
            throw new Error('Au moins un jour doit être spécifié');
        }
        
        for (const jour of this.jours) {
            if (!joursValides.includes(jour)) {
                throw new Error(`Le jour "${jour}" n'est pas valide. Utilisez: ${joursValides.join(', ')}`);
            }
        }
        
        if (this.priorite < 1 || this.priorite > 5) {
            throw new Error('La priorité doit être entre 1 et 5');
        }
        
        if (!typesValides.includes(this.type)) {
            throw new Error(`Le type "${this.type}" n'est pas valide. Utilisez: ${typesValides.join(', ')}`);
        }
    }

    /**
     * Convertit l'objet en JSON
     * @returns {object} Données formatées pour le stockage
     */
    toJSON() {
        return {
            id: this.id,
            utilisateur_id: this.utilisateur_id,
            nom: this.nom,
            duree: this.duree,
            jours: this.jours,
            priorite: this.priorite,
            type: this.type,
            terminee: this.terminee,
            date_creation: this.date_creation,
            date_realisation: this.date_realisation,
            recurrente: this.recurrente,
            notes: this.notes
        };
    }

    /**
     * Marque la tâche comme terminée
     * @returns {object} La tâche mise à jour
     */
    marquerTerminee() {
        this.terminee = true;
        this.date_realisation = new Date().toISOString();
        return this.toJSON();
    }

    /**
     * Marque la tâche comme non terminée
     * @returns {object} La tâche mise à jour
     */
    marquerNonTerminee() {
        this.terminee = false;
        this.date_realisation = null;
        return this.toJSON();
    }

    /**
     * Vérifie si la tâche doit être faite un jour donné
     * @param {string} jour - Jour à vérifier
     * @returns {boolean} True si la tâche est prévue ce jour
     */
    estPrevueCeJour(jour) {
        return this.jours.includes(jour);
    }

    /**
     * Ajoute un jour à la tâche
     * @param {string} jour - Jour à ajouter
     */
    ajouterJour(jour) {
        if (!this.jours.includes(jour)) {
            this.jours.push(jour);
        }
    }

    /**
     * Enlève un jour de la tâche
     * @param {string} jour - Jour à enlever
     */
    enleverJour(jour) {
        this.jours = this.jours.filter(j => j !== jour);
    }

    /**
     * Calcule le score de priorité pondéré
     * @returns {number} Score de priorité
     */
    getScorePriorite() {
        // Priorité de base (1-5)
        let score = this.priorite;
        
        // Bonus si la tâche est d'étude
        if (this.type === 'etude') {
            score += 1;
        }
        
        // Bonus si la tâche est sur plusieurs jours
        if (this.jours.length > 3) {
            score += 0.5;
        }
        
        return Math.min(score, 10); // Max 10
    }

    /**
     * Retourne une version simplifiée pour l'affichage
     * @returns {object} Données simplifiées
     */
    getResume() {
        const emojis = {
            domestique: '🧹',
            personnel: '👤',
            etude: '📚'
        };
        
        return {
            emoji: emojis[this.type] || '📌',
            nom: this.nom,
            duree: this.duree + 'min',
            priorite: '⭐'.repeat(this.priorite),
            jours: this.jours.join(', '),
            terminee: this.terminee ? '✅' : '⏳'
        };
    }

    /**
     * Vérifie si la tâche est à faire aujourd'hui
     * @returns {boolean} True si la tâche est prévue aujourd'hui
     */
    estAujourdhui() {
        const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const aujourdhui = joursSemaine[new Date().getDay()];
        return this.estPrevueCeJour(aujourdhui);
    }

    /**
     * Vérifie si la tâche est urgente (à faire dans les 2 prochains jours)
     * @returns {boolean} True si la tâche est urgente
     */
    estUrgente() {
        const joursSemaine = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const aujourdhui = new Date().getDay();
        
        for (const jour of this.jours) {
            const indexJour = joursSemaine.indexOf(jour);
            let difference = indexJour - aujourdhui;
            if (difference < 0) difference += 7;
            if (difference <= 2) return true;
        }
        return false;
    }
}

// Exporter la classe
module.exports = Tache;