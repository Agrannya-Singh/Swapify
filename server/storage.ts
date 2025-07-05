import { type Track, type InsertTrack, type UserInteraction, type InsertUserInteraction, type Playlist, type InsertPlaylist, type PlaylistTrack, type InsertPlaylistTrack, tracks, userInteractions, playlists, playlistTracks } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, inArray, and, desc } from "drizzle-orm";

export interface IStorage {
  getTrack(id: string): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  addUserInteraction(interaction: InsertUserInteraction): Promise<UserInteraction>;
  getLikedTracks(): Promise<Track[]>;
  getSkippedTrackIds(): Promise<string[]>;
  
  // Playlist operations
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getAllPlaylists(): Promise<Playlist[]>;
  addTrackToPlaylist(playlistTrack: InsertPlaylistTrack): Promise<PlaylistTrack>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
  
  // ML-based recommendations
  getRecommendationsBasedOnLiked(): Promise<Track[]>;
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [existingTrack] = await db.select().from(tracks).where(eq(tracks.id, insertTrack.id));
    
    if (existingTrack) {
      return existingTrack;
    }

    const [track] = await db.insert(tracks).values(insertTrack).returning();
    return track;
  }

  async addUserInteraction(insertInteraction: InsertUserInteraction): Promise<UserInteraction> {
    const [interaction] = await db.insert(userInteractions).values(insertInteraction).returning();
    return interaction;
  }

  async getLikedTracks(): Promise<Track[]> {
    const likedInteractions = await db.select()
      .from(userInteractions)
      .where(inArray(userInteractions.action, ['like', 'super_like']));

    const likedTrackIds = likedInteractions.map(i => i.trackId);
    
    if (likedTrackIds.length === 0) {
      return [];
    }

    const likedTracks = await db.select()
      .from(tracks)
      .where(inArray(tracks.id, likedTrackIds));

    return likedTracks;
  }

  async getSkippedTrackIds(): Promise<string[]> {
    const skippedInteractions = await db.select()
      .from(userInteractions)
      .where(eq(userInteractions.action, 'skip'));
    
    return skippedInteractions.map(i => i.trackId);
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [existingPlaylist] = await db.select().from(playlists).where(eq(playlists.id, insertPlaylist.id));
    
    if (existingPlaylist) {
      return existingPlaylist;
    }

    const [playlist] = await db.insert(playlists).values(insertPlaylist).returning();
    return playlist;
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    const allPlaylists = await db.select().from(playlists);
    return allPlaylists;
  }

  async addTrackToPlaylist(insertPlaylistTrack: InsertPlaylistTrack): Promise<PlaylistTrack> {
    const [playlistTrack] = await db.insert(playlistTracks).values(insertPlaylistTrack).returning();
    return playlistTrack;
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    const playlistTrackList = await db.select()
      .from(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));

    if (playlistTrackList.length === 0) {
      return [];
    }

    const trackIds = playlistTrackList.map(pt => pt.trackId);
    const playlistTracksData = await db.select()
      .from(tracks)
      .where(inArray(tracks.id, trackIds));

    return playlistTracksData;
  }

  async getRecommendationsBasedOnLiked(): Promise<Track[]> {
    const likedTracks = await this.getLikedTracks();
    
    if (likedTracks.length === 0) {
      return [];
    }

    // Get average popularity of liked tracks
    const avgPopularity = likedTracks.reduce((sum, track) => sum + track.popularity, 0) / likedTracks.length;
    
    // Get artists from liked tracks
    const likedArtists = new Set(likedTracks.map(track => track.artist));
    
    // Get skipped track IDs
    const skippedIds = await this.getSkippedTrackIds();
    const likedIds = new Set(likedTracks.map(t => t.id));
    
    // Find tracks from similar artists or with similar popularity
    const allTracks = await db.select().from(tracks);
    
    return allTracks
      .filter(track => 
        !skippedIds.includes(track.id) && 
        !likedIds.has(track.id) &&
        (likedArtists.has(track.artist) || 
         Math.abs(track.popularity - avgPopularity) <= 20)
      )
      .sort((a, b) => {
        // Prioritize tracks from liked artists
        const aFromLikedArtist = likedArtists.has(a.artist) ? 1 : 0;
        const bFromLikedArtist = likedArtists.has(b.artist) ? 1 : 0;
        
        if (aFromLikedArtist !== bFromLikedArtist) {
          return bFromLikedArtist - aFromLikedArtist;
        }
        
        // Then by popularity similarity
        const aPopDiff = Math.abs(a.popularity - avgPopularity);
        const bPopDiff = Math.abs(b.popularity - avgPopularity);
        
        return aPopDiff - bPopDiff;
      })
      .slice(0, 10);
  }
}

export const storage = new DatabaseStorage();
