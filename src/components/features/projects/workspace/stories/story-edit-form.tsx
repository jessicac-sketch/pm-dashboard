"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DraftStory, DraftSubtask, SubtaskKind } from "@/types/stories";

type StoryEditFormProps = {
  id: number;
  story: DraftStory;
  onSave: (story: DraftStory) => void;
  onCancel: () => void;
};

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

// Subtasks are edited one per line as "API: ...", "UI: ..." or plain text for "Other".
const subtaskLine = (s: DraftSubtask) => (s.kind === "Other" ? s.summary : `${s.kind}: ${s.summary}`);
const parseSubtask = (line: string): DraftSubtask => {
  const match = line.match(/^(API|UI)\s*:\s*(.+)$/i);
  return match ? { kind: match[1].toUpperCase() as SubtaskKind, summary: match[2].trim() } : { kind: "Other", summary: line };
};

export const StoryEditForm = ({ id, story, onSave, onCancel }: StoryEditFormProps) => {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);
  const [uiux, setUiux] = useState(story.uiux);
  const [criteria, setCriteria] = useState(story.criteria.join("\n"));
  const [subtasks, setSubtasks] = useState(story.subtasks.map(subtaskLine).join("\n"));
  const valid = title.trim() !== "" && lines(criteria).length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      uiux: uiux.trim() || "TBD",
      criteria: lines(criteria),
      subtasks: lines(subtasks).map(parseSubtask),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input id={`story-${id}-title`} label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      <Textarea id={`story-${id}-desc`} label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input id={`story-${id}-uiux`} label="UI/UX link" placeholder="TBD" value={uiux} onChange={(e) => setUiux(e.target.value)} />
      <Textarea
        id={`story-${id}-criteria`}
        label="User Acceptance Criteria"
        hint="One per line. They're numbered automatically."
        rows={Math.max(4, lines(criteria).length + 1)}
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
      />
      <Textarea
        id={`story-${id}-subtasks`}
        label="Subtasks"
        hint='One per line. Start with "API:" or "UI:" to mark the side.'
        rows={3}
        value={subtasks}
        onChange={(e) => setSubtasks(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" icon={Check} disabled={!valid}>
          Save changes
        </Button>
      </div>
    </form>
  );
};
