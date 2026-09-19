"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createBooking } from "../api/bookingApi";
import { createRazorpayOrder, verifyRazorpayPayment } from "../../payment/paymentApi";
import { openRazorpayCheckout } from "../../payment/loadRazorpayCheckout";
import type { BookingFormField, HoldResult } from "../type";
import {
  BOOKING_FIELD_DEFINITIONS,
  type BookingFieldKey,
} from "../../../features/bookingFields/bookingFieldLibrary";
import {
  buildBookingSchema,
  DEFAULT_BOOKING_FORM_VALUES,
  type BookingFormValues,
} from "../validation/BookingSchema";

export type { BookingFormValues };

export function useBookingForm(
  holdResult: HoldResult | null,
  bookingContext: { price: number; eventTypeName: string; reviewerName: string },
) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingDone, setBookingDone] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [selectedFieldKeys, setSelectedFieldKeys] =
  useState<BookingFieldKey[]>([]);

  const addField = (fieldKey: BookingFieldKey) => {
  setSelectedFieldKeys((prev) =>
    prev.includes(fieldKey)
      ? prev
      : [...prev, fieldKey]
  );
};

  const removeField = (fieldKey: BookingFieldKey) => {
  unregister(fieldKey);

  setSelectedFieldKeys((prev) =>
    prev.filter((key) => key !== fieldKey)
  );
};

  const fields: BookingFormField[] = [
  {
    fieldKey: "fullName",
    label: "Full Name",
    type: "text",
    category: "Basic",
    required: true,
  },
  {
    fieldKey: "email",
    label: "Email Address",
    type: "email",
    category: "Basic",
    required: true,
  },
  {
    fieldKey: "whatsappNumber",
    label: "WhatsApp Number",
    type: "tel",
    category: "Basic",
    required: true,
  },
  {
  fieldKey: "mainlyFocusedFor",
  label: "Mainly Focused For",
  type: "text",
  category: "Basic",
  required: true,
  },
  {
    fieldKey: "comments",
    label: "Comments / Message",
    type: "textarea",
    category: "Basic",
    required: false,
  },

...selectedFieldKeys.map((fieldKey): BookingFormField => ({
    fieldKey,
    label: BOOKING_FIELD_DEFINITIONS[fieldKey].label,
    type: BOOKING_FIELD_DEFINITIONS[fieldKey].type,
    category: BOOKING_FIELD_DEFINITIONS[fieldKey].category,
    required: false,
  })),
];

  const bookingSchema = useMemo(
    () => buildBookingSchema(fields),
    [fields]
  );

  const {
    register,
    handleSubmit,
    watch,
    unregister,
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

    const formData = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, String(value ?? "")])
    );

    // Free event type — untouched, existing flow.
    if (bookingContext.price <= 0) {
      try {
        const result = await createBooking({ holdToken: holdResult.holdToken, formData });
        setMeetLink(result.meetLink ?? null);
        setBookingDone(true);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to create booking.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Paid event type — create order, open Checkout, verify on success.
    try {
      const order = await createRazorpayOrder(holdResult.holdToken);

      await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: bookingContext.reviewerName,
        description: bookingContext.eventTypeName,
        prefillName: formData.fullName,
        prefillEmail: formData.email,
        prefillContact: formData.whatsappNumber,
        onSuccess: async (response) => {
          try {
            const result = await verifyRazorpayPayment({
              holdToken: holdResult.holdToken,
              formData,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setMeetLink(result.meetLink ?? null);
            setBookingDone(true);
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Payment verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
        onDismiss: () => {
          setSubmitting(false);
        },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not start payment.");
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
      fields,
      selectedFieldKeys,
      addField,
      removeField,
  };
}