import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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

    const { data, error } = await supabase
        .from("utente")
        .select(
            `
            nome,
            cognome,
            parrocchia:parrocchia (
                nome
            )
        `
        )
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error("Errore nel recupero dati utente:", error);
        return NextResponse.json(
            { error: "Errore nel recupero dei dati utente." },
            { status: 500 }
        );
    }

    if (!data) {
        return NextResponse.json(
            { error: "Utente non trovato." },
            { status: 404 }
        );
    }

    const { nome, cognome, parrocchia } = data as {
        nome: string;
        cognome: string;
        parrocchia?: { nome: string }[] | null;
    };

    return NextResponse.json({
        nome,
        cognome,
        parrocchia: Array.isArray(parrocchia) && parrocchia.length > 0 ? parrocchia[0].nome : null,
    });
}


