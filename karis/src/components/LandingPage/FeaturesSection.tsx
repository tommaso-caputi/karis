import {
    Package,
    Users,
    BarChart3,
    RefreshCw,
    Bell,
    Shield,
    Smartphone,
    Globe
} from "lucide-react";

const features = [
    {
        icon: <Package className="w-6 h-6" />,
        title: "Gestione Risorse",
        description: "Registra e monitora alimentari, abbigliamento, medicinali e altri beni in tempo reale.",
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Anagrafica Utenti",
        description: "Gestisci beneficiari, volontari e amministratori con profili dettagliati e storici.",
    },
    {
        icon: <RefreshCw className="w-6 h-6" />,
        title: "Scambio inter-parrocchiale",
        description: "Richiedi e condividi risorse tra parrocchie diverse per una distribuzione ottimale.",
    },
    {
        icon: <BarChart3 className="w-6 h-6" />,
        title: "Dashboard & Report",
        description: "Visualizza statistiche, trend e genera report per la Caritas Diocesana.",
    },
    {
        icon: <Bell className="w-6 h-6" />,
        title: "Notifiche Smart",
        description: "Ricevi avvisi su scorte in esaurimento, nuove donazioni e richieste urgenti.",
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: "Sicurezza GDPR",
        description: "Protezione dati dei beneficiari secondo le normative europee sulla privacy.",
    },
    {
        icon: <Smartphone className="w-6 h-6" />,
        title: "Mobile First",
        description: "Interfaccia ottimizzata per smartphone, perfetta per i volontari sul campo.",
    },
    {
        icon: <Globe className="w-6 h-6" />,
        title: "Sempre Connessi",
        description: "Accesso da qualsiasi dispositivo con sincronizzazione in tempo reale.",
    },
];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        Funzionalità
                    </span>
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Tutto ciò che serve per{" "}
                        <span className="text-gradient">gestire la carità</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Una piattaforma completa per digitalizzare e ottimizzare
                        l'operatività quotidiana dei centri Caritas.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            delay={index * 100}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeatureCard = ({
    icon,
    title,
    description,
    delay,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    delay: number;
}) => (
    <div
        className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary group-hover:text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
            {description}
        </p>
    </div>
);

export default FeaturesSection;
