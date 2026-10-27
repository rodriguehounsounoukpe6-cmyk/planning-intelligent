const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'planning-test-'));
process.env.DATA_FILE=path.join(dir,'data.json');
const { write } = require('../lib/store');
const Planificateur = require('../services/Planificateur');
const { course, task }=require('../lib/validation');
test('validation : champs invalides refusés',()=> {
  assert.throws(()=>task({nom:'Test',duree:'invalid',jours:['lundi']}));
  assert.throws(()=>task({nom:'Test',duree:30,jours:['hier']}));
  assert.throws(()=>course({matiere:'Maths',jour:'lundi',heure_debut:11,heure_fin:9}));
});
test('un cours bloque une tâche et les créneaux ne se chevauchent pas',()=> {
  write({utilisateurs:[{id:'A',preferences:{moment_optimal:'matin',duree_session:45,pauses:true}}],emplois:[{id:'C',utilisateur_id:'A',jour:'lundi',heure_debut:8,heure_fin:12,matiere:'Maths'}],taches:[{id:'T1',utilisateur_id:'A',nom:'Devoir prioritaire',duree:90,priorite:5,jours:['lundi'],type:'etude',terminee:false},{id:'T2',utilisateur_id:'A',nom:'Repos personnel',duree:40,priorite:2,jours:['lundi'],type:'personnel',terminee:false}]});
  const plan=new Planificateur('A').optimiserTaches().filter(p=>p.jour==='lundi');
  assert.ok(plan.some(p=>p.tache_id==='T1'));
  assert.ok(plan.some(p=>p.automatique));
  for(const p of plan){ assert.ok(p.heure_fin<=8 || p.heure_debut>=12);assert.ok(p.heure_fin<=12 || p.heure_debut>=14); }
  for(let i=1;i<plan.length;i++) assert.ok(plan[i-1].heure_fin<=plan[i].heure_debut);
  assert.ok(plan.reduce((s,p)=>s+p.duree,0)<=180);
});
test('les tâches terminées ne sont pas replacées',()=> {
  const d=JSON.parse(fs.readFileSync(process.env.DATA_FILE));d.taches[0].terminee=true;write(d);
  assert.equal(new Planificateur('A').optimiserTaches().some(p=>p.tache_id==='T1'),false);
});
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
