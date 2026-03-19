import { type Evaluation, type InsertEvaluation } from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const DATA_DIR = join(process.cwd(), "data");
const EVALUATIONS_FILE = join(DATA_DIR, "evaluations.json");
const DRAFT_FILE = join(DATA_DIR, "draft.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) return fallback;
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, data: unknown) {
  ensureDataDir();
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export interface IStorage {
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  getAllEvaluations(): Promise<Evaluation[]>;
  createEvaluation(data: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, data: Partial<InsertEvaluation>): Promise<Evaluation | undefined>;
  deleteEvaluation(id: string): Promise<boolean>;
  saveDraft(data: Partial<InsertEvaluation>): Promise<{ id: string }>;
  getDraft(): Promise<Partial<InsertEvaluation> | null>;
}

export class FileStorage implements IStorage {

  private readAll(): Record<string, Evaluation> {
    return readJsonFile<Record<string, Evaluation>>(EVALUATIONS_FILE, {});
  }

  private writeAll(data: Record<string, Evaluation>) {
    writeJsonFile(EVALUATIONS_FILE, data);
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    const all = this.readAll();
    return all[id];
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    const all = this.readAll();
    return Object.values(all).sort((a, b) => {
      return (b.eventDate || "").localeCompare(a.eventDate || "");
    });
  }

  async createEvaluation(data: InsertEvaluation): Promise<Evaluation> {
    const all = this.readAll();
    const id = randomUUID();
    const evaluation: Evaluation = { id, ...data };
    all[id] = evaluation;
    this.writeAll(all);
    // Clear draft after saving
    this.clearDraft();
    return evaluation;
  }

  async updateEvaluation(id: string, data: Partial<InsertEvaluation>): Promise<Evaluation | undefined> {
    const all = this.readAll();
    const existing = all[id];
    if (!existing) return undefined;
    const updated: Evaluation = { ...existing, ...data };
    all[id] = updated;
    this.writeAll(all);
    return updated;
  }

  async deleteEvaluation(id: string): Promise<boolean> {
    const all = this.readAll();
    if (!all[id]) return false;
    delete all[id];
    this.writeAll(all);
    return true;
  }

  async saveDraft(data: Partial<InsertEvaluation>): Promise<{ id: string }> {
    writeJsonFile(DRAFT_FILE, data);
    return { id: "draft" };
  }

  async getDraft(): Promise<Partial<InsertEvaluation> | null> {
    const draft = readJsonFile<Partial<InsertEvaluation> | null>(DRAFT_FILE, null);
    return draft;
  }

  private clearDraft() {
    try {
      writeJsonFile(DRAFT_FILE, null);
    } catch {}
  }
}

export const storage = new FileStorage();
