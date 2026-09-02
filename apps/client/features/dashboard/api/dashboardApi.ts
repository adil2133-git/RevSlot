import api from "@/lib/axios";
import type { DashboardSummaryData, ReferenceQuestionsData } from "../type";

export async function fetchDashboardSummary(timeframe: string = "today", date?: string) {
  const { data } = await api.get<{ success: boolean; data: DashboardSummaryData }>(
    "/dashboard/summary",
    {
      params: {
        timeframe,
        ...(date && { date }),
      },
    }
  );
  return data.data;
}

export async function fetchReferenceQuestions(bookingId: number) {
  const { data } = await api.get<{ success: boolean; data: ReferenceQuestionsData }>(
    `/dashboard/reference-questions/${bookingId}`
  );
  return data.data;
}
