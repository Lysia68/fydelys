-- Import membres YogalateStudio — 2026-03-26
-- Source: membres_unites.csv (60 lignes)
-- Studio: 0dc33f15-8131-488c-bb15-4a1fa4da3314

BEGIN;

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Laetitia', 'FIMBEL', 'laetitia.fimbel@outlook.fr', '06 11 31 03 26', '12b Route De Neuf-Brisach', '68180', 'Horbourg-Wihr', '1982-01-06', 'Gestionnaire paie', 20, 20, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'laetitia.fimbel@outlook.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Delphine', 'RUANT', 'delphine.ruant@laposte.net', '06 83 33 37 95', '38 rue des bonnes gens', '68000', 'Colmar', '1972-03-28', 'Infirmière', 20, 20, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'delphine.ruant@laposte.net');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Luce', 'HARTMANN', 'luce.hubeaux68@gmail.com', '06 09 20 43 03', '5 Buergerhoelzle weg', '68000', 'Colmar', '1949-09-17', 'Documentaliste retraitée', 16, 16, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'luce.hubeaux68@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Isabel', 'RIOTTE', 'isabelriotte65@gmail.com', '06 76 03 86 81', '6 Impasse des Centuries', '68280', 'Logelheim', '1980-10-10', 'Fonctionnaire', 16, 16, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'isabelriotte65@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Patricia', 'ANCEL', 'patricia.ancel92@gmail.com', '06 36 71 45 69', '5 rue du Parc', '68180', 'Horbourg Wihr', '1967-01-04', 'Employée de banque', 14, 14, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'patricia.ancel92@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Marjorie', 'LALLOUE', 'marj.lalloue@free.fr', '06 74 29 32 05', '5 rue du Parc', '68180', 'Horbourg-Wihr', '1979-10-26', 'Tim', 14, 14, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'marj.lalloue@free.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Catherine', 'LOUF', 'cathlouf@hotmail.fr', '06 61 71 08 29', '15 rue de l''étang', '68600', 'Geiswasser', '1969-11-01', 'Fonctionnaire', 14, 14, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'cathlouf@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Myriam', 'CHAUSSEC', 'myriam.leclerc@orange.fr', '06 19 93 12 07', '30 RUE DES MERLES', '68280', 'Andolsheim', '1970-12-05', 'Coordonnatrice sps', 12, 12, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'myriam.leclerc@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Sophie', 'PLASSAT', 'sophieplassat@yahoo.fr', '06 82 05 68 75', '16A rue des Jardins', '68000', 'Colmar', '1977-09-08', 'Orthophoniste', 12, 12, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sophieplassat@yahoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Karen', 'JOST', 'karen8273@hotmail.fr', '07 75 70 90 73', '21 rue Étroite', '68000', 'Colmar', '1973-02-08', 'Hotesse de l’air', 11, 11, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'karen8273@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Anne-Laure', 'SCHMEDER', 'alschmeder@hotmail.fr', '06 64 79 52 74', '15 Rue de l''Étang', '68600', 'Geiswasser', '1970-11-02', 'Fonctionnaire', 9, 9, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'alschmeder@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Isa', 'TROMPETER', 'isabelletrompeter@orange.fr', '06 13 07 75 12', 'Animatrice jeunes enfants', '68320', 'Bisc', '1976-04-26', 'Animatrice', 9, 9, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'isabelletrompeter@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Marie -Pierre', 'DAVID', 'mpdavid2010@yahoo.fr', '06 89 99 35 74', '46 rue du Rhin', '68180', 'Horbourg-Wihr', '1971-11-05', 'Assistante maternelle', 7, 7, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'mpdavid2010@yahoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Nathalie', 'VALENTIN', 'nathalie.valentin@yahoo.fr', '06 31 87 52 34', '9a Rue Du sponeck', '68320', 'Artzenheim', '1973-01-22', 'Enseignante', 7, 7, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'nathalie.valentin@yahoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Bernadette', 'JEHEL', 'bjehel@yahoo.fr', '06 23 12 79 04', '12 rue des vergers', '68700', 'Uffholtz', '1958-07-02', 'Retraitée active .....', 6, 6, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'bjehel@yahoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Caroline', 'SANCHEZ', 'caroline.sanchez@free.fr', '06 03 34 74 38', '38 rue Ch Grad', '68000', 'Colmar', '1964-05-01', 'Retraitee', 6, 6, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'caroline.sanchez@free.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Pauline', 'SANCHEZ', 'pauline.sanchez@free.fr', '06 25 05 12 89', '17 Rue Maurice Ravel', '68000', 'Colmar', '1993-05-05', 'Médecin', 6, 6, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'pauline.sanchez@free.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'MarlèNe', 'VONARX', 'gilbert.vonarx@orange.fr', '06 30 95 13 59', '43 a grand rue', '68320', 'Bischwihr', '1954-01-20', 'Retraitée', 6, 6, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'gilbert.vonarx@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Claudia', 'BAUMGARTEN', 'claudia30@orange.fr', '07 89 95 80 34', '18 rue du pigeonnier', '68600', 'Weckolsheim', '1967-07-30', NULL, 5, 5, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'claudia30@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Laurence', 'FALTOT', 'herve.faltot@calixo.net', '06 87 81 75 51', '5 rue Lavigne', '68280', 'Sundhoffen', '1970-09-15', 'Manipulatrice rx', 5, 5, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'herve.faltot@calixo.net');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Corinne', 'MEYER', 'c.meyer@alsace.eu', '06 74 95 85 83', '1 rue du rhin', '68320', 'Durrenentzen', '1964-08-24', 'Educatrice parentalité', 5, 5, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'c.meyer@alsace.eu');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Dominique', 'MOLLE', 'domolle@free.fr', '06 87 95 54 55', '2 place de l''école', '68000', 'Colmar', '1961-11-15', 'Manipulateur radiologie', 5, 5, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'domolle@free.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'GenevièVe', 'WERCK', 'genevieve@werck.fr', '06 87 25 37 47', '12 rue Gustave Umbdenstock', '68000', 'Colmar', '1976-08-17', 'Bibliothecaire', 5, 5, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'genevieve@werck.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Jean-Marc', 'BELBÉZIER', 'belbezier.jean-marc@neuf.fr', '06 75 86 67 37', '7 rue de Holtzwihr', '68000', 'Colmar', '1967-03-04', 'Infirmier anesthésiste', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'belbezier.jean-marc@neuf.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Claudia', 'CHATELUS', 'claudiachatelus@gmail.com', '06 89 71 04 67', '28 a rue des Fleurs', '68000', 'Colmar', '1971-05-09', 'Medecin', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'claudiachatelus@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'MéLanie', 'HATTON', 'melanie.fuchot@gmail.com', '06 70 44 26 75', '22 Rue Des Noyers', '68250', 'Gundolsheim', '1990-07-16', 'Chargée de communication', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'melanie.fuchot@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Catherine', 'HUSSMANN', 'bertrand.hussmann@gmail.com', '06 24 84 48 84', '3 RUE DES JONQUILLES', '68280', 'Andolsheim', '1967-10-25', 'Rh', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'bertrand.hussmann@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Sylvia', 'JOST', 'sylviajost@msn.com', '07 77 82 30 40', '7 rue de la Piscine', '68250', 'Rouffach', '1970-06-27', 'Enseignante', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sylviajost@msn.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Melanie', 'LUTHRINGER', 'melanie.luthringer@gmail.com', '06 82 63 62 77', '16 Rue des Futaies', '68180', 'Horbourg-Wihr', '1982-11-17', 'Gestionnaire de projet', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'melanie.luthringer@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Sandrine', 'REICHENSHAMMER', 'sandrine.reichenshammer@orange.fr', '07 88 04 07 77', '12 rue des Pêcheurs', '68600', 'Biesheim', '1973-12-23', 'Agent immobilier', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sandrine.reichenshammer@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'VéRonique', 'VENCHIARUTTI', 'avbl1011@gmail.com', '06 08 48 62 21', '18 rue du Stade', '68320', 'Wickershwihr', '1971-04-19', 'Adjoint administratif', 4, 4, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'avbl1011@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Franck', 'ECKER', 'ecker.franck@9business.fr', '06 99 88 23 07', '2 rue du Vieux presbytère', '68140', 'Gunsbach', '1971-07-23', 'Commerçant', 3, 3, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'ecker.franck@9business.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Sandrine', 'JANTE', 'sandrine.jante@gmail.com', '06 71 36 88 83', '32 rue du chêne', '68000', 'Colmar', '1967-05-28', 'Médecin', 3, 3, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sandrine.jante@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Sophie', 'SCHAHL', 'sophie.schahl@gmail.com', '06 19 93 18 05', '11 rue de paris', '67880', 'Krautergersheim', '1972-01-10', 'Responsable qualité adjointe', 3, 3, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sophie.schahl@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Francine', 'VONTHRON', 'vonthron.francine@orange.fr', '06 80 22 17 98', '42 rue de la gare', '68890', 'Meyenheim', '1958-10-07', NULL, 3, 3, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'vonthron.francine@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Corinne', 'WILLET', 'corinne.k@club.fr', '06 37 26 04 11', '9  RUE OBERFELD', '68280', 'Andolsheim', '1973-07-29', 'Indépendante', 3, 3, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'corinne.k@club.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Aurore', 'BREYSSE', 'ror-rore@hotmail.fr', '06 88 46 75 05', '14 bangerthuttenweg', '68000', 'Colmar', '1981-03-07', 'Infirmiere libérale', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'ror-rore@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Marjolaine', 'CHENAL', 'marj.chenal@free.fr', '06 69 66 11 16', '27 C rue des Vergers RESIDENCE FLORALIES 2', '68000', '68000 Colmar', '1983-10-15', 'Responsable recouvrement', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'marj.chenal@free.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Martine', 'DEROUSSENT', 'martine.deroussent@gmail.com', '06 03 24 93 19', '10 RUE DU RHIN', '68320', 'Muntzenheim', '1952-07-03', 'Retraitée', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'martine.deroussent@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Bernard', 'GUTHMANN', 'support@of360.fr', '67 84 48 48 2', '5 Buergerhoezle Weg', '68000', 'Colmar', '1964-10-10', 'Chef de projet', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'support@of360.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Corinne', 'LOBERGER', 'corinne.loberger@gmail.com', '06 99 04 48 94', '6, Rue Du Général De Gaulle', '68320', 'Holtzwihr', '1968-09-19', 'Fleuriste', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'corinne.loberger@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Audrey', 'SCHIELI', 'naudrey_g@yahoo.fr', '06 82 04 76 93', '1, rue Salin de Niar', '68600', 'Neuf-Brisach', '1976-07-03', 'Technicienne environnement', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'naudrey_g@yahoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Elisabeth', 'SCHULTZ', 'megbracoxx@orange.fr', '06 83 27 18 46', '8 rue des pres', '68320', 'Holtzwihr', '1972-05-04', 'Directrice résidence de tourisme', 2, 2, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'megbracoxx@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Sylvie', 'BELBEZIER', 'sylvieduchene@yahoo.fr', '06 74 32 43 11', '7 rue de Holtzwihr', '68000', 'Colmar', '1968-05-18', 'Enseignante', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'sylvieduchene@yahoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Carole', 'BRUN', 'brun.carole@hotmail.fr', '06 89 90 14 46', '7 place du général Milhaud', '69127', 'Sainte Croix En Plaine', '1977-06-19', 'Assistant comptable', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'brun.carole@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Anne-GaëLle', 'CLERMONT', 'agclermont@hotmail.com', '06 82 23 65 39', '2 a rue de la Thur 68180 Horbourg wihr', '68180', 'Horbourg Wihr', '1974-02-12', 'Ingénieur', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'agclermont@hotmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Florence', 'COLLARD', 'florence.collard@orange.fr', '06 16 03 00 28', '3 Mittlerer Semm Weg', '68000', 'Colmar', '1959-11-29', 'Ergothérapeute', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'florence.collard@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Annick', 'DRIESBACH', 'a.driesbach@wanadoo.fr', '06 78 22 39 58', '3 rue de la Digue', '68180', 'Horbourg-Wihr', '1968-06-19', 'Responsable administrative', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'a.driesbach@wanadoo.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Nathalie', 'GOCEL', 'nathaliegocel@free.fr', '06 28 54 34 08', '16 rue des Merisiers', '68180', 'Horbourg-Whr', '1968-08-17', 'Fonctionnaire', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'nathaliegocel@free.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Margot', 'HUSSER GIRARDIN', 'margot.husser95@gmail.com', '06 36 14 24 94', '12A Rue de Sainte-Croix-en-Plaine', '68127', 'Niederhergheim', '1995-11-29', 'Psychologue', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'margot.husser95@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Marjolaine', 'JEANGUENIN', 'marjolaine.jeanguenin@laposte.net', '07 49 87 11 55', '27 C rue des Vergers', '68000', 'Colmar', '1980-10-10', NULL, 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'marjolaine.jeanguenin@laposte.net');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'RéGine', 'JENNY', 'reginejenny@gmail.com', '06 33 83 28 26', '10 rue du general Geil', '68150', 'Ostheim', '1971-11-02', 'Resp marketing communication', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'reginejenny@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Herve', 'KOHLER', 'hervekohler68@gmail.com', '06 30 69 99 98', '5 rue du Vieux Pont', '68320', 'Bischwihr', '1972-03-10', 'Technicien process et environnement', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'hervekohler68@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Nathalie', 'KRAUTH', 'nathipkrauth@orange.fr', '06 83 16 81 08', '26 rue du petit Colmar', '68280', 'Sundhoffen', '1964-07-22', 'Medecin', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'nathipkrauth@orange.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Delphine', 'MUSSER', 'musserdelphine@gmail.com', '06 79 47 97 70', '12a rue des vignes', '68127', 'Niederhergheim', '1984-05-18', 'Auxiliaire de puériculture', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'musserdelphine@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Jean-Michel', 'NEFF', 'jmichelneff@gmail.com', '03 89 86 11 78', '7 rue du 1er bataillon de choc', '68320', 'Durrenentzen', '1961-12-29', 'Educateur', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'jmichelneff@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Rachel', 'PIGEON', 'rachel.pigeon68@gmail.com', '06 72 08 70 92', '38a rue d''eguisheim', '68420', 'Herrlisheim PrèS Colmar', '1972-04-13', 'Consulante', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'rachel.pigeon68@gmail.com');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'MéLine', 'WILLIG', 'm3lii-ne.w@hotmail.fr', '06 40 95 15 00', '2 rue de l ill', '68127', 'Sainte Croix En Plaine', '1992-07-25', 'Secrétaire médicale', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'm3lii-ne.w@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'Laurence', 'WOLF', 'laurenceheiss@hotmail.fr', '06 33 67 52 01', '19 b rue de Neuf-Brisach', '68127', 'Sainte Croix En Plaine', '1976-10-02', 'Technicienne d''information médicale', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'laurenceheiss@hotmail.fr');

INSERT INTO members (studio_id, first_name, last_name, email, phone, address, postal_code, city, birth_date, profession, credits, credits_total, status, joined_at, profile_complete, sms_opt_in)
SELECT '0dc33f15-8131-488c-bb15-4a1fa4da3314', 'AuréLie', 'ZIEGLER', 'aurelie80@neuf.fr', '06 89 32 36 46', '26 rue Argentovaria', '68180', 'Horbourg-Wihr', '1980-12-25', 'Assistante administrative', 1, 1, 'actif', '2026-03-26', true, true
WHERE NOT EXISTS (SELECT 1 FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314' AND email = 'aurelie80@neuf.fr');

COMMIT;

-- Vérification:
SELECT count(*) as total_members FROM members WHERE studio_id = '0dc33f15-8131-488c-bb15-4a1fa4da3314';
