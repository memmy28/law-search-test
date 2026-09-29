import argparse
import os
from datetime import date

import psycopg2
from pgvector.psycopg2 import register_vector
from sentence_transformers import CrossEncoder, SentenceTransformer

DB_URL = os.environ.get("DATABASE_URL", "postgresql://legal:legal@localhost:5433/legaldb")
EMBED_MODEL = "intfloat/multilingual-e5-small"
RERANK_MODEL = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"
RRF_K = 60


def rrf_fuse(rank_lists, k=RRF_K):
    scores = {}
    for ranked_ids in rank_lists:
        for rank, doc_id in enumerate(ranked_ids, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)


def vector_search(cur, qvec, as_of, limit, allowed_ids=None):
    cur.execute(
        """
        SELECT id FROM norms
        WHERE daterange(valid_from, valid_to, '[]') @> %s::date
          AND (%s::int[] IS NULL OR id = ANY(%s))
        ORDER BY embedding <=> %s
        LIMIT %s
        """,
        (as_of, allowed_ids, allowed_ids, qvec, limit),
    )
    return [row[0] for row in cur.fetchall()]


def text_search(cur, query, as_of, limit, allowed_ids=None):
    cur.execute(
        """
        SELECT id FROM norms
        WHERE daterange(valid_from, valid_to, '[]') @> %s::date
          AND (%s::int[] IS NULL OR id = ANY(%s))
          AND search_vector @@ plainto_tsquery('german', %s)
        ORDER BY ts_rank(search_vector, plainto_tsquery('german', %s)) DESC
        LIMIT %s
        """,
        (as_of, allowed_ids, allowed_ids, query, query, limit),
    )
    return [row[0] for row in cur.fetchall()]


def find_matching_definitions(cur, query):
    """Erkennt Rechtsbegriffe aus der Definitionsbibliothek in der Anfrage
    (case-insensitiver Teilstring-Abgleich - ein Prototyp-Kompromiss, der
    Stemming/Flexionsformen wie "Auftragsverarbeitern" als Präfix mitnimmt,
    aber keine echte linguistische Analyse ersetzt)."""
    cur.execute("SELECT id, term, definition_text FROM definitions")
    query_lower = query.lower()
    return [
        {"id": def_id, "term": term, "definition_text": definition_text}
        for def_id, term, definition_text in cur.fetchall()
        if term.lower() in query_lower
    ]


def linked_norm_ids(cur, definition_ids):
    if not definition_ids:
        return None
    cur.execute(
        "SELECT DISTINCT norm_id FROM definition_links WHERE definition_id = ANY(%s)",
        (definition_ids,),
    )
    return [row[0] for row in cur.fetchall()]


def fetch_rows(cur, ids):
    if not ids:
        return {}
    cur.execute(
        """
        SELECT id, law_short, norm_ref, title, heading_context, body, valid_from, valid_to, source_url
        FROM norms WHERE id = ANY(%s)
        """,
        (ids,),
    )
    cols = ["id", "law_short", "norm_ref", "title", "heading_context", "body", "valid_from", "valid_to", "source_url"]
    return {row[0]: dict(zip(cols, row)) for row in cur.fetchall()}


def main():
    parser = argparse.ArgumentParser(description="Prototyp: hybride Suche über zeitlich versionierte Normen")
    parser.add_argument("query", help="Frage / Fallbeschreibung")
    parser.add_argument("--as-of", default=str(date.today()), help="Stichtag YYYY-MM-DD (Standard: heute)")
    parser.add_argument("--candidates", type=int, default=5, help="Kandidaten pro Suchweg vor dem Reranking")
    parser.add_argument("--top-k", type=int, default=5, help="Anzahl Ergebnisse nach Reranking")
    args = parser.parse_args()

    print("Lade Modelle ...")
    embed_model = SentenceTransformer(EMBED_MODEL)
    reranker = CrossEncoder(RERANK_MODEL)

    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    cur = conn.cursor()

    qvec = embed_model.encode(f"query: {args.query}", normalize_embeddings=True)

    matched_defs = find_matching_definitions(cur, args.query)
    allowed_ids = linked_norm_ids(cur, [d["id"] for d in matched_defs]) if matched_defs else None

    vec_ids = vector_search(cur, qvec, args.as_of, args.candidates, allowed_ids)
    txt_ids = text_search(cur, args.query, args.as_of, args.candidates, allowed_ids)

    fused = rrf_fuse([vec_ids, txt_ids])
    candidate_ids = [doc_id for doc_id, _ in fused[: args.candidates]]
    rows = fetch_rows(cur, candidate_ids)

    print(f"\nAnfrage: {args.query!r}  |  Stichtag: {args.as_of}")
    if matched_defs:
        terms = ", ".join(d["term"] for d in matched_defs)
        print(f"Begriff(e) erkannt: {terms} -> Suche eingeschränkt auf {len(allowed_ids)} verknüpfte Norm(en)")
    print(f"Kandidaten: {len(vec_ids)} (Vektor) / {len(txt_ids)} (Volltext) -> {len(candidate_ids)} nach RRF-Fusion")

    if not candidate_ids:
        print("Keine an diesem Stichtag gültigen Treffer.")
        cur.close()
        conn.close()
        return

    pairs = [(args.query, f"{rows[i]['heading_context']}\n{rows[i]['body']}") for i in candidate_ids]
    rerank_scores = reranker.predict(pairs)

    ranked = sorted(zip(candidate_ids, rerank_scores), key=lambda x: x[1], reverse=True)

    print()
    for rank, (doc_id, score) in enumerate(ranked[: args.top_k], start=1):
        r = rows[doc_id]
        valid_to = r["valid_to"] or "offen"
        print(f"{rank}. [{score:.3f}] {r['law_short']} {r['norm_ref']} – {r['title']}")
        print(f"   gültig: {r['valid_from']} bis {valid_to}")
        print(f"   {r['body'][:220].strip()}...")
        print(f"   Quelle: {r['source_url']}\n")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
