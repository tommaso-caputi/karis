"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function InvitoSignupPage() {
    const router = useRouter();
    const params = useParams<{ token: string }>();
    const token = params?.token ?? "";

    const [form, setForm] = useState({
        email: "",
        password: "",
        nome: "",
        cognome: "",
        cf: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        setSubmitting(true);
        try {
            // 1) signup standard (non-admin)
            const { data, error } = await supabase.auth.signUp({
                email: form.email.trim(),
                password: form.password,
            });

            if (error || !data.user) {
                alert(error?.message ?? "Errore signup.");
                return;
            }

            // 2) accetta invito -> crea record su tabella utente con id = auth user id
            const res = await fetch("/api/inviti/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    userId: data.user.id,
                    nome: form.nome.trim(),
                    cognome: form.cognome.trim(),
                    cf: form.cf.trim() || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err?.error ?? "Errore accettazione invito.");
                return;
            }

            // Se l'istanza Supabase richiede conferma email, la session potrebbe essere null.
            // In quel caso l'utente NON potrà fare login finché non conferma.
            if (!data.session) {
                alert(
                    "Account creato! Prima di accedere devi confermare l'email: controlla la posta (anche spam) e clicca sul link di conferma."
                );
            } else {
                alert("Registrazione completata! Ora puoi accedere.");
            }
            router.replace("/login");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
            <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-card">
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">Invito KARIS</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    Completa la registrazione: verrai associato come <b>Volontario</b> alla parrocchia dell’amministratore.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        required
                        disabled={submitting}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        required
                        disabled={submitting}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            placeholder="Nome"
                            value={form.nome}
                            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                            required
                            disabled={submitting}
                        />
                        <Input
                            placeholder="Cognome"
                            value={form.cognome}
                            onChange={(e) => setForm((p) => ({ ...p, cognome: e.target.value }))}
                            required
                            disabled={submitting}
                        />
                    </div>
                    <Input
                        placeholder="CF (opzionale)"
                        value={form.cf}
                        onChange={(e) => setForm((p) => ({ ...p, cf: e.target.value }))}
                        disabled={submitting}
                    />

                    <Button className="w-full" type="submit" disabled={submitting || !token}>
                        {submitting ? "Registrazione..." : "Accetta invito"}
                    </Button>
                </form>
            </div>
        </div>
    );
}


