export type FeedbackFieldType = "text" | "textarea" | "number" | "select";

export type FeedbackFormField = {
  id: number;
  formId: number;
  label: string;
  fieldType: FeedbackFieldType;
  options: string[] | null; // only populated when fieldType === "select"
  required: boolean;
  displayOrder: number | null;
  createdAt: string;
};

export type FeedbackForm = {
  id: number;
  reviewerId: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackFormWithFields = FeedbackForm & {
  fields: FeedbackFormField[];
};

// Input shape for one field when creating/replacing a form's fields —
// no id/formId/createdAt, those are assigned server-side.
export type FormFieldInput = {
  label: string;
  fieldType: FeedbackFieldType;
  options?: string[];
  required?: boolean;
  displayOrder?: number;
};

export type CreateFormPayload = {
  name: string;
  fields?: FormFieldInput[];
};

export type UpdateFormPayload = {
  name?: string;
  // Full replace of custom fields when provided — matches backend
  // UpdateFormSchema (see feedback.service.ts updateForm).
  fields?: FormFieldInput[];
};

export type Feedback = {
  id: number;
  bookingId: number;
  reviewerId: number;
  formId: number;
  isNoShow: boolean;
  reviewMark: string | null; // numeric column comes back as string over JSON
  taskMark: string | null;
  comments: string | null;
  customFieldValues: Record<string, { label: string; fieldType: FeedbackFieldType; value: string }>;
  createdAt: string;
  updatedAt: string;
};

export type SubmitFeedbackPayload = {
  formId: number;
  reviewMark?: number; // 1–10, half-point steps
  taskMark?: number;
  comments?: string;
  customFieldValues?: Record<string, string>;
};

export type UpdateFeedbackPayload = {
  reviewMark?: number;
  taskMark?: number;
  comments?: string;
  customFieldValues?: Record<string, string>;
};

export type FeedbackDetailsField = {
  id: number;
  label: string;
  fieldType: FeedbackFieldType;
  value: string;
  options: string[] | null;
};

export type FeedbackDetails = {
  id: number;
  bookingId: number;
  clientName: string;
  eventTypeName: string | null;
  sessionDate: string;
  formName: string | null;
  isNoShow: boolean;
  reviewMark: string | null;
  taskMark: string | null;
  comments: string | null;
  customFields: FeedbackDetailsField[];
  createdAt: string;
  updatedAt: string;
  editableUntil: string;
  canEdit: boolean;
};