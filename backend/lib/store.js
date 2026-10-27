/** Stockage local compatible avec les anciennes données JSON.
 * Une écriture atomique évite les fichiers partiellement écrits en cas d'arrêt brutal.
 * Pour un déploiement multi-instances, migrer vers PostgreSQL (voir README).
 */
const fs = require('node:fs');
const path = require('node:path');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data.json');
const EMPTY = () => ({ utilisateurs: [], emplois: [], taches: [] });

function read() {
  if (!fs.existsSync(DATA_FILE)) return EMPTY();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(data.utilisateurs) || !Array.isArray(data.emplois) || !Array.isArray(data.taches)) {
    throw new Error('Le fichier de données est invalide');
  }
  return data;
}
function write(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
    fs.renameSync(temp, DATA_FILE);
  } catch (err) {
    try { fs.unlinkSync(temp); } catch (_) {}
    throw err;
  }
}
module.exports = { read, write, DATA_FILE };
