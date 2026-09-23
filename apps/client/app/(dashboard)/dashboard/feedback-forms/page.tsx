"use client";

import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  FileText,
  Plus,
  Search,
  Sliders,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Archive,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Star,
} from "lucide-react";
import { useFeedbackStore } from "@/features/feedback/store/feedbackStore";
import FeedbackDetailsModal from "@/features/feedback/components/FeedbackDetailsModal";
import SubmitFeedbackModal from "@/features/feedback/components/SubmitFeedbackModal";
import FeedbackFormBuilder, {
  type DraftField,
  SYSTEM_FIELD_LABELS,
} from "@/features/feedback/components/FeedbackFormBuilder";
import type { FeedbackFormField } from "@/features/feedback/types";

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
    duplicateForm,
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
    setDefaultForm,
    pendingFeedback,
    isPendingLoading,
    fetchPendingFeedback,
  } = useFeedbackStore();

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

  // Initial load
  useEffect(() => {
    fetchForms(true);
    fetchRecentFeedback();
    fetchPendingFeedback();
  }, [fetchForms, fetchRecentFeedback, fetchPendingFeedback]);

  // Sync selected form into editing state when editing an existing form
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
        selectedForm.questions?.map((q) => q.id) ?? []
      );
      setFields(
        selectedForm.fields
          .filter((field) => !SYSTEM_FIELD_LABELS.has(field.label))
          .slice()
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map(toDraftField)
      );
    }
  }, [selectedForm, editingId]);

  const activeForms = useMemo(() => forms.filter((f) => f.isActive), [forms]);
  const archivedForms = useMemo(() => forms.filter((f) => !f.isActive), [forms]);
  const visibleForms = showArchived ? archivedForms : activeForms;
  const defaultForm = activeForms.find((f) => f.isDefault);
  const customFormsCount = activeForms.filter((f) => !f.isDefault).length;

  const totalPages = Math.max(
    1,
    Math.ceil(feedbackListTotal / feedbackListPageSize)
  );

  const startCreate = () => {
    setEditingId("new");
    setName("");
    setDescription("");
    setFields([]);
    setTaskMarkEnabled(false);
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
    setFormError(null);
  };

  const handleDelete = async (formId: number, formName: string, isDefault: boolean) => {
    if (isDefault) {
      alert("The default feedback form cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to remove "${formName}"?`)) return;
    try {
      const result = await deleteForm(formId);
      if (result.archived) {
        alert(result.message);
      }
      fetchForms(true);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleDuplicate = async (formId: number, formName: string) => {
    const copyName = prompt("Enter a name for the duplicated form:", `${formName} (Copy)`);
    if (!copyName || !copyName.trim()) return;
    try {
      await duplicateForm(formId, copyName.trim());
      await fetchForms(true);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleSetDefault = async (formId: number) => {
    try {
      await setDefaultForm(formId);
      await fetchForms(true);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleReactivate = async (formId: number) => {
    try {
      await reactivateForm(formId);
      await fetchForms(true);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

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

  const isEditorOpen = editingId !== null;

  return (
    <div className="mx-auto max-w-6xl py-2">
      {/* ── BUILDER MODE ─────────────────────────────────────────── */}
      {isEditorOpen ? (
        <FeedbackFormBuilder
          key={editingId === "new" ? "new" : `edit-${editingId}`}
          initialName={name}
          initialDescription={description}
          initialTaskMarkEnabled={taskMarkEnabled}
          initialFields={fields}
          initialQuestionIds={selectedQuestionIds}
          isEditing={editingId !== "new"}
          formId={typeof editingId === "number" ? editingId : undefined}
          onSave={async (payload) => {
            setSubmitting(true);
            setFormError(null);
            try {
              if (editingId === "new") {
                await createForm({
                  name: payload.name,
                  description: payload.description,
                  fields: payload.fields,
                  taskMarkEnabled: payload.taskMarkEnabled,
                  questionIds: payload.questionIds,
                });
              } else if (typeof editingId === "number") {
                await updateForm(editingId, {
                  name: payload.name,
                  description: payload.description,
                  fields: payload.fields,
                  taskMarkEnabled: payload.taskMarkEnabled,
                  questionIds: payload.questionIds,
                });
              }
              await fetchForms(true);
              cancelEdit();
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : "Failed to save feedback form.";
              setFormError(msg);
              throw new Error(msg);
            } finally {
              setSubmitting(false);
            }
          }}
          onCancel={cancelEdit}
          submitting={submitting}
          errorMessage={formError || error}
        />
      ) : (
        /* ── DASHBOARD OVERVIEW MODE ─────────────────────────────────── */
        <>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Feedback &amp; Forms
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Design custom evaluation forms, attach question bank criteria, and manage session feedback.
              </p>
            </div>

            {!viewingAllFeedback && (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 px-4 py-2.5 text-xs sm:text-sm font-semibold text-on-primary shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Form</span>
              </button>
            )}
          </div>

          {/* ── ALL SUBMITTED FEEDBACK EXPLORER VIEW ─────────────────── */}
          {viewingAllFeedback ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setViewingAllFeedback(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Back to overview"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-base font-bold text-slate-900">
                    All Submitted Feedback Records
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {feedbackListTotal} total submissions
                </span>
              </div>

              {/* Filters */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFeedbackFilters(1)}
                    placeholder="Search by intern or advisor name..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="relative min-w-[180px]">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all pr-8"
                  >
                    <option value="">All Form Types</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => applyFeedbackFilters(1)}
                  className="rounded-xl bg-primary hover:bg-primary/95 px-4 py-2 text-xs font-semibold text-on-primary shadow-2xs transition-colors cursor-pointer"
                >
                  Apply Search
                </button>
              </div>

              {/* Submissions Table / List */}
              {isFeedbackListLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
                    />
                  ))}
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
                  <FileText className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No Feedback Records Found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No submitted feedback matches your search criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {feedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-2xs hover:border-slate-300 transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {item.clientName}
                          </p>
                          {item.isNoShow && (
                            <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                              NO SHOW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.eventTypeName || "Evaluation Session"} · {dayjs(item.createdAt).format("MMM D, YYYY")}
                          {item.formName && <> · <span className="font-medium text-slate-600">{item.formName}</span></>}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {!item.isNoShow && (
                          <div className="flex items-center gap-3 text-right">
                            <div className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs border border-slate-100">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Review</span>
                              <span className="font-extrabold text-slate-900">{item.reviewMark}/10</span>
                            </div>
                            {item.taskMark && (
                              <div className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs border border-blue-100">
                                <span className="text-[10px] uppercase font-bold text-primary block">Task</span>
                                <span className="font-extrabold text-primary">{item.taskMark}/10</span>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewBookingId(item.bookingId)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          <span>View Details</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {feedbackListTotal > 0 && (
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <p>
                    Page {feedbackListPage} of {totalPages} ({feedbackListTotal} total records)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyFeedbackFilters(feedbackListPage - 1)}
                      disabled={feedbackListPage <= 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFeedbackFilters(feedbackListPage + 1)}
                      disabled={feedbackListPage >= totalPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── MAIN DASHBOARD VIEW ─────────────────────────────────── */
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* LEFT COLUMN: STATS & FORM CARDS (3 COLS) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3.5">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Active Forms
                    </span>
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {activeForms.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Default Form
                    </span>
                    <span
                      className="text-sm font-bold text-slate-900 truncate block leading-snug"
                      title={defaultForm?.name || "None set"}
                    >
                      {defaultForm?.name || "None"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Custom Templates
                    </span>
                    <span className="text-2xl font-black text-slate-900 leading-none">
                      {customFormsCount}
                    </span>
                  </div>
                </div>

                {/* Form Tabs (Active vs Archived) */}
                {archivedForms.length > 0 && (
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setShowArchived(false)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        !showArchived
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Active ({activeForms.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowArchived(true)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                        showArchived
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      Archived ({archivedForms.length})
                    </button>
                  </div>
                )}

                {/* Forms List Grid */}
                {isLoading && forms.length === 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : visibleForms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {showArchived ? "No Archived Forms" : "No Feedback Forms Created"}
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                      {showArchived
                        ? "Any feedback forms archived due to historical session references will show up here."
                        : "Create your first custom feedback form to evaluate student reviews with specialized questions and optional task marks."}
                    </p>
                    {!showArchived && (
                      <button
                        type="button"
                        onClick={startCreate}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Form</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {visibleForms.map((form) => (
                      <div
                        key={form.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <div>
                          {/* Card Header & Badges */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3 className="text-sm font-bold text-slate-900 truncate">
                                    {form.name}
                                  </h3>
                                  {form.isDefault && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                                      <Star className="h-2.5 w-2.5 fill-primary" />
                                      <span>DEFAULT</span>
                                    </span>
                                  )}
                                  {!form.isActive && (
                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-500">
                                      ARCHIVED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Dropdown Menu */}
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setMenuOpenId(menuOpenId === form.id ? null : form.id)
                                }
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {menuOpenId === form.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpenId(null)}
                                  />
                                  <div className="absolute right-0 top-7 z-20 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100 text-xs font-semibold text-slate-700">
                                    {form.isActive ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMenuOpenId(null);
                                            startEdit(form.id);
                                          }}
                                          className="flex w-full items-center gap-2 px-3.5 py-2 text-left hover:bg-slate-50 cursor-pointer"
                                        >
                                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                                          <span>Edit Form</span>
                                        </button>

                                        {!form.isDefault && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMenuOpenId(null);
                                              handleSetDefault(form.id);
                                            }}
                                            className="flex w-full items-center gap-2 px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 cursor-pointer"
                                          >
                                            <Star className="h-3.5 w-3.5 text-amber-500" />
                                            <span>Set as Default</span>
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMenuOpenId(null);
                                            handleDuplicate(form.id, form.name);
                                          }}
                                          className="flex w-full items-center gap-2 px-3.5 py-2 text-left hover:bg-slate-50 cursor-pointer"
                                        >
                                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                                          <span>Duplicate</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMenuOpenId(null);
                                            handleDelete(form.id, form.name, form.isDefault);
                                          }}
                                          disabled={form.isDefault}
                                          title={
                                            form.isDefault
                                              ? "The default feedback form cannot be deleted. Set another form as default first to delete this."
                                              : "Delete form"
                                          }
                                          className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                          <span>{form.isDefault ? "Delete (Default)" : "Delete"}</span>
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuOpenId(null);
                                          handleReactivate(form.id);
                                        }}
                                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                        <span>Reactivate</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed">
                            {form.description || "General session feedback template."}
                          </p>

                          {/* Badges / Features Info */}
                          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                            {form.taskMarkEnabled && (
                              <span className="rounded-md bg-blue-50 border border-blue-100 text-primary px-2 py-0.5">
                                Task Mark (1-10)
                              </span>
                            )}
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                              Standard Rubric
                            </span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Created {dayjs(form.createdAt).format("MMM D, YYYY")}</span>
                          {form.isActive && (
                            <button
                              type="button"
                              onClick={() => startEdit(form.id)}
                              className="font-semibold text-primary hover:underline cursor-pointer"
                            >
                              Edit →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: PENDING & RECENT FEEDBACK (2 COLS) */}
              <div className="lg:col-span-2 space-y-6">
                {/* ── Pending Feedback Box ─────────────────────────── */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <h2 className="text-sm font-bold text-slate-900">
                        Pending Feedback Queue
                      </h2>
                    </div>
                    {pendingFeedback.length > 0 && (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.2 text-[10px] font-bold text-amber-700">
                        {pendingFeedback.length} Action Needed
                      </span>
                    )}
                  </div>

                  {isPendingLoading ? (
                    <div className="space-y-2.5">
                      {[1, 2].map((n) => (
                        <div
                          key={n}
                          className="h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
                        />
                      ))}
                    </div>
                  ) : pendingFeedback.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">You&apos;re All Caught Up</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Completed sessions awaiting evaluation will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto">
                      {pendingFeedback.map((item) => (
                        <div
                          key={item.bookingId}
                          className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-all hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.clientName}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                {item.eventTypeName || "Review Session"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackBooking({
                                  id: item.bookingId,
                                  internName: item.internName,
                                  advisorName: item.advisorName,
                                  eventTypeName: item.eventTypeName ?? "Session",
                                })
                              }
                              className="shrink-0 rounded-lg bg-primary hover:bg-primary/95 px-2.5 py-1 text-[11px] font-bold text-on-primary shadow-2xs transition-colors cursor-pointer"
                            >
                              Leave Feedback →
                            </button>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-400">
                            Completed {dayjs(item.completedAt).format("MMM D, YYYY · h:mm A")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Recent Submitted Feedback Box ───────────────── */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">
                      Recent Submissions
                    </h2>
                    <button
                      type="button"
                      onClick={openAllFeedback}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      View all →
                    </button>
                  </div>

                  {isRecentLoading ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
                        />
                      ))}
                    </div>
                  ) : recentFeedback.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-700">No Feedback Submitted Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Your completed session evaluations will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recentFeedback.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.clientName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {item.eventTypeName || "Session"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setViewBookingId(item.bookingId)}
                              className="text-[11px] font-semibold text-primary hover:underline shrink-0 cursor-pointer"
                            >
                              View →
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                            {item.isNoShow ? (
                              <span className="font-bold text-rose-600">No-Show</span>
                            ) : (
                              <span>
                                Score: <b className="text-slate-900">{item.reviewMark}/10</b>
                                {item.taskMark && (
                                  <> · Task: <b className="text-primary">{item.taskMark}/10</b></>
                                )}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {dayjs(item.createdAt).format("MMM D, YYYY")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View / Edit Submitted Feedback Modal ─────────────────── */}
      {viewBookingId !== null && (
        <FeedbackDetailsModal
          bookingId={viewBookingId}
          onClose={closeFeedbackModal}
        />
      )}

      {/* ── Submit Feedback Modal ─────────────────────────────────── */}
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