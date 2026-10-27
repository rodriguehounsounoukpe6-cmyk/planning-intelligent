const express = require('express');
const { randomUUID } = require('node:crypto');
const { read, write } = require('../lib/store');
const { DAYS, course, handleError } = require('../lib/validation');
const { bodySelf, paramSelf } = require('../middleware/auth');
const router = express.Router();

router.post('/add', bodySelf, (req,res) => {
  try {
    const data=read();
    if (!data.utilisateurs.some(u=>u.id===req.userId)) return res.status(404).json({success:false,message:'Utilisateur non trouvé'});
    const fields=course(req.body);
    if (data.emplois.some(e => e.utilisateur_id===req.userId && e.jour===fields.jour && fields.heure_debut<e.heure_fin && fields.heure_fin>e.heure_debut)) return res.status(409).json({success:false,message:'Ce cours chevauche un autre cours'});
    const cours={id:randomUUID(),utilisateur_id:req.userId,...fields,type:'scolaire',termine:false,date_creation:new Date().toISOString()};
    data.emplois.push(cours);write(data);return res.status(201).json({success:true,message:'Cours ajouté',cours});
  } catch(err) {return handleError(err,res);}
});
router.get('/:utilisateur_id',paramSelf,(req,res)=> {
  try {
    const data=read();
    if (!data.utilisateurs.some(u=>u.id===req.userId)) return res.status(404).json({success:false,message:'Utilisateur non trouvé'});
    const emplois=data.emplois.filter(e=>e.utilisateur_id===req.userId);
    const emplois_par_jour=Object.fromEntries(DAYS.map(j=>[j,emplois.filter(e=>e.jour===j).sort((a,b)=>a.heure_debut-b.heure_debut)]));
    const matieres=[...new Set(emplois.map(e=>e.matiere))];
    const jours_avec_cours=DAYS.filter(j=>emplois_par_jour[j].length);
    return res.json({success:true,total_cours:emplois.length,total_heures:emplois.reduce((s,e)=>s+e.heure_fin-e.heure_debut,0),nb_matieres:matieres.length,matieres,emplois,emplois_par_jour,resume:{message:`${emplois.length} cours sur ${jours_avec_cours.length} jours`,jours_avec_cours}});
  } catch(err) {return handleError(err,res);}
});
router.get('/:utilisateur_id/:jour',paramSelf,(req,res)=> {
  if (!DAYS.includes(req.params.jour)) return res.status(400).json({success:false,message:'Jour invalide'});
  try {
    const cours=read().emplois.filter(e=>e.utilisateur_id===req.userId && e.jour===req.params.jour).sort((a,b)=>a.heure_debut-b.heure_debut);
    const plages=[];let cursor=7;
    for (const c of cours) { if (c.heure_debut>cursor) plages.push({debut:cursor,fin:c.heure_debut,duree:c.heure_debut-cursor});cursor=Math.max(cursor,c.heure_fin); }
    if (cursor<22) plages.push({debut:cursor,fin:22,duree:22-cursor});
    return res.json({success:true,jour:req.params.jour,cours,nb_cours:cours.length,plages_libres:plages,total_heures_libres:plages.reduce((s,p)=>s+p.duree,0)});
  } catch(err) {return handleError(err,res);}
});
router.put('/:id',(req,res)=> {
  try {
    const data=read();const current=data.emplois.find(e=>e.id===req.params.id && e.utilisateur_id===req.userId);
    if (!current) return res.status(404).json({success:false,message:'Cours introuvable'});
    const fields=course({...current,...req.body});
    if (data.emplois.some(e=>e.id!==current.id && e.utilisateur_id===req.userId && e.jour===fields.jour && fields.heure_debut<e.heure_fin && fields.heure_fin>e.heure_debut)) return res.status(409).json({success:false,message:'Ce cours chevauche un autre cours'});
    Object.assign(current,fields);write(data);return res.json({success:true,message:'Cours modifié',cours:current});
  } catch(err) {return handleError(err,res);}
});
router.delete('/:id',(req,res)=> {
  try {
    const data=read(); const i=data.emplois.findIndex(e=>e.id===req.params.id && e.utilisateur_id===req.userId);
    if (i<0) return res.status(404).json({success:false,message:'Cours introuvable'});
    data.emplois.splice(i,1);write(data);return res.json({success:true,message:'Cours supprimé'});
  } catch(err) {return handleError(err,res);}
});
module.exports=router;
