import { eq, and, asc, inArray, ne, sql, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { availabilityTemplates } from "./schema/availabilityTemplates.schema.js";
import { templateTimeBlocks } from "./schema/templateTimeBlocks.schema.js";
import { templateDateOverrides } from "./schema/templateDateOverrides.schema.js";
import { templateOverrideBlocks } from "./schema/templateDateOverrideBlocks.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { bookings } from "../booking/bookings.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewAvailabilityTemplate = InferInsertModel<typeof availabilityTemplates>;
export type NewTemplateTimeBlock = InferInsertModel<typeof templateTimeBlocks>;
export type NewTemplateDateOverride = InferInsertModel<typeof templateDateOverrides>;
export type NewTemplateOverrideBlock = InferInsertModel<typeof templateOverrideBlocks>;

export const findOwnedTemplateRepo = async (
  reviewerId: number,
  templateId: number,
  tx: DbOrTx = db
) => {
  const [template] = await tx
    .select()
    .from(availabilityTemplates)
    .where(
      and(
        eq(availabilityTemplates.id, templateId),
        eq(availabilityTemplates.reviewerId, reviewerId)
      )
    )
    .limit(1);

  return template;
};

export const findEventTypesByTemplateIdRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(eq(eventTypes.availabilityTemplateId, templateId));
};

export const findConfirmedBookingsOnDateRepo = async (
  eventTypeIds: number[],
  date: string,
  tx: DbOrTx = db
) => {
  if (eventTypeIds.length === 0) return [];
  return await tx
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.eventTypeId, eventTypeIds),
        eq(bookings.status, "confirmed"),
        sql`${bookings.startTime}::date = ${date}::date`
      )
    );
};

export const findReviewerProfileForAvailabilityRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({ username: reviewers.username, whatsappNumber: reviewers.whatsappNumber })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);
  return reviewer;
};

export const findTemplateByNameRepo = async (
  reviewerId: number,
  name: string,
  tx: DbOrTx = db
) => {
  const [existing] = await tx
    .select()
    .from(availabilityTemplates)
    .where(
      and(
        eq(availabilityTemplates.reviewerId, reviewerId),
        eq(availabilityTemplates.name, name)
      )
    )
    .limit(1);
  return existing;
};

export const findTemplatesByReviewerRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(availabilityTemplates)
    .where(eq(availabilityTemplates.reviewerId, reviewerId))
    .orderBy(asc(availabilityTemplates.createdAt));
};

export const clearDefaultTemplateForReviewerRepo = async (
  reviewerId: number,
  excludeTemplateId?: number | undefined,
  tx: DbOrTx = db
) => {
  const conditions = [eq(availabilityTemplates.reviewerId, reviewerId)];
  if (excludeTemplateId !== undefined) {
    conditions.push(ne(availabilityTemplates.id, excludeTemplateId));
  }
  return await tx
    .update(availabilityTemplates)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(...conditions));
};

export const insertTemplateRepo = async (
  values: {
    reviewerId: number;
    name: string;
    description?: string | undefined;
    timezone: string;
    isDefault: boolean;
  },
  tx: DbOrTx = db
) => {
  const [template] = await tx
    .insert(availabilityTemplates)
    .values(values)
    .returning();
  return template;
};

export const findTemplateTimeBlocksByTemplateIdsRepo = async (
  templateIds: number[],
  tx: DbOrTx = db
) => {
  if (templateIds.length === 0) return [];
  return await tx
    .select()
    .from(templateTimeBlocks)
    .where(inArray(templateTimeBlocks.templateId, templateIds))
    .orderBy(asc(templateTimeBlocks.dayOfWeek), asc(templateTimeBlocks.displayOrder));
};

export const findTemplateTimeBlocksByTemplateIdRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(templateTimeBlocks)
    .where(eq(templateTimeBlocks.templateId, templateId))
    .orderBy(asc(templateTimeBlocks.dayOfWeek), asc(templateTimeBlocks.displayOrder));
};

export interface UpdateTemplateData {
  name?: string | undefined;
  description?: string | null | undefined;
  timezone?: string | undefined;
  isDefault?: boolean | undefined;
  updatedAt?: Date | undefined;
}

export const updateTemplateRepo = async (
  templateId: number,
  data: UpdateTemplateData,
  tx: DbOrTx = db
) => {
  const [updated] = await tx
    .update(availabilityTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(availabilityTemplates.id, templateId))
    .returning();
  return updated;
};

export const setDefaultTemplateRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(availabilityTemplates)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(availabilityTemplates.id, templateId));
};

export const reassignEventTypesToFallbackTemplateRepo = async (
  reviewerId: number,
  fromTemplateId: number,
  toTemplateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .update(eventTypes)
    .set({
      availabilityTemplateId: toTemplateId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventTypes.reviewerId, reviewerId),
        eq(eventTypes.availabilityTemplateId, fromTemplateId)
      )
    )
    .returning({ id: eventTypes.id, name: eventTypes.name });
};

export const deleteTemplateRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .delete(availabilityTemplates)
    .where(eq(availabilityTemplates.id, templateId));
};

export const deleteTemplateTimeBlocksRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .delete(templateTimeBlocks)
    .where(eq(templateTimeBlocks.templateId, templateId));
};

export const insertTemplateTimeBlocksRepo = async (
  blocks: Array<{
    templateId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    displayOrder?: number | undefined;
  }>,
  tx: DbOrTx = db
) => {
  if (blocks.length === 0) return [];
  return await tx
    .insert(templateTimeBlocks)
    .values(blocks)
    .returning();
};

export const findDateOverrideByTemplateAndDateRepo = async (
  templateId: number,
  date: string,
  tx: DbOrTx = db
) => {
  const [existing] = await tx
    .select()
    .from(templateDateOverrides)
    .where(and(eq(templateDateOverrides.templateId, templateId), eq(templateDateOverrides.date, date)))
    .limit(1);
  return existing;
};

export const insertDateOverrideRepo = async (
  values: {
    templateId: number;
    date: string;
    isUnavailable: boolean;
  },
  tx: DbOrTx = db
) => {
  const [override] = await tx
    .insert(templateDateOverrides)
    .values(values)
    .returning();
  return override;
};

export const insertDateOverrideBlocksRepo = async (
  blocks: Array<{
    overrideId: number;
    startTime: string;
    endTime: string;
    displayOrder?: number | undefined;
  }>,
  tx: DbOrTx = db
) => {
  if (blocks.length === 0) return [];
  return await tx
    .insert(templateOverrideBlocks)
    .values(blocks)
    .returning();
};

export const findDateOverridesByTemplateIdRepo = async (
  templateId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select()
    .from(templateDateOverrides)
    .where(eq(templateDateOverrides.templateId, templateId))
    .orderBy(asc(templateDateOverrides.date));
};

export const findDateOverrideBlocksByOverrideIdsRepo = async (
  overrideIds: number[],
  tx: DbOrTx = db
) => {
  if (overrideIds.length === 0) return [];
  return await tx
    .select()
    .from(templateOverrideBlocks)
    .where(inArray(templateOverrideBlocks.overrideId, overrideIds))
    .orderBy(asc(templateOverrideBlocks.displayOrder));
};

export const findDateOverrideByIdAndTemplateIdRepo = async (
  overrideId: number,
  templateId: number,
  tx: DbOrTx = db
) => {
  const [existing] = await tx
    .select()
    .from(templateDateOverrides)
    .where(and(eq(templateDateOverrides.id, overrideId), eq(templateDateOverrides.templateId, templateId)))
    .limit(1);
  return existing;
};

export const deleteDateOverrideRepo = async (
  overrideId: number,
  tx: DbOrTx = db
) => {
  return await tx.delete(templateDateOverrides).where(eq(templateDateOverrides.id, overrideId));
};

export const availabilityRepository = {
  findOwnedTemplate: findOwnedTemplateRepo,
  findEventTypesByTemplateId: findEventTypesByTemplateIdRepo,
  findConfirmedBookingsOnDate: findConfirmedBookingsOnDateRepo,
  findReviewerProfileForAvailability: findReviewerProfileForAvailabilityRepo,
  findTemplateByName: findTemplateByNameRepo,
  findTemplatesByReviewer: findTemplatesByReviewerRepo,
  clearDefaultTemplateForReviewer: clearDefaultTemplateForReviewerRepo,
  insertTemplate: insertTemplateRepo,
  findTemplateTimeBlocksByTemplateIds: findTemplateTimeBlocksByTemplateIdsRepo,
  findTemplateTimeBlocksByTemplateId: findTemplateTimeBlocksByTemplateIdRepo,
  updateTemplate: updateTemplateRepo,
  setDefaultTemplate: setDefaultTemplateRepo,
  reassignEventTypesToFallbackTemplate: reassignEventTypesToFallbackTemplateRepo,
  deleteTemplate: deleteTemplateRepo,
  deleteTemplateTimeBlocks: deleteTemplateTimeBlocksRepo,
  insertTemplateTimeBlocks: insertTemplateTimeBlocksRepo,
  findDateOverrideByTemplateAndDate: findDateOverrideByTemplateAndDateRepo,
  insertDateOverride: insertDateOverrideRepo,
  insertDateOverrideBlocks: insertDateOverrideBlocksRepo,
  findDateOverridesByTemplateId: findDateOverridesByTemplateIdRepo,
  findDateOverrideBlocksByOverrideIds: findDateOverrideBlocksByOverrideIdsRepo,
  findDateOverrideByIdAndTemplateId: findDateOverrideByIdAndTemplateIdRepo,
  deleteDateOverride: deleteDateOverrideRepo,
};
