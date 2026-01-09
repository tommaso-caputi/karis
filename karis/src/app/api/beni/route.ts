import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserParrocchia, validateUserId, validateUserIdFromBody } from "@/lib/apiHelpers";

interface BeneApiResponse {
    id: string;
    name: string;
    description?: string | null;
    category: string | null;
    quantity: number;
    unit: string;
    updated_at: string | null;
    scadenza?: string | null;
    /**
     * Soglia indicativa per considerare il bene "a scorta bassa".
     * Al momento è un valore fisso lato applicazione, in attesa di un campo dedicato in DB.
     */
    threshold: number;
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

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Recupero dei beni (inventario) legati alla parrocchia dell'utente
    const { data: inventario, error: inventarioError } = await supabase
        .from("inventario_parrocchia")
        .select(
            `
            id,
            updated_at,
            quantita,
            risorsa:risorsa (
                id,
                nome,
                descrizione,
                unita_misura,
                scadenza,
                categoria:categoria_risorsa (
                    nome
                )
            )
        `
        )
        .eq("parrocchia_id", parrocchiaId);

    if (inventarioError) {
        console.error("Errore nel recupero dei beni della parrocchia:", inventarioError);
        return NextResponse.json(
            { error: "Errore nel recupero dei beni della parrocchia." },
            { status: 500 }
        );
    }

    const DEFAULT_THRESHOLD = 10;

    // 3. Recupera le assegnazioni per calcolare le quantità disponibili
    const risorsaIds = (inventario ?? []).map((row: any) => row.risorsa?.id).filter(Boolean);
    
    let assegnazioniPerRisorsa: Map<string, number> = new Map();
    
    if (risorsaIds.length > 0) {
        const { data: assegnazioni, error: assegnazioniError } = await supabase
            .from("assegnazione_bene")
            .select("risorsa_id, quantita")
            .in("risorsa_id", risorsaIds);

        if (!assegnazioniError && assegnazioni) {
            assegnazioni.forEach((a: any) => {
                const current = assegnazioniPerRisorsa.get(a.risorsa_id) ?? 0;
                assegnazioniPerRisorsa.set(a.risorsa_id, current + (a.quantita ?? 0));
            });
        }
    }

    const beni: BeneApiResponse[] = (inventario ?? []).map((row: any) => {
        const risorsa = row.risorsa ?? {};
        const categoria = risorsa.categoria ?? null;
        const risorsaId = risorsa.id ?? row.id;
        const quantitaTotale = typeof row.quantita === "number" ? row.quantita : 0;
        const quantitaAssegnata = assegnazioniPerRisorsa.get(risorsaId) ?? 0;
        const quantitaDisponibile = Math.max(0, quantitaTotale - quantitaAssegnata);

        return {
            id: risorsaId,
            name: risorsa.nome ?? "Senza nome",
            description: risorsa.descrizione ?? null,
            category: categoria?.nome ?? null,
            quantity: quantitaDisponibile, // Mostra solo la quantità disponibile
            unit: risorsa.unita_misura ?? "pz",
            updated_at: row.updated_at ?? null,
            scadenza: risorsa.scadenza ?? null,
            threshold: DEFAULT_THRESHOLD,
        } as BeneApiResponse;
    });

    return NextResponse.json(beni);
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
        name?: string;
        category?: string;
        quantity?: number;
        unit?: string;
        description?: string | null;
        scadenza?: string | null;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { name, category, quantity, unit, description, scadenza } = body;

    if (!name || !category || typeof quantity !== "number" || Number.isNaN(quantity)) {
        return NextResponse.json(
            { error: "Parametri mancanti o non validi." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Recupero o creazione della categoria_risorsa
    const categoriaNome = category;

    let categoriaId: string | null = null;

    const { data: categoriaEsistente, error: categoriaSelectError } = await supabase
        .from("categoria_risorsa")
        .select("id, nome")
        .ilike("nome", categoriaNome)
        .maybeSingle();

    if (categoriaSelectError) {
        console.error("Errore nel recupero della categoria_risorsa:", categoriaSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero della categoria." },
            { status: 500 }
        );
    }

    if (categoriaEsistente) {
        categoriaId = categoriaEsistente.id as string;
    } else {
        const { data: nuovaCategoria, error: categoriaInsertError } = await supabase
            .from("categoria_risorsa")
            .insert({
                nome: categoriaNome,
            })
            .select("id")
            .maybeSingle();

        if (categoriaInsertError || !nuovaCategoria) {
            console.error("Errore nella creazione della categoria_risorsa:", categoriaInsertError);
            return NextResponse.json(
                { error: "Errore nella creazione della categoria." },
                { status: 500 }
            );
        }

        categoriaId = nuovaCategoria.id as string;
    }

    // 3. Creazione della risorsa
    const risorsaData: {
        nome: string;
        descrizione: string | null;
        unita_misura: string;
        categoria_id: string;
        parrocchia_id: string;
        scadenza?: string | null;
    } = {
        nome: name,
        descrizione: description ?? null,
        unita_misura: unit ?? "pz",
        categoria_id: categoriaId,
        parrocchia_id: parrocchiaId,
    };

    // Aggiungi scadenza solo se fornita
    if (scadenza) {
        risorsaData.scadenza = scadenza;
    }

    const { data: nuovaRisorsa, error: risorsaInsertError } = await supabase
        .from("risorsa")
        .insert(risorsaData)
        .select("id")
        .maybeSingle();

    if (risorsaInsertError || !nuovaRisorsa) {
        console.error("Errore nella creazione della risorsa:", risorsaInsertError);
        return NextResponse.json(
            { error: "Errore nella creazione della risorsa." },
            { status: 500 }
        );
    }

    const risorsaId = nuovaRisorsa.id as string;

    // 4. Creazione della riga in inventario_parrocchia
    const { data: nuovoInventario, error: inventarioInsertError } = await supabase
        .from("inventario_parrocchia")
        .insert({
            parrocchia_id: parrocchiaId,
            risorsa_id: risorsaId,
            quantita: quantity,
        })
        .select("id, quantita, updated_at")
        .maybeSingle();

    if (inventarioInsertError || !nuovoInventario) {
        console.error("Errore nella creazione dell'inventario_parrocchia:", inventarioInsertError);
        return NextResponse.json(
            { error: "Errore nella creazione dell'inventario." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            id: risorsaId,
            name,
            category: categoriaNome,
            quantity,
            unit: unit ?? "pz",
            updated_at: nuovoInventario.updated_at ?? null,
        },
        { status: 201 }
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
        name?: string;
        category?: string;
        quantity?: number;
        unit?: string;
        description?: string | null;
        scadenza?: string | null;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { id, name, category, quantity, unit, description, scadenza } = body;

    if (!id || !name || !category || typeof quantity !== "number" || Number.isNaN(quantity)) {
        return NextResponse.json(
            { error: "Parametri mancanti o non validi." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Recupero o creazione della categoria_risorsa
    const categoriaNome = category;

    let categoriaId: string | null = null;

    const { data: categoriaEsistente, error: categoriaSelectError } = await supabase
        .from("categoria_risorsa")
        .select("id, nome")
        .ilike("nome", categoriaNome)
        .maybeSingle();

    if (categoriaSelectError) {
        console.error("Errore nel recupero della categoria_risorsa (PUT):", categoriaSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero della categoria." },
            { status: 500 }
        );
    }

    if (categoriaEsistente) {
        categoriaId = categoriaEsistente.id as string;
    } else {
        const { data: nuovaCategoria, error: categoriaInsertError } = await supabase
            .from("categoria_risorsa")
            .insert({
                nome: categoriaNome,
            })
            .select("id")
            .maybeSingle();

        if (categoriaInsertError || !nuovaCategoria) {
            console.error("Errore nella creazione della categoria_risorsa (PUT):", categoriaInsertError);
            return NextResponse.json(
                { error: "Errore nella creazione della categoria." },
                { status: 500 }
            );
        }

        categoriaId = nuovaCategoria.id as string;
    }

    // 3. Aggiornamento della risorsa (verificando che appartenga alla stessa parrocchia)
    const risorsaUpdateData: {
        nome: string;
        descrizione: string | null;
        unita_misura: string;
        categoria_id: string;
        scadenza?: string | null;
    } = {
        nome: name,
        descrizione: description ?? null,
        unita_misura: unit ?? "pz",
        categoria_id: categoriaId,
    };

    // Aggiorna scadenza (può essere null per rimuoverla)
    if (scadenza !== undefined) {
        risorsaUpdateData.scadenza = scadenza || null;
    }

    const { error: risorsaUpdateError } = await supabase
        .from("risorsa")
        .update(risorsaUpdateData)
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId);

    if (risorsaUpdateError) {
        console.error("Errore nell'aggiornamento della risorsa:", risorsaUpdateError);
        return NextResponse.json(
            { error: "Errore nell'aggiornamento della risorsa." },
            { status: 500 }
        );
    }

    // 4. Aggiornamento della quantità in inventario_parrocchia
    const { error: inventarioUpdateError } = await supabase
        .from("inventario_parrocchia")
        .update({
            quantita: quantity,
        })
        .eq("risorsa_id", id)
        .eq("parrocchia_id", parrocchiaId);

    if (inventarioUpdateError) {
        console.error("Errore nell'aggiornamento dell'inventario_parrocchia:", inventarioUpdateError);
        return NextResponse.json(
            { error: "Errore nell'aggiornamento dell'inventario." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            id,
            name,
            category: categoriaNome,
            quantity,
            unit: unit ?? "pz",
        },
        { status: 200 }
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

    // 2. Verifica che la risorsa esista e appartenga alla stessa parrocchia
    const { data: risorsaEsistente, error: risorsaSelectError } = await supabase
        .from("risorsa")
        .select("id")
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();

    if (risorsaSelectError) {
        console.error("Errore nel recupero della risorsa:", risorsaSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero della risorsa." },
            { status: 500 }
        );
    }

    if (!risorsaEsistente) {
        return NextResponse.json(
            { error: "Bene non trovato o non appartiene alla tua parrocchia." },
            { status: 404 }
        );
    }

    // 3. Eliminazione dalla tabella inventario_parrocchia
    const { error: inventarioDeleteError } = await supabase
        .from("inventario_parrocchia")
        .delete()
        .eq("risorsa_id", id)
        .eq("parrocchia_id", parrocchiaId);

    if (inventarioDeleteError) {
        console.error("Errore nell'eliminazione dall'inventario:", inventarioDeleteError);
        return NextResponse.json(
            { error: "Errore nell'eliminazione dall'inventario." },
            { status: 500 }
        );
    }

    // 4. Eliminazione della risorsa
    const { error: risorsaDeleteError } = await supabase
        .from("risorsa")
        .delete()
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId);

    if (risorsaDeleteError) {
        console.error("Errore nell'eliminazione della risorsa:", risorsaDeleteError);
        return NextResponse.json(
            { error: "Errore nell'eliminazione del bene." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Bene eliminato con successo." },
        { status: 200 }
    );
}

