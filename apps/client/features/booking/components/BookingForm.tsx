import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { BookingFormValues } from "../validation/BookingSchema";

type BookingFormProps = {
  register: UseFormRegister<BookingFormValues>;
  errors: FieldErrors<BookingFormValues>;
  submitting: boolean;
  submitError: string | null;
  secondsLeft: number;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  onBack: () => void;
};

export default function BookingForm({
  register,
  errors,
  submitting,
  submitError,
  secondsLeft,
  onSubmit,
  onBack,
}: BookingFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-slate-200 bg-surface-card p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-on-surface">Your details</p>
        <p
          className={`text-sm font-medium ${
            secondsLeft <= 60 ? "text-error" : "text-slate-600"
          }`}
        >
          Expires in {Math.floor(secondsLeft / 60)}:
          {String(secondsLeft % 60).padStart(2, "0")}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Advisor name"
            {...register("advisorName")}
          />
          {errors.advisorName && (
            <p className="mt-1 text-xs text-error">{errors.advisorName.message}</p>
          )}
        </div>

        <div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Advisor email"
            type="email"
            {...register("advisorEmail")}
          />
          {errors.advisorEmail && (
            <p className="mt-1 text-xs text-error">{errors.advisorEmail.message}</p>
          )}
        </div>

        <div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Intern name"
            {...register("internName")}
          />
          {errors.internName && (
            <p className="mt-1 text-xs text-error">{errors.internName.message}</p>
          )}
        </div>

        <div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Batch"
            {...register("batch")}
          />
          {errors.batch && (
            <p className="mt-1 text-xs text-error">{errors.batch.message}</p>
          )}
        </div>

        <div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Intern email(s), comma separated — optional"
            {...register("internEmails")}
          />
          {errors.internEmails && (
            <p className="mt-1 text-xs text-error">{errors.internEmails.message}</p>
          )}
        </div>

        <div>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Week / stage"
            {...register("weekStage")}
          />
          {errors.weekStage && (
            <p className="mt-1 text-xs text-error">{errors.weekStage.message}</p>
          )}
        </div>
      </div>

      {submitError && (
        <p className="mt-3 text-sm text-error">{submitError}</p>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-50"
        >
          {submitting ? "Confirming..." : "Confirm booking"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-on-surface"
        >
          Back
        </button>
      </div>
    </form>
  );
}