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

-- Definitionsbibliothek: Rechtsbegriffe, die eine Norm definiert und die andere
-- Normen verwenden. Wird zur Suchzeit genutzt, um bei erkanntem Begriff die
-- Kandidatenmenge hart auf verknüpfte Normen einzuschränken.
CREATE TABLE IF NOT EXISTS definitions (
    id SERIAL PRIMARY KEY,
    term VARCHAR(100) NOT NULL UNIQUE,
    definition_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS definition_links (
    id SERIAL PRIMARY KEY,
    definition_id INTEGER NOT NULL REFERENCES definitions(id) ON DELETE CASCADE,
    norm_id INTEGER NOT NULL REFERENCES norms(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('definiert', 'verwendet')),
    UNIQUE (definition_id, norm_id, role)
);

CREATE INDEX IF NOT EXISTS definition_links_norm_idx ON definition_links (norm_id);
CREATE INDEX IF NOT EXISTS definition_links_def_idx ON definition_links (definition_id);

-- Protokoll der Jev-Klassifikationen: pro Suchanfrage und Gesetz, ob Jev
-- (TypeSafe AI, "Noul"-Frage) das Gesetz als einschlägig eingestuft hat.
CREATE TABLE IF NOT EXISTS jev_classifications (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    law_short VARCHAR(50) NOT NULL,
    probability REAL NOT NULL,
    relevant BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jev_classifications_created_idx ON jev_classifications (created_at DESC);

-- Protokoll der Jev-Normen-Klassifikation: zweite Stufe, läuft nur für Normen
-- von Gesetzen, die in jev_classifications als relevant (>= 50 %) eingestuft wurden.
CREATE TABLE IF NOT EXISTS jev_norm_classifications (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    norm_id INTEGER NOT NULL REFERENCES norms(id) ON DELETE CASCADE,
    probability REAL NOT NULL,
    relevant BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jev_norm_classifications_created_idx ON jev_norm_classifications (created_at DESC);
CREATE INDEX IF NOT EXISTS jev_norm_classifications_norm_idx ON jev_norm_classifications (norm_id);
