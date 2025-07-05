import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Play, Heart } from "lucide-react";
import { getLikedTracks } from "@/lib/spotify";
import { useAudio } from "@/hooks/use-audio";
import { Track } from "@shared/schema";

interface LikedSongsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LikedSongsDrawer({ isOpen, onClose }: LikedSongsDrawerProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const { data: likedTracks = [], isLoading } = useQuery({
    queryKey: ['/api/tracks/liked'],
    enabled: isOpen,
  });

  const { isPlaying, toggle } = useAudio(
    playingTrack ? likedTracks.find((t: Track) => t.id === playingTrack)?.previewUrl : undefined
  );

  const handlePlay = (trackId: string) => {
    if (playingTrack === trackId) {
      toggle();
    } else {
      setPlayingTrack(trackId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full bg-spotify-dark rounded-t-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Heart className="w-6 h-6 text-spotify-green" />
              <h3 className="text-2xl font-bold text-white">Liked Songs</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : likedTracks.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-muted text-lg">No liked songs yet</p>
              <p className="text-muted text-sm">Start swiping to discover music!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {likedTracks.map((track: Track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-3 bg-card-bg rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <img
                    src={track.albumArt || 'https://via.placeholder.com/48x48/1e1e1e/ffffff?text=No+Image'}
                    alt={`${track.album} cover`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold line-clamp-1">{track.title}</p>
                    <p className="text-muted text-sm line-clamp-1">{track.artist}</p>
                  </div>
                  <button
                    onClick={() => handlePlay(track.id)}
                    disabled={!track.previewUrl}
                    className="text-spotify-green hover:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {playingTrack === track.id && isPlaying ? (
                      <div className="w-4 h-4 bg-spotify-green rounded-full animate-pulse" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
