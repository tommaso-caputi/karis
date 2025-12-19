"use client";

import { Button } from "@/components/ui/button";
import { 
  Send,
  Inbox,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  ArrowRight,
  MessageSquare,
  MapPin
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

type RequestStatus = "pending" | "accepted" | "rejected";
type TabType = "ricevute" | "inviate";

interface RichiestaParrocchia {
  id: string;
  parrocchia_richiedente: {
    id: string;
    nome: string;
    citta: string | null;
  };
  descrizione_bene: string;
  unita_misura: string;
  quantita: number;
  messaggio: string | null;
  stato: RequestStatus;
  parrocchia_accettante: {
    id: string;
    nome: string;
  } | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: "In attesa", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: Clock },
  accepted: { label: "Accettata", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", icon: CheckCircle2 },
  rejected: { label: "Rifiutata", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", icon: XCircle },
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Adesso";
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "ora" : "ore"} fa`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "giorno" : "giorni"} fa`;
  return date.toLocaleDateString("it-IT");
};

const Richieste = () => {
  const [activeTab, setActiveTab] = useState<TabType>("ricevute");
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [richieste, setRichieste] = useState<RichiestaParrocchia[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [parrocchiaId, setParrocchiaId] = useState<string | null>(null);

  // Load user ID and parish
  useEffect(() => {
    const loadUser = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load user's parish directly from database
        try {
          const { data: utente } = await supabase
            .from("utente")
            .select("parrocchia_id")
            .eq("id", user.id)
            .maybeSingle();
          if (utente?.parrocchia_id) {
            setParrocchiaId(utente.parrocchia_id);
          }
        } catch (e) {
          console.error("Errore nel caricamento della parrocchia:", e);
        }
      }
      setLoading(false);
    };

    void loadUser();
  }, []);


  // Load richieste
  useEffect(() => {
    const loadRichieste = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/richieste?userId=${userId}&view=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          setRichieste(data);
        } else {
          const error = await res.json();
          toast.error(error.error || "Errore nel caricamento delle richieste");
        }
      } catch (e) {
        console.error("Errore nel caricamento delle richieste:", e);
        toast.error("Errore nel caricamento delle richieste");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      void loadRichieste();
    }
  }, [userId, activeTab]);

  const pendingInviate = activeTab === "inviate" ? richieste.filter(r => r.stato === "pending").length : 0;
  const pendingRicevute = activeTab === "ricevute" ? richieste.filter(r => r.stato === "pending").length : 0;

  const handleRefresh = () => {
    if (userId) {
      fetch(`/api/richieste?userId=${userId}&view=${activeTab}`)
        .then(res => res.json())
        .then(data => setRichieste(data))
        .catch(e => console.error("Errore:", e));
    }
  };

  return (
    <DashboardLayout 
      title="Richieste" 
      subtitle="Gestisci le richieste di beni tra parrocchie"
      actions={
        <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Richiedi Beni</DialogTitle>
            </DialogHeader>
            <NewRequestForm 
              onClose={() => {
                setNewRequestOpen(false);
                handleRefresh();
              }}
              userId={userId}
            />
          </DialogContent>
        </Dialog>
      }
    >
      {/* Tabs */}
      <div className="bg-card rounded-2xl border border-border p-2 mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab("ricevute")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            activeTab === "ricevute"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Inbox className="w-5 h-5" />
          Ricevute
          {pendingRicevute > 0 && (
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
              activeTab === "ricevute" ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
            }`}>
              {pendingRicevute}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("inviate")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            activeTab === "inviate"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Send className="w-5 h-5" />
          Inviate
          {pendingInviate > 0 && (
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
              activeTab === "inviate" ? "bg-primary-foreground text-primary" : "bg-amber-500 text-white"
            }`}>
              {pendingInviate}
            </span>
          )}
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="text-muted-foreground">Caricamento...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {richieste.map((request) => (
            <RequestCard 
              key={request.id} 
              request={request} 
              userId={userId}
              parrocchiaId={parrocchiaId}
              activeTab={activeTab}
              onAction={handleRefresh}
            />
          ))}

          {richieste.length === 0 && (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                {activeTab === "ricevute" ? (
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <Send className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {activeTab === "ricevute"
                  ? "Nessuna richiesta ricevuta"
                  : "Nessuna richiesta inviata"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === "ricevute"
                  ? "Non hai ricevuto richieste da altre parrocchie." 
                  : "Non hai ancora inviato richieste ad altre parrocchie."}
              </p>
              {activeTab === "inviate" && (
                <Button variant="hero" onClick={() => setNewRequestOpen(true)}>
                  <Plus className="w-4 h-4" />
                  Invia Richiesta
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

const RequestCard = ({ 
  request, 
  userId,
  parrocchiaId,
  activeTab,
  onAction 
}: { 
  request: RichiestaParrocchia;
  userId: string | null;
  parrocchiaId: string | null;
  activeTab: TabType;
  onAction: () => void;
}) => {
  const status = statusConfig[request.stato];
  const StatusIcon = status.icon;
  const isMyParish = parrocchiaId && request.parrocchia_richiedente.id === parrocchiaId;
  const canAcceptReject = activeTab === "ricevute" && request.stato === "pending" && !isMyParish;

  const handleAccept = async () => {
    if (!userId) return;

    try {
      const res = await fetch("/api/richieste", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          richiesta_id: request.id,
          azione: "accept",
        }),
      });

      if (res.ok) {
        toast.success("Richiesta accettata! La parrocchia verrà notificata.");
        onAction();
      } else {
        const error = await res.json();
        toast.error(error.error || "Errore nell'accettazione della richiesta");
      }
    } catch (e) {
      console.error("Errore:", e);
      toast.error("Errore nell'accettazione della richiesta");
    }
  };

  const handleReject = async () => {
    if (!userId) return;

    try {
      const res = await fetch("/api/richieste", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          richiesta_id: request.id,
          azione: "reject",
        }),
      });

      if (res.ok) {
        toast.info("Richiesta rifiutata.");
        onAction();
      } else {
        const error = await res.json();
        toast.error(error.error || "Errore nel rifiuto della richiesta");
      }
    } catch (e) {
      console.error("Errore:", e);
      toast.error("Errore nel rifiuto della richiesta");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-soft transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Parish Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
            {request.parrocchia_richiedente.nome.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground">{request.parrocchia_richiedente.nome}</div>
            {request.parrocchia_richiedente.citta && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {request.parrocchia_richiedente.citta}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-center">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Item Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-foreground">{request.descrizione_bene}</div>
            <div className="text-sm text-muted-foreground">{request.quantita} {request.unita_misura}</div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(request.created_at)}</span>
        </div>
      </div>

      {/* Message */}
      {request.messaggio && (
        <div className="mt-4 p-4 bg-secondary/50 rounded-xl">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground italic">"{request.messaggio}"</p>
          </div>
        </div>
      )}

      {/* Accepted by info */}
      {request.parrocchia_accettante && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl">
          <div className="text-sm text-green-700 dark:text-green-300">
            Accettata da: <span className="font-semibold">{request.parrocchia_accettante.nome}</span>
          </div>
        </div>
      )}

      {/* Actions for pending requests in ricevute */}
      {canAcceptReject && userId && (
        <div className="mt-4 pt-4 border-t border-border flex gap-3">
          <Button variant="hero" className="flex-1" onClick={handleAccept}>
            <CheckCircle2 className="w-4 h-4" />
            Accetta
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleReject}>
            <XCircle className="w-4 h-4" />
            Rifiuta
          </Button>
        </div>
      )}
    </div>
  );
};

const NewRequestForm = ({ 
  onClose, 
  userId
}: { 
  onClose: () => void;
  userId: string | null;
}) => {
  const [formData, setFormData] = useState({
    descrizione_bene: "",
    quantita: "",
    unita_misura: "pz",
    messaggio: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const unitaMisuraOptions = [
    { value: "pz", label: "Pezzi" },
    { value: "kg", label: "Chilogrammi" },
    { value: "l", label: "Litri" },
    { value: "paia", label: "Paia" },
    { value: "confezioni", label: "Confezioni" },
    { value: "pacchi", label: "Pacchi" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !formData.descrizione_bene.trim() || !formData.quantita) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    const quantitaNum = parseInt(formData.quantita, 10);
    if (isNaN(quantitaNum) || quantitaNum <= 0) {
      toast.error("La quantità deve essere un numero positivo");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/richieste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          descrizione_bene: formData.descrizione_bene.trim(),
          quantita: quantitaNum,
          unita_misura: formData.unita_misura,
          messaggio: formData.messaggio || null,
        }),
      });

      if (res.ok) {
        toast.success("Richiesta inviata con successo!");
        onClose();
        setFormData({ descrizione_bene: "", quantita: "", unita_misura: "pz", messaggio: "" });
      } else {
        const error = await res.json();
        toast.error(error.error || "Errore nell'invio della richiesta");
      }
    } catch (e) {
      console.error("Errore:", e);
      toast.error("Errore nell'invio della richiesta");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Descrizione del bene richiesto <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.descrizione_bene}
          onChange={(e) => setFormData({ ...formData, descrizione_bene: e.target.value })}
          placeholder="es. Maglietta da ragazzo taglia M, Pasta 500g, Coperte..."
          className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          Descrivi il bene che stai richiedendo.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Quantità <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantita}
            onChange={(e) => setFormData({ ...formData, quantita: e.target.value })}
            placeholder="es. 20"
            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Unità di misura <span className="text-destructive">*</span>
          </label>
          <select
            value={formData.unita_misura}
            onChange={(e) => setFormData({ ...formData, unita_misura: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {unitaMisuraOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Quantità richiesta <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={formData.quantita}
          onChange={(e) => setFormData({ ...formData, quantita: e.target.value })}
          placeholder="es. 20"
          className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Messaggio (opzionale)
        </label>
        <textarea
          value={formData.messaggio}
          onChange={(e) => setFormData({ ...formData, messaggio: e.target.value })}
          placeholder="Aggiungi un messaggio per spiegare la tua richiesta..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" type="button" className="flex-1" onClick={onClose} disabled={submitting}>
          Annulla
        </Button>
        <Button variant="hero" type="submit" className="flex-1" disabled={submitting}>
          <Send className="w-4 h-4" />
          {submitting ? "Invio..." : "Invia Richiesta"}
        </Button>
      </div>
    </form>
  );
};

export default Richieste;
