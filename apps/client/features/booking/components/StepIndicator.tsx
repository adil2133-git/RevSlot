type StepIndicatorProps = {
  currentStep: number;
};

const STEPS = [
  { n: 1, label: "Select time" },
  { n: 2, label: "Your details" },
  { n: 3, label: "Confirm" },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-4 flex items-center justify-center gap-3 px-2">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                currentStep >= step.n
                  ? "bg-primary text-on-primary"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {step.n}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                currentStep === step.n
                  ? "font-medium text-on-surface"
                  : "text-slate-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < 2 && <div className="h-px w-6 bg-slate-300 sm:w-10" />}
        </div>
      ))}
    </div>
  );
}