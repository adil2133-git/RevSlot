import api from "@/lib/axios";

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export async function createRazorpayOrder(holdToken: string) {
  const { data } = await api.post<{ success: boolean; data: CreateOrderResponse }>(
    "/payments/create-order",
    { holdToken }
  );
  return data.data;
}

export async function verifyRazorpayPayment(payload: {
  holdToken: string;
  formData: Record<string, string>;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { data } = await api.post<{
    success: boolean;
    data: { meetLink: string | null };
  }>("/payments/verify", payload);
  return data.data;
}