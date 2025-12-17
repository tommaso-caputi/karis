"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    Package,
    User,
    Users,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Bene {
    id: string;
    name: string;
    quantity: number;
    unit: string;
}

interface Beneficiario {
    id: string;
    nome: string;
    cognome: string;
}

interface Famiglia {
    id: string;
    cognome: string;
}

const AssegnaBeneContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const beneIdParam = searchParams.get("beneId");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [beni, setBeni] = useState<Bene[]>([]);
    const [beneficiari, setBeneficiari] = useState<Beneficiario[]>([]);
    const [famiglie, setFamiglie] = useState<Famiglia[]>([]);
    const [formData, setFormData] = useState({
        beneId: beneIdParam || "",
        tipoAssegnazione: "beneficiario" as "beneficiario" | "famiglia",
        beneficiarioId: "",
        famigliaId: "",
        quantita: "",
        note: "",
    });

    useEffect(() => {
        const loadData = async () => {
            if (!supabase) {
                setLoading(false);
                toast.error("Supabase non è configurato.");
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

                // Carica beni
                const beniRes = await fetch(`/api/beni?userId=${user.id}`);
                if (!beniRes.ok) {
                    throw new Error("Errore nel caricamento dei beni.");
                }
                const beniData: Bene[] = await beniRes.json();
                setBeni(beniData.filter(b => b.quantity > 0)); // Solo beni disponibili

                // Carica beneficiari
                const beneficiariRes = await fetch(`/api/beneficiario?userId=${user.id}`);
                if (beneficiariRes.ok) {
                    const beneficiariData: Beneficiario[] = await beneficiariRes.json();
                    setBeneficiari(beneficiariData);
                }

                // Carica famiglie
                const famiglieRes = await fetch(`/api/famiglia?userId=${user.id}&all=true`);
                if (famiglieRes.ok) {
                    const famiglieData: Famiglia[] = await famiglieRes.json();
                    setFamiglie(famiglieData);
                }
            } catch (error) {
                console.error("Errore nel caricamento dei dati:", error);
                toast.error("Errore nel caricamento dei dati.");
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.beneId || !formData.quantita) {
            toast.error("Seleziona un bene e inserisci la quantità.");
            return;
        }

        if (formData.tipoAssegnazione === "beneficiario" && !formData.beneficiarioId) {
            toast.error("Seleziona un beneficiario.");
            return;
        }

        if (formData.tipoAssegnazione === "famiglia" && !formData.famigliaId) {
            toast.error("Seleziona una famiglia.");
            return;
        }

        const quantitaNum = Number(formData.quantita);
        if (isNaN(quantitaNum) || quantitaNum <= 0) {
            toast.error("Inserisci una quantità valida.");
            return;
        }

        const beneSelezionato = beni.find(b => b.id === formData.beneId);
        if (!beneSelezionato || quantitaNum > beneSelezionato.quantity) {
            toast.error(`Quantità non disponibile. Disponibile: ${beneSelezionato?.quantity ?? 0}`);
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
                console.error("Errore nel recupero dell'utente autenticato:", authError);
                toast.error("Utente non autenticato.");
                return;
            }

            const res = await fetch("/api/assegnazioni", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    risorsa_id: formData.beneId,
                    beneficiario_id: formData.tipoAssegnazione === "beneficiario" ? formData.beneficiarioId : null,
                    famiglia_id: formData.tipoAssegnazione === "famiglia" ? formData.famigliaId : null,
                    quantita: quantitaNum,
                    note: formData.note || null,
                }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                console.error("Errore risposta /api/assegnazioni (POST):", errorBody || res.statusText);
                toast.error(errorBody?.error || "Errore nell'assegnazione del bene.");
                return;
            }

            toast.success("Bene assegnato con successo!");
            router.push("/beni");
        } catch (error) {
            console.error("Errore durante l'assegnazione del bene:", error);
            toast.error("Si è verificato un errore inatteso.");
        } finally {
            setSubmitting(false);
        }
    };

    const beneSelezionato = beni.find(b => b.id === formData.beneId);

    return (
        <>
            <DashboardLayout
                title="Assegna Bene"
                subtitle="Assegna un bene a un beneficiario o famiglia"
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beni">
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-2xl mx-auto">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Caricamento dati...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Selezione Bene */}
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                    Seleziona Bene
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Bene <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={formData.beneId}
                                        onChange={(e) => setFormData({ ...formData, beneId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Seleziona un bene...</option>
                                        {beni.map((bene) => (
                                            <option key={bene.id} value={bene.id}>
                                                {bene.name} ({bene.quantity} {bene.unit} disponibili)
                                            </option>
                                        ))}
                                    </select>
                                    {beni.length === 0 && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Nessun bene disponibile per l'assegnazione.
                                        </p>
                                    )}
                                </div>
                                {beneSelezionato && (
                                    <div className="mt-4 p-4 bg-secondary rounded-xl">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="w-4 h-4" />
                                            <span>
                                                Disponibile: <strong className="text-foreground">{beneSelezionato.quantity} {beneSelezionato.unit}</strong>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tipo Assegnazione */}
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                    Tipo di Assegnazione
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipoAssegnazione: "beneficiario", famigliaId: "" })}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                                            formData.tipoAssegnazione === "beneficiario"
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-secondary/50 hover:border-muted-foreground"
                                        }`}
                                    >
                                        <User className={`w-8 h-8 mx-auto mb-2 ${formData.tipoAssegnazione === "beneficiario" ? "text-primary" : "text-muted-foreground"}`} />
                                        <span className={`text-sm font-medium ${formData.tipoAssegnazione === "beneficiario" ? "text-foreground" : "text-muted-foreground"}`}>
                                            Beneficiario
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipoAssegnazione: "famiglia", beneficiarioId: "" })}
                                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                                            formData.tipoAssegnazione === "famiglia"
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-secondary/50 hover:border-muted-foreground"
                                        }`}
                                    >
                                        <Users className={`w-8 h-8 mx-auto mb-2 ${formData.tipoAssegnazione === "famiglia" ? "text-primary" : "text-muted-foreground"}`} />
                                        <span className={`text-sm font-medium ${formData.tipoAssegnazione === "famiglia" ? "text-foreground" : "text-muted-foreground"}`}>
                                            Famiglia
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Selezione Beneficiario o Famiglia */}
                            {formData.tipoAssegnazione === "beneficiario" ? (
                                <div className="bg-card rounded-2xl border border-border p-6">
                                    <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                        Seleziona Beneficiario
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Beneficiario <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            value={formData.beneficiarioId}
                                            onChange={(e) => setFormData({ ...formData, beneficiarioId: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Seleziona un beneficiario...</option>
                                            {beneficiari.map((beneficiario) => (
                                                <option key={beneficiario.id} value={beneficiario.id}>
                                                    {beneficiario.nome} {beneficiario.cognome}
                                                </option>
                                            ))}
                                        </select>
                                        {beneficiari.length === 0 && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Nessun beneficiario disponibile. <Link href="/beneficiario/nuovo" className="text-primary underline">Aggiungine uno</Link>.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card rounded-2xl border border-border p-6">
                                    <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                        Seleziona Famiglia
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Famiglia <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            value={formData.famigliaId}
                                            onChange={(e) => setFormData({ ...formData, famigliaId: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Seleziona una famiglia...</option>
                                            {famiglie.map((famiglia) => (
                                                <option key={famiglia.id} value={famiglia.id}>
                                                    Famiglia {famiglia.cognome}
                                                </option>
                                            ))}
                                        </select>
                                        {famiglie.length === 0 && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Nessuna famiglia disponibile. <Link href="/famiglia/nuovo" className="text-primary underline">Aggiungine una</Link>.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Quantità e Note */}
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                    Dettagli Assegnazione
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Quantità <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={beneSelezionato?.quantity ?? 0}
                                        value={formData.quantita}
                                        onChange={(e) => setFormData({ ...formData, quantita: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    {beneSelezionato && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Massimo disponibile: {beneSelezionato.quantity} {beneSelezionato.unit}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Note (opzionale)
                                    </label>
                                    <textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        placeholder="Aggiungi note sull'assegnazione..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                                <Button variant="outline" type="button" className="flex-1" asChild>
                                    <Link href="/beni">Annulla</Link>
                                </Button>
                                <Button 
                                    variant="default" 
                                    type="submit" 
                                    className="flex-1" 
                                    disabled={submitting || beni.length === 0}
                                >
                                    <Save className="w-4 h-4" />
                                    {submitting ? "Assegnazione..." : "Assegna Bene"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
};

const AssegnaBene = () => {
    return (
        <Suspense fallback={
            <DashboardLayout
                title="Assegna Bene"
                subtitle="Assegna un bene a un beneficiario o famiglia"
            >
                <div className="max-w-2xl mx-auto">
                    <p className="text-sm text-muted-foreground">Caricamento...</p>
                </div>
            </DashboardLayout>
        }>
            <AssegnaBeneContent />
        </Suspense>
    );
};

export default AssegnaBene;

