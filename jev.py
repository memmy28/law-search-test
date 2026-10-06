"""Client für das Jev-Modell (TypeSafe AI, https://docs.typesafe.ai).

Fragt für eine Nutzeranfrage und eine Menge von Gesetzen per "Noul"-Primitive
(Ja/Nein-Frage mit Wahrscheinlichkeit) ab, wie einschlägig jedes Gesetz für
die Anfrage ist. Ein Aufruf bündelt eine Noul-Frage pro Gesetz, Jev wertet sie
parallel aus.
"""

import os

import requests

JEV_API_URL = "https://api.typesafe.ai/v1/systemone"
JEV_MODEL = "jev-latest"
JEV_RELEVANCE_THRESHOLD = 0.5


class JevError(Exception):
    pass


def _api_key():
    key = os.environ.get("TYPESAFE_API_KEY")
    if not key:
        raise JevError("TYPESAFE_API_KEY ist nicht gesetzt.")
    return key


def classify_laws(query, laws, timeout=15):
    """Lässt Jev pro Gesetz eine Noul-Frage beantworten: "Ist dieses Gesetz
    einschlägig für die Anfrage?". Gibt eine Liste von Dicts zurück, sortiert
    nach Wahrscheinlichkeit absteigend: [{"law": ..., "probability": ..., "relevant": ...}]
    """
    if not laws:
        return []

    law_keys = {f"law_{i}": law for i, law in enumerate(laws)}
    questions = {
        key: {
            "type": "noul",
            "instructions": (
                f'Ist das Gesetz "{law}" einschlägig, um die folgende Frage '
                f'zu beantworten: "{query}"?'
            ),
        }
        for key, law in law_keys.items()
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

    results = []
    for key, law in law_keys.items():
        answer = answers.get(key)
        if answer is None:
            continue
        probability = float(answer.get("noul", 0.0))
        results.append(
            {
                "law": law,
                "probability": probability,
                "relevant": probability >= JEV_RELEVANCE_THRESHOLD,
            }
        )

    results.sort(key=lambda r: r["probability"], reverse=True)
    return results
