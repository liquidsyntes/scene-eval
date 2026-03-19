import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey(),
  // Block 1
  eventDate: text("event_date"),
  venue: text("venue"),
  format: text("format"),
  plannedDuration: text("planned_duration"),
  actualDuration: text("actual_duration"),
  audienceCount: text("audience_count"),
  description: text("description"),
  // Block 2
  preAgreements: text("pre_agreements"),
  missedDiscussions: text("missed_discussions"),
  partnerDifficulties: text("partner_difficulties"),
  limitViolations: text("limit_violations"),
  aftercare: text("aftercare"),
  partnerWords: text("partner_words"),
  safetyRating: integer("safety_rating"),
  safetyRatingReason: text("safety_rating_reason"),
  // Block 3
  structure: text("structure"),
  tempoIssues: text("tempo_issues"),
  organicTransitions: text("organic_transitions"),
  roughTransitions: text("rough_transitions"),
  actualStory: text("actual_story"),
  bestDramaturgy: text("best_dramaturgy"),
  worstDramaturgy: text("worst_dramaturgy"),
  // Block 4
  bodyPresence: text("body_presence"),
  parasiticMovements: text("parasitic_movements"),
  spaceUsage: text("space_usage"),
  ignoredAreas: text("ignored_areas"),
  partnerSync: text("partner_sync"),
  partnerLoss: text("partner_loss"),
  audienceContact: text("audience_contact"),
  audienceLoss: text("audience_loss"),
  voiceWorked: text("voice_worked"),
  voiceFailed: text("voice_failed"),
  // Block 5
  costumeReadability: text("costume_readability"),
  costumeIssues: text("costume_issues"),
  propsWorked: text("props_worked"),
  propsIssues: text("props_issues"),
  lightMusicGood: text("light_music_good"),
  lightMusicBad: text("light_music_bad"),
  techFails: text("tech_fails"),
  techFailHandling: text("tech_fail_handling"),
  // Block 6
  audienceEngaged: text("audience_engaged"),
  audienceDiscomfort: text("audience_discomfort"),
  feedbackQuotes: text("feedback_quotes"),
  feedbackThemes: text("feedback_themes"),
  partnerBest: text("partner_best"),
  partnerImprove: text("partner_improve"),
  // Block 7
  strong1: text("strong_1"),
  strong2: text("strong_2"),
  strong3: text("strong_3"),
  weak1: text("weak_1"),
  weak2: text("weak_2"),
  weak3: text("weak_3"),
  removeCompletely: text("remove_completely"),
  changeRadically: text("change_radically"),
  addNew: text("add_new"),
  mainFocus: text("main_focus"),
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true });

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
