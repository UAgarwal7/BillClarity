// Call API — /api/calls/* + WebSocket connection

import { apiClient } from "./api-client";

export const callApi = {
  /** Start a new call session */
  start: (billId: string) =>
    apiClient.post<{
      call_id: string;
      strategy: string;
      opening_script: string;
      key_points: string[];
    }>("/api/calls/start", { bill_id: billId }),

  /** End a call session */
  end: (callId: string) =>
    apiClient.post<{ summary: string; outcome: string; next_steps: string }>(
      `/api/calls/${callId}/end`
    ),

  /** Get full call log */
  getCallLog: (callId: string) =>
    apiClient.get(`/api/calls/${callId}`),

  /** Create WebSocket connection for real-time call */
  createStream: (callId: string): WebSocket => {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    let wsUrl: string;
    if (apiUrl) {
      wsUrl = apiUrl.replace(/^http/, "ws") + `/api/calls/${callId}/stream`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/api/calls/${callId}/stream`;
    }
    return new WebSocket(wsUrl);
  },
};
