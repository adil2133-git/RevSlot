import { z } from "zod";
import {
  BOOKING_FIELD_DEFINITIONS,
  type BookingFieldKey,
} from "./bookingFields.js";

const bookingFieldKeys = Object.keys(
  BOOKING_FIELD_DEFINITIONS
) as [BookingFieldKey, ...BookingFieldKey[]];

export const ReplaceBookingFieldsSchema = z.object({
  fields: z
    .array(
      z.object({
        fieldKey: z.enum(bookingFieldKeys),
        displayOrder: z.number().int().min(0),
      })
    )
    .max(30),
});

export type ReplaceBookingFieldsInput = z.infer<
  typeof ReplaceBookingFieldsSchema
>;