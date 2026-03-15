// useAppealPacket — Fetch/create/update appeal packet

import { useState, useEffect } from "react";
import type { AppealPacket } from "@/app/types/appeal-packet";
import { appealApi } from "@/app/services/appeal-api";

export function useAppealPacket(billId: string | null) {
  const [packet, setPacket] = useState<AppealPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load existing packet, or auto-generate if none exists
  useEffect(() => {
    if (!billId) {
      setPacket(null);
      return;
    }
    let cancelled = false;
    setInitialLoading(true);
    (async () => {
      const existing = await appealApi.getPacketByBill(billId);
      if (cancelled) return;
      if (existing) {
        setPacket(existing);
        setInitialLoading(false);
      } else {
        // No packet exists — auto-generate one
        setInitialLoading(false);
        setGenerating(true);
        setError(null);
        try {
          const DEFAULT_SECTIONS = [
            "bill_explanation", "flagged_issues", "benchmark_analysis",
            "insurance_insights", "appeal_letter", "negotiation_script",
          ];
          const { packet_id } = await appealApi.generate(billId, DEFAULT_SECTIONS);
          if (cancelled) return;
          const packetData = await appealApi.getPacket(packet_id);
          if (cancelled) return;
          setPacket(packetData);
        } catch (e: unknown) {
          if (!cancelled) {
            const msg = e instanceof Error ? e.message : "Failed to generate appeal packet";
            setError(msg);
          }
        } finally {
          if (!cancelled) setGenerating(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [billId]);

  const generate = async (sections: string[]) => {
    if (!billId) return;
    setGenerating(true);
    setError(null);
    try {
      const { packet_id } = await appealApi.generate(billId, sections);
      const packetData = await appealApi.getPacket(packet_id);
      setPacket(packetData);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to generate appeal packet";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const update = async (sections: Record<string, string>) => {
    if (!packet) return;
    try {
      await appealApi.updatePacket(packet._id, sections);
      setPacket((prev) =>
        prev ? { ...prev, sections: { ...prev.sections, ...sections } } : null
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update packet";
      setError(msg);
    }
  };

  const exportPdf = async () => {
    if (!packet) return;
    setLoading(true);
    try {
      const blob = await appealApi.getPdf(packet._id);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "appeal-packet.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to export PDF";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { packet, loading, initialLoading, generating, error, generate, update, exportPdf };
}
