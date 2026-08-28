import api, { ApiError } from "@/lib/axios";

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
  eventTypeName: string;
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

// Type guard — narrows a caught ApiError into the 409 confirmation-required
// shape, where `details.affectedBookings` is guaranteed present.
export function isConfirmationRequiredError(
  error: unknown
): error is ApiError & { details: { affectedBookings: AffectedBooking[] } } {
  return (
    error instanceof ApiError &&
    error.status === 409 &&
    typeof error.details === "object" &&
    error.details !== null &&
    "affectedBookings" in error.details
  );
}