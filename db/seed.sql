-- Dati di prova per il database "karis"
-- Nota: questo file presuppone che lo schema (schema.sql) sia già stato creato.
-- Puoi eseguirlo (in sviluppo) con psql puntando al db corretto.

BEGIN;

-- =========================================================
-- UUID FISSI PER GARANTIRE COERENZA TRA LE TABELLE
-- (modificali liberamente se preferisci usare altri valori)
-- Tutti i dati qui sotto sono stati riscritti in base a schema.sql
-- =========================================================

-- Parrocchia
-- parrocchia_demo_1
-- 11111111-1111-1111-1111-111111111111

-- Categorie risorsa
-- categoria_alimentari
-- 22222222-2222-2222-2222-222222222222
-- categoria_igiene
-- 22222222-2222-2222-2222-222222222223

-- Risorse
-- risorsa_pasta
-- 33333333-3333-3333-3333-333333333331
-- risorsa_olio
-- 33333333-3333-3333-3333-333333333332
-- risorsa_sapone
-- 33333333-3333-3333-3333-333333333333

-- Tipi utente
-- tipo_amministratore
-- 44444444-4444-4444-4444-444444444441
-- tipo_volontario
-- 44444444-4444-4444-4444-444444444442

-- Utenti
-- utente_admin
-- 55555555-5555-5555-5555-555555555551
-- utente_volontario
-- 55555555-5555-5555-5555-555555555552

-- Famiglie
-- famiglia_rossi
-- 66666666-6666-6666-6666-666666666661
-- famiglia_bianchi
-- 66666666-6666-6666-6666-666666666662

-- Beneficiari
-- beneficiario_mario_rossi
-- 77777777-7777-7777-7777-777777777771
-- beneficiario_luigi_rossi
-- 77777777-7777-7777-7777-777777777772
-- beneficiario_anna_bianchi
-- 77777777-7777-7777-7777-777777777773

-- Richieste (tabella public.richiesta)
-- richiesta_mario_pacco_alimentare
-- 88888888-8888-8888-8888-888888888881

-- Assegnazioni beni (tabella public.assegnazione_bene)
-- assegnazione_pasta_mario
-- aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1

-- Inventario_parrocchia
-- inventario_parrocchia_pasta
-- bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1
-- inventario_parrocchia_sapone
-- bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2

-- Invito
-- invito_volontario_1
-- cccccccc-cccc-cccc-cccc-ccccccccccc1

-- Richiesta_parrocchia
-- richiesta_parrocchia_1
-- dddddddd-dddd-dddd-dddd-ddddddddddd1


-- ============================
-- TABELLA: parrocchia
-- ============================
INSERT INTO public.parrocchia (id, nome, via, citta, piva)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Parrocchia San Giovanni', 'Via Roma 10', 'Milano', 'IT01234567890')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: categoria_risorsa
-- ============================
INSERT INTO public.categoria_risorsa (id, nome)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Alimentari'),
  ('22222222-2222-2222-2222-222222222223', 'Igiene personale')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: risorsa
-- ============================
INSERT INTO public.risorsa (id, nome, descrizione, unita_misura, parrocchia_id, categoria_id)
VALUES
  ('33333333-3333-3333-3333-333333333331', 'Pasta 1kg', 'Pacco di pasta da 1kg', 'pz',
   '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333332', 'Olio 1L', 'Bottiglia di olio di semi da 1L', 'pz',
   '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333', 'Sapone mani', 'Flacone di sapone liquido', 'pz',
   '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: tipo_utente
-- ============================
INSERT INTO public.tipo_utente (id, descrizione)
VALUES
  ('44444444-4444-4444-4444-444444444441', 'Amministratore'),
  ('44444444-4444-4444-4444-444444444442', 'Volontario')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: utente
-- ============================
INSERT INTO public.utente (id, nome, cognome, cf, tipo_utente_id, parrocchia_id)
VALUES
  ('55555555-5555-5555-5555-555555555551', 'Giulia', 'Rossi', 'RSSGLI80A01H501X',
   '44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555552', 'Marco', 'Bianchi', 'BNCMRC90B02H501Y',
   '44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: famiglia
-- ============================
INSERT INTO public.famiglia (id, cognome, note)
VALUES
  ('66666666-6666-6666-6666-666666666661', 'Rossi', 'Famiglia con due figli'),
  ('66666666-6666-6666-6666-666666666662', 'Bianchi', 'Famiglia con un figlio')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: beneficiario
-- ============================
INSERT INTO public.beneficiario (id, nome, cognome, cf, data_nascita, luogo_nascita, famiglia_id, parrocchia_id)
VALUES
  ('77777777-7777-7777-7777-777777777771', 'Mario', 'Rossi', 'RSSMRA10C10H501Z',
   '2010-03-10', 'Milano', '66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777772', 'Luigi', 'Rossi', 'RSSLGU12D15H501Q',
   '2012-04-15', 'Milano', '66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777773', 'Anna', 'Bianchi', 'BNCNNA15E20H501R',
   '2015-05-20', 'Milano', '66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: richiesta
-- ============================
-- Nello schema: (id, descrizione, foto, data_richiesta, beneficiario_id, parrocchia_id, stato)
INSERT INTO public.richiesta (id, descrizione, foto, beneficiario_id, parrocchia_id, stato)
VALUES
  ('88888888-8888-8888-8888-888888888881',
   'Pacco alimentare mensile per famiglia Rossi',
   NULL,
   '77777777-7777-7777-7777-777777777771',
   '11111111-1111-1111-1111-111111111111',
   'in_valutazione')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: inventario_parrocchia
-- ============================
INSERT INTO public.inventario_parrocchia (id, parrocchia_id, risorsa_id, quantita)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
   '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333331',
   50),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
   '11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333333',
   30)
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: assegnazione_bene
-- ============================
-- La tabella ha un check constraint (assegnazione_bene_check) che richiede
-- che l'assegnazione sia riferita O a un beneficiario O a una famiglia, ma non a entrambi.
-- Per rispettarlo, qui facciamo un'assegnazione alla famiglia (beneficiario_id = NULL).
INSERT INTO public.assegnazione_bene (id, risorsa_id, beneficiario_id, famiglia_id, quantita, note)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
   '33333333-3333-3333-3333-333333333331',
   NULL,
   '66666666-6666-6666-6666-666666666661',
   3,
   'Prima consegna pacco alimentare per famiglia Rossi')
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: invito
-- ============================
-- Nello schema: (id, token, parrocchia_id, ruolo, created_by, created_at, expires_at, accepted_at, accepted_by, revoked_at)
-- Alcune colonne hanno default, quindi qui impostiamo solo quelle necessarie + accepted_* per avere un invito usato.
INSERT INTO public.invito (id, token, parrocchia_id, ruolo, created_by, accepted_by, accepted_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1',
   'TOKEN_VOLONTARIO_DEMO',
   '11111111-1111-1111-1111-111111111111',
   'volontario',
   '55555555-5555-5555-5555-555555555551',
   '55555555-5555-5555-5555-555555555552',
   now())
ON CONFLICT (id) DO NOTHING;


-- ============================
-- TABELLA: richiesta_parrocchia
-- ============================
INSERT INTO public.richiesta_parrocchia (
  id,
  parrocchia_richiedente_id,
  descrizione_bene,
  quantita,
  unita_misura,
  messaggio,
  stato,
  parrocchia_accettante_id
)
VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1',
   '11111111-1111-1111-1111-111111111111',
   'Pacchi alimentari aggiuntivi',
   20,
   'pz',
   'Richiesta di supporto per aumentata domanda nel quartiere',
   'pending',
   NULL)
ON CONFLICT (id) DO NOTHING;


COMMIT;


