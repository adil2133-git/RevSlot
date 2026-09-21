"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  Lock,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  MoveUp,
  MoveDown,
} from "lucide-react";
import type { FormFieldInput, FeedbackFormField, FeedbackFieldType } from "../types";
import { useEventTypeStore } from "@/features/eventTypes/store/eventType.store";
import { useQuestionBankStore } from "@/features/questionBanks/store/questionBankStore";

export type CustomRubricField = FormFieldInput & {
  optionsText: string;
  rubricType?: "rating" | "tristate" | "text" | "textarea" | "select" | "question";
  anchorNote?: string;
  questionId?: number;
};

interface FeedbackFormBuilderProps {
  initialName?: string;
  initialDescription?: string;
  initialTaskMarkEnabled?: boolean;
  initialFields?: DraftFieldData[];
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

export type DraftFieldData = FormFieldInput & {
  optionsText: string;
  rubricType?: "rating" | "tristate" | "text" | "textarea" | "select" | "question";
  anchorNote?: string;
  questionId?: number;
};

// Recommended Academic Criteria templates for 1-click append
const RECOMMENDED_ACADEMIC_CRITERIA: {
  label: string;
  rubricType: "rating" | "tristate";
  fieldType: FeedbackFieldType;
  optionsText: string;
  anchorNote?: string;
}[] = [
  {
    label: "Git Commit Discipline",
    rubricType: "rating",
    fieldType: "select",
    optionsText: "1 - Chaotic / Single commit, 2 - Inconsistent, 3 - Conventional commits, 4 - High quality commit log, 5 - Flawless atomic PR workflow",
    anchorNote: "Rubric Anchor: 1= Chaotic/Single, 3= Conventional commits, 5= Flawless atomic PR workflow",
  },
  {
    label: "Communication Clarity",
    rubricType: "tristate",
    fieldType: "select",
    optionsText: "Pass / Verified, Needs Revision, Not Applicable",
  },
  {
    label: "System Design Rigor",
    rubricType: "rating",
    fieldType: "select",
    optionsText: "1 - Monolithic / Unstructured, 2 - Basic modularity, 3 - Decoupled with good interfaces, 4 - Resilient & scalable, 5 - Enterprise idempotent architecture",
    anchorNote: "Rubric Anchor: 1= Monolithic/Unstructured, 3= Decoupled & clean, 5= Enterprise idempotent design",
  },
  {
    label: "Plagiarism & AI Verification",
    rubricType: "tristate",
    fieldType: "select",
    optionsText: "Pass / Verified, Needs Revision, Not Applicable",
  },
  {
    label: "Automated Test Coverage",
    rubricType: "rating",
    fieldType: "select",
    optionsText: "1 - <20% / Broken, 2 - 20-50% Happy path, 3 - ~60% Unit tests, 4 - ~80% with Integration tests, 5 - Complete E2E & Mocking coverage",
    anchorNote: "Rubric Anchor: 1= <20% Broken, 3= ~60% Unit tests, 5= Complete E2E & Mocking",
  },
];

// Default initial fields when creating a new form if none provided
const DEFAULT_INITIAL_RUBRICS: CustomRubricField[] = [
  {
    label: "Code Quality & Cleanliness",
    fieldType: "select",
    required: true,
    rubricType: "rating",
    optionsText: "1 - Unformatted / Broken, 2 - Marginal, 3 - Compliant with Linting, 4 - Clean & Refactored, 5 - Flawless Idempotent Design",
    anchorNote: "Rubric Anchor: 1= Unformatted/Broken, 3= Compliant with Linting, 5= Flawless Idempotent Design",
  },
  {
    label: "Architecture Diagram Walkthrough",
    fieldType: "select",
    required: true,
    rubricType: "tristate",
    optionsText: "Pass / Verified, Needs Revision, Not Applicable",
  },
];

export default function FeedbackFormBuilder({
  initialName = "",
  initialDescription = "",
  initialTaskMarkEnabled = false,
  initialFields,
  initialQuestionIds = [],
  isEditing = false,
  onSave,
  onCancel,
  submitting = false,
  errorMessage = null,
}: FeedbackFormBuilderProps) {
  const { eventTypes, loadEventTypes } = useEventTypeStore();
  const { banks, fetchBanks } = useQuestionBankStore();

  const [formName, setFormName] = useState(initialName || (isEditing ? "" : "Full Stack Capstone Defense Rubric"));
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [academicCohort, setAcademicCohort] = useState("spring-2025");
  const [instructions, setInstructions] = useState(
    initialDescription ||
      (isEditing
        ? ""
        : "Please evaluate both conceptual understanding and live repository demonstration. If giving a score below 7 in any rubric sector, articulate actionable milestones for secondary re-evaluation within 10 days.")
  );
  const [taskMarkEnabled, setTaskMarkEnabled] = useState(initialTaskMarkEnabled);
  const [fields, setFields] = useState<CustomRubricField[]>(() => {
    if (initialFields && initialFields.length > 0) {
      return initialFields.map((f) => {
        let rubricType: CustomRubricField["rubricType"] = f.rubricType;
        if (!rubricType) {
          if (f.fieldType === "select") {
            const opts = f.optionsText || "";
            if (opts.includes("Pass") && opts.includes("Needs Revision")) {
              rubricType = "tristate";
            } else if (opts.includes("1") && opts.includes("5")) {
              rubricType = "rating";
            } else {
              rubricType = "select";
            }
          } else if (f.fieldType === "textarea") {
            rubricType = "textarea";
          } else if (f.fieldType === "number") {
            rubricType = "rating";
          } else {
            rubricType = "text";
          }
        }
        return {
          ...f,
          rubricType,
          anchorNote: f.anchorNote || (rubricType === "rating" ? "Rubric Anchor: 1= Unsatisfactory, 3= Standard, 5= Exemplary" : undefined),
        };
      });
    }
    return isEditing ? [] : DEFAULT_INITIAL_RUBRICS;
  });

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(initialQuestionIds);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    loadEventTypes();
    fetchBanks();
  }, [loadEventTypes, fetchBanks]);

  // Append a quick-add recommendation
  const handleQuickAdd = (rec: (typeof RECOMMENDED_ACADEMIC_CRITERIA)[number]) => {
    setLocalError(null);
    const existingIndex = fields.findIndex(
      (f) => f.label.trim().toLowerCase() === rec.label.toLowerCase()
    );
    if (existingIndex !== -1) {
      // Toggle off if already present
      setFields((prev) => prev.filter((_, i) => i !== existingIndex));
      return;
    }
    if (fields.length >= 20) {
      setLocalError("You can add up to 20 custom criteria.");
      return;
    }
    setFields((prev) => [
      ...prev,
      {
        label: rec.label,
        fieldType: rec.fieldType,
        required: true,
        rubricType: rec.rubricType,
        optionsText: rec.optionsText,
        anchorNote: rec.anchorNote,
      },
    ]);
  };

  // Add custom new criteria
  const handleAddCriterion = (
    type: "rating" | "tristate" | "text" | "textarea" | "select"
  ) => {
    setLocalError(null);
    setIsAddMenuOpen(false);
    if (fields.length >= 20) {
      setLocalError("You can add up to 20 custom criteria.");
      return;
    }

    let newField: CustomRubricField;
    if (type === "rating") {
      newField = {
        label: "Criterion Title (Rating 1-5)",
        fieldType: "select",
        required: true,
        rubricType: "rating",
        optionsText: "1 - Unsatisfactory, 2 - Marginal, 3 - Proficient, 4 - Advanced, 5 - Exemplary",
        anchorNote: "Rubric Anchor: 1= Unsatisfactory, 3= Proficient, 5= Exemplary",
      };
    } else if (type === "tristate") {
      newField = {
        label: "Evaluation Checkpoint",
        fieldType: "select",
        required: true,
        rubricType: "tristate",
        optionsText: "Pass / Verified, Needs Revision, Not Applicable",
      };
    } else if (type === "textarea") {
      newField = {
        label: "Detailed Observations & Notes",
        fieldType: "textarea",
        required: false,
        rubricType: "textarea",
        optionsText: "",
      };
    } else if (type === "select") {
      newField = {
        label: "Evaluation Metric",
        fieldType: "select",
        required: true,
        rubricType: "select",
        optionsText: "Outstanding, Meets Expectations, Action Required",
      };
    } else {
      newField = {
        label: "Custom Field",
        fieldType: "text",
        required: false,
        rubricType: "text",
        optionsText: "",
      };
    }

    setFields((prev) => [...prev, newField]);
    setEditingFieldIndex(fields.length);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
    if (editingFieldIndex === index) setEditingFieldIndex(null);
  };

  const handleUpdateField = (index: number, patch: Partial<CustomRubricField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (!formName.trim()) {
      setLocalError("Form name is required.");
      return;
    }

    const payloadFields: FormFieldInput[] = fields.map((field, idx) => {
      let options: string[] | undefined = undefined;
      if (field.fieldType === "select") {
        options = field.optionsText
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
        if (options.length === 0) {
          options = ["Pass / Verified", "Needs Revision", "Not Applicable"];
        }
      }
      return {
        label: field.label.trim() || `Criterion ${idx + 1}`,
        fieldType: field.fieldType,
        required: Boolean(field.required),
        displayOrder: idx,
        options,
      };
    });

    try {
      await onSave({
        name: formName.trim(),
        description: instructions.trim() || undefined,
        taskMarkEnabled,
        fields: payloadFields,
        questionIds: selectedQuestionIds,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError("An unexpected error occurred while saving the form.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-28 pt-2">
      {/* ── Top Breadcrumbs & Builder Tag ──────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Feedback &amp; Forms</span>
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-[10px] font-bold tracking-wider text-primary uppercase shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>TEMPLATE BUILDER</span>
        </div>
      </div>

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {isEditing ? "Edit Feedback Form" : "Create Feedback Form"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed">
          Configure the evaluation rubric, performance indicators, and custom assessment criteria reviewers complete following student viva defense sessions.
        </p>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────── */}
      {(localError || errorMessage) && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 animate-in fade-in">
          {localError || errorMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* ═════════════════════════════════════════════════════════════
            SECTION 1: FORM DETAILS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          {/* Section Header */}
          <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white text-xs font-bold shadow-xs">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Form Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Name and context for when this feedback form is assigned to reviewers.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              Required
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            {/* Form Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Form Name
                </label>
                <span className="text-[11px] text-slate-400">
                  Displayed on reviewer dashboard
                </span>
              </div>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Full Stack Capstone Defense Rubric"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Target Event Type & Academic Cohort */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Target Event Type
                </label>
                <div className="relative">
                  <select
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-8"
                  >
                    <option value="all">Capstone Viva (45 min)</option>
                    {eventTypes.map((et) => (
                      <option key={et.id} value={String(et.id)}>
                        {et.name} ({et.durationMinutes} min)
                      </option>
                    ))}
                    <option value="milestone">Milestone Review (30 min)</option>
                    <option value="advisory">Advisory Viva Committee</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Academic Cohort
                </label>
                <div className="relative">
                  <select
                    value={academicCohort}
                    onChange={(e) => setAcademicCohort(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-8"
                  >
                    <option value="spring-2025">Spring 2025 (Graduating Cohort)</option>
                    <option value="fall-2025">Fall 2025 (Junior Cohort)</option>
                    <option value="summer-2025">Summer 2025 (Internship Cohort)</option>
                    <option value="all-cohorts">General / All Cohorts</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Evaluator Instructions & Honor Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Evaluator Instructions &amp; Honor Code
                </label>
                <span className="text-[11px] text-slate-400">Optional</span>
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Please evaluate both conceptual understanding and live repository demonstration. If giving a score below 7 in any rubric sector, articulate actionable milestones for secondary re-evaluation within 10 days."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════
            SECTION 2: STANDARD FIELDS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          {/* Section Header */}
          <div className="flex items-start justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white text-xs font-bold shadow-xs">
                2
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">Standard Fields</h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  5 Built-in
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              <Lock className="h-3 w-3 text-slate-500" />
              <span>System Locked</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 -mt-2 mb-5">
            Core academic criteria automatically tracked across all RevSlot institution sessions.
          </p>

          {/* 5 Built-in items list */}
          <div className="space-y-2.5">
            {/* 1 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Candidate Attendance &amp; ID Verification
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Photo identity, institutional roll, and session timestamp check
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Mandatory
              </span>
            </div>

            {/* 2 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Overall Review Mark (Score out of 10)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Composite numerical score calculated into graduation standing
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Weighted 10pt
              </span>
            </div>

            {/* 3 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Key Strengths &amp; Technical Observations
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Qualitative synthesis highlighting standout engineering decisions
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Long Text
              </span>
            </div>

            {/* 4 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Pending Topics &amp; Remediation Plan
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Deficit identification with syllabus topic reference tags
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Multi-Tag
              </span>
            </div>

            {/* 5 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    General Recommendations &amp; Action Items
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Follow-up actions sent directly to candidate email transcript
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Student Visible
              </span>
            </div>
          </div>

          {/* Highlight Box: Dedicated Task Submission Score */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Include Dedicated Task Submission Score (1-10)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Allow reviewers to separately grade pre-session PR submissions alongside the oral presentation.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={taskMarkEnabled}
              onClick={() => setTaskMarkEnabled((prev) => !prev)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                taskMarkEnabled ? "bg-[#002b5c]" : "bg-slate-300"
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
            SECTION 3: CUSTOM CRITERIA & RUBRICS
           ═════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
          {/* Section Header */}
          <div className="flex items-start justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002b5c] text-white text-xs font-bold shadow-xs">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Custom Criteria &amp; Rubrics</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define specialized grading scales, viva questions, and targeted milestones.
                </p>
              </div>
            </div>
            <span className="rounded-md bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-bold text-primary">
              {fields.length} Active Criteria
            </span>
          </div>

          {/* Quick Add Academic Criteria Box */}
          <div className="mb-6 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                QUICK-ADD RECOMMENDED ACADEMIC CRITERIA:
              </span>
              <span className="text-[11px] text-slate-400">Click to append</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {RECOMMENDED_ACADEMIC_CRITERIA.map((rec) => {
                const isAdded = fields.some(
                  (f) => f.label.trim().toLowerCase() === rec.label.toLowerCase()
                );
                return (
                  <button
                    key={rec.label}
                    type="button"
                    onClick={() => handleQuickAdd(rec)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs ${
                      isAdded
                        ? "bg-primary text-white border border-primary"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <Plus className={`h-3 w-3 ${isAdded ? "rotate-45" : ""}`} />
                    <span>{rec.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Criteria Cards */}
          <div className="space-y-3.5 mb-5">
            {fields.map((field, idx) => {
              const isEditingThis = editingFieldIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Top Card Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {isEditingThis ? (
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                          className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs sm:text-sm font-bold text-slate-900 focus:border-primary focus:outline-none"
                        />
                      ) : (
                        <h4
                          onClick={() => setEditingFieldIndex(idx)}
                          className="text-xs sm:text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-primary"
                          title="Click to rename"
                        >
                          {field.label || `Criterion ${idx + 1}`}
                        </h4>
                      )}

                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-600 shrink-0">
                        {field.rubricType === "rating"
                          ? "Rating (1 to 5)"
                          : field.rubricType === "tristate"
                          ? "Tri-State Choice"
                          : field.fieldType === "textarea"
                          ? "Long Text"
                          : field.fieldType === "select"
                          ? "Dropdown Choice"
                          : "Short Text"}
                      </span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="text-[11px] font-medium text-slate-500">Mandatory</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={field.required}
                          onClick={() => handleUpdateField(idx, { required: !field.required })}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                            field.required ? "bg-[#002b5c]" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                              field.required ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Reorder up/down */}
                      <div className="flex items-center gap-0.5 text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:text-slate-700 disabled:opacity-20"
                          title="Move Up"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(idx, "down")}
                          disabled={idx === fields.length - 1}
                          className="p-1 hover:text-slate-700 disabled:opacity-20"
                          title="Move Down"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete Criterion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rubric Details Row */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    {field.rubricType === "rating" ? (
                      <>
                        <span className="text-[11px] text-slate-600 font-medium truncate max-w-md">
                          {field.anchorNote || "Rubric Anchor: 1= Unformatted/Broken, 3= Compliant with Linting, 5= Flawless Idempotent Design"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Steps: 1, 2, 3, 4, 5
                        </span>
                      </>
                    ) : field.rubricType === "tristate" ? (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold">
                          Pass / Verified
                        </span>
                        <span className="rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 text-[10px] font-semibold">
                          Needs Revision
                        </span>
                        <span className="rounded-md bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-semibold">
                          Not Applicable
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        {isEditingThis ? (
                          <input
                            type="text"
                            value={field.optionsText}
                            onChange={(e) => handleUpdateField(idx, { optionsText: e.target.value })}
                            placeholder="Options separated by commas"
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            {field.optionsText || "Text input feedback field"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {fields.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 text-center bg-slate-50/50">
                <Sparkles className="h-6 w-6 text-slate-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-700">No custom criteria added</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pick from recommended criteria above or click the button below.
                </p>
              </div>
            )}
          </div>

          {/* Add Custom Field or Question Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 py-3 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Field or Question</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 ml-0.5" />
            </button>

            {isAddMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsAddMenuOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddCriterion("rating")}
                      className="flex items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary text-xs font-bold">
                        1-5
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Rating Scale (1 to 5)</p>
                        <p className="text-[10px] text-slate-500">Graded rubric with step definitions</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddCriterion("tristate")}
                      className="flex items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                        ✓/✕
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Tri-State Choice</p>
                        <p className="text-[10px] text-slate-500">Pass / Needs Revision / N/A</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddCriterion("select")}
                      className="flex items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 text-xs font-bold">
                        ☰
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Dropdown / Select</p>
                        <p className="text-[10px] text-slate-500">Custom multiple choice options</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddCriterion("textarea")}
                      className="flex items-start gap-2.5 rounded-lg p-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                        ¶
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Long Text (Observations)</p>
                        <p className="text-[10px] text-slate-500">Open-ended essay commentary</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          STICKY BOTTOM ACTION BAR
         ═════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md px-5 py-3 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Auto-save Status */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All changes auto-saved to drafts</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400">Version 1.0</span>
          </div>

          {/* Right Action Buttons */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#002b5c] hover:bg-[#001f42] px-5 py-2 text-xs font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <span>{submitting ? "Saving Form..." : isEditing ? "Save Feedback Form" : "Create Feedback Form"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
