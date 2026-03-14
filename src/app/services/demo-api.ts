// Demo API — /api/demo/seed endpoint

import { apiClient } from "./api-client";

export const demoApi = {
  /** Seed demo ER scenario data into MongoDB */
  seed: () => apiClient.post<{ bill_id: string; message: string }>("/api/demo/seed"),
};
