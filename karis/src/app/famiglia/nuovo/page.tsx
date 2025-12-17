"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    Users,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const NuovaFamiglia = () => {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        cognome: "",
        note: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cognome) {
            toast.error("Il cognome è obbligatorio");
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

            const res = await fetch("/api/famiglia", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    cognome: formData.cognome,
                    note: formData.note || null,
                }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => null);
                console.error("Errore risposta /api/famiglia (POST):", errorBody || res.statusText);
                const errorMessage = errorBody?.error || "Errore nel salvataggio della famiglia.";
                toast.error(errorMessage);
                return;
            }

            toast.success("Famiglia creata con successo!");
            router.push("/beneficiario");
        } catch (error) {
            console.error("Errore durante il salvataggio della famiglia:", error);
            toast.error("Si è verificato un errore inatteso.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <DashboardLayout
                title="Nuova Famiglia"
                subtitle="Crea una nuova famiglia"
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/beneficiario">
                            <ArrowLeft className="w-4 h-4" />
                            Annulla
                        </Link>
                    </Button>
                }
            >
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="font-display text-lg font-semibold text-foreground">
                                    Informazioni Famiglia
                                </h3>
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

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Note (opzionale)
                                </label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Aggiungi note sulla famiglia..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                            <Button variant="outline" type="button" className="flex-1" asChild>
                                <Link href="/beneficiario">Annulla</Link>
                            </Button>
                            <Button variant="default" type="submit" className="flex-1" disabled={submitting}>
                                <Save className="w-4 h-4" />
                                {submitting ? "Salvataggio..." : "Salva Famiglia"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </>
    );
};

export default NuovaFamiglia;

