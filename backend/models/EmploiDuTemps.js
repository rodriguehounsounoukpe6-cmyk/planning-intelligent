// ============================================
// MODÈLE EMPLOI DU TEMPS SCOLAIRE
// Gère les cours et horaires des élèves
// ============================================

class EmploiDuTemps {
    /**
     * Crée un nouvel emploi du temps
     * @param {string} utilisateur_id - ID de l'élève
     * @param {string} jour - Jour de la semaine (lundi, mardi...)
     * @param {number} heure_debut - Heure de début (ex: 8 pour 8h)
     * @param {number} heure_fin - Heure de fin (ex: 10 pour 10h)
     * @param {string} matiere - Nom de la matière
     * @param {number} priorite - Priorité du cours (1-5, défaut: 3)
     */
    constructor(utilisateur_id, jour, heure_debut, heure_fin, matiere, priorite = 3) {
        this.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        this.utilisateur_id = utilisateur_id;
        this.jour = jour;
        this.heure_debut = heure_debut;
        this.heure_fin = heure_fin;
        this.matiere = matiere;
        this.type = 'scolaire';
        this.priorite = priorite;
        this.date_creation = new Date().toISOString();
        this.termine = false;
        
        // Validation des données
        this._validerDonnees();
    }

    /**
     * Valide les données du cours
     * @throws {Error} Si les données sont invalides
     */
    _validerDonnees() {
        const joursValides = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        
        if (!this.utilisateur_id) {
            throw new Error('L\'ID utilisateur est requis');
        }
        
        if (!joursValides.includes(this.jour)) {
            throw new Error(`Le jour "${this.jour}" n'est pas valide. Utilisez: ${joursValides.join(', ')}`);
        }
        
        if (this.heure_debut < 6 || this.heure_debut > 22) {
            throw new Error('L\'heure de début doit être entre 6h et 22h');
        }
        
        if (this.heure_fin < 7 || this.heure_fin > 23) {
            throw new Error('L\'heure de fin doit être entre 7h et 23h');
        }
        
        if (this.heure_debut >= this.heure_fin) {
            throw new Error('L\'heure de début doit être avant l\'heure de fin');
        }
        
        if (!this.matiere || this.matiere.trim() === '') {
            throw new Error('Le nom de la matière est requis');
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
            jour: this.jour,
            heure_debut: this.heure_debut,
            heure_fin: this.heure_fin,
            matiere: this.matiere,
            type: this.type,
            priorite: this.priorite,
            date_creation: this.date_creation,
            termine: this.termine
        };
    }

    /**
     * Calcule la durée du cours en heures
     * @returns {number} Durée en heures
     */
    getDureeEnHeures() {
        return this.heure_fin - this.heure_debut;
    }

    /**
     * Calcule la durée du cours en minutes
     * @returns {number} Durée en minutes
     */
    getDureeEnMinutes() {
        return (this.heure_fin - this.heure_debut) * 60;
    }

    /**
     * Vérifie si le cours est en cours à une heure donnée
     * @param {number} heure - Heure à vérifier
     * @returns {boolean} True si le cours est en cours
     */
    estEnCours(heure) {
        return heure >= this.heure_debut && heure < this.heure_fin;
    }

    /**
     * Vérifie si le cours est un cours du matin
     * @returns {boolean} True si le cours est avant 12h
     */
    estMatin() {
        return this.heure_fin <= 12;
    }

    /**
     * Vérifie si le cours est un cours de l'après-midi
     * @returns {boolean} True si le cours est après 12h
     */
    estApresMidi() {
        return this.heure_debut >= 12;
    }

    /**
     * Retourne une version simplifiée pour l'affichage
     * @returns {object} Données simplifiées
     */
    getResume() {
        return {
            jour: this.jour,
            horaire: `${this.heure_debut}h - ${this.heure_fin}h`,
            matiere: this.matiere,
            duree: this.getDureeEnHeures() + 'h'
        };
    }
}

// Exporter la classe
module.exports = EmploiDuTemps;