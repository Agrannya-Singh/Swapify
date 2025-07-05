import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserInteractionSchema, insertPlaylistSchema, insertPlaylistTrackSchema } from "@shared/schema";
import { z } from "zod";

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured");
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify token');
  }

  const data = await response.json();
  return data.access_token;
}

async function searchSpotifyTracks(token: string, query: string = '', limit: number = 20) {
  const searchQuery = query || 'year:2020-2024';
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search Spotify tracks');
  }

  const data = await response.json();
  return data.tracks.items.map((item: any) => ({
    id: item.id,
    title: item.name,
    artist: item.artists[0]?.name || 'Unknown Artist',
    album: item.album.name,
    albumArt: item.album.images[0]?.url || '',
    previewUrl: item.preview_url,
    duration: Math.floor(item.duration_ms / 1000),
    popularity: item.popularity,
    spotifyUrl: item.external_urls.spotify,
    year: item.album.release_date?.split('-')[0] || '',
  }));
}

async function getSpotifyRecommendations(token: string, seedTracks: string[], limit: number = 20) {
  const seedTracksParam = seedTracks.slice(0, 5).join(','); // Max 5 seeds
  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracksParam}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get Spotify recommendations');
  }

  const data = await response.json();
  return data.tracks.map((item: any) => ({
    id: item.id,
    title: item.name,
    artist: item.artists[0]?.name || 'Unknown Artist',
    album: item.album.name,
    albumArt: item.album.images[0]?.url || '',
    previewUrl: item.preview_url,
    duration: Math.floor(item.duration_ms / 1000),
    popularity: item.popularity,
    spotifyUrl: item.external_urls.spotify,
    year: item.album.release_date?.split('-')[0] || '',
  }));
}

async function createSpotifyPlaylist(userToken: string, name: string, description: string) {
  // First get user ID
  const userResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to get user profile');
  }

  const userData = await userResponse.json();
  const userId = userData.id;

  // Create playlist
  const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!playlistResponse.ok) {
    throw new Error('Failed to create Spotify playlist');
  }

  return await playlistResponse.json();
}

async function addTracksToSpotifyPlaylist(userToken: string, playlistId: string, trackUris: string[]) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: trackUris,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to add tracks to Spotify playlist');
  }

  return await response.json();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get discovery tracks
  app.get("/api/tracks/discover", async (req, res) => {
    try {
      const token = await getSpotifyToken();
      const skippedIds = await storage.getSkippedTrackIds();
      
      // Get fresh tracks from Spotify
      const spotifyTracks = await searchSpotifyTracks(token, '', 50);
      
      // Filter out already skipped tracks
      const freshTracks = spotifyTracks.filter((track: any) => !skippedIds.includes(track.id));
      
      // Store tracks in our storage
      const tracks = [];
      for (const trackData of freshTracks.slice(0, 10)) {
        let track = await storage.getTrack(trackData.id);
        if (!track) {
          track = await storage.createTrack(trackData);
        }
        tracks.push(track);
      }
      
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching discovery tracks:', error);
      res.status(500).json({ error: 'Failed to fetch tracks' });
    }
  });

  // Record user interaction
  app.post("/api/interactions", async (req, res) => {
    try {
      const validatedData = insertUserInteractionSchema.parse(req.body);
      const interaction = await storage.addUserInteraction(validatedData);
      res.json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error recording interaction:', error);
        res.status(500).json({ error: 'Failed to record interaction' });
      }
    }
  });

  // Get liked tracks
  app.get("/api/tracks/liked", async (req, res) => {
    try {
      const likedTracks = await storage.getLikedTracks();
      res.json(likedTracks);
    } catch (error) {
      console.error('Error fetching liked tracks:', error);
      res.status(500).json({ error: 'Failed to fetch liked tracks' });
    }
  });

  // Search tracks
  app.get("/api/tracks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }

      const token = await getSpotifyToken();
      const spotifyTracks = await searchSpotifyTracks(token, query, 20);
      
      // Store tracks in our storage
      const tracks = [];
      for (const trackData of spotifyTracks) {
        let track = await storage.getTrack(trackData.id);
        if (!track) {
          track = await storage.createTrack(trackData);
        }
        tracks.push(track);
      }
      
      res.json(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
      res.status(500).json({ error: 'Failed to search tracks' });
    }
  });

  // Get AI-powered recommendations based on liked songs
  app.get("/api/tracks/recommendations", async (req, res) => {
    try {
      const token = await getSpotifyToken();
      const likedTracks = await storage.getLikedTracks();
      
      let recommendations = [];
      
      if (likedTracks.length > 0) {
        // Use Spotify's recommendation API for better results
        const seedTracks = likedTracks.slice(0, 5).map(t => t.id);
        const spotifyRecommendations = await getSpotifyRecommendations(token, seedTracks, 20);
        
        // Store and return recommendations
        for (const trackData of spotifyRecommendations) {
          let track = await storage.getTrack(trackData.id);
          if (!track) {
            track = await storage.createTrack(trackData);
          }
          recommendations.push(track);
        }
      } else {
        // Fall back to local ML-based recommendations
        recommendations = await storage.getRecommendationsBasedOnLiked();
      }
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  });

  // Create a new playlist
  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      res.json(playlist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error creating playlist:', error);
        res.status(500).json({ error: 'Failed to create playlist' });
      }
    }
  });

  // Get all playlists
  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getAllPlaylists();
      res.json(playlists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      res.status(500).json({ error: 'Failed to fetch playlists' });
    }
  });

  // Add track to playlist
  app.post("/api/playlists/:playlistId/tracks", async (req, res) => {
    try {
      const { playlistId } = req.params;
      const validatedData = insertPlaylistTrackSchema.parse({
        ...req.body,
        playlistId,
      });
      
      const playlistTrack = await storage.addTrackToPlaylist(validatedData);
      res.json(playlistTrack);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error('Error adding track to playlist:', error);
        res.status(500).json({ error: 'Failed to add track to playlist' });
      }
    }
  });

  // Get tracks from a playlist
  app.get("/api/playlists/:playlistId/tracks", async (req, res) => {
    try {
      const { playlistId } = req.params;
      const tracks = await storage.getPlaylistTracks(playlistId);
      res.json(tracks);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      res.status(500).json({ error: 'Failed to fetch playlist tracks' });
    }
  });

  // Create playlist from liked songs in Spotify
  app.post("/api/spotify/create-playlist", async (req, res) => {
    try {
      const { name, description, userToken } = req.body;
      
      if (!userToken) {
        res.status(400).json({ error: 'User token required for Spotify playlist creation' });
        return;
      }

      const likedTracks = await storage.getLikedTracks();
      if (likedTracks.length === 0) {
        res.status(400).json({ error: 'No liked tracks to create playlist from' });
        return;
      }

      // Create playlist in Spotify
      const spotifyPlaylist = await createSpotifyPlaylist(userToken, name, description);
      
      // Add tracks to the playlist
      const trackUris = likedTracks.map(track => `spotify:track:${track.id}`);
      await addTracksToSpotifyPlaylist(userToken, spotifyPlaylist.id, trackUris);
      
      // Store playlist in our system
      const playlist = await storage.createPlaylist({
        id: spotifyPlaylist.id,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description,
        image: spotifyPlaylist.images[0]?.url || null,
        spotifyUrl: spotifyPlaylist.external_urls.spotify,
        trackCount: likedTracks.length,
        isImported: false,
      });
      
      res.json(playlist);
    } catch (error) {
      console.error('Error creating Spotify playlist:', error);
      res.status(500).json({ error: 'Failed to create Spotify playlist' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
