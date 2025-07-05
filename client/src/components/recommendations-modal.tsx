import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Sparkles, TrendingUp, Play, Heart } from "lucide-react";
import { useAudio } from "@/hooks/use-audio";
import { Track } from "@shared/schema";

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect: (track: Track) => void;
}

export function RecommendationsModal({ isOpen, onClose, onTrackSelect }: RecommendationsModalProps) {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  
  const { data: recommendations = [], isLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks/recommendations'],
    enabled: isOpen,
  });

  const { isPlaying, toggle } = useAudio(
    playingTrack ? recommendations.find(t => t.id === playingTrack)?.previewUrl || undefined : undefined
  );

  const handlePlay = (trackId: string) => {
    if (playingTrack === trackId) {
      toggle();
    } else {
      setPlayingTrack(trackId);
    }
  };

  const handleSelectTrack = (track: Track) => {
    onTrackSelect(track);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-spotify-dark rounded-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-accent-purple to-accent-orange rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">AI Recommendations</h3>
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
              <div className="w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-muted text-lg">No recommendations yet</p>
              <p className="text-muted text-sm">Like some songs first to get personalized recommendations!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recommendations.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center space-x-4 p-4 bg-card-bg rounded-lg hover:bg-gray-700 transition-colors cursor-pointer group"
                  onClick={() => handleSelectTrack(track)}
                >
                  <img
                    src={track.albumArt || 'https://via.placeholder.com/56x56/1e1e1e/ffffff?text=No+Image'}
                    alt={`${track.album} cover`}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white font-semibold line-clamp-1 group-hover:text-spotify-green transition-colors">
                      {track.title}
                    </p>
                    <p className="text-muted text-sm line-clamp-1">{track.artist}</p>
                    <p className="text-muted text-xs line-clamp-1">{track.album}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-muted text-xs">
                      <TrendingUp className="w-3 h-3" />
                      <span>{track.popularity}%</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(track.id);
                      }}
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
                </div>
              ))}
            </div>
          )}
          
          {recommendations.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-muted text-sm">
                Click on any track to add it to your discovery queue
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}