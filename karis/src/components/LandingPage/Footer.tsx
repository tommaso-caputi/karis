import { Heart } from "lucide-react";
import Link from "next/link";

const Footer = () => {
    return (
        <footer className="bg-accent text-accent-foreground py-16">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                                <Heart className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="font-display text-2xl font-semibold">KARIS</span>
                        </Link>
                        <p className="text-accent-foreground/70 leading-relaxed max-w-md">
                            La piattaforma che digitalizza la solidarietà, connettendo
                            i centri Caritas per un aiuto più efficiente e tempestivo.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Link Utili</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#features" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Funzionalità
                                </a>
                            </li>
                            <li>
                                <a href="#about" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Chi siamo
                                </a>
                            </li>
                            <li>
                                <a href="#contact" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Contatti
                                </a>
                            </li>
                            <li>
                                <Link href="/login" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Accedi
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">Legale</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="#" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Cookie Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    Termini di Servizio
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-accent-foreground/70 hover:text-accent-foreground transition-colors">
                                    GDPR
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-accent-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-accent-foreground/60 text-sm">
                        © 2024 KARIS. Tutti i diritti riservati.
                    </p>
                    <p className="text-accent-foreground/60 text-sm flex items-center gap-1">
                        Fatto con <Heart className="w-4 h-4 text-primary" /> per la comunità
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
