"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Package,
    TrendingUp,
    Clock,
    Plus,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Send,
    Inbox
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UserData {
    nome: string;
    cognome: string;
    parrocchia: string | null;
    ruolo?: string | null;
}

interface Bene {
    id: string;
    name: string;
    category: string | null;
    quantity: number;
    unit: string;
    updated_at: string | null;
}

interface DashboardSummary {
    days: number;
    assegnazioni_count: number;
    quantita_assegnata: number;
}

const Dashboard = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [beni, setBeni] = useState<Bene[]>([]);
    const [loadingBeni, setLoadingBeni] = useState(true);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("Errore nel recupero dell'utente autenticato:", authError);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/user?userId=${user.id}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/user:", await res.json());
                    setLoading(false);
                    return;
                }
                const data: UserData = await res.json();
                setUserData(data);
            } catch (e) {
                console.error("Errore chiamata /api/user:", e);
            } finally {
                setLoading(false);
            }
        };

        void loadUser();
    }, []);

    useEffect(() => {
        const loadBeni = async () => {
            if (!supabase) {
                setLoadingBeni(false);
                return;
            }

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error("Errore nel recupero dell'utente autenticato per i beni:", authError);
                setLoadingBeni(false);
                return;
            }

            try {
                const res = await fetch(`/api/beni?userId=${user.id}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/beni:", await res.json());
                    setLoadingBeni(false);
                    return;
                }
                const data: Bene[] = await res.json();
                setBeni(data);
            } catch (e) {
                console.error("Errore chiamata /api/beni:", e);
            } finally {
                setLoadingBeni(false);
            }
        };

        void loadBeni();
    }, []);

    useEffect(() => {
        const loadSummary = async () => {
            if (!supabase) {
                setLoadingSummary(false);
                return;
            }

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                setLoadingSummary(false);
                return;
            }

            try {
                const res = await fetch(`/api/dashboard/summary?userId=${user.id}&days=7`);
                if (!res.ok) {
                    setLoadingSummary(false);
                    return;
                }
                const data: DashboardSummary = await res.json();
                setSummary(data);
            } finally {
                setLoadingSummary(false);
            }
        };

        void loadSummary();
    }, []);

    const subtitle = loading
        ? "Caricamento dati utente..."
        : (() => {
            const parts: string[] = [];
            const ruolo = (userData?.ruolo ?? "").trim();
            if (ruolo) parts.push(ruolo);
            if (userData?.parrocchia) parts.push(`Parrocchia ${userData.parrocchia}`);
            return parts.length > 0 ? parts.join(" · ") : "Dati utente non disponibili";
        })();

    const totalQuantity = beni.reduce((sum, bene) => sum + bene.quantity, 0);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const recentUpdatesCount = beni.filter(bene => {
        if (!bene.updated_at) return false;
        const updatedAtDate = new Date(bene.updated_at);
        return updatedAtDate >= threeDaysAgo;
    }).length;

    const beniTrend: "up" | "down" = recentUpdatesCount > 0 ? "up" : "down";

    const beniChangeLabel = loadingBeni
        ? ""
        : recentUpdatesCount === 0
            ? "Nessuna modifica"
            : `${recentUpdatesCount} beni aggiornati`;

    return (
        <>
            <DashboardLayout
                title={userData ? `Ciao, ${userData.nome} ${userData.cognome}` : "Dashboard"}
                subtitle={subtitle}
            >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Beni Totali"
                        value={loadingBeni ? "..." : totalQuantity.toString()}
                        change={beniChangeLabel}
                        trend={beniTrend}
                        icon={<Package className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Consegne (7 giorni)"
                        value={loadingSummary ? "..." : (summary?.assegnazioni_count ?? 0).toString()}
                        change={
                            loadingSummary
                                ? ""
                                : `${summary?.quantita_assegnata ?? 0} pezzi assegnati`
                        }
                        trend={(summary?.assegnazioni_count ?? 0) > 0 ? "up" : "down"}
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    {/* <StatCard
                        title="Richieste Inviate"
                        value="5"
                        change="+3"
                        trend="up"
                        icon={<Send className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Richieste Ricevute"
                        value="7"
                        change="+2"
                        trend="up"
                        icon={<Inbox className="w-5 h-5" />}
                    /> */}
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quick Inventory Preview */}
                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-display text-xl font-semibold text-foreground">
                                Beni in magazzino
                            </h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/beni">Vedi tutti</Link>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {loadingBeni && (
                                <p className="text-sm text-muted-foreground">
                                    Caricamento beni...
                                </p>
                            )}
                            {!loadingBeni && beni.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Nessun bene presente in magazzino.
                                </p>
                            )}
                            {!loadingBeni &&
                                beni
                                    .slice(0, 4)
                                    .map((bene) => (
                                        <BeneRow
                                            key={bene.id}
                                            name={bene.name}
                                            category={bene.category ?? "Altro"}
                                            quantity={bene.quantity}
                                        />
                                    ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {/* <div className="bg-card rounded-2xl border border-border p-6">
                        <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                            Attività Recente
                        </h2>
                        <div className="space-y-4">
                            <ActivityItem
                                icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
                                title="Richiesta accettata"
                                description="Parr. S. Maria - 20 kg pasta"
                                time="5 min fa"
                            />
                            <ActivityItem
                                icon={<Plus className="w-4 h-4 text-primary" />}
                                title="Nuovo bene aggiunto"
                                description="50 scatolette tonno"
                                time="1 ora fa"
                            />
                            <ActivityItem
                                icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
                                title="Scorta bassa"
                                description="Latte UHT sotto soglia"
                                time="2 ore fa"
                            />
                            <ActivityItem
                                icon={<Send className="w-4 h-4 text-accent" />}
                                title="Richiesta inviata"
                                description="30 coperte a Parr. S. Paolo"
                                time="3 ore fa"
                            />
                            <ActivityItem
                                icon={<Inbox className="w-4 h-4 text-primary" />}
                                title="Nuova richiesta"
                                description="Parr. S. Pietro chiede medicinali"
                                time="5 ore fa"
                            />
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-primary" asChild>
                            <Link href="/richieste">Vedi tutte le richieste</Link>
                        </Button>
                    </div> */}
                </div>
            </DashboardLayout>
        </>
    );
};

const StatCard = ({
    title,
    value,
    change,
    trend,
    icon,
}: {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: React.ReactNode;
}) => (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-glow transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-sm ${trend === "up" ? "text-green-600" : "text-amber-600"
                }`}>
                {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {change}
            </div>
        </div>
        <div className="text-2xl font-display font-bold text-foreground mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
    </div>
);

const BeneRow = ({
    name,
    category,
    quantity,
}: {
    name: string;
    category: string;
    quantity: number;
}) => {
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
            <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{name}</div>
                <div className="text-sm text-muted-foreground">{category}</div>
            </div>
            <div className="text-right">
                <div className="font-semibold text-amber-600">
                    {quantity}
                </div>
            </div>
        </div>
    );
};

const ActivityItem = ({
    icon,
    title,
    description,
    time,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    time: string;
}) => (
    <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground text-sm">{title}</div>
            <div className="text-xs text-muted-foreground truncate">{description}</div>
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">{time}</div>
    </div>
);

export default Dashboard;
