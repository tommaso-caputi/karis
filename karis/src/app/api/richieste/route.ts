import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserParrocchia, validateUserId, validateUserIdFromBody, normalizeSupabaseRelation } from "@/lib/apiHelpers";

interface RichiestaParrocchiaResponse {
    id: string;
    parrocchia_richiedente: {
        id: string;
        nome: string;
        citta: string | null;
    };
    descrizione_bene: string;
    unita_misura: string;
    quantita: number;
    messaggio: string | null;
    stato: "pending" | "accepted" | "rejected";
    parrocchia_accettante: {
        id: string;
        nome: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export async function GET(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const userIdResult = validateUserId(searchParams);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const view = searchParams.get("view"); // "bacheca" | "inviate" | "ricevute"

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Costruisci la query in base alla vista richiesta
    let query = supabase
        .from("richiesta_parrocchia")
        .select(
            `
            id,
            descrizione_bene,
            quantita,
            unita_misura,
            messaggio,
            stato,
            created_at,
            updated_at,
            parrocchia_richiedente:parrocchia_richiedente_id (
                id,
                nome,
                citta
            ),
            parrocchia_accettante:parrocchia_accettante_id (
                id,
                nome
            )
        `
        )
        .order("created_at", { ascending: false });

    // Filtra in base alla vista
    if (view === "inviate") {
        // Richieste inviate: solo quelle della parrocchia dell'utente
        query = query.eq("parrocchia_richiedente_id", parrocchiaId);
    } else if (view === "ricevute") {
        // Richieste ricevute: quelle inviate da altre parrocchie (non dalla propria)
        // Mostra tutte le richieste dove la parrocchia richiedente è diversa dalla parrocchia dell'utente
        query = query.neq("parrocchia_richiedente_id", parrocchiaId);
    } else {
        // Default: mostra tutte le richieste pending (per compatibilità)
        query = query.eq("stato", "pending");
    }

    const { data: richieste, error: richiesteError } = await query;

    if (richiesteError) {
        console.error("Errore nel recupero delle richieste:", richiesteError);
        return NextResponse.json(
            { error: "Errore nel recupero delle richieste." },
            { status: 500 }
        );
    }

    // 3. Formatta la risposta
    const richiesteFormatted: RichiestaParrocchiaResponse[] = (richieste ?? []).map((r: any) => {
        const parrocchiaRichiedente = normalizeSupabaseRelation(r.parrocchia_richiedente);
        const parrocchiaAccettante = normalizeSupabaseRelation(r.parrocchia_accettante);

        return {
            id: r.id,
            parrocchia_richiedente: {
                id: parrocchiaRichiedente?.id ?? "",
                nome: parrocchiaRichiedente?.nome ?? "",
                citta: parrocchiaRichiedente?.citta ?? null,
            },
            descrizione_bene: r.descrizione_bene ?? "",
            unita_misura: r.unita_misura ?? "pz",
            quantita: r.quantita ?? 0,
            messaggio: r.messaggio ?? null,
            stato: (r.stato ?? "pending") as "pending" | "accepted" | "rejected",
            parrocchia_accettante: parrocchiaAccettante
                ? {
                      id: parrocchiaAccettante.id,
                      nome: parrocchiaAccettante.nome,
                  }
                : null,
            created_at: r.created_at ?? new Date().toISOString(),
            updated_at: r.updated_at ?? new Date().toISOString(),
        };
    });

    return NextResponse.json(richiesteFormatted);
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
        descrizione_bene?: string;
        quantita?: number;
        unita_misura?: string;
        messaggio?: string | null;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { descrizione_bene, quantita, unita_misura, messaggio } = body;

    if (!descrizione_bene || !descrizione_bene.trim() || typeof quantita !== "number" || quantita <= 0) {
        return NextResponse.json(
            { error: "Parametri mancanti o non validi: descrizione_bene e quantita sono obbligatori." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Crea la richiesta
    const { data: nuovaRichiesta, error: richiestaError } = await supabase
        .from("richiesta_parrocchia")
        .insert({
            parrocchia_richiedente_id: parrocchiaId,
            descrizione_bene: descrizione_bene.trim(),
            quantita: quantita,
            unita_misura: unita_misura ?? "pz",
            messaggio: messaggio ?? null,
            stato: "pending",
        })
        .select(
            `
            id,
            descrizione_bene,
            quantita,
            unita_misura,
            messaggio,
            stato,
            created_at,
            updated_at,
            parrocchia_richiedente:parrocchia_richiedente_id (
                id,
                nome,
                citta
            )
        `
        )
        .maybeSingle();

    if (richiestaError || !nuovaRichiesta) {
        console.error("Errore nella creazione della richiesta:", richiestaError);
        return NextResponse.json(
            { error: "Errore nella creazione della richiesta." },
            { status: 500 }
        );
    }

    // 3. Formatta la risposta
    const parrocchiaRichiedente = normalizeSupabaseRelation(nuovaRichiesta.parrocchia_richiedente);

    const richiestaFormatted: RichiestaParrocchiaResponse = {
        id: nuovaRichiesta.id,
        parrocchia_richiedente: {
            id: parrocchiaRichiedente?.id ?? "",
            nome: parrocchiaRichiedente?.nome ?? "",
            citta: parrocchiaRichiedente?.citta ?? null,
        },
        descrizione_bene: nuovaRichiesta.descrizione_bene ?? "",
        unita_misura: nuovaRichiesta.unita_misura ?? "pz",
        quantita: nuovaRichiesta.quantita ?? 0,
        messaggio: nuovaRichiesta.messaggio ?? null,
        stato: (nuovaRichiesta.stato ?? "pending") as "pending" | "accepted" | "rejected",
        parrocchia_accettante: null,
        created_at: nuovaRichiesta.created_at ?? new Date().toISOString(),
        updated_at: nuovaRichiesta.updated_at ?? new Date().toISOString(),
    };

    return NextResponse.json(richiestaFormatted, { status: 201 });
}

export async function PATCH(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    let body: {
        userId?: string;
        richiesta_id?: string;
        azione?: "accept";
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { richiesta_id, azione } = body;

    if (!richiesta_id || !azione) {
        return NextResponse.json(
            { error: "Parametri mancanti: richiesta_id e azione sono obbligatori." },
            { status: 400 }
        );
    }

    if (azione !== "accept") {
        return NextResponse.json(
            { error: "Azione non valida. Deve essere 'accept'." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Verifica che la richiesta esista e sia pending
    const { data: richiesta, error: richiestaError } = await supabase
        .from("richiesta_parrocchia")
        .select("id, parrocchia_richiedente_id, stato")
        .eq("id", richiesta_id)
        .maybeSingle();

    if (richiestaError) {
        console.error("Errore nel recupero della richiesta:", richiestaError);
        return NextResponse.json(
            { error: "Errore nel recupero della richiesta." },
            { status: 500 }
        );
    }

    if (!richiesta) {
        return NextResponse.json(
            { error: "Richiesta non trovata." },
            { status: 404 }
        );
    }

    if (richiesta.stato !== "pending") {
        return NextResponse.json(
            { error: "La richiesta non è più in attesa." },
            { status: 400 }
        );
    }

    // 3. Verifica che la parrocchia non stia accettando la propria richiesta
    if (richiesta.parrocchia_richiedente_id === parrocchiaId) {
        return NextResponse.json(
            { error: "Non puoi accettare o rifiutare una richiesta della tua stessa parrocchia." },
            { status: 400 }
        );
    }

    // 4. Aggiorna la richiesta
    const updateData: any = {
        stato: "accepted",
        updated_at: new Date().toISOString(),
        parrocchia_accettante_id: parrocchiaId,
    };

    const { data: richiestaAggiornata, error: updateError } = await supabase
        .from("richiesta_parrocchia")
        .update(updateData)
        .eq("id", richiesta_id)
        .select(
            `
            id,
            descrizione_bene,
            quantita,
            unita_misura,
            messaggio,
            stato,
            created_at,
            updated_at,
            parrocchia_richiedente:parrocchia_richiedente_id (
                id,
                nome,
                citta
            ),
            parrocchia_accettante:parrocchia_accettante_id (
                id,
                nome
            )
        `
        )
        .maybeSingle();

    if (updateError || !richiestaAggiornata) {
        console.error("Errore nell'aggiornamento della richiesta:", updateError);
        return NextResponse.json(
            { error: "Errore nell'aggiornamento della richiesta." },
            { status: 500 }
        );
    }

    // 5. Formatta la risposta
    const parrocchiaRichiedente = normalizeSupabaseRelation(richiestaAggiornata.parrocchia_richiedente);
    const parrocchiaAccettante = normalizeSupabaseRelation(richiestaAggiornata.parrocchia_accettante);

    const richiestaFormatted: RichiestaParrocchiaResponse = {
        id: richiestaAggiornata.id,
        parrocchia_richiedente: {
            id: parrocchiaRichiedente?.id ?? "",
            nome: parrocchiaRichiedente?.nome ?? "",
            citta: parrocchiaRichiedente?.citta ?? null,
        },
        descrizione_bene: richiestaAggiornata.descrizione_bene ?? "",
        unita_misura: richiestaAggiornata.unita_misura ?? "pz",
        quantita: richiestaAggiornata.quantita ?? 0,
        messaggio: richiestaAggiornata.messaggio ?? null,
        stato: (richiestaAggiornata.stato ?? "pending") as "pending" | "accepted" | "rejected",
        parrocchia_accettante: parrocchiaAccettante
            ? {
                  id: parrocchiaAccettante.id,
                  nome: parrocchiaAccettante.nome,
              }
            : null,
        created_at: richiestaAggiornata.created_at ?? new Date().toISOString(),
        updated_at: richiestaAggiornata.updated_at ?? new Date().toISOString(),
    };

    return NextResponse.json(richiestaFormatted);
}

