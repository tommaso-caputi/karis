"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const getLoginErrorMessage = (status?: number, rawMessage?: string | null) => {
    const normalized = (rawMessage ?? "").toLowerCase();

    const isInvalidCredentials =
        status === 400 ||
        normalized.includes("invalid login credentials") ||
        normalized.includes("invalid email or password");

    if (isInvalidCredentials) {
        return "Email o password non corretti.";
    }

    return rawMessage || "Si è verificato un errore durante l'accesso. Riprova più tardi.";
};

const Login = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Ripristina email salvata
        const savedEmail = window.localStorage.getItem("karis_login_email");
        if (savedEmail) {
            setFormData((prev) => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }

        // Se l'utente è già autenticato e ha selezionato "Ricordami", vai direttamente in dashboard
        const shouldRemember = window.localStorage.getItem("karis_remember_me") === "true";

        if (!supabase || !shouldRemember) return;

        void supabase.auth.getUser().then(({ data, error }) => {
            if (error) {
                return;
            }
            if (data?.user) {
                router.replace("/dashboard");
            }
        });
    }, [router]);

    const handleRememberMeChange = () => {
        setRememberMe((prev) => !prev);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!supabase) {
            return;
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                alert(getLoginErrorMessage(error.status, error.message));
                return;
            }

            // Salva preferenze di "Ricordami" + UUID utente per usi futuri
            if (typeof window !== "undefined") {
                if (rememberMe) {
                    window.localStorage.setItem("karis_login_email", formData.email);
                    window.localStorage.setItem("karis_remember_me", "true");
                } else {
                    window.localStorage.removeItem("karis_login_email");
                    window.localStorage.removeItem("karis_remember_me");
                }

                const userId = data?.user?.id;
                if (userId) {
                    window.localStorage.setItem("karis_user_id", userId);
                }
            }

            toast.success("Accesso effettuato!", {
                description: "Benvenuto nella dashboard KARIS.",
            });
            router.push("/dashboard");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
                {/* Decorative elements */}
                <div className="fixed top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="fixed bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

                <div className="w-full max-w-md relative z-10">
                    {/* Back Link */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Torna alla home
                    </Link>

                    {/* Login Card */}
                    <div className="p-8 rounded-3xl bg-card border border-border shadow-card animate-scale-in">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center shadow-soft">
                                <Heart className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="font-display text-3xl font-semibold text-foreground">
                                KARIS
                            </span>
                        </div>

                        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-2">
                            Bentornato
                        </h1>
                        <p className="text-muted-foreground text-center mb-8">
                            Accedi per gestire i beni della tua parrocchia
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder=""
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    placeholder=""
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded border-border"
                                        checked={rememberMe}
                                        onChange={handleRememberMeChange}
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-muted-foreground">Ricordami</span>
                                </label>
                                <a href="#" className="text-primary hover:underline">
                                    Password dimenticata?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                variant="default"
                                size="lg"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Accesso in corso..." : "Accedi"}
                                <LogIn className="w-4 h-4" />
                            </Button>
                        </form>

                        <p className="text-center text-muted-foreground text-sm mt-6">
                            Non hai un account?{" "}
                            <a href="/#contact" className="text-primary hover:underline">
                                Richiedi accesso
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
