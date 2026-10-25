import { useParams } from "react-router-dom";
import { ProjectView } from "@/components/project-view";

export function ProjectPage() {
  const { projectId } = useParams();
  if (!projectId) {
    return <p className="p-6 text-sm text-muted-foreground">Missing project id.</p>;
  }
  return <ProjectView projectId={projectId} />;
}
