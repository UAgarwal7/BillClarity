// Appeal API — /api/appeal-packets/* endpoints

import { apiClient } from "./api-client";
import type { AppealPacket } from "@/app/types/appeal-packet";

export const appealApi = {
  /** Generate appeal packet sections */
  generate: (billId: string, sections: string[]) =>
    apiClient.post<{ packet_id: string; status: string }>(
      `/api/appeal-packets/generate/${billId}`,
      { sections }
    ),

  /** Get appeal packet with all sections */
  getPacket: (packetId: string) =>
    apiClient.get<AppealPacket>(`/api/appeal-packets/${packetId}`),

  /** Get existing appeal packet for a bill (returns null if none) */
  getPacketByBill: async (billId: string): Promise<AppealPacket | null> => {
    try {
      return await apiClient.get<AppealPacket>(`/api/appeal-packets/bill/${billId}`);
    } catch {
      return null;
    }
  },

  /** Update edited sections */
  updatePacket: (packetId: string, sections: Record<string, string>) =>
    apiClient.put(`/api/appeal-packets/${packetId}`, { sections }),

  /** Generate and download full PDF */
  getPdf: async (packetId: string): Promise<Blob> => {
    const apiBase = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${apiBase}/api/appeal-packets/${packetId}/pdf`);
    if (!response.ok) throw new Error("Failed to download PDF");
    return response.blob();
  },

  /** Generate and download PDF for a single section */
  getSectionPdf: async (packetId: string, sectionKey: string): Promise<Blob> => {
    const apiBase = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${apiBase}/api/appeal-packets/${packetId}/pdf/${sectionKey}`);
    if (!response.ok) throw new Error("Failed to download section PDF");
    return response.blob();
  },
};
