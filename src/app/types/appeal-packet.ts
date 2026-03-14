// AppealPacket types

export type PacketStatus = "generating" | "draft" | "finalized";

export interface AppealPacket {
  _id: string;
  bill_id: string;
  generation_date: string;
  appeal_strategy: string;
  sections: Record<string, string>;
  selected_sections: string[];
  pdf_s3_key: string | null;
  status: PacketStatus;
}
