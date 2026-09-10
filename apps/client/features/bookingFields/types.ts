import type { BookingFieldKey } from "./bookingFieldLibrary";

export type SelectedBookingField = {
  fieldKey: BookingFieldKey;
  displayOrder: number;
  label: string;
  type: string;
  category: string;
};

export type GetBookingFieldsResponse = {
  success: boolean;
  data: { fields: SelectedBookingField[] };
};

export type ReplaceBookingFieldsPayload = {
  fields: { fieldKey: BookingFieldKey; displayOrder: number }[];
};

export type ReplaceBookingFieldsResponse = {
  success: boolean;
  data: { fields: { fieldKey: BookingFieldKey; displayOrder: number }[] };
};