export type FeedbackFieldType = "text" | "textarea" | "number" | "select";
export type UnderstandingLevel = "excellent" | "good" | "average" | "needs_improvement";

export type FeedbackFormField = {
  id: number;
  formId: number;
  label: string;
  fieldType: FeedbackFieldType;
  options: string[] | null;
  required: boolean;
  displayOrder: number | null;
  createdAt: string;
};

export type FeedbackFormQuestion = {
  id: number;
  questionText: string;
  description: string | null;
  displayOrder: number | null;
};

export type FeedbackForm = {
  id: number;
  reviewerId: number;
  name: string;
  isDefault: boolean;
  taskMarkEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackFormWithFields = FeedbackForm & {
  fields: FeedbackFormField[];
  questions: FeedbackFormQuestion[];
};


export type FormFieldInput = {
  label: string;
  fieldType: FeedbackFieldType;
  options?: string[];
  required?: boolean;
  displayOrder?: number;
};

export type CreateFormPayload = {
  name: string;
  taskMarkEnabled?: boolean;
  fields?: FormFieldInput[];
  questionIds?: number[];
};

export type UpdateFormPayload = {
  name?: string;
  taskMarkEnabled?: boolean;
  fields?: FormFieldInput[];
  questionIds?: number[];
};


export type DeleteFormResult = {
  archived: boolean;
  message: string;
};

export type Feedback = {
  id: number;
  bookingId: number;
  reviewerId: number;
  formId: number;
  isNoShow: boolean;
  reviewMark: string | null;
  understandingLevel: UnderstandingLevel | null;
  taskMark: string | null;
  comments: string | null;
  customFieldValues: Record<string, { label: string; fieldType: FeedbackFieldType; value: string; options?: string[] | null }>;
  createdAt: string;
  updatedAt: string;
};

export type SubmitFeedbackPayload = {
  formId: number;
  isNoShow?: boolean;
  reviewMark?: number;
  understandingLevel?: UnderstandingLevel;
  taskMark?: number;
  comments?: string;
  customFieldValues?: Record<string, string>;
};

export type UpdateFeedbackPayload = {
  reviewMark?: number;
  understandingLevel?: UnderstandingLevel;
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
  formArchived: boolean;
  isNoShow: boolean;
  reviewMark: string | null;
  understandingLevel: UnderstandingLevel | null;
  taskMark: string | null;
  taskMarkApplicable: boolean;
  comments: string | null;
  customFields: FeedbackDetailsField[];
  createdAt: string;
  updatedAt: string;
  editableUntil: string;
  canEdit: boolean;
};

export type FeedbackListItem = {
  id: number;
  bookingId: number;
  clientName: string;
  eventTypeName: string | null;
  formName: string | null;
  isNoShow: boolean;
  reviewMark: string | null;
  understandingLevel: UnderstandingLevel | null;
  taskMark: string | null;
  createdAt: string;
};

export type PendingFeedbackItem = {
  bookingId: number;
  clientName: string;
  internName: string;
  advisorName: string;
  eventTypeName: string | null;
  completedAt: string;
};

export type ListFeedbackParams = {
  search?: string;
  formId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type ListFeedbackResponse = {
  items: FeedbackListItem[];
  total: number;
  page: number;
  pageSize: number;
};