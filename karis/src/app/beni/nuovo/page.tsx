"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Apple,
    Shirt,
    Pill,
    Box,
    Save,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Category = "alimentari" | "abbigliamento" | "medicinali" | "altro";

const categories = [
    { id: "alimentari" as Category, label: "Alimentari", icon: Apple, color: "green" },
    { id: "abbigliamento" as Category, label: "Abbigliamento", icon: Shirt, color: "blue" },
    { id: "medicinali" as Category, label: "Medicinali", icon: Pill, color: "red" },
    { id: "altro" as Category, label: "Altro", icon: Box, color: "gray" },
];

const NuovoBene = () => {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "" as Category | "",
        quantity: "",
        unit: "pezzi",
        description: "",
        scadenza: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.category || !formData.quantity) {
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
                console.error("Errore nel recupero dell'utente autenticato per il salvataggio del bene:", authError);
                toast.error("Utente non autenticato.");
                return;
            }

            const res = await fetch("/api/beni", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    name: formData.name,
                    category: formData.category,
                    quantity: Number(formData.quantity),
                    unit: formData.unit,
                    description: formData.description || null,
                    scadenza: formData.scadenza || null,
                }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                console.error("Errore risposta /api/beni (POST):", errorBody || res.statusText);
                toast.error("Errore nel salvataggio del bene.");
                return;
            }

            toast.success("Bene aggiunto con successo!");
            router.push("/beni");
        } catch (error) {
            console.error("Errore durante il salvataggio del bene:", error);
            toast.error("Si è verificato un errore inatteso.");
        } finally {
            setSubmitting(false);
        }
    };

    const colorClasses = {
        green: "border-green-500 bg-green-50 dark:bg-green-950/50 text-green-700",
        blue: "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700",
        red: "border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700",
        gray: "border-gray-500 bg-gray-50 dark:bg-gray-800/50 text-gray-700",
    };

    return (
        <>

            <DashboardLayout
                title="Nuovo Bene"
                subtitle="Aggiungi un bene all'inventario"
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beni">
                            <ArrowLeft className="w-4 h-4" />
                            Annulla
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Selection */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <label className="block font-medium text-foreground mb-4">
                                Categoria <span className="text-destructive">*</span>
                            </label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {categories.map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = formData.category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${isSelected
                                                ? colorClasses[cat.color as keyof typeof colorClasses]
                                                : "border-border bg-secondary/50 hover:border-muted-foreground"
                                                }`}
                                        >
                                            <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? "" : "text-muted-foreground"}`} />
                                            <span className={`text-sm font-medium ${isSelected ? "" : "text-foreground"}`}>
                                                {cat.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                Informazioni Bene
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Nome del bene <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="es. Pasta Barilla 500g"
                                    className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Descrizione (opzionale)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Aggiungi dettagli come marca, taglia, scadenza..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                        </div>

                        {/* Scadenza (solo per alimentari e medicinali) */}
                        {(formData.category === "alimentari" || formData.category === "medicinali") && (
                            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                                <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                    Scadenza
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Data di scadenza (opzionale)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.scadenza}
                                        onChange={(e) => setFormData({ ...formData, scadenza: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Inserisci la data di scadenza per ricevere avvisi quando il bene scade o è in scadenza.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Quantity & Unit */}
                        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                                Quantità e Soglie
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Quantità iniziale <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Unità di misura
                                    </label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="pezzi">Pezzi</option>
                                        <option value="kg">Chilogrammi (kg)</option>
                                        <option value="litri">Litri</option>
                                        <option value="pacchi">Pacchi</option>
                                        <option value="scatole">Scatole</option>
                                        <option value="confezioni">Confezioni</option>
                                        <option value="bottiglie">Bottiglie</option>
                                    </select>
                                </div>
                            </div>

                            {/* <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            <strong>Soglia di allarme:</strong> Riceverai una notifica quando la quantità scende sotto questo valore.
                                        </p>
                                    </div>
                                </div>
                            </div> */}
                        </div>

                        {/* Submit */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                            <Button variant="outline" type="button" className="flex-1" asChild>
                                <Link href="/beni">Annulla</Link>
                            </Button>
                            <Button variant="default" type="submit" className="flex-1" disabled={submitting}>
                                <Save className="w-4 h-4" />
                                {submitting ? "Salvataggio..." : "Salva Bene"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </>
    );
};

export default NuovoBene;
