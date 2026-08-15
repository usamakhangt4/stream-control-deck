import {z} from "zod";

export const StreamPresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Preset name is required"),
  title: z.string().min(1, "Stream title is required"),
  gameCategory: z.string().min(1, "Game category is required"),
  twitchGameId: z.string().optional(),
  kickCategory: z.string().optional(),
  kickCategoryId: z.string().optional(),
  youtubeCategory: z.string().optional(),
  youtubeCategoryId: z.string().optional(),
  obsSceneName: z.string().optional(),
  isActive: z.boolean().default(false),
});

export type StreamPreset = z.infer<typeof StreamPresetSchema>;

export interface PlatformStatus {
  twitchConnected: boolean;
  kickConnected: boolean;
  youtubeConnected: boolean;
}