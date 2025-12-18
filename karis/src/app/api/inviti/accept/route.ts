import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

async function getTipoUtenteIdVolontario(): Promise<string | null> {
    if (!supabase) return null;
    // match robusto
    const direct = await supabase
        .from("tipo_utente")
        .select("id")
        .ilike("descrizione", "%volont%")
        .maybeSingle();
    if (direct.data?.id) return direct.data.id as string;
    return null;
}

export async function POST(request: Request) {
    if (!supabase) return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });

    let body: { token?: string; userId?: string; nome?: string; cognome?: string; cf?: string | null };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body della richiesta non valido." }, { status: 400 });
    }

    const token = (body.token ?? "").trim();
    const userId = (body.userId ?? "").trim();

    if (!token || !userId || !body.nome || !body.cognome) {
        return NextResponse.json(
            { error: "Parametri mancanti: token, userId, nome, cognome." },
            { status: 400 }
        );
    }

    // 1) carica invito valido
    const nowIso = new Date().toISOString();
    const { data: invito, error: invitoError } = await supabase
        .from("invito")
        .select("id, parrocchia_id, ruolo, expires_at, accepted_at, revoked_at")
        .eq("token", token)
        .maybeSingle();

    if (invitoError || !invito) return NextResponse.json({ error: "Invito non valido." }, { status: 404 });
    if (invito.revoked_at) return NextResponse.json({ error: "Invito revocato." }, { status: 410 });
    if (invito.accepted_at) return NextResponse.json({ error: "Invito già usato." }, { status: 409 });
    if (invito.expires_at && invito.expires_at < nowIso) return NextResponse.json({ error: "Invito scaduto." }, { status: 410 });

    // 2) trova tipo_utente volontario
    const tipoVolontarioId = await getTipoUtenteIdVolontario();
    if (!tipoVolontarioId) {
        return NextResponse.json({ error: "Tipo utente 'Volontario' non configurato." }, { status: 500 });
    }

    // 3) crea record utente collegato all'auth user id
    const { data: created, error: insertError } = await supabase
        .from("utente")
        .insert({
            id: userId,
            nome: body.nome,
            cognome: body.cognome,
            cf: body.cf ?? null,
            parrocchia_id: invito.parrocchia_id,
            tipo_utente_id: tipoVolontarioId,
        })
        .select("id")
        .maybeSingle();

    if (insertError) {
        return NextResponse.json({ error: "Errore creazione record utente (DB)." }, { status: 500 });
    }

    // 4) marca invito come accettato
    await supabase
        .from("invito")
        .update({ accepted_at: new Date().toISOString(), accepted_by: userId })
        .eq("token", token);

    return NextResponse.json({ message: "Invito accettato.", userId: created?.id }, { status: 200 });
}


