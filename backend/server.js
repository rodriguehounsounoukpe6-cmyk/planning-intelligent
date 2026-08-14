const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ✅ AJOUT : Import du service PDF
const PDFGenerator = require('./services/PDFGenerator');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ RENDER : Utilise le port dynamique

// Middleware
app.use(cors());
app.use(express.json());

// Servir le frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
const authRoutes = require('./routes/auth');
const emploiRoutes = require('./routes/emploi');
const optimisationRoutes = require('./routes/optimisation');
const tacheRoutes = require('./routes/tache');

app.use('/api/auth', authRoutes);
app.use('/api/emploi', emploiRoutes);
app.use('/api/optimisation', optimisationRoutes);
app.use('/api/tache', tacheRoutes);

// ============================================
// ✅ Route pour générer le PDF
// ============================================
app.post('/api/pdf/generer', async (req, res) => {
    try {
        const { utilisateur_id } = req.body;
        
        // Lire les données
        const donnees = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
        const utilisateur = donnees.utilisateurs.find(u => u.id === utilisateur_id);
        
        if (!utilisateur) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // Récupérer les cours et tâches
        const emplois = donnees.emplois.filter(e => e.utilisateur_id === utilisateur_id);
        const taches = donnees.taches.filter(t => t.utilisateur_id === utilisateur_id);

        // Générer le planning optimisé
        const Planificateur = require('./services/Planificateur');
        const planificateur = new Planificateur(utilisateur_id);
        const plan = planificateur.optimiserTaches();

        // Générer le PDF
        const result = await PDFGenerator.genererPlanningPDF(
            utilisateur,
            plan,
            emplois,
            taches
        );

        res.json({
            success: true,
            message: '✅ PDF généré avec succès !',
            pdf: result
        });

    } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du PDF',
            error: error.message
        });
    }
});

// ============================================
// ✅ Route pour télécharger le PDF
// ============================================
app.get('/pdfs/:filename', (req, res) => {
    const filepath = path.join(__dirname, 'pdfs', req.params.filename);
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
});

// Route par défaut
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Route API
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Bienvenue sur l\'API de Planning Intelligent !',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',   // ✅ AJOUTÉ
                user: 'GET /api/auth/user/:id',
                update: 'PUT /api/auth/user/:id',
                delete: 'DELETE /api/auth/user/:id',
                users: 'GET /api/auth/users'
            },
            emploi: {
                add: 'POST /api/emploi/add',
                get: 'GET /api/emploi/:utilisateur_id',
                getDay: 'GET /api/emploi/:utilisateur_id/:jour',
                update: 'PUT /api/emploi/:id',
                delete: 'DELETE /api/emploi/:id'
            },
            optimisation: {
                generate: 'POST /api/optimisation/generer',
                stats: 'GET /api/optimisation/stats/:utilisateur_id',
                suggestions: 'POST /api/optimisation/suggestions'
            },
            pdf: {
                generate: 'POST /api/pdf/generer',
                download: 'GET /pdfs/:filename'
            }
        },
        documentation: 'Consultez le README.md pour plus d\'informations'
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route non trouvée',
        help: 'Allez sur / pour l\'interface ou /api pour les endpoints'
    });
});

// ============================================
// ✅ DÉMARRER LE SERVEUR SUR LE PORT DYNAMIQUE
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 SERVEUR DÉMARRÉ AVEC SUCCÈS !');
    console.log('========================================');
    console.log(`📍 URL: http://0.0.0.0:${PORT}`);
    console.log(`📁 Données: ${path.join(__dirname, 'data.json')}`);
    console.log('📊 Status: En ligne');
    console.log('========================================');
    console.log('📚 Endpoints disponibles:');
    console.log('  GET  /                    - Interface utilisateur');
    console.log('  GET  /api                 - Voir tous les endpoints');
    console.log('  POST /api/auth/register   - Créer un utilisateur');
    console.log('  POST /api/auth/login      - Connexion');  // ✅ AJOUTÉ
    console.log('  GET  /api/auth/user/:id   - Récupérer un utilisateur');
    console.log('  POST /api/emploi/add      - Ajouter un cours');
    console.log('  GET  /api/emploi/:id      - Voir l\'emploi du temps');
    console.log('  POST /api/optimisation/generer - Optimiser le planning');
    console.log('  POST /api/tache/add       - Ajouter une tâche');
    console.log('  GET  /api/tache/:id       - Voir les tâches');
    console.log('  POST /api/pdf/generer     - Générer le PDF');
    console.log('  GET  /pdfs/:filename      - Télécharger le PDF');
    console.log('========================================');
    console.log('💡 Appuyez sur Ctrl+C pour arrêter le serveur');
});