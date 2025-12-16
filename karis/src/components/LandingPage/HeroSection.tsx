import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Users, Share2 } from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
    return (
        <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-gradient-hero">
            {/* Decorative elements */}
            <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float animation-delay-200" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8 animate-fade-up">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm text-muted-foreground">
                            Gestione risorse parrocchiali
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 animate-fade-up animation-delay-100">
                        Condividere per{" "}
                        <span className="text-gradient">crescere insieme</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-up animation-delay-200">
                        KARIS digitalizza e sincronizza la gestione delle risorse tra i centri Caritas,
                        rendendo l'aiuto più efficiente e tempestivo per chi ne ha bisogno.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up animation-delay-300">
                        <Button variant="default" size="lg" asChild>
                            <Link href="/dashboard">
                                Inizia ora
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <a href="#features">Scopri di più</a>
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up animation-delay-400">
                        <StatCard
                            icon={<Package className="w-6 h-6" />}
                            number="10,000+"
                            label="Risorse gestite"
                        />
                        <StatCard
                            icon={<Users className="w-6 h-6" />}
                            number="500+"
                            label="Famiglie supportate"
                        />
                        <StatCard
                            icon={<Share2 className="w-6 h-6" />}
                            number="50+"
                            label="Parrocchie connesse"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const StatCard = ({
    icon,
    number,
    label,
}: {
    icon: React.ReactNode;
    number: string;
    label: string;
}) => (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-glow transition-all duration-300 group">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            {icon}
        </div>
        <div className="text-3xl font-display font-bold text-foreground mb-1">
            {number}
        </div>
        <div className="text-muted-foreground">{label}</div>
    </div>
);

export default HeroSection;
