"use client";

import { Check, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import { Select } from "@/components/ui/select";
import { useCreatePerson, useUpdatePerson } from "@/hooks/queries/use-people";
import { EMPLOYMENT_OPTIONS, FULL_TIME_SPRINT_HOURS, ROLE_OPTIONS, STACK_OPTIONS } from "@/lib/people";
import type { DevStack, EmploymentType, Person, PersonRole } from "@/types/database";

/** The database allows up to 120 hours in a 2-week sprint. */
const MAX_SPRINT_HOURS = 120;

const formFor = (person?: Person) => ({
  fullName: person?.full_name ?? "",
  title: person?.title ?? "",
  email: person?.email ?? "",
  role: person?.role ?? ("developer" as PersonRole),
  stack: (person?.stack ?? "") as DevStack | "",
  employmentType: person?.employment_type ?? ("regular" as EmploymentType),
  capacity: String(person?.sprint_capacity_hours ?? FULL_TIME_SPRINT_HOURS),
});

type PersonDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Edit this person; otherwise add a new one. */
  person?: Person;
};

export const PersonDialog = ({ open, onClose, person }: PersonDialogProps) => {
  const createPerson = useCreatePerson();
  const updatePerson = useUpdatePerson();
  const mutation = person ? updatePerson : createPerson;
  const [form, setForm] = useState(() => formFor(person));

  const update = <K extends keyof ReturnType<typeof formFor>,>(key: K, value: ReturnType<typeof formFor>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    setForm(formFor(person));
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      full_name: form.fullName.trim(),
      title: form.title.trim() || null,
      email: form.email.trim() || null,
      role: form.role,
      stack: form.stack || null,
      employment_type: form.employmentType,
      sprint_capacity_hours: Number(form.capacity),
    };
    if (person) updatePerson.mutate({ id: person.id, input }, { onSuccess: close });
    else createPerson.mutate(input, { onSuccess: close });
  };

  const capacity = Number(form.capacity);
  const valid = form.fullName.trim() !== "" && capacity > 0 && capacity <= MAX_SPRINT_HOURS;

  return (
    <Dialog
      open={open}
      onClose={close}
      title={person ? `Edit ${person.full_name}` : "Add person"}
      description={person ? "Changes show on the board right away." : "They'll appear on the bench, ready to place."}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="person-name" label="Full name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required autoFocus />
        <div className="grid grid-cols-3 gap-3">
          <Select id="person-role" label="Role" options={ROLE_OPTIONS} value={form.role} onChange={(e) => update("role", e.target.value as PersonRole)} />
          <Select id="person-stack" label="Stack" options={STACK_OPTIONS} value={form.stack} onChange={(e) => update("stack", e.target.value as DevStack | "")} />
          <Select
            id="person-type"
            label="Type"
            options={EMPLOYMENT_OPTIONS}
            value={form.employmentType}
            onChange={(e) => update("employmentType", e.target.value as EmploymentType)}
          />
        </div>
        <Input
          id="person-title"
          label="Job title (optional)"
          placeholder="e.g. Senior Developer"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input id="person-email" label="Email (optional)" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <Input
            id="person-capacity"
            label="Hours per sprint (2 weeks)"
            type="number"
            min={1}
            max={MAX_SPRINT_HOURS}
            value={form.capacity}
            onChange={(e) => update("capacity", e.target.value)}
          />
        </div>

        {mutation.error && <ErrorMessage error={mutation.error} />}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" icon={person ? Check : UserPlus} loading={mutation.isPending} disabled={!valid}>
            {person ? "Save" : "Add person"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
