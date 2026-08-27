import type { VacationBlock } from "../api/vacationApi";

// Checks whether a candidate date range overlaps any existing vacation block.
// excludeId lets edit-mode skip comparing the block against itself.
export function findOverlappingBlock(
  startDate: string,
  endDate: string,
  existingBlocks: VacationBlock[],
  excludeId?: number
): VacationBlock | null {
  if (!startDate || !endDate) return null;

  return (
    existingBlocks.find((block) => {
      if (excludeId && block.id === excludeId) return false;
      return startDate <= block.endDate && endDate >= block.startDate;
    }) ?? null
  );
}