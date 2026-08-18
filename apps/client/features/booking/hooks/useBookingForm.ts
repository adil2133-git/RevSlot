"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBooking } from "../api/bookingApi";
import type { HoldResult } from "../type";
import { bookingSchema, type BookingFormValues } from "../validation/BookingSchema";

export type { BookingFormValues };

export function useBookingForm(holdResult: HoldResult | null) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingDone, setBookingDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      advisorName: "",
      advisorEmail: "",
      internName: "",
      batch: "",
      internEmails: "",
      weekStage: "",
    },
  });

  // Confirmation screen needs advisorEmail even before the booking is
  // submitted (see BookingConfirmation usage in page.tsx) — watch keeps it
  // in sync without lifting state out of react-hook-form.
  const advisorEmail = watch("advisorEmail");

  const onSubmit = handleSubmit(async (values) => {
    if (!holdResult) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createBooking({
        holdToken: holdResult.holdToken,
        advisorName: values.advisorName,
        advisorEmail: values.advisorEmail,
        internName: values.internName,
        batch: values.batch,
        weekStage: values.weekStage,
        internEmails: values.internEmails
          ? values.internEmails.split(",").map((e) => e.trim()).filter(Boolean)
          : undefined,
      });
      setBookingDone(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not confirm the booking"
      );
    } finally {
      setSubmitting(false);
    }
  });

  return {
    register,
    errors,
    advisorEmail,
    submitting,
    submitError,
    bookingDone,
    onSubmit,
  };
}