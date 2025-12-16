"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
/* import { toast } from "sonner"; */

const ContactSection = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        parish: "",
        message: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        /* toast.success("Messaggio inviato!", {
            description: "Ti risponderemo il prima possibile.",
        }); */
        setFormData({ name: "", email: "", parish: "", message: "" });
    };

    return (
        <section id="contact" className="py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Left Content */}
                    <div>
                        <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                            Contatti
                        </span>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                            Vuoi portare KARIS{" "}
                            <span className="text-gradient">nella tua parrocchia?</span>
                        </h2>
                        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                            Siamo qui per aiutarti a iniziare. Contattaci per una dimostrazione
                            gratuita o per qualsiasi domanda sulla piattaforma.
                        </p>

                        <div className="space-y-6">
                            <ContactInfo
                                icon={<Mail className="w-5 h-5" />}
                                label="Email"
                                value="info@karis.caritas.it"
                            />
                            <ContactInfo
                                icon={<Phone className="w-5 h-5" />}
                                label="Telefono"
                                value="+39 06 1234567"
                            />
                            <ContactInfo
                                icon={<MapPin className="w-5 h-5" />}
                                label="Sede"
                                value="Via della Carità, 1 - Roma"
                            />
                        </div>
                    </div>

                    {/* Right Form */}
                    <div className="p-8 rounded-3xl bg-card border border-border shadow-card">
                        <h3 className="font-display text-2xl font-semibold text-foreground mb-6">
                            Richiedi informazioni
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Nome e Cognome
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Mario Rossi"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="mario.rossi@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Parrocchia
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Parrocchia San Giovanni"
                                    value={formData.parish}
                                    onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Messaggio
                                </label>
                                <Textarea
                                    placeholder="Come possiamo aiutarti?"
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" variant="default" size="lg" className="w-full">
                                Invia messaggio
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContactInfo = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) => (
    <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
            {icon}
        </div>
        <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="font-medium text-foreground">{value}</div>
        </div>
    </div>
);

export default ContactSection;
