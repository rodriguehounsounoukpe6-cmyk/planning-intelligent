// ============================================
// APPLICATION PRINCIPALE
// ============================================

class App {
    constructor() {
        this.utilisateurId = localStorage.getItem('userId') || '';
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation de l\'application...');
        this.chargerInterface();
        if (this.utilisateurId) {
            document.getElementById('userId').value = this.utilisateurId;
            await this.chargerDonnees();
        }
        console.log('✅ Application prête !');
    }

    chargerInterface() {
        document.getElementById('btnOptimiser').addEventListener('click', () => this.optimiser());
        document.getElementById('btnAjouterCours').addEventListener('click', () => this.ajouterCours());
        document.getElementById('btnAjouterTache').addEventListener('click', () => this.ajouterTache());
        document.getElementById('btnCharger').addEventListener('click', () => this.chargerDonnees());
        // ✅ SUPPRIMÉ : btnNouvelUtilisateur n'existe plus dans le HTML
        document.getElementById('btnPDF').addEventListener('click', () => this.genererPDF());

        document.getElementById('userId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.chargerDonnees();
        });
    }

    // ==========================================
    // GESTION DES UTILISATEURS
    // ==========================================

    // ✅ Méthode conservée mais plus utilisée (peut être supprimée si souhaité)
    async creerUtilisateur() {
        const nom = prompt("👤 Entrez votre nom :", "Étudiant") || "Étudiant";
        const classe = prompt("📚 Entrez votre classe :", "Terminale") || "Non spécifié";
        
        try {
            const data = await ApiClient.creerUtilisateur(nom, classe);
            if (data.success) {
                this.utilisateurId = data.utilisateur.id;
                localStorage.setItem('userId', this.utilisateurId);
                document.getElementById('userId').value = this.utilisateurId;
                alert(`✅ Utilisateur créé avec succès !\n🆔 Votre ID : ${this.utilisateurId}`);
                await this.chargerDonnees();
            }
        } catch (error) {
            alert('❌ Erreur lors de la création : ' + error.message);
        }
    }

    async chargerDonnees() {
        const userId = document.getElementById('userId').value.trim() || this.utilisateurId;
        if (!userId) {
            alert('⚠️ Veuillez entrer un ID utilisateur');
            return;
        }
        this.utilisateurId = userId;
        localStorage.setItem('userId', userId);

        document.getElementById('planningContent').innerHTML = 
            '<p style="text-align:center;color:#666;">⏳ Chargement en cours...</p>';
        
        try {
            const stats = await ApiClient.getStats(userId);
            if (stats.success) {
                this.afficherStats(stats.stats);
            }
            
            const emploiData = await ApiClient.getEmploi(userId);
            if (emploiData.success) {
                this.afficherEmploi(emploiData.emplois, emploiData.resume);
            }
            
            const tachesData = await ApiClient.getTaches(userId);
            if (tachesData.success) {
                this.afficherTaches(tachesData.taches);
            }
            
            await this.afficherSuggestions(userId);
        } catch (error) {
            alert('❌ Erreur lors du chargement : ' + error.message);
        }
    }

    // ==========================================
    // AFFICHAGE
    // ==========================================

    afficherStats(stats) {
        if (stats) {
            document.getElementById('nbCours').textContent = stats.total_cours || 0;
            document.getElementById('nbTaches').textContent = stats.total_taches || 0;
            document.getElementById('heuresEtude').textContent = (stats.heures_cours || 0) + 'h';
        }
    }

    afficherEmploi(emplois, resume) {
        const container = document.getElementById('planningContent');
        let html = '';
        
        if (emplois && emplois.length > 0) {
            const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
            const emploisParJour = {};
            for (const e of emplois) {
                if (!emploisParJour[e.jour]) emploisParJour[e.jour] = [];
                emploisParJour[e.jour].push(e);
            }
            for (const jour of jours) {
                if (emploisParJour[jour] && emploisParJour[jour].length > 0) {
                    html += `<div class="jour-title">📅 ${jour.charAt(0).toUpperCase() + jour.slice(1)}</div>`;
                    for (const e of emploisParJour[jour]) {
                        html += `
                            <div class="tache-item">
                                <span class="nom">📖 ${e.matiere}</span>
                                <span class="heure">${e.heure_debut}h - ${e.heure_fin}h</span>
                                <span class="type">${e.jour}</span>
                            </div>
                        `;
                    }
                }
            }
        } else {
            html = `<div class="empty-message"><span class="emoji">📚</span>Aucun cours pour le moment</div>`;
        }
        container.innerHTML = html;
    }

    afficherTaches(taches) {
        const container = document.getElementById('tachesContent');
        if (!container) return;
        let html = '';
        if (taches && taches.length > 0) {
            for (const t of taches) {
                const emojis = { domestique: '🧹', personnel: '👤', etude: '📚' };
                const emoji = emojis[t.type] || '📌';
                html += `
                    <div class="tache-item">
                        <span class="nom">${emoji} ${t.nom}</span>
                        <span>⏱️ ${t.duree}min</span>
                        <span class="priorite">⭐ ${t.priorite}</span>
                        <span class="type ${t.type}">${t.type}</span>
                    </div>
                `;
            }
        } else {
            html = `<div class="empty-message"><span class="emoji">🧹</span>Aucune tâche enregistrée</div>`;
        }
        container.innerHTML = html;
    }

    async afficherSuggestions(userId) {
        const container = document.getElementById('recommandationsContent');
        if (!container) return;
        try {
            const data = await ApiClient.getSuggestions(userId);
            if (data.success && data.suggestions && data.suggestions.length > 0) {
                let html = `<div class="recommandations"><h4>💡 Suggestions personnalisées</h4><ul>`;
                for (const suggestion of data.suggestions) {
                    html += `<li>${suggestion.titre}<br><small>${suggestion.description}</small></li>`;
                }
                html += `</ul></div>`;
                container.innerHTML = html;
            }
        } catch (error) {
            container.innerHTML = '';
        }
    }

    afficherPlanningOptimise(plan, recommandations) {
        const container = document.getElementById('planningContent');
        let html = '';
        if (plan && plan.length > 0) {
            const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
            const planParJour = {};
            for (const p of plan) {
                if (!planParJour[p.jour]) planParJour[p.jour] = [];
                planParJour[p.jour].push(p);
            }
            for (const jour of jours) {
                if (planParJour[jour] && planParJour[jour].length > 0) {
                    html += `<div class="jour-title">📅 ${jour.charAt(0).toUpperCase() + jour.slice(1)}</div>`;
                    for (const p of planParJour[jour]) {
                        const emojis = { domestique: '🧹', personnel: '👤', etude: '📚' };
                        const emoji = emojis[p.type] || '📌';
                        html += `
                            <div class="tache-item">
                                <span class="nom">${emoji} ${p.tache}</span>
                                <span class="heure">${p.heure_debut}h - ${p.heure_fin}h</span>
                                <span class="priorite">⭐ ${p.priorite}</span>
                                <span class="type ${p.type}">${p.type}</span>
                            </div>
                        `;
                    }
                }
            }
        } else {
            html = `<div class="empty-message"><span class="emoji">📅</span>Aucune tâche à planifier</div>`;
        }
        container.innerHTML = html;
        
        const recContainer = document.getElementById('recommandationsContent');
        if (recommandations && recommandations.length > 0) {
            let recHtml = `<div class="recommandations"><h4>💡 Recommandations</h4><ul>`;
            for (const rec of recommandations) {
                recHtml += `<li>${rec.message}</li>`;
            }
            recHtml += `</ul></div>`;
            recContainer.innerHTML = recHtml;
        }
    }

    // ==========================================
    // ACTIONS
    // ==========================================

    async ajouterCours() {
        const userId = document.getElementById('userId').value.trim() || this.utilisateurId;
        if (!userId) {
            alert('⚠️ Veuillez créer ou charger un utilisateur d\'abord');
            return;
        }
        const matiere = document.getElementById('matiere').value.trim();
        const jour = document.getElementById('jourCours').value;
        const heureDebut = parseInt(document.getElementById('heureDebut').value);
        const heureFin = parseInt(document.getElementById('heureFin').value);
        if (!matiere || !heureDebut || !heureFin) {
            alert('⚠️ Veuillez remplir tous les champs');
            return;
        }
        if (heureDebut >= heureFin) {
            alert('⚠️ L\'heure de début doit être avant l\'heure de fin');
            return;
        }
        try {
            const data = await ApiClient.ajouterCours(userId, jour, heureDebut, heureFin, matiere);
            if (data.success) {
                alert('✅ Cours ajouté !');
                document.getElementById('matiere').value = '';
                document.getElementById('heureDebut').value = '';
                document.getElementById('heureFin').value = '';
                await this.chargerDonnees();
            }
        } catch (error) {
            alert('❌ Erreur : ' + error.message);
        }
    }

    async ajouterTache() {
        const userId = document.getElementById('userId').value.trim() || this.utilisateurId;
        if (!userId) {
            alert('⚠️ Veuillez créer ou charger un utilisateur d\'abord');
            return;
        }
        const nom = document.getElementById('nomTache').value.trim();
        const duree = parseInt(document.getElementById('dureeTache').value);
        const priorite = parseInt(document.getElementById('prioriteTache').value);
        const jour = document.getElementById('jourTache').value;
        const type = document.getElementById('typeTache').value;
        if (!nom || !duree) {
            alert('⚠️ Veuillez remplir tous les champs');
            return;
        }
        try {
            const data = await ApiClient.ajouterTache(userId, nom, duree, [jour], priorite, type);
            if (data.success) {
                alert('✅ Tâche ajoutée !');
                document.getElementById('nomTache').value = '';
                await this.chargerDonnees();
            }
        } catch (error) {
            alert('❌ Erreur : ' + error.message);
        }
    }

    async optimiser() {
        const userId = document.getElementById('userId').value.trim() || this.utilisateurId;
        if (!userId) {
            alert('⚠️ Veuillez créer ou charger un utilisateur d\'abord');
            return;
        }
        document.getElementById('planningContent').innerHTML = 
            '<p style="text-align:center;color:#666;">⏳ Génération du planning...</p>';
        document.getElementById('recommandationsContent').innerHTML = '';
        try {
            const data = await ApiClient.optimiser(userId);
            if (data.success) {
                this.afficherPlanningOptimise(data.plan, data.recommandations);
                if (data.stats) {
                    this.afficherStats(data.stats);
                }
            }
        } catch (error) {
            alert('❌ Erreur lors de l\'optimisation: ' + error.message);
        }
    }

    // ==========================================
    // ✅ GÉNÉRATION PDF AVEC API_BASE DYNAMIQUE
    // ==========================================

    async genererPDF() {
        const userId = document.getElementById('userId').value.trim() || this.utilisateurId;
        if (!userId) {
            alert('⚠️ Veuillez charger un utilisateur d\'abord');
            return;
        }

        try {
            const btnPDF = document.getElementById('btnPDF');
            const texteOriginal = btnPDF.textContent;
            btnPDF.textContent = '⏳ Génération...';
            btnPDF.disabled = true;

            const response = await fetch(`${window.API_BASE}/pdf/generer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ utilisateur_id: userId })
            });

            const data = await response.json();

            if (data.success) {
                const pdfUrl = `${window.API_BASE.replace('/api', '')}${data.pdf.url}`;
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = data.pdf.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                alert('✅ PDF téléchargé avec succès !');
            } else {
                alert('❌ Erreur: ' + (data.message || 'Erreur inconnue'));
            }

            btnPDF.textContent = texteOriginal;
            btnPDF.disabled = false;

        } catch (error) {
            alert('❌ Erreur: ' + error.message);
            const btnPDF = document.getElementById('btnPDF');
            btnPDF.textContent = '📄 Exporter PDF';
            btnPDF.disabled = false;
        }
    }
}

// ============================================
// DÉMARRAGE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Application démarrée !');
    window.app = new App();
    mettreAJourMenuConnexion();
});

// ============================================
// GESTION DE LA CONNEXION / DÉCONNEXION
// ============================================

function mettreAJourMenuConnexion() {
    const userId = localStorage.getItem('userId');
    const btnConnexion = document.getElementById('btnConnexion');
    
    if (!btnConnexion) return;
    
    if (userId) {
        btnConnexion.textContent = '🚪 Déconnexion';
        btnConnexion.onclick = function(e) {
            e.preventDefault();
            if (confirm('Voulez-vous vous déconnecter ?')) {
                localStorage.removeItem('userId');
                localStorage.removeItem('userNom');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userMatieres');
                localStorage.removeItem('userSerie');
                window.location.href = 'login.html';
            }
        };
    } else {
        btnConnexion.textContent = '🔐 Connexion';
        btnConnexion.onclick = function() {
            window.location.href = 'login.html';
        };
    }
}

window.mettreAJourMenuConnexion = mettreAJourMenuConnexion;
window.deconnexion = function() {
    if (confirm('Voulez-vous vous déconnecter ?')) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userNom');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userMatieres');
        localStorage.removeItem('userSerie');
        window.location.href = 'login.html';
    }
};