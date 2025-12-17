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

    // 1. Recupero dell'utente per ottenere la parrocchia di appartenenza
    const { data: utente, error: utenteError } = await supabase
        .from("utente")
        .select("id, parrocchia_id")
        .eq("id", userId)
        .maybeSingle();

    if (utenteError) {
        console.error("Errore nel recupero dell'utente (GET /api/beneficiario):", utenteError);
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
        const famiglia = b.famiglia;
        let famigliaCognome: string | null = null;
        let famigliaId: string | null = null;
        if (famiglia) {
            if (Array.isArray(famiglia) && famiglia.length > 0) {
                famigliaCognome = famiglia[0].cognome;
                famigliaId = famiglia[0].id;
            } else if (!Array.isArray(famiglia) && famiglia.cognome) {
                famigliaCognome = famiglia.cognome;
                famigliaId = famiglia.id;
            }
        }

        return {
            id: b.id,
            nome: b.nome,
            cognome: b.cognome,
            cf: b.cf,
            data_nascita: b.data_nascita,
            luogo_nascita: b.luogo_nascita,
            famiglia: famigliaCognome,
            famiglia_id: famigliaId,
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

    const { userId, nome, cognome, cf, data_nascita, luogo_nascita, famiglia_id } = body;

    if (!userId || !nome || !cognome) {
        return NextResponse.json(
            { error: "Parametri mancanti: userId, nome e cognome sono obbligatori." },
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
        console.error("Errore nel recupero dell'utente (POST /api/beneficiario):", utenteError);
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

    const { userId, id, nome, cognome, cf, data_nascita, luogo_nascita, famiglia_id } = body;

    if (!userId || !id || !nome || !cognome) {
        return NextResponse.json(
            { error: "Parametri mancanti: userId, id, nome e cognome sono obbligatori." },
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
        console.error("Errore nel recupero dell'utente (PUT /api/beneficiario):", utenteError);
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
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    if (!userId || !id) {
        return NextResponse.json(
            { error: "Parametri mancanti: userId e id sono obbligatori." },
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
        console.error("Errore nel recupero dell'utente (DELETE /api/beneficiario):", utenteError);
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

    // 3. Verifica se ci sono richieste associate al beneficiario
    const { data: richieste, error: richiesteError } = await supabase
        .from("richiesta")
        .select("id")
        .eq("beneficiario_id", id)
        .limit(1);

    if (richiesteError) {
        console.error("Errore nel controllo delle richieste:", richiesteError);
        return NextResponse.json(
            { error: "Errore nel controllo delle dipendenze." },
            { status: 500 }
        );
    }

    if (richieste && richieste.length > 0) {
        return NextResponse.json(
            { error: "Impossibile eliminare il beneficiario: ci sono richieste associate." },
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

