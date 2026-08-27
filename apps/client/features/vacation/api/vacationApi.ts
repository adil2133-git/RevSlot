import api from "@/lib/axios";

export interface VacationBlock {
  id: number;
  reviewerId: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  reason: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AffectedBooking {
  id: number;
  internName: string;
  batch: string;
  advisorEmail: string;
  startTime: string; // ISO timestamp
  endTime: string;
  eventTypeName?: string; // not yet in backend response — flagged below
}

interface ConfirmationRequiredError {
  message: string;
  details: { affectedBookings: AffectedBooking[] };
}

export async function listVacationBlocks() {
  const { data } = await api.get<{ data: { vacationBlocks: VacationBlock[] } }>(
    "/vacation-blocks"
  );
  return data.data.vacationBlocks;
}

export async function createVacationBlock(payload: {
  startDate: string;
  endDate: string;
  reason?: string;
  confirmCancellations?: boolean;
}) {
  const { data } = await api.post<{ data: { vacationBlock: VacationBlock } }>(
    "/vacation-blocks",
    payload
  );
  return data.data.vacationBlock;
}

export async function updateVacationBlock(
  id: number,
  payload: {
    startDate?: string;
    endDate?: string;
    reason?: string;
    confirmCancellations?: boolean;
  }
) {
  const { data } = await api.patch<{ data: { vacationBlock: VacationBlock } }>(
    `/vacation-blocks/${id}`,
    payload
  );
  return data.data.vacationBlock;
}

export async function deleteVacationBlock(id: number) {
  await api.delete(`/vacation-blocks/${id}`);
}

// Type guard — narrows a caught axios error into the 409 confirmation-required shape
export function isConfirmationRequiredError(
  error: unknown
): error is { response: { status: 409; data: ConfirmationRequiredError } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as any).response?.status === 409 &&
    (error as any).response?.data?.details?.affectedBookings !== undefined
  );
}