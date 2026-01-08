"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    User,
    Plus,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Famiglia {
    id: string;
    cognome: string;
    note?: string | null;
    beneficiari?: Array<{ nome: string; cognome: string }>;
    numBeneficiari?: number;
}

// Funzione helper per formattare il nome della famiglia in modo distinguibile
const formattaNomeFamiglia = (famiglia: Famiglia): string => {
    const nome = famiglia.cognome;
    const parti: string[] = [];

    // Aggiungi informazioni sui beneficiari se disponibili
    if (famiglia.beneficiari && famiglia.beneficiari.length > 0) {
        const nomiBeneficiari = famiglia.beneficiari.map(b => b.nome).join(", ");
        const altri = famiglia.numBeneficiari && famiglia.numBeneficiari > famiglia.beneficiari.length 
            ? ` (+${famiglia.numBeneficiari - famiglia.beneficiari.length} altri)` 
            : "";
        parti.push(`${nomiBeneficiari}${altri}`);
    } else if (famiglia.numBeneficiari !== undefined && famiglia.numBeneficiari > 0) {
        parti.push(`${famiglia.numBeneficiari} ${famiglia.numBeneficiari === 1 ? 'beneficiario' : 'beneficiari'}`);
    }

    // Aggiungi note se presente e non troppo lunga
    if (famiglia.note && famiglia.note.trim().length > 0 && famiglia.note.trim().length <= 40) {
        parti.push(famiglia.note.trim());
    }

    if (parti.length > 0) {
        return `${nome} • ${parti.join(" • ")}`;
    }
    return nome;
};

const ModificaBeneficiarioContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const beneficiarioId = searchParams.get("id");

    const [loading, setLoading] = useState(true);
    const [loadingFamiglie, setLoadingFamiglie] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [famiglie, setFamiglie] = useState<Famiglia[]>([]);
    const [formData, setFormData] = useState({
        nome: "",
        cognome: "",
        cf: "",
        data_nascita: "",
        luogo_nascita: "",
        famiglia_id: "",
    });

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
                    console.error("Errore nel recupero dell'utente autenticato per la modifica del beneficiario:", authError);
                    toast.error("Utente non autenticato.");
                    router.push("/login");
                    return;
                }

                const res = await fetch(`/api/beneficiario?userId=${user.id}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/beneficiario (GET per modifica):", await res.json());
                    toast.error("Errore nel caricamento del beneficiario.");
                    router.push("/beneficiario");
                    return;
                }

                const data: {
                    id: string;
                    nome: string;
                    cognome: string;
                    cf: string | null;
                    data_nascita: string | null;
                    luogo_nascita: string | null;
                    famiglia: string | null;
                    famiglia_id: string | null;
                }[] = await res.json();

                const beneficiario = data.find((b) => b.id === beneficiarioId);

                if (!beneficiario) {
                    toast.error("Beneficiario non trovato.");
                    router.push("/beneficiario");
                    return;
                }

                // Formatta la data per l'input date (YYYY-MM-DD)
                let dataNascitaFormatted = "";
                if (beneficiario.data_nascita) {
                    try {
                        const date = new Date(beneficiario.data_nascita);
                        dataNascitaFormatted = date.toISOString().split("T")[0];
                    } catch {
                        dataNascitaFormatted = "";
                    }
                }

                setFormData({
                    nome: beneficiario.nome,
                    cognome: beneficiario.cognome,
                    cf: beneficiario.cf || "",
                    data_nascita: dataNascitaFormatted,
                    luogo_nascita: beneficiario.luogo_nascita || "",
                    famiglia_id: beneficiario.famiglia_id || "",
                });
            } catch (error) {
                console.error("Errore nel caricamento del beneficiario da modificare:", error);
                toast.error("Si è verificato un errore inatteso.");
                router.push("/beneficiario");
            } finally {
                setLoading(false);
            }
        };

        void loadBeneficiario();
    }, [beneficiarioId, router]);

    useEffect(() => {
        const loadFamiglie = async () => {
            if (!supabase) {
                setLoadingFamiglie(false);
                return;
            }

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setLoadingFamiglie(false);
                return;
            }

            try {
                const res = await fetch(`/api/famiglia?userId=${user.id}&all=true`);
                if (!res.ok) {
                    console.error("Errore risposta /api/famiglia:", await res.json());
                    setLoadingFamiglie(false);
                    return;
                }
                const data: Famiglia[] = await res.json();
                setFamiglie(data);
            } catch (e) {
                console.error("Errore chiamata /api/famiglia:", e);
            } finally {
                setLoadingFamiglie(false);
            }
        };

        void loadFamiglie();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!beneficiarioId) {
            toast.error("ID del beneficiario mancante.");
            return;
        }

        if (!formData.nome || !formData.cognome) {
            toast.error("Compila tutti i campi obbligatori");
            return;
        }

        if (!supabase) {
            toast.error("Supabase non è configurato.");
            return;
        }

        setSubmitting(true);

        try {
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("Errore nel recupero dell'utente autenticato per il salvataggio del beneficiario:", authError);
                toast.error("Utente non autenticato.");
                return;
            }

            const res = await fetch("/api/beneficiario", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    id: beneficiarioId,
                    nome: formData.nome,
                    cognome: formData.cognome,
                    cf: formData.cf || null,
                    data_nascita: formData.data_nascita || null,
                    luogo_nascita: formData.luogo_nascita || null,
                    famiglia_id: formData.famiglia_id || null,
                }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                console.error("Errore risposta /api/beneficiario (PUT):", errorBody || res.statusText);
                const errorMessage = errorBody?.error || "Errore nel salvataggio delle modifiche.";
                toast.error(errorMessage);
                return;
            }

            toast.success("Beneficiario modificato con successo!");
            router.push("/beneficiario");
        } catch (error) {
            console.error("Errore durante il salvataggio delle modifiche al beneficiario:", error);
            toast.error("Si è verificato un errore inatteso.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DashboardLayout
                title="Modifica Beneficiario"
                subtitle="Aggiorna le informazioni del beneficiario"
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beneficiario">
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-2xl mx-auto">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Caricamento dati del beneficiario...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <User className="w-5 h-5 text-primary" />
                                    <h3 className="font-display text-lg font-semibold text-foreground">
                                        Informazioni Personali
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Nome <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.nome}
                                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                            placeholder="es. Mario"
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Cognome <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.cognome}
                                            onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                                            placeholder="es. Rossi"
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Codice Fiscale
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cf}
                                        onChange={(e) => setFormData({ ...formData, cf: e.target.value.toUpperCase() })}
                                        placeholder="es. RSSMRA80A01H501U"
                                        maxLength={16}
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                                    />
                                </div>
                            </div>

                            {/* Birth Info */}
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                    Informazioni di Nascita
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Data di Nascita
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.data_nascita}
                                            onChange={(e) => setFormData({ ...formData, data_nascita: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Luogo di Nascita
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.luogo_nascita}
                                            onChange={(e) => setFormData({ ...formData, luogo_nascita: e.target.value })}
                                            placeholder="es. Roma"
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Family Info */}
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-lg font-semibold text-foreground">
                                        Informazioni Famiglia
                                    </h3>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/famiglia/nuovo">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuova Famiglia
                                        </Link>
                                    </Button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Famiglia (opzionale)
                                    </label>
                                    {loadingFamiglie ? (
                                        <div className="w-full px-4 py-3 rounded-xl bg-secondary text-muted-foreground">
                                            Caricamento famiglie...
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.famiglia_id}
                                            onChange={(e) => setFormData({ ...formData, famiglia_id: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Nessuna famiglia</option>
                                            {famiglie.map((famiglia) => (
                                                <option key={famiglia.id} value={famiglia.id}>
                                                    {formattaNomeFamiglia(famiglia)}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Seleziona una famiglia esistente o creane una nuova. Lascia vuoto se il beneficiario non appartiene a una famiglia registrata.
                                    </p>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                <Button variant="outline" type="button" className="flex-1" asChild>
                                    <Link href="/beneficiario">Annulla</Link>
                                </Button>
                                <Button variant="default" type="submit" className="flex-1" disabled={submitting}>
                                    <Save className="w-4 h-4" />
                                    {submitting ? "Salvataggio..." : "Salva Modifiche"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
};

const ModificaBeneficiario = () => {
    return (
        <Suspense fallback={
            <DashboardLayout
                title="Modifica Beneficiario"
                subtitle="Aggiorna le informazioni del beneficiario"
            >
                <div className="max-w-2xl mx-auto">
                    <p className="text-sm text-muted-foreground">Caricamento...</p>
                </div>
            </DashboardLayout>
        }>
            <ModificaBeneficiarioContent />
        </Suspense>
    );
};

export default ModificaBeneficiario;

