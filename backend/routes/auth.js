const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const User = require('../models/User');
const { read, write } = require('../lib/store');
const { text, number, handleError } = require('../lib/validation');
const { authenticate, createSession, clearSession, selfId } = require('../middleware/auth');
const router = express.Router();
const publicUser = (u) => { const { password, ...safe } = u; return safe; };
const attempts = new Map();
function throttle(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  if (attempts.size > 5000) attempts.clear();
  const state = attempts.get(ip) || { count:0, reset:now + 60000 };
  if (state.reset < now) { state.count = 0; state.reset = now + 60000; }
  state.count += 1;
  attempts.set(ip, state);
  if (state.count > 12) return res.status(429).json({success:false,message:'Trop de tentatives. Réessayez dans une minute.'});
  next();
}
router.post('/register', throttle, (req,res) => {
  try {
    const { classe, password, serie, preferences = {} } = req.body;
    const nom = text(req.body.nom,'Nom',100);
    const email = text(req.body.email, 'Email',254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({success:false,message:'Email invalide'});
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) return res.status(400).json({success:false,message:'Le mot de passe doit contenir entre 8 et 128 caractères'});
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return res.status(400).json({success:false,message:'Préférences invalides'});
    const data = read();
    if (data.utilisateurs.some(u => String(u.email).toLowerCase() === email)) return res.status(409).json({success:false,message:'Cet email est déjà utilisé'});
    const cleanPref = {
      moment_optimal: ['matin','apres-midi','soir'].includes(preferences.moment_optimal) ? preferences.moment_optimal : 'matin',
      duree_session: number(preferences.duree_session ?? 45,'Durée',20,90),
      pauses: preferences.pauses !== false,
      matieres: Array.isArray(preferences.matieres) ? preferences.matieres.slice(0,30).filter(m => m && typeof m.nom === 'string').map(m => ({ nom: text(m.nom,'Matière',100), niveau: ['faible','moyen','eleve'].includes(m.niveau) ? m.niveau : 'moyen' })) : []
    };
    const user = new User(randomUUID(), nom, String(classe || 'Non spécifié').slice(0,100), email, password, {...cleanPref, serie: String(serie || '').slice(0,60)});
    const serialized = user.toJSON();
    data.utilisateurs.push(serialized);
    write(data);
    createSession(req,res,user.id);
    return res.status(201).json({success:true,message:'Compte créé',utilisateur:publicUser(serialized)});
  } catch(err) { return handleError(err,res); }
});
router.post('/login', throttle, (req,res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    if (!email || typeof password !== 'string') return res.status(400).json({success:false,message:'Email et mot de passe requis'});
    const data=read();
    const user=data.utilisateurs.find(u => String(u.email).toLowerCase() === email);
    if (!user || !user.password || !bcrypt.compareSync(password,user.password)) return res.status(401).json({success:false,message:'Email ou mot de passe incorrect'});
    user.derniere_connexion=new Date().toISOString();
    write(data); createSession(req,res,user.id);
    return res.json({success:true,message:'Connexion réussie',utilisateur:publicUser(user)});
  } catch(err) { return handleError(err,res); }
});
router.post('/logout', (req,res) => { clearSession(req,res); res.json({success:true}); });
router.use(authenticate);
router.get('/me', (req,res) => {
  try { const u = read().utilisateurs.find(u=>u.id===req.userId); return u ? res.json({success:true,utilisateur:publicUser(u)}) : res.status(401).json({success:false,message:'Session invalide'}); }
  catch(err) { return handleError(err,res); }
});
router.get('/user/:id', (req,res) => {
  if (!selfId(req.params.id,req,res)) return;
  try { const u=read().utilisateurs.find(u=>u.id===req.userId); return u ? res.json({success:true,utilisateur:publicUser(u)}) : res.status(404).json({success:false,message:'Utilisateur non trouvé'}); }
  catch(err) { return handleError(err,res); }
});
router.put('/user/:id', (req,res) => {
  if (!selfId(req.params.id,req,res)) return;
  try {
    const data=read(); const user=data.utilisateurs.find(u=>u.id===req.userId);
    if (!user) return res.status(404).json({success:false,message:'Utilisateur non trouvé'});
    if (req.body.nom !== undefined) user.nom=text(req.body.nom,'Nom',100);
    if (req.body.classe !== undefined) user.classe=text(req.body.classe,'Classe',100);
    if (req.body.serie !== undefined) user.serie=String(req.body.serie).slice(0,60);
    if (req.body.preferences !== undefined) {
      const p=req.body.preferences;
      if (!p || typeof p!=='object' || Array.isArray(p)) return res.status(400).json({success:false,message:'Préférences invalides'});
      const next={...user.preferences};
      if (p.moment_optimal!==undefined) { if (!['matin','apres-midi','soir'].includes(p.moment_optimal)) return res.status(400).json({success:false,message:'Moment optimal invalide'}); next.moment_optimal=p.moment_optimal; }
      if (p.duree_session!==undefined) next.duree_session=number(p.duree_session,'Durée',20,90);
      if (p.pauses!==undefined) { if (typeof p.pauses!=='boolean') return res.status(400).json({success:false,message:'Pauses invalides'}); next.pauses=p.pauses; }
      user.preferences=next;
      if (p.matieres!==undefined) {
        if (!Array.isArray(p.matieres) || p.matieres.length>30) return res.status(400).json({success:false,message:'Liste de matières invalide'});
        user.matieres=p.matieres.map(m=>({nom:text(m.nom,'Matière',100),niveau:['faible','moyen','eleve'].includes(m.niveau)?m.niveau:'moyen',temps: Number.isFinite(Number(m.temps)) ? Math.min(10,Math.max(0.5,Number(m.temps))):2}));
      }
    }
    write(data);return res.json({success:true,message:'Utilisateur mis à jour',utilisateur:publicUser(user)});
  } catch(err) {return handleError(err,res);}
});
router.delete('/user/:id', (req,res) => {
  if (!selfId(req.params.id,req,res)) return;
  try { const data=read();data.utilisateurs=data.utilisateurs.filter(u=>u.id!==req.userId);data.emplois=data.emplois.filter(e=>e.utilisateur_id!==req.userId);data.taches=data.taches.filter(t=>t.utilisateur_id!==req.userId);write(data);clearSession(req,res);return res.json({success:true,message:'Compte supprimé'}); }
  catch(err) {return handleError(err,res);}
});
// L'ancien GET /users exposait l'ensemble des utilisateurs. Il a été supprimé.
module.exports=router;
