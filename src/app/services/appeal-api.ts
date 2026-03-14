// Appeal API — /api/appeal-packets/* endpoints

import { apiClient } from "./api-client";
import type { AppealPacket } from "@/app/types/appeal-packet";

export const appealApi = {
  /** Generate appeal packet sections */
  generate: (billId: string, sections: string[]) =>
    apiClient.post<{ packet_id: string; status: string }>(
      `/api/bills/${billId}/appeal-packet/generate`,
      { sections }
    ),

  /** Get appeal packet with all sections */
  getPacket: (packetId: string) =>
    apiClient.get<AppealPacket>(`/api/appeal-packets/${packetId}`),

  /** Update edited sections */
  updatePacket: (packetId: string, sections: Record<string, string>) =>
    apiClient.put(`/api/appeal-packets/${packetId}`, { sections }),

  /** Generate and download PDF */
  getPdf: (packetId: string) =>
    apiClient.get<Blob>(`/api/appeal-packets/${packetId}/pdf`),
};
