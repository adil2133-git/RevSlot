"use client";

import { useParams } from "next/navigation";
import EventTypeForm from "@/features/eventTypes/components/EventTypeForm";

export default function EditEventTypePage() {
  const params = useParams<{ id: string }>();
  return <EventTypeForm mode="edit" eventTypeId={Number(params.id)} />;
}


