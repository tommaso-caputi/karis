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

const Dashboard = () => {
    return (
        <>
            <DashboardLayout
                title="Dashboard"
                subtitle="Parrocchia San Giovanni Battista"
                actions={
                    <Button variant="default" asChild>
                        <Link href="/beni/nuovo">
                            <Plus className="w-4 h-4" />
                            Nuovo Bene
                        </Link>
                    </Button>
                }
            >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Beni Totali"
                        value="1,234"
                        change="+12%"
                        trend="up"
                        icon={<Package className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Scorte Basse"
                        value="8"
                        change="+2"
                        trend="down"
                        icon={<AlertCircle className="w-5 h-5" />}
                    />
                    <StatCard
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
                    />
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quick Inventory Preview */}
                    <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-display text-xl font-semibold text-foreground">
                                Beni con Scorte Basse
                            </h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/beni">Vedi tutti</Link>
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <BeneRow
                                name="Latte UHT (1L)"
                                category="Alimentari"
                                quantity={12}
                                threshold={20}
                            />
                            <BeneRow
                                name="Giacche Invernali"
                                category="Abbigliamento"
                                quantity={8}
                                threshold={15}
                            />
                            <BeneRow
                                name="Paracetamolo"
                                category="Medicinali"
                                quantity={5}
                                threshold={10}
                            />
                            <BeneRow
                                name="Pannolini Taglia 3"
                                category="Altro"
                                quantity={18}
                                threshold={25}
                            />
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800 dark:text-amber-200">Attenzione</p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        8 beni hanno raggiunto la soglia di allarme. Considera di richiedere forniture ad altre parrocchie.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100" asChild>
                                        <Link href="/richieste">
                                            <Send className="w-4 h-4 mr-2" />
                                            Invia Richiesta
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-card rounded-2xl border border-border p-6">
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
                    </div>
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
    threshold,
}: {
    name: string;
    category: string;
    quantity: number;
    threshold: number;
}) => {
    const percentage = (quantity / threshold) * 100;

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
                    {quantity} / {threshold}
                </div>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
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
