import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserParrocchia, validateUserId, validateUserIdFromBody } from "@/lib/apiHelpers";

// GET endpoint per recuperare tutte le famiglie (per selezione)
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

    const all = searchParams.get("all"); // Parametro per recuperare tutte le famiglie

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // Se all=true, recupera tutte le famiglie (anche senza beneficiari)
    // ma includiamo comunque informazioni sui beneficiari per distinguerle meglio
    if (all === "true") {
        // Recupera tutte le famiglie senza filtrare per beneficiari
        // Questo include anche le famiglie senza beneficiari associati
        const { data: famiglie, error: famiglieError } = await supabase
            .from("famiglia")
            .select("id, cognome, note")
            .order("cognome", { ascending: true });

        if (famiglieError) {
            console.error("Errore nel recupero delle famiglie:", famiglieError);
            return NextResponse.json(
                { error: "Errore nel recupero delle famiglie." },
                { status: 500 }
            );
        }

        // Recupera i beneficiari per ogni famiglia per distinguerle meglio
        const famigliaIds = (famiglie ?? []).map((f: any) => f.id);
        
        let beneficiariPerFamiglia: Map<string, Array<{ nome: string; cognome: string }>> = new Map();
        let conteggioBeneficiariPerFamiglia: Map<string, number> = new Map();
        
        if (famigliaIds.length > 0) {
            // Recupera i primi 3 beneficiari per famiglia (per mostrare i nomi)
            const { data: beneficiari, error: beneficiariError } = await supabase
                .from("beneficiario")
                .select("nome, cognome, famiglia_id")
                .in("famiglia_id", famigliaIds)
                .neq("nome", "_FAMIGLIA_PLACEHOLDER_");

            if (!beneficiariError && beneficiari) {
                // Raggruppa per famiglia e prendi i primi 3
                const beneficiariPerFamigliaMap = new Map<string, Array<{ nome: string; cognome: string }>>();
                beneficiari.forEach((b: any) => {
                    if (b.famiglia_id) {
                        if (!beneficiariPerFamigliaMap.has(b.famiglia_id)) {
                            beneficiariPerFamigliaMap.set(b.famiglia_id, []);
                        }
                        const lista = beneficiariPerFamigliaMap.get(b.famiglia_id);
                        if (lista && lista.length < 3) {
                            lista.push({ nome: b.nome, cognome: b.cognome });
                        }
                        // Conta tutti i beneficiari
                        const count = conteggioBeneficiariPerFamiglia.get(b.famiglia_id) || 0;
                        conteggioBeneficiariPerFamiglia.set(b.famiglia_id, count + 1);
                    }
                });
                beneficiariPerFamiglia = beneficiariPerFamigliaMap;
            }
        }

        // Arricchisci le famiglie con informazioni sui beneficiari
        const famiglieArricchite = (famiglie ?? []).map((f: any) => {
            const beneficiari = beneficiariPerFamiglia.get(f.id) || [];
            const numBeneficiari = conteggioBeneficiariPerFamiglia.get(f.id) || 0;
            return {
                ...f,
                beneficiari: beneficiari,
                numBeneficiari: numBeneficiari,
            };
        });

        return NextResponse.json(famiglieArricchite);
    }

    // Comportamento originale: recupera famiglie con beneficiari raggruppati
    // Recupera tutte le famiglie (anche quelle senza beneficiari)
    const { data: famiglieData, error: famiglieError } = await supabase
        .from("famiglia")
        .select("id, cognome, note")
        .order("cognome", { ascending: true });

    if (famiglieError) {
        console.error("Errore nel recupero delle famiglie:", famiglieError);
        return NextResponse.json(
            { error: "Errore nel recupero delle famiglie." },
            { status: 500 }
        );
    }

    // Estrai gli ID di tutte le famiglie
    const famigliaIds = (famiglieData ?? []).map((f: any) => f.id);

    // Se non ci sono famiglie, restituisci array vuoto
    if (famigliaIds.length === 0) {
        return NextResponse.json([]);
    }

    // Recupera i beneficiari per ogni famiglia (escludendo i placeholder se esistono)
    const { data: beneficiari, error: beneficiariDettagliError } = await supabase
        .from("beneficiario")
        .select(
            `
            id,
            nome,
            cognome,
            cf,
            famiglia_id
        `
        )
        .eq("parrocchia_id", parrocchiaId)
        .in("famiglia_id", famigliaIds)
        .neq("nome", "_FAMIGLIA_PLACEHOLDER_"); // Escludi eventuali placeholder

    if (beneficiariDettagliError) {
        console.error("Errore nel recupero dei beneficiari:", beneficiariDettagliError);
        return NextResponse.json(
            { error: "Errore nel recupero dei beneficiari." },
            { status: 500 }
        );
    }

    // Raggruppa i beneficiari per famiglia
    const famiglieMap = new Map<string, {
        id: string;
        cognome: string;
        note: string | null;
        beneficiari: Array<{
            id: string;
            nome: string;
            cognome: string;
            cf: string | null;
        }>;
    }>();

    // Inizializza la mappa con tutte le famiglie (anche quelle senza beneficiari)
    (famiglieData ?? []).forEach((famiglia: any) => {
        famiglieMap.set(famiglia.id, {
            id: famiglia.id,
            cognome: famiglia.cognome,
            note: famiglia.note,
            beneficiari: [],
        });
    });

    // Aggiungi i beneficiari alle rispettive famiglie
    (beneficiari ?? []).forEach((b: any) => {
        if (!b.famiglia_id) return;
        const famigliaData = famiglieMap.get(b.famiglia_id);
        if (famigliaData) {
            famigliaData.beneficiari.push({
                id: b.id,
                nome: b.nome,
                cognome: b.cognome,
                cf: b.cf,
            });
        }
    });

    // Recupera tutte le famiglie che hanno beneficiari in qualsiasi parrocchia
    // per identificare quelle che non hanno beneficiari
    const { data: tutteFamiglieConBeneficiari, error: tutteFamiglieError } = await supabase
        .from("beneficiario")
        .select("famiglia_id")
        .not("famiglia_id", "is", null);

    const famiglieConBeneficiariGlobali = new Set(
        (tutteFamiglieConBeneficiari ?? []).map((b: any) => b.famiglia_id).filter(Boolean)
    );

    // Filtra le famiglie per includere solo quelle che:
    // 1. Hanno beneficiari nella parrocchia corrente, OPPURE
    // 2. Non hanno beneficiari in nessuna parrocchia (famiglie nuove senza beneficiari)
    const famiglieFiltrate = Array.from(famiglieMap.values()).filter((famiglia) => {
        const haBeneficiariNellaParrocchia = famiglia.beneficiari.length > 0;
        const nonHaBeneficiariGlobalmente = !famiglieConBeneficiariGlobali.has(famiglia.id);
        return haBeneficiariNellaParrocchia || nonHaBeneficiariGlobalmente;
    });

    // Ordina per cognome
    const famiglie = famiglieFiltrate.sort((a, b) =>
        a.cognome.localeCompare(b.cognome)
    );

    return NextResponse.json(famiglie);
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
        cognome?: string;
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

    const { userId, cognome, note } = body;

    if (!cognome) {
        return NextResponse.json(
            { error: "Il cognome è obbligatorio." },
            { status: 400 }
        );
    }

    // Se userId è fornito, recuperiamo la parrocchia per tracciare la famiglia
    let parrocchiaId: string | null = null;
    if (userId) {
        const { data: utente, error: utenteError } = await supabase
            .from("utente")
            .select("parrocchia_id")
            .eq("id", userId)
            .maybeSingle();

        if (!utenteError && utente) {
            parrocchiaId = utente.parrocchia_id as string | null;
        }
    }

    // Creazione della famiglia
    const { data: nuovaFamiglia, error: famigliaInsertError } = await supabase
        .from("famiglia")
        .insert({
            cognome,
            note: note || null,
        })
        .select("id, cognome, note")
        .maybeSingle();

    if (famigliaInsertError || !nuovaFamiglia) {
        console.error("Errore nella creazione della famiglia:", famigliaInsertError);
        return NextResponse.json(
            { error: "Errore nella creazione della famiglia." },
            { status: 500 }
        );
    }


    return NextResponse.json(
        {
            id: nuovaFamiglia.id,
            cognome: nuovaFamiglia.cognome,
            note: nuovaFamiglia.note,
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
    const userIdResult = validateUserId(searchParams);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const id = searchParams.get("id");
    if (!id) {
        return NextResponse.json(
            { error: "Parametro 'id' mancante." },
            { status: 400 }
        );
    }

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Verifica che la famiglia esista
    const { data: famigliaEsistente, error: famigliaSelectError } = await supabase
        .from("famiglia")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (famigliaSelectError) {
        console.error("Errore nel recupero della famiglia:", famigliaSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero della famiglia." },
            { status: 500 }
        );
    }

    if (!famigliaEsistente) {
        return NextResponse.json(
            { error: "Famiglia non trovata." },
            { status: 404 }
        );
    }

    // 3. Verifica se ci sono beneficiari associati alla famiglia nella parrocchia dell'utente
    const { data: beneficiari, error: beneficiariError } = await supabase
        .from("beneficiario")
        .select("id")
        .eq("famiglia_id", id)
        .eq("parrocchia_id", parrocchiaId)
        .limit(1);

    if (beneficiariError) {
        console.error("Errore nel controllo dei beneficiari:", beneficiariError);
        return NextResponse.json(
            { error: "Errore nel controllo delle dipendenze." },
            { status: 500 }
        );
    }

    if (beneficiari && beneficiari.length > 0) {
        return NextResponse.json(
            { error: "Impossibile eliminare la famiglia: ci sono beneficiari associati nella tua parrocchia." },
            { status: 409 }
        );
    }

    // 4. Verifica se ci sono beneficiari associati alla famiglia in altre parrocchie
    const { data: beneficiariAltreParrocchie, error: beneficiariAltreParrocchieError } = await supabase
        .from("beneficiario")
        .select("id")
        .eq("famiglia_id", id)
        .limit(1);

    if (beneficiariAltreParrocchieError) {
        console.error("Errore nel controllo dei beneficiari in altre parrocchie:", beneficiariAltreParrocchieError);
        return NextResponse.json(
            { error: "Errore nel controllo delle dipendenze." },
            { status: 500 }
        );
    }

    if (beneficiariAltreParrocchie && beneficiariAltreParrocchie.length > 0) {
        return NextResponse.json(
            { error: "Impossibile eliminare la famiglia: ci sono beneficiari associati in altre parrocchie." },
            { status: 409 }
        );
    }

    // 5. Eliminazione della famiglia
    const { error: famigliaDeleteError } = await supabase
        .from("famiglia")
        .delete()
        .eq("id", id);

    if (famigliaDeleteError) {
        console.error("Errore nell'eliminazione della famiglia:", famigliaDeleteError);
        return NextResponse.json(
            { error: "Errore nell'eliminazione della famiglia." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Famiglia eliminata con successo." },
        { status: 200 }
    );
}

export async function PUT(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    let body: {
        userId?: string;
        id?: string;
        cognome?: string;
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

    const { id, cognome, note } = body;

    if (!id || !cognome) {
        return NextResponse.json(
            { error: "Parametri mancanti: id e cognome sono obbligatori." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;

    // 2. Verifica che la famiglia esista
    const { data: famigliaEsistente, error: famigliaSelectError } = await supabase
        .from("famiglia")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (famigliaSelectError) {
        console.error("Errore nel recupero della famiglia:", famigliaSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero della famiglia." },
            { status: 500 }
        );
    }

    if (!famigliaEsistente) {
        return NextResponse.json(
            { error: "Famiglia non trovata." },
            { status: 404 }
        );
    }

    // 3. Aggiornamento della famiglia
    const { data: famigliaAggiornata, error: famigliaUpdateError } = await supabase
        .from("famiglia")
        .update({
            cognome,
            note: note || null,
        })
        .eq("id", id)
        .select("id, cognome, note")
        .maybeSingle();

    if (famigliaUpdateError || !famigliaAggiornata) {
        console.error("Errore nell'aggiornamento della famiglia:", famigliaUpdateError);
        return NextResponse.json(
            { error: "Errore nell'aggiornamento della famiglia." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            id: famigliaAggiornata.id,
            cognome: famigliaAggiornata.cognome,
            note: famigliaAggiornata.note,
        },
        { status: 200 }
    );
}

