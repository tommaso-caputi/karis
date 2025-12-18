"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Volontario = {
    id: string;
    nome: string;
    cognome: string;
    cf: string | null;
    created_at: string | null;
};

type CurrentUser = {
    id: string;
    nome: string;
    cognome: string;
    parrocchia: string | null;
    ruolo: string | null;
};

type Invito = {
    id: string;
    token: string;
    ruolo: string;
    created_at: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
};

export default function VolontariPage() {
    const [me, setMe] = useState<CurrentUser | null>(null);
    const [loadingMe, setLoadingMe] = useState(true);

    const [volontari, setVolontari] = useState<Volontario[]>([]);
    const [loading, setLoading] = useState(true);

    const [inviti, setInviti] = useState<Invito[]>([]);
    const [loadingInviti, setLoadingInviti] = useState(true);
    const [creatingInvito, setCreatingInvito] = useState(false);

    const isAdmin = useMemo(() => (me?.ruolo ?? "").toLowerCase().includes("amm"), [me?.ruolo]);

    useEffect(() => {
        const load = async () => {
            if (!supabase) {
                setLoadingMe(false);
                return;
            }

            const { data } = await supabase.auth.getUser();
            const authUser = data?.user;
            if (!authUser) {
                setLoadingMe(false);
                return;
            }

            const res = await fetch(`/api/user?userId=${authUser.id}`);
            if (res.ok) {
                const userData = (await res.json()) as { nome: string; cognome: string; parrocchia: string | null; ruolo: string | null };
                setMe({ id: authUser.id, ...userData });
            }

            setLoadingMe(false);
        };

        void load();
    }, []);

    const refresh = async (userId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/volontari?userId=${userId}`);
            if (!res.ok) {
                setVolontari([]);
                return;
            }
            const data = (await res.json()) as Volontario[];
            setVolontari(data);
        } finally {
            setLoading(false);
        }
    };

    const refreshInviti = async (userId: string) => {
        setLoadingInviti(true);
        try {
            const res = await fetch(`/api/inviti?userId=${userId}`);
            if (!res.ok) {
                setInviti([]);
                return;
            }
            const data = (await res.json()) as Invito[];
            setInviti(data);
        } finally {
            setLoadingInviti(false);
        }
    };

    useEffect(() => {
        if (!me?.id) return;
        if (!isAdmin) {
            setLoading(false);
            setLoadingInviti(false);
            return;
        }
        void refresh(me.id);
        void refreshInviti(me.id);
    }, [me?.id, isAdmin]);

    const handleCreateInvito = async () => {
        if (!me?.id) return;
        setCreatingInvito(true);
        try {
            const res = await fetch("/api/inviti", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: me.id, daysValid: 7 }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err?.error ?? "Errore creazione invito.");
                return;
            }
            await refreshInviti(me.id);
        } finally {
            setCreatingInvito(false);
        }
    };

    const handleRevokeInvito = async (id: string) => {
        if (!me?.id) return;
        const res = await fetch(`/api/inviti?userId=${me.id}&id=${id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err?.error ?? "Errore revoca invito.");
            return;
        }
        await refreshInviti(me.id);
    };

    const handleDelete = async (id: string) => {
        if (!me?.id) return;
        if (!confirm("Vuoi eliminare questo volontario? (Verrà eliminato il record in tabella, non l'account Auth)")) return;

        const res = await fetch(`/api/volontari?userId=${me.id}&id=${id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err?.error ?? "Errore eliminazione volontario.");
            return;
        }
        await refresh(me.id);
    };

    const subtitle = loadingMe
        ? "Caricamento..."
        : me?.parrocchia
          ? `Parrocchia ${me.parrocchia}`
          : "Parrocchia non disponibile";

    return (
        <DashboardLayout title="Gestione volontari" subtitle={subtitle}>
            {!loadingMe && !isAdmin && (
                <div className="bg-card rounded-2xl border border-border p-6">
                    <p className="text-sm text-muted-foreground">Sezione disponibile solo per gli amministratori.</p>
                </div>
            )}

            {isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-6">
                        <h2 className="font-display text-lg font-semibold text-foreground mb-2">Inviti volontari</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Genera un invito e condividi il link con il volontario. Il volontario completerà la registrazione
                            (signup) e verrà associato automaticamente alla tua parrocchia.
                        </p>

                        <Button className="w-full" onClick={handleCreateInvito} disabled={creatingInvito}>
                            {creatingInvito ? "Creazione..." : "Genera invito (7 giorni)"}
                        </Button>

                        <div className="mt-5 space-y-3">
                            {loadingInviti && <p className="text-sm text-muted-foreground">Caricamento inviti...</p>}
                            {!loadingInviti && inviti.length === 0 && (
                                <p className="text-sm text-muted-foreground">Nessun invito creato.</p>
                            )}
                            {!loadingInviti &&
                                inviti.slice(0, 6).map((inv) => {
                                    const link =
                                        typeof window !== "undefined"
                                            ? `${window.location.origin}/invito/${inv.token}`
                                            : `/invito/${inv.token}`;
                                    const isActive = !inv.revoked_at && !inv.accepted_at;
                                    return (
                                        <div key={inv.id} className="p-3 rounded-xl bg-secondary/50">
                                            <div className="text-xs text-muted-foreground mb-2">
                                                {isActive ? "Attivo" : inv.accepted_at ? "Usato" : "Revocato"} · scade{" "}
                                                {new Date(inv.expires_at).toLocaleDateString()}
                                            </div>
                                            <Input value={link} readOnly />
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(link);
                                                        } catch {
                                                            // fallback
                                                        }
                                                    }}
                                                >
                                                    Copia link
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={!isActive}
                                                    onClick={() => handleRevokeInvito(inv.id)}
                                                >
                                                    Revoca
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Volontari</h2>

                        {loading && <p className="text-sm text-muted-foreground">Caricamento volontari...</p>}
                        {!loading && volontari.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nessun volontario trovato per questa parrocchia.</p>
                        )}

                        {!loading && volontari.length > 0 && (
                            <div className="space-y-3">
                                {volontari.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary/50"
                                    >
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground truncate">
                                                {v.nome} {v.cognome}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {v.cf ? `CF: ${v.cf}` : "CF: -"} · ID: {v.id}
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDelete(v.id)}
                                            title="Elimina"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}


