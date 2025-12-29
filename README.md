# KARIS

**L'EFFICIENZA AL SERVIZIO DEL BENE**

---

## Introduzione

**Karis – l'efficienza al servizio del bene**

Il progetto Karis si colloca nel settore del Social Computing e del management dei servizi assistenziali. Il software è progettato per le strutture della Caritas, organizzazioni dedicate all'accoglienza e alla distribuzione di beni di prima necessità. Karis nasce per digitalizzare il supporto logistico e migliorare il coordinamento tra le diverse parrocchie e i centri territoriali.

### Il Problema: Frammentazione e Isolamento Operativo

Attualmente, la gestione dei centri Caritas soffre di due grandi criticità dovute all'assenza di sistemi informatizzati:

1. **Mancanza di dati interni**: I processi analogici impediscono un tracciamento reale delle scorte e dei beneficiari, causando inefficienze e margini di errore umano.

2. **Isolamento tra centri**: Non esiste un canale di comunicazione rapido e trasparente tra le diverse parrocchie. Ciò significa che un centro potrebbe avere un'eccedenza di un determinato bene (es. latte) mentre un centro vicino si trova in carenza, senza che i due possano coordinarsi per ottimizzare le risorse.

### Obiettivo del Progetto

L'obiettivo di Karis è la creazione di un ecosistema digitale integrato. Il software mira non solo ad automatizzare la gestione del singolo magazzino e l'anagrafica dei beneficiari, ma anche a mettere a sistema le risorse dei vari centri, facilitando la redistribuzione dei beni per abbattere gli sprechi e rispondere tempestivamente alle esigenze dei beneficiari.

### Soluzione Proposta e Differenziazione

Karis introduce una piattaforma che agisce su tre pilastri fondamentali:

1. **Anagrafica Centralizzata**: Un database sicuro per censire i beneficiari, monitorare lo storico degli aiuti e garantire equità nella distribuzione.

2. **Magazzino Intelligente**: Tracciamento in tempo reale dei pacchi e delle scorte, con avvisi sulle scadenze e carichi/scarichi automatizzati.

3. **Modulo di Interscambio Cooperativo**: La funzione distintiva di Karis che permette ai centri di visualizzare le disponibilità altrui e inviare richieste di beni ad altri centri. Questo trasforma la gestione delle risorse da un modello isolato a un modello di logistica distribuita e solidale.

### Confronto con le soluzioni esistenti

A differenza dei software gestionali generici, Karis è verticalizzato sulle necessità della Caritas. Laddove le soluzioni attuali sono fogli di calcolo rudimentali o sistemi chiusi, Karis introduce il concetto di rete parrocchiale: un'unica infrastruttura dove la solidarietà diventa "smart", permettendo di soddisfare la redistribuzione dei beni attraverso una collaborazione immediata e digitalizzata tra i diversi punti di assistenza.

---

## Stato dell'Arte

### Digitalizzazione del Terzo Settore e Gestione delle risorse

Il progetto Karis si inserisce in un filone di ricerca e applicazione che interseca l'informatica sociale (Social Computing), la logistica umanitaria e la teoria delle reti. Sebbene esistano numerosi sistemi gestionali (ERP) di natura commerciale, il contesto del Terzo Settore presenta specificità etiche e operative che rendono inadeguate le soluzioni standard. L'analisi dello stato dell'arte si articola su tre pilastri teorici fondamentali che giustificano le scelte progettuali di Karis: la transizione verso la società in rete, l'agilità nella catena di approvvigionamento umanitaria e l'approccio etico allo sviluppo tecnologico.

### 1. Dalla Frammentazione alla "Network Society"

Il problema dell'isolamento tra centri e della frammentazione operativa, identificato nell'introduzione come una delle criticità maggiori delle attuali procedure Caritas, trova riscontro nella teoria della Network Society elaborata dal sociologo Manuel Castells. Nella sua opera fondamentale, *The Rise of the Network Society* (Castells, 1996), egli evidenzia come nell'era dell'informazione il valore e l'efficienza di un'organizzazione non dipendano più solo dalle risorse possedute, ma dalla capacità di connessione tra i "nodi" della rete. I nodi isolati (in questo caso, le singole parrocchie non digitalizzate) rischiano l'irrilevanza o l'inefficienza funzionale.

**Contesto specifico del progetto**: Karis risponde a questa teorizzazione trasformando le parrocchie da entità atomizzate a nodi interconnessi. Il Modulo di Interscambio Cooperativo, che permette la visualizzazione e la richiesta di beni tra centri diversi, concretizza il passaggio da una struttura gerarchica o isolata a una struttura a rete, dove l'informazione fluisce orizzontalmente per ottimizzare le risorse territoriali.

### 2. Logistica Umanitaria e "Agile Supply Chain"

La gestione dei beni di prima necessità (pacchi alimentari, vestiario) in contesti di aiuto differisce sostanzialmente dalla logistica commerciale. La sfida principale nel settore non-profit non è la massimizzazione del profitto, ma la capacità di gestire l'imprevedibilità della domanda e delle donazioni, riducendo al contempo gli sprechi.

In contesti caratterizzati da elevata volatilità e incertezza, la capacità di rispondere rapidamente ai cambiamenti della domanda rappresenta un vantaggio competitivo fondamentale.

**Contesto specifico del progetto**: Attualmente, la gestione analogica impedisce questa agilità, creando situazioni di eccedenza o carenza non gestite (come l'esempio del latte citato in introduzione). Karis risolve questi problemi attraverso il Magazzino Intelligente: il tracciamento in tempo reale e gli avvisi di scadenza forniscono quella visibilità necessaria per rendere la catena di distribuzione "agile", permettendo di spostare le risorse dove servono, quando servono, riducendo lo spreco alimentare e migliorando la risposta al bisogno.

### 3. Capability Approach

L'introduzione di un'Anagrafica Centralizzata per i beneficiari non è una mera questione burocratica, ma tocca l'etica della gestione dei dati e della dignità della persona. Qui il riferimento teorico è il Premio Nobel Amartya Sen. Nel suo *Development as Freedom* (Sen, 1999), Sen teorizza che lo sviluppo debba essere inteso come espansione delle "capacità" (capabilities) delle persone di condurre la vita che desiderano. La tecnologia, in questo quadro, deve servire a rimuovere gli ostacoli (burocrazia lenta, errori, inequità) che limitano queste capacità.

**Contesto specifico del progetto**: Karis adotta questo approccio garantendo "equità nella distribuzione" e dignità tramite un database sicuro. Digitalizzando lo storico degli aiuti e automatizzando i processi, il sistema libera i volontari dal carico burocratico, permettendo loro di concentrarsi sulla relazione umana con il beneficiario, vera essenza del servizio Caritas.

---

## Tecnologie Utilizzate

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (con Supabase)
- **ORM/Client**: Supabase JS Client

---

## Struttura del Progetto

```
karis/
├── db/                    # Script SQL per database
│   ├── schema.sql        # Schema del database
│   └── seed.sql          # Dati di esempio
├── documentazione/        # Documentazione del progetto
│   ├── DOCUMENTAZIONE_DB.md
│   ├── DOCUMENTAZIONE_DB.pdf
│   ├── DOCUMENTAZIONE_DB.tex
│   └── er_schema.png     # Diagramma ER
└── karis/                # Applicazione Next.js
    ├── src/
    │   ├── app/          # Route e pagine Next.js
    │   ├── components/   # Componenti React
    │   └── lib/          # Utilities e client
    └── public/           # File statici
```

---

## Documentazione del Database

Per una documentazione completa e dettagliata del database, consultare:

- **[Documentazione Database (Markdown)](documentazione/DOCUMENTAZIONE_DB.md)**: Documentazione completa in formato Markdown
- **[Documentazione Database (PDF)](documentazione/DOCUMENTAZIONE_DB.pdf)**: Versione PDF della documentazione
- **[Documentazione Database (LaTeX)](documentazione/DOCUMENTAZIONE_DB.tex)**: Sorgente LaTeX per la documentazione
- **[Diagramma ER](documentazione/er_schema.png)**: Diagramma Entità-Relazione del database

### Schema del Database

Il database KARIS è progettato per gestire:

- **Parrocchie**: Gestione delle strutture Caritas
- **Utenti**: Amministratori e volontari con ruoli differenziati
- **Beneficiari**: Anagrafica delle persone assistite
- **Famiglie**: Raggruppamento dei beneficiari
- **Risorse**: Catalogazione dei beni disponibili
- **Inventario**: Tracciamento delle scorte per parrocchia
- **Assegnazioni**: Registro delle distribuzioni ai beneficiari
- **Richieste**: Sistema di interscambio tra parrocchie
- **Inviti**: Gestione degli accessi al sistema

Per maggiori dettagli su tabelle, relazioni e vincoli, consultare la documentazione completa.

---

## Installazione e Setup

### Prerequisiti

- Node.js 20 o superiore
- PostgreSQL (o accesso a Supabase)
- npm o yarn

### Installazione

```bash
# Installare le dipendenze
cd karis
npm install

# Configurare le variabili d'ambiente
# Creare un file .env.local con le credenziali Supabase
```

### Variabili d'Ambiente

Creare un file `.env.local` nella cartella `karis/` con:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Esecuzione

```bash
# Modalità sviluppo
npm run dev

# Build per produzione
npm run build

# Avvio in produzione
npm start
```

---

## Riferimenti Bibliografici

- Castells, M. (1996). *The Rise of the Network Society*. Blackwell Publishers.
- Sen, A. (1999). *Development as Freedom*. Oxford University Press.

---

## Licenza

[Specificare la licenza del progetto]

---

## Contributi

[Informazioni su come contribuire al progetto]

---

## Contatti

[Informazioni di contatto del team di sviluppo]

