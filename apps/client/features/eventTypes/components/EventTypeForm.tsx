"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Switch from "@/components/common/Switch";
import { fetchTemplates } from "@/features/availability/api/availability.api";
import type { AvailabilityTemplate } from "@/features/availability/types";
import { useEventTypeStore } from "@/features/eventTypes/store/eventType.store";
import { getEventTypeByIdRequest } from "@/features/eventTypes/api/eventType.api";
import { slugify } from "../utils/slugify";

interface EventTypeFormProps {
  mode: "create" | "edit";
  eventTypeId?: number;
}

export default function EventTypeForm({ mode, eventTypeId }: EventTypeFormProps) {
  const router = useRouter();
  const { addEventType, editEventType } = useEventTypeStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [price, setPrice] = useState("");
  const [bufferBeforeMinutes, setBufferBeforeMinutes] = useState("0");
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState("0");
  const [availabilityTemplateId, setAvailabilityTemplateId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The backend always derives the slug from `name` server-side — this is
  // a preview only, so people can see the URL before saving. Editing it
  // here would do nothing, since it's never sent in the payload.
  const slugPreview = slugify(name);

  // Always load the reviewer's own templates for the dropdown — the
  // backend re-verifies ownership on submit regardless, this is just UX.
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchTemplates();
        setTemplates(list);
      } catch {
        // Non-fatal — the select will just show "no templates" and the
        // person can still fill the rest of the form.
      }
    })();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !eventTypeId) return;
    (async () => {
      try {
        const eventType = await getEventTypeByIdRequest(eventTypeId);
        setName(eventType.name);
        setDescription(eventType.description ?? "");
        setDurationMinutes(String(eventType.durationMinutes));
        setPrice(String(eventType.price));
        setBufferBeforeMinutes(String(eventType.bufferBeforeMinutes));
        setBufferAfterMinutes(String(eventType.bufferAfterMinutes));
        setAvailabilityTemplateId(String(eventType.availabilityTemplateId));
        setIsActive(eventType.isActive);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event type");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, eventTypeId]);

  async function handleSave() {
    setError(null);

    if (name.trim().length < 1) {
      setError("Event name is required.");
      return;
    }
    if (description.trim().length < 1) {
      setError("Description is required.");
      return;
    }
    const durationNum = Number(durationMinutes);
    if (!Number.isInteger(durationNum) || durationNum <= 0) {
      setError("Duration must be a whole number greater than 0.");
      return;
    }
    const priceNum = price.trim() === "" ? 0 : Number(price);
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      setError("Price must be a whole number, 0 or greater.");
      return;
    }
    const bufferBeforeNum = bufferBeforeMinutes.trim() === "" ? 0 : Number(bufferBeforeMinutes);
    if (!Number.isInteger(bufferBeforeNum) || bufferBeforeNum < 0) {
      setError("Buffer before must be a whole number, 0 or greater.");
      return;
    }
    const bufferAfterNum = bufferAfterMinutes.trim() === "" ? 0 : Number(bufferAfterMinutes);
    if (!Number.isInteger(bufferAfterNum) || bufferAfterNum < 0) {
      setError("Buffer after must be a whole number, 0 or greater.");
      return;
    }
    if (!availabilityTemplateId) {
      setError("Please select an availability template.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        durationMinutes: durationNum,
        price: priceNum,
        bufferBeforeMinutes: bufferBeforeNum,
        bufferAfterMinutes: bufferAfterNum,
        availabilityTemplateId: Number(availabilityTemplateId),
      };

      if (mode === "create") {
        await addEventType(payload);
      } else if (eventTypeId) {
        await editEventType(eventTypeId, { ...payload, isActive });
      }
      router.push("/dashboard/event-types");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event type");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Loading event type…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/event-types")}
            className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-on-surface"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Event Types
          </button>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
            {mode === "create" ? "Create New Event Type" : "Edit Event Type"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "create"
              ? "Add a new type of session that you offer to your event bookers."
              : "Update the details of this session type."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/event-types")}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Event Type"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-error-container px-4 py-2 text-sm text-error">{error}</p>
      )}

      <div className="space-y-6 rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
        <h2 className="text-base font-semibold text-on-surface">Basic Information</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter event type name"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              This is the name that will appear on your dashboard and booking page.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">Booking link</label>
            <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
              {slugPreview || "event-type-slug"}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Auto-generated from the name — this is what shows up in the booking URL.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-on-surface">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this session is about…"
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Explain what this session includes and what bookers can expect.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">
              Duration (minutes) *
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="e.g. 30"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-xs text-slate-400">Total duration of the session in minutes.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">Price (₹) *</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 500 (0 = free)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-xs text-slate-400">Price for this session. Leave blank for free.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">
              Buffer before (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={bufferBeforeMinutes}
              onChange={(e) => setBufferBeforeMinutes(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Prep time blocked before each booking. 0 = no buffer.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-on-surface">
              Buffer after (minutes)
            </label>
            <input
              type="number"
              min={0}
              value={bufferAfterMinutes}
              onChange={(e) => setBufferAfterMinutes(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Wrap-up time blocked after each booking. 0 = no buffer.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-on-surface">
            Availability Template *
          </label>
          <select
            value={availabilityTemplateId}
            onChange={(e) => setAvailabilityTemplateId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">Select availability template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-400">
            Select a weekly availability template that will be used for this event type.
          </p>
          {templates.length === 0 && (
            <p className="mt-1.5 text-xs text-error">
              You don&apos;t have any availability templates yet — create one first.
            </p>
          )}
        </div>

        {mode === "edit" && (
          <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
            <Switch checked={isActive} onChange={() => setIsActive((v) => !v)} />
            <div>
              <p className="text-sm font-medium text-on-surface">Active</p>
              <p className="text-xs text-slate-400">
                Set the status of this event type. Active event types are visible to bookers.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}