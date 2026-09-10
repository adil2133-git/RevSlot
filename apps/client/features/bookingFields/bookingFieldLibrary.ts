export const BOOKING_FIELD_DEFINITIONS = {
  phone: {
    label: "Phone Number",
    type: "tel",
    category: "Personal",
  },
  location: {
    label: "Location",
    type: "text",
    category: "Personal",
  },

  college: {
    label: "College / University",
    type: "text",
    category: "Education",
  },
  course: {
    label: "Course / Degree",
    type: "text",
    category: "Education",
  },
  specialization: {
    label: "Specialization",
    type: "text",
    category: "Education",
  },
  yearOfStudy: {
    label: "Year of Study",
    type: "text",
    category: "Education",
  },
  graduationYear: {
    label: "Graduation Year",
    type: "text",
    category: "Education",
  },
  batch: {
    label: "Batch",
    type: "text",
    category: "Education",
  },
  weekStage: {
    label: "Week / Stage",
    type: "text",
    category: "Education",
  },

  company: {
    label: "Company / Organization",
    type: "text",
    category: "Professional",
  },
  jobTitle: {
    label: "Job Title",
    type: "text",
    category: "Professional",
  },
  yearsOfExperience: {
    label: "Years of Experience",
    type: "text",
    category: "Professional",
  },
  currentRole: {
    label: "Current Role",
    type: "text",
    category: "Professional",
  },
  industry: {
    label: "Industry",
    type: "text",
    category: "Professional",
  },

  linkedin: {
    label: "LinkedIn Profile",
    type: "url",
    category: "Profiles",
  },
  github: {
    label: "GitHub Profile",
    type: "url",
    category: "Profiles",
  },
  portfolio: {
    label: "Portfolio / Website",
    type: "url",
    category: "Profiles",
  },
  resume: {
    label: "Resume / CV",
    type: "url",
    category: "Profiles",
  },

  advisorName: {
    label: "Advisor Name",
    type: "text",
    category: "Advisor / Intern",
  },
  advisorEmail: {
    label: "Advisor Email",
    type: "email",
    category: "Advisor / Intern",
  },
  internName: {
    label: "Intern Name",
    type: "text",
    category: "Advisor / Intern",
  },
  internEmail: {
    label: "Intern Email",
    type: "email",
    category: "Advisor / Intern",
  },
  internId: {
    label: "Intern ID",
    type: "text",
    category: "Advisor / Intern",
  },

  reasonForBooking: {
    label: "Reason for Booking",
    type: "textarea",
    category: "Additional",
  },
  expectations: {
    label: "Expectations",
    type: "textarea",
    category: "Additional",
  },
  additionalInformation: {
    label: "Additional Information",
    type: "textarea",
    category: "Additional",
  },
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