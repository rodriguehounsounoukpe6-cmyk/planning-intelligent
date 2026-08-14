// ============================================
// CLIENT API - DÉTECTION AUTOMATIQUE
// ============================================

// 🔥 Détection automatique de l'API (fonctionne sur localhost, réseau local et Render)
const getApiBase = () => {
    const hostname = window.location.hostname;
    const port = window.location.port || '3000';
    
    // ✅ Si on est sur Render
    if (hostname.includes('onrender.com')) {
        return `https://${hostname}/api`;
    }
    
    // ✅ Si on est sur localhost (ordinateur)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:${port}/api`;
    }
    
    // ✅ Si on est sur le réseau local (téléphone, autre ordi)
    return `http://${hostname}:${port}/api`;
};

const API_BASE = getApiBase();

console.log('📦 API Client chargé avec succès !');
console.log(`🔗 API Base: ${API_BASE}`);

/**
 * Client API pour communiquer avec le serveur
 */
class ApiClient {
    /**
     * Effectue une requête HTTP
     * @param {string} endpoint - Point d'accès (ex: /auth/register)
     * @param {object} options - Options de la requête
     * @returns {Promise} Réponse de l'API
     */
    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Si on a un body, le stringifier
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log(`📡 Requête: ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                console.error('❌ Erreur API:', data);
                throw new Error(data.message || `Erreur ${response.status}`);
            }
            
            console.log('✅ Réponse reçue:', data);
            return data;
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            throw error;
        }
    }

    // ==========================================
    // AUTHENTIFICATION
    // ==========================================

    /**
     * Crée un nouvel utilisateur
     * @param {string} nom - Nom de l'utilisateur
     * @param {string} classe - Classe de l'utilisateur
     * @param {object} preferences - Préférences de l'utilisateur
     * @returns {Promise} Données de l'utilisateur créé
     */
    static async creerUtilisateur(nom, classe, preferences = {}) {
        return this.request('/auth/register', {
            method: 'POST',
            body: { nom, classe, preferences }
        });
    }

    /**
     * Récupère un utilisateur par son ID
     * @param {string} id - ID de l'utilisateur
     * @returns {Promise} Données de l'utilisateur
     */
    static async getUtilisateur(id) {
        return this.request(`/auth/user/${id}`);
    }

    /**
     * Met à jour un utilisateur
     * @param {string} id - ID de l'utilisateur
     * @param {object} data - Données à mettre à jour
     * @returns {Promise} Données mises à jour
     */
    static async updateUtilisateur(id, data) {
        return this.request(`/auth/user/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * Supprime un utilisateur
     * @param {string} id - ID de l'utilisateur
     * @returns {Promise} Confirmation
     */
    static async deleteUtilisateur(id) {
        return this.request(`/auth/user/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Liste tous les utilisateurs
     * @returns {Promise} Liste des utilisateurs
     */
    static async listUtilisateurs() {
        return this.request('/auth/users');
    }

    /**
     * Connexion avec email et mot de passe
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe
     * @returns {Promise} Données de l'utilisateur connecté
     */
    static async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { email, password }
        });
    }

    // ==========================================
    // EMPLOI DU TEMPS
    // ==========================================

    /**
     * Ajoute un cours
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @param {string} jour - Jour de la semaine
     * @param {number} heure_debut - Heure de début
     * @param {number} heure_fin - Heure de fin
     * @param {string} matiere - Nom de la matière
     * @param {number} priorite - Priorité (1-5)
     * @returns {Promise} Données du cours ajouté
     */
    static async ajouterCours(utilisateur_id, jour, heure_debut, heure_fin, matiere, priorite = 3) {
        return this.request('/emploi/add', {
            method: 'POST',
            body: { utilisateur_id, jour, heure_debut, heure_fin, matiere, priorite }
        });
    }

    /**
     * Récupère l'emploi du temps d'un utilisateur
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Emploi du temps
     */
    static async getEmploi(utilisateur_id) {
        return this.request(`/emploi/${utilisateur_id}`);
    }

    /**
     * Récupère l'emploi du temps pour un jour spécifique
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @param {string} jour - Jour de la semaine
     * @returns {Promise} Emploi du temps du jour
     */
    static async getEmploiJour(utilisateur_id, jour) {
        return this.request(`/emploi/${utilisateur_id}/${jour}`);
    }

    /**
     * Met à jour un cours
     * @param {string} id - ID du cours
     * @param {object} data - Données à mettre à jour
     * @returns {Promise} Cours mis à jour
     */
    static async updateCours(id, data) {
        return this.request(`/emploi/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * Supprime un cours
     * @param {string} id - ID du cours
     * @returns {Promise} Confirmation
     */
    static async deleteCours(id) {
        return this.request(`/emploi/${id}`, {
            method: 'DELETE'
        });
    }

    // ==========================================
    // TÂCHES
    // ==========================================

    /**
     * Ajoute une tâche
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @param {string} nom - Nom de la tâche
     * @param {number} duree - Durée en minutes
     * @param {array} jours - Jours de la semaine
     * @param {number} priorite - Priorité (1-5)
     * @param {string} type - Type de tâche
     * @returns {Promise} Données de la tâche ajoutée
     */
    static async ajouterTache(utilisateur_id, nom, duree, jours, priorite = 1, type = 'domestique') {
        return this.request('/tache/add', {
            method: 'POST',
            body: { utilisateur_id, nom, duree, jours, priorite, type }
        });
    }

    /**
     * Récupère les tâches d'un utilisateur
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Liste des tâches
     */
    static async getTaches(utilisateur_id) {
        return this.request(`/tache/${utilisateur_id}`);
    }

    /**
     * Met à jour une tâche
     * @param {string} id - ID de la tâche
     * @param {object} data - Données à mettre à jour
     * @returns {Promise} Tâche mise à jour
     */
    static async updateTache(id, data) {
        return this.request(`/tache/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * Supprime une tâche
     * @param {string} id - ID de la tâche
     * @returns {Promise} Confirmation
     */
    static async deleteTache(id) {
        return this.request(`/tache/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Marque une tâche comme terminée
     * @param {string} id - ID de la tâche
     * @returns {Promise} Tâche mise à jour
     */
    static async marquerTerminee(id) {
        return this.request(`/tache/${id}/complete`, {
            method: 'PATCH'
        });
    }

    // ==========================================
    // OPTIMISATION
    // ==========================================

    /**
     * Génère le planning optimisé
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Planning optimisé
     */
    static async optimiser(utilisateur_id) {
        return this.request('/optimisation/generer', {
            method: 'POST',
            body: { utilisateur_id }
        });
    }

    /**
     * Récupère les statistiques d'un utilisateur
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Statistiques
     */
    static async getStats(utilisateur_id) {
        return this.request(`/optimisation/stats/${utilisateur_id}`);
    }

    /**
     * Récupère des suggestions personnalisées
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Suggestions
     */
    static async getSuggestions(utilisateur_id) {
        return this.request('/optimisation/suggestions', {
            method: 'POST',
            body: { utilisateur_id }
        });
    }

    // ==========================================
    // SAUVEGARDE ET PARTAGE
    // ==========================================

    /**
     * Sauvegarde le planning modifié
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @param {array} plan - Planning à sauvegarder
     * @returns {Promise} Confirmation de sauvegarde
     */
    static async sauvegarderPlanning(utilisateur_id, plan) {
        return this.request('/optimisation/sauvegarder', {
            method: 'POST',
            body: { utilisateur_id, plan }
        });
    }

    /**
     * Récupère la dernière sauvegarde du planning
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Dernier planning sauvegardé
     */
    static async getSauvegarde(utilisateur_id) {
        return this.request(`/optimisation/sauvegarde/${utilisateur_id}`);
    }

    /**
     * Génère un lien de partage pour le planning
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Lien de partage
     */
    static async partagerPlanning(utilisateur_id) {
        return this.request('/optimisation/partager', {
            method: 'POST',
            body: { utilisateur_id }
        });
    }

    /**
     * Récupère les statistiques avancées
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} Statistiques détaillées
     */
    static async getStatsAvancees(utilisateur_id) {
        return this.request(`/auth/stats/avancees/${utilisateur_id}`);
    }

    // ==========================================
    // PDF
    // ==========================================

    /**
     * Génère le PDF du planning
     * @param {string} utilisateur_id - ID de l'utilisateur
     * @returns {Promise} PDF généré
     */
    static async genererPDF(utilisateur_id) {
        return this.request('/pdf/generer', {
            method: 'POST',
            body: { utilisateur_id }
        });
    }
}

// Exporter pour utilisation globale
window.ApiClient = ApiClient;

console.log('📦 API Client chargé avec succès !');
console.log(`🔗 API Base: ${API_BASE}`);