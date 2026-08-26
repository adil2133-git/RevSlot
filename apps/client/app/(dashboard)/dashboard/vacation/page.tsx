"use client";

import { useEffect, useState } from "react";
import { PlusIcon } from "@/features/vacation/components/icons";

import VacationCard from "@/features/vacation/components/vacationCard";
import {
  listVacationBlocks,
  deleteVacationBlock,
  type VacationBlock,
} from "@/features/vacation/api/vacationApi";

export default function VacationPage() {
  const [blocks, setBlocks] = useState<VacationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await listVacationBlocks();
      setBlocks(data);
      setError(null);
    } catch {
      setError("Failed to load vacation blocks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleDelete = async (block: VacationBlock) => {
    if (
      !confirm(
        "Delete this vacation block? This won't restore any bookings that were already cancelled."
      )
    ) {
      return;
    }
    await deleteVacationBlock(block.id);
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
  };

  const handleEdit = (block: VacationBlock) => {
    // wired up once the Create/Edit modal is built
    console.log("edit", block);
  };

  const handleCreate = () => {
    // wired up once the Create/Edit modal is built
    console.log("create new");
  };

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Vacation</h1>
          <p className="mt-1 text-slate-400">
            Manage your time off and session availability.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary shadow-surface transition hover:opacity-90"
        >
          <PlusIcon />
          New Vacation
        </button>
      </div>

      {loading && <p className="text-slate-400">Loading...</p>}
      {error && <p className="text-error">{error}</p>}

      {!loading && !error && blocks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
          No vacation blocks yet.
        </div>
      )}

      {!loading && !error && blocks.length > 0 && (
        <div className="space-y-4">
          {blocks.map((block) => (
            <VacationCard
              key={block.id}
              block={block}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}