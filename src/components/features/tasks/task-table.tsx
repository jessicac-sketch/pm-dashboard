"use client";

import { Empty, ErrorMessage, Loading } from "@/components/ui/query-state";
import { useTasks } from "@/hooks/queries/use-tasks";
import { formatEnum } from "@/lib/format";

export const TaskTable = () => {
  const { data: tasks, isPending, error } = useTasks();

  if (isPending) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (tasks.length === 0) return <Empty message="No tasks yet." />;

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Title</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Priority</th>
            <th className="px-3 py-2 font-semibold">Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          {tasks.map((t) => (
            <tr key={t.id} className="hover:bg-accent">
              <td className="px-3 py-2">{t.title}</td>
              <td className="px-3 py-2">{formatEnum(t.status)}</td>
              <td className="px-3 py-2">{formatEnum(t.priority)}</td>
              <td className="px-3 py-2">{t.due_date ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
