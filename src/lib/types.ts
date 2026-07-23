export type ProjectStatus = "Completed" | "In Progress" | "Pending" | "Failed";

export type FunctionKey =
  | "Human Resources"
  | "Clinical"
  | "Quality-CMC"
  | "Quality"
  | "Safety"
  | "Medical Affairs"
  | "Marketing"
  | "Legal"
  | "Regulatory Affairs";

export interface TemplateFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SourceFile {
  id: string;
  name: string;
  type: "csv" | "xlsx" | "json" | "pdf" | "docx" | "txt";
  size: string;
  rows?: number;
  uploadedAt: string;
}

export interface Draft {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  mappingsCount: number;
}

export interface GeneratedDoc {
  id: string;
  filename: string;
  fromDraft: string;
  generatedAt: string;
  size: string;
  generatedBy: string;
}

export interface Project {
  id: string;
  projectId: string; // display number e.g. 51255
  name: string;
  description?: string;
  documentType: string;
  function: FunctionKey;
  region: string;
  language: string;
  createdAt: string;
  modifiedAt: string;
  status: ProjectStatus;
  templates: TemplateFile[];
  sources: SourceFile[];
  drafts: Draft[];
  generated: GeneratedDoc[];
  generationMethod?: "ai" | "chat" | "manual" | "hybrid";
}
