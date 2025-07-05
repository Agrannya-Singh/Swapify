import { apiRequest } from "./queryClient";
import type { Track } from "@shared/schema";

export async function getDiscoveryTracks(): Promise<Track[]> {
  const response = await apiRequest('GET', '/api/tracks/discover');
  return response.json();
}

export async function searchTracks(query: string): Promise<Track[]> {
  const response = await apiRequest('GET', `/api/tracks/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function getLikedTracks(): Promise<Track[]> {
  const response = await apiRequest('GET', '/api/tracks/liked');
  return response.json();
}

export async function recordInteraction(trackId: string, action: 'like' | 'skip' | 'super_like'): Promise<void> {
  await apiRequest('POST', '/api/interactions', {
    trackId,
    action,
  });
}

export async function getRecommendations(): Promise<Track[]> {
  const response = await apiRequest('GET', '/api/tracks/recommendations');
  return response.json();
}

export async function createPlaylist(playlist: any): Promise<any> {
  const response = await apiRequest('POST', '/api/playlists', playlist);
  return response.json();
}

export async function getAllPlaylists(): Promise<any[]> {
  const response = await apiRequest('GET', '/api/playlists');
  return response.json();
}

export async function addTrackToPlaylist(playlistId: string, trackId: string, position: number): Promise<any> {
  const response = await apiRequest('POST', `/api/playlists/${playlistId}/tracks`, {
    trackId,
    position,
  });
  return response.json();
}

export async function createSpotifyPlaylist(name: string, description: string, userToken: string): Promise<any> {
  const response = await apiRequest('POST', '/api/spotify/create-playlist', {
    name,
    description,
    userToken,
  });
  return response.json();
}
