"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    Package,
    User,
    Users,
    Plus,
    X,
    Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

interface BeneSelezionato {
    beneId: string;
    quantita: number;
    nome: string;
    unita: string;
    disponibile: number;
}

const CreaPaccoContent = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [beni, setBeni] = useState<Bene[]>([]);
    const [beneficiari, setBeneficiari] = useState<Beneficiario[]>([]);
    const [famiglie, setFamiglie] = useState<Famiglia[]>([]);
    const [beniSelezionati, setBeniSelezionati] = useState<BeneSelezionato[]>([]);
    const [formData, setFormData] = useState({
        tipoAssegnazione: "beneficiario" as "beneficiario" | "famiglia",
        beneficiarioId: "",
        famigliaId: "",
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

    const aggiungiBene = () => {
        if (beni.length === 0) {
            toast.error("Nessun bene disponibile.");
            return;
        }
        // Aggiungi il primo bene disponibile che non è già stato aggiunto
        const beneDisponibile = beni.find(b => !beniSelezionati.some(bs => bs.beneId === b.id));
        if (beneDisponibile) {
            setBeniSelezionati([
                ...beniSelezionati,
                {
                    beneId: beneDisponibile.id,
                    quantita: 1,
                    nome: beneDisponibile.name,
                    unita: beneDisponibile.unit,
                    disponibile: beneDisponibile.quantity,
                },
            ]);
        } else {
            toast.error("Tutti i beni disponibili sono già stati aggiunti.");
        }
    };

    const rimuoviBene = (index: number) => {
        setBeniSelezionati(beniSelezionati.filter((_, i) => i !== index));
    };

    const aggiornaBene = (index: number, campo: keyof BeneSelezionato, valore: string | number) => {
        const nuoviBeni = [...beniSelezionati];
        if (campo === "beneId") {
            const beneSelezionato = beni.find(b => b.id === valore);
            if (beneSelezionato) {
                nuoviBeni[index] = {
                    ...nuoviBeni[index],
                    beneId: valore as string,
                    nome: beneSelezionato.name,
                    unita: beneSelezionato.unit,
                    disponibile: beneSelezionato.quantity,
                    quantita: 1, // Reset quantità quando si cambia bene
                };
            }
        } else if (campo === "quantita") {
            const quantitaNum = Number(valore);
            if (!isNaN(quantitaNum) && quantitaNum > 0) {
                nuoviBeni[index] = {
                    ...nuoviBeni[index],
                    quantita: quantitaNum,
                };
            }
        }
        setBeniSelezionati(nuoviBeni);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (beniSelezionati.length === 0) {
            toast.error("Aggiungi almeno un bene al pacco.");
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

        // Valida tutte le quantità
        for (const beneSel of beniSelezionati) {
            if (beneSel.quantita <= 0) {
                toast.error(`Inserisci una quantità valida per "${beneSel.nome}".`);
                return;
            }
            if (beneSel.quantita > beneSel.disponibile) {
                toast.error(`Quantità non disponibile per "${beneSel.nome}". Disponibile: ${beneSel.disponibile} ${beneSel.unita}`);
                return;
            }
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

            // Crea tutte le assegnazioni
            const assegnazioni = beniSelezionati.map(bs => ({
                userId: user.id,
                risorsa_id: bs.beneId,
                beneficiario_id: formData.tipoAssegnazione === "beneficiario" ? formData.beneficiarioId : null,
                famiglia_id: formData.tipoAssegnazione === "famiglia" ? formData.famigliaId : null,
                quantita: bs.quantita,
                note: formData.note || null,
            }));

            const res = await fetch("/api/assegnazioni/pacco", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    assegnazioni,
                }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                console.error("Errore risposta /api/assegnazioni/pacco (POST):", errorBody || res.statusText);
                toast.error(errorBody?.error || "Errore nella creazione del pacco.");
                return;
            }

            toast.success(`Pacco creato con successo! ${beniSelezionati.length} beni assegnati.`);
            router.push("/beni");
        } catch (error) {
            console.error("Errore durante la creazione del pacco:", error);
            toast.error("Si è verificato un errore inatteso.");
        } finally {
            setSubmitting(false);
        }
    };

    const beniDisponibiliPerSelezione = (index: number) => {
        const beneCorrente = beniSelezionati[index];
        return beni.filter(b => 
            b.quantity > 0 && 
            (b.id === beneCorrente.beneId || !beniSelezionati.some(bs => bs.beneId === b.id && beniSelezionati.indexOf(bs) !== index))
        );
    };

    return (
        <>
            <DashboardLayout
                title="Crea Pacco"
                subtitle="Assegna più beni contemporaneamente a un beneficiario o famiglia"
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beni">
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Caricamento dati...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
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

                            {/* Beni del Pacco */}
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-display text-lg font-semibold text-foreground">
                                        Beni del Pacco
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={aggiungiBene}
                                        disabled={beni.length === 0 || beniSelezionati.length >= beni.length}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Aggiungi Bene
                                    </Button>
                                </div>

                                {beniSelezionati.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Nessun bene aggiunto al pacco.</p>
                                        <p className="text-sm mt-1">Clicca su "Aggiungi Bene" per iniziare.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {beniSelezionati.map((beneSel, index) => (
                                            <div
                                                key={index}
                                                className="p-4 bg-secondary rounded-xl border border-border"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                    <div className="md:col-span-6">
                                                        <label className="block text-sm font-medium text-foreground mb-2">
                                                            Bene <span className="text-destructive">*</span>
                                                        </label>
                                                        <select
                                                            value={beneSel.beneId}
                                                            onChange={(e) => aggiornaBene(index, "beneId", e.target.value)}
                                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            <option value="">Seleziona un bene...</option>
                                                            {beniDisponibiliPerSelezione(index).map((bene) => (
                                                                <option key={bene.id} value={bene.id}>
                                                                    {bene.name} ({bene.quantity} {bene.unit} disponibili)
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <label className="block text-sm font-medium text-foreground mb-2">
                                                            Quantità <span className="text-destructive">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={beneSel.disponibile}
                                                            value={beneSel.quantita}
                                                            onChange={(e) => aggiornaBene(index, "quantita", e.target.value)}
                                                            placeholder="0"
                                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Max: {beneSel.disponibile} {beneSel.unita}
                                                        </p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => rimuoviBene(index)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Note */}
                            <div className="bg-card rounded-2xl border border-border p-6">
                                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                    Note del Pacco (opzionale)
                                </h3>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Aggiungi note sul pacco..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
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
                                    disabled={submitting || beniSelezionati.length === 0}
                                >
                                    <Save className="w-4 h-4" />
                                    {submitting ? "Creazione pacco..." : `Crea Pacco (${beniSelezionati.length} beni)`}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
};

const CreaPacco = () => {
    return (
        <Suspense fallback={
            <DashboardLayout
                title="Crea Pacco"
                subtitle="Assegna più beni contemporaneamente a un beneficiario o famiglia"
            >
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm text-muted-foreground">Caricamento...</p>
                </div>
            </DashboardLayout>
        }>
            <CreaPaccoContent />
        </Suspense>
    );
};

export default CreaPacco;

