import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/home-page";
import { ProjectPage } from "./pages/project-page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:projectId" element={<ProjectPage />} />
    </Routes>
  );
}
