"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BOOKING_FIELD_DEFINITIONS,
  BOOKING_FIELD_CATEGORIES,
  DEFAULT_BOOKING_FIELDS,
  type BookingFieldKey,
} from "./bookingFieldLibrary";
import { fetchBookingFields, saveBookingFields } from "./api";
import type { SelectedBookingField } from "./types";

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: direction === "down" ? "rotate(180deg)" : undefined }}
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

// Reviewer-wide editor — one set of fields, shared by every event type
// this reviewer offers. Lives in Settings, not on individual event types.
export default function BookingFieldsEditor() {
  const [selected, setSelected] = useState<SelectedBookingField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fields = await fetchBookingFields();
        setSelected(fields);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking fields");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedKeys = useMemo(() => new Set(selected.map((f) => f.fieldKey)), [selected]);

  const suggestedByCategory = useMemo(() => {
    const map = new Map<string, { key: BookingFieldKey; label: string }[]>();
    for (const category of BOOKING_FIELD_CATEGORIES) map.set(category, []);

    for (const [key, def] of Object.entries(BOOKING_FIELD_DEFINITIONS)) {
      if (selectedKeys.has(key as BookingFieldKey)) continue;
      map.get(def.category)?.push({ key: key as BookingFieldKey, label: def.label });
    }
    return map;
  }, [selectedKeys]);

  const addField = (fieldKey: BookingFieldKey) => {
    const def = BOOKING_FIELD_DEFINITIONS[fieldKey];
    setSelected((prev) => [
      ...prev,
      { fieldKey, displayOrder: prev.length, label: def.label, type: "text", category: def.category },
    ]);
    setSavedMessage(false);
  };

  const removeField = (fieldKey: BookingFieldKey) => {
    setSelected((prev) =>
      prev
        .filter((f) => f.fieldKey !== fieldKey)
        .map((f, i) => ({ ...f, displayOrder: i }))
    );
    setSavedMessage(false);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selected.length) return;

    setSelected((prev) => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((f, i) => ({ ...f, displayOrder: i }));
    });
    setSavedMessage(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveBookingFields({
        fields: selected.map(({ fieldKey, displayOrder }) => ({ fieldKey, displayOrder })),
      });
      setSavedMessage(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save booking fields");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Loading booking fields…</p>;
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-surface-card p-6 shadow-surface">
      <h3 className="text-base font-semibold text-on-surface">Booking Form Fields</h3>
      <p className="mt-1 text-sm text-slate-500">
        Choose which extra details clients fill in when booking any of your sessions —
        this applies to all of your event types.
      </p>

      {/* Default fields — always present, not editable */}
      <div className="mt-4 rounded-lg bg-secondary/30 px-3 py-2.5">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Always included
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {DEFAULT_BOOKING_FIELDS.map((f) => (
            <span key={f.label} className="text-xs text-slate-600">
              {f.label}
              {f.required && <span className="text-error"> *</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* Selected fields */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Booking form fields
          </p>

          {selected.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
              No extra fields yet — add some from the list on the right.
            </p>
          ) : (
            <div className="space-y-1.5">
              {selected.map((field, index) => (
                <div
                  key={field.fieldKey}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveField(index, "up")}
                      disabled={index === 0}
                      className="text-slate-300 hover:text-on-surface disabled:opacity-0"
                      aria-label="Move up"
                    >
                      <ArrowIcon direction="up" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, "down")}
                      disabled={index === selected.length - 1}
                      className="text-slate-300 hover:text-on-surface disabled:opacity-0"
                      aria-label="Move down"
                    >
                      <ArrowIcon direction="down" />
                    </button>
                  </div>

                  <span className="flex-1 text-sm text-on-surface">{field.label}</span>

                  <button
                    type="button"
                    onClick={() => removeField(field.fieldKey)}
                    className="text-slate-300 hover:text-error"
                    aria-label={`Remove ${field.label}`}
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested fields */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Suggested fields
          </p>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {BOOKING_FIELD_CATEGORIES.map((category) => {
              const items = suggestedByCategory.get(category) ?? [];
              if (items.length === 0) return null;

              return (
                <div key={category}>
                  <p className="mb-1 text-[11px] font-semibold text-slate-400">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => addField(item.key)}
                        className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-primary hover:text-primary"
                      >
                        <PlusIcon />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Booking Fields"}
        </button>
        {savedMessage && <span className="text-xs text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}