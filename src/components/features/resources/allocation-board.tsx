"use client";

import { ErrorMessage, Loading } from "@/components/ui/query-state";
import { useAllocations } from "@/hooks/queries/use-allocations";
import { usePeople } from "@/hooks/queries/use-people";
import { useProjects } from "@/hooks/queries/use-projects";
import { AllocationBoardView } from "./allocation-board-view";

// Loads everything the board needs, then hands off to the interactive view.
export const AllocationBoard = () => {
  const people = usePeople();
  const projects = useProjects();
  const allocations = useAllocations();

  if (people.isPending || projects.isPending || allocations.isPending) return <Loading variant="page" />;
  if (people.isError) return <ErrorMessage error={people.error} />;
  if (projects.isError) return <ErrorMessage error={projects.error} />;
  if (allocations.isError) return <ErrorMessage error={allocations.error} />;

  const openProjects = projects.data.filter((p) => p.status !== "completed");

  return (
    <AllocationBoardView people={people.data} projects={openProjects} allocations={allocations.data} />
  );
};
