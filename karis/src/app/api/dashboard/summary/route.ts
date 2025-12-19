import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getUserParrocchia, validateUserId } from "@/lib/apiHelpers";

export async function GET(request: Request) {
    if (!supabase) {
        return NextResponse.json({ error: "Supabase non è configurato sul server." }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userIdResult = validateUserId(searchParams);
    if (userIdResult instanceof NextResponse) return userIdResult;
    const userId = userIdResult;

    const daysParam = searchParams.get("days");
    const days = Math.max(1, Math.min(90, Number(daysParam ?? "7") || 7));

    const userResult = await getUserParrocchia(userId);
    if (!userResult.success) return userResult.error;
    const parrocchiaId = userResult.data.parrocchia_id;

    // Recupera risorse della parrocchia (per filtrare assegnazioni)
    const { data: risorseParrocchia, error: risorseError } = await supabase
        .from("risorsa")
        .select("id")
        .eq("parrocchia_id", parrocchiaId);

    if (risorseError) {
        return NextResponse.json({ error: "Errore nel recupero delle risorse." }, { status: 500 });
    }

    const risorsaIds = (risorseParrocchia ?? []).map((r: any) => r.id).filter(Boolean);
    if (risorsaIds.length === 0) {
        return NextResponse.json(
            {
                days,
                assegnazioni_count: 0,
                quantita_assegnata: 0,
            },
            { status: 200 }
        );
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: assegnazioni, error: assegnazioniError } = await supabase
        .from("assegnazione_bene")
        .select("id, quantita, data_assegnazione")
        .in("risorsa_id", risorsaIds)
        .gte("data_assegnazione", since.toISOString());

    if (assegnazioniError) {
        return NextResponse.json({ error: "Errore nel recupero delle assegnazioni." }, { status: 500 });
    }

    const assegnazioniCount = (assegnazioni ?? []).length;
    const quantitaAssegnata = (assegnazioni ?? []).reduce((sum: number, a: any) => sum + (a.quantita ?? 0), 0);

    return NextResponse.json(
        {
            days,
            assegnazioni_count: assegnazioniCount,
            quantita_assegnata: quantitaAssegnata,
        },
        { status: 200 }
    );
}


