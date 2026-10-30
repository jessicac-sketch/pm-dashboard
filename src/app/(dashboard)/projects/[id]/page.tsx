import { ProjectWorkspace } from "@/components/features/projects/workspace/project-workspace";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

const ProjectPage = async ({ params }: ProjectPageProps) => {
  const { id } = await params;
  return <ProjectWorkspace id={id} />;
};

export default ProjectPage;
