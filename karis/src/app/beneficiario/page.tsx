"use client";

import { Button } from "@/components/ui/button";
import {
    User,
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Users,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Famiglia {
    id: string;
    cognome: string;
    note: string | null;
    beneficiari: Array<{
        id: string;
        nome: string;
        cognome: string;
        cf: string | null;
    }>;
}

const Beneficiario = () => {
    const [beneficiari, setBeneficiari] = useState<Beneficiario[]>([]);
    const [famiglie, setFamiglie] = useState<Famiglia[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingFamiglie, setLoadingFamiglie] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBeneficiari = async () => {
            if (!supabase) {
                setLoading(false);
                setError("Supabase non è configurato.");
                return;
            }

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("Errore nel recupero dell'utente autenticato per i beneficiari:", authError);
                setError("Utente non autenticato.");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/beneficiario?userId=${user.id}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/beneficiario:", await res.json());
                    setError("Errore nel caricamento dei beneficiari.");
                    setLoading(false);
                    return;
                }
                const data: Beneficiario[] = await res.json();
                setBeneficiari(data);
            } catch (e) {
                console.error("Errore chiamata /api/beneficiario:", e);
                setError("Errore nel caricamento dei beneficiari.");
            } finally {
                setLoading(false);
            }
        };

        void loadBeneficiari();
    }, []);

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
                const res = await fetch(`/api/famiglia?userId=${user.id}`);
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

    const filteredBeneficiari = beneficiari.filter(beneficiario => {
        const fullName = `${beneficiario.nome} ${beneficiario.cognome}`.toLowerCase();
        const cf = beneficiario.cf?.toLowerCase() || "";
        const searchLower = searchQuery.toLowerCase();
        return fullName.includes(searchLower) || cf.includes(searchLower);
    });

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("it-IT", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        } catch {
            return "-";
        }
    };

    return (
        <>
            <DashboardLayout
                title="Gestione Beneficiari"
                subtitle={
                    loading
                        ? "Caricamento beneficiari..."
                        : `${beneficiari.length} beneficiari totali`
                }
                actions={
                    <Button variant="default" asChild>
                        <Link href="/beneficiario/nuovo">
                            <Plus className="w-4 h-4" />
                            Nuovo Beneficiario
                        </Link>
                    </Button>
                }
            >
                {/* Search */}
                <div className="bg-card rounded-2xl border border-border p-4 mb-6">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cerca beneficiari per nome, cognome o codice fiscale..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Beneficiari List */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/50 text-sm font-medium text-muted-foreground border-b border-border">
                        <div className="col-span-3">Nome</div>
                        <div className="col-span-2">Cognome</div>
                        <div className="col-span-2">Codice Fiscale</div>
                        <div className="col-span-2">Data di Nascita</div>
                        <div className="col-span-2">Famiglia</div>
                        <div className="col-span-1 text-right">Azioni</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="text-muted-foreground">Caricamento...</div>
                            </div>
                        ) : error ? (
                            <div className="p-12 text-center">
                                <div className="text-destructive">{error}</div>
                            </div>
                        ) : filteredBeneficiari.length === 0 ? (
                            <div className="p-12 text-center">
                                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="font-semibold text-foreground mb-2">Nessun beneficiario trovato</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? "Prova a modificare la ricerca o aggiungi un nuovo beneficiario."
                                        : "Aggiungi un nuovo beneficiario per iniziare."}
                                </p>
                                <Button variant="default" asChild>
                                    <Link href="/beneficiario/nuovo">
                                        <Plus className="w-4 h-4" />
                                        Aggiungi Beneficiario
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            filteredBeneficiari.map((beneficiario) => (
                                <BeneficiarioRow 
                                    key={beneficiario.id} 
                                    beneficiario={beneficiario}
                                    onDelete={async () => {
                                        if (!supabase) return;
                                        const {
                                            data: { user },
                                        } = await supabase.auth.getUser();
                                        if (!user) return;
                                        
                                        const res = await fetch(`/api/beneficiario?userId=${user.id}&id=${beneficiario.id}`, {
                                            method: 'DELETE',
                                        });
                                        
                                        if (res.ok) {
                                            setBeneficiari(beneficiari.filter(b => b.id !== beneficiario.id));
                                        } else {
                                            const error = await res.json();
                                            alert(error.error || "Errore nell'eliminazione del beneficiario.");
                                        }
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Famiglie Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary" />
                            <h2 className="font-display text-xl font-semibold text-foreground">
                                Famiglie
                            </h2>
                            <span className="text-sm text-muted-foreground">
                                ({famiglie.length} {famiglie.length === 1 ? "famiglia" : "famiglie"})
                            </span>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/famiglia/nuovo">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuova Famiglia
                            </Link>
                        </Button>
                    </div>

                    {loadingFamiglie ? (
                        <div className="bg-card rounded-2xl border border-border p-12 text-center">
                            <div className="text-muted-foreground">Caricamento famiglie...</div>
                        </div>
                    ) : famiglie.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border p-12 text-center">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">Nessuna famiglia trovata</h3>
                            <p className="text-muted-foreground mb-4">
                                Le famiglie verranno mostrate qui quando i beneficiari saranno associati a una famiglia.
                            </p>
                            <Button variant="default" asChild>
                                <Link href="/famiglia/nuovo">
                                    <Plus className="w-4 h-4" />
                                    Crea Prima Famiglia
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {famiglie.map((famiglia) => (
                                <div
                                    key={famiglia.id}
                                    className="bg-card rounded-2xl border border-border overflow-hidden"
                                >
                                    <div className="px-6 py-4 bg-secondary/50 border-b border-border">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Link 
                                                    href={`/famiglia/${famiglia.id}`}
                                                    className="font-semibold text-foreground text-lg hover:text-primary transition-colors block"
                                                >
                                                    Famiglia {famiglia.cognome}
                                                </Link>
                                                {famiglia.note && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {famiglia.note}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm text-muted-foreground">
                                                    {famiglia.beneficiari.length}{" "}
                                                    {famiglia.beneficiari.length === 1 ? "beneficiario" : "beneficiari"}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/famiglia/${famiglia.id}`} className="flex items-center">
                                                                <Users className="w-4 h-4 mr-2" />
                                                                Vedi Dettagli
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/famiglia/modifica?id=${famiglia.id}`} className="flex items-center">
                                                                <Edit2 className="w-4 h-4 mr-2" />
                                                                Modifica
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                if (window.confirm(`Sei sicuro di voler eliminare la famiglia "${famiglia.cognome}"?`)) {
                                                                    if (!supabase) return;
                                                                    const {
                                                                        data: { user },
                                                                    } = await supabase.auth.getUser();
                                                                    if (!user) return;
                                                                    
                                                                    const res = await fetch(`/api/famiglia?userId=${user.id}&id=${famiglia.id}`, {
                                                                        method: 'DELETE',
                                                                    });
                                                                    
                                                                    if (res.ok) {
                                                                        setFamiglie(famiglie.filter(f => f.id !== famiglia.id));
                                                                    } else {
                                                                        const error = await res.json();
                                                                        alert(error.error || "Errore nell'eliminazione della famiglia.");
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Elimina
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {famiglia.beneficiari.map((beneficiario) => (
                                            <div
                                                key={beneficiario.id}
                                                className="px-6 py-4 hover:bg-secondary/30 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <Link 
                                                                href={`/beneficiario/${beneficiario.id}`}
                                                                className="font-medium text-foreground hover:text-primary transition-colors block"
                                                            >
                                                                {beneficiario.nome} {beneficiario.cognome}
                                                            </Link>
                                                            {beneficiario.cf && (
                                                                <div className="text-sm text-muted-foreground font-mono">
                                                                    CF: {beneficiario.cf}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-foreground"
                                                        asChild
                                                    >
                                                        <Link href={`/beneficiario/${beneficiario.id}`}>
                                                            <User className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
};

const BeneficiarioRow = ({ beneficiario, onDelete }: { beneficiario: Beneficiario; onDelete: () => Promise<void> }) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("it-IT", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        } catch {
            return "-";
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 lg:px-6 py-4 hover:bg-secondary/30 transition-colors">
            {/* Name */}
            <div className="col-span-1 lg:col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <Link href={`/beneficiario/${beneficiario.id}`} className="font-medium text-foreground truncate hover:text-primary transition-colors block">
                        {beneficiario.nome}
                    </Link>
                    <div className="text-sm text-muted-foreground lg:hidden">{beneficiario.cognome}</div>
                </div>
            </div>

            {/* Cognome */}
            <div className="hidden lg:flex col-span-2 items-center">
                <Link href={`/beneficiario/${beneficiario.id}`} className="text-foreground hover:text-primary transition-colors">
                    {beneficiario.cognome}
                </Link>
            </div>

            {/* Codice Fiscale */}
            <div className="col-span-1 lg:col-span-2 flex items-center">
                <span className="text-foreground font-mono text-sm">
                    {beneficiario.cf || "-"}
                </span>
            </div>

            {/* Data di Nascita */}
            <div className="col-span-1 lg:col-span-2 flex items-center">
                <span className="text-foreground text-sm">
                    {formatDate(beneficiario.data_nascita)}
                </span>
            </div>

            {/* Famiglia */}
            <div className="col-span-1 lg:col-span-2 flex items-center">
                {beneficiario.famiglia ? (
                    <Link 
                        href={`/famiglia/${beneficiario.famiglia_id}`} 
                        className="text-foreground text-sm hover:text-primary transition-colors"
                    >
                        {beneficiario.famiglia}
                    </Link>
                ) : (
                    <span className="text-foreground text-sm">-</span>
                )}
            </div>

            {/* Actions */}
            <div className="col-span-1 lg:col-span-1 flex items-center justify-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    asChild
                >
                    <Link href={`/beneficiario/modifica?id=${beneficiario.id}`}>
                        <Edit2 className="w-4 h-4" />
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/beneficiario/${beneficiario.id}`} className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                Vedi Dettagli
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/beneficiario/modifica?id=${beneficiario.id}`} className="flex items-center">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Modifica
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                                e.preventDefault();
                                if (window.confirm(`Sei sicuro di voler eliminare il beneficiario ${beneficiario.nome} ${beneficiario.cognome}?`)) {
                                    void onDelete();
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Beneficiario;

