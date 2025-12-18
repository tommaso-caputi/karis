import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type Ruolo = "amministratore" | "volontario" | "altro";

const normalizeRole = (raw: string | null | undefined): Ruolo => {
    const value = (raw ?? "").trim().toLowerCase();
    if (value.includes("amm")) return "amministratore";
    if (value.includes("volont")) return "volontario";
    return "altro";
};

async function getRequester(userId: string) {
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

    return {
        user: {
            id: (data as any).id as string,
            parrocchia_id: (data as any).parrocchia_id as string | null,
            ruolo: normalizeRole(descrizione),
        },
    };
}

async function getTipoUtenteIdByRole(role: Ruolo): Promise<string | null> {
    const desired =
        role === "amministratore"
            ? ["amministratore", "admin"]
            : role === "volontario"
              ? ["volontario"]
              : [];

    if (desired.length === 0) return null;

    // Tentativi case-insensitive
    for (const term of desired) {
        const { data } = await supabase
            .from("tipo_utente")
            .select("id")
            .ilike("descrizione", term)
            .maybeSingle();
        if (data?.id) return data.id as string;
    }

    // fallback: contains
    for (const term of desired) {
        const { data } = await supabase
            .from("tipo_utente")
            .select("id")
            .ilike("descrizione", `%${term}%`)
            .maybeSingle();
        if (data?.id) return data.id as string;
    }

    return null;
}

export async function GET(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "Parametro 'userId' mancante." }, { status: 400 });
    }

    const requester = await getRequester(userId);
    if ("error" in requester) {
        return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    }
    if ("notFound" in requester || !requester.user.parrocchia_id) {
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    }
    if (requester.user.ruolo !== "amministratore") {
        return NextResponse.json({ error: "Operazione consentita solo agli amministratori." }, { status: 403 });
    }

    const volontarioTipoId = await getTipoUtenteIdByRole("volontario");
    if (!volontarioTipoId) {
        return NextResponse.json(
            { error: "Tipo utente 'Volontario' non configurato in tabella tipo_utente." },
            { status: 500 }
        );
    }

    const { data, error } = await supabase
        .from("utente")
        .select("id, nome, cognome, cf, created_at")
        .eq("parrocchia_id", requester.user.parrocchia_id)
        .eq("tipo_utente_id", volontarioTipoId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: "Errore nel recupero dei volontari." }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });
    }

    let body: { userId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body della richiesta non valido." }, { status: 400 });
    }

    const { userId } = body;

    if (!userId) {
        return NextResponse.json({ error: "Parametro 'userId' mancante." }, { status: 400 });
    }

    const requester = await getRequester(userId);
    if ("error" in requester) {
        return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    }
    if ("notFound" in requester || !requester.user.parrocchia_id) {
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    }
    if (requester.user.ruolo !== "amministratore") {
        return NextResponse.json({ error: "Operazione consentita solo agli amministratori." }, { status: 403 });
    }

    return NextResponse.json(
        {
            error:
                "Creazione account volontario disabilitata (no service role). Crea l'utente in Supabase Auth e inserisci/aggiorna il record in tabella 'utente' con lo stesso UUID.",
        },
        { status: 501 }
    );
}

export async function PUT(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });
    }

    let body: { userId?: string; id?: string; nome?: string; cognome?: string; cf?: string | null };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body della richiesta non valido." }, { status: 400 });
    }

    const { userId, id, nome, cognome, cf } = body;

    if (!userId || !id || !nome || !cognome) {
        return NextResponse.json({ error: "Parametri mancanti: userId, id, nome, cognome." }, { status: 400 });
    }

    const requester = await getRequester(userId);
    if ("error" in requester) {
        return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    }
    if ("notFound" in requester || !requester.user.parrocchia_id) {
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    }
    if (requester.user.ruolo !== "amministratore") {
        return NextResponse.json({ error: "Operazione consentita solo agli amministratori." }, { status: 403 });
    }

    const volontarioTipoId = await getTipoUtenteIdByRole("volontario");
    if (!volontarioTipoId) {
        return NextResponse.json(
            { error: "Tipo utente 'Volontario' non configurato in tabella tipo_utente." },
            { status: 500 }
        );
    }

    const { data: updated, error } = await supabase
        .from("utente")
        .update({
            nome,
            cognome,
            cf: cf ?? null,
        })
        .eq("id", id)
        .eq("parrocchia_id", requester.user.parrocchia_id)
        .eq("tipo_utente_id", volontarioTipoId)
        .select("id, nome, cognome, cf, created_at")
        .maybeSingle();

    if (error || !updated) {
        return NextResponse.json({ error: "Errore nell'aggiornamento del volontario." }, { status: 500 });
    }

    return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (!userId || !id) {
        return NextResponse.json({ error: "Parametri mancanti: userId e id sono obbligatori." }, { status: 400 });
    }

    const requester = await getRequester(userId);
    if ("error" in requester) {
        return NextResponse.json({ error: "Errore nel recupero dell'utente." }, { status: 500 });
    }
    if ("notFound" in requester || !requester.user.parrocchia_id) {
        return NextResponse.json({ error: "Utente o parrocchia associata non trovati." }, { status: 404 });
    }
    if (requester.user.ruolo !== "amministratore") {
        return NextResponse.json({ error: "Operazione consentita solo agli amministratori." }, { status: 403 });
    }

    const volontarioTipoId = await getTipoUtenteIdByRole("volontario");
    if (!volontarioTipoId) {
        return NextResponse.json(
            { error: "Tipo utente 'Volontario' non configurato in tabella tipo_utente." },
            { status: 500 }
        );
    }

    // Nota: qui eliminiamo SOLO il record su tabella utente. L'utente Auth resta (puoi disabilitarlo/elimarlo via admin API).
    const { error } = await supabase
        .from("utente")
        .delete()
        .eq("id", id)
        .eq("parrocchia_id", requester.user.parrocchia_id)
        .eq("tipo_utente_id", volontarioTipoId);

    if (error) {
        return NextResponse.json({ error: "Errore nell'eliminazione del volontario." }, { status: 500 });
    }

    return NextResponse.json({ message: "Volontario eliminato." }, { status: 200 });
}


