import { create } from "zustand";
import type { Project, ProjectStatus, FunctionKey } from "./types";

const CURRENT_USER = "Shubham Yeljale";

function now() {
  return new Date().toISOString();
}

const seedProjects: Project[] = [
  mk("simple2", "51002", "TestQuality", "Quality" as FunctionKey, "Completed", "Jul 22, 2026, 02:59:03 AM", "Jul 23, 2026, 09:35:39 PM"),
  mk("cmc_888", "51253", "CMC Section", "Quality-CMC", "Completed", "Jul 23, 2026, 05:51:16 PM", "Jul 23, 2026, 07:54:10 PM"),
  mk("test222", "51255", "HR Letters", "Human Resources", "Completed", "Jul 23, 2026, 07:51:06 PM", "Jul 23, 2026, 07:53:28 PM", { generated: 1 }),
  mk("VAS_Test_07_23", "51302", "HR Letters", "Human Resources", "In Progress", "Jul 23, 2026, 06:12:00 PM", "Jul 23, 2026, 06:45:00 PM"),
  mk("dina-test-poster-1", "51102", "Medical Poster", "Medical Affairs", "Completed", "Jul 23, 2026, 04:10:00 PM", "Jul 23, 2026, 05:22:00 PM"),
  mk("test-prog-bar", "51252", "CMC Section", "Quality-CMC", "In Progress", "Jul 23, 2026, 03:15:00 PM", "Jul 23, 2026, 04:02:00 PM"),
  mk("test12", "51254", "HR Letters", "Human Resources", "Pending", "Jul 23, 2026, 02:00:00 PM", "Jul 23, 2026, 02:00:00 PM"),
  mk("EU_Q3_HR_2026", "51360", "Offer Letter", "Human Resources", "Completed", "Jul 22, 2026, 09:00:00 AM", "Jul 22, 2026, 11:30:00 AM"),
  mk("Clinical_Study_ONCO_003", "51361", "Clinical Study Report", "Clinical", "In Progress", "Jul 21, 2026, 10:00:00 AM", "Jul 23, 2026, 08:00:00 PM"),
  mk("Marketing_Launch_Q4", "51362", "Product Brief", "Marketing", "Pending", "Jul 20, 2026, 11:00:00 AM", "Jul 20, 2026, 11:00:00 AM"),
];

function mk(
  name: string,
  projectId: string,
  documentType: string,
  fn: FunctionKey,
  status: ProjectStatus,
  createdAt: string,
  modifiedAt: string,
  opts: { generated?: number } = {},
): Project {
  return {
    id: projectId,
    projectId,
    name,
    documentType,
    function: fn,
    region: "Europe",
    language: "English",
    createdAt,
    modifiedAt,
    status,
    templates: [],
    sources: [],
    drafts: [],
    generated:
      opts.generated
        ? [
            {
              id: `gen-${projectId}`,
              filename: `${name}_${projectId}_50615_en.docx`,
              fromDraft: "test1",
              generatedAt: "Jul 23, 2026, 07:58:00 PM",
              size: "0.04 MB",
              generatedBy: CURRENT_USER,
            },
          ]
        : [],
  };
}

interface CreateProjectInput {
  name: string;
  description?: string;
  region: string;
  function: FunctionKey;
  documentType: string;
  language: string;
}

interface Store {
  currentUser: string;
  projects: Project[];
  totalCount: number;
  docContent: Record<string, string>;
  docApproved: Record<string, boolean>;
  templateContent: Record<string, string>;
  createProject: (input: CreateProjectInput) => string;
  getProject: (id: string) => Project | undefined;
  addTemplate: (projectId: string, name: string) => void;
  addSource: (projectId: string, name: string, type: string) => void;
  setGenerationMethod: (projectId: string, m: Project["generationMethod"]) => void;
  addDraft: (projectId: string, name: string, description?: string) => string;
  addGenerated: (projectId: string, filename: string, fromDraft: string) => void;
  setDocContent: (docId: string, html: string) => void;
  approveDoc: (docId: string, approved: boolean) => void;
  setTemplateContent: (templateId: string, html: string) => void;
}

let counter = 51363;

export const useStore = create<Store>((set, get) => ({
  currentUser: CURRENT_USER,
  projects: seedProjects,
  totalCount: 1250,
  docContent: {},
  docApproved: {},
  templateContent: {},
  createProject: (input) => {
    const id = String(counter++);
    const created: Project = {
      id,
      projectId: id,
      name: input.name,
      description: input.description,
      documentType: input.documentType,
      function: input.function,
      region: input.region,
      language: input.language,
      createdAt: new Date().toLocaleString("en-US"),
      modifiedAt: new Date().toLocaleString("en-US"),
      status: "Pending",
      templates: [],
      sources: [],
      drafts: [],
      generated: [],
    };
    set((s) => ({ projects: [created, ...s.projects], totalCount: s.totalCount + 1 }));
    return id;
  },
  getProject: (id) => get().projects.find((p) => p.id === id),
  addTemplate: (projectId, name) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              templates: [
                ...p.templates,
                {
                  id: `tpl-${Date.now()}`,
                  name,
                  size: "142 KB",
                  uploadedAt: new Date().toLocaleString(),
                  uploadedBy: CURRENT_USER,
                },
              ],
              modifiedAt: new Date().toLocaleString(),
            }
          : p,
      ),
    })),
  addSource: (projectId, name, type) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              sources: [
                ...p.sources,
                {
                  id: `src-${Date.now()}`,
                  name,
                  type: (type as any) || "csv",
                  size: "38 KB",
                  rows: 50,
                  uploadedAt: new Date().toLocaleString(),
                },
              ],
              modifiedAt: new Date().toLocaleString(),
            }
          : p,
      ),
    })),
  setGenerationMethod: (projectId, m) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, generationMethod: m } : p)),
    })),
  addDraft: (projectId, name, description) => {
    const draftId = `draft-${Date.now()}`;
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              drafts: [
                ...p.drafts,
                {
                  id: draftId,
                  name,
                  description,
                  createdBy: CURRENT_USER,
                  createdAt: new Date().toLocaleString(),
                  mappingsCount: 0,
                },
              ],
            }
          : p,
      ),
    }));
    return draftId;
  },
  addGenerated: (projectId, filename, fromDraft) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              generated: [
                ...p.generated,
                {
                  id: `gen-${Date.now()}`,
                  filename,
                  fromDraft,
                  generatedAt: new Date().toLocaleString(),
                  size: "0.04 MB",
                  generatedBy: CURRENT_USER,
                },
              ],
            }
          : p,
      ),
    })),
  setDocContent: (docId, html) =>
    set((s) => ({ docContent: { ...s.docContent, [docId]: html } })),
  approveDoc: (docId, approved) =>
    set((s) => ({ docApproved: { ...s.docApproved, [docId]: approved } })),
  setTemplateContent: (templateId, html) =>
    set((s) => ({ templateContent: { ...s.templateContent, [templateId]: html } })),
}));

export const FUNCTIONS: FunctionKey[] = [
  "Clinical",
  "Quality-CMC",
  "Safety",
  "Medical Affairs",
  "Marketing",
  "Quality",
  "Human Resources",
  "Legal",
  "Regulatory Affairs",
];

export const DOCUMENT_TYPES: Record<string, string[]> = {
  "Human Resources": ["HR Letters", "Offer Letter", "Termination Letter", "Promotion Memo", "Policy Update"],
  Clinical: ["Clinical Study Report", "Protocol Amendment", "Informed Consent", "Investigator Brochure"],
  "Quality-CMC": ["CMC Section", "Batch Record", "Deviation Report"],
  Quality: ["Quality Report", "SOP", "Audit Report"],
  Safety: ["Adverse Event Report", "PSUR", "Safety Communication"],
  "Medical Affairs": ["Medical Letter", "Publication Summary", "SRD"],
  Marketing: ["Product Brief", "Campaign Copy", "Localized Content"],
  Legal: ["Contract", "NDA", "Legal Memo"],
  "Regulatory Affairs": ["Regulatory Cover Letter", "Submission Package"],
};

export const REGIONS = ["Europe", "North America", "Asia Pacific", "Latin America", "Middle East & Africa", "Global"];

export const FUNCTION_COLORS: Record<FunctionKey, string> = {
  "Human Resources": "bg-info/15 text-info border-info/30",
  Clinical: "bg-success/15 text-success border-success/30",
  "Quality-CMC": "bg-purple/15 text-purple border-purple/30",
  Quality: "bg-purple/15 text-purple border-purple/30",
  Safety: "bg-warning/15 text-warning border-warning/30",
  "Medical Affairs": "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Marketing: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  Legal: "bg-muted text-muted-foreground border-border",
  "Regulatory Affairs": "bg-brand/15 text-brand border-brand/30",
};
