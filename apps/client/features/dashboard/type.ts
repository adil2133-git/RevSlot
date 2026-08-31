export interface ReviewerProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface DashboardMetrics {
  upcomingReviews: number;
  completedReviews: number;
  activeEventTypes: number;
  reviewHoursLogged: number;
}

export interface ImminentAlert {
  id: number;
  internName: string;
  batch: string;
  weekStage: string;
  eventTypeName: string;
  startsInMinutes: number;
  message: string;
}

export interface PendingEvalAlert {
  count: number;
  message: string;
  actionLabel: string;
}

export interface VacationAlert {
  id: number;
  startDate: string;
  endDate: string;
  reason: string | null;
  message: string;
}

export interface DashboardAlerts {
  imminentSession: ImminentAlert | null;
  pendingEvaluations: PendingEvalAlert | null;
  vacationNotice: VacationAlert | null;
}

export interface TodaysScheduleItem {
  id: number;
  eventTypeId: number;
  eventTypeName: string;
  internName: string;
  batch: string;
  advisorName: string;
  advisorEmail: string;
  weekStage: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rescheduled';
  meetLink: string | null;
}

export interface ActivityFeedItem {
  id: number;
  type: 'new_booking' | 'rescheduled' | 'cancellation';
  title: string;
  timestamp: string;
}

export interface QuickShareEventType {
  id: number;
  name: string;
  slug: string;
  durationMinutes: number;
  bookingUrl: string;
}

export interface TimeBlock {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityOverview {
  templateName: string;
  timezone: string;
  timeBlocks: TimeBlock[];
  vacationActive: boolean;
}

export interface DashboardSummaryData {
  reviewer: ReviewerProfile;
  metrics: DashboardMetrics;
  alerts: DashboardAlerts;
  todaysSchedule: TodaysScheduleItem[];
  activityFeed: ActivityFeedItem[];
  quickShareEventTypes: QuickShareEventType[];
  availabilityOverview: AvailabilityOverview;
}

export interface ReferenceQuestionItem {
  id: number;
  questionText: string;
  description: string | null;
  displayOrder: number | null;
}

export interface QuestionBankDetail {
  id: number;
  name: string;
  description: string | null;
  questions: ReferenceQuestionItem[];
}

export interface ReferenceQuestionsData {
  booking: {
    id: number;
    internName: string;
    weekStage: string;
    eventTypeName: string;
  };
  questionBank: QuestionBankDetail | null;
}
