// Loads the Razorpay Checkout script once, lazily — only paid event
// types ever trigger this, free bookings never load it.
let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout can only run in the browser"));
  }
  if ((window as any).Razorpay) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss: () => void;
};

export async function openRazorpayCheckout(options: RazorpayCheckoutOptions) {
  await loadRazorpayScript();

  const RazorpayCtor = (window as any).Razorpay;

  const rzp = new RazorpayCtor({
    key: options.keyId,
    order_id: options.orderId,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
    prefill: {
      name: options.prefillName,
      email: options.prefillEmail,
      contact: options.prefillContact,
    },
    theme: { color: "#4F46E5" },
    handler: options.onSuccess,
    modal: {
      ondismiss: options.onDismiss,
    },
  });

  rzp.open();
}