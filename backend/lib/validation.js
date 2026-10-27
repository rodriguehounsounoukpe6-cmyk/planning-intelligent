const DAYS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const TYPES = ['domestique','personnel','etude'];
function text(value, label, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new Error(`${label} doit contenir entre 1 et ${max} caractères`);
  return value.trim();
}
function number(value, label, min, max) {
  if (typeof value === 'boolean' || value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) throw new Error(`${label} doit être un nombre`);
  const n = Number(value);
  if (n < min || n > max) throw new Error(`${label} doit être compris entre ${min} et ${max}`);
  return n;
}
function days(value) {
  if (!Array.isArray(value) || !value.length || value.length > 7 || value.some(j => !DAYS.includes(j))) throw new Error('Choisissez au moins un jour valide');
  return [...new Set(value)];
}
function course(body) {
  const jour = text(body.jour, 'Le jour', 20);
  if (!DAYS.includes(jour)) throw new Error('Jour de cours invalide');
  const heure_debut = number(body.heure_debut, 'Heure de début', 6, 22);
  const heure_fin = number(body.heure_fin, 'Heure de fin', 7, 23);
  if (heure_fin <= heure_debut) throw new Error('La fin doit être après le début');
  return { jour, heure_debut, heure_fin, matiere: text(body.matiere, 'Matière'), priorite: number(body.priorite ?? 3, 'Priorité', 1, 5) };
}
function task(body) {
  const type = body.type ?? 'domestique';
  if (!TYPES.includes(type)) throw new Error('Type de tâche invalide');
  return { nom: text(body.nom,'Nom de la tâche'), duree: number(body.duree ?? 30,'Durée',1,480), jours: days(body.jours), priorite: number(body.priorite ?? 1, 'Priorité',1,5), type };
}
function handleError(err, res) {
  if (err instanceof Error && /^(Le |La |Les |Choisissez|Jour |Heure |Matière|Nom |Type |Durée |Priorité)/.test(err.message)) {
    return res.status(400).json({ success:false, message:err.message });
  }
  console.error('Erreur API', err);
  return res.status(500).json({ success:false, message:'Une erreur interne est survenue' });
}
module.exports = { DAYS, TYPES, text, number, days, course, task, handleError };
