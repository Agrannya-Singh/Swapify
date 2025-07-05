import { Track } from "@shared/schema";
import { Play, Pause, Headphones, Clock, TrendingUp, ExternalLink, Plus, Music } from "lucide-react";
import { useAudio } from "@/hooks/use-audio";
import { useSwipe } from "@/hooks/use-swipe";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface MusicCardProps {
  track: Track;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onAddToPlaylist?: () => void;
  className?: string;
}

export function MusicCard({ track, onSwipeLeft, onSwipeRight, onAddToPlaylist, className = "" }: MusicCardProps) {
  const { isPlaying, progress, duration, toggle } = useAudio(track.previewUrl || undefined);
  const { toast } = useToast();
  const { isDragging, dragOffset, dragRotation, bindSwipe, bindDocument } = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    threshold: 100,
  });

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', bindDocument.onMouseMove);
      document.addEventListener('mouseup', bindDocument.onMouseUp);
      document.addEventListener('touchmove', bindDocument.onTouchMove);
      document.addEventListener('touchend', bindDocument.onTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', bindDocument.onMouseMove);
        document.removeEventListener('mouseup', bindDocument.onMouseUp);
        document.removeEventListener('touchmove', bindDocument.onTouchMove);
        document.removeEventListener('touchend', bindDocument.onTouchEnd);
      };
    }
  }, [isDragging, bindDocument]);

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className={`absolute inset-0 bg-card-bg rounded-2xl shadow-2xl cursor-grab ${
        isDragging ? 'cursor-grabbing' : ''
      } ${className}`}
      style={{
        transform: `translateX(${dragOffset}px) rotate(${dragRotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
      {...bindSwipe}
    >
      <div className="h-full flex flex-col">
        {/* Album Art Section */}
        <div className="relative h-80 rounded-t-2xl overflow-hidden bg-gray-800">
          {track.albumArt ? (
            <img
              src={track.albumArt}
              alt={`${track.album} cover`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = 'https://via.placeholder.com/400x400/2d2d2d/ffffff?text=No+Image';
              }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Music className="w-16 h-16 mx-auto mb-2" />
                <p className="text-sm">No Album Art</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            {track.previewUrl ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
                className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="text-white w-6 h-6" />
                ) : (
                  <Play className="text-white w-6 h-6 ml-1" />
                )}
              </button>
            ) : (
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center shadow-lg">
                <Headphones className="text-gray-400 w-6 h-6" />
              </div>
            )}
          </div>
          
          {/* Audio Progress Bar */}
          {track.previewUrl && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div
                  className="bg-spotify-green h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          {/* No Preview Indicator */}
          {!track.previewUrl && (
            <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-1 text-xs text-gray-400 flex items-center space-x-1">
              <Headphones className="w-3 h-3" />
              <span>No preview</span>
            </div>
          )}
        </div>

        {/* Track Information Section */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white leading-tight line-clamp-2">
              {track.title}
            </h2>
            <p className="text-muted text-lg font-medium">
              {track.artist}
            </p>
            <p className="text-muted text-sm">
              {track.album} {track.year && `• ${track.year}`}
            </p>
          </div>

          {/* Track Stats and Actions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-muted text-sm">
              <div className="flex items-center space-x-1">
                <Headphones className="w-4 h-4" />
                <span>{track.popularity}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{track.popularity}%</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(track.spotifyUrl, '_blank');
                }}
                className="flex items-center space-x-2 text-spotify-green hover:text-green-400 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Spotify</span>
              </button>
              
              {onAddToPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToPlaylist();
                    toast({ title: "Added to playlist!" });
                  }}
                  className="flex items-center space-x-2 text-accent-purple hover:text-purple-400 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Playlist</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
