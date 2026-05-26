import { createRequire } from "module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TestmoClient } from "./client.js";
import { env } from "./env.js";

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

const client = new TestmoClient(env.TESTMO_BASE_URL, env.TESTMO_ACCESS_TOKEN, version);
const server = new McpServer({ name: "testmo", version });

type ToolResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };

function withErrorRecovery<T extends object>(
  name: string,
  fn: (args: T) => Promise<ToolResult>
): (args: T) => Promise<ToolResult> {
  return async (args) => {
    const t0 = Date.now();
    process.stderr.write(`[testmo] ${name} called\n`);
    try {
      const result = await fn(args);
      process.stderr.write(`[testmo] ${name} ok (${Date.now() - t0}ms)\n`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[testmo] ${name} error: ${message}\n`);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  };
}

const paginationSchema = {
  page: z.number().int().positive().optional().describe("Page number"),
  limit: z.number().int().positive().max(100).optional().describe("Results per page (max 100)"),
};

// ── Projects ──────────────────────────────────────────────────────────────────

server.registerTool(
  "list_projects",
  {
    title: "List Projects",
    description: "List all projects in Testmo.",
    annotations: { readOnlyHint: true },
    inputSchema: {},
  },
  withErrorRecovery("list_projects", async () => {
    const result = await client.listProjects();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_project",
  {
    title: "Get Project",
    description: "Get details of a Testmo project by ID.",
    annotations: { readOnlyHint: true },
    inputSchema: { id: z.number().int().positive().describe("Project ID") },
  },
  withErrorRecovery("get_project", async ({ id }) => {
    const result = await client.getProject(id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Folders ───────────────────────────────────────────────────────────────────

server.registerTool(
  "list_folders",
  {
    title: "List Folders",
    description: "List folders in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("list_folders", async ({ project_id, page, limit }) => {
    const result = await client.listFolders(project_id, { page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "create_folders",
  {
    title: "Create Folders",
    description: "Create one or more folders in a Testmo project (up to 100).",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      folders: z
        .array(
          z.object({
            name: z.string().min(1).describe("Folder name"),
            parent_id: z.number().int().positive().optional().describe("Parent folder ID"),
          })
        )
        .min(1)
        .max(100)
        .describe("Folders to create"),
    },
  },
  withErrorRecovery("create_folders", async ({ project_id, folders }) => {
    const result = await client.createFolders(project_id, folders);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "update_folders",
  {
    title: "Update Folders",
    description: "Update one or more folders in bulk (up to 100).",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      folders: z
        .array(
          z.object({
            id: z.number().int().positive().describe("Folder ID"),
            name: z.string().min(1).optional().describe("New folder name"),
            parent_id: z.number().int().positive().optional().describe("New parent folder ID"),
          })
        )
        .min(1)
        .max(100)
        .describe("Folders to update"),
    },
  },
  withErrorRecovery("update_folders", async ({ project_id, folders }) => {
    const result = await client.updateFolders(project_id, folders);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "delete_folders",
  {
    title: "Delete Folders",
    description: "Delete one or more folders in bulk (up to 100).",
    annotations: { destructiveHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      folder_ids: z
        .array(z.number().int().positive())
        .min(1)
        .max(100)
        .describe("Folder IDs to delete"),
    },
  },
  withErrorRecovery("delete_folders", async ({ project_id, folder_ids }) => {
    await client.deleteFolders(project_id, folder_ids);
    return { content: [{ type: "text", text: `Deleted ${folder_ids.length} folder(s).` }] };
  })
);

// ── Test Cases ────────────────────────────────────────────────────────────────

server.registerTool(
  "list_cases",
  {
    title: "List Cases",
    description: "List test cases in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      folder_id: z.number().int().positive().optional().describe("Filter by folder ID"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("list_cases", async ({ project_id, page, limit, folder_id }) => {
    const result = await client.listCases(project_id, { page, limit, folder_id });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_case",
  {
    title: "Get Case",
    description: "Get details of a specific test case.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      case_id: z.number().int().positive().describe("Test case ID"),
    },
  },
  withErrorRecovery("get_case", async ({ project_id, case_id }) => {
    const result = await client.getCase(project_id, case_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "create_case",
  {
    title: "Create Case",
    description: "Create a new test case in a Testmo project.",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      name: z.string().min(1).describe("Test case name/title"),
      folder_id: z.number().int().positive().optional().describe("Folder ID"),
      state_id: z.number().int().positive().optional().describe("State ID"),
      estimate: z.number().int().nonnegative().optional().describe("Time estimate in seconds"),
      tags: z.array(z.string()).optional().describe("Tags"),
      issues: z.array(z.number().int().positive()).optional().describe("Linked issue IDs"),
      custom_priority: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional()
        .describe("Priority (1=critical, 2=high, 3=medium, 4=low)"),
      custom_description: z.string().optional().describe("Test case description"),
      custom_preconditions: z.string().optional().describe("Preconditions"),
      custom_expected: z.string().optional().describe("Expected result"),
      custom_steps: z
        .array(
          z.object({
            text1: z.string().describe("Step description"),
            text3: z.string().optional().describe("Expected result for this step"),
          })
        )
        .optional()
        .describe("Test steps"),
      custom_execution_type: z.number().int().positive().optional().describe("Execution type option ID (numeric)"),
      custom_jira_test_nmber: z.string().optional().describe("Jira test number"),
      custom_jira_story_link: z.string().optional().describe("Jira story link URL"),
      custom_status: z.number().int().positive().optional().describe("Status option ID (numeric)"),
      custom_precondition: z.string().optional().describe("Test case preconditions"),
    },
  },
  withErrorRecovery("create_case", async ({ project_id, ...fields }) => {
    const result = await client.createCase(project_id, fields);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "update_cases",
  {
    title: "Update Cases",
    description:
      "Update one or more test cases in bulk — same values applied to all specified case IDs (up to 100).",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      ids: z.array(z.number().int().positive()).min(1).max(100).describe("Case IDs to update"),
      name: z.string().min(1).optional().describe("New title"),
      folder_id: z.number().int().positive().optional().describe("New folder ID"),
      state_id: z.number().int().positive().optional().describe("New state ID"),
      status_id: z.number().int().positive().optional().describe("New status ID"),
      estimate: z.number().int().nonnegative().optional().describe("Time estimate in seconds"),
      tags: z.array(z.string()).optional().describe("Tags (replaces existing)"),
      issues: z.array(z.number().int().positive()).optional().describe("Linked issue IDs"),
      custom_priority: z
        .number()
        .int()
        .min(1)
        .max(4)
        .optional()
        .describe("Priority (1=critical, 2=high, 3=medium, 4=low)"),
      custom_description: z.string().optional().describe("Test case description"),
      custom_preconditions: z.string().optional().describe("Preconditions"),
      custom_expected: z.string().optional().describe("Expected result"),
      custom_steps: z
        .array(
          z.object({
            text1: z.string().describe("Step description"),
            text3: z.string().optional().describe("Expected result for this step"),
          })
        )
        .optional()
        .describe("Test steps (replaces existing)"),
      custom_execution_type: z.number().int().positive().optional().describe("Execution type option ID (numeric)"),
      custom_jira_test_nmber: z.string().optional().describe("Jira test number"),
      custom_jira_story_link: z.string().optional().describe("Jira story link URL"),
      custom_status: z.number().int().positive().optional().describe("Status option ID (numeric)"),
      custom_precondition: z.string().optional().describe("Test case preconditions"),
    },
  },
  withErrorRecovery("update_cases", async ({ project_id, ...fields }) => {
    const result = await client.updateCases(project_id, fields);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "delete_cases",
  {
    title: "Delete Cases",
    description: "Delete one or more test cases in bulk (up to 100).",
    annotations: { destructiveHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      case_ids: z.array(z.number().int().positive()).min(1).max(100).describe("Case IDs to delete"),
    },
  },
  withErrorRecovery("delete_cases", async ({ project_id, case_ids }) => {
    await client.deleteCases(project_id, case_ids);
    return { content: [{ type: "text", text: `Deleted ${case_ids.length} case(s).` }] };
  })
);

// ── Attachments ───────────────────────────────────────────────────────────────

server.registerTool(
  "list_attachments",
  {
    title: "List Attachments",
    description: "List attachments for a test case.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      case_id: z.number().int().positive().describe("Test case ID"),
    },
  },
  withErrorRecovery("list_attachments", async ({ case_id }) => {
    const result = await client.listAttachments(case_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "delete_attachments",
  {
    title: "Delete Attachments",
    description: "Delete one or more attachments from a test case (up to 100).",
    annotations: { destructiveHint: true },
    inputSchema: {
      case_id: z.number().int().positive().describe("Test case ID"),
      attachment_ids: z
        .array(z.number().int().positive())
        .min(1)
        .max(100)
        .describe("Attachment IDs to delete"),
    },
  },
  withErrorRecovery("delete_attachments", async ({ case_id, attachment_ids }) => {
    await client.deleteAttachments(case_id, attachment_ids);
    return { content: [{ type: "text", text: `Deleted ${attachment_ids.length} attachment(s).` }] };
  })
);

// ── Automation Runs ───────────────────────────────────────────────────────────

server.registerTool(
  "list_runs",
  {
    title: "List Automation Runs",
    description: "List automation runs in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      status: z
        .number()
        .int()
        .min(0)
        .max(2)
        .optional()
        .describe("Filter by status: 0=open, 1=complete, 2=aborted"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("list_runs", async ({ project_id, page, limit, status }) => {
    const result = await client.listRuns(project_id, { page, limit, status });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "create_run",
  {
    title: "Create Run",
    description: "Create a new automation run in a Testmo project.",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      name: z.string().min(1).describe("Run name"),
      source: z.string().optional().describe("Source identifier (e.g. CI pipeline name)"),
    },
  },
  withErrorRecovery("create_run", async ({ project_id, name, source }) => {
    const result = await client.createRun(project_id, { name, source });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "complete_run",
  {
    title: "Complete Run",
    description: "Mark an automation run as complete.",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      run_id: z.number().int().positive().describe("Run ID to complete"),
    },
  },
  withErrorRecovery("complete_run", async ({ project_id, run_id }) => {
    await client.completeRun(project_id, run_id);
    return { content: [{ type: "text", text: `Run ${run_id} marked as complete.` }] };
  })
);

server.registerTool(
  "create_run_thread",
  {
    title: "Create Run Thread",
    description: "Create a thread inside an automation run.",
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      run_id: z.number().int().positive().describe("Run ID"),
      name: z.string().min(1).describe("Thread name"),
    },
  },
  withErrorRecovery("create_run_thread", async ({ project_id, run_id, name }) => {
    const result = await client.createRunThread(project_id, run_id, { name });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "append_to_run",
  {
    title: "Append to Run",
    description: "Append artifacts, links, or custom fields to an automation run.",
    inputSchema: {
      run_id: z.number().int().positive().describe("Run ID"),
      artifacts: z
        .array(
          z.object({
            name: z.string().describe("Artifact name"),
            url: z.string().url().describe("Artifact URL"),
          })
        )
        .optional()
        .describe("Artifacts to append"),
      links: z
        .array(
          z.object({
            name: z.string().describe("Link name"),
            url: z.string().url().describe("Link URL"),
          })
        )
        .optional()
        .describe("Links to append"),
    },
  },
  withErrorRecovery("append_to_run", async ({ run_id, artifacts, links }) => {
    await client.appendToRun(run_id, { artifacts, links });
    return { content: [{ type: "text", text: `Appended data to run ${run_id}.` }] };
  })
);

// ── Run Results ───────────────────────────────────────────────────────────────

server.registerTool(
  "get_run_results",
  {
    title: "Get Run Results",
    description: "Get test results for a specific automation run.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      run_id: z.number().int().positive().describe("Run ID"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("get_run_results", async ({ project_id, run_id, page, limit }) => {
    const result = await client.getRunResults(project_id, run_id, { page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Test Runs (manual) ────────────────────────────────────────────────────────

server.registerTool(
  "list_test_runs",
  {
    title: "List Test Runs",
    description: "List manual test runs in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("list_test_runs", async ({ project_id, page, limit }) => {
    const result = await client.listTestRuns(project_id, { page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Sessions ──────────────────────────────────────────────────────────────────

server.registerTool(
  "list_sessions",
  {
    title: "List Sessions",
    description: "List exploratory test sessions in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("list_sessions", async ({ project_id, page, limit }) => {
    const result = await client.listSessions(project_id, { page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Automation Sources ────────────────────────────────────────────────────────

server.registerTool(
  "list_automation_sources",
  {
    title: "List Automation Sources",
    description: "List automation sources in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
    },
  },
  withErrorRecovery("list_automation_sources", async ({ project_id }) => {
    const result = await client.listAutomationSources(project_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_automation_source",
  {
    title: "Get Automation Source",
    description: "Get details of a specific automation source.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      id: z.number().int().positive().describe("Automation source ID"),
    },
  },
  withErrorRecovery("get_automation_source", async ({ id }) => {
    const result = await client.getAutomationSource(id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Milestones ────────────────────────────────────────────────────────────────

server.registerTool(
  "list_milestones",
  {
    title: "List Milestones",
    description: "List milestones in a Testmo project.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      ...paginationSchema,
    },
  },
  withErrorRecovery("list_milestones", async ({ project_id, page, limit }) => {
    const result = await client.listMilestones(project_id, { page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_milestone",
  {
    title: "Get Milestone",
    description: "Get details of a specific milestone.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      project_id: z.number().int().positive().describe("Project ID"),
      milestone_id: z.number().int().positive().describe("Milestone ID"),
    },
  },
  withErrorRecovery("get_milestone", async ({ project_id, milestone_id }) => {
    const result = await client.getMilestone(project_id, milestone_id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Users ─────────────────────────────────────────────────────────────────────

server.registerTool(
  "get_current_user",
  {
    title: "Get Current User",
    description: "Get the currently authenticated Testmo user.",
    annotations: { readOnlyHint: true },
    inputSchema: {},
  },
  withErrorRecovery("get_current_user", async () => {
    const result = await client.getCurrentUser();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "list_users",
  {
    title: "List Users",
    description: "List all users in the Testmo workspace.",
    annotations: { readOnlyHint: true },
    inputSchema: { ...paginationSchema },
  },
  withErrorRecovery("list_users", async ({ page, limit }) => {
    const result = await client.listUsers({ page, limit });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_user",
  {
    title: "Get User",
    description: "Get details of a specific Testmo user.",
    annotations: { readOnlyHint: true },
    inputSchema: { id: z.number().int().positive().describe("User ID") },
  },
  withErrorRecovery("get_user", async ({ id }) => {
    const result = await client.getUser(id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Groups ────────────────────────────────────────────────────────────────────

server.registerTool(
  "list_groups",
  {
    title: "List Groups",
    description: "List all user groups in the Testmo workspace (admin only).",
    annotations: { readOnlyHint: true },
    inputSchema: {},
  },
  withErrorRecovery("list_groups", async () => {
    const result = await client.listGroups();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_group",
  {
    title: "Get Group",
    description: "Get details of a specific user group (admin only).",
    annotations: { readOnlyHint: true },
    inputSchema: { id: z.number().int().positive().describe("Group ID") },
  },
  withErrorRecovery("get_group", async ({ id }) => {
    const result = await client.getGroup(id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Roles ─────────────────────────────────────────────────────────────────────

server.registerTool(
  "list_roles",
  {
    title: "List Roles",
    description: "List all user roles in the Testmo workspace (admin only).",
    annotations: { readOnlyHint: true },
    inputSchema: {},
  },
  withErrorRecovery("list_roles", async () => {
    const result = await client.listRoles();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

server.registerTool(
  "get_role",
  {
    title: "Get Role",
    description: "Get details of a specific user role (admin only).",
    annotations: { readOnlyHint: true },
    inputSchema: { id: z.number().int().positive().describe("Role ID") },
  },
  withErrorRecovery("get_role", async ({ id }) => {
    const result = await client.getRole(id);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  })
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
