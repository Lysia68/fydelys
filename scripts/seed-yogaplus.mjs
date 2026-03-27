const STUDIO = "1ae514c8-e0dc-4188-a8ec-e73581f06634";
const TODAY = "2026-03-27";

const prenoms = ["Emma","Lucas","Chloé","Hugo","Léa","Louis","Manon","Jules","Camille","Nathan","Sarah","Théo","Inès","Raphaël","Jade","Arthur","Louise","Gabriel","Alice","Liam","Clara","Ethan","Zoé","Adam","Eva","Tom","Léna","Noah","Margot","Paul"];
const noms = ["MARTIN","BERNARD","THOMAS","PETIT","ROBERT","RICHARD","DURAND","LEROY","MOREAU","SIMON","LAURENT","LEFEBVRE","MICHEL","GARCIA","DAVID","BERTRAND","ROUX","VINCENT","FOURNIER","MOREL"];
const villes = [["75001","Paris"],["69001","Lyon"],["13001","Marseille"],["31000","Toulouse"],["33000","Bordeaux"],["44000","Nantes"],["67000","Strasbourg"],["59000","Lille"],["06000","Nice"],["34000","Montpellier"]];
const professions = ["Enseignant","Infirmière","Développeur","Comptable","Architecte","Médecin","Avocat","Designer","Kinésithérapeute","Journaliste","Commercial","Psychologue","Pharmacien","Ingénieur","Chef cuisinier","Photographe","Musicien","Ostéopathe","Ergothérapeute","Consultant"];
const rues = ["rue de la Paix","avenue des Champs","boulevard Victor Hugo","rue Pasteur","place de la Liberté","rue du Commerce","avenue Jean Jaurès","rue de la République","impasse des Lilas","allée des Roses"];

function esc(s) { return s.replace(/'/g, "''"); }
function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

console.log(`-- Jeu de données adhérents pour studio yogaplus`);
console.log(`-- Studio: ${STUDIO}`);
console.log(`-- ${prenoms.length} adhérents`);
console.log(`BEGIN;`);
console.log();

for (let i = 0; i < prenoms.length; i++) {
  const fn = prenoms[i];
  const ln = noms[i % noms.length];
  const email = `${norm(fn)}.${norm(ln)}@example.com`;
  const [cp, ville] = villes[i % villes.length];
  const p1 = String(10 + (i % 90)).padStart(2, "0");
  const p2 = String(20 + (i * 3) % 80).padStart(2, "0");
  const p3 = String(30 + (i * 2) % 70).padStart(2, "0");
  const p4 = String(40 + i % 60).padStart(2, "0");
  const phone = `06 ${p1} ${p2} ${p3} ${p4}`;
  const bd = `${1965 + (i % 30)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + ((i * 3) % 28)).padStart(2, "0")}`;
  const prof = professions[i % professions.length];
  const credits = [0, 1, 3, 5, 8, 10, 12, 15, 20, 2][i % 10];
  const creditsTotal = Math.max(credits, 10);
  const status = i < 25 ? "actif" : i < 28 ? "nouveau" : "suspendu";
  const addr = `${1 + i * 3} ${rues[i % rues.length]}`;

  console.log(`INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '${STUDIO}', '${esc(fn)}', '${esc(ln)}', '${esc(email)}', '${phone}', '${esc(addr)}', '${cp}', '${esc(ville)}', '${bd}', '${esc(prof)}', ${credits}, ${creditsTotal}, '${status}', '${TODAY}', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '${STUDIO}' AND email = '${esc(email)}');
`);
}

console.log("COMMIT;");
console.log();
console.log(`-- Vérification:`);
console.log(`SELECT count(*) as total_members FROM members WHERE studio_id = '${STUDIO}';`);
