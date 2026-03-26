/**
 * Script d'import des membres depuis le CSV source vers SQL Supabase.
 * Usage: node scripts/import-members.mjs > import.sql
 */
import { readFileSync } from "fs";

const STUDIO_ID = "0dc33f15-8131-488c-bb15-4a1fa4da3314"; // YogalateStudio
const TODAY = new Date().toISOString().slice(0, 10);

const raw = readFileSync("C:/Users/Bernard/OneDrive - Lysia SAS/Bureau/membres_unites.csv", "utf-8")
  .replace(/^\uFEFF/, ""); // strip BOM
const lines = raw.split("\n").map(l => l.replace(/\r$/, "")).filter(l => l.trim());

function clean(s) {
  return (s || "").replace(/^"+/g, "").replace(/"+$/g, "").trim();
}

function escSQL(s) {
  return s.replace(/'/g, "''");
}

function formatPhone(raw) {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+33")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("33") && digits.length > 2) digits = "0" + digits.slice(2);
  digits = digits.replace(/\D/g, "").slice(0, 10);
  const parts = [];
  for (let i = 0; i < digits.length; i += 2) parts.push(digits.slice(i, i + 2));
  return parts.join(" ");
}

function formatName(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(s) {
  // "1982-01-06 00:00:00.000" → "1982-01-06"
  if (!s) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

console.log("-- Import membres YogalateStudio — " + TODAY);
console.log("-- Source: membres_unites.csv (" + lines.length + " lignes)");
console.log("-- Studio: " + STUDIO_ID);
console.log("");
console.log("BEGIN;");
console.log("");

const emails = new Set();

for (const line of lines) {
  // CSV séparateur ; avec guillemets optionnels
  const cols = line.split(";").map(clean);
  if (cols.length < 10) { console.log("-- SKIP (colonnes insuffisantes): " + line.slice(0, 60)); continue; }

  const firstName = formatName(cols[0].toLowerCase());
  const lastName = cols[1].toUpperCase();
  const email = cols[2].toLowerCase().trim();
  const address = cols[3];
  const postalCode = cols[4].replace(/\D/g, "").slice(0, 5);
  const city = formatName(cols[5].toLowerCase());
  const phone = formatPhone(cols[6]);
  const birthDate = formatDate(cols[7]);
  let profession = cols[8];
  if (profession === "." || profession.toLowerCase() === "sans" || profession.toLowerCase() === "non renseigné") profession = "";
  const credits = parseInt(cols[9]) || 0;

  if (!email) { console.log("-- SKIP (pas d'email): " + firstName + " " + lastName); continue; }
  if (emails.has(email)) { console.log("-- SKIP (doublon email): " + email); continue; }
  emails.add(email);

  console.log(`INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '${STUDIO_ID}', '${escSQL(firstName)}', '${escSQL(lastName)}', '${escSQL(email)}', '${escSQL(phone)}', '${escSQL(address)}', '${escSQL(postalCode)}', '${escSQL(city)}', ${birthDate ? `'${birthDate}'` : "NULL"}, ${profession ? `'${escSQL(profession)}'` : "NULL"}, ${credits}, ${credits}, 'actif', '${TODAY}', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '${STUDIO_ID}' AND email = '${escSQL(email)}');
`);
}

console.log("COMMIT;");
console.log("");
console.log("-- Vérification:");
console.log("SELECT count(*) as total_members FROM members WHERE studio_id = '" + STUDIO_ID + "';");
