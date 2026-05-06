export interface TestmoProject {
  id: number;
  name: string;
  description?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestmoTestCase {
  id: number;
  project_id: number;
  title: string;
  priority?: number;
  type?: number;
  template?: number;
  folder_id?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, unknown>;
}

export interface TestmoCaseCustomFields {
  custom_priority?: number;
  custom_description?: string;
  custom_expected?: string;
  custom_preconditions?: string;
  custom_steps?: Array<{ text1: string; text3?: string }>;
  [key: string]: unknown;
}

export interface TestmoCreateCaseInput extends TestmoCaseCustomFields {
  name: string;
  type?: number;
  template?: number;
  folder_id?: number;
  state_id?: number;
  estimate?: number;
  tags?: string[];
  issues?: number[];
}

export interface TestmoUpdateCasesInput extends TestmoCaseCustomFields {
  ids: number[];
  name?: string;
  folder_id?: number;
  state_id?: number;
  status_id?: number;
  estimate?: number;
  tags?: string[];
  issues?: number[];
}

export interface TestmoFolder {
  id: number;
  project_id: number;
  name: string;
  parent_id?: number;
  depth?: number;
  created_at: string;
  updated_at: string;
}

export interface TestmoAutomationRun {
  id: number;
  project_id: number;
  name: string;
  source?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface TestmoRunThread {
  id: number;
  run_id: number;
  name: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface TestmoRunResult {
  id: number;
  run_id: number;
  case_id?: number;
  title: string;
  status: number;
  duration?: number;
  comment?: string;
  created_at: string;
}

export interface TestmoTestRun {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignee_id?: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface TestmoSession {
  id: number;
  project_id: number;
  name: string;
  assignee_id?: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface TestmoAutomationSource {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TestmoMilestone {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestmoUser {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestmoGroup {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TestmoRole {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TestmoAttachment {
  id: number;
  case_id: number;
  filename: string;
  size: number;
  mime_type?: string;
  url?: string;
  created_at: string;
}

export interface TestmoPaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
