# Documentazione Architettura e Tech Stack - KARIS

## Indice
1. [Introduzione](#introduzione)
2. [Tech Stack](#tech-stack)
3. [Architettura del Sistema](#architettura-del-sistema)
4. [Struttura del Progetto](#struttura-del-progetto)
5. [Componenti e Interazioni](#componenti-e-interazioni)
6. [Flusso di Autenticazione](#flusso-di-autenticazione)
7. [Caso d'Uso: Assegnazione di un Bene](#caso-duso-assegnazione-di-un-bene)
8. [Pattern e Convenzioni](#pattern-e-convenzioni)

---

## Introduzione

**KARIS** è un'applicazione web full-stack progettata per la gestione digitale delle risorse e della distribuzione di beni nelle strutture Caritas parrocchiali. Il sistema permette di gestire inventari, assegnazioni, beneficiari e facilita l'interscambio cooperativo tra diverse parrocchie.

Questa documentazione descrive l'architettura tecnica del sistema, le tecnologie utilizzate, come i componenti interagiscono tra loro e presenta un caso d'uso completo con il relativo workflow.

---

## Tech Stack

### Frontend

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Next.js** | 16.0.10 | Framework React per SSR/SSG e routing |
| **React** | 19.2.1 | Libreria UI per componenti interattivi |
| **TypeScript** | 5.x | Linguaggio per type safety |
| **Tailwind CSS** | 4.x | Framework CSS utility-first |
| **Radix UI** | Latest | Componenti UI accessibili e headless |
| **Lucide React** | 0.561.0 | Libreria di icone |
| **Sonner** | 2.0.7 | Sistema di notifiche toast |

### Backend

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Next.js API Routes** | 16.0.10 | Endpoint REST per logica server-side |
| **Supabase JS Client** | 2.49.1 | Client per database PostgreSQL e autenticazione |

### Database e Infrastruttura

| Tecnologia | Utilizzo |
|------------|----------|
| **PostgreSQL** | Database relazionale (gestito via Supabase) |
| **Supabase** | BaaS (Backend as a Service) per database e auth |
| **Supabase Auth** | Sistema di autenticazione e gestione utenti |

### Strumenti di Sviluppo

| Tecnologia | Utilizzo |
|------------|----------|
| **ESLint** | Linter per qualità del codice |
| **PostCSS** | Processore CSS |
| **TypeScript Compiler** | Compilazione e type checking |

---

## Architettura del Sistema

### Architettura Generale

KARIS segue un'architettura **full-stack** basata su Next.js, che integra frontend e backend in un'unica applicazione. Il sistema utilizza il pattern **App Router** di Next.js 13+ per il routing e la gestione delle pagine.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser Client                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Components (Client Components)         │   │
│  │  - DashboardLayout, LandingPage, Form Components    │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │ HTTP Requests                          │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js App Router (Server Components)      │   │
│  │  - Pages, Layouts, Route Handlers                    │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/beni, /api/assegnazioni, /api/richieste, etc. │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Client                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  - Database Queries (PostgreSQL)                     │   │
│  │  - Authentication & Authorization                     │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Cloud (BaaS)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                 │   │
│  │  Authentication Service                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Pattern Architetturali

1. **Server-Side Rendering (SSR)**: Le pagine vengono renderizzate sul server per migliorare SEO e performance iniziale
2. **Client-Side Rendering (CSR)**: Componenti interattivi renderizzati lato client
3. **API Routes**: Endpoint REST per operazioni CRUD e logica di business
4. **Component-Based Architecture**: UI costruita con componenti React riutilizzabili
5. **Separation of Concerns**: Separazione tra logica di presentazione, business e data access

---

## Struttura del Progetto

```
karis/
├── db/                          # Script SQL per database
│   ├── schema.sql              # Schema completo del database
│   └── seed.sql                # Dati di esempio
│
├── documentazione/              # Documentazione del progetto
│   ├── DOCUMENTAZIONE_DB.md
│   ├── DOCUMENTAZIONE_ARCHITETTURA.md
│   └── er_schema.png
│
└── karis/                       # Applicazione Next.js
    ├── src/
    │   ├── app/                 # App Router (Next.js 13+)
    │   │   ├── api/             # API Routes (Backend)
    │   │   │   ├── assegnazioni/
    │   │   │   ├── beneficiario/
    │   │   │   ├── beni/
    │   │   │   ├── dashboard/
    │   │   │   ├── famiglia/
    │   │   │   ├── inviti/
    │   │   │   ├── richieste/
    │   │   │   ├── user/
    │   │   │   └── volontari/
    │   │   │
    │   │   ├── beneficiario/    # Pagine per gestione beneficiari
    │   │   ├── beni/            # Pagine per gestione beni
    │   │   ├── dashboard/       # Dashboard principale
    │   │   ├── famiglia/        # Pagine per gestione famiglie
    │   │   ├── invito/          # Pagina per accettazione inviti
    │   │   ├── login/           # Pagina di login
    │   │   ├── richieste/       # Pagina per richieste tra parrocchie
    │   │   ├── volontari/       # Pagina per gestione volontari
    │   │   ├── layout.tsx       # Layout root dell'applicazione
    │   │   ├── page.tsx         # Homepage (landing page)
    │   │   └── globals.css      # Stili globali
    │   │
    │   ├── components/          # Componenti React riutilizzabili
    │   │   ├── ui/              # Componenti UI base (shadcn/ui)
    │   │   │   ├── button.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── input.tsx
    │   │   │   └── ...
    │   │   ├── DashboardLayout.tsx    # Layout condiviso per dashboard
    │   │   ├── LandingPage/          # Componenti per landing page
    │   │   └── NotFound.tsx
    │   │
    │   └── lib/                 # Utilities e helper
    │       ├── supabaseClient.ts     # Client Supabase configurato
    │       ├── apiHelpers.ts         # Helper per API routes
    │       └── utils.ts              # Utility generiche
    │
    ├── public/                  # File statici (immagini, favicon, etc.)
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    └── tailwind.config.js
```

---

## Componenti e Interazioni

### Livello 1: Componenti UI (Frontend)

#### DashboardLayout
**Posizione**: `src/components/DashboardLayout.tsx`

**Responsabilità**:
- Layout condiviso per tutte le pagine autenticate
- Sidebar di navigazione
- Header con informazioni utente
- Gestione autenticazione e logout

**Interazioni**:
- Utilizza `supabase.auth.getUser()` per verificare autenticazione
- Chiama `/api/user` per recuperare dati utente
- Gestisce navigazione tra sezioni

#### Componenti di Pagina
Ogni pagina (es. `beni/page.tsx`, `beneficiario/page.tsx`) è un componente React che:
- Utilizza `DashboardLayout` come wrapper
- Effettua chiamate API per recuperare dati
- Gestisce stato locale con React hooks (`useState`, `useEffect`)
- Mostra feedback all'utente tramite toast notifications (Sonner)

### Livello 2: API Routes (Backend)

#### Struttura API Route
Ogni API route segue questo pattern:

```typescript
// src/app/api/[resource]/route.ts
export async function GET(request: Request) {
    // 1. Validazione parametri
    // 2. Autenticazione utente
    // 3. Recupero dati da database
    // 4. Formattazione risposta
    // 5. Return JSON
}

export async function POST(request: Request) {
    // 1. Validazione body
    // 2. Autenticazione utente
    // 3. Validazione business logic
    // 4. Inserimento/aggiornamento database
    // 5. Return risultato
}
```

#### Helper Functions
**Posizione**: `src/lib/apiHelpers.ts`

Funzioni riutilizzabili per API routes:
- `getUserParrocchia(userId)`: Recupera utente e parrocchia associata
- `validateUserId()`: Valida presenza userId nei parametri
- `normalizeSupabaseRelation()`: Normalizza relazioni Supabase

### Livello 3: Database Layer

#### Supabase Client
**Posizione**: `src/lib/supabaseClient.ts`

Configurazione del client Supabase:
- Inizializzazione con URL e API key da variabili d'ambiente
- Gestione errori quando Supabase non è configurato
- Utilizzato sia lato client che server

#### Query Pattern
Le query seguono questo pattern:

```typescript
const { data, error } = await supabase
    .from("tabella")
    .select("campo1, campo2, relazione:campo_id (id, nome)")
    .eq("campo", valore)
    .order("created_at", { ascending: false });
```

### Flusso di Dati Completo

```
┌──────────────┐
│   Browser    │
│  Component   │
└──────┬───────┘
       │ 1. User Action (click, submit)
       ▼
┌─────────────────────────────────────┐
│  React Component (Client)            │
│  - useState/useEffect                │
│  - Gestione form/state               │
└──────┬───────────────────────────────┘
       │ 2. fetch('/api/...')
       ▼
┌─────────────────────────────────────┐
│  Next.js API Route (Server)          │
│  - Validazione parametri             │
│  - Autenticazione                    │
│  - Business logic                    │
└──────┬───────────────────────────────┘
       │ 3. supabase.from(...)
       ▼
┌─────────────────────────────────────┐
│  Supabase Client                     │
│  - Query builder                     │
│  - Type safety                       │
└──────┬───────────────────────────────┘
       │ 4. HTTP Request
       ▼
┌─────────────────────────────────────┐
│  Supabase Cloud (PostgreSQL)         │
│  - Database operations               │
│  - Row Level Security                │
└──────┬───────────────────────────────┘
       │ 5. Response Data
       ▼
┌─────────────────────────────────────┐
│  API Route                          │
│  - Formattazione risposta            │
│  - NextResponse.json()               │
└──────┬───────────────────────────────┘
       │ 6. JSON Response
       ▼
┌─────────────────────────────────────┐
│  React Component                     │
│  - Aggiornamento state               │
│  - Re-render UI                      │
└─────────────────────────────────────┘
```

---

## Flusso di Autenticazione

### 1. Login

```
┌──────────┐
│  Utente  │
└────┬─────┘
     │ 1. Inserisce email/password
     ▼
┌─────────────────────────────────────┐
│  /login/page.tsx                     │
│  - Form di login                     │
│  - Gestione stato form               │
└────┬─────────────────────────────────┘
     │ 2. supabase.auth.signInWithPassword()
     ▼
┌─────────────────────────────────────┐
│  Supabase Auth                      │
│  - Verifica credenziali             │
│  - Genera session token             │
└────┬─────────────────────────────────┘
     │ 3. Session creata
     ▼
┌─────────────────────────────────────┐
│  Client                             │
│  - Salva session in localStorage    │
│  - Redirect a /dashboard            │
└─────────────────────────────────────┘
```

### 2. Verifica Autenticazione

Ogni pagina protetta verifica l'autenticazione:

```typescript
// Pattern comune in tutte le pagine
useEffect(() => {
    const checkAuth = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            router.push("/login");
        }
    };
    checkAuth();
}, []);
```

### 3. Recupero Dati Utente

Dopo l'autenticazione, il sistema recupera i dati dell'utente dal database:

```typescript
// Chiamata API
const res = await fetch(`/api/user?userId=${user.id}`);
const userData = await res.json();
// userData contiene: nome, cognome, parrocchia, ruolo
```

### 4. Autorizzazione

Le API routes verificano che l'utente abbia accesso alle risorse della propria parrocchia:

```typescript
// Pattern in API routes
const userResult = await getUserParrocchia(userId);
const parrocchiaId = userResult.data.parrocchia_id;

// Filtra query per parrocchia
query = query.eq("parrocchia_id", parrocchiaId);
```

---

## Caso d'Uso: Assegnazione di un Bene

### Scenario
Un volontario della Parrocchia di San Paolo vuole assegnare 5 scatolette di tonno a un beneficiario registrato nel sistema.

### Workflow Completo

#### Fase 1: Accesso alla Funzionalità

```
┌──────────┐
│ Volontario│
└────┬─────┘
     │ 1. Naviga a /beni
     ▼
┌─────────────────────────────────────┐
│  /beni/page.tsx                      │
│  - Lista beni disponibili            │
│  - Pulsante "Assegna" per ogni bene  │
└────┬─────────────────────────────────┘
     │ 2. Click su "Assegna" per tonno
     ▼
┌─────────────────────────────────────┐
│  Router.push('/beni/assegna?beneId=..')│
└────┬─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  /beni/assegna/page.tsx              │
│  - Caricamento dati iniziali         │
└─────────────────────────────────────┘
```

**Codice rilevante**:
```typescript
// /beni/assegna/page.tsx
useEffect(() => {
    const loadData = async () => {
        // 1. Verifica autenticazione
        const { data: { user } } = await supabase.auth.getUser();
        
        // 2. Carica beni disponibili
        const beniRes = await fetch(`/api/beni?userId=${user.id}`);
        const beni = await beniRes.json();
        
        // 3. Carica beneficiari
        const beneficiariRes = await fetch(`/api/beneficiario?userId=${user.id}`);
        const beneficiari = await beneficiariRes.json();
        
        // 4. Carica famiglie
        const famiglieRes = await fetch(`/api/famiglia?userId=${user.id}&all=true`);
        const famiglie = await famiglieRes.json();
    };
    loadData();
}, []);
```

#### Fase 2: Selezione e Compilazione Form

```
┌─────────────────────────────────────┐
│  Form di Assegnazione               │
│  ┌───────────────────────────────┐  │
│  │ 1. Selezione Bene: Tonno      │  │
│  │    (già pre-selezionato)      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 2. Tipo: Beneficiario/Famiglia │  │
│  │    (utente seleziona)         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 3. Beneficiario: Mario Rossi  │  │
│  │    (utente seleziona)         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 4. Quantità: 5                │  │
│  │    (utente inserisce)         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 5. Note: (opzionale)          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Validazione Client-Side**:
```typescript
// Verifica quantità disponibile
const beneSelezionato = beni.find(b => b.id === formData.beneId);
if (quantitaNum > beneSelezionato.quantity) {
    toast.error(`Quantità non disponibile. Disponibile: ${beneSelezionato.quantity}`);
    return;
}
```

#### Fase 3: Invio Richiesta

```
┌─────────────────────────────────────┐
│  Utente clicca "Assegna Bene"        │
└────┬─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  handleSubmit()                      │
│  - Validazione form                  │
│  - Preparazione payload              │
└────┬─────────────────────────────────┘
     │ POST /api/assegnazioni
     ▼
```

#### Fase 4: Elaborazione Backend

```
┌─────────────────────────────────────┐
│  /api/assegnazioni/route.ts (POST)   │
└────┬─────────────────────────────────┘
     │
     ├─► 1. Validazione Parametri
     │   - risorsa_id presente?
     │   - quantita > 0?
     │   - beneficiario_id o famiglia_id presente?
     │
     ├─► 2. Autenticazione
     │   - getUserParrocchia(userId)
     │   - Recupera parrocchia_id utente
     │
     ├─► 3. Verifica Risorsa
     │   - Risorsa esiste?
     │   - Risorsa appartiene alla parrocchia?
     │
     ├─► 4. Verifica Beneficiario
     │   - Beneficiario esiste?
     │   - Beneficiario appartiene alla parrocchia?
     │
     ├─► 5. Controllo Disponibilità
     │   - Recupera inventario_parrocchia
     │   - Calcola quantità già assegnata
     │   - Verifica: quantita <= disponibile
     │
     ├─► 6. Creazione Assegnazione
     │   - Insert in assegnazione_bene
     │   - Dati: risorsa_id, beneficiario_id, quantita, note
     │
     └─► 7. Risposta
         - Return JSON con assegnazione creata
```

**Codice rilevante**:
```typescript
// /api/assegnazioni/route.ts
export async function POST(request: Request) {
    // 1. Parse body
    const { risorsa_id, beneficiario_id, quantita, note } = await request.json();
    
    // 2. Validazione
    if (!risorsa_id || quantita <= 0) {
        return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
    }
    
    // 3. Autenticazione e autorizzazione
    const userResult = await getUserParrocchia(userId);
    const parrocchiaId = userResult.data.parrocchia_id;
    
    // 4. Verifica risorsa appartiene alla parrocchia
    const { data: risorsa } = await supabase
        .from("risorsa")
        .select("id, parrocchia_id")
        .eq("id", risorsa_id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();
    
    // 5. Controllo disponibilità
    const { data: inventario } = await supabase
        .from("inventario_parrocchia")
        .select("quantita")
        .eq("risorsa_id", risorsa_id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();
    
    const quantitaAssegnata = /* calcolo da assegnazioni esistenti */;
    const quantitaDisponibile = inventario.quantita - quantitaAssegnata;
    
    if (quantita > quantitaDisponibile) {
        return NextResponse.json(
            { error: `Quantità insufficiente. Disponibile: ${quantitaDisponibile}` },
            { status: 400 }
        );
    }
    
    // 6. Creazione assegnazione
    const { data: nuovaAssegnazione } = await supabase
        .from("assegnazione_bene")
        .insert({
            risorsa_id,
            beneficiario_id,
            quantita,
            note,
            data_assegnazione: new Date().toISOString()
        })
        .select()
        .maybeSingle();
    
    return NextResponse.json(nuovaAssegnazione, { status: 201 });
}
```

#### Fase 5: Aggiornamento UI

```
┌─────────────────────────────────────┐
│  Client riceve risposta              │
│  - Status 201: Success               │
└────┬─────────────────────────────────┘
     │
     ├─► toast.success("Bene assegnato!")
     │
     └─► router.push("/beni")
         │
         ▼
┌─────────────────────────────────────┐
│  /beni/page.tsx                      │
│  - Ricarica lista beni               │
│  - Mostra quantità aggiornata        │
└─────────────────────────────────────┘
```

### Diagramma di Sequenza Completo

```
Volontario    Frontend          API Route         Supabase        Database
    │             │                  │                │               │
    │──click──►   │                  │                │               │
    │             │──POST /api/──►    │                │               │
    │             │  assegnazioni     │                │               │
    │             │                  │──getUser()──►  │               │
    │             │                  │◄─user data───  │               │
    │             │                  │                │               │
    │             │                  │──query risorsa─┼──────────────►│
    │             │                  │◄───────────────┼───────────────│
    │             │                  │                │               │
    │             │                  │──query invent──┼──────────────►│
    │             │                  │◄───────────────┼───────────────│
    │             │                  │                │               │
    │             │                  │──query assegn──┼──────────────►│
    │             │                  │◄───────────────┼───────────────│
    │             │                  │                │               │
    │             │                  │──insert───────┼──────────────►│
    │             │                  │◄───────────────┼───────────────│
    │             │◄──201 Created───  │                │               │
    │             │                  │                │               │
    │◄─toast──────│                  │                │               │
    │             │                  │                │               │
    │◄─redirect───│                  │                │               │
```

### Validazioni e Controlli

1. **Client-Side**:
   - Form validation (campi obbligatori)
   - Verifica quantità disponibile (basata su dati cached)
   - Feedback immediato all'utente

2. **Server-Side**:
   - Autenticazione utente
   - Autorizzazione (verifica parrocchia)
   - Validazione business logic
   - Controllo disponibilità reale (query database)
   - Transazioni atomiche

### Gestione Errori

```typescript
// Esempi di errori gestiti:

// 1. Quantità insufficiente
if (quantita > quantitaDisponibile) {
    return NextResponse.json(
        { error: `Quantità insufficiente. Disponibile: ${quantitaDisponibile}` },
        { status: 400 }
    );
}

// 2. Risorsa non trovata
if (!risorsa) {
    return NextResponse.json(
        { error: "Risorsa non trovata o non appartiene alla tua parrocchia." },
        { status: 404 }
    );
}

// 3. Beneficiario non trovato
if (!beneficiario) {
    return NextResponse.json(
        { error: "Beneficiario non trovato o non appartiene alla tua parrocchia." },
        { status: 404 }
    );
}
```

---

## Pattern e Convenzioni

### 1. Naming Conventions

- **Componenti**: PascalCase (`DashboardLayout.tsx`)
- **File API**: lowercase (`route.ts`)
- **Variabili**: camelCase (`userData`, `beneficiarioId`)
- **Costanti**: UPPER_SNAKE_CASE (`NEXT_PUBLIC_SUPABASE_URL`)

### 2. Struttura API Routes

Ogni API route esporta funzioni HTTP standard:
- `GET`: Lettura dati
- `POST`: Creazione risorse
- `PATCH`: Aggiornamento parziale
- `DELETE`: Eliminazione risorse

### 3. Gestione Stato

- **Client Components**: `useState` per stato locale
- **Server Components**: Props e fetch diretti
- **Global State**: Non utilizzato (preferiti fetch diretti)

### 4. Error Handling

- **API Routes**: Return `NextResponse.json({ error: "..." }, { status: ... })`
- **Client Components**: Try-catch con toast notifications
- **Database Errors**: Logging e messaggi user-friendly

### 5. Type Safety

- TypeScript per type checking
- Interfacce per dati API
- Type inference da Supabase queries

### 6. Styling

- Tailwind CSS utility classes
- Design system con variabili CSS
- Componenti UI riutilizzabili (shadcn/ui)

---

## Conclusioni

L'architettura di KARIS è progettata per essere:

- **Scalabile**: Next.js permette crescita orizzontale
- **Manutenibile**: Separazione chiara delle responsabilità
- **Type-Safe**: TypeScript end-to-end
- **User-Friendly**: Feedback immediato e UI moderna
- **Sicura**: Autenticazione e autorizzazione a ogni livello

Il sistema utilizza tecnologie moderne e consolidate, garantendo performance, sicurezza e facilità di sviluppo.

---

## Riferimenti

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

