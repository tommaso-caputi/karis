import { NextResponse } from "next/server";
import { supabase } from "./supabaseClient";

export interface UserParrocchia {
    id: string;
    parrocchia_id: string;
}

/**
 * Recupera l'utente e la sua parrocchia
 */
export async function getUserParrocchia(userId: string): Promise<
    | { success: true; data: UserParrocchia }
    | { success: false; error: NextResponse }
> {
    if (!supabase) {
        return {
            success: false,
            error: NextResponse.json(
                { error: "Supabase non è configurato sul server." },
                { status: 500 }
            ),
        };
    }

    const { data: utente, error: utenteError } = await supabase
        .from("utente")
        .select("id, parrocchia_id")
        .eq("id", userId)
        .maybeSingle();

    if (utenteError) {
        console.error("Errore nel recupero dell'utente:", utenteError);
        return {
            success: false,
            error: NextResponse.json(
                { error: "Errore nel recupero dell'utente." },
                { status: 500 }
            ),
        };
    }

    if (!utente || !utente.parrocchia_id) {
        return {
            success: false,
            error: NextResponse.json(
                { error: "Utente o parrocchia associata non trovati." },
                { status: 404 }
            ),
        };
    }

    return {
        success: true,
        data: {
            id: utente.id as string,
            parrocchia_id: utente.parrocchia_id as string,
        },
    };
}

/**
 * Valida che userId sia presente nei searchParams
 */
export function validateUserId(searchParams: URLSearchParams): string | NextResponse {
    const userId = searchParams.get("userId");
    if (!userId) {
        return NextResponse.json(
            { error: "Parametro 'userId' mancante." },
            { status: 400 }
        );
    }
    return userId;
}

/**
 * Valida che userId sia presente nel body
 */
export function validateUserIdFromBody(body: { userId?: string }): string | NextResponse {
    if (!body.userId) {
        return NextResponse.json(
            { error: "Parametro 'userId' mancante." },
            { status: 400 }
        );
    }
    return body.userId;
}

/**
 * Helper per gestire array o oggetto singolo da Supabase
 */
export function normalizeSupabaseRelation<T>(
    relation: T | T[] | null | undefined
): T | null {
    if (!relation) return null;
    if (Array.isArray(relation)) {
        return relation.length > 0 ? relation[0] : null;
    }
    return relation;
}

