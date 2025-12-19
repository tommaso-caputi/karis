import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserParrocchia, validateUserIdFromBody } from "@/lib/apiHelpers";

interface AssegnazioneRequest {
    userId: string;
    risorsa_id: string;
    beneficiario_id?: string | null;
    famiglia_id?: string | null;
    quantita: number;
    note?: string | null;
}

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json(
            { error: "Supabase non è configurato sul server." },
            { status: 500 }
        );
    }

    let body: {
        assegnazioni?: AssegnazioneRequest[];
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { assegnazioni } = body;

    if (!assegnazioni || !Array.isArray(assegnazioni) || assegnazioni.length === 0) {
        return NextResponse.json(
            { error: "È necessario fornire un array di assegnazioni non vuoto." },
            { status: 400 }
        );
    }

    // Valida tutte le assegnazioni
    for (const assegnazione of assegnazioni) {
        const { userId, risorsa_id, beneficiario_id, famiglia_id, quantita } = assegnazione;

        if (!userId || !risorsa_id || typeof quantita !== "number" || quantita <= 0) {
            return NextResponse.json(
                { error: "Ogni assegnazione deve avere userId, risorsa_id e quantita valida." },
                { status: 400 }
            );
        }

        if (!beneficiario_id && !famiglia_id) {
            return NextResponse.json(
                { error: "Ogni assegnazione deve specificare beneficiario_id o famiglia_id." },
                { status: 400 }
            );
        }

        if (beneficiario_id && famiglia_id) {
            return NextResponse.json(
                { error: "Non è possibile assegnare contemporaneamente a beneficiario e famiglia." },
                { status: 400 }
            );
        }
    }

    // Verifica che tutte le assegnazioni abbiano lo stesso userId
    const userId = assegnazioni[0].userId;
    if (!assegnazioni.every(a => a.userId === userId)) {
        return NextResponse.json(
            { error: "Tutte le assegnazioni devono avere lo stesso userId." },
            { status: 400 }
        );
    }

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Verifica che tutte le risorse esistano e appartengano alla parrocchia
    const risorsaIds = [...new Set(assegnazioni.map(a => a.risorsa_id))];
    const { data: risorse, error: risorseError } = await supabase
        .from("risorsa")
        .select("id, parrocchia_id")
        .in("id", risorsaIds)
        .eq("parrocchia_id", parrocchiaId);

    if (risorseError) {
        console.error("Errore nel recupero delle risorse:", risorseError);
        return NextResponse.json(
            { error: "Errore nel recupero delle risorse." },
            { status: 500 }
        );
    }

    if (!risorse || risorse.length !== risorsaIds.length) {
        return NextResponse.json(
            { error: "Una o più risorse non trovate o non appartengono alla tua parrocchia." },
            { status: 404 }
        );
    }

    // 3. Verifica beneficiari e famiglie
    const beneficiarioIds = assegnazioni
        .map(a => a.beneficiario_id)
        .filter((id): id is string => id !== null && id !== undefined);
    
    if (beneficiarioIds.length > 0) {
        const beneficiarioIdsUnici = [...new Set(beneficiarioIds)];
        const { data: beneficiari, error: beneficiariError } = await supabase
            .from("beneficiario")
            .select("id, parrocchia_id")
            .in("id", beneficiarioIdsUnici)
            .eq("parrocchia_id", parrocchiaId);

        if (beneficiariError) {
            console.error("Errore nel recupero dei beneficiari:", beneficiariError);
            return NextResponse.json(
                { error: "Errore nel recupero dei beneficiari." },
                { status: 500 }
            );
        }

        if (!beneficiari || beneficiari.length !== beneficiarioIdsUnici.length) {
            return NextResponse.json(
                { error: "Uno o più beneficiari non trovati o non appartengono alla tua parrocchia." },
                { status: 404 }
            );
        }
    }

    const famigliaIds = assegnazioni
        .map(a => a.famiglia_id)
        .filter((id): id is string => id !== null && id !== undefined);
    
    if (famigliaIds.length > 0) {
        const famigliaIdsUnici = [...new Set(famigliaIds)];
        const { data: famiglie, error: famiglieError } = await supabase
            .from("famiglia")
            .select("id")
            .in("id", famigliaIdsUnici);

        if (famiglieError) {
            console.error("Errore nel recupero delle famiglie:", famiglieError);
            return NextResponse.json(
                { error: "Errore nel recupero delle famiglie." },
                { status: 500 }
            );
        }

        if (!famiglie || famiglie.length !== famigliaIdsUnici.length) {
            return NextResponse.json(
                { error: "Una o più famiglie non trovate." },
                { status: 404 }
            );
        }
    }

    // 4. Verifica disponibilità per ogni risorsa
    const { data: inventario, error: inventarioError } = await supabase
        .from("inventario_parrocchia")
        .select("risorsa_id, quantita")
        .in("risorsa_id", risorsaIds)
        .eq("parrocchia_id", parrocchiaId);

    if (inventarioError) {
        console.error("Errore nel recupero dell'inventario:", inventarioError);
        return NextResponse.json(
            { error: "Errore nel recupero dell'inventario." },
            { status: 500 }
        );
    }

    const inventarioMap = new Map(
        (inventario ?? []).map((inv: any) => [inv.risorsa_id, inv.quantita ?? 0])
    );

    // Recupera le assegnazioni esistenti per calcolare le quantità disponibili
    const { data: assegnazioniEsistenti, error: assegnazioniError } = await supabase
        .from("assegnazione_bene")
        .select("risorsa_id, quantita")
        .in("risorsa_id", risorsaIds);

    if (assegnazioniError) {
        console.error("Errore nel recupero delle assegnazioni esistenti:", assegnazioniError);
        return NextResponse.json(
            { error: "Errore nel controllo delle assegnazioni esistenti." },
            { status: 500 }
        );
    }

    const assegnazioniPerRisorsa = new Map<string, number>();
    (assegnazioniEsistenti ?? []).forEach((a: any) => {
        const current = assegnazioniPerRisorsa.get(a.risorsa_id) ?? 0;
        assegnazioniPerRisorsa.set(a.risorsa_id, current + (a.quantita ?? 0));
    });

    // Calcola le quantità richieste per risorsa
    const quantitaRichiestePerRisorsa = new Map<string, number>();
    assegnazioni.forEach(a => {
        const current = quantitaRichiestePerRisorsa.get(a.risorsa_id) ?? 0;
        quantitaRichiestePerRisorsa.set(a.risorsa_id, current + a.quantita);
    });

    // Verifica disponibilità per ogni risorsa
    for (const [risorsaId, quantitaRichiesta] of quantitaRichiestePerRisorsa) {
        const quantitaTotale = inventarioMap.get(risorsaId) ?? 0;
        const quantitaAssegnata = assegnazioniPerRisorsa.get(risorsaId) ?? 0;
        const quantitaDisponibile = quantitaTotale - quantitaAssegnata;

        if (quantitaRichiesta > quantitaDisponibile) {
            return NextResponse.json(
                {
                    error: `Quantità insufficiente per la risorsa ${risorsaId}. Disponibile: ${quantitaDisponibile}, richiesta: ${quantitaRichiesta}.`,
                },
                { status: 400 }
            );
        }
    }

    // 5. Crea tutte le assegnazioni in una transazione
    const assegnazioniDaInserire = assegnazioni.map(a => {
        const assegnazioneData: {
            risorsa_id: string;
            beneficiario_id?: string | null;
            famiglia_id?: string | null;
            quantita: number;
            note?: string | null;
        } = {
            risorsa_id: a.risorsa_id,
            quantita: a.quantita,
        };

        if (a.beneficiario_id) {
            assegnazioneData.beneficiario_id = a.beneficiario_id;
            assegnazioneData.famiglia_id = null;
        } else if (a.famiglia_id) {
            assegnazioneData.famiglia_id = a.famiglia_id;
            assegnazioneData.beneficiario_id = null;
        }

        if (a.note) {
            assegnazioneData.note = a.note;
        }

        return assegnazioneData;
    });

    const { data: nuoveAssegnazioni, error: assegnazioneInsertError } = await supabase
        .from("assegnazione_bene")
        .insert(assegnazioniDaInserire)
        .select("id, risorsa_id, beneficiario_id, famiglia_id, quantita, data_assegnazione, note");

    if (assegnazioneInsertError || !nuoveAssegnazioni) {
        console.error("Errore nella creazione delle assegnazioni:", assegnazioneInsertError);
        return NextResponse.json(
            { error: "Errore nella creazione delle assegnazioni." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            message: `Pacco creato con successo. ${nuoveAssegnazioni.length} beni assegnati.`,
            assegnazioni: nuoveAssegnazioni,
        },
        { status: 201 }
    );
}

