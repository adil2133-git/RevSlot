"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useFeedbackStore } from "@/features/feedback/store/feedbackStore";
import type { FeedbackFieldType, FormFieldInput, FeedbackFormField } from "@/features/feedback/types";

const FIELD_TYPES: { value: FeedbackFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
];

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const FormBubbleIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Draft field shape while editing — options kept as a single comma-
// separated string in the UI, split into an array only on save.
type DraftField = FormFieldInput & { optionsText: string };

// Takes a field as fetched from the API (FeedbackFormField — has id,
// formId, createdAt, and options as string[] | null) and converts it to
// the editor's draft shape. Deliberately NOT typed as FormFieldInput
// here: that type's `options` is `string[] | undefined`, which isn't
// structurally compatible with the fetched field's `string[] | null`.
function toDraftField(f: FeedbackFormField): DraftField {
  return {
    label: f.label,
    fieldType: f.fieldType,
    required: f.required,
    displayOrder: f.displayOrder ?? undefined,
    options: f.options ?? undefined,
    optionsText: (f.options ?? []).join(", "),
  };
}

function emptyDraftField(): DraftField {
  return { label: "", fieldType: "text", required: false, optionsText: "" };
}

export default function FeedbackFormsPage() {
  const {
    forms,
    selectedForm,
    isLoading,
    error,
    fetchForms,
    fetchForm,
    createForm,
    updateForm,
    deleteForm,
    clearSelectedForm,
  } = useFeedbackStore();

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [name, setName] = useState("");
  const [fields, setFields] = useState<DraftField[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the selected form's fields into the editor once fetchForm resolves.
  useEffect(() => {
    if (editingId !== "new" && editingId !== null && selectedForm?.id === editingId) {
      setName(selectedForm.name);
      setFields(
        selectedForm.fields
          .slice()
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map(toDraftField)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedForm, editingId]);

  const startCreate = () => {
    setEditingId("new");
    setName("");
    setFields([]);
    setFormError(null);
  };

  const startEdit = (formId: number) => {
    setEditingId(formId);
    setFormError(null);
    fetchForm(formId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    clearSelectedForm();
    setFormError(null);
  };

  const addField = () => setFields((prev) => [...prev, emptyDraftField()]);

  const updateField = (index: number, patch: Partial<DraftField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError("Form name is required.");
      return;
    }
    for (const f of fields) {
      if (!f.label.trim()) {
        setFormError("Every field needs a label.");
        return;
      }
      if (f.fieldType === "select" && !f.optionsText.trim()) {
        setFormError(`"${f.label}" is a dropdown — add at least one option.`);
        return;
      }
    }

    const payloadFields: FormFieldInput[] = fields.map((f, i) => ({
      label: f.label.trim(),
      fieldType: f.fieldType,
      required: f.required,
      displayOrder: i,
      ...(f.fieldType === "select"
        ? { options: f.optionsText.split(",").map((o) => o.trim()).filter(Boolean) }
        : {}),
    }));

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId === "new") {
        await createForm({ name: name.trim(), fields: payloadFields });
      } else if (typeof editingId === "number") {
        await updateForm(editingId, { name: name.trim(), fields: payloadFields });
      }
      cancelEdit();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save feedback form.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (formId: number, formName: string, isDefault: boolean) => {
    if (isDefault) return; // backend rejects this anyway; button is disabled below
    if (!confirm(`Delete "${formName}"? This can't be undone.`)) return;
    try {
      await deleteForm(formId);
    } catch {
      // error surfaced via store.error
    }
  };

  const isEditorOpen = editingId !== null;

  const totalForms = forms.length;
  const defaultForm = forms.find((f) => f.isDefault);
  const customFormsCount = forms.filter((f) => !f.isDefault).length;

  return (
    <div className="mx-auto max-w-4xl py-2">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            Feedback Forms
          </h1>
          <p className="text-sm text-slate-500">
            Build the forms you use to leave feedback after a review session.
          </p>
        </div>
        {!isEditorOpen && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0"
          >
            <PlusIcon />
            New Form
          </button>
        )}
      </div>

      {/* Editor */}
      {isEditorOpen && (
        <div className="mb-6 rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
          <h2 className="mb-4 text-sm font-bold text-on-surface">
            {editingId === "new" ? "New Feedback Form" : "Edit Feedback Form"}
          </h2>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Form name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Review, Mock Interview Feedback"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary/60"
            />
          </div>

          <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-500">
            Review Mark, Task Mark and Comments are included on every form automatically. Add
            custom fields below for anything extra you want to capture.
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                  />
                  <select
                    value={field.fieldType}
                    onChange={(e) => updateField(index, { fieldType: e.target.value as FeedbackFieldType })}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeField(index)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-error-container hover:text-error"
                    aria-label="Remove field"
                    type="button"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>

                {field.fieldType === "select" && (
                  <input
                    value={field.optionsText}
                    onChange={(e) => updateField(index, { optionsText: e.target.value })}
                    placeholder="Options, comma separated — e.g. Excellent, Good, Needs Work"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-secondary/60"
                  />
                )}

                <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>
            ))}

            <button
              onClick={addField}
              type="button"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:border-primary/30 hover:bg-slate-50/50"
            >
              + Add custom field
            </button>
          </div>

          {(formError || error) && (
            <p className="mt-4 text-xs font-semibold text-error">{formError ?? error}</p>
          )}

          <div className="mt-5 flex gap-2.5">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-surface disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Form"}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      {!isEditorOpen && !isLoading && forms.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-surface flex flex-col justify-center h-22">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Forms</span>
            <span className="text-2xl font-black text-on-surface leading-none">{totalForms}</span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-surface flex flex-col justify-center h-22">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Default Form</span>
            <span className="truncate text-lg font-black text-on-surface leading-tight" title={defaultForm?.name}>
              {defaultForm?.name ?? "—"}
            </span>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-surface flex flex-col justify-center h-22">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Custom Forms</span>
            <span className="text-2xl font-black text-on-surface leading-none">{customFormsCount}</span>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading && forms.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-surface-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {forms.map((form) => (
            <div
              key={form.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-surface transition-all duration-200 hover:shadow-raised"
            >
              <div>
                {/* Card Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <FormBubbleIcon />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-on-surface transition-colors group-hover:text-primary">
                        {form.name}
                      </h3>
                      {form.isDefault && (
                        <span className="rounded bg-[#e6eef5] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#003366]">
                          DEFAULT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === form.id ? null : form.id)}
                      className="cursor-pointer rounded-lg p-1 text-slate-400 transition-all hover:bg-surface-hover hover:text-on-surface"
                      aria-label="More options"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                    {menuOpenId === form.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                        <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border border-slate-100 bg-white py-1 shadow-raised">
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              startEdit(form.id);
                            }}
                            className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-surface-hover"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              handleDelete(form.id, form.name, form.isDefault);
                            }}
                            disabled={form.isDefault}
                            title={form.isDefault ? "The default form can't be deleted" : "Delete form"}
                            className="flex w-full items-center px-4 py-2 text-left text-xs font-semibold text-error hover:bg-error-container/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Created {dayjs(form.createdAt).format("MMM D, YYYY")}</span>
                </div>
              </div>
            </div>
          ))}

          {!isLoading && forms.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-surface-card p-12 text-center">
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-[0_4px_12px_rgba(0,51,102,0.06)]">
                  <FormBubbleIcon className="h-[26px] w-[26px] text-primary" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold tracking-tight text-on-surface">No feedback forms yet</h3>
              <p className="mb-5 max-w-sm text-[13px] leading-relaxed text-slate-500">
                Create your first form — it&apos;ll automatically become your default. You can add custom
                fields on top of the built-in Review Mark, Task Mark and Comments.
              </p>
              <button
                onClick={startCreate}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0"
              >
                <PlusIcon />
                New Form
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}