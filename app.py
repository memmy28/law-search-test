import os
import subprocess
from datetime import date

import psycopg2
from dotenv import load_dotenv
from flask import Flask, Response, abort, jsonify, render_template, request
from pgvector.psycopg2 import register_vector
from sentence_transformers import CrossEncoder, SentenceTransformer

import jev
from search import (
    DB_URL,
    EMBED_MODEL,
    RERANK_MODEL,
    fetch_rows,
    find_matching_definitions,
    linked_norm_ids,
    rrf_fuse,
    text_search,
    vector_search,
)

load_dotenv()

app = Flask(__name__)

DIAGRAM_PATHS = {
    "1": os.path.join(os.path.dirname(__file__), "diagrams", "search-pipeline.puml"),
    "2": os.path.join(os.path.dirname(__file__), "diagrams", "search-pipeline-2.puml"),
    "3": os.path.join(os.path.dirname(__file__), "diagrams", "search-pipeline-3.puml"),
}
_diagram_cache = {}

print(f"Lade Modelle ({EMBED_MODEL}, {RERANK_MODEL}) ...")
embed_model = SentenceTransformer(EMBED_MODEL)
reranker = CrossEncoder(RERANK_MODEL)

conn = psycopg2.connect(DB_URL)
register_vector(conn)


def run_jev_classification(cur, query):
    """Lässt Jev einschätzen, welche der in der Datenbank vorhandenen Gesetze für
    die Anfrage einschlägig sind, und protokolliert das Ergebnis in
    jev_classifications. Gibt (results, error) zurück - bei einem Jev-Fehler
    bleibt die Suche selbst trotzdem funktionsfähig."""
    cur.execute("SELECT DISTINCT law_short FROM norms ORDER BY law_short")
    laws = [row[0] for row in cur.fetchall()]

    try:
        results = jev.classify_laws(query, laws)
    except jev.JevError as e:
        return None, str(e)

    for r in results:
        cur.execute(
            """
            INSERT INTO jev_classifications (query, law_short, probability, relevant)
            VALUES (%s, %s, %s, %s)
            """,
            (query, r["law"], r["probability"], r["relevant"]),
        )
    conn.commit()
    return results, None


def classify_validity(valid_from, valid_to, as_of):
    if valid_from > as_of:
        return "zukuenftig"
    if valid_to is not None and valid_to < as_of:
        return "vergangen"
    return "aktuell"


@app.route("/")
def index():
    return render_template("index.html", active_page="search")


def render_diagram_svg(version):
    """Rendert diagrams/search-pipeline[-2].puml live über den lokalen PlantUML-Docker-Container.
    Ergebnis wird pro Version anhand der Datei-mtime gecacht, damit Änderungen an der .puml-Datei
    ohne manuellen Zwischenschritt beim nächsten Seitenaufruf sichtbar werden."""
    puml_path = DIAGRAM_PATHS.get(version)
    if puml_path is None or not os.path.exists(puml_path):
        return None, f"Unbekannte Diagramm-Version oder Datei nicht gefunden: {version}"

    mtime = os.path.getmtime(puml_path)
    cached = _diagram_cache.get(version)
    if cached and cached["mtime"] == mtime:
        return cached["svg"], cached["error"]

    with open(puml_path, "rb") as f:
        puml_source = f.read()

    try:
        result = subprocess.run(
            ["docker", "run", "--rm", "-i", "plantuml/plantuml", "-tsvg", "-pipe"],
            input=puml_source,
            capture_output=True,
            timeout=30,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        _diagram_cache[version] = {"mtime": mtime, "svg": None, "error": str(e)}
        return None, str(e)

    if result.returncode != 0 or not result.stdout:
        error = result.stderr.decode("utf-8", errors="replace")
        _diagram_cache[version] = {"mtime": mtime, "svg": None, "error": error}
        return None, error

    _diagram_cache[version] = {"mtime": mtime, "svg": result.stdout, "error": None}
    return result.stdout, None


@app.route("/architektur")
def architecture():
    return render_template("architecture.html", active_page="architecture")


@app.route("/architektur/diagram.svg")
def architecture_diagram():
    version = request.args.get("v", "1")
    svg, error = render_diagram_svg(version)
    if error:
        return Response(f"PlantUML-Renderfehler:\n\n{error}", status=500, mimetype="text/plain")
    return Response(svg, mimetype="image/svg+xml")


@app.route("/datenbank")
def database():
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, law_short, norm_ref, title, valid_from, valid_to
        FROM norms
        ORDER BY law_short, norm_ref, valid_from
        """
    )
    cols = ["id", "law_short", "norm_ref", "title", "valid_from", "valid_to"]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.close()

    today = date.today()
    groups = {}
    for r in rows:
        r["status"] = classify_validity(r["valid_from"], r["valid_to"], today)
        groups.setdefault(r["law_short"], []).append(r)

    return render_template(
        "database.html",
        active_page="database",
        groups=groups,
        total_norms=len(rows),
        total_laws=len(groups),
    )


@app.route("/definitionen")
def definitions():
    cur = conn.cursor()
    cur.execute("SELECT id, term, definition_text FROM definitions ORDER BY term")
    defs = [dict(zip(["id", "term", "definition_text"], r)) for r in cur.fetchall()]

    for d in defs:
        cur.execute(
            """
            SELECT n.id, n.law_short, n.norm_ref, n.title, dl.role
            FROM definition_links dl
            JOIN norms n ON n.id = dl.norm_id
            WHERE dl.definition_id = %s
            ORDER BY dl.role, n.law_short, n.norm_ref
            """,
            (d["id"],),
        )
        links = [dict(zip(["id", "law_short", "norm_ref", "title", "role"], r)) for r in cur.fetchall()]
        d["defined_by"] = [l for l in links if l["role"] == "definiert"]
        d["used_by"] = [l for l in links if l["role"] == "verwendet"]

    cur.close()
    return render_template("definitions.html", active_page="definitions", definitions=defs)


@app.route("/jev")
def jev_view():
    cur = conn.cursor()
    cur.execute(
        """
        SELECT query, law_short, probability, relevant, created_at
        FROM jev_classifications
        ORDER BY created_at DESC
        LIMIT 200
        """
    )
    cols = ["query", "law_short", "probability", "relevant", "created_at"]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.close()

    queries = {}
    for r in rows:
        key = (r["created_at"], r["query"])
        queries.setdefault(key, {"query": r["query"], "created_at": r["created_at"], "laws": []})
        queries[key]["laws"].append(r)
    runs = sorted(queries.values(), key=lambda q: q["created_at"], reverse=True)

    return render_template("jev.html", active_page="jev", runs=runs)


@app.route("/api/search")
def api_search():
    query = request.args.get("query", "").strip()
    as_of_str = request.args.get("as_of") or str(date.today())
    top_k = int(request.args.get("top_k", 5))
    candidates = int(request.args.get("candidates", 5))

    if not query:
        return jsonify({"error": "query fehlt"}), 400

    today = date.today()
    cur = conn.cursor()

    qvec = embed_model.encode(f"query: {query}", normalize_embeddings=True)

    matched_defs = find_matching_definitions(cur, query)
    allowed_ids = linked_norm_ids(cur, [d["id"] for d in matched_defs]) if matched_defs else None

    law_classification, jev_error = run_jev_classification(cur, query)

    vec_ids = vector_search(cur, qvec, as_of_str, candidates, allowed_ids)
    txt_ids = text_search(cur, query, as_of_str, candidates, allowed_ids)
    fused = rrf_fuse([vec_ids, txt_ids])
    candidate_ids = [doc_id for doc_id, _ in fused[:candidates]]
    rows = fetch_rows(cur, candidate_ids)
    cur.close()

    results = []
    if candidate_ids:
        pairs = [(query, f"{rows[i]['heading_context']}\n{rows[i]['body']}") for i in candidate_ids]
        rerank_scores = reranker.predict(pairs)
        ranked = sorted(zip(candidate_ids, rerank_scores), key=lambda x: x[1], reverse=True)

        for doc_id, score in ranked[:top_k]:
            r = rows[doc_id]
            results.append(
                {
                    "id": r["id"],
                    "score": float(score),
                    "law_short": r["law_short"],
                    "norm_ref": r["norm_ref"],
                    "title": r["title"],
                    "body": r["body"],
                    "valid_from": str(r["valid_from"]),
                    "valid_to": str(r["valid_to"]) if r["valid_to"] else None,
                    "source_url": r["source_url"],
                    "status": classify_validity(r["valid_from"], r["valid_to"], today),
                }
            )

    return jsonify(
        {
            "query": query,
            "as_of": as_of_str,
            "vector_candidates": len(vec_ids),
            "text_candidates": len(txt_ids),
            "fused_candidates": len(candidate_ids),
            "matched_definitions": [{"term": d["term"]} for d in matched_defs],
            "allowed_norm_count": len(allowed_ids) if allowed_ids is not None else None,
            "law_classification": law_classification,
            "jev_error": jev_error,
            "results": results,
        }
    )


@app.route("/api/norms")
def api_norms():
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, law_short, norm_ref, title, valid_from, valid_to
        FROM norms
        ORDER BY law_short, norm_ref, valid_from
        """
    )
    cols = ["id", "law_short", "norm_ref", "title", "valid_from", "valid_to"]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    cur.close()

    today = date.today()
    norms = [
        {
            "id": r["id"],
            "law_short": r["law_short"],
            "norm_ref": r["norm_ref"],
            "title": r["title"],
            "valid_from": str(r["valid_from"]),
            "valid_to": str(r["valid_to"]) if r["valid_to"] else None,
            "status": classify_validity(r["valid_from"], r["valid_to"], today),
        }
        for r in rows
    ]
    return jsonify({"norms": norms, "today": str(today)})


@app.route("/norm/<int:norm_id>")
def norm_detail(norm_id):
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, law_short, norm_ref, title, heading_context, body, valid_from, valid_to, source_url
        FROM norms WHERE id = %s
        """,
        (norm_id,),
    )
    row = cur.fetchone()
    if row is None:
        cur.close()
        abort(404)

    cols = ["id", "law_short", "norm_ref", "title", "heading_context", "body", "valid_from", "valid_to", "source_url"]
    norm = dict(zip(cols, row))

    cur.execute(
        """
        SELECT id, valid_from, valid_to, title
        FROM norms
        WHERE law_short = %s AND norm_ref = %s
        ORDER BY valid_from
        """,
        (norm["law_short"], norm["norm_ref"]),
    )
    versions = [dict(zip(["id", "valid_from", "valid_to", "title"], r)) for r in cur.fetchall()]

    cur.execute(
        """
        SELECT d.id, d.term, dl.role
        FROM definition_links dl
        JOIN definitions d ON d.id = dl.definition_id
        WHERE dl.norm_id = %s
        ORDER BY dl.role, d.term
        """,
        (norm_id,),
    )
    def_links = [dict(zip(["id", "term", "role"], r)) for r in cur.fetchall()]
    defines = [l for l in def_links if l["role"] == "definiert"]
    uses = [l for l in def_links if l["role"] == "verwendet"]

    cur.close()

    today = date.today()
    norm["status"] = classify_validity(norm["valid_from"], norm["valid_to"], today)
    for v in versions:
        v["status"] = classify_validity(v["valid_from"], v["valid_to"], today)

    return render_template(
        "norm_detail.html", norm=norm, versions=versions, defines=defines, uses=uses
    )


if __name__ == "__main__":
    app.run(debug=False, port=5050)
