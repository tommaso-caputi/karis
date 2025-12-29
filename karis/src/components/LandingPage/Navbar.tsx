"use client";

import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <img
                            src="/favicon.ico"
                            alt="KARIS logo"
                            className="w-16 h-16 align-middle"
                        />
                        <span className="font-display text-2xl font-semibold text-foreground leading-none align-middle">
                            KARIS
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                            Funzionalità
                        </a>
                        <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                            Chi siamo
                        </a>
                        <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                            Contatti
                        </a>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="default" asChild>
                            <Link href="/login">Accedi</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-border animate-fade-up">
                        <div className="flex flex-col gap-4">
                            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                Funzionalità
                            </a>
                            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                Chi siamo
                            </a>
                            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                                Contatti
                            </a>
                            <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                <Button variant="default" asChild className="justify-start">
                                    <Link href="/login">Accedi</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
