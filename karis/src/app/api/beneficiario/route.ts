import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserParrocchia, validateUserId, validateUserIdFromBody, normalizeSupabaseRelation } from "@/lib/apiHelpers";

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

    // 2. Recupero dei beneficiari legati alla parrocchia dell'utente
    const { data: beneficiari, error: beneficiariError } = await supabase
        .from("beneficiario")
        .select(
            `
            id,
            nome,
            cognome,
            cf,
            data_nascita,
            luogo_nascita,
            created_at,
            famiglia:famiglia_id (
                id,
                cognome
            )
        `
        )
        .eq("parrocchia_id", parrocchiaId)
        .order("cognome", { ascending: true })
        .order("nome", { ascending: true });

    if (beneficiariError) {
        console.error("Errore nel recupero dei beneficiari:", beneficiariError);
        return NextResponse.json(
            { error: "Errore nel recupero dei beneficiari." },
            { status: 500 }
        );
    }

    const beneficiariFormatted = (beneficiari ?? []).map((b: any) => {
        const famiglia = normalizeSupabaseRelation(b.famiglia);

        return {
            id: b.id,
            nome: b.nome,
            cognome: b.cognome,
            cf: b.cf,
            data_nascita: b.data_nascita,
            luogo_nascita: b.luogo_nascita,
            famiglia: famiglia?.cognome ?? null,
            famiglia_id: famiglia?.id ?? null,
            created_at: b.created_at,
        };
    });

    return NextResponse.json(beneficiariFormatted);
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
        nome?: string;
        cognome?: string;
        cf?: string | null;
        data_nascita?: string | null;
        luogo_nascita?: string | null;
        famiglia_id?: string | null;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { nome, cognome, cf, data_nascita, luogo_nascita, famiglia_id } = body;

    if (!nome || !cognome) {
        return NextResponse.json(
            { error: "Parametri mancanti: nome e cognome sono obbligatori." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Validazione famiglia_id se fornito
    if (famiglia_id) {
        const { data: famiglia, error: famigliaError } = await supabase
            .from("famiglia")
            .select("id")
            .eq("id", famiglia_id)
            .maybeSingle();

        if (famigliaError) {
            console.error("Errore nel recupero della famiglia:", famigliaError);
            return NextResponse.json(
                { error: "Errore nella validazione della famiglia." },
                { status: 500 }
            );
        }

        if (!famiglia) {
            return NextResponse.json(
                { error: "Famiglia non trovata." },
                { status: 404 }
            );
        }
    }

    // 3. Validazione CF se fornito (deve essere unico)
    if (cf) {
        const { data: beneficiarioEsistente, error: cfError } = await supabase
            .from("beneficiario")
            .select("id")
            .eq("cf", cf)
            .maybeSingle();

        if (cfError) {
            console.error("Errore nella validazione del codice fiscale:", cfError);
            return NextResponse.json(
                { error: "Errore nella validazione del codice fiscale." },
                { status: 500 }
            );
        }

        if (beneficiarioEsistente) {
            return NextResponse.json(
                { error: "Un beneficiario con questo codice fiscale esiste già." },
                { status: 409 }
            );
        }
    }

    // 4. Creazione del beneficiario
    const beneficiarioData: {
        nome: string;
        cognome: string;
        cf?: string | null;
        data_nascita?: string | null;
        luogo_nascita?: string | null;
        famiglia_id?: string | null;
        parrocchia_id: string;
    } = {
        nome,
        cognome,
        parrocchia_id: parrocchiaId,
    };

    if (cf) beneficiarioData.cf = cf;
    if (data_nascita) beneficiarioData.data_nascita = data_nascita;
    if (luogo_nascita) beneficiarioData.luogo_nascita = luogo_nascita;
    if (famiglia_id) beneficiarioData.famiglia_id = famiglia_id;

    const { data: nuovoBeneficiario, error: beneficiarioInsertError } = await supabase
        .from("beneficiario")
        .insert(beneficiarioData)
        .select("id, nome, cognome, cf, data_nascita, luogo_nascita, created_at")
        .maybeSingle();

    if (beneficiarioInsertError || !nuovoBeneficiario) {
        console.error("Errore nella creazione del beneficiario:", beneficiarioInsertError);
        return NextResponse.json(
            { error: "Errore nella creazione del beneficiario." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            id: nuovoBeneficiario.id,
            nome: nuovoBeneficiario.nome,
            cognome: nuovoBeneficiario.cognome,
            cf: nuovoBeneficiario.cf,
            data_nascita: nuovoBeneficiario.data_nascita,
            luogo_nascita: nuovoBeneficiario.luogo_nascita,
            created_at: nuovoBeneficiario.created_at,
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
        nome?: string;
        cognome?: string;
        cf?: string | null;
        data_nascita?: string | null;
        luogo_nascita?: string | null;
        famiglia_id?: string | null;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Body della richiesta non valido." },
            { status: 400 }
        );
    }

    const { id, nome, cognome, cf, data_nascita, luogo_nascita, famiglia_id } = body;

    if (!id || !nome || !cognome) {
        return NextResponse.json(
            { error: "Parametri mancanti: id, nome e cognome sono obbligatori." },
            { status: 400 }
        );
    }

    const userIdResult = validateUserIdFromBody(body);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // 2. Verifica che il beneficiario esista e appartenga alla stessa parrocchia
    const { data: beneficiarioEsistente, error: beneficiarioSelectError } = await supabase
        .from("beneficiario")
        .select("id, cf")
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();

    if (beneficiarioSelectError) {
        console.error("Errore nel recupero del beneficiario:", beneficiarioSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero del beneficiario." },
            { status: 500 }
        );
    }

    if (!beneficiarioEsistente) {
        return NextResponse.json(
            { error: "Beneficiario non trovato o non appartiene alla tua parrocchia." },
            { status: 404 }
        );
    }

    // 3. Validazione famiglia_id se fornito
    if (famiglia_id) {
        const { data: famiglia, error: famigliaError } = await supabase
            .from("famiglia")
            .select("id")
            .eq("id", famiglia_id)
            .maybeSingle();

        if (famigliaError) {
            console.error("Errore nel recupero della famiglia:", famigliaError);
            return NextResponse.json(
                { error: "Errore nella validazione della famiglia." },
                { status: 500 }
            );
        }

        if (!famiglia) {
            return NextResponse.json(
                { error: "Famiglia non trovata." },
                { status: 404 }
            );
        }
    }

    // 4. Validazione CF se fornito (deve essere unico, escludendo il beneficiario corrente)
    if (cf) {
        const { data: altroBeneficiario, error: cfError } = await supabase
            .from("beneficiario")
            .select("id")
            .eq("cf", cf)
            .neq("id", id)
            .maybeSingle();

        if (cfError) {
            console.error("Errore nella validazione del codice fiscale:", cfError);
            return NextResponse.json(
                { error: "Errore nella validazione del codice fiscale." },
                { status: 500 }
            );
        }

        if (altroBeneficiario) {
            return NextResponse.json(
                { error: "Un altro beneficiario con questo codice fiscale esiste già." },
                { status: 409 }
            );
        }
    }

    // 5. Aggiornamento del beneficiario
    const beneficiarioData: {
        nome: string;
        cognome: string;
        cf?: string | null;
        data_nascita?: string | null;
        luogo_nascita?: string | null;
        famiglia_id?: string | null;
    } = {
        nome,
        cognome,
    };

    if (cf !== undefined) beneficiarioData.cf = cf;
    if (data_nascita !== undefined) beneficiarioData.data_nascita = data_nascita;
    if (luogo_nascita !== undefined) beneficiarioData.luogo_nascita = luogo_nascita;
    if (famiglia_id !== undefined) beneficiarioData.famiglia_id = famiglia_id;

    const { data: beneficiarioAggiornato, error: beneficiarioUpdateError } = await supabase
        .from("beneficiario")
        .update(beneficiarioData)
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId)
        .select("id, nome, cognome, cf, data_nascita, luogo_nascita, created_at")
        .maybeSingle();

    if (beneficiarioUpdateError || !beneficiarioAggiornato) {
        console.error("Errore nell'aggiornamento del beneficiario:", beneficiarioUpdateError);
        return NextResponse.json(
            { error: "Errore nell'aggiornamento del beneficiario." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            id: beneficiarioAggiornato.id,
            nome: beneficiarioAggiornato.nome,
            cognome: beneficiarioAggiornato.cognome,
            cf: beneficiarioAggiornato.cf,
            data_nascita: beneficiarioAggiornato.data_nascita,
            luogo_nascita: beneficiarioAggiornato.luogo_nascita,
            created_at: beneficiarioAggiornato.created_at,
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

    // 2. Verifica che il beneficiario esista e appartenga alla stessa parrocchia
    const { data: beneficiarioEsistente, error: beneficiarioSelectError } = await supabase
        .from("beneficiario")
        .select("id")
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId)
        .maybeSingle();

    if (beneficiarioSelectError) {
        console.error("Errore nel recupero del beneficiario:", beneficiarioSelectError);
        return NextResponse.json(
            { error: "Errore nel recupero del beneficiario." },
            { status: 500 }
        );
    }

    if (!beneficiarioEsistente) {
        return NextResponse.json(
            { error: "Beneficiario non trovato o non appartiene alla tua parrocchia." },
            { status: 404 }
        );
    }

    // 3. Verifica se ci sono assegnazioni associate al beneficiario
    const { data: assegnazioni, error: assegnazioniError } = await supabase
        .from("assegnazione_bene")
        .select("id")
        .eq("beneficiario_id", id)
        .limit(1);

    if (assegnazioniError) {
        console.error("Errore nel controllo delle assegnazioni:", assegnazioniError);
        return NextResponse.json(
            { error: "Errore nel controllo delle dipendenze." },
            { status: 500 }
        );
    }

    if (assegnazioni && assegnazioni.length > 0) {
        return NextResponse.json(
            { error: "Impossibile eliminare il beneficiario: ci sono assegnazioni associate." },
            { status: 409 }
        );
    }

    // 4. Eliminazione del beneficiario
    const { error: beneficiarioDeleteError } = await supabase
        .from("beneficiario")
        .delete()
        .eq("id", id)
        .eq("parrocchia_id", parrocchiaId);

    if (beneficiarioDeleteError) {
        console.error("Errore nell'eliminazione del beneficiario:", beneficiarioDeleteError);
        return NextResponse.json(
            { error: "Errore nell'eliminazione del beneficiario." },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Beneficiario eliminato con successo." },
        { status: 200 }
    );
}

