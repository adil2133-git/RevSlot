"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createBooking } from "../api/bookingApi";
import type { BookingFormField, HoldResult } from "../type";
import {
  buildBookingSchema,
  DEFAULT_BOOKING_FORM_VALUES,
  type BookingFormValues,
} from "../validation/BookingSchema";

export type { BookingFormValues };

export function useBookingForm(
  holdResult: HoldResult | null,
  fields: BookingFormField[]
) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingDone, setBookingDone] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);

  const bookingSchema = useMemo(
    () => buildBookingSchema(fields),
    [fields]
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema) as Resolver<BookingFormValues>,
    defaultValues: DEFAULT_BOOKING_FORM_VALUES,
  });

  const email = watch("email");

  const onSubmit = handleSubmit(async (values) => {
    if (!holdResult) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createBooking({
        holdToken: holdResult.holdToken,
        formData: Object.fromEntries(
          Object.entries(values).map(([key, value]) => [
            key,
            String(value ?? ""),
          ])
        ),
      });
       setMeetLink(result.meetLink ?? null);
       setBookingDone(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to create booking."
      );
    } finally {
      setSubmitting(false);
    }
  });

  return {
      register,
      errors,
      advisorEmail: email,
      submitting,
      submitError,
      bookingDone,
      meetLink,
      onSubmit,
  };
}