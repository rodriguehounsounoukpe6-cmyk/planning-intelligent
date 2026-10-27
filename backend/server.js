require('dotenv').config();
const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { read } = require('./lib/store');
const { authenticate, bodySelf } = require('./middleware/auth');
const PDFGenerator = require('./services/PDFGenerator');
const Planificateur = require('./services/Planificateur');
const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use((req,res,next) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
  if (req.path.startsWith('/api/') || req.path.startsWith('/pdfs/')) res.setHeader('Cache-Control','no-store');
  // Défense supplémentaire CSRF : refuser une origine étrangère sur les opérations sensibles.
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const origin=req.get('origin');
    if (origin) {
      try {if (new URL(origin).host !== req.get('host')) return res.status(403).json({success:false,message:'Origine non autorisée'});} catch(_) {return res.status(403).json({success:false,message:'Origine non autorisée'});}
    }
    if (req.path.startsWith('/api/') && req.get('content-type') && !req.is('application/json')) return res.status(415).json({success:false,message:'JSON requis'});
  }
  next();
});
app.use(express.json({limit:'128kb'}));
app.use(express.static(path.join(__dirname,'../frontend'), {extensions:['html'], index:'index.html'}));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/emploi', authenticate, require('./routes/emploi'));
app.use('/api/tache', authenticate, require('./routes/tache'));
app.use('/api/optimisation',authenticate,require('./routes/optimisation'));
app.post('/api/pdf/generer', authenticate,bodySelf, async(req,res) => {
  try {
    const data=read();const user=data.utilisateurs.find(u=>u.id===req.userId);
    if (!user) return res.status(404).json({success:false,message:'Utilisateur non trouvé'});
    const pdf=await PDFGenerator.genererPlanningPDF(user,new Planificateur(req.userId).optimiserTaches(),data.emplois.filter(e=>e.utilisateur_id===req.userId),data.taches.filter(t=>t.utilisateur_id===req.userId));
    return res.json({success:true,message:'PDF généré',pdf:{filename:pdf.filename,url:pdf.url}});
  } catch(err) {console.error('Erreur génération PDF',err);return res.status(500).json({success:false,message:'Erreur lors de la génération du PDF'});}
});
app.get('/pdfs/:filename',authenticate,(req,res)=> {
  const filename=req.params.filename;
  // Chaque fichier PDF doit appartenir à la session courante.
  if (!/^planning_premium_[\w-]+_\d+\.pdf$/.test(filename) || !filename.startsWith(`planning_premium_${req.userId}_`)) return res.status(404).json({success:false,message:'Fichier non trouvé'});
  const full=path.join(__dirname,'pdfs',filename);
  return res.download(full,filename,err=>{if(err && !res.headersSent)res.status(404).json({success:false,message:'Fichier non trouvé'});});
});
app.get('/api',(req,res)=>res.json({success:true,version:'2.0.0',message:'Planning Intelligent API'}));
app.get('/api/health',(req,res)=>res.json({success:true,status:'ok'}));
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'../frontend/index.html')));
app.use((req,res)=>res.status(404).json({success:false,message:'Route non trouvée'}));
if (require.main===module) app.listen(PORT,'0.0.0.0',()=>console.log(`Planning Intelligent V2 : http://localhost:${PORT}`));
module.exports=app;
