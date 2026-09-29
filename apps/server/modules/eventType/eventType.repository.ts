import { eq, and, desc, type InferInsertModel } from "drizzle-orm";
import { db } from "../../config/db.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { eventTypes } from "./eventTypes.schema.js";
import { availabilityTemplates } from "../availability/schema/availabilityTemplates.schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Transaction;

export type NewEventType = InferInsertModel<typeof eventTypes>;

export interface UpdateEventTypeData {
  availabilityTemplateId?: number | undefined;
  name?: string | undefined;
  description?: string | null | undefined;
  durationMinutes?: number | undefined;
  price?: number | undefined;
  bufferBeforeMinutes?: number | undefined;
  bufferAfterMinutes?: number | undefined;
  meetingLink?: string | null | undefined;
  isActive?: boolean | undefined;
  isPublic?: boolean | undefined;
}

export const findPublicReviewerByUsernameRepo = async (
  username: string,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({
      id: reviewers.id,
      name: reviewers.name,
      avatarUrl: reviewers.avatarUrl,
      bio: reviewers.bio,
      professionalHeadline: reviewers.professionalHeadline,
      skills: reviewers.skills,
      yearsOfExperience: reviewers.yearsOfExperience,
      currentRole: reviewers.currentRole,
      currentCompany: reviewers.currentCompany,
      degree: reviewers.degree,
      university: reviewers.university,
      graduationYear: reviewers.graduationYear,
      linkedinUrl: reviewers.linkedinUrl,
      githubUrl: reviewers.githubUrl,
      portfolioUrl: reviewers.portfolioUrl,
    })
    .from(reviewers)
    .where(and(eq(reviewers.username, username), eq(reviewers.isActive, true)))
    .limit(1);

  return reviewer;
};

export const findBookingPageEventTypeRepo = async (
  reviewerId: number,
  eventSlug: string,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({
      id: eventTypes.id,
      name: eventTypes.name,
      slug: eventTypes.slug,
      durationMinutes: eventTypes.durationMinutes,
      description: eventTypes.description,
      timezone: availabilityTemplates.timezone,
      bookingWindowDays: eventTypes.bookingWindowDays,
      price: eventTypes.price,
    })
    .from(eventTypes)
    .innerJoin(
      availabilityTemplates,
      eq(eventTypes.availabilityTemplateId, availabilityTemplates.id)
    )
    .where(
      and(
        eq(eventTypes.reviewerId, reviewerId),
        eq(eventTypes.slug, eventSlug),
        eq(eventTypes.isActive, true)
      )
    )
    .limit(1);

  return eventType;
};

export const findProfileReviewerByUsernameRepo = async (
  username: string,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({
      id: reviewers.id,
      name: reviewers.name,
      avatarUrl: reviewers.avatarUrl,
      bio: reviewers.bio,
    })
    .from(reviewers)
    .where(and(eq(reviewers.username, username), eq(reviewers.isActive, true)))
    .limit(1);

  return reviewer;
};

export const findPublicActiveEventTypesByReviewerRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      id: eventTypes.id,
      name: eventTypes.name,
      slug: eventTypes.slug,
      description: eventTypes.description,
      durationMinutes: eventTypes.durationMinutes,
      price: eventTypes.price,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.reviewerId, reviewerId),
        eq(eventTypes.isActive, true),
        eq(eventTypes.isPublic, true)
      )
    )
    .orderBy(desc(eventTypes.createdAt));
};

export const findReviewerWhatsAppRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [reviewer] = await tx
    .select({
      whatsappNumber: reviewers.whatsappNumber,
    })
    .from(reviewers)
    .where(eq(reviewers.id, reviewerId))
    .limit(1);

  return reviewer;
};

export const findOwnedTemplateIdRepo = async (
  templateId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [template] = await tx
    .select({
      id: availabilityTemplates.id,
    })
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

export const findEventTypeBySlugAndReviewerRepo = async (
  slug: string,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [existingEventType] = await tx
    .select({
      id: eventTypes.id,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.reviewerId, reviewerId),
        eq(eventTypes.slug, slug)
      )
    )
    .limit(1);

  return existingEventType;
};

export const insertEventTypeRepo = async (
  values: {
    reviewerId: number;
    availabilityTemplateId: number;
    name: string;
    slug: string;
    description?: string | null | undefined;
    durationMinutes: number;
    price?: number | undefined;
    bufferBeforeMinutes?: number | undefined;
    bufferAfterMinutes?: number | undefined;
    meetingLink?: string | null | undefined;
    isPublic?: boolean | undefined;
  },
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .insert(eventTypes)
    .values(values)
    .returning();

  return eventType;
};

export const findEventTypesByReviewerRepo = async (
  reviewerId: number,
  tx: DbOrTx = db
) => {
  return await tx
    .select({
      id: eventTypes.id,
      availabilityTemplateId: eventTypes.availabilityTemplateId,
      name: eventTypes.name,
      slug: eventTypes.slug,
      description: eventTypes.description,
      durationMinutes: eventTypes.durationMinutes,
      price: eventTypes.price,
      bufferBeforeMinutes: eventTypes.bufferBeforeMinutes,
      bufferAfterMinutes: eventTypes.bufferAfterMinutes,
      meetingLink: eventTypes.meetingLink,
      isActive: eventTypes.isActive,
      isPublic: eventTypes.isPublic,
      createdAt: eventTypes.createdAt,
      updatedAt: eventTypes.updatedAt,
    })
    .from(eventTypes)
    .where(eq(eventTypes.reviewerId, reviewerId))
    .orderBy(desc(eventTypes.createdAt));
};

export const findEventTypeByIdAndReviewerRepo = async (
  eventTypeId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({
      id: eventTypes.id,
      reviewerId: eventTypes.reviewerId,
      availabilityTemplateId: eventTypes.availabilityTemplateId,
      name: eventTypes.name,
      slug: eventTypes.slug,
      description: eventTypes.description,
      durationMinutes: eventTypes.durationMinutes,
      price: eventTypes.price,
      bufferBeforeMinutes: eventTypes.bufferBeforeMinutes,
      bufferAfterMinutes: eventTypes.bufferAfterMinutes,
      meetingLink: eventTypes.meetingLink,
      isActive: eventTypes.isActive,
      isPublic: eventTypes.isPublic,
      createdAt: eventTypes.createdAt,
      updatedAt: eventTypes.updatedAt,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .limit(1);

  return eventType;
};

export const findEventTypeIdOwnedRepo = async (
  eventTypeId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [existingEventType] = await tx
    .select({
      id: eventTypes.id,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .limit(1);

  return existingEventType;
};

export const updateEventTypeRepo = async (
  eventTypeId: number,
  reviewerId: number,
  data: UpdateEventTypeData,
  tx: DbOrTx = db
) => {
  const [updatedEventType] = await tx
    .update(eventTypes)
    .set({
      ...(data.availabilityTemplateId !== undefined && {
        availabilityTemplateId: data.availabilityTemplateId,
      }),
      ...(data.name !== undefined && {
        name: data.name,
      }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.durationMinutes !== undefined && {
        durationMinutes: data.durationMinutes,
      }),
      ...(data.price !== undefined && {
        price: data.price,
      }),
      ...(data.bufferBeforeMinutes !== undefined && {
        bufferBeforeMinutes: data.bufferBeforeMinutes,
      }),
      ...(data.bufferAfterMinutes !== undefined && {
        bufferAfterMinutes: data.bufferAfterMinutes,
      }),
      ...(data.meetingLink !== undefined && {
        meetingLink: data.meetingLink,
      }),
      ...(data.isActive !== undefined && {
        isActive: data.isActive,
      }),
      ...(data.isPublic !== undefined && {
        isPublic: data.isPublic,
      }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .returning();

  return updatedEventType;
};

export const findEventTypeActiveStatusRepo = async (
  eventTypeId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [eventType] = await tx
    .select({
      id: eventTypes.id,
      isActive: eventTypes.isActive,
    })
    .from(eventTypes)
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .limit(1);

  return eventType;
};

export const deactivateEventTypeRepo = async (
  eventTypeId: number,
  reviewerId: number,
  tx: DbOrTx = db
) => {
  const [updatedEventType] = await tx
    .update(eventTypes)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(eventTypes.id, eventTypeId),
        eq(eventTypes.reviewerId, reviewerId)
      )
    )
    .returning();

  return updatedEventType;
};

export const eventTypeRepository = {
  findPublicReviewerByUsername: findPublicReviewerByUsernameRepo,
  findBookingPageEventType: findBookingPageEventTypeRepo,
  findProfileReviewerByUsername: findProfileReviewerByUsernameRepo,
  findPublicActiveEventTypesByReviewer: findPublicActiveEventTypesByReviewerRepo,
  findReviewerWhatsApp: findReviewerWhatsAppRepo,
  findOwnedTemplateId: findOwnedTemplateIdRepo,
  findEventTypeBySlugAndReviewer: findEventTypeBySlugAndReviewerRepo,
  insertEventType: insertEventTypeRepo,
  findEventTypesByReviewer: findEventTypesByReviewerRepo,
  findEventTypeByIdAndReviewer: findEventTypeByIdAndReviewerRepo,
  findEventTypeIdOwned: findEventTypeIdOwnedRepo,
  updateEventType: updateEventTypeRepo,
  findEventTypeActiveStatus: findEventTypeActiveStatusRepo,
  deactivateEventType: deactivateEventTypeRepo,
};
