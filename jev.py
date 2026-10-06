"""Client für das Jev-Modell (TypeSafe AI, https://docs.typesafe.ai).

Klassifikation läuft zweistufig, um Kosten zu sparen:
1. Pro Gesetz eine Noul-Frage ("Ist dieses Gesetz einschlägig?").
2. Nur für Gesetze mit Wahrscheinlichkeit >= JEV_RELEVANCE_THRESHOLD: zusätzlich
   pro einzelner Norm dieses Gesetzes eine Noul-Frage. Gesetze, die schon in
   Stufe 1 durchfallen, werden nie auf Normebene abgefragt.
"""

import os

import requests

JEV_API_URL = "https://api.typesafe.ai/v1/systemone"
JEV_MODEL = "jev-latest"
JEV_RELEVANCE_THRESHOLD = 0.5

# TypeSafe veröffentlicht keine Preisliste für Jev/Noul-Fragen (Stand: dieser Prototyp).
# Grobe Platzhalter-Annahme pro Noul-Frage, nur zur Größenordnungseinschätzung -
# bei Kenntnis des echten Tarifs hier anpassen.
JEV_ESTIMATED_COST_PER_QUESTION_USD = 0.0005


class JevError(Exception):
    pass


def _api_key():
    key = os.environ.get("TYPESAFE_API_KEY")
    if not key:
        raise JevError("TYPESAFE_API_KEY ist nicht gesetzt.")
    return key


def _ask_noul_batch(query, keyed_instructions, timeout):
    """Stellt Jev eine Noul-Frage pro Eintrag in keyed_instructions ({key: instructions})
    in einem Aufruf. Gibt {key: probability} zurück."""
    if not keyed_instructions:
        return {}

    questions = {
        key: {"type": "noul", "instructions": instructions}
        for key, instructions in keyed_instructions.items()
    }

    try:
        response = requests.post(
            JEV_API_URL,
            headers={
                "Authorization": f"Bearer {_api_key()}",
                "Content-Type": "application/json",
            },
            json={"state": query, "model": JEV_MODEL, "questions": questions},
            timeout=timeout,
        )
    except requests.RequestException as e:
        raise JevError(f"Jev-API nicht erreichbar: {e}")

    if response.status_code != 200:
        raise JevError(f"Jev-API-Fehler ({response.status_code}): {response.text[:300]}")

    answers = response.json().get("answers", {})
    return {key: float(answers[key]["noul"]) for key in keyed_instructions if key in answers}


def classify_laws(query, laws, timeout=15):
    """Lässt Jev pro Gesetz eine Noul-Frage beantworten: "Ist dieses Gesetz
    einschlägig für die Anfrage?". Gibt eine Liste von Dicts zurück, sortiert
    nach Wahrscheinlichkeit absteigend: [{"law": ..., "probability": ..., "relevant": ...}]
    """
    if not laws:
        return []

    keyed = {
        f"law_{i}": (
            f'Ist das Gesetz "{law}" einschlägig, um die folgende Frage '
            f'zu beantworten: "{query}"?'
        )
        for i, law in enumerate(laws)
    }
    probabilities = _ask_noul_batch(query, keyed, timeout)

    results = [
        {
            "law": law,
            "probability": probabilities[f"law_{i}"],
            "relevant": probabilities[f"law_{i}"] >= JEV_RELEVANCE_THRESHOLD,
        }
        for i, law in enumerate(laws)
        if f"law_{i}" in probabilities
    ]
    results.sort(key=lambda r: r["probability"], reverse=True)
    return results


def classify_norms(query, norms, timeout=30):
    """Lässt Jev pro einzelner Norm eine Noul-Frage beantworten. norms ist eine
    Liste von Dicts mit mindestens id, law_short, norm_ref, title. Gibt eine
    Liste von Dicts zurück, sortiert nach Wahrscheinlichkeit absteigend:
    [{"norm_id": ..., "law_short": ..., "norm_ref": ..., "title": ..., "probability": ..., "relevant": ...}]
    """
    if not norms:
        return []

    keyed = {
        f"norm_{i}": (
            f'Ist die Norm "{n["law_short"]} {n["norm_ref"]}" ({n["title"]}) '
            f'einschlägig, um die folgende Frage zu beantworten: "{query}"?'
        )
        for i, n in enumerate(norms)
    }
    probabilities = _ask_noul_batch(query, keyed, timeout)

    results = [
        {
            "norm_id": n["id"],
            "law_short": n["law_short"],
            "norm_ref": n["norm_ref"],
            "title": n["title"],
            "probability": probabilities[f"norm_{i}"],
            "relevant": probabilities[f"norm_{i}"] >= JEV_RELEVANCE_THRESHOLD,
        }
        for i, n in enumerate(norms)
        if f"norm_{i}" in probabilities
    ]
    results.sort(key=lambda r: r["probability"], reverse=True)
    return results
