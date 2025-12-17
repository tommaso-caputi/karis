import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface BeneApiResponse {
    id: string;
    name: string;
    category: string | null;
    quantity: number;
    unit: string;
    updated_at: string | null;
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
    const userId = searchParams.get("userId");

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
                unita_misura,
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

    const beni: BeneApiResponse[] = (inventario ?? [])
        .map((row: any) => {
            const risorsa = row.risorsa ?? {};
            const categoria = risorsa.categoria ?? null;

            return {
                id: risorsa.id ?? row.id,
                name: risorsa.nome ?? "Senza nome",
                category: categoria?.nome ?? null,
                quantity: typeof row.quantita === "number" ? row.quantita : 0,
                unit: risorsa.unita_misura ?? "pz",
                updated_at: row.updated_at ?? null,
                threshold: DEFAULT_THRESHOLD,
            } as BeneApiResponse;
        });

    return NextResponse.json(beni);
}


