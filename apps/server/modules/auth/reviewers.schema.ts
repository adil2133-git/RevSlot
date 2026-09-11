import { pgTable, serial, varchar, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';

// Reviewers self-register — no admin-created flow, no FK to admins here.
export const reviewers = pgTable(
  'reviewers',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    username: varchar('username', {length: 50}).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash'),
    googleId: varchar('google_id', { length: 255 }).unique(), // ← new
    whatsappNumber: varchar('whatsapp_number', { length: 20 }).notNull(),
    googleCalendarRefreshToken: text('google_calendar_refresh_token'),
    googleCalendarEmail: varchar('google_calendar_email', { length: 255 }),
    googleCalendarConnected: boolean('google_calendar_connected').notNull().default(false),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    // Professional profile
    professionalHeadline: varchar("professional_headline", {length: 150,}),
    skills: jsonb("skills").$type<string[]>().default([]),
    yearsOfExperience: integer("years_of_experience"),
    currentRole: varchar("current_role", {
      length: 150,
    }),
    currentCompany: varchar("current_company", {
      length: 150,
    }),
    // Education — single entry
    degree: varchar("degree", {
      length: 150,
    }),
    university: varchar("university", {
      length: 200,
    }),
    graduationYear: integer("graduation_year"),
    // Professional links
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    portfolioUrl: text("portfolio_url"),
    isActive: boolean('is_active').default(true),
    emailVerified: boolean('email_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_reviewers_email').on(table.email)]
);