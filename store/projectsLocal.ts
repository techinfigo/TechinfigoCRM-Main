import { create } from "zustand";

export type ProjectLite = {
  id: string;
  title: string;
  clientName?: string;
  status?: "Active"|"On Hold"|"Blocked"|"Done";
  health?: "Green"|"Amber"|"Red";
  priority?: "Low"|"Medium"|"High"|"Critical";
  due?: string;        // ISO date string
  tags?: string[];     // ["SEO","Audit"]
  createdAt?: string;  // ISO
  updatedAt?: string;  // ISO
};

const KEY = "pm_projects";

function load(): ProjectLite[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(rows: ProjectLite[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

type S = {
  items: ProjectLite[];
  add: (p: Omit<ProjectLite, "id"|"createdAt"|"updatedAt">) => void;
};

export const useProjectsLocal = create<S>((set, get) => ({
  items: (() => {
    const rows = load();
    if (rows.length) return rows;
    const now = new Date().toISOString();
    const seed: ProjectLite[] = [
      { id: crypto.randomUUID(), title: "Meta Ads – Bob’s Fix-It Shop", clientName: "Bob’s Fix-It Shop", health: "Amber", status: "Active", priority: "Critical", due: new Date(Date.now()+30*864e5).toISOString(), tags: ["Ads","Meta"], createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), title: "GA4 Setup – Quantum Innovations", clientName: "Quantum Innovations", health: "Red", status: "On Hold", priority: "Medium", due: new Date(Date.now()+60*864e5).toISOString(), tags: ["Analytics"], createdAt: now, updatedAt: now },
      { id: crypto.randomUUID(), title: "SEO Revamp – Wonderland Creations", clientName: "Wonderland Creations", health: "Green", status: "Active", priority: "High", due: new Date(Date.now()+90*864e5).toISOString(), tags: ["SEO","Audit"], createdAt: now, updatedAt: now },
    ];
    save(seed);
    return seed;
  })(),
  add: (p) => {
    const now = new Date().toISOString();
    const row: ProjectLite = { id: crypto.randomUUID(), ...p, createdAt: now, updatedAt: now };
    const next = [row, ...get().items];
    save(next);
    set({ items: next });
  },
}));
