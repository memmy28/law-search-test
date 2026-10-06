import { Navigate, Route, Routes } from "react-router-dom";
import { Box } from "@mui/material";

import NavBar from "./components/NavBar";
import SearchPage from "./pages/SearchPage";
import DatabasePage from "./pages/DatabasePage";
import DefinitionsPage from "./pages/DefinitionsPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import JevPage from "./pages/JevPage";
import NormDetailPage from "./pages/NormDetailPage";

export default function App() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <NavBar />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/datenbank" element={<DatabasePage />} />
        <Route path="/definitionen" element={<DefinitionsPage />} />
        <Route path="/architektur" element={<ArchitecturePage />} />
        <Route path="/jev" element={<JevPage />} />
        <Route path="/norm/:id" element={<NormDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}
