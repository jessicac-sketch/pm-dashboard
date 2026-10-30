import type { ProjectStaffing } from "@/lib/project-staffing";

type ProjectStaffingTextProps = {
  staffing: ProjectStaffing | undefined;
  requiredFte: number | null;
};

// "3 people · 1.25 / 2 FTE", amber when below the target.
export const ProjectStaffingText = ({ staffing, requiredFte }: ProjectStaffingTextProps) => {
  const people = staffing?.people ?? 0;
  const fte = staffing?.fte ?? 0;
  const short = requiredFte !== null && fte < requiredFte;
  return (
    <span className="text-sm">
      <span className="text-muted">
        {people} {people === 1 ? "person" : "people"} ·{" "}
      </span>
      <b className={requiredFte === null ? "text-foreground" : short ? "text-warning" : "text-success"}>
        {fte.toFixed(2)}
        {requiredFte !== null && ` / ${requiredFte}`} FTE
      </b>
    </span>
  );
};
