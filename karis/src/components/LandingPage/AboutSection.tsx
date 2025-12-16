import { Heart, Target, Lightbulb } from "lucide-react";

const AboutSection = () => {
    return (
        <section id="about" className="py-24 bg-background">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div>
                        <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            Chi siamo
                        </span>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Una missione di{" "}
                            <span className="text-gradient">solidarietà digitale</span>
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            KARIS nasce dalla necessità di modernizzare la gestione delle risorse
                            nelle Caritas parrocchiali. La nostra visione è quella di creare una
                            rete interconnessa dove ogni donazione trova la sua destinazione ideale
                            e ogni persona in difficoltà riceve l'aiuto necessario nel minor tempo possibile.
                        </p>

                        <div className="space-y-6">
                            <ValueCard
                                icon={<Heart className="w-5 h-5" />}
                                title="Missione"
                                description="Digitalizzare la carità per renderla più efficiente, tracciabile e capillare."
                            />
                            <ValueCard
                                icon={<Target className="w-5 h-5" />}
                                title="Obiettivo"
                                description="Ridurre sprechi e tempi di risposta, migliorando il supporto alle famiglie."
                            />
                            <ValueCard
                                icon={<Lightbulb className="w-5 h-5" />}
                                title="Innovazione"
                                description="Tecnologie moderne al servizio di una delle più antiche forme di solidarietà."
                            />
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-warm opacity-10 rounded-3xl blur-3xl" />
                        <div className="relative grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="p-8 rounded-2xl bg-card border border-border shadow-card">
                                    <div className="text-4xl font-display font-bold text-primary mb-2">100%</div>
                                    <div className="text-muted-foreground">Tracciabilità donazioni</div>
                                </div>
                                <div className="p-8 rounded-2xl bg-accent text-accent-foreground">
                                    <div className="text-4xl font-display font-bold mb-2">24/7</div>
                                    <div className="text-accent-foreground/80">Accesso alla piattaforma</div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-8">
                                <div className="p-8 rounded-2xl bg-gradient-warm text-primary-foreground">
                                    <div className="text-4xl font-display font-bold mb-2">-50%</div>
                                    <div className="text-primary-foreground/80">Tempi di risposta</div>
                                </div>
                                <div className="p-8 rounded-2xl bg-card border border-border shadow-card">
                                    <div className="text-4xl font-display font-bold text-foreground mb-2">0</div>
                                    <div className="text-muted-foreground">Sprechi di risorse</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ValueCard = ({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) => (
    <div className="flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-foreground mb-1">{title}</h4>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);

export default AboutSection;
