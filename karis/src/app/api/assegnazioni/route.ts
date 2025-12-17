import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface AssegnazioneApiResponse {
    id: string;
    risorsa_id: string;
    risorsa_nome: string;
    beneficiario_id: string | null;
    beneficiario_nome: string | null;
    famiglia_id: string | null;
    famiglia_cognome: string | null;
    quantita: number;
    data_assegnazione: string;
    note: string | null;
}

export async function GET(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const beneficiarioId = searchParams.get("beneficiarioId");
    const famigliaId = searchParams.get("famigliaId");
    const risorsaId = searchParams.get("risorsaId");

    if (!userId) {
        return NextResponse.json(
            { error: "Parametro 'userId' mancante." },
            { status: 400 }
        );
    }

    // 1. Recupero dell'utente per ottenere la parrocchia di appartenenza
    const { data: utente, error: utenteError } = await supabase
        .from("utente")
        .select("id, parrocchia_id")
        .eq("id", userId)
        .maybeSingle();

    if (utenteError) {
        console.error("Errore nel recupero dell'utente:", utenteError);
        return NextResponse.json(
            { error: "Errore nel recupero dell'utente." },
            { status: 500 }
        );
    }

    if (!utente || !utente.parrocchia_id) {
        return NextResponse.json(
            { error: "Utente o parrocchia associata non trovati." },
            { status: 404 }
        );
    }

    const parrocchiaId = utente.parrocchia_id as string;

    // 2. Costruisci la query base
    let query = supabase
        .from("assegnazione_bene")
        .select(
            `
            id,
            risorsa_id,
            beneficiario_id,
            famiglia_id,
            quantita,
            data_assegnazione,
            note,
            risorsa:risorsa_id (
                id,
                nome,
                parrocchia_id
            ),
            beneficiario:beneficiario_id (
                id,
                nome,
                cognome,
                parrocchia_id
            ),
            famiglia:famiglia_id (
                id,
                cognome
            )
        `
        );

    // Filtra per parrocchia attraverso la risorsa
    // Prima recuperiamo tutte le risorse della parrocchia
    const { data: risorseParrocchia, error: risorseError } = await supabase
        .from("risorsa")
        .select("id")
        .eq("parrocchia_id", parrocchiaId);

    if (risorseError) {
        console.error("Errore nel recupero delle risorse:", risorseError);
        return NextResponse.json(
            { error: "Errore nel recupero delle risorse." },
            { status: 500 }
        );
    }

    const risorsaIds = (risorseParrocchia ?? []).map((r: any) => r.id);
    
    if (risorsaIds.length === 0) {
        return NextResponse.json([]);
    }

    query = query.in("risorsa_id", risorsaIds);

    // Filtri opzionali
    if (beneficiarioId) {
        query = query.eq("beneficiario_id", beneficiarioId);
    }

    if (famigliaId) {
        query = query.eq("famiglia_id", famigliaId);
    }

    if (risorsaId) {
        query = query.eq("risorsa_id", risorsaId);
    }

    const { data: assegnazioni, error: assegnazioniError } = await query.order("data_assegnazione", { ascending: false });

    if (assegnazioniError) {
        console.error("Errore nel recupero delle assegnazioni:", assegnazioniError);
        return NextResponse.json(
            { error: "Errore nel recupero delle assegnazioni." },
            { status: 500 }
        );
    }

    // Filtra ulteriormente per beneficiari della parrocchia
    const assegnazioniFiltrate = (assegnazioni ?? []).filter((a: any) => {
        // Se c'è un beneficiario, verifica che appartenga alla parrocchia
        if (a.beneficiario_id && a.beneficiario) {
            const beneficiario = Array.isArray(a.beneficiario) ? a.beneficiario[0] : a.beneficiario;
            return beneficiario?.parrocchia_id === parrocchiaId;
        }
        // Se c'è solo una famiglia, va bene (le famiglie sono condivise)
        return true;
    });

    const assegnazioniFormatted: AssegnazioneApiResponse[] = assegnazioniFiltrate.map((a: any) => {
        const risorsa = Array.isArray(a.risorsa) ? a.risorsa[0] : a.risorsa;
        const beneficiario = a.beneficiario ? (Array.isArray(a.beneficiario) ? a.beneficiario[0] : a.beneficiario) : null;
        const famiglia = a.famiglia ? (Array.isArray(a.famiglia) ? a.famiglia[0] : a.famiglia) : null;

        return {
            id: a.id,
            risorsa_id: a.risorsa_id,
            risorsa_nome: risorsa?.nome ?? "Sconosciuto",
            beneficiario_id: a.beneficiario_id,
            beneficiario_nome: beneficiario ? `${beneficiario.nome} ${beneficiario.cognome}` : null,
            famiglia_id: a.famiglia_id,
            famiglia_cognome: famiglia?.cognome ?? null,
            quantita: a.quantita,
            data_assegnazione: a.data_assegnazione,
            note: a.note,
        };
    });

    return NextResponse.json(assegnazioniFormatted);
}

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    let body: {
        userId?: string;
        risorsa_id?: string;
        beneficiario_id?: string | null;
        famiglia_id?: string | null;
        quantita?: number;
        note?: string | null;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { userId, risorsa_id, beneficiario_id, famiglia_id, quantita, note } = body;

    if (!userId || !risorsa_id || typeof quantita !== "number" || quantita <= 0) {
        return NextResponse.json(
            { error: "Parametri mancanti o non validi: userId, risorsa_id e quantita sono obbligatori." },
            { status: 400 }
        );
    }

    if (!beneficiario_id && !famiglia_id) {
        return NextResponse.json(
            { error: "È necessario specificare beneficiario_id o famiglia_id." },
            { status: 400 }
        );
    }

    if (beneficiario_id && famiglia_id) {
        return NextResponse.json(
            { error: "Non è possibile assegnare contemporaneamente a beneficiario e famiglia." },
            { status: 400 }
        );
    }

    // 1. Recupero dell'utente per ottenere la parrocchia di appartenenza
    const { data: utente, error: utenteError } = await supabase
        .from("utente")
        .select("id, parrocchia_id")
        .eq("id", userId)
        .maybeSingle();

    if (utenteError) {
        console.error("Errore nel recupero dell'utente:", utenteError);
        return NextResponse.json(
            { error: "Errore nel recupero dell'utente." },
            { status: 500 }
        );
    }

    if (!utente || !utente.parrocchia_id) {
        return NextResponse.json(
            { error: "Utente o parrocchia associata non trovati." },
            { status: 404 }
        );
    }

    const parrocchiaId = utente.parrocchia_id as string;

    // 2. Verifica che la risorsa esista e appartenga alla parrocchia
    const { data: risorsa, error: risorsaError } = await supabase
        .from("risorsa")
        .select("id, parrocchia_id")
        .eq("id", risorsa_id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();

    if (risorsaError || !risorsa) {
        console.error("Errore nel recupero della risorsa:", risorsaError);
        return NextResponse.json(
            { error: "Risorsa non trovata o non appartiene alla tua parrocchia." },
            { status: 404 }
        );
    }

    // 3. Verifica che il beneficiario esista e appartenga alla parrocchia (se specificato)
    if (beneficiario_id) {
        const { data: beneficiario, error: beneficiarioError } = await supabase
            .from("beneficiario")
            .select("id, parrocchia_id")
            .eq("id", beneficiario_id)
            .eq("parrocchia_id", parrocchiaId)
            .maybeSingle();

        if (beneficiarioError || !beneficiario) {
            console.error("Errore nel recupero del beneficiario:", beneficiarioError);
            return NextResponse.json(
                { error: "Beneficiario non trovato o non appartiene alla tua parrocchia." },
                { status: 404 }
            );
        }
    }

    // 4. Verifica che la famiglia esista (se specificata)
    if (famiglia_id) {
        const { data: famiglia, error: famigliaError } = await supabase
            .from("famiglia")
            .select("id")
            .eq("id", famiglia_id)
            .maybeSingle();

        if (famigliaError || !famiglia) {
            console.error("Errore nel recupero della famiglia:", famigliaError);
            return NextResponse.json(
                { error: "Famiglia non trovata." },
                { status: 404 }
            );
        }
    }

    // 5. Recupera la quantità disponibile nell'inventario
    const { data: inventario, error: inventarioError } = await supabase
        .from("inventario_parrocchia")
        .select("quantita")
        .eq("risorsa_id", risorsa_id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();

    if (inventarioError) {
        console.error("Errore nel recupero dell'inventario:", inventarioError);
        return NextResponse.json(
            { error: "Errore nel recupero dell'inventario." },
            { status: 500 }
        );
    }

    if (!inventario) {
        return NextResponse.json(
            { error: "Risorsa non presente nell'inventario." },
            { status: 404 }
        );
    }

    const quantitaTotale = inventario.quantita ?? 0;

    // 6. Calcola la quantità già assegnata
    const { data: assegnazioniEsistenti, error: assegnazioniError } = await supabase
        .from("assegnazione_bene")
        .select("quantita")
        .eq("risorsa_id", risorsa_id);

    if (assegnazioniError) {
        console.error("Errore nel recupero delle assegnazioni esistenti:", assegnazioniError);
        return NextResponse.json(
            { error: "Errore nel controllo delle assegnazioni esistenti." },
            { status: 500 }
        );
    }

    const quantitaAssegnata = (assegnazioniEsistenti ?? []).reduce((sum: number, a: any) => sum + (a.quantita ?? 0), 0);
    const quantitaDisponibile = quantitaTotale - quantitaAssegnata;

    if (quantita > quantitaDisponibile) {
        return NextResponse.json(
            { 
                error: `Quantità insufficiente. Disponibile: ${quantitaDisponibile}, richiesta: ${quantita}.` 
            },
            { status: 400 }
        );
    }

    // 7. Crea l'assegnazione
    const assegnazioneData: {
        risorsa_id: string;
        beneficiario_id?: string | null;
        famiglia_id?: string | null;
        quantita: number;
        note?: string | null;
    } = {
        risorsa_id,
        quantita,
    };

    if (beneficiario_id) {
        assegnazioneData.beneficiario_id = beneficiario_id;
        assegnazioneData.famiglia_id = null;
    } else if (famiglia_id) {
        assegnazioneData.famiglia_id = famiglia_id;
        assegnazioneData.beneficiario_id = null;
    }

    if (note) {
        assegnazioneData.note = note;
    }

    const { data: nuovaAssegnazione, error: assegnazioneInsertError } = await supabase
        .from("assegnazione_bene")
        .insert(assegnazioneData)
        .select("id, risorsa_id, beneficiario_id, famiglia_id, quantita, data_assegnazione, note")
        .maybeSingle();

    if (assegnazioneInsertError || !nuovaAssegnazione) {
        console.error("Errore nella creazione dell'assegnazione:", assegnazioneInsertError);
        return NextResponse.json(
            { error: "Errore nella creazione dell'assegnazione." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            id: nuovaAssegnazione.id,
            risorsa_id: nuovaAssegnazione.risorsa_id,
            beneficiario_id: nuovaAssegnazione.beneficiario_id,
            famiglia_id: nuovaAssegnazione.famiglia_id,
            quantita: nuovaAssegnazione.quantita,
            data_assegnazione: nuovaAssegnazione.data_assegnazione,
            note: nuovaAssegnazione.note,
        },
        { status: 201 }
    );
}

export async function DELETE(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (!userId || !id) {
        return NextResponse.json(
            { error: "Parametri mancanti: userId e id sono obbligatori." },
            { status: 400 }
        );
    }

    // 1. Recupero dell'utente per ottenere la parrocchia di appartenenza
    const { data: utente, error: utenteError } = await supabase
        .from("utente")
        .select("id, parrocchia_id")
        .eq("id", userId)
        .maybeSingle();

    if (utenteError) {
        console.error("Errore nel recupero dell'utente:", utenteError);
        return NextResponse.json(
            { error: "Errore nel recupero dell'utente." },
            { status: 500 }
        );
    }

    if (!utente || !utente.parrocchia_id) {
        return NextResponse.json(
            { error: "Utente o parrocchia associata non trovati." },
            { status: 404 }
        );
    }

    const parrocchiaId = utente.parrocchia_id as string;

    // 2. Verifica che l'assegnazione esista e appartenga a una risorsa della parrocchia
    const { data: assegnazione, error: assegnazioneError } = await supabase
        .from("assegnazione_bene")
        .select(
            `
            id,
            risorsa:risorsa_id (
                id,
                parrocchia_id
            )
        `
        )
        .eq("id", id)
        .maybeSingle();

    if (assegnazioneError) {
        console.error("Errore nel recupero dell'assegnazione:", assegnazioneError);
        return NextResponse.json(
            { error: "Errore nel recupero dell'assegnazione." },
            { status: 500 }
        );
    }

    if (!assegnazione) {
        return NextResponse.json(
            { error: "Assegnazione non trovata." },
            { status: 404 }
        );
    }

    const risorsa = Array.isArray(assegnazione.risorsa) ? assegnazione.risorsa[0] : assegnazione.risorsa;
    
    if (!risorsa || risorsa.parrocchia_id !== parrocchiaId) {
        return NextResponse.json(
            { error: "Assegnazione non trovata o non appartiene alla tua parrocchia." },
            { status: 404 }
        );
    }

    // 3. Elimina l'assegnazione
    const { error: deleteError } = await supabase
        .from("assegnazione_bene")
        .delete()
        .eq("id", id);

    if (deleteError) {
        console.error("Errore nell'eliminazione dell'assegnazione:", deleteError);
        return NextResponse.json(
            { error: "Errore nell'eliminazione dell'assegnazione." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Assegnazione eliminata con successo." },
        { status: 200 }
    );
}

