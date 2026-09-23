"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  MoveUp,
  MoveDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sliders,
  Type,
  AlignLeft,
  Hash,
  ListFilter,
  X,
  Search,
} from "lucide-react";
import type { FormFieldInput, FeedbackFieldType } from "../types";
import { useQuestionBankStore } from "@/features/questionBanks/store/questionBankStore";

export type DraftField = FormFieldInput & {
  optionsText: string;
};

interface FeedbackFormBuilderProps {
  initialName?: string;
  initialDescription?: string;
  initialTaskMarkEnabled?: boolean;
  initialFields?: DraftField[];
  initialQuestionIds?: number[];
  isEditing?: boolean;
  formId?: number;
  onSave: (payload: {
    name: string;
    description?: string;
    taskMarkEnabled: boolean;
    fields: FormFieldInput[];
    questionIds: number[];
  }) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

const FIELD_TYPES: {
  value: FeedbackFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    value: "text",
    label: "Short Text",
    icon: Type,
    description: "Single-line text input",
  },
  {
    value: "textarea",
    label: "Long Text",
    icon: AlignLeft,
    description: "Multi-line commentary and notes",
  },
  {
    value: "number",
    label: "Numeric Score",
    icon: Hash,
    description: "Specific numerical rating",
  },
  {
    value: "select",
    label: "Dropdown Select",
    icon: ListFilter,
    description: "Custom selectable options",
  },
];

export const SYSTEM_FIELD_LABELS = new Set([
  "Review Mark",
  "Understanding Level",
  "Communication Level",
  "Overall Performance",
  "Areas for Improvement",
  "Recommendations / Next Steps",
]);

const SUGGESTED_CUSTOM_FIELDS: {
  label: string;
  description: string;
  fieldType: FeedbackFieldType;
  optionsText?: string;
}[] = [
  {
    label: "Code Quality",
    description: "Readability, architecture, and linting standards",
    fieldType: "select",
    optionsText: "Exceptional, Meets Standard, Needs Improvement",
  },
  {
    label: "Problem Solving",
    description: "Analytical reasoning and algorithmic thinking",
    fieldType: "select",
    optionsText: "Excellent, Good, Average, Struggling",
  },
  {
    label: "Technical Depth",
    description: "Depth of framework and foundational knowledge",
    fieldType: "textarea",
  },
  {
    label: "Communication & Clarity",
    description: "Articulation of technical choices and ideas",
    fieldType: "select",
    optionsText: "Clear & Structured, Adequate, Needs Clarity",
  },
  {
    label: "Time Management",
    description: "Pacing during implementation and answers",
    fieldType: "text",
  },
  {
    label: "Learning Agility",
    description: "Receptiveness to feedback and hints",
    fieldType: "select",
    optionsText: "Fast Learner, Receptive, Hesitant",
  },
];

const FORM_STARTER_TEMPLATES = [
  {
    name: "Technical Review Form",
    description: "Standard technical evaluation assessing code quality, architecture, and foundational depth.",
    taskMarkEnabled: true,
    fields: [
      {
        label: "Code Quality & Cleanliness",
        fieldType: "select" as const,
        optionsText: "Exceptional, Meets Standard, Needs Refactoring",
        required: true,
      },
      {
        label: "System Design & Architecture",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
      {
        label: "Technical Depth Observations",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
    ],
  },
  {
    name: "Mock Interview Form",
    description: "Structured interview format evaluating behavioral responses, communication, and problem solving.",
    taskMarkEnabled: false,
    fields: [
      {
        label: "Problem Solving Approach",
        fieldType: "select" as const,
        optionsText: "Independent, Needed Minor Hints, Struggled",
        required: true,
      },
      {
        label: "Communication & Articulation",
        fieldType: "select" as const,
        optionsText: "Very Articulate, Clear, Needs Improvement",
        required: true,
      },
      {
        label: "Interview Observations",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
    ],
  },
  {
    name: "Resume & Portfolio Review",
    description: "Evaluation form for project presentations, portfolio rigor, and resume clarity.",
    taskMarkEnabled: false,
    fields: [
      {
        label: "Portfolio Presentation Quality",
        fieldType: "select" as const,
        optionsText: "Outstanding, Standard, Incomplete",
        required: true,
      },
      {
        label: "Resume Impact & Metrics",
        fieldType: "textarea" as const,
        optionsText: "",
        required: false,
      },
    ],
  },
  {
    name: "General Session Review",
    description: "Lightweight session form relying on standard evaluation dimensions with optional general notes.",
    taskMarkEnabled: false,
    fields: [],
  },
];

export default function FeedbackFormBuilder({
  initialName = "",
  initialDescription = "",
  initialTaskMarkEnabled = false,
  initialFields = [],
  initialQuestionIds = [],
  isEditing = false,
  onSave,
  onCancel,
  submitting = false,
  errorMessage = null,
}: FeedbackFormBuilderProps) {
  const { banks, selectedBank, fetchBanks, fetchBank, clearSelectedBank } = useQuestionBankStore();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [taskMarkEnabled, setTaskMarkEnabled] = useState(initialTaskMarkEnabled);
  const [fields, setFields] = useState<DraftField[]>(initialFields);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(initialQuestionIds);

  const [activeBankId, setActiveBankId] = useState<number | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load question banks on mount
  useEffect(() => {
    fetchBanks();
    return () => {
      clearSelectedBank();
    };
  }, [fetchBanks, clearSelectedBank]);

  // Load specific bank questions when bank selected
  useEffect(() => {
    if (activeBankId !== null) {
      fetchBank(activeBankId);
    }
  }, [activeBankId, fetchBank]);

  // Apply template preset
  const applyTemplate = (tpl: (typeof FORM_STARTER_TEMPLATES)[number]) => {
    setName(tpl.name);
    setDescription(tpl.description);
    setTaskMarkEnabled(tpl.taskMarkEnabled);
    setFields(
      tpl.fields.map((f) => ({
        label: f.label,
        fieldType: f.fieldType,
        optionsText: f.optionsText,
        required: f.required,
      }))
    );
    setFormError(null);
  };

  // Add custom field
  const addField = (fieldType: FeedbackFieldType = "text") => {
    if (fields.length >= 20) {
      setFormError("You can add up to 20 custom fields.");
      return;
    }
    setFormError(null);
    setFields((prev) => [
      ...prev,
      {
        label: "",
        fieldType,
        required: false,
        optionsText: fieldType === "select" ? "Excellent, Good, Needs Work" : "",
      },
    ]);
  };

  // Update a custom field
  const updateField = (index: number, patch: Partial<DraftField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  // Remove a custom field
  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Move a custom field
  const moveField = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  // Toggle suggested field
  const toggleSuggestedField = (suggestion: (typeof SUGGESTED_CUSTOM_FIELDS)[number]) => {
    const existingIndex = fields.findIndex(
      (f) => f.label.trim().toLowerCase() === suggestion.label.toLowerCase()
    );
    if (existingIndex !== -1) {
      setFields((prev) => prev.filter((_, i) => i !== existingIndex));
      return;
    }
    if (fields.length >= 20) {
      setFormError("You can add up to 20 custom fields.");
      return;
    }
    setFields((prev) => [
      ...prev,
      {
        label: suggestion.label,
        fieldType: suggestion.fieldType,
        required: false,
        optionsText: suggestion.optionsText ?? "",
      },
    ]);
  };

  // Toggle question attachment from bank
  const toggleQuestionAttachment = (questionId: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Filter bank questions
  const filteredBankQuestions = useMemo(() => {
    if (!selectedBank?.questions) return [];
    const term = questionSearch.trim().toLowerCase();
    if (!term) return selectedBank.questions;
    return selectedBank.questions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(term) ||
        (q.description && q.description.toLowerCase().includes(term))
    );
  }, [selectedBank, questionSearch]);

  // Form submission validation & payload generation
  const handleSubmit = async () => {
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Form name is required.");
      return;
    }

    if (trimmedName.length > 150) {
      setFormError("Form name must be 150 characters or less.");
      return;
    }

    const normalizedLabels = new Set<string>();

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const label = field.label.trim();

      if (!label) {
        setFormError(`Custom field #${i + 1} needs a label.`);
        return;
      }

      if (label.length > 150) {
        setFormError(`Field label "${label}" exceeds the 150 character limit.`);
        return;
      }

      const lower = label.toLowerCase();
      if (normalizedLabels.has(lower)) {
        setFormError(`Duplicate field label: "${label}". Labels must be unique.`);
        return;
      }

      if (
        [...SYSTEM_FIELD_LABELS].some(
          (sys) => sys.toLowerCase() === lower
        )
      ) {
        setFormError(
          `"${label}" is already a built-in standard feedback field. Please choose another label.`
        );
        return;
      }

      normalizedLabels.add(lower);

      if (field.fieldType === "select") {
        const opts = field.optionsText
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);

        if (opts.length === 0) {
          setFormError(`Dropdown field "${label}" requires at least one option.`);
          return;
        }

        const uniqueOpts = new Set(opts.map((o) => o.toLowerCase()));
        if (uniqueOpts.size !== opts.length) {
          setFormError(`Dropdown options for "${label}" must be unique.`);
          return;
        }
      }
    }

    const payloadFields: FormFieldInput[] = fields.map((f, idx) => ({
      label: f.label.trim(),
      fieldType: f.fieldType,
      required: Boolean(f.required),
      displayOrder: idx,
      options:
        f.fieldType === "select"
          ? f.optionsText
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    }));

    try {
      await onSave({
        name: trimmedName,
        description: description.trim() || undefined,
        taskMarkEnabled,
        fields: payloadFields,
        questionIds: selectedQuestionIds,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save feedback form.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-24 pt-2">
      {/* ── Top Bar / Breadcrumb ────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Feedback &amp; Forms</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isEditing ? "Edit Feedback Form" : "Create Feedback Form"}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
          Configure form properties, optional task scoring, attached question banks, and custom criteria for post-session evaluations.
        </p>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────── */}
      {(formError || errorMessage) && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-semibold text-rose-800 shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{formError || errorMessage}</span>
        </div>
      )}

      {/* ── Starter Templates Tray ─────────────────────────────────── */}
      {!isEditing && (
        <div className="mb-6 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Quick-Start Form Templates:
            </span>
            <span className="text-[11px] text-slate-400">Click to apply template</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {FORM_STARTER_TEMPLATES.map((tpl) => {
              const isSelected = name === tpl.name;
              return (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`flex flex-col items-start rounded-xl p-3 text-left transition-all border shadow-2xs cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{tpl.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    {tpl.taskMarkEnabled && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-primary border border-blue-100">
                        Task Mark
                      </span>
                    )}
                    <span>{tpl.fields.length} custom {tpl.fields.length === 1 ? "field" : "fields"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* ═════════════════════════════════════════════════════════════
            SECTION 1: FORM DETAILS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Form Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define the form name and optional instructions displayed on your reviewer interface.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              Required
            </span>
          </div>

          <div className="space-y-5">
            {/* Form Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Form Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {name.length}/150 chars
                </span>
              </div>
              <input
                type="text"
                value={name}
                maxLength={150}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Technical Interview Evaluation, Capstone Defense Rubric"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Description / Evaluator Instructions
                </label>
                <span className="text-[11px] text-slate-400">
                  Optional · {description.length}/200 chars
                </span>
              </div>
              <textarea
                value={description}
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief guidelines or evaluation context for reviewers..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 2: EVALUATION SETTINGS & CORE DIMENSIONS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Evaluation Settings &amp; Standard Fields</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  RevSlot automatically handles core evaluation dimensions on all feedback submissions.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-medium">
              System Built-in
            </span>
          </div>

          {/* Standard Fields Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Review Mark (1–10)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Required overall session score recorded in 0.5 decimal increments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Understanding Level</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Categorized as Excellent, Good, Average, or Needs Improvement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Performance &amp; Communication</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Standard dropdown ratings for overall performance and clarity.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Improvements &amp; Recommendations</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Actionable long-text suggestions for the candidate transcript.
                </p>
              </div>
            </div>
          </div>

          {/* Task Mark Switch Box */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 transition-all">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    Include Dedicated Task Mark (1–10)
                  </h4>
                  <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                    Optional Setting
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, reviewers will be required to give a separate 1–10 score specifically for pre-assigned assignments or pull requests.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={taskMarkEnabled}
              onClick={() => setTaskMarkEnabled((prev) => !prev)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                taskMarkEnabled ? "bg-primary" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  taskMarkEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 3: ATTACH QUESTION BANK QUESTIONS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Attach Question Bank Questions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select questions from your question bank to embed into this evaluation form.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {selectedQuestionIds.length} Attached
            </span>
          </div>

          {banks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
              <BookOpen className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No Question Banks Created</p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                You can create question banks under the Question Banks menu to organize and attach reusable evaluation questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Select Question Bank
                  </label>
                  <div className="relative">
                    <select
                      value={activeBankId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveBankId(val ? Number(val) : null);
                        setQuestionSearch("");
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-8"
                    >
                      <option value="">Choose a question bank...</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Search in bank */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Search Questions
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={!activeBankId}
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search questions in bank..."
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Questions Selector List */}
              {activeBankId && selectedBank && (
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 max-h-60 overflow-y-auto space-y-2">
                  {filteredBankQuestions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No questions found in this question bank.
                    </p>
                  ) : (
                    filteredBankQuestions.map((q) => {
                      const isChecked = selectedQuestionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                            isChecked
                              ? "border-primary/40 bg-primary/5 text-slate-900"
                              : "border-slate-200 bg-white hover:bg-slate-100/70 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleQuestionAttachment(q.id)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold leading-snug">{q.questionText}</p>
                            {q.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {q.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 4: CUSTOM ASSESSMENT FIELDS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                4
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Custom Assessment Fields</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add custom short text, long text, numerical, or dropdown fields. Up to 20 custom fields allowed.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {fields.length} / 20 Fields
            </span>
          </div>

          {/* Suggested Quick-Add Pill Tray */}
          <div className="mb-6 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                SUGGESTED ASSESSMENT CRITERIA:
              </span>
              <span className="text-[11px] text-slate-400">Click to toggle</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CUSTOM_FIELDS.map((sug) => {
                const isAdded = fields.some(
                  (f) => f.label.trim().toLowerCase() === sug.label.toLowerCase()
                );
                return (
                  <button
                    key={sug.label}
                    type="button"
                    onClick={() => toggleSuggestedField(sug)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                      isAdded
                        ? "bg-primary text-white border border-primary"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Plus className={`h-3 w-3 ${isAdded ? "rotate-45" : ""}`} />
                    <span>{sug.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Fields List */}
          <div className="space-y-3.5 mb-5">
            {fields.map((field, idx) => {
              const currentType = FIELD_TYPES.find((t) => t.value === field.fieldType) ?? FIELD_TYPES[0];
              const TypeIcon = currentType.icon;

              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <TypeIcon className="h-3.5 w-3.5" />
                      </div>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(idx, { label: e.target.value })}
                        placeholder={`Field Label (e.g. Code Cleanliness)`}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Field Type Select */}
                      <select
                        value={field.fieldType}
                        onChange={(e) =>
                          updateField(idx, {
                            fieldType: e.target.value as FeedbackFieldType,
                            optionsText:
                              e.target.value === "select" && !field.optionsText
                                ? "Excellent, Good, Needs Improvement"
                                : field.optionsText,
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-primary focus:outline-none cursor-pointer"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      {/* Required Toggle */}
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required ?? false}
                          onChange={(e) => updateField(idx, { required: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span>Required</span>
                      </label>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5 text-slate-400">
                        <button
                          type="button"
                          onClick={() => moveField(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move up"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(idx, "down")}
                          disabled={idx === fields.length - 1}
                          className="p-1 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Move down"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete field"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Options Row */}
                  {field.fieldType === "select" && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Dropdown Options (comma-separated):
                        </label>
                        <span className="text-[10px] text-slate-400">
                          e.g. Excellent, Good, Average, Needs Work
                        </span>
                      </div>
                      <input
                        type="text"
                        value={field.optionsText}
                        onChange={(e) => updateField(idx, { optionsText: e.target.value })}
                        placeholder="Option 1, Option 2, Option 3"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none"
                      />
                      {field.optionsText && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {field.optionsText
                            .split(",")
                            .map((o) => o.trim())
                            .filter(Boolean)
                            .map((opt, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                              >
                                {opt}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center bg-slate-50/50">
                <FileText className="h-6 w-6 text-slate-300 mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No Custom Fields Added</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Use the quick-add buttons above or the menu below to add evaluation fields.
                </p>
              </div>
            )}
          </div>

          {/* Add Field Button Row */}
          <div className="flex flex-wrap items-center gap-2">
            {FIELD_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => addField(t.value)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>+ Add {t.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Sticky Action Bar ───────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md px-5 py-3.5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-900">
              {fields.length} custom {fields.length === 1 ? "field" : "fields"}
            </span>
            <span>·</span>
            <span>{selectedQuestionIds.length} attached questions</span>
            {taskMarkEnabled && (
              <>
                <span>·</span>
                <span className="text-primary font-medium">Task score active</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/95 px-5 py-2 text-xs font-bold text-on-primary shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <span>{submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Feedback Form"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Live Preview Modal ──────────────────────────────────────── */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  FORM PREVIEW
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {name.trim() || "Untitled Feedback Form"}
                </h2>
                {description && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <label className="font-bold text-slate-700 block mb-1">
                    Review Mark <span className="text-rose-500">*</span>
                  </label>
                  <div className="h-8 rounded-lg border border-slate-200 bg-white px-3 flex items-center text-slate-400">
                    Select score (1.0 to 10.0)
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <label className="font-bold text-slate-700 block mb-1">
                    Understanding Level <span className="text-rose-500">*</span>
                  </label>
                  <div className="h-8 rounded-lg border border-slate-200 bg-white px-3 flex items-center text-slate-400">
                    Excellent · Good · Average · Needs Improvement
                  </div>
                </div>
              </div>

              {taskMarkEnabled && (
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3">
                  <label className="font-bold text-primary block mb-1">
                    Task Mark (1–10) <span className="text-rose-500">*</span>
                  </label>
                  <div className="h-8 rounded-lg border border-blue-200 bg-white px-3 flex items-center text-slate-400">
                    Select task score (1.0 to 10.0)
                  </div>
                </div>
              )}

              {selectedQuestionIds.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <span className="font-bold text-slate-800 block mb-2">
                    Attached Question Bank Questions ({selectedQuestionIds.length})
                  </span>
                  <p className="text-slate-500">
                    Review questions configured in your question bank will appear here for live reference during submission.
                  </p>
                </div>
              )}

              {fields.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <label className="font-bold text-slate-700 block mb-1">
                    {f.label || `Custom Field ${i + 1}`}
                    {f.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400">
                    {f.fieldType === "select"
                      ? f.optionsText || "Dropdown options"
                      : f.fieldType === "textarea"
                      ? "Long text commentary area"
                      : f.fieldType === "number"
                      ? "Numeric input"
                      : "Short text input"}
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <label className="font-bold text-slate-700 block mb-1">
                  Comments / Session Transcript Notes
                </label>
                <div className="h-16 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-400">
                  Detailed qualitative feedback notes...
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3.5 text-right">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
