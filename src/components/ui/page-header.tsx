type PageHeaderProps = {
  title: string;
  description?: string;
  /** Right-aligned actions, e.g. a primary button. */
  actions?: React.ReactNode;
};

export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
    {actions}
  </div>
);
