"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import dayjs from "dayjs";
import { useFeedbackStore } from "@/features/feedback/store/feedbackStore";
import FeedbackDetailsModal from "@/features/feedback/components/FeedbackDetailsModal";
import type { FeedbackFieldType, FormFieldInput, FeedbackFormField } from "@/features/feedback/types";
import SubmitFeedbackModal from "@/features/feedback/components/SubmitFeedbackModal";

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

const SYSTEM_FIELDS = [
  { label: "Review Mark", description: "Required · 1–10 in 0.5 steps" },
  { label: "Understanding Level", description: "Required · Excellent to Needs Improvement" },
  { label: "Communication Level", description: "Excellent · Good · Average · Needs Improvement" },
  { label: "Overall Performance", description: "Excellent · Good · Average · Needs Improvement" },
  { label: "Areas for Improvement", description: "Long text · Optional" },
  { label: "Recommendations / Next Steps", description: "Long text · Optional" },
] as const;

const SYSTEM_FIELD_LABELS = new Set([
  "Review Mark",
  "Understanding Level",
  "Communication Level",
  "Overall Performance",
  "Areas for Improvement",
  "Recommendations / Next Steps",
]);

const SuggestionIcon = ({
  path,
  className = "h-4 w-4",
}: {
  path: ReactNode;
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {path}
  </svg>
);

const SUGGESTED_CUSTOM_FIELDS: {
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    label: "Code Quality",
    description: "Quality, readability and best practices",
    icon: <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  },
  {
    label: "Problem Solving",
    description: "Approach to solving problems",
    icon: <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" />,
  },
  {
    label: "Team Collaboration",
    description: "Working with others and team mindset",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: "Time Management",
    description: "Utilization of time and meeting deadlines",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
  },
  {
    label: "Learning Attitude",
    description: "Willingness to learn and adapt",
    icon: <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />,
  },
  {
    label: "Initiative",
    description: "Proactiveness and ownership",
    icon: <path d="M12 2l2.9 6.9 7.1.6-5.4 4.6 1.6 6.9-6.2-3.7-6.2 3.7 1.6-6.9L2 9.5l7.1-.6z" />,
  },
  {
    label: "Technical Knowledge",
    description: "Depth of subject knowledge",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  },
];

const TEMPLATES = [
  {
    name: "Technical Review",
    description:
      "Technical knowledge, problem solving and implementation.",
    taskMarkEnabled: true,
    fields: [
      {
        label: "Technical Depth",
        fieldType: "text" as const,
        optionsText: "",
        required: false,
      },
      {
        label: "Problem Solving Notes",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
    ],
  },
  {
    name: "Mock Interview",
    description:
      "A structured interview evaluation without a task score.",
    taskMarkEnabled: false,
    fields: [
      {
        label: "Communication",
        fieldType: "select" as const,
        optionsText: "Excellent, Good, Average, Needs Work",
        required: false,
      },
      {
        label: "Interview Notes",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
    ],
  },
  {
    name: "Resume Review",
    description:
      "Evaluate clarity, relevance and presentation of a resume.",
    taskMarkEnabled: false,
    fields: [
      {
        label: "Resume Quality",
        fieldType: "select" as const,
        optionsText: "Excellent, Good, Average, Needs Work",
        required: false,
      },
      {
        label: "Resume Notes",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
    ],
  },
  {
    name: "General Review",
    description:
      "A lightweight form for a broad review session.",
    taskMarkEnabled: false,
    fields: [],
  },
];

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

function Icon({
  children,
  className = "h-4 w-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function PreviewField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}{" "}
        {required && <span className="text-error">*</span>}
      </label>

      <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-400">
        {children}
      </div>
    </div>
  );
}

function PreviewModal({
  name,
  fields,
  taskMarkEnabled,
  questionCount,
  onClose,
}: {
  name: string;
  fields: DraftField[];
  taskMarkEnabled: boolean;
  questionCount: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Feedback form preview"
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Preview
            </p>

            <h2 className="mt-1 text-lg font-bold text-on-surface">
              {name.trim() || "Untitled feedback form"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              This is how the reviewer will complete the form after a session.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
            aria-label="Close preview"
          >
            <Icon>
              <path d="M6 6l12 12M18 6L6 18" />
            </Icon>
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewField label="Review Mark" required>
              Choose a score from 1 to 10
            </PreviewField>

            <PreviewField label="Understanding Level" required>
              Excellent · Good · Average · Needs Improvement
            </PreviewField>
          </div>

          {taskMarkEnabled && (
            <PreviewField label="Task Mark" required>
              Choose a score from 1 to 10
            </PreviewField>
          )}

          <PreviewField label="Strengths">
            What went well?
          </PreviewField>

          <PreviewField label="Areas for Improvement">
            What could be improved?
          </PreviewField>

          <PreviewField label="Recommendations / Next Steps">
            What should happen next?
          </PreviewField>

          {questionCount > 0 && (
            <div className="rounded-xl border border-secondary bg-secondary/30 p-4">
              <p className="text-xs font-bold text-on-surface">
                Question Bank
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {questionCount} attached question
                {questionCount === 1 ? "" : "s"} will appear here.
              </p>
            </div>
          )}

          {fields.map((field, index) => (
            <PreviewField
              key={`${field.label}-${index}`}
              label={field.label || `Custom field ${index + 1}`}
              required={field.required}
            >
              {field.fieldType === "select"
                ? field.optionsText || "Select an option"
                : field.fieldType === "number"
                  ? "Enter a number"
                  : field.fieldType === "textarea"
                    ? "Long text response"
                    : "Short text response"}
            </PreviewField>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
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
    reactivateForm,
    clearSelectedForm,
    recentFeedback,
    isRecentLoading,
    fetchRecentFeedback,
    feedbackList,
    feedbackListTotal,
    feedbackListPage,
    feedbackListPageSize,
    isFeedbackListLoading,
    fetchFeedbackList,
    pendingFeedback,
    isPendingLoading,
    fetchPendingFeedback,
  } = useFeedbackStore();

const totalForms = forms.length;
const customFormsCount = forms.filter(
  (form) => !form.isDefault
).length;

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<DraftField[]>([]);
  const [taskMarkEnabled, setTaskMarkEnabled] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewingAllFeedback, setViewingAllFeedback] = useState(false);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackFormFilter, setFeedbackFormFilter] = useState<string>("");
  const [viewBookingId, setViewBookingId] = useState<number | null>(null);
  const [feedbackBooking, setFeedbackBooking] = useState<{
    id: number;
    internName: string;
    advisorName: string;
    eventTypeName: string;
  } | null>(null);

  useEffect(() => {
    fetchForms(true);
    fetchRecentFeedback();
    fetchPendingFeedback();
  }, [fetchForms, fetchRecentFeedback, fetchPendingFeedback]);

  useEffect(() => {
  if (
    editingId !== "new" &&
    editingId !== null &&
    selectedForm?.id === editingId
  ) {
    setName(selectedForm.name);
    setDescription(selectedForm.description ?? "");
    setTaskMarkEnabled(selectedForm.taskMarkEnabled);

    setSelectedQuestionIds(
      selectedForm.questions.map((question) => question.id)
    );

    setFields(
      selectedForm.fields
        .filter((field) => !SYSTEM_FIELD_LABELS.has(field.label))
        .slice()
        .sort(
          (a, b) =>
            (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        )
        .map(toDraftField)
    );
  }
}, [selectedForm, editingId]);

    const openAllFeedback = () => {
    setViewingAllFeedback(true);
    setFeedbackSearch("");
    setFeedbackFormFilter("");
    fetchFeedbackList({ page: 1, pageSize: 20 });
  };

  const applyFeedbackFilters = (page = 1) => {
    fetchFeedbackList({
      page,
      pageSize: feedbackListPageSize,
      search: feedbackSearch.trim() || undefined,
      formId: feedbackFormFilter ? Number(feedbackFormFilter) : undefined,
    });
  };

  const closeFeedbackModal = () => {
    setViewBookingId(null);
    if (viewingAllFeedback) {
      applyFeedbackFilters(feedbackListPage);
    } else {
      fetchRecentFeedback();
    }
     fetchPendingFeedback();
  };

  const startCreate = () => {
  setEditingId("new");
  setName("");
  setDescription("");
  setFields([]);
  setTaskMarkEnabled(false);
  setSelectedQuestionIds([]);
  setFormError(null);
};

  const applyTemplate = (template: (typeof TEMPLATES)[number]) => {
  setName(template.name);
  setDescription(template.description ?? "");
  setTaskMarkEnabled(template.taskMarkEnabled);
  setFields(template.fields.map((field) => ({ ...field })));
  setSelectedQuestionIds([]);
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
  setPreviewOpen(false);
  setFormError(null);
};

  const addField = () => {
  if (fields.length >= 20) {
    setFormError("You can add up to 20 custom fields.");
    return;
  }
  setFields((prev) => [...prev, emptyDraftField()]);
};

  const updateField = (index: number, patch: Partial<DraftField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSuggestedField = (suggestion: (typeof SUGGESTED_CUSTOM_FIELDS)[number]) => {
    setFields((prev) => {
      const existingIndex = prev.findIndex(
        (f) => f.label.trim().toLowerCase() === suggestion.label.toLowerCase()
      );
      if (existingIndex !== -1) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      if (prev.length >= 20) {
        setFormError("You can add up to 20 custom fields.");
        return prev;
      }
      return [
        ...prev,
        {
          label: suggestion.label,
          fieldType: "text",
          required: false,
          optionsText: "",
        },
      ];
    });
  };

  const moveField = (
  index: number,
  direction: "up" | "down"
) => {
  const target =
    direction === "up" ? index - 1 : index + 1;
  if (
    target < 0 ||
    target >= fields.length
  ) {
    return;
  }
  setFields((prev) => {
    const next = [...prev];

    [next[index], next[target]] = [
      next[target],
      next[index],
    ];
    return next;
  });
};

   const handleSave = async () => {
  setFormError(null);

  if (!name.trim()) {
    setFormError("Form name is required.");
    return;
  }

  const normalizedLabels = new Set<string>();

  for (const field of fields) {
    const label = field.label.trim();

    if (!label) {
      setFormError(
        "Every custom field needs a label."
      );
      return;
    }

    const key = label.toLowerCase();

    if (normalizedLabels.has(key)) {
      setFormError(
        `Duplicate custom field: "${label}".`
      );
      return;
    }

    if (
      [...SYSTEM_FIELD_LABELS].some(
        (systemLabel) =>
          systemLabel.toLowerCase() === key
      )
    ) {
      setFormError(
        `"${label}" is a standard field and cannot be added as a custom field.`
      );
      return;
    }

    normalizedLabels.add(key);

    if (field.fieldType === "select") {
      const options = field.optionsText
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean);

      if (!options.length) {
        setFormError(
          `"${label}" is a dropdown — add at least one option.`
        );
        return;
      }

      if (
        new Set(
          options.map((option) =>
            option.toLowerCase()
          )
        ).size !== options.length
      ) {
        setFormError(
          `Dropdown options for "${label}" must be unique.`
        );
        return;
      }
    }
  }

  const payloadFields: FormFieldInput[] =
    fields.map((field, index) => ({
      label: field.label.trim(),
      fieldType: field.fieldType,
      required: field.required,
      displayOrder: index,
      ...(field.fieldType === "select"
        ? {
            options: field.optionsText
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean),
          }
        : {}),
    }));

  setSubmitting(true);

  try {
    if (editingId === "new") {
      await createForm({
        name: name.trim(),
        description: description.trim() || undefined,
        fields: payloadFields,
        taskMarkEnabled,
        questionIds: selectedQuestionIds,
      });
    } else if (typeof editingId === "number") {
      await updateForm(editingId, {
        name: name.trim(),
        description: description.trim(),
        fields: payloadFields,
        taskMarkEnabled,
        questionIds: selectedQuestionIds,
      });
    }

    await fetchForms(true);
    cancelEdit();
  } catch (err) {
    setFormError(
      err instanceof Error
        ? err.message
        : "Failed to save feedback form."
    );
  } finally {
    setSubmitting(false);
  }
};

    const handleDelete = async (formId: number, formName: string, isDefault: boolean) => {
    if (isDefault) return;
    if (!confirm(`Remove "${formName}"?`)) return;
    try {
      const result = await deleteForm(formId);
      if (result.archived) {
        alert(result.message);
      }
    } catch {}
  };

  const isEditorOpen = editingId !== null;

  const activeForms = useMemo(
  () => forms.filter((form) => form.isActive),
  [forms]
);
const archivedForms = useMemo(
  () => forms.filter((form) => !form.isActive),
  [forms]
);
const visibleForms = showArchived ? forms : activeForms;
const defaultForm = activeForms.find(
  (form) => form.isDefault
);
const totalPages = Math.max(
  1,
  Math.ceil(feedbackListTotal / feedbackListPageSize)
);

    return (
    <div className={`mx-auto py-2 ${isEditorOpen ? "max-w-6xl" : "max-w-4xl"}`}>
      {/* Header */}
      {isEditorOpen ? (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <button
              onClick={cancelEdit}
              className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-on-surface"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Feedback Forms
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              {editingId === "new" ? "Create Feedback Form" : "Edit Feedback Form"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Design a feedback form to evaluate your sessions. Standard fields are enabled by default. Add Task Mark (optional) and custom fields.
            </p>
          </div>

          

        </div>
      ) : (
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              Feedback & Forms
            </h1>
            <p className="text-sm text-slate-500">
              Create reusable feedback forms and review your recent submissions.
            </p>
          </div>
          {!viewingAllFeedback && (
            <button
              onClick={startCreate}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-surface transition-all duration-200 hover:bg-primary/95 hover:shadow-raised hover:-translate-y-[1px] active:translate-y-0"
            >
              <PlusIcon />
              New Form
            </button>
          )}
        </div>
      )}

      {/* Editor */}
      {isEditorOpen && (
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── Left: form builder ─────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Basic Information */}
            <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
              <h2 className="text-sm font-bold text-on-surface">Basic Information</h2>
              <p className="mt-1 text-xs text-slate-500">
                Provide a name and description for your feedback form.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Form Name <span className="text-error">*</span>
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Technical Review, HR Interview, Mock Interview"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary/60"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                    placeholder="Briefly describe the purpose of this feedback form..."
                    rows={1}
                    maxLength={200}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-surface-card focus:ring-4 focus:ring-secondary/60"
                  />
                  <p className="mt-1 text-right text-[10px] text-slate-400">{description.length}/200</p>
                </div>
              </div>
            </div>

         {/* Standard Fields */}
            <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
              <h2 className="text-sm font-bold text-on-surface">Standard Fields</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                These core fields are always included in every feedback form.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.label}>
                    <p className="text-sm font-medium text-on-surface">{field.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{field.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Mark */}
            <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
              <h2 className="text-sm font-bold text-on-surface">
                Task Mark <span className="font-normal text-slate-400">(Optional)</span>
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Include a section to evaluate specific tasks or assignments.
              </p>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface">Task Mark</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Allow reviewers to give marks for completed tasks or assignments.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={taskMarkEnabled}
                  onClick={() => setTaskMarkEnabled((prev) => !prev)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    taskMarkEnabled ? "bg-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      taskMarkEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Custom Fields */}
            <div className="rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    Custom Fields <span className="font-normal text-slate-400">(Optional)</span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Add your own custom questions or fields to collect specific feedback.
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-surface-hover"
                  >
                    <PlusIcon />
                    Create Custom Field
                  </button>
                </div>
              </div>

              {fields.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-slate-300">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <p className="text-sm font-semibold text-slate-500">No custom fields added yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose from suggestions on the right or create your own.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
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
                    </div>
                  ))}
                </div>
              )}

              {(formError || error) && (
                <p className="mt-4 text-xs font-semibold text-error">{formError ?? error}</p>
              )}
            </div>
          </div>

          {/* ── Right: suggested custom fields ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl border border-slate-100 bg-surface-card p-5 shadow-surface">
              <h2 className="text-sm font-bold text-primary">Suggested Custom Fields</h2>
              <p className="mt-1 text-xs text-slate-500">
                Add commonly used fields to make feedback more effective.
              </p>

              <div className="mt-4 space-y-2">
                {SUGGESTED_CUSTOM_FIELDS.map((suggestion) => {
                  const added = fields.some(
                    (f) => f.label.trim().toLowerCase() === suggestion.label.toLowerCase()
                  );
                  return (
                    <div
                      key={suggestion.label}
                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-primary">
                          <SuggestionIcon path={suggestion.icon} className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{suggestion.label}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSuggestedField(suggestion)}
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          added
                            ? "border-primary/20 bg-secondary/60 text-primary"
                            : "border-slate-200 text-slate-600 hover:bg-surface-hover"
                        }`}
                      >
                        {added ? "Added" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs text-slate-400">Or create your own custom field</p>
                <button
                  type="button"
                  onClick={addField}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:border-primary/30 hover:bg-slate-50/50"
                >
                  <PlusIcon />
                  Create Custom Field
                </button>
              </div>
            </div>
          </div>
           {/* Form Actions */}
          <div className="col-span-full flex justify-start gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-surface-hover"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-surface disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : editingId === "new"
                  ? "Create Form"
                  : "Save Form"}
            </button>
          </div>
        </div>
      )}

      {!isEditorOpen && viewingAllFeedback ? (
        /* ── All Submitted Feedback (expanded "View all" view) ─────────── */
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-surface">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewingAllFeedback(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-surface-hover hover:text-on-surface"
                aria-label="Back"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-base font-bold tracking-tight text-on-surface">All Submitted Feedback</h2>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              value={feedbackSearch}
              onChange={(e) => setFeedbackSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFeedbackFilters(1)}
              placeholder="Search by client name..."
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <select
              value={feedbackFormFilter}
              onChange={(e) => {
                setFeedbackFormFilter(e.target.value);
                fetchFeedbackList({
                  page: 1,
                  pageSize: feedbackListPageSize,
                  search: feedbackSearch.trim() || undefined,
                  formId: e.target.value ? Number(e.target.value) : undefined,
                });
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="">All forms</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => applyFeedbackFilters(1)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary/95"
            >
              Search
            </button>
          </div>

          {/* Rows */}
          {isFeedbackListLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 animate-pulse rounded-xl border border-slate-100 bg-surface-card" />
              ))}
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <p className="text-sm text-slate-500">No feedback matches these filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbackList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-surface-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-on-surface">{item.clientName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {item.eventTypeName} · {dayjs(item.createdAt).format("MMM D, YYYY")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-500">
                        Review <span className="font-bold text-on-surface">{item.reviewMark}/10</span>
                        {item.taskMark && (
                          <>
                            {" "}
                            · Task <span className="font-bold text-on-surface">{item.taskMark}/10</span>
                          </>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewBookingId(item.bookingId)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {feedbackListTotal > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400">
                Page {feedbackListPage} of {totalPages} · {feedbackListTotal} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => applyFeedbackFilters(feedbackListPage - 1)}
                  disabled={feedbackListPage <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => applyFeedbackFilters(feedbackListPage + 1)}
                  disabled={feedbackListPage >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        !isEditorOpen && (
          /* ── Default view: Forms (left) + Recent Feedback (right) ────── */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              {/* Stats Row */}
              {!isLoading && forms.length > 0 && (
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
                         Create your first form — it&apos;ll automatically become your default. Every form includes
                          standard feedback fields, and you can add custom fields when needed.
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

          
       {/* ── Pending + Recent Feedback (right column) ────────────── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-surface">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold tracking-tight text-on-surface">Pending Feedback</h2>
                </div>

                {isPendingLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-16 animate-pulse rounded-xl border border-slate-100 bg-surface-card" />
                    ))}
                  </div>
                ) : pendingFeedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-sm font-semibold text-on-surface">You&apos;re all caught up!</p>
                    <p className="mt-1 text-xs text-slate-500">Completed sessions needing feedback will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingFeedback.map((item) => (
                      <div key={item.bookingId} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-on-surface">{item.clientName}</p>
                            <p className="truncate text-xs text-slate-500">{item.eventTypeName ?? "—"}</p>
                          </div>
                          <button
                            onClick={() =>
                              setFeedbackBooking({
                                id: item.bookingId,
                                internName: item.internName,
                                advisorName: item.advisorName,
                                eventTypeName: item.eventTypeName ?? "",
                              })
                            }
                            className="shrink-0 text-xs font-semibold text-primary hover:underline"
                          >
                            Leave Feedback →
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Completed {dayjs(item.completedAt).format("MMM D, YYYY")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-surface">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold tracking-tight text-on-surface">Recent Feedback</h2>
                  <button
                    onClick={openAllFeedback}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View all →
                  </button>
                </div>

                {isRecentLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-20 animate-pulse rounded-xl border border-slate-100 bg-surface-card" />
                    ))}
                  </div>
                ) : recentFeedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <p className="text-sm font-semibold text-on-surface">No feedback yet</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your submitted feedback will appear here after a completed session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentFeedback.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                        <p className="truncate text-sm font-semibold text-on-surface">{item.clientName}</p>
                        <p className="truncate text-xs text-slate-500">{item.eventTypeName}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-500">
                            Review <span className="font-bold text-on-surface">{item.reviewMark}/10</span>
                            {item.taskMark && (
                              <>
                                {" "}
                                · Task <span className="font-bold text-on-surface">{item.taskMark}/10</span>
                              </>
                            )}
                          </p>
                          <button
                            onClick={() => setViewBookingId(item.bookingId)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View →
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {dayjs(item.createdAt).format("MMM D, YYYY")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

    {viewBookingId !== null && (
        <FeedbackDetailsModal bookingId={viewBookingId} onClose={closeFeedbackModal} />
      )}

      {feedbackBooking && (
        <SubmitFeedbackModal
          booking={feedbackBooking}
          onClose={() => setFeedbackBooking(null)}
          onSubmitted={() => {
            setFeedbackBooking(null);
            fetchPendingFeedback();
            fetchRecentFeedback();
          }}
        />
      )}
    </div>
  );
}

     