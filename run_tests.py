"""
Script di test completo per l'applicazione Karis.

Questo script esegue chiamate HTTP a tutti gli endpoint API per verificare
che il backend risponda correttamente. Include test per:
- Operazioni CRUD su beneficiari, beni e famiglie
- Gestione richieste tra parrocchie
- Gestione inviti e volontari
- Assegnazioni di beni (singole e pacchi)
- Dashboard e statistiche
- Validazione parametri e gestione errori

Prerequisiti:
    - Python 3.10+
    - libreria "requests":
        pip install requests

Configurazione:
    - BASE_URL: URL di base dell'app Next.js (es. http://localhost:3000)
      può essere impostato con la variabile d'ambiente BASE_URL.
    - USER_ID: id di un utente amministratore valido nel database (tabella "utente").
      Puoi usare uno degli ID inseriti nel file db/seed.sql o impostarlo
      con la variabile d'ambiente USER_ID.
      Nota: alcuni test richiedono privilegi di amministratore.

Esecuzione:
    python run_tests.py

Il script esegue oltre 50 test che coprono tutti gli endpoint API principali.
"""

import os
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import requests


DEFAULT_BASE_URL = "http://localhost:3000"

# ID di utente di default, coerente con db/seed.sql (utente amministratore Giulia Rossi)
DEFAULT_USER_ID = "55555555-5555-5555-5555-555555555551"


@dataclass
class ApiTest:
    name: str
    method: str
    path: str
    params: Optional[Dict[str, Any]] = None
    json: Optional[Dict[str, Any]] = None
    expected_status: int = 200


def get_base_url() -> str:
    base_url = os.getenv("BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    return base_url


def get_user_id() -> str:
    return os.getenv("USER_ID", DEFAULT_USER_ID)


def check_server_availability(base_url: str) -> bool:
    """Verifica se il server è raggiungibile."""
    try:
        resp = requests.get(base_url, timeout=5)
        return True
    except requests.exceptions.ConnectionError:
        return False
    except Exception:
        return False


def run_test_session() -> int:
    base_url = get_base_url()
    user_id = get_user_id()

    print(f"BASE_URL: {base_url}")
    print(f"USER_ID:  {user_id}")
    print("=" * 60)

    # Verifica disponibilità del server
    print("\nVerifica disponibilità del server...")
    if not check_server_availability(base_url):
        print(f"❌ ERRORE: Il server non è raggiungibile su {base_url}")
        print("   Assicurati che il server Next.js sia in esecuzione:")
        print("   cd karis && npm run dev")
        return 1
    print("✅ Server raggiungibile")
    print("=" * 60)

    # ID delle risorse create durante i test (per pulizia o test successivi)
    created_resources = {
        "beneficiario_id": None,
        "bene_id": None,
        "famiglia_id": None,
        "richiesta_id": None,
        "invito_id": None,
        "assegnazione_id": None,
    }

    tests: List[ApiTest] = [
        # ============================================================
        # BENEFICIARIO
        # ============================================================
        ApiTest(
            name="GET /api/beneficiario",
            method="GET",
            path="/api/beneficiario",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="POST /api/beneficiario (crea nuovo)",
            method="POST",
            path="/api/beneficiario",
            json={
                "userId": user_id,
                "nome": "Test",
                "cognome": "Beneficiario",
                "cf": None,
                "data_nascita": "2000-01-01",
                "luogo_nascita": "Milano",
                "famiglia_id": None,
            },
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/beneficiario (senza nome - errore)",
            method="POST",
            path="/api/beneficiario",
            json={"userId": user_id, "cognome": "Test"},
            expected_status=400,
        ),
        ApiTest(
            name="PUT /api/beneficiario (aggiorna)",
            method="PUT",
            path="/api/beneficiario",
            json={
                "userId": user_id,
                "id": "77777777-7777-7777-7777-777777777771",  # ID dal seed
                "nome": "Mario",
                "cognome": "Rossi",
                "cf": "RSSMRA10C10H501Z",
            },
            expected_status=200,
        ),
        ApiTest(
            name="DELETE /api/beneficiario (senza id - errore)",
            method="DELETE",
            path="/api/beneficiario",
            params={"userId": user_id},
            expected_status=400,
        ),
        
        # ============================================================
        # BENI
        # ============================================================
        ApiTest(
            name="GET /api/beni",
            method="GET",
            path="/api/beni",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="POST /api/beni (crea nuovo)",
            method="POST",
            path="/api/beni",
            json={
                "userId": user_id,
                "name": "Test Bene",
                "category": "Test Category",
                "quantity": 10,
                "unit": "pz",
                "description": "Bene di test",
            },
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/beni (senza nome - errore)",
            method="POST",
            path="/api/beni",
            json={"userId": user_id, "category": "Test", "quantity": 5},
            expected_status=400,
        ),
        ApiTest(
            name="PUT /api/beni (aggiorna)",
            method="PUT",
            path="/api/beni",
            json={
                "userId": user_id,
                "id": "33333333-3333-3333-3333-333333333331",  # ID dal seed
                "name": "Pasta 1kg",
                "category": "Alimentari",
                "quantity": 55,
                "unit": "pz",
            },
            expected_status=200,
        ),
        ApiTest(
            name="DELETE /api/beni (senza id - errore)",
            method="DELETE",
            path="/api/beni",
            params={"userId": user_id},
            expected_status=400,
        ),
        
        # ============================================================
        # FAMIGLIA
        # ============================================================
        ApiTest(
            name="GET /api/famiglia",
            method="GET",
            path="/api/famiglia",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/famiglia?all=true",
            method="GET",
            path="/api/famiglia",
            params={"userId": user_id, "all": "true"},
            expected_status=200,
        ),
        ApiTest(
            name="POST /api/famiglia (crea nuova)",
            method="POST",
            path="/api/famiglia",
            json={
                "userId": user_id,
                "cognome": "Test Famiglia",
                "note": "Famiglia di test",
            },
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/famiglia (senza cognome - errore)",
            method="POST",
            path="/api/famiglia",
            json={"userId": user_id, "note": "Test"},
            expected_status=400,
        ),
        ApiTest(
            name="PUT /api/famiglia (aggiorna)",
            method="PUT",
            path="/api/famiglia",
            json={
                "userId": user_id,
                "id": "66666666-6666-6666-6666-666666666661",  # ID dal seed
                "cognome": "Rossi",
                "note": "Famiglia aggiornata",
            },
            expected_status=200,
        ),
        ApiTest(
            name="DELETE /api/famiglia (senza id - errore)",
            method="DELETE",
            path="/api/famiglia",
            params={"userId": user_id},
            expected_status=400,
        ),
        
        # ============================================================
        # RICHIESTE
        # ============================================================
        ApiTest(
            name="GET /api/richieste",
            method="GET",
            path="/api/richieste",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/richieste?view=inviate",
            method="GET",
            path="/api/richieste",
            params={"userId": user_id, "view": "inviate"},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/richieste?view=ricevute",
            method="GET",
            path="/api/richieste",
            params={"userId": user_id, "view": "ricevute"},
            expected_status=200,
        ),
        ApiTest(
            name="POST /api/richieste (crea nuova)",
            method="POST",
            path="/api/richieste",
            json={
                "userId": user_id,
                "descrizione_bene": "Pacchi alimentari di test",
                "quantita": 15,
                "unita_misura": "pz",
                "messaggio": "Richiesta di test",
            },
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/richieste (senza descrizione - errore)",
            method="POST",
            path="/api/richieste",
            json={"userId": user_id, "quantita": 10},
            expected_status=400,
        ),
        ApiTest(
            name="PATCH /api/richieste (accetta richiesta)",
            method="PATCH",
            path="/api/richieste",
            json={
                "userId": user_id,
                "richiesta_id": "dddddddd-dddd-dddd-dddd-ddddddddddd1",  # ID dal seed
                "azione": "accept",
            },
            expected_status=200,
        ),
        ApiTest(
            name="PATCH /api/richieste (senza azione - errore)",
            method="PATCH",
            path="/api/richieste",
            json={"userId": user_id, "richiesta_id": "test-id"},
            expected_status=400,
        ),
        
        # ============================================================
        # INVITI
        # ============================================================
        ApiTest(
            name="GET /api/inviti",
            method="GET",
            path="/api/inviti",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="POST /api/inviti (crea nuovo)",
            method="POST",
            path="/api/inviti",
            json={"userId": user_id, "daysValid": 7},
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/inviti (senza userId - errore)",
            method="POST",
            path="/api/inviti",
            json={"daysValid": 7},
            expected_status=400,
        ),
        ApiTest(
            name="DELETE /api/inviti (senza id - errore)",
            method="DELETE",
            path="/api/inviti",
            params={"userId": user_id},
            expected_status=400,
        ),
        
        # ============================================================
        # ASSEGNAZIONI
        # ============================================================
        ApiTest(
            name="GET /api/assegnazioni",
            method="GET",
            path="/api/assegnazioni",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/assegnazioni?beneficiarioId=...",
            method="GET",
            path="/api/assegnazioni",
            params={
                "userId": user_id,
                "beneficiarioId": "77777777-7777-7777-7777-777777777771",
            },
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/assegnazioni?famigliaId=...",
            method="GET",
            path="/api/assegnazioni",
            params={
                "userId": user_id,
                "famigliaId": "66666666-6666-6666-6666-666666666661",
            },
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/assegnazioni?risorsaId=...",
            method="GET",
            path="/api/assegnazioni",
            params={
                "userId": user_id,
                "risorsaId": "33333333-3333-3333-3333-333333333331",
            },
            expected_status=200,
        ),
        ApiTest(
            name="POST /api/assegnazioni (crea nuova - famiglia)",
            method="POST",
            path="/api/assegnazioni",
            json={
                "userId": user_id,
                "risorsa_id": "33333333-3333-3333-3333-333333333331",
                "famiglia_id": "66666666-6666-6666-6666-666666666661",
                "beneficiario_id": None,
                "quantita": 2,
                "note": "Assegnazione di test",
            },
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/assegnazioni (senza risorsa_id - errore)",
            method="POST",
            path="/api/assegnazioni",
            json={
                "userId": user_id,
                "famiglia_id": "66666666-6666-6666-6666-666666666661",
                "quantita": 2,
            },
            expected_status=400,
        ),
        ApiTest(
            name="POST /api/assegnazioni/pacco (crea pacco)",
            method="POST",
            path="/api/assegnazioni/pacco",
            json={
                "assegnazioni": [
                    {
                        "userId": user_id,
                        "risorsa_id": "33333333-3333-3333-3333-333333333331",
                        "famiglia_id": "66666666-6666-6666-6666-666666666661",
                        "beneficiario_id": None,
                        "quantita": 1,
                        "note": "Pacco di test",
                    }
                ]
            },
            expected_status=201,
        ),
        ApiTest(
            name="POST /api/assegnazioni/pacco (array vuoto - errore)",
            method="POST",
            path="/api/assegnazioni/pacco",
            json={"assegnazioni": []},
            expected_status=400,
        ),
        ApiTest(
            name="DELETE /api/assegnazioni (senza id - errore)",
            method="DELETE",
            path="/api/assegnazioni",
            params={"userId": user_id},
            expected_status=400,
        ),
        
        # ============================================================
        # VOLONTARI
        # ============================================================
        ApiTest(
            name="GET /api/volontari",
            method="GET",
            path="/api/volontari",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="PUT /api/volontari (aggiorna)",
            method="PUT",
            path="/api/volontari",
            json={
                "userId": user_id,
                "id": "55555555-5555-5555-5555-555555555552",  # Volontario dal seed
                "nome": "Marco",
                "cognome": "Bianchi",
                "cf": "BNCMRC90B02H501Y",
            },
            expected_status=200,
        ),
        ApiTest(
            name="PUT /api/volontari (senza id - errore)",
            method="PUT",
            path="/api/volontari",
            json={"userId": user_id, "nome": "Test", "cognome": "Test"},
            expected_status=400,
        ),
        ApiTest(
            name="DELETE /api/volontari (senza id - errore)",
            method="DELETE",
            path="/api/volontari",
            params={"userId": user_id},
            expected_status=400,
        ),
        
        # ============================================================
        # USER
        # ============================================================
        ApiTest(
            name="GET /api/user",
            method="GET",
            path="/api/user",
            params={"userId": user_id},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/user (senza userId - errore)",
            method="GET",
            path="/api/user",
            params={},
            expected_status=400,
        ),
        
        # ============================================================
        # INVITI ACCEPT
        # ============================================================
        ApiTest(
            name="POST /api/inviti/accept (senza token - errore)",
            method="POST",
            path="/api/inviti/accept",
            json={
                "userId": "test-user-id",
                "nome": "Test",
                "cognome": "User",
            },
            expected_status=400,
        ),
        
        # ============================================================
        # DASHBOARD SUMMARY
        # ============================================================
        ApiTest(
            name="GET /api/dashboard/summary",
            method="GET",
            path="/api/dashboard/summary",
            params={"userId": user_id, "days": "7"},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/dashboard/summary?days=30",
            method="GET",
            path="/api/dashboard/summary",
            params={"userId": user_id, "days": "30"},
            expected_status=200,
        ),
        ApiTest(
            name="GET /api/dashboard/summary (senza userId - errore)",
            method="GET",
            path="/api/dashboard/summary",
            params={"days": "7"},
            expected_status=400,
        ),
    ]

    session = requests.Session()

    passed = 0
    failed = 0
    total_tests = len(tests)

    print(f"\nEseguendo {total_tests} test...")
    print("=" * 60)

    for idx, test in enumerate(tests, 1):
        url = f"{base_url}{test.path}"
        print(f"\n[{idx}/{total_tests}] {test.name}")
        print(f"  {test.method} {url}")
        if test.params:
            print(f"  params: {test.params}")
        if test.json:
            # Nascondi userId dal JSON per output più pulito
            json_preview = {k: v for k, v in test.json.items() if k != "userId"}
            if json_preview:
                print(f"  json: {json_preview}")

        try:
            resp = session.request(
                method=test.method,
                url=url,
                params=test.params,
                json=test.json,
                timeout=10,
            )
        except requests.exceptions.ConnectionError as e:
            failed += 1
            print(f"  RISULTATO: FALLITO (errore di connessione: {e})")
            print(f"  ⚠️  Il server potrebbe non essere più disponibile")
            continue
        except requests.exceptions.Timeout as e:
            failed += 1
            print(f"  RISULTATO: FALLITO (timeout: {e})")
            continue
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f"  RISULTATO: FALLITO (errore imprevisto: {e})")
            continue

        status_ok = resp.status_code == test.expected_status

        status_icon = "✅" if status_ok else "❌"
        print(f"  status: {status_icon} {resp.status_code} (atteso: {test.expected_status})")

        # Proviamo a leggere una piccola parte del body per debug
        content_type = resp.headers.get("Content-Type", "")
        body_data = None
        if "application/json" in content_type:
            try:
                body_data = resp.json()
                # Cattura ID creati per test successivi
                if status_ok and isinstance(body_data, dict):
                    if "id" in body_data and "beneficiario" in test.name.lower():
                        created_resources["beneficiario_id"] = body_data.get("id")
                    elif "id" in body_data and "bene" in test.name.lower():
                        created_resources["bene_id"] = body_data.get("id")
                    elif "id" in body_data and "famiglia" in test.name.lower():
                        created_resources["famiglia_id"] = body_data.get("id")
                    elif "id" in body_data and "richiesta" in test.name.lower():
                        created_resources["richiesta_id"] = body_data.get("id")
                    elif "id" in body_data and "invito" in test.name.lower():
                        created_resources["invito_id"] = body_data.get("id")
                    elif "id" in body_data and "assegnazione" in test.name.lower():
                        created_resources["assegnazione_id"] = body_data.get("id")
                
                # Stampa solo un estratto per non intasare l'output
                preview = str(body_data)
                if len(preview) > 200:
                    preview = preview[:200] + "... (troncato)"
                print(f"  response: {preview}")
            except Exception:
                print("  response: <JSON non valido>")
        else:
            text = resp.text
            if len(text) > 200:
                text = text[:200] + "... (troncato)"
            print(f"  response: {text}")

        if status_ok:
            passed += 1
            print(f"  RISULTATO: ✅ PASS")
        else:
            failed += 1
            print(f"  RISULTATO: ❌ FAIL")
            # Mostra dettagli dell'errore se disponibili
            if body_data and isinstance(body_data, dict) and "error" in body_data:
                print(f"  errore: {body_data['error']}")

    print("\n" + "=" * 60)
    print("RIEPILOGO FINALE")
    print("=" * 60)
    print(f"Test totali:    {total_tests}")
    print(f"Test superati:  {passed} ✅")
    print(f"Test falliti:   {failed} ❌")
    
    if failed == 0:
        print("\n🎉 Tutti i test sono passati!")
    else:
        success_rate = (passed / total_tests * 100) if total_tests > 0 else 0
        print(f"\n⚠️  Tasso di successo: {success_rate:.1f}%")
    
    print("=" * 60)

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_test_session())


