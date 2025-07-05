import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, Music, Upload, ExternalLink } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Track, Playlist } from "@shared/schema";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlaylistModal({ isOpen, onClose }: PlaylistModalProps) {
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const { toast } = useToast();
  
  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
    enabled: isOpen,
  });

  const { data: likedTracks = [] } = useQuery<Track[]>({
    queryKey: ['/api/tracks/liked'],
    enabled: isOpen,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const response = await apiRequest('POST', '/api/playlists', {
        id: `swipefy_${Date.now()}`,
        name,
        description,
        spotifyUrl: `https://open.spotify.com/playlist/swipefy_${Date.now()}`,
        trackCount: 0,
        isImported: false,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setPlaylistName("");
      setPlaylistDescription("");
      setIsCreatingPlaylist(false);
      toast({ title: "Playlist created successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to create playlist", variant: "destructive" });
    },
  });

  const createSpotifyPlaylistMutation = useMutation({
    mutationFn: async ({ name, description, userToken }: { name: string; description: string; userToken: string }) => {
      const response = await apiRequest('POST', '/api/spotify/create-playlist', {
        name,
        description,
        userToken,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({ 
        title: "Spotify playlist created!", 
        description: "Your liked songs have been added to Spotify" 
      });
    },
    onError: () => {
      toast({ 
        title: "Failed to create Spotify playlist", 
        description: "Make sure you're logged into Spotify",
        variant: "destructive" 
      });
    },
  });

  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) return;
    createPlaylistMutation.mutate({ name: playlistName, description: playlistDescription });
  };

  const handleCreateSpotifyPlaylist = () => {
    if (likedTracks.length === 0) {
      toast({ 
        title: "No liked songs", 
        description: "Like some songs first to create a playlist",
        variant: "destructive" 
      });
      return;
    }

    const userToken = prompt("Please enter your Spotify access token:\n\n1. Go to https://developer.spotify.com/console/post-playlists/\n2. Click 'Get Token'\n3. Select 'playlist-modify-private' and 'playlist-modify-public'\n4. Copy the token");
    
    if (userToken) {
      createSpotifyPlaylistMutation.mutate({
        name: `Swipefy Liked Songs ${new Date().toLocaleDateString()}`,
        description: `Playlist created from Swipefy app on ${new Date().toLocaleDateString()}`,
        userToken,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-spotify-dark rounded-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Music className="w-6 h-6 text-spotify-green" />
              <h3 className="text-2xl font-bold text-white">Playlists</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Create New Playlist Section */}
          <div className="mb-6 p-4 bg-card-bg rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Create New Playlist</h4>
              <button
                onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
                className="text-spotify-green hover:text-green-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            {isCreatingPlaylist && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="w-full bg-spotify-gray text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className="w-full bg-spotify-gray text-white rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-spotify-green"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={!playlistName.trim() || createPlaylistMutation.isPending}
                    className="flex-1 bg-spotify-green text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {createPlaylistMutation.isPending ? 'Creating...' : 'Create Local Playlist'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export to Spotify Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-accent-purple/20 to-accent-orange/20 rounded-lg border border-accent-purple/30">
            <h4 className="text-lg font-semibold text-white mb-2">Export to Spotify</h4>
            <p className="text-muted text-sm mb-3">
              Create a Spotify playlist from your {likedTracks.length} liked songs
            </p>
            <button
              onClick={handleCreateSpotifyPlaylist}
              disabled={likedTracks.length === 0 || createSpotifyPlaylistMutation.isPending}
              className="flex items-center space-x-2 bg-spotify-green text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>
                {createSpotifyPlaylistMutation.isPending ? 'Creating...' : 'Export to Spotify'}
              </span>
            </button>
          </div>

          {/* Existing Playlists */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Your Playlists</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-16 h-16 text-muted mx-auto mb-4" />
                <p className="text-muted text-lg">No playlists yet</p>
                <p className="text-muted text-sm">Create your first playlist above!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center space-x-4 p-3 bg-card-bg rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-orange rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold line-clamp-1">{playlist.name}</p>
                      <p className="text-muted text-sm">
                        {playlist.trackCount} tracks
                        {playlist.isImported && " • Imported from Spotify"}
                      </p>
                    </div>
                    <button
                      onClick={() => window.open(playlist.spotifyUrl, '_blank')}
                      className="text-spotify-green hover:text-green-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}