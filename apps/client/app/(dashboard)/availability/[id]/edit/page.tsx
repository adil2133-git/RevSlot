"use client";

import { useParams } from "next/navigation";
import ScheduleForm from "@/features/availability/components/ScheduleForm";

export default function EditAvailabilityPage() {
  const params = useParams<{ id: string }>();
  return <ScheduleForm mode="edit" templateId={Number(params.id)} />;
}