"use client";

import { FolderPlus, LayoutGrid, List } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Empty, ErrorMessage, Loading } from "@/components/ui/query-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useAllocations } from "@/hooks/queries/use-allocations";
import { usePeople } from "@/hooks/queries/use-people";
import { useProjects } from "@/hooks/queries/use-projects";
import { staffingByProject } from "@/lib/project-staffing";
import { ProjectCreateDialog } from "./project-create-dialog";
import { ProjectGrid } from "./project-grid";
import { ProjectTable } from "./project-table";

type ProjectsView = "grid" | "list";

const VIEW_OPTIONS = [
  { value: "list", label: "List", icon: List },
  { value: "grid", label: "Grid", icon: LayoutGrid },
] as const;

export const ProjectsManager = () => {
  const projects = useProjects();
  const allocations = useAllocations();
  const people = usePeople();
  const [view, setView] = useState<ProjectsView>("list");
  const [creating, setCreating] = useState(false);

  // Staffing is extra detail: if it fails to load, the list still shows without it.
  const staffing = useMemo(
    () => staffingByProject(allocations.data ?? [], people.data ?? []),
    [allocations.data, people.data],
  );

  const count = projects.data?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Projects"
        description={projects.data ? `${count} ${count === 1 ? "project" : "projects"} in your portfolio` : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <SegmentedControl label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
            <Button icon={FolderPlus} onClick={() => setCreating(true)}>
              New project
            </Button>
          </div>
        }
      />

      {projects.isPending ? (
        <Loading variant="page" />
      ) : projects.isError ? (
        <ErrorMessage error={projects.error} />
      ) : count === 0 ? (
        <Empty message="No projects yet. Use New project to add your first one." />
      ) : view === "grid" ? (
        <ProjectGrid projects={projects.data} staffing={staffing} />
      ) : (
        <ProjectTable projects={projects.data} staffing={staffing} />
      )}

      <ProjectCreateDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
};
