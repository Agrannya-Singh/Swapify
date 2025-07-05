import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tracks = pgTable("tracks", {
  id: text("id").primaryKey(), // Spotify track ID
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album").notNull(),
  albumArt: text("album_art").notNull(),
  previewUrl: text("preview_url"),
  duration: integer("duration").notNull(), // in seconds
  popularity: integer("popularity").notNull(),
  spotifyUrl: text("spotify_url").notNull(),
  year: text("year"),
});

export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  trackId: text("track_id").references(() => tracks.id).notNull(),
  action: text("action").notNull(), // 'like', 'skip', 'super_like'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playlists = pgTable("playlists", {
  id: text("id").primaryKey(), // Spotify playlist ID
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  spotifyUrl: text("spotify_url").notNull(),
  trackCount: integer("track_count").notNull(),
  isImported: boolean("is_imported").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playlistTracks = pgTable("playlist_tracks", {
  id: serial("id").primaryKey(),
  playlistId: text("playlist_id").references(() => playlists.id).notNull(),
  trackId: text("track_id").references(() => tracks.id).notNull(),
  position: integer("position").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertTrackSchema = createInsertSchema(tracks);
export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({
  id: true,
  createdAt: true,
});
export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  createdAt: true,
});
export const insertPlaylistTrackSchema = createInsertSchema(playlistTracks).omit({
  id: true,
  addedAt: true,
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type InsertPlaylistTrack = z.infer<typeof insertPlaylistTrackSchema>;
