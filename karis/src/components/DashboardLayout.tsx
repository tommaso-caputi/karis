"use client";

import { Button } from "@/components/ui/button";
import {
    Heart,
    LayoutDashboard,
    Package,
    Plus,
    Send,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Gift
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UserData {
    nome: string;
    cognome: string;
    parrocchia: string | null;
    ruolo?: string | null;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

const DashboardLayout = ({ children, title, subtitle, actions }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const loadUser = async () => {
            if (!supabase) return;

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            try {
                const res = await fetch(`/api/user?userId=${user.id}`);
                if (!res.ok) return;
                const data: UserData = await res.json();
                setUserData(data);
            } catch {
                // Silenzia errori nella sidebar
            }
        };

        void loadUser();
    }, []);

    const handleLogout = async () => {
        if (!supabase) {
            router.push("/login");
            return;
        }

        try {
            await supabase.auth.signOut();
        } finally {
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("karis_login_email");
                window.localStorage.removeItem("karis_remember_me");
                window.localStorage.removeItem("karis_user_id");
            }
            router.push("/login");
        }
    };

    const isAdmin = (userData?.ruolo ?? "").toLowerCase().includes("amm");

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Package, label: "Beni", path: "/beni" },
        { icon: Gift, label: "Crea Pacco", path: "/beni/pacco" },
        { icon: User, label: "Beneficiari", path: "/beneficiario" },
        { icon: Send, label: "Richieste", path: "/richieste" },
        /* { icon: Bell, label: "Notifiche", path: "/notifiche", badge: 3 },
        { icon: Settings, label: "Impostazioni", path: "/impostazioni" }, */
    ];

    if (isAdmin) {
        navItems.push({ icon: Settings, label: "Volontari", path: "/volontari" });
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-card border-r border-border p-6 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Mobile Close Button */}
                <button
                    className="absolute top-4 right-4 lg:hidden text-muted-foreground hover:text-foreground"
                    onClick={() => setSidebarOpen(false)}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 mb-10">
                    <img
                        src="/favicon.ico"
                        alt="KARIS logo"
                        className="w-8 h-8 align-middle"
                    />
                    <span className="font-display text-xl font-semibold text-foreground">
                        KARIS
                    </span>
                </Link>

                {/* Navigation */}
                <nav className="space-y-2 flex-1">
                    {navItems.map((item) => {
                        // Logica speciale per "Beni": non deve essere attivo quando siamo su "/beni/pacco"
                        let isActive = pathname === item.path || pathname.startsWith(item.path + "/");
                        if (item.path === "/beni" && pathname === "/beni/pacco") {
                            isActive = false;
                        }
                        return (
                            <NavItem
                                key={item.path}
                                icon={<item.icon className="w-5 h-5" />}
                                label={item.label}
                                path={item.path}
                                active={isActive}
                                /* badge={item.badge} */
                                onClick={() => setSidebarOpen(false)}
                            />
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="pt-6 border-t border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium">
                            {(userData?.nome?.[0] ?? "U").toUpperCase()}
                            {(userData?.cognome?.[0] ?? "").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                                {userData ? `${userData.nome} ${userData.cognome}` : "Utente"}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                                {userData?.parrocchia ?? "Parrocchia non disponibile"}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Esci
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden text-foreground"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="font-display text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
                                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

const NavItem = ({
    icon,
    label,
    path,
    active = false,
    badge,
    onClick
}: {
    icon: React.ReactNode;
    label: string;
    path: string;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
}) => (
    <Link
        href={path}
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
    >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {badge && (
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                }`}>
                {badge}
            </span>
        )}
    </Link>
);

export default DashboardLayout;
