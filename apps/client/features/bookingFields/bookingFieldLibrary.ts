// Mirrors apps/revSlot-server/modules/booking/bookingFields.ts — keep the
// two in sync. Duplicated (not fetched) because this is static reference
// data used purely to render labels/categories for the "Suggested
// fields" picker; the actual selection (fieldKey + displayOrder) always
// comes from the backend.
export const BOOKING_FIELD_DEFINITIONS = {
  phone: { label: "Phone Number", category: "Personal" },
  location: { label: "Location", category: "Personal" },

  college: { label: "College / University", category: "Education" },
  course: { label: "Course / Degree", category: "Education" },
  specialization: { label: "Specialization", category: "Education" },
  yearOfStudy: { label: "Year of Study", category: "Education" },
  graduationYear: { label: "Graduation Year", category: "Education" },
  batch: { label: "Batch", category: "Education" },
  weekStage: { label: "Week / Stage", category: "Education" },

  company: { label: "Company / Organization", category: "Professional" },
  jobTitle: { label: "Job Title", category: "Professional" },
  yearsOfExperience: { label: "Years of Experience", category: "Professional" },
  currentRole: { label: "Current Role", category: "Professional" },
  industry: { label: "Industry", category: "Professional" },

  linkedin: { label: "LinkedIn Profile", category: "Profiles" },
  github: { label: "GitHub Profile", category: "Profiles" },
  portfolio: { label: "Portfolio / Website", category: "Profiles" },
  resume: { label: "Resume / CV", category: "Profiles" },

  advisorName: { label: "Advisor Name", category: "Advisor / Intern" },
  advisorEmail: { label: "Advisor Email", category: "Advisor / Intern" },
  internName: { label: "Intern Name", category: "Advisor / Intern" },
  internEmail: { label: "Intern Email", category: "Advisor / Intern" },
  internId: { label: "Intern ID", category: "Advisor / Intern" },

  reasonForBooking: { label: "Reason for Booking", category: "Additional" },
  expectations: { label: "Expectations", category: "Additional" },
  additionalInformation: { label: "Additional Information", category: "Additional" },
} as const;

export type BookingFieldKey = keyof typeof BOOKING_FIELD_DEFINITIONS;

export const BOOKING_FIELD_CATEGORIES = [
  "Personal",
  "Education",
  "Professional",
  "Profiles",
  "Advisor / Intern",
  "Additional",
] as const;

export const DEFAULT_BOOKING_FIELDS = [
  { label: "Full Name", required: true },
  { label: "Email Address", required: true },
  { label: "WhatsApp Number", required: true },
  { label: "Comments / Message", required: false },
];