import axios from "axios";
import type { AdvisorBookingScope, AdvisorBookingsResponse, AdvisorFeedbackData } from "../types";

const ADVISOR_TOKEN_KEY = "revslot_advisor_token";
const ADVISOR_EMAIL_KEY = "revslot_advisor_email";

const advisorClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getStoredAdvisorToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADVISOR_TOKEN_KEY);
};

export const getStoredAdvisorEmail = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADVISOR_EMAIL_KEY);
};

export const setAdvisorSession = (token: string, email: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADVISOR_TOKEN_KEY, token);
  localStorage.setItem(ADVISOR_EMAIL_KEY, email);
};

export const clearAdvisorSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADVISOR_TOKEN_KEY);
  localStorage.removeItem(ADVISOR_EMAIL_KEY);
};

export const advisorApi = {
  sendOtp: async (email: string) => {
    const res = await advisorClient.post("/advisor/auth/send-otp", { email });
    return res.data;
  },

  verifyOtp: async (email: string, code: string) => {
    const res = await advisorClient.post("/advisor/auth/verify-otp", { email, code });
    const { token, advisorEmail } = res.data.data;
    setAdvisorSession(token, advisorEmail);
    return { token, advisorEmail };
  },

  getBookings: async (scope: AdvisorBookingScope = "upcoming", search: string = "") => {
    const token = getStoredAdvisorToken();
    const res = await advisorClient.get<{ success: boolean; data: AdvisorBookingsResponse }>("/advisor/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        scope,
        search,
      },
    });
    return res.data.data;
  },

  getBookingFeedback: async (bookingId: number) => {
    const token = getStoredAdvisorToken();
    const res = await advisorClient.get<{ success: boolean; data: AdvisorFeedbackData }>(`/advisor/bookings/${bookingId}/feedback`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data;
  },
};
