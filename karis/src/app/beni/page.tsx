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
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Category = "tutti" | "alimentari" | "abbigliamento" | "medicinali" | "altro";

interface Bene {
    id: string;
    name: string;
    category: Category;
    quantity: number;
    threshold: number;
    unit: string;
    lastUpdated: string;
}

const mockBeni: Bene[] = [
    { id: "1", name: "Pasta (500g)", category: "alimentari", quantity: 45, threshold: 20, unit: "pacchi", lastUpdated: "2 ore fa" },
    { id: "2", name: "Latte UHT (1L)", category: "alimentari", quantity: 12, threshold: 20, unit: "litri", lastUpdated: "1 ora fa" },
    { id: "3", name: "Olio d'Oliva (1L)", category: "alimentari", quantity: 28, threshold: 15, unit: "bottiglie", lastUpdated: "3 ore fa" },
    { id: "4", name: "Riso (1kg)", category: "alimentari", quantity: 35, threshold: 25, unit: "kg", lastUpdated: "5 ore fa" },
    { id: "5", name: "Tonno in scatola", category: "alimentari", quantity: 50, threshold: 30, unit: "scatole", lastUpdated: "1 giorno fa" },
    { id: "6", name: "Giacche Invernali", category: "abbigliamento", quantity: 8, threshold: 15, unit: "pezzi", lastUpdated: "2 giorni fa" },
    { id: "7", name: "Maglioni", category: "abbigliamento", quantity: 22, threshold: 20, unit: "pezzi", lastUpdated: "1 giorno fa" },
    { id: "8", name: "Pantaloni", category: "abbigliamento", quantity: 30, threshold: 25, unit: "pezzi", lastUpdated: "4 ore fa" },
    { id: "9", name: "Paracetamolo", category: "medicinali", quantity: 5, threshold: 10, unit: "confezioni", lastUpdated: "6 ore fa" },
    { id: "10", name: "Ibuprofene", category: "medicinali", quantity: 15, threshold: 10, unit: "confezioni", lastUpdated: "1 giorno fa" },
    { id: "11", name: "Coperte", category: "altro", quantity: 18, threshold: 15, unit: "pezzi", lastUpdated: "2 giorni fa" },
    { id: "12", name: "Pannolini Taglia 3", category: "altro", quantity: 18, threshold: 25, unit: "pacchi", lastUpdated: "3 ore fa" },
];

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
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category>("tutti");
    const [showLowStock, setShowLowStock] = useState(false);

    const filteredBeni = mockBeni.filter(bene => {
        const matchesSearch = bene.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "tutti" || bene.category === selectedCategory;
        const matchesLowStock = !showLowStock || bene.quantity <= bene.threshold;
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const stats = {
        total: mockBeni.length,
        lowStock: mockBeni.filter(b => b.quantity <= b.threshold).length,
        alimentari: mockBeni.filter(b => b.category === "alimentari").length,
        abbigliamento: mockBeni.filter(b => b.category === "abbigliamento").length,
        medicinali: mockBeni.filter(b => b.category === "medicinali").length,
    };

    return (
        <>
            <DashboardLayout
                title="Gestione Beni"
                subtitle={`${stats.total} beni totali • ${stats.lowStock} con scorte basse`}
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
                        onClick={() => { setSelectedCategory("alimentari"); setShowLowStock(false); }}
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
                        onClick={() => { setSelectedCategory("abbigliamento"); setShowLowStock(false); }}
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
                        onClick={() => { setSelectedCategory("medicinali"); setShowLowStock(false); }}
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

                    <button
                        onClick={() => { setShowLowStock(true); setSelectedCategory("tutti"); }}
                        className={`p-4 rounded-xl border transition-all ${showLowStock
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/50"
                                : "border-border bg-card hover:border-amber-300"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                <Package className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="text-left">
                                <div className="text-2xl font-bold text-amber-600">{stats.lowStock}</div>
                                <div className="text-sm text-muted-foreground">Scorte Basse</div>
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
                                            onClick={() => { setSelectedCategory(cat); setShowLowStock(false); }}
                                        >
                                            {categoryLabels[cat]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {(selectedCategory !== "tutti" || showLowStock || searchQuery) && (
                                <Button
                                    variant="ghost"
                                    onClick={() => { setSelectedCategory("tutti"); setShowLowStock(false); setSearchQuery(""); }}
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
                        <div className="col-span-2">Categoria</div>
                        <div className="col-span-2">Quantità</div>
                        <div className="col-span-2">Stato</div>
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
    const isLowStock = bene.quantity <= bene.threshold;
    const percentage = (bene.quantity / bene.threshold) * 100;
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
            <div className="hidden lg:flex col-span-2 items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[bene.category as keyof typeof categoryColors]}`}>
                    {categoryLabels[bene.category]}
                </span>
            </div>

            {/* Quantity */}
            <div className="col-span-1 lg:col-span-2 flex items-center gap-4">
                <div className="flex-1 lg:flex-none">
                    <div className={`font-semibold ${isLowStock ? "text-amber-600" : "text-foreground"}`}>
                        {bene.quantity} {bene.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">Soglia: {bene.threshold}</div>
                </div>
            </div>

            {/* Status */}
            <div className="col-span-1 lg:col-span-2 flex items-center">
                <div className="w-full max-w-24">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-1">
                        <div
                            className={`h-full rounded-full transition-all ${isLowStock ? "bg-amber-500" : "bg-green-500"
                                }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>
                    <span className={`text-xs font-medium ${isLowStock ? "text-amber-600" : "text-green-600"}`}>
                        {isLowStock ? "Scorta bassa" : "Disponibile"}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="col-span-1 lg:col-span-2 flex items-center justify-end gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Modifica
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
