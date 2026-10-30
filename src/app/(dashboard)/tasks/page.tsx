import { TaskTable } from "@/components/features/tasks/task-table";
import { PageHeader } from "@/components/ui/page-header";

const TasksPage = () => (
  <>
    <PageHeader title="Tasks" />
    <TaskTable />
  </>
);

export default TasksPage;
