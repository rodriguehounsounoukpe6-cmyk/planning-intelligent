// ============================================
// MODÈLE UTILISATEUR AVEC AUTHENTIFICATION ET SÉRIE
// ============================================

const bcrypt = require('bcryptjs');

class User {
    constructor(id, nom, classe, email, password, preferences = {}) {
        this.id = id;
        this.nom = nom;
        this.classe = classe;
        this.email = email;
        this.password = this._hashPassword(password);
        this.serie = preferences.serie || ''; // ✅ Nouveau champ
        this.preferences = {
            moment_optimal: preferences.moment_optimal || 'matin',
            duree_session: preferences.duree_session || 45,
            pauses: preferences.pauses !== undefined ? preferences.pauses : true
        };
        this.matieres = preferences.matieres || [];
        this.date_creation = new Date().toISOString();
        this.derniere_connexion = null;
        this.type = 'etudiant';
    }

    _hashPassword(password) {
        if (!password) return null;
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    verifierPassword(password) {
        if (!this.password) return false;
        return bcrypt.compareSync(password, this.password);
    }

    toJSON() {
        return {
            id: this.id,
            nom: this.nom,
            classe: this.classe,
            email: this.email,
            password: this.password, // ✅ AJOUTÉ !!!
            serie: this.serie,
            preferences: this.preferences,
            matieres: this.matieres,
            date_creation: this.date_creation,
            derniere_connexion: this.derniere_connexion,
            type: this.type
        };
    }
}

module.exports = User;