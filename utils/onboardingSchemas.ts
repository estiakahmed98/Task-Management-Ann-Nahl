// utils/onboardingSchemas.ts
import { z } from "zod";

export const generalInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  clientType: z.enum(["individual", "business"]),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  companyWebsite: z.string().optional(),
});

const websiteShape = z.object({
  hasWebsite: z.boolean(),
  websiteUrl: z.string().url("Must be a valid URL").optional(),
  desiredDomain: z.string().optional(),
});

export const websiteInfoSchema = websiteShape.superRefine((data, ctx) => {
  if (data.hasWebsite && !data.websiteUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Website URL is required",
      path: ["websiteUrl"],
    });
  }
  if (!data.hasWebsite && !data.desiredDomain) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Desired domain is required",
      path: ["desiredDomain"],
    });
  }
});

export const biographyInfoSchema = z.object({
  biography: z.string().min(20, "Biography must be at least 20 characters"),
});

export const socialMediaSchema = z.object({
  socialMedia: z.object({
    facebook: z.string().url("Invalid Facebook URL").optional(),
    twitter: z.string().url("Invalid Twitter URL").optional(),
    instagram: z.string().url("Invalid Instagram URL").optional(),
    linkedin: z.string().url("Invalid LinkedIn URL").optional(),
    youtube: z.string().url("Invalid YouTube URL").optional(),
    tiktok: z.string().url("Invalid TikTok URL").optional(),
    pinterest: z.string().url("Invalid Pinterest URL").optional(),
    reddit: z.string().url("Invalid Reddit URL").optional(),
    snapchat: z.string().optional(),
    discord: z.string().optional(),
  }),
});

export const driveGallerySchema = z.object({
  driveLink: z
    .string()
    .url("Drive folder link must be a valid URL")
    .regex(
      /drive\.google\.com\/drive\/folders\//,
      "Must be a valid public Drive folder link"
    ),
  driveImages: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        originalUrl: z.string().url(),
      })
    )
    .nonempty("At least one image must be loaded from Drive."),
});

export const articlesSelectionSchema = z.object({
  selectedArticles: z
    .array(z.number())
    .min(1, "Please select at least one article"),
});