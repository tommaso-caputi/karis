import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const normalizeRole = (raw: string | null | undefined) => (raw ?? "").trim().toLowerCase();

async function getRequester(userId: string) {
    if (!supabase) return { error: new Error("Supabase non è configurato sul server.") };
    const { data, error } = await supabase
        .from("utente")
        .select(
            `
            id,
            parrocchia_id,
            tipo_utente:tipo_utente_id (
                descrizione
            )
        `
        )
        .eq("id", userId)
        .maybeSingle();

    if (error) return { error };
    if (!data) return { notFound: true as const };

    const tipo = (data as any).tipo_utente;
    let descrizione: string | null = null;
    if (tipo) {
        if (Array.isArray(tipo) && tipo.length > 0) descrizione = tipo[0]?.descrizione ?? null;
        else if (!Array.isArray(tipo)) descrizione = tipo.descrizione ?? null;
    }

    const ruolo = normalizeRole(descrizione);

    return {
        user: {
            id: (data as any).id as string,
            parrocchia_id: (data as any).parrocchia_id as string | null,
            isAdmin: ruolo.includes("amm"),
        },
    };
}

function randomToken(length = 24) {
    // URL-safe-ish token
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}

export async function GET(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Parametro 'userId' mancante." }, { status: 400 });

    const requester = await getRequester(userId);
    if ("error" in requester) return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    if ("notFound" in requester || !requester.user.parrocchia_id)
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    if (!requester.user.isAdmin) return NextResponse.json({ error: "Solo amministratori." }, { status: 403 });

    const { data, error } = await supabase
        .from("invito")
        .select("id, token, ruolo, created_at, expires_at, accepted_at, revoked_at")
        .eq("parrocchia_id", requester.user.parrocchia_id)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: "Errore nel recupero inviti." }, { status: 500 });
    return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });

    let body: { userId?: string; daysValid?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body della richiesta non valido." }, { status: 400 });
    }

    const userId = body.userId;
    const daysValid = Math.max(1, Math.min(30, Number(body.daysValid ?? 7) || 7));

    if (!userId) return NextResponse.json({ error: "Parametro 'userId' mancante." }, { status: 400 });

    const requester = await getRequester(userId);
    if ("error" in requester) return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    if ("notFound" in requester || !requester.user.parrocchia_id)
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    if (!requester.user.isAdmin) return NextResponse.json({ error: "Solo amministratori." }, { status: 403 });

    // Prova a inserire con retry in caso di collisione token (improbabile)
    for (let attempt = 0; attempt < 5; attempt++) {
        const token = randomToken(28);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysValid);

        const { data, error } = await supabase
            .from("invito")
            .insert({
                token,
                parrocchia_id: requester.user.parrocchia_id,
                ruolo: "volontario",
                created_by: requester.user.id,
                expires_at: expiresAt.toISOString(),
            })
            .select("id, token, ruolo, created_at, expires_at")
            .maybeSingle();

        if (!error && data) return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: "Impossibile creare invito." }, { status: 500 });
}

export async function DELETE(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");
    if (!userId || !id) return NextResponse.json({ error: "Parametri mancanti: userId e id." }, { status: 400 });

    const requester = await getRequester(userId);
    if ("error" in requester) return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    if ("notFound" in requester || !requester.user.parrocchia_id)
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    if (!requester.user.isAdmin) return NextResponse.json({ error: "Solo amministratori." }, { status: 403 });

    const { error } = await supabase
        .from("invito")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id)
        .eq("parrocchia_id", requester.user.parrocchia_id);

    if (error) return NextResponse.json({ error: "Errore revoca invito." }, { status: 500 });
    return NextResponse.json({ message: "Invito revocato." }, { status: 200 });
}


