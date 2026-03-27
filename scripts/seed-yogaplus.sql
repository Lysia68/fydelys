-- Jeu de données adhérents pour studio yogaplus
-- Studio: 1ae514c8-e0dc-4188-a8ec-e73581f06634
-- 30 adhérents
BEGIN;

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Emma', 'MARTIN', 'emma.martin@example.com', '06 10 20 30 40', '1 rue de la Paix', '75001', 'Paris', '1965-01-01', 'Enseignant', 0, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'emma.martin@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Lucas', 'BERNARD', 'lucas.bernard@example.com', '06 11 23 32 41', '4 avenue des Champs', '69001', 'Lyon', '1966-02-04', 'Infirmière', 1, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'lucas.bernard@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Chloé', 'THOMAS', 'chloe.thomas@example.com', '06 12 26 34 42', '7 boulevard Victor Hugo', '13001', 'Marseille', '1967-03-07', 'Développeur', 3, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'chloe.thomas@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Hugo', 'PETIT', 'hugo.petit@example.com', '06 13 29 36 43', '10 rue Pasteur', '31000', 'Toulouse', '1968-04-10', 'Comptable', 5, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'hugo.petit@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Léa', 'ROBERT', 'lea.robert@example.com', '06 14 32 38 44', '13 place de la Liberté', '33000', 'Bordeaux', '1969-05-13', 'Architecte', 8, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'lea.robert@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Louis', 'RICHARD', 'louis.richard@example.com', '06 15 35 40 45', '16 rue du Commerce', '44000', 'Nantes', '1970-06-16', 'Médecin', 10, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'louis.richard@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Manon', 'DURAND', 'manon.durand@example.com', '06 16 38 42 46', '19 avenue Jean Jaurès', '67000', 'Strasbourg', '1971-07-19', 'Avocat', 12, 12, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'manon.durand@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Jules', 'LEROY', 'jules.leroy@example.com', '06 17 41 44 47', '22 rue de la République', '59000', 'Lille', '1972-08-22', 'Designer', 15, 15, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'jules.leroy@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Camille', 'MOREAU', 'camille.moreau@example.com', '06 18 44 46 48', '25 impasse des Lilas', '06000', 'Nice', '1973-09-25', 'Kinésithérapeute', 20, 20, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'camille.moreau@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Nathan', 'SIMON', 'nathan.simon@example.com', '06 19 47 48 49', '28 allée des Roses', '34000', 'Montpellier', '1974-10-28', 'Journaliste', 2, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'nathan.simon@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Sarah', 'LAURENT', 'sarah.laurent@example.com', '06 20 50 50 50', '31 rue de la Paix', '75001', 'Paris', '1975-11-03', 'Commercial', 0, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'sarah.laurent@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Théo', 'LEFEBVRE', 'theo.lefebvre@example.com', '06 21 53 52 51', '34 avenue des Champs', '69001', 'Lyon', '1976-12-06', 'Psychologue', 1, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'theo.lefebvre@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Inès', 'MICHEL', 'ines.michel@example.com', '06 22 56 54 52', '37 boulevard Victor Hugo', '13001', 'Marseille', '1977-01-09', 'Pharmacien', 3, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'ines.michel@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Raphaël', 'GARCIA', 'raphael.garcia@example.com', '06 23 59 56 53', '40 rue Pasteur', '31000', 'Toulouse', '1978-02-12', 'Ingénieur', 5, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'raphael.garcia@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Jade', 'DAVID', 'jade.david@example.com', '06 24 62 58 54', '43 place de la Liberté', '33000', 'Bordeaux', '1979-03-15', 'Chef cuisinier', 8, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'jade.david@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Arthur', 'BERTRAND', 'arthur.bertrand@example.com', '06 25 65 60 55', '46 rue du Commerce', '44000', 'Nantes', '1980-04-18', 'Photographe', 10, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'arthur.bertrand@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Louise', 'ROUX', 'louise.roux@example.com', '06 26 68 62 56', '49 avenue Jean Jaurès', '67000', 'Strasbourg', '1981-05-21', 'Musicien', 12, 12, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'louise.roux@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Gabriel', 'VINCENT', 'gabriel.vincent@example.com', '06 27 71 64 57', '52 rue de la République', '59000', 'Lille', '1982-06-24', 'Ostéopathe', 15, 15, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'gabriel.vincent@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Alice', 'FOURNIER', 'alice.fournier@example.com', '06 28 74 66 58', '55 impasse des Lilas', '06000', 'Nice', '1983-07-27', 'Ergothérapeute', 20, 20, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'alice.fournier@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Liam', 'MOREL', 'liam.morel@example.com', '06 29 77 68 59', '58 allée des Roses', '34000', 'Montpellier', '1984-08-02', 'Consultant', 2, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'liam.morel@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Clara', 'MARTIN', 'clara.martin@example.com', '06 30 80 70 60', '61 rue de la Paix', '75001', 'Paris', '1985-09-05', 'Enseignant', 0, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'clara.martin@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Ethan', 'BERNARD', 'ethan.bernard@example.com', '06 31 83 72 61', '64 avenue des Champs', '69001', 'Lyon', '1986-10-08', 'Infirmière', 1, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'ethan.bernard@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Zoé', 'THOMAS', 'zoe.thomas@example.com', '06 32 86 74 62', '67 boulevard Victor Hugo', '13001', 'Marseille', '1987-11-11', 'Développeur', 3, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'zoe.thomas@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Adam', 'PETIT', 'adam.petit@example.com', '06 33 89 76 63', '70 rue Pasteur', '31000', 'Toulouse', '1988-12-14', 'Comptable', 5, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'adam.petit@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Eva', 'ROBERT', 'eva.robert@example.com', '06 34 92 78 64', '73 place de la Liberté', '33000', 'Bordeaux', '1989-01-17', 'Architecte', 8, 10, 'actif', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'eva.robert@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Tom', 'RICHARD', 'tom.richard@example.com', '06 35 95 80 65', '76 rue du Commerce', '44000', 'Nantes', '1990-02-20', 'Médecin', 10, 10, 'nouveau', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'tom.richard@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Léna', 'DURAND', 'lena.durand@example.com', '06 36 98 82 66', '79 avenue Jean Jaurès', '67000', 'Strasbourg', '1991-03-23', 'Avocat', 12, 12, 'nouveau', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'lena.durand@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Noah', 'LEROY', 'noah.leroy@example.com', '06 37 21 84 67', '82 rue de la République', '59000', 'Lille', '1992-04-26', 'Designer', 15, 15, 'nouveau', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'noah.leroy@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Margot', 'MOREAU', 'margot.moreau@example.com', '06 38 24 86 68', '85 impasse des Lilas', '06000', 'Nice', '1993-05-01', 'Kinésithérapeute', 20, 20, 'suspendu', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'margot.moreau@example.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '1ae514c8-e0dc-4188-a8ec-e73581f06634', 'Paul', 'SIMON', 'paul.simon@example.com', '06 39 27 88 69', '88 allée des Roses', '34000', 'Montpellier', '1994-06-04', 'Journaliste', 2, 10, 'suspendu', '2026-03-27', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634' AND email = 'paul.simon@example.com');

COMMIT;

-- Vérification:
SELECT count(*) as total_members FROM members WHERE studio_id = '1ae514c8-e0dc-4188-a8ec-e73581f06634';
