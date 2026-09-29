CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Speichereinheit ist die einzelne Norm-Fassung, nicht das Gesetz als Ganzes.
-- Die EXCLUDE-Constraint erzwingt, dass sich zwei Fassungen derselben Norm
-- zeitlich nicht überlappen können.
CREATE TABLE IF NOT EXISTS norms (
    id SERIAL PRIMARY KEY,
    law_short VARCHAR(50) NOT NULL,
    norm_ref VARCHAR(50) NOT NULL,
    title TEXT,
    heading_context TEXT,
    body TEXT NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE,
    source_url TEXT,
    embedding vector(384),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector(
            'german',
            law_short || ' ' || norm_ref || ' ' || coalesce(heading_context, '') || ' ' || body
        )
    ) STORED,
    EXCLUDE USING gist (
        (law_short || ' ' || norm_ref) WITH =,
        daterange(valid_from, valid_to, '[]') WITH &&
    )
);

CREATE INDEX IF NOT EXISTS norms_search_idx ON norms USING gin (search_vector);
CREATE INDEX IF NOT EXISTS norms_embedding_idx ON norms USING hnsw (embedding vector_cosine_ops);
