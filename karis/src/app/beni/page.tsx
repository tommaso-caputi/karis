"use client"

import { Button } from "@/components/ui/button";
import {
    Package,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    ChevronDown,
    Apple,
    Shirt,
    Pill,
    Box
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

type Category = "tutti" | "alimentari" | "abbigliamento" | "medicinali" | "altro";

interface Bene {
    id: string;
    name: string;
    category: Category;
    quantity: number;
    unit: string;
}

const mapApiCategoryToCategory = (cat: string | null): Category => {
    const c = (cat ?? "").toLowerCase();
    if (c.includes("aliment")) return "alimentari";
    if (c.includes("abbigl")) return "abbigliamento";
    if (c.includes("medic")) return "medicinali";
    return "altro";
};

const categoryIcons = {
    alimentari: Apple,
    abbigliamento: Shirt,
    medicinali: Pill,
    altro: Box,
};

const categoryLabels = {
    tutti: "Tutte le categorie",
    alimentari: "Alimentari",
    abbigliamento: "Abbigliamento",
    medicinali: "Medicinali",
    altro: "Altro",
};

const categoryColors = {
    alimentari: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    abbigliamento: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    medicinali: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    altro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const Beni = () => {
    const [beni, setBeni] = useState<Bene[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category>("tutti");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBeni = async () => {
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
                console.error("Errore nel recupero dell'utente autenticato per i beni:", authError);
                setError("Utente non autenticato.");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/beni?userId=${user.id}`);
                if (!res.ok) {
                    console.error("Errore risposta /api/beni:", await res.json());
                    setError("Errore nel caricamento dei beni.");
                    setLoading(false);
                    return;
                }
                const data: {
                    id: string;
                    name: string;
                    category: string | null;
                    quantity: number;
                    unit: string;
                }[] = await res.json();

                const mapped: Bene[] = data.map((b) => ({
                    id: b.id,
                    name: b.name,
                    category: mapApiCategoryToCategory(b.category),
                    quantity: b.quantity,
                    unit: b.unit,
                }));

                setBeni(mapped);
            } catch (e) {
                console.error("Errore chiamata /api/beni:", e);
                setError("Errore nel caricamento dei beni.");
            } finally {
                setLoading(false);
            }
        };

        void loadBeni();
    }, []);

    const filteredBeni = beni.filter(bene => {
        const matchesSearch = bene.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "tutti" || bene.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const stats = {
        total: beni.length,
        alimentari: beni.filter(b => b.category === "alimentari").length,
        abbigliamento: beni.filter(b => b.category === "abbigliamento").length,
        medicinali: beni.filter(b => b.category === "medicinali").length,
    };

    return (
        <>
            <DashboardLayout
                title="Gestione Beni"
                subtitle={
                    loading
                        ? "Caricamento beni..."
                        : `${stats.total} beni totali`
                }
                actions={
                    <Button variant="default" asChild>
                        <Link href="/beni/nuovo">
                            <Plus className="w-4 h-4" />
                            Nuovo Bene
                        </Link>
                    </Button>
                }
            >
                {/* Category Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <button
                        onClick={() => { setSelectedCategory("alimentari"); }}
                        className={`p-4 rounded-xl border transition-all ${selectedCategory === "alimentari"
                                ? "border-green-500 bg-green-50 dark:bg-green-950/50"
                                : "border-border bg-card hover:border-green-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <Apple className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-foreground">{stats.alimentari}</div>
                                <div className="text-sm text-muted-foreground">Alimentari</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => { setSelectedCategory("abbigliamento"); }}
                        className={`p-4 rounded-xl border transition-all ${selectedCategory === "abbigliamento"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50"
                                : "border-border bg-card hover:border-blue-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <Shirt className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-foreground">{stats.abbigliamento}</div>
                                <div className="text-sm text-muted-foreground">Abbigliamento</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => { setSelectedCategory("medicinali"); }}
                        className={`p-4 rounded-xl border transition-all ${selectedCategory === "medicinali"
                                ? "border-red-500 bg-red-50 dark:bg-red-950/50"
                                : "border-border bg-card hover:border-red-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <Pill className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-foreground">{stats.medicinali}</div>
                                <div className="text-sm text-muted-foreground">Medicinali</div>
                            </div>
                        </div>
                    </button>

                </div>

                {/* Filters */}
                <div className="bg-card rounded-2xl border border-border p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cerca beni..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Filter className="w-4 h-4" />
                                        {categoryLabels[selectedCategory]}
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {(Object.keys(categoryLabels) as Category[]).map((cat) => (
                                        <DropdownMenuItem
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); }}
                                        >
                                            {categoryLabels[cat]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {(selectedCategory !== "tutti" || searchQuery) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => { setSelectedCategory("tutti"); setSearchQuery(""); }}
                                >
                                    Rimuovi filtri
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Beni List */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/50 text-sm font-medium text-muted-foreground border-b border-border">
                        <div className="col-span-4">Bene</div>
                        <div className="col-span-3">Categoria</div>
                        <div className="col-span-3">Quantità</div>
                        <div className="col-span-2 text-right">Azioni</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-border">
                        {filteredBeni.map((bene) => (
                            <BeneRow key={bene.id} bene={bene} />
                        ))}
                    </div>

                    {filteredBeni.length === 0 && (
                        <div className="p-12 text-center">
                            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold text-foreground mb-2">Nessun bene trovato</h3>
                            <p className="text-muted-foreground mb-4">Prova a modificare i filtri o aggiungi un nuovo bene.</p>
                            <Button variant="default" asChild>
                                <Link href="/beni/nuovo">
                                    <Plus className="w-4 h-4" />
                                    Aggiungi Bene
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </>
    );
};

const BeneRow = ({ bene }: { bene: Bene }) => {
    const Icon = categoryIcons[bene.category as keyof typeof categoryIcons] || Box;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 lg:px-6 py-4 hover:bg-secondary/30 transition-colors">
            {/* Name & Icon */}
            <div className="col-span-1 lg:col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{bene.name}</div>
                    <div className="text-sm text-muted-foreground lg:hidden">{categoryLabels[bene.category]}</div>
                </div>
            </div>

            {/* Category */}
            <div className="hidden lg:flex col-span-3 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[bene.category as keyof typeof categoryColors]}`}>
                    {categoryLabels[bene.category]}
                </span>
            </div>

            {/* Quantity */}
            <div className="col-span-1 lg:col-span-3 flex items-center gap-4">
                <div className="flex-1 lg:flex-none">
                    <div className="font-semibold text-foreground">
                        {bene.quantity} {bene.unit}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 lg:col-span-2 flex items-center justify-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    asChild
                >
                    <Link href={`/beni/modifica?id=${bene.id}`}>
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
                            <Link href={`/beni/modifica?id=${bene.id}`} className="flex items-center">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Modifica
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Beni;
