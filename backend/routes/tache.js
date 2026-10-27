const express = require('express');
const { randomUUID } = require('node:crypto');
const { read, write } = require('../lib/store');
const { DAYS, task, handleError } = require('../lib/validation');
const { bodySelf, paramSelf } = require('../middleware/auth');
const router = express.Router();
router.post('/add',bodySelf,(req,res)=> {
  try {
    const data=read();if (!data.utilisateurs.some(u=>u.id===req.userId)) return res.status(404).json({success:false,message:'Utilisateur non trouvé'});
    const tache={id:randomUUID(),utilisateur_id:req.userId,...task(req.body),terminee:false,date_creation:new Date().toISOString(),date_realisation:null,recurrente:false,notes:''};
    data.taches.push(tache);write(data);return res.status(201).json({success:true,message:'Tâche ajoutée',tache});
  } catch(err) {return handleError(err,res);}
});
router.get('/:utilisateur_id',paramSelf,(req,res)=> {
  try {
    const data=read();if (!data.utilisateurs.some(u=>u.id===req.userId)) return res.status(404).json({success:false,message:'Utilisateur non trouvé'});
    const taches=data.taches.filter(t=>t.utilisateur_id===req.userId);
    const terminees=taches.filter(t=>t.terminee).length;
    return res.json({success:true,total:taches.length,terminees,en_attente:taches.length-terminees,par_type:{domestique:taches.filter(t=>t.type==='domestique').length,personnel:taches.filter(t=>t.type==='personnel').length,etude:taches.filter(t=>t.type==='etude').length},taches});
  } catch(err) {return handleError(err,res);}
});
router.get('/:utilisateur_id/:jour',paramSelf,(req,res)=> {
  if (!DAYS.includes(req.params.jour)) return res.status(400).json({success:false,message:'Jour invalide'});
  try {
    const taches=read().taches.filter(t=>t.utilisateur_id===req.userId && t.jours.includes(req.params.jour));
    return res.json({success:true,jour:req.params.jour,total:taches.length,duree_totale:taches.reduce((s,t)=>s+t.duree,0)+'min',taches});
  } catch(err) {return handleError(err,res);}
});
router.put('/:id',(req,res)=> {
  try {
    const data=read();const tache=data.taches.find(t=>t.id===req.params.id && t.utilisateur_id===req.userId);
    if (!tache) return res.status(404).json({success:false,message:'Tâche introuvable'});
    Object.assign(tache,task({...tache,...req.body}));
    if (req.body.terminee!==undefined) {
      if (typeof req.body.terminee!=='boolean') return res.status(400).json({success:false,message:'État terminé invalide'});
      tache.terminee=req.body.terminee;tache.date_realisation=tache.terminee?new Date().toISOString():null;
    }
    write(data);return res.json({success:true,message:'Tâche modifiée',tache});
  } catch(err) {return handleError(err,res);}
});
router.patch('/:id/complete',(req,res)=> {
  try {
    const data=read();const tache=data.taches.find(t=>t.id===req.params.id && t.utilisateur_id===req.userId);
    if (!tache) return res.status(404).json({success:false,message:'Tâche introuvable'});
    tache.terminee=!tache.terminee;tache.date_realisation=tache.terminee?new Date().toISOString():null;
    write(data);return res.json({success:true,message:tache.terminee?'Tâche terminée':'Tâche rouverte',tache});
  } catch(err) {return handleError(err,res);}
});
router.delete('/:id',(req,res)=> {
  try {
    const data=read();const i=data.taches.findIndex(t=>t.id===req.params.id && t.utilisateur_id===req.userId);
    if (i<0) return res.status(404).json({success:false,message:'Tâche introuvable'});
    data.taches.splice(i,1);write(data);return res.json({success:true,message:'Tâche supprimée'});
  } catch(err) {return handleError(err,res);}
});
module.exports=router;
