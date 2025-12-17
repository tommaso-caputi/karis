"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    User,
    Package,
    Calendar,
    FileText,
    Edit2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Beneficiario {
    id: string;
    nome: string;
    cognome: string;
    cf: string | null;
    data_nascita: string | null;
    luogo_nascita: string | null;
    famiglia: string | null;
    famiglia_id: string | null;
    created_at: string;
}

interface Assegnazione {
    id: string;
    risorsa_id: string;
    risorsa_nome: string;
    beneficiario_id: string | null;
    beneficiario_nome: string | null;
    famiglia_id: string | null;
    famiglia_cognome: string | null;
    quantita: number;
    data_assegnazione: string;
    note: string | null;
}

const DettaglioBeneficiarioContent = () => {
    const router = useRouter();
    const params = useParams();
    const beneficiarioId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [loadingAssegnazioni, setLoadingAssegnazioni] = useState(true);
    const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
    const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>([]);

    useEffect(() => {
        const loadBeneficiario = async () => {
            if (!beneficiarioId) {
                toast.error("ID del beneficiario mancante.");
                router.push("/beneficiario");
                return;
            }

            if (!supabase) {
                toast.error("Supabase non è configurato.");
                router.push("/beneficiario");
                return;
            }

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    console.error("Errore nel recupero dell'utente autenticato:", authError);
                    toast.error("Utente non autenticato.");
                    router.push("/login");
                    return;
                }

                const res = await fetch(`/api/beneficiario?userId=${user.id}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/beneficiario:", await res.json());
                    toast.error("Errore nel caricamento del beneficiario.");
                    router.push("/beneficiario");
                    return;
                }

                const data: Beneficiario[] = await res.json();
                const beneficiarioTrovato = data.find((b) => b.id === beneficiarioId);

                if (!beneficiarioTrovato) {
                    toast.error("Beneficiario non trovato.");
                    router.push("/beneficiario");
                    return;
                }

                setBeneficiario(beneficiarioTrovato);
            } catch (error) {
                console.error("Errore nel caricamento del beneficiario:", error);
                toast.error("Si è verificato un errore inatteso.");
                router.push("/beneficiario");
            } finally {
                setLoading(false);
            }
        };

        void loadBeneficiario();
    }, [beneficiarioId, router]);

    useEffect(() => {
        const loadAssegnazioni = async () => {
            if (!beneficiarioId) return;

            if (!supabase) {
                setLoadingAssegnazioni(false);
                return;
            }

            try {
                const {
                    data: { user },
                    error: authError,
                } = await supabase.auth.getUser();

                if (authError || !user) {
                    setLoadingAssegnazioni(false);
                    return;
                }

                const res = await fetch(`/api/assegnazioni?userId=${user.id}&beneficiarioId=${beneficiarioId}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/assegnazioni:", await res.json());
                    setLoadingAssegnazioni(false);
                    return;
                }

                const data: Assegnazione[] = await res.json();
                setAssegnazioni(data);
            } catch (error) {
                console.error("Errore nel caricamento delle assegnazioni:", error);
            } finally {
                setLoadingAssegnazioni(false);
            }
        };

        void loadAssegnazioni();
    }, [beneficiarioId]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("it-IT", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "-";
        }
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("it-IT", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "-";
        }
    };

    // Raggruppa le assegnazioni per data (per identificare i pacchi)
    const assegnazioniPerData = new Map<string, Assegnazione[]>();
    assegnazioni.forEach((assegnazione) => {
        const data = assegnazione.data_assegnazione
            ? new Date(assegnazione.data_assegnazione).toLocaleDateString("it-IT")
            : "Data sconosciuta";
        if (!assegnazioniPerData.has(data)) {
            assegnazioniPerData.set(data, []);
        }
        assegnazioniPerData.get(data)!.push(assegnazione);
    });

    // Ordina le date dalla più recente alla più vecchia
    const dateOrdinate = Array.from(assegnazioniPerData.keys()).sort((a, b) => {
        const dateA = assegnazioniPerData.get(a)?.[0]?.data_assegnazione || "";
        const dateB = assegnazioniPerData.get(b)?.[0]?.data_assegnazione || "";
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    if (loading) {
        return (
            <DashboardLayout
                title="Dettaglio Beneficiario"
                subtitle="Caricamento..."
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beneficiario">
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm text-muted-foreground">Caricamento dati del beneficiario...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!beneficiario) {
        return (
            <DashboardLayout
                title="Dettaglio Beneficiario"
                subtitle="Beneficiario non trovato"
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beneficiario">
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm text-muted-foreground">Il beneficiario richiesto non è stato trovato.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout
            title={`${beneficiario.nome} ${beneficiario.cognome}`}
            subtitle="Dettagli e storico assegnazioni"
            actions={
                <div className="flex items-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/beneficiario/modifica?id=${beneficiario.id}`}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Modifica
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/beneficiario">
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </Link>
                    </Button>
                </div>
            }
        >
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Informazioni Personali */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="font-display text-xl font-semibold text-foreground">
                            Informazioni Personali
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Nome</div>
                            <div className="font-medium text-foreground">{beneficiario.nome}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Cognome</div>
                            <div className="font-medium text-foreground">{beneficiario.cognome}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Codice Fiscale</div>
                            <div className="font-medium text-foreground font-mono">
                                {beneficiario.cf || "-"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Data di Nascita</div>
                            <div className="font-medium text-foreground">
                                {formatDate(beneficiario.data_nascita)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Luogo di Nascita</div>
                            <div className="font-medium text-foreground">
                                {beneficiario.luogo_nascita || "-"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Famiglia</div>
                            <div className="font-medium text-foreground">
                                {beneficiario.famiglia ? (
                                    <Link
                                        href={`/famiglia/${beneficiario.famiglia_id}`}
                                        className="text-primary hover:underline"
                                    >
                                        {beneficiario.famiglia}
                                    </Link>
                                ) : (
                                    "-"
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Storico Assegnazioni */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Package className="w-6 h-6 text-primary" />
                        <h2 className="font-display text-xl font-semibold text-foreground">
                            Storico Assegnazioni
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            ({assegnazioni.length} {assegnazioni.length === 1 ? "assegnazione" : "assegnazioni"})
                        </span>
                    </div>

                    {loadingAssegnazioni ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">Caricamento storico assegnazioni...</p>
                        </div>
                    ) : assegnazioni.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">Nessuna assegnazione</h3>
                            <p className="text-muted-foreground mb-4">
                                Non ci sono ancora assegnazioni registrate per questo beneficiario.
                            </p>
                            <Button variant="default" asChild>
                                <Link href="/beni/assegna">
                                    Assegna Beni
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {dateOrdinate.map((data) => {
                                const assegnazioniDelGiorno = assegnazioniPerData.get(data) || [];
                                const primaAssegnazione = assegnazioniDelGiorno[0];
                                const isPacco = assegnazioniDelGiorno.length > 1;

                                return (
                                    <div
                                        key={data}
                                        className="border border-border rounded-xl overflow-hidden"
                                    >
                                        <div className="bg-secondary/50 px-6 py-4 border-b border-border">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <div className="font-semibold text-foreground">
                                                            {isPacco ? "Pacco" : "Assegnazione"} del {data}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {formatDateTime(primaAssegnazione.data_assegnazione)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isPacco && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {assegnazioniDelGiorno.length} beni
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {assegnazioniDelGiorno.map((assegnazione) => (
                                                <div
                                                    key={assegnazione.id}
                                                    className="px-6 py-4 hover:bg-secondary/30 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-foreground mb-1">
                                                                {assegnazione.risorsa_nome}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                Quantità: {assegnazione.quantita}
                                                            </div>
                                                            {assegnazione.note && (
                                                                <div className="mt-2 flex items-start gap-2">
                                                                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {assegnazione.note}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

const DettaglioBeneficiario = () => {
    return (
        <Suspense
            fallback={
                <DashboardLayout
                    title="Dettaglio Beneficiario"
                    subtitle="Caricamento..."
                >
                    <div className="max-w-4xl mx-auto">
                        <p className="text-sm text-muted-foreground">Caricamento...</p>
                    </div>
                </DashboardLayout>
            }
        >
            <DettaglioBeneficiarioContent />
        </Suspense>
    );
};

export default DettaglioBeneficiario;

