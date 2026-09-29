import json
import os

import psycopg2
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer

DB_URL = os.environ.get("DATABASE_URL", "postgresql://legal:legal@localhost:5433/legaldb")
EMBED_MODEL = "intfloat/multilingual-e5-small"
SEED_FILE = os.path.join(os.path.dirname(__file__), "data", "seed_norms.json")


def main():
    with open(SEED_FILE, encoding="utf-8") as f:
        records = json.load(f)

    print(f"Lade Embedding-Modell {EMBED_MODEL} ...")
    model = SentenceTransformer(EMBED_MODEL)

    # e5-Modelle erwarten "passage: " / "query: " Prefixe für beste Ergebnisse.
    texts = [f"passage: {r['heading_context']}\n{r['body']}" for r in records]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)

    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    cur = conn.cursor()
    cur.execute("TRUNCATE norms RESTART IDENTITY")

    for r, emb in zip(records, embeddings):
        cur.execute(
            """
            INSERT INTO norms
                (law_short, norm_ref, title, heading_context, body, valid_from, valid_to, source_url, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                r["law_short"],
                r["norm_ref"],
                r["title"],
                r["heading_context"],
                r["body"],
                r["valid_from"],
                r.get("valid_to"),
                r.get("source_url"),
                emb,
            ),
        )

    conn.commit()
    cur.execute("SELECT count(*) FROM norms")
    print(f"{cur.fetchone()[0]} Normen eingespielt.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
