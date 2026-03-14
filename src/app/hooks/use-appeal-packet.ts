// useAppealPacket — Fetch/create/update appeal packet

import { useState } from "react";
import type { AppealPacket } from "@/app/types/appeal-packet";

export function useAppealPacket(billId: string | null) {
  const [packet, setPacket] = useState<AppealPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: generate(sections) → POST /api/bills/:billId/appeal-packet/generate
  // TODO: fetch(packetId) → GET /api/appeal-packets/:packetId
  // TODO: update(packetId, sections) → PUT /api/appeal-packets/:packetId
  // TODO: exportPdf(packetId) → GET /api/appeal-packets/:packetId/pdf

  const generate = async (_sections: string[]) => {};
  const update = async (_sections: Record<string, string>) => {};
  const exportPdf = async () => {};

  return { packet, loading, generating, error, generate, update, exportPdf };
}
