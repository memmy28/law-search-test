import { useState } from "react";
import { Alert, Box, Card, CardContent, Container } from "@mui/material";

import { useAppState } from "../state/AppStateContext";
import PageHeader from "../components/PageHeader";

const SUBTITLES = {
  1: "Hybride Suche mit Zeitfilter, RRF und Reranking — grün markiert, was im Prototyp bereits umgesetzt ist, gelb teilweise, rot noch offen.",
  2: "Erweiterung um eine Definitionsbibliothek (gelb markiert) — Begriffe aus der Anfrage schränken die Kandidatennormen vor der eigentlichen Suche hart ein.",
  3: "Erweiterung um die zweistufige Jev-Klassifikation (gelb markiert) — läuft parallel zur Suche und schätzt pro Gesetz und, bei ≥ 50 %, pro Norm ein, ob sie einschlägig sind, ohne die Kandidatenmenge zu beeinflussen.",
};

export default function ArchitecturePage() {
  const { diagramVersion } = useAppState();
  const [failed, setFailed] = useState(false);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Such-Pipeline"
        tag="Architektur"
        subtitle={`${SUBTITLES[diagramVersion]} Zum Wechseln den Stand oben rechts in der Navigation umschalten.`}
      />

      <Card>
        <CardContent sx={{ overflowX: "auto", p: 3 }}>
          {failed ? (
            <Alert severity="error">
              Das Diagramm konnte nicht gerendert werden. PlantUML läuft über Docker (
              <code>docker run plantuml/plantuml</code>) — läuft Docker?
            </Alert>
          ) : (
            <Box
              component="img"
              key={diagramVersion}
              src={`/api/diagram.svg?v=${diagramVersion}`}
              alt={`Such-Pipeline Diagramm, Version ${diagramVersion}`}
              onError={() => setFailed(true)}
              sx={{ display: "block", maxWidth: "100%", mx: "auto" }}
            />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
