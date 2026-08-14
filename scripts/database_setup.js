// ============================================
// SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES
// ============================================

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../backend/data.json');

console.log('📦 Initialisation de la base de données...');

// Créer le fichier de données s'il n'existe pas
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        utilisateurs: [],
        emplois: [],
        taches: []
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('✅ Base de données initialisée avec succès !');
    console.log(`📁 Fichier créé : ${DATA_FILE}`);
} else {
    console.log('✅ Base de données déjà existante.');
}

// Ajouter des données de test
const testData = {
    utilisateurs: [
        {
            id: '1',
            nom: 'Étudiant Test',
            classe: 'Terminale',
            preferences: {
                moment_optimal: 'matin',
                duree_session: 45,
                pauses: true
            },
            date_creation: new Date().toISOString()
        }
    ],
    emplois: [
        {
            id: '101',
            utilisateur_id: '1',
            jour: 'lundi',
            heure_debut: 8,
            heure_fin: 10,
            matiere: 'Mathématiques',
            type: 'scolaire',
            priorite: 3,
            date_creation: new Date().toISOString()
        },
        {
            id: '102',
            utilisateur_id: '1',
            jour: 'mardi',
            heure_debut: 9,
            heure_fin: 11,
            matiere: 'Français',
            type: 'scolaire',
            priorite: 3,
            date_creation: new Date().toISOString()
        },
        {
            id: '103',
            utilisateur_id: '1',
            jour: 'mercredi',
            heure_debut: 14,
            heure_fin: 16,
            matiere: 'Physique',
            type: 'scolaire',
            priorite: 3,
            date_creation: new Date().toISOString()
        }
    ],
    taches: [
        {
            id: '201',
            utilisateur_id: '1',
            nom: 'Devoirs Maths',
            duree: 45,
            jours: ['lundi', 'mercredi'],
            priorite: 5,
            type: 'etude',
            terminee: false,
            date_creation: new Date().toISOString()
        },
        {
            id: '202',
            utilisateur_id: '1',
            nom: 'Faire la vaisselle',
            duree: 15,
            jours: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
            priorite: 1,
            type: 'domestique',
            terminee: false,
            date_creation: new Date().toISOString()
        },
        {
            id: '203',
            utilisateur_id: '1',
            nom: 'Révision Anglais',
            duree: 30,
            jours: ['mardi', 'jeudi'],
            priorite: 3,
            type: 'etude',
            terminee: false,
            date_creation: new Date().toISOString()
        }
    ]
};

// Écrire les données de test
fs.writeFileSync(DATA_FILE, JSON.stringify(testData, null, 2));
console.log('✅ Données de test ajoutées !');
console.log('📊 Utilisateur ID: 1');
console.log('📚 3 cours ajoutés');
console.log('🧹 3 tâches ajoutées');
console.log('\n🚀 Lancez maintenant: node server.js');