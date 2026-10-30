// Hand-written to match supabase/migrations/*.sql.
// Regenerate once your project is live:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type PersonRole =
  | "developer"
  | "qa"
  | "designer"
  | "devops"
  | "data_engineer"
  | "project_manager"
  | "business_analyst"
  | "other";
export type EmploymentType = "regular" | "intern" | "contractor";
export type DevStack = "frontend" | "backend" | "fullstack";
export type ProjectColor = "magenta" | "blue" | "teal" | "amber" | "violet";
export type WbsKind = "phase" | "work_package" | "milestone";
export type RiskCategory = "resourcing" | "technical" | "scope" | "schedule" | "compliance" | "budget" | "other";
export type RiskResponse = "mitigate" | "avoid" | "transfer" | "accept";
export type RiskStatus = "open" | "mitigating" | "closed";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueStatus = "open" | "resolved";
export type ProjectType = "product" | "rnd";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          start_date: string | null;
          due_date: string | null;
          code: string | null;
          color: ProjectColor;
          required_fte: number | null;
          lead_person_id: string | null;
          jira_board_id: number | null;
          required_roles: PersonRole[];
          project_type: ProjectType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          start_date?: string | null;
          due_date?: string | null;
          code?: string | null;
          color?: ProjectColor;
          required_fte?: number | null;
          lead_person_id?: string | null;
          jira_board_id?: number | null;
          required_roles?: PersonRole[];
          project_type?: ProjectType;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          assignee: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          assignee?: string | null;
          due_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      people: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          title: string | null;
          role: PersonRole;
          employment_type: EmploymentType;
          stack: DevStack | null;
          sprint_capacity_hours: number;
          jira_account_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          title?: string | null;
          role?: PersonRole;
          employment_type?: EmploymentType;
          stack?: DevStack | null;
          sprint_capacity_hours?: number;
          jira_account_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Insert"]>;
        Relationships: [];
      };
      allocations: {
        Row: {
          id: string;
          person_id: string;
          project_id: string;
          hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          project_id: string;
          hours: number;
        };
        Update: Partial<Database["public"]["Tables"]["allocations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "allocations_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "allocations_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      wbs_items: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          kind: WbsKind;
          name: string;
          owner_person_id: string | null;
          start_date: string | null;
          end_date: string | null;
          estimate_days: number | null;
          progress: number;
          jira_key: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          kind: WbsKind;
          name: string;
          owner_person_id?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          estimate_days?: number | null;
          progress?: number;
          jira_key?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["wbs_items"]["Insert"]>;
        Relationships: [];
      };
      risks: {
        Row: {
          id: string;
          project_id: string;
          ref_number: number;
          title: string;
          category: RiskCategory;
          wbs_item_id: string | null;
          probability: number;
          impact: number;
          residual_probability: number;
          residual_impact: number;
          response: RiskResponse;
          trigger_sign: string | null;
          response_plan: string | null;
          contingency: string | null;
          impact_note: string | null;
          owner_person_id: string | null;
          status: RiskStatus;
          review_date: string | null;
          suggestion_key: string | null;
          previous_score: number | null;
          score_changed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          category?: RiskCategory;
          wbs_item_id?: string | null;
          probability: number;
          impact: number;
          residual_probability: number;
          residual_impact: number;
          response?: RiskResponse;
          trigger_sign?: string | null;
          response_plan?: string | null;
          contingency?: string | null;
          impact_note?: string | null;
          owner_person_id?: string | null;
          status?: RiskStatus;
          review_date?: string | null;
          suggestion_key?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["risks"]["Insert"]>;
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          project_id: string;
          ref_number: number;
          title: string;
          action_plan: string | null;
          severity: IssueSeverity;
          source: string | null;
          risk_id: string | null;
          owner_person_id: string | null;
          raised_on: string;
          due_date: string | null;
          status: IssueStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          action_plan?: string | null;
          severity?: IssueSeverity;
          source?: string | null;
          risk_id?: string | null;
          owner_person_id?: string | null;
          raised_on?: string;
          due_date?: string | null;
          status?: IssueStatus;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          occurred_on: string;
          service_name: string;
          service_key: string;
          statement_name: string | null;
          address: string | null;
          city_state: string | null;
          zip_code: string | null;
          country: string | null;
          reference_number: string | null;
          category: string | null;
          amount: number;
          service_id: string | null;
          /** First day of the statement month this charge was imported with. */
          statement_month: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          occurred_on: string;
          statement_month?: string;
          service_name: string;
          statement_name?: string | null;
          address?: string | null;
          city_state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          reference_number?: string | null;
          category?: string | null;
          amount: number;
          service_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      expense_services: {
        Row: {
          id: string;
          name: string;
          statement_match: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          statement_match?: string | null;
          category?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["expense_services"]["Insert"]>;
        Relationships: [];
      };
      expense_service_project_links: {
        Row: { service_id: string; project_id: string };
        Insert: { service_id: string; project_id: string };
        Update: Partial<{ service_id: string; project_id: string }>;
        Relationships: [];
      };
      expense_remarks: {
        Row: { service_id: string; month: string; remark: string; dismissed: boolean; updated_at: string };
        Insert: { service_id: string; month: string; remark?: string; dismissed?: boolean };
        Update: Partial<{ service_id: string; month: string; remark: string; dismissed: boolean }>;
        Relationships: [];
      };
      expense_month_reviews: {
        Row: { month: string; report_sent_at: string | null; updated_at: string };
        Insert: { month: string; report_sent_at?: string | null };
        Update: Partial<{ month: string; report_sent_at: string | null }>;
        Relationships: [];
      };
      dismissed_risk_suggestions: {        Row: { project_id: string; suggestion_key: string; dismissed_at: string };
        Insert: { project_id: string; suggestion_key: string };
        Update: Partial<Database["public"]["Tables"]["dismissed_risk_suggestions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      project_status: ProjectStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      person_role: PersonRole;
      employment_type: EmploymentType;
      dev_stack: DevStack;
      project_color: ProjectColor;
      wbs_kind: WbsKind;
      risk_category: RiskCategory;
      risk_response: RiskResponse;
      risk_status: RiskStatus;
      issue_severity: IssueSeverity;
      issue_status: IssueStatus;
      project_type: ProjectType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type Tables = Database["public"]["Tables"];

export type Project = Tables["projects"]["Row"];
export type ProjectInsert = Tables["projects"]["Insert"];
export type ProjectUpdate = Tables["projects"]["Update"];

export type Task = Tables["tasks"]["Row"];
export type TaskInsert = Tables["tasks"]["Insert"];
export type TaskUpdate = Tables["tasks"]["Update"];

export type Person = Tables["people"]["Row"];
export type PersonInsert = Tables["people"]["Insert"];
export type PersonUpdate = Tables["people"]["Update"];

export type Allocation = Tables["allocations"]["Row"];
export type AllocationInsert = Tables["allocations"]["Insert"];

export type WbsItem = Tables["wbs_items"]["Row"];
export type WbsItemInsert = Tables["wbs_items"]["Insert"];
export type WbsItemUpdate = Tables["wbs_items"]["Update"];

export type Risk = Tables["risks"]["Row"];
export type RiskInsert = Tables["risks"]["Insert"];
export type RiskUpdate = Tables["risks"]["Update"];

export type Issue = Tables["issues"]["Row"];
export type IssueInsert = Tables["issues"]["Insert"];
export type IssueUpdate = Tables["issues"]["Update"];

export type Expense = Tables["expenses"]["Row"];
export type ExpenseInsert = Tables["expenses"]["Insert"];
export type ExpenseUpdate = Tables["expenses"]["Update"];

export type ExpenseService = Tables["expense_services"]["Row"];
export type ExpenseServiceInsert = Tables["expense_services"]["Insert"];
export type ExpenseServiceUpdate = Tables["expense_services"]["Update"];
