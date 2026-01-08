"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    Package,
    User,
    Users,
    AlertTriangle,
    Calendar,
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
    scadenza?: string | null;
    category?: string | null;
}

interface Beneficiario {
    id: string;
    nome: string;
    cognome: string;
}

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

            const result = await res.json();
            
            // Mostra avviso sulla scadenza se presente
            if (result.scadenza_warning) {
                toast.warning(result.scadenza_warning, { 
                    duration: 6000,
                    description: "Verifica la scadenza del bene prima della distribuzione."
                });
            } else {
                // Verifica anche lato client se il bene selezionato scade entro una settimana
                if (beneSelezionato?.scadenza) {
                    const oggi = new Date();
                    oggi.setHours(0, 0, 0, 0);
                    const dataScadenza = new Date(beneSelezionato.scadenza);
                    dataScadenza.setHours(0, 0, 0, 0);
                    
                    const diffTime = dataScadenza.getTime() - oggi.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays >= 0 && diffDays <= 7) {
                        toast.warning(
                            `ATTENZIONE: Questo bene scade tra ${diffDays} giorno${diffDays !== 1 ? 'i' : ''}.`,
                            { 
                                duration: 6000,
                                description: "Verifica la scadenza del bene prima della distribuzione."
                            }
                        );
                    }
                }
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

    // Funzione per verificare lo stato della scadenza
    const getScadenzaStatus = (scadenza: string | null | undefined): { 
        isExpired: boolean; 
        isExpiringSoon: boolean; 
        daysUntilExpiry: number | null;
        message: string;
    } => {
        if (!scadenza) {
            return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null, message: "" };
        }

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);
        const dataScadenza = new Date(scadenza);
        dataScadenza.setHours(0, 0, 0, 0);
        
        const diffTime = dataScadenza.getTime() - oggi.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                isExpired: true,
                isExpiringSoon: false,
                daysUntilExpiry: Math.abs(diffDays),
                message: `⚠️ ATTENZIONE: Questo bene è scaduto da ${Math.abs(diffDays)} giorno${Math.abs(diffDays) !== 1 ? 'i' : ''}.`
            };
        } else if (diffDays <= 7) {
            return {
                isExpired: false,
                isExpiringSoon: true,
                daysUntilExpiry: diffDays,
                message: `⚠️ ATTENZIONE: Questo bene scade tra ${diffDays} giorno${diffDays !== 1 ? 'i' : ''}.`
            };
        }

        return {
            isExpired: false,
            isExpiringSoon: false,
            daysUntilExpiry: diffDays,
            message: `Scade il ${dataScadenza.toLocaleDateString('it-IT')} (tra ${diffDays} giorni)`
        };
    };

    const scadenzaStatus = beneSelezionato?.scadenza 
        ? getScadenzaStatus(beneSelezionato.scadenza)
        : null;

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
                                    <div className="mt-4 space-y-3">
                                        <div className="p-4 bg-secondary rounded-xl">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Package className="w-4 h-4" />
                                                <span>
                                                    Disponibile: <strong className="text-foreground">{beneSelezionato.quantity} {beneSelezionato.unit}</strong>
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Avviso scadenza */}
                                        {scadenzaStatus && (() => {
                                            const scadenzaDate = beneSelezionato.scadenza ? new Date(beneSelezionato.scadenza) : null;
                                            const formattedDate = scadenzaDate ? scadenzaDate.toLocaleDateString('it-IT') : '';
                                            
                                            let containerClass = "p-4 rounded-xl border-2 ";
                                            let iconClass = "w-5 h-5 shrink-0 mt-0.5 ";
                                            let textClass = "text-sm font-medium ";
                                            let dateTextClass = "text-xs ";
                                            let dateIconClass = "w-4 h-4 ";
                                            
                                            if (scadenzaStatus.isExpired) {
                                                containerClass += "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800";
                                                iconClass += "text-red-600 dark:text-red-400";
                                                textClass += "text-red-800 dark:text-red-200";
                                                dateTextClass += "text-red-700 dark:text-red-300";
                                                dateIconClass += "text-red-600 dark:text-red-400";
                                            } else if (scadenzaStatus.isExpiringSoon) {
                                                containerClass += "bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800";
                                                iconClass += "text-amber-600 dark:text-amber-400";
                                                textClass += "text-amber-800 dark:text-amber-200";
                                                dateTextClass += "text-amber-700 dark:text-amber-300";
                                                dateIconClass += "text-amber-600 dark:text-amber-400";
                                            } else {
                                                containerClass += "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-800";
                                                iconClass += "text-blue-600 dark:text-blue-400";
                                                textClass += "text-blue-800 dark:text-blue-200";
                                                dateTextClass += "text-blue-700 dark:text-blue-300";
                                                dateIconClass += "text-blue-600 dark:text-blue-400";
                                            }
                                            
                                            return (
                                                <div className={containerClass}>
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className={iconClass} />
                                                        <div className="flex-1">
                                                            <p className={textClass}>
                                                                {scadenzaStatus.message}
                                                            </p>
                                                            {scadenzaStatus.daysUntilExpiry !== null && scadenzaDate && (
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <Calendar className={dateIconClass} />
                                                                    <span className={dateTextClass}>
                                                                        Data di scadenza: {formattedDate}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
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
                                                    {formattaNomeFamiglia(famiglia)}
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

