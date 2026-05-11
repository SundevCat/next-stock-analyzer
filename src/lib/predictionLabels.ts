import type { PredictionHorizon, PredictionResult, TimeframeId } from "@/types/stock";
import { TIMEFRAMES } from "@/lib/timeframes";

function tfLabel(id: TimeframeId): string {
  return TIMEFRAMES.find((t) => t.id === id)?.label ?? id;
}

/** One-line headline for bullish / bearish / neutral (easy Thai). */
export function summaryHeadlineTh(summary: PredictionResult["summary"]): string {
  if (summary === "bullish") return "ภาพรวม: โน้มขึ้น";
  if (summary === "bearish") return "ภาพรวม: โน้มลง";
  return "ภาพรวม: กลาง ๆ (ยังไม่ชัด)";
}

/** Short marker on chart (keep compact). */
export function chartMarkerTextTh(summary: PredictionResult["summary"]): string {
  if (summary === "bullish") return "โน้มขาขึ้น";
  if (summary === "bearish") return "โน้มขาลง";
  return "ไม่ชัด";
}

export function horizonSectionTitleTh(tf: TimeframeId): string {
  return `มองถัดไปอีก 10 ช่วง (ตามความถี่กราฟ ${tfLabel(tf)})`;
}

export function horizonHelpTh(tf: TimeframeId): string {
  return `เลขแต่ละช่องคือช่วงเวลาถัดไปทีละหนึ่งแท่งเทียนในมุมมองนี้ — ใช้ประกอบเท่านั้น ไม่ใช่คำแนะนำให้ซื้อขาย`;
}

export function directionSimpleTh(d: PredictionHorizon["direction"]): string {
  if (d === "up") return "โน้มขึ้น";
  if (d === "down") return "โน้มลง";
  return "ยังไม่ชัด";
}
