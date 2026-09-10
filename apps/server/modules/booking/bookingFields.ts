export const BOOKING_FIELD_DEFINITIONS = {
  phoneNumber: {
    label: "Phone Number",
    type: "tel",
    category: "Personal",
  },
  location: {
    label: "Location",
    type: "text",
    category: "Personal",
  },

  collegeUniversity: {
    label: "College / University",
    type: "text",
    category: "Education",
  },
  courseDegree: {
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

  linkedinProfile: {
    label: "LinkedIn Profile",
    type: "url",
    category: "Profiles",
  },
  githubProfile: {
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

export const DEFAULT_BOOKING_FIELDS = [
  {
    fieldKey: "fullName",
    displayOrder: 0,
    label: "Full Name",
    type: "text",
    category: "Basic",
    required: true,
  },
  {
    fieldKey: "email",
    displayOrder: 1,
    label: "Email Address",
    type: "email",
    category: "Basic",
    required: true,
  },
  {
    fieldKey: "whatsappNumber",
    displayOrder: 2,
    label: "WhatsApp Number",
    type: "tel",
    category: "Basic",
    required: true,
  },
  {
    fieldKey: "comments",
    displayOrder: 3,
    label: "Comments / Message",
    type: "textarea",
    category: "Basic",
    required: false,
  },
] as const;

export type PublicBookingField =
  | (typeof DEFAULT_BOOKING_FIELDS)[number]
  | {
      fieldKey: BookingFieldKey;
      displayOrder: number;
      label: string;
      type: string;
      category: string;
      required: false;
    };

export function getEffectiveBookingFields(
  selected: { fieldKey: string; displayOrder: number }[] = []
): PublicBookingField[] {
  const extras = [...selected]
    .filter((field) => field.fieldKey in BOOKING_FIELD_DEFINITIONS)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((field) => {
      const definition =
        BOOKING_FIELD_DEFINITIONS[field.fieldKey as BookingFieldKey];

      return {
        fieldKey: field.fieldKey as BookingFieldKey,
        displayOrder: field.displayOrder,
        label: definition.label,
        type: definition.type,
        category: definition.category,
        required: false as const,
      };
    });

  return [...DEFAULT_BOOKING_FIELDS, ...extras];
}