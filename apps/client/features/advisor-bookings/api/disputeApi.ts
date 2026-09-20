import api from "@/lib/axios";

export interface ReportDisputeInput {
  bookingId: number;
  advisorEmail: string;
  reason: "reviewer_no_show" | "technical_issue" | "inadequate_review" | "other";
  description: string;
}

export async function reportBookingDispute(input: ReportDisputeInput) {
  const { data } = await api.post("/disputes/report", input);
  return data;
}

export async function getBookingDispute(bookingId: number, advisorEmail: string) {
  const { data } = await api.get(`/disputes/booking/${bookingId}`, {
    params: { advisorEmail },
  });
  return data.data;
}
