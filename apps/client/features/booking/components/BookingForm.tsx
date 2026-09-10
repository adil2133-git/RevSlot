import { useState } from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { BookingFormField } from "../type";
import type { BookingFormValues } from "../validation/BookingSchema";
import { BOOKING_FIELD_DEFINITIONS, type BookingFieldKey } from "../../bookingFields/bookingFieldLibrary";


 const PRIORITY_FIELD_KEYS: BookingFieldKey[] = [
  "internName",
  "internEmail",
  "phoneNumber",
  "location",
  "collegeUniversity",
  "reasonForBooking",
  "expectations",
  "additionalInformation",
];

type BookingFormProps = {
  fields: BookingFormField[];
  selectedFieldKeys: BookingFieldKey[];
  addField: (fieldKey: BookingFieldKey) => void;
  removeField: (fieldKey: BookingFieldKey) => void;
  register: UseFormRegister<BookingFormValues>;
  errors: FieldErrors<BookingFormValues>;
  submitting: boolean;
  submitError: string | null;
  secondsLeft: number;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  onBack: () => void;
};

export default function BookingForm({
  fields,
  selectedFieldKeys,
  addField,
  removeField,
  register,
  errors,
  submitting,
  submitError,
  secondsLeft,
  onSubmit,
  onBack,
}: BookingFormProps) {
const [showAllSuggestedFields, setShowAllSuggestedFields] =
  useState(false);

  const HIDDEN_FIELD_KEYS: BookingFieldKey[] = [
  "advisorName",
  "advisorEmail",
  "internId",
];

const suggestedFields = (
  Object.keys(BOOKING_FIELD_DEFINITIONS) as BookingFieldKey[]
).filter(
  (fieldKey) =>
    !selectedFieldKeys.includes(fieldKey) &&
    !HIDDEN_FIELD_KEYS.includes(fieldKey)
);

const visibleSuggestedFields = showAllSuggestedFields
  ? suggestedFields
  : PRIORITY_FIELD_KEYS.filter((fieldKey) =>
      suggestedFields.includes(fieldKey)
    );
  return (
  <form
    onSubmit={onSubmit}
    className="rounded-xl border border-slate-200 bg-surface-card p-6"
  >
    <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
      {/* LEFT - Your Details */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">
            Your details
          </p>

          <p className="text-sm font-medium text-slate-600">
            Expires in {Math.floor(secondsLeft / 60)}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </p>
        </div>

        <div className="space-y-3">
          {fields.map((field) => {
            const error = errors[field.fieldKey];

            const commonProps = {
              ...register(field.fieldKey),
              placeholder: `${field.label}${field.required ? " *" : ""}`,
            };

            if (field.type === "textarea") {
              return (
                <div key={field.fieldKey}>
                  <textarea
                    {...commonProps}
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                  />

                  {error && (
                    <p className="mt-1 text-xs text-red-600">
                      {String(error.message)}
                    </p>
                  )}

                  {selectedFieldKeys.includes(
                    field.fieldKey as BookingFieldKey
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        removeField(field.fieldKey as BookingFieldKey)
                      }
                      className="mt-1 text-xs text-slate-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div key={field.fieldKey}>
                <input
                  {...commonProps}
                  type={field.type}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />

                {error && (
                  <p className="mt-1 text-xs text-red-600">
                    {String(error.message)}
                  </p>
                )}

                {selectedFieldKeys.includes(
                  field.fieldKey as BookingFieldKey
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      removeField(field.fieldKey as BookingFieldKey)
                    }
                    className="mt-1 text-xs text-slate-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {submitError && (
          <p className="mt-4 text-sm text-red-600">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Confirming..." : "Confirm booking"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Back
          </button>
        </div>
      </div>

      {/* RIGHT - Suggested Fields */}
      <aside className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-semibold text-slate-800">
          Suggested Fields
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Add any additional information you want to provide.
        </p>

        <div className="mt-4 space-y-2">
          {visibleSuggestedFields.map((fieldKey) => {
            const field = BOOKING_FIELD_DEFINITIONS[fieldKey];

            return (
              <button
                key={fieldKey}
                type="button"
                onClick={() => addField(fieldKey)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                <span>{field.label}</span>
                <span className="text-base font-medium">+</span>
              </button>
            );
          })}
          {!showAllSuggestedFields &&
      suggestedFields.length > PRIORITY_FIELD_KEYS.length && (
        <button
          type="button"
          onClick={() => setShowAllSuggestedFields(true)}
          className="w-full pt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          More +
        </button>
      )}
        </div>
      </aside>
    </div>
  </form>
);
}