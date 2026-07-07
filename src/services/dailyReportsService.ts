import { DailyReport } from "../types";

const STORAGE_KEY = "dailyReports";

const getAll = (): DailyReport[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveAll = (reports: DailyReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

export const dailyReportsService = {
  getAll,

  add(report: Omit<DailyReport, "id" | "createdAt">) {
    const reports = getAll();

    reports.unshift({
      ...report,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });

    saveAll(reports);
  },

  update(id: string, data: Partial<DailyReport>) {
    const reports = getAll().map(r =>
      r.id === id ? { ...r, ...data } : r
    );

    saveAll(reports);
  },

  delete(id: string) {
    const reports = getAll().filter(r => r.id !== id);

    saveAll(reports);
  },
};