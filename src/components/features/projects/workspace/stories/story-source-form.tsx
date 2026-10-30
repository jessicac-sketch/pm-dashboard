"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/query-state";
import { Textarea } from "@/components/ui/textarea";
import type { StorySource } from "@/types/stories";

type StorySourceFormProps = {
  jiraConnected: boolean;
  generating: boolean;
  error: Error | null;
  onGenerate: (source: StorySource) => void;
};

const JIRA_KEY = /^[A-Za-z][A-Za-z0-9]+-\d+$/;

export const StorySourceForm = ({ jiraConnected, generating, error, onGenerate }: StorySourceFormProps) => {
  const [jiraKey, setJiraKey] = useState("");
  const [idea, setIdea] = useState("");
  const keyValid = jiraKey.trim() === "" || JIRA_KEY.test(jiraKey.trim());
  const canGenerate = keyValid && (jiraKey.trim() !== "" || idea.trim() !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canGenerate) onGenerate({ jiraKey: jiraKey.trim().toUpperCase() || null, idea: idea.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-extrabold">Write stories with AI</h2>
        <p className="text-sm text-muted">
          Start from a Jira epic or story, or describe what you need. The AI splits it into sprint-sized stories with short acceptance
          criteria. You approve, edit or decline each one before anything is created in Jira.
        </p>
      </div>

      {jiraConnected && (
        <div className="max-w-xs">
          <Input
            id="story-jira-key"
            label="Jira epic or story (optional)"
            placeholder="e.g. PB-4 or PB-210"
            value={jiraKey}
            onChange={(e) => setJiraKey(e.target.value)}
            aria-invalid={!keyValid}
            className="uppercase"
          />
          {!keyValid && (
            <p className="mt-1 flex items-center gap-1 text-xs text-danger">
              <AlertTriangle className="size-3.5" aria-hidden />
              Use a Jira key like PB-210.
            </p>
          )}
        </div>
      )}
      <Textarea
        id="story-idea"
        label={jiraConnected ? "What you need, or notes for the AI" : "What you need"}
        rows={5}
        placeholder="e.g. Admin generates a proposal for a franchisee, the franchisee gets an email with a link to view it and a link to request changes."
        hint={jiraConnected ? "With a Jira key, this is optional: use it for extra context, like what to leave out." : undefined}
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />

      {error && <ErrorMessage error={error} />}
      <div>
        <Button type="submit" icon={Sparkles} loading={generating} disabled={!canGenerate}>
          {generating ? "Writing stories…" : "Generate stories"}
        </Button>
      </div>
    </form>
  );
};
