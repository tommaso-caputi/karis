-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assegnazione_bene (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  risorsa_id uuid NOT NULL,
  beneficiario_id uuid,
  famiglia_id uuid,
  quantita integer NOT NULL,
  data_assegnazione timestamp with time zone DEFAULT now(),
  note text,
  CONSTRAINT assegnazione_bene_pkey PRIMARY KEY (id),
  CONSTRAINT assegnazione_bene_risorsa_id_fkey FOREIGN KEY (risorsa_id) REFERENCES public.risorsa(id),
  CONSTRAINT assegnazione_bene_beneficiario_id_fkey FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiario(id),
  CONSTRAINT assegnazione_bene_famiglia_id_fkey FOREIGN KEY (famiglia_id) REFERENCES public.famiglia(id)
);
CREATE TABLE public.beneficiario (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  cognome text NOT NULL,
  cf text UNIQUE,
  data_nascita date,
  luogo_nascita text,
  famiglia_id uuid,
  parrocchia_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT beneficiario_pkey PRIMARY KEY (id),
  CONSTRAINT beneficiario_famiglia_id_fkey FOREIGN KEY (famiglia_id) REFERENCES public.famiglia(id),
  CONSTRAINT beneficiario_parrocchia_id_fkey FOREIGN KEY (parrocchia_id) REFERENCES public.parrocchia(id)
);
CREATE TABLE public.categoria_risorsa (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  CONSTRAINT categoria_risorsa_pkey PRIMARY KEY (id)
);
CREATE TABLE public.famiglia (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cognome text NOT NULL,
  note text,
  CONSTRAINT famiglia_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventario_parrocchia (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parrocchia_id uuid,
  risorsa_id uuid,
  quantita integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventario_parrocchia_pkey PRIMARY KEY (id),
  CONSTRAINT inventario_parrocchia_parrocchia_id_fkey FOREIGN KEY (parrocchia_id) REFERENCES public.parrocchia(id),
  CONSTRAINT inventario_parrocchia_risorsa_id_fkey FOREIGN KEY (risorsa_id) REFERENCES public.risorsa(id)
);
CREATE TABLE public.parrocchia (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  via text,
  citta text,
  piva text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT parrocchia_pkey PRIMARY KEY (id)
);
CREATE TABLE public.richiesta (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  descrizione text,
  foto text,
  data_richiesta timestamp with time zone DEFAULT now(),
  beneficiario_id uuid,
  parrocchia_id uuid,
  stato text DEFAULT 'in_attesa'::text CHECK (stato = ANY (ARRAY['in_attesa'::text, 'in_valutazione'::text, 'approvata'::text, 'respinta'::text])),
  CONSTRAINT richiesta_pkey PRIMARY KEY (id),
  CONSTRAINT richiesta_beneficiario_id_fkey FOREIGN KEY (beneficiario_id) REFERENCES public.beneficiario(id),
  CONSTRAINT richiesta_parrocchia_id_fkey FOREIGN KEY (parrocchia_id) REFERENCES public.parrocchia(id)
);
CREATE TABLE public.richiesta_risorse (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  richiesta_id uuid,
  risorsa_id uuid,
  quantita integer NOT NULL,
  CONSTRAINT richiesta_risorse_pkey PRIMARY KEY (id),
  CONSTRAINT richiesta_risorse_richiesta_id_fkey FOREIGN KEY (richiesta_id) REFERENCES public.richiesta(id),
  CONSTRAINT richiesta_risorse_risorsa_id_fkey FOREIGN KEY (risorsa_id) REFERENCES public.risorsa(id)
);
CREATE TABLE public.risorsa (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  descrizione text,
  unita_misura text DEFAULT 'pz'::text,
  parrocchia_id uuid,
  categoria_id uuid,
  CONSTRAINT risorsa_pkey PRIMARY KEY (id),
  CONSTRAINT risorsa_parrocchia_id_fkey FOREIGN KEY (parrocchia_id) REFERENCES public.parrocchia(id),
  CONSTRAINT risorsa_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria_risorsa(id)
);
CREATE TABLE public.tipo_utente (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  descrizione text NOT NULL,
  CONSTRAINT tipo_utente_pkey PRIMARY KEY (id)
);
CREATE TABLE public.utente (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  cognome text NOT NULL,
  cf text UNIQUE,
  tipo_utente_id uuid,
  parrocchia_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT utente_pkey PRIMARY KEY (id),
  CONSTRAINT utente_tipo_utente_id_fkey FOREIGN KEY (tipo_utente_id) REFERENCES public.tipo_utente(id),
  CONSTRAINT utente_parrocchia_id_fkey FOREIGN KEY (parrocchia_id) REFERENCES public.parrocchia(id)
);