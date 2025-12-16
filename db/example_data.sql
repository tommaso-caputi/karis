-- Esempio di dati per lo schema definito in db/schema.sql
-- Questo file NON modifica lo schema, ma inserisce solo dati di esempio.
-- Puoi eseguirlo in Supabase / psql dopo aver creato le tabelle.

-- Nota: se stai usando Supabase, gli UUID possono essere generati automaticamente
-- grazie al DEFAULT uuid_generate_v4(). Qui li specifichiamo per avere riferimenti chiari.

-- PARROCCHIE ------------------------------------------------------------------
INSERT INTO public.parrocchia (id, nome, via, citta, piva)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Parrocchia San Giovanni Battista', 'Via Roma 10', 'Milano', 'IT12345678901'),
  ('00000000-0000-0000-0000-000000000002', 'Parrocchia Santa Maria', 'Via Dante 25', 'Bergamo', 'IT98765432109');

-- TIPI UTENTE ------------------------------------------------------------------
INSERT INTO public.tipo_utente (id, descrizione)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Parroco'),
  ('00000000-0000-0000-0000-000000000102', 'Volontario'),
  ('00000000-0000-0000-0000-000000000103', 'Operatore Caritas');

-- UTENTI ----------------------------------------------------------------------
INSERT INTO public.utente (id, nome, cognome, cf, tipo_utente_id, parrocchia_id)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    'Marco',
    'Rossi',
    'RSSMRC80A01F205X',
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'Laura',
    'Bianchi',
    'BNCLRA85C41F205Y',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001'
  );

-- FAMIGLIE --------------------------------------------------------------------
INSERT INTO public.famiglia (id, cognome, note)
VALUES
  ('00000000-0000-0000-0000-000000000301', 'Verdi', 'Famiglia con 3 figli, supporto alimentare mensile'),
  ('00000000-0000-0000-0000-000000000302', 'Neri', 'Nucleo monogenitoriale');

-- BENEFICIARI -----------------------------------------------------------------
INSERT INTO public.beneficiario (id, nome, cognome, cf, data_nascita, luogo_nascita, famiglia_id, parrocchia_id)
VALUES
  (
    '00000000-0000-0000-0000-000000000401',
    'Giulia',
    'Verdi',
    'VRDGLL12A41F205Z',
    '2012-01-15',
    'Milano',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    'Luca',
    'Neri',
    'NRILCU10B11F205W',
    '2010-02-11',
    'Bergamo',
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000001'
  );

-- CATEGORIE RISORSA -----------------------------------------------------------
INSERT INTO public.categoria_risorsa (id, nome)
VALUES
  ('00000000-0000-0000-0000-000000000501', 'Alimentari'),
  ('00000000-0000-0000-0000-000000000502', 'Abbigliamento'),
  ('00000000-0000-0000-0000-000000000503', 'Medicinali'),
  ('00000000-0000-0000-0000-000000000504', 'Altro');

-- RISORSE ---------------------------------------------------------------------
INSERT INTO public.risorsa (id, nome, descrizione, unita_misura, categoria_id)
VALUES
  (
    '00000000-0000-0000-0000-000000000601',
    'Pasta (500g)',
    'Confezioni di pasta secca da 500g',
    'pacchi',
    '00000000-0000-0000-0000-000000000501'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    'Latte UHT (1L)',
    'Latte a lunga conservazione 1L',
    'litri',
    '00000000-0000-0000-0000-000000000501'
  ),
  (
    '00000000-0000-0000-0000-000000000603',
    'Giacche Invernali',
    'Giacche pesanti per l''inverno',
    'pezzi',
    '00000000-0000-0000-0000-000000000502'
  ),
  (
    '00000000-0000-0000-0000-000000000604',
    'Paracetamolo',
    'Compresse da 500mg',
    'confezioni',
    '00000000-0000-0000-0000-000000000503'
  ),
  (
    '00000000-0000-0000-0000-000000000605',
    'Pannolini Taglia 3',
    'Confezioni di pannolini per bambini (taglia 3)',
    'pacchi',
    '00000000-0000-0000-0000-000000000504'
  );

-- INVENTARIO PARROCCHIA -------------------------------------------------------
INSERT INTO public.inventario_parrocchia (id, parrocchia_id, risorsa_id, quantita)
VALUES
  (
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000601',
    45
  ),
  (
    '00000000-0000-0000-0000-000000000702',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000602',
    12
  ),
  (
    '00000000-0000-0000-0000-000000000703',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000603',
    8
  ),
  (
    '00000000-0000-0000-0000-000000000704',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000604',
    5
  ),
  (
    '00000000-0000-0000-0000-000000000705',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000605',
    18
  );

-- RICHIESTE -------------------------------------------------------------------
INSERT INTO public.richiesta (
  id,
  descrizione,
  foto,
  data_richiesta,
  beneficiario_id,
  parrocchia_id,
  stato
)
VALUES
  (
    '00000000-0000-0000-0000-000000000801',
    'Supporto alimentare per la famiglia Verdi (pasta e latte)',
    NULL,
    NOW() - INTERVAL '1 day',
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000001',
    'in_valutazione'
  ),
  (
    '00000000-0000-0000-0000-000000000802',
    'Giacca invernale per Luca',
    NULL,
    NOW() - INTERVAL '3 days',
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000001',
    'approvata'
  ),
  (
    '00000000-0000-0000-0000-000000000803',
    'Medicinali di base per la famiglia Neri',
    NULL,
    NOW() - INTERVAL '5 days',
    '00000000-0000-0000-0000-000000000402',
    '00000000-0000-0000-0000-000000000001',
    'in_attesa'
  );

-- RICHIESTA_RISORSE -----------------------------------------------------------
INSERT INTO public.richiesta_risorse (id, richiesta_id, risorsa_id, quantita)
VALUES
  (
    '00000000-0000-0000-0000-000000000901',
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000601',
    10
  ),
  (
    '00000000-0000-0000-0000-000000000902',
    '00000000-0000-0000-0000-000000000801',
    '00000000-0000-0000-0000-000000000602',
    8
  ),
  (
    '00000000-0000-0000-0000-000000000903',
    '00000000-0000-0000-0000-000000000802',
    '00000000-0000-0000-0000-000000000603',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000904',
    '00000000-0000-0000-0000-000000000803',
    '00000000-0000-0000-0000-000000000604',
    2
  );

-- FINE DATI DI ESEMPIO --------------------------------------------------------


