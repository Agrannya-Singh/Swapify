import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Music, Heart, Settings, Sparkles, List, Shuffle } from "lucide-react";
import { MusicCard } from "@/components/music-card";
import { SwipeControls } from "@/components/swipe-controls";
import { LikedSongsDrawer } from "@/components/liked-songs-drawer";
import { LoadingOverlay } from "@/components/loading-overlay";
import { RecommendationsModal } from "@/components/recommendations-modal";
import { PlaylistModal } from "@/components/playlist-modal";
import { getDiscoveryTracks, recordInteraction } from "@/lib/spotify";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Track } from "@shared/schema";

export default function Home() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLikedSongsOpen, setIsLikedSongsOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState<'normal' | 'recommendations'>('normal');
  const [swipeHistory, setSwipeHistory] = useState<Array<{ track: Track; action: string }>>([]);
  const [showSkipIndicator, setShowSkipIndicator] = useState(false);
  const [showLikeIndicator, setShowLikeIndicator] = useState(false);

  const { data: tracks = [], isLoading, refetch } = useQuery<Track[]>({
    queryKey: ['/api/tracks/discover'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const recordInteractionMutation = useMutation({
    mutationFn: ({ trackId, action }: { trackId: string; action: 'like' | 'skip' | 'super_like' }) =>
      recordInteraction(trackId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tracks/liked'] });
    },
  });

  const currentTrack = tracks[currentTrackIndex];
  const nextTrack = tracks[currentTrackIndex + 1];

  const handleSwipeLeft = () => {
    if (!currentTrack) return;
    
    setShowSkipIndicator(true);
    setTimeout(() => setShowSkipIndicator(false), 300);
    
    recordInteractionMutation.mutate({ trackId: currentTrack.id, action: 'skip' });
    setSwipeHistory(prev => [...prev, { track: currentTrack, action: 'skip' }]);
    moveToNextTrack();
  };

  const handleSwipeRight = () => {
    if (!currentTrack) return;
    
    setShowLikeIndicator(true);
    setTimeout(() => setShowLikeIndicator(false), 300);
    
    recordInteractionMutation.mutate({ trackId: currentTrack.id, action: 'like' });
    setSwipeHistory(prev => [...prev, { track: currentTrack, action: 'like' }]);
    moveToNextTrack();
  };

  const handleSuperLike = () => {
    if (!currentTrack) return;
    
    setShowLikeIndicator(true);
    setTimeout(() => setShowLikeIndicator(false), 300);
    
    recordInteractionMutation.mutate({ trackId: currentTrack.id, action: 'super_like' });
    setSwipeHistory(prev => [...prev, { track: currentTrack, action: 'super_like' }]);
    moveToNextTrack();
  };

  const handleRewind = () => {
    if (swipeHistory.length > 0) {
      const lastAction = swipeHistory[swipeHistory.length - 1];
      setSwipeHistory(prev => prev.slice(0, -1));
      setCurrentTrackIndex(prev => Math.max(0, prev - 1));
    }
  };

  const handleAddToPlaylist = (track: Track) => {
    // For now, just show the playlist modal
    setIsPlaylistModalOpen(true);
  };

  const handleRecommendationSelect = (track: Track) => {
    // Add the recommended track to the current discovery queue
    setDiscoveryMode('recommendations');
    refetch();
  };

  const toggleDiscoveryMode = () => {
    if (discoveryMode === 'normal') {
      setDiscoveryMode('recommendations');
      setIsRecommendationsOpen(true);
    } else {
      setDiscoveryMode('normal');
      refetch();
    }
  };

  const moveToNextTrack = () => {
    setCurrentTrackIndex(prev => prev + 1);
    
    // Fetch more tracks if running low
    if (currentTrackIndex >= tracks.length - 3) {
      refetch();
    }
  };

  // Show loading if no tracks available
  if (isLoading || tracks.length === 0) {
    return <LoadingOverlay isVisible={true} />;
  }

  // Show end screen if no more tracks
  if (!currentTrack) {
    return (
      <div className="min-h-screen bg-spotify-gray flex items-center justify-center p-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-spotify-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No more tracks!</h2>
          <p className="text-muted mb-6">Check back later for more music discoveries</p>
          <button
            onClick={() => {
              setCurrentTrackIndex(0);
              refetch();
            }}
            className="bg-spotify-green text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition-colors"
          >
            Discover More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col bg-spotify-gray">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-spotify-dark/80 backdrop-blur-sm z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
            <Music className="text-white w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-white">Swipefy</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsRecommendationsOpen(true)}
            className="text-muted hover:text-accent-purple transition-colors relative"
            title="AI Recommendations"
          >
            <Sparkles className="w-5 h-5" />
            {discoveryMode === 'recommendations' && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent-purple rounded-full" />
            )}
          </button>
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="text-muted hover:text-accent-orange transition-colors"
            title="Playlists"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsLikedSongsOpen(true)}
            className="text-muted hover:text-spotify-green transition-colors"
            title="Liked Songs"
          >
            <Heart className="w-5 h-5" />
          </button>
          <button 
            onClick={toggleDiscoveryMode}
            className="text-muted hover:text-white transition-colors"
            title="Toggle Discovery Mode"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 relative">
        <div className="relative w-full max-w-sm h-[600px] card-stack">
          {/* Background Cards */}
          <div className="card-background" style={{ zIndex: 1 }} />
          <div className="card-background" style={{ zIndex: 2 }} />
          
          {/* Current Track Card */}
          <div className="main-card">
            <MusicCard
              track={currentTrack}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onAddToPlaylist={() => handleAddToPlaylist(currentTrack)}
            />
          </div>

          {/* Swipe Indicators */}
          <div 
            className={`absolute top-8 left-8 swipe-indicator ${showSkipIndicator ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: 4 }}
          >
            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg border-2 border-red-400">
              ✕ SKIP
            </div>
          </div>
          <div 
            className={`absolute top-8 right-8 swipe-indicator ${showLikeIndicator ? 'opacity-100' : 'opacity-0'}`}
            style={{ zIndex: 4 }}
          >
            <div className="bg-spotify-green text-white px-4 py-2 rounded-full font-semibold shadow-lg border-2 border-green-400">
              ♥ LIKE
            </div>
          </div>
        </div>
      </div>

      {/* Swipe Controls */}
      <SwipeControls
        onSkip={handleSwipeLeft}
        onLike={handleSwipeRight}
        onSuperLike={handleSuperLike}
        onRewind={handleRewind}
      />

      {/* Liked Songs Drawer */}
      <LikedSongsDrawer
        isOpen={isLikedSongsOpen}
        onClose={() => setIsLikedSongsOpen(false)}
      />

      {/* AI Recommendations Modal */}
      <RecommendationsModal
        isOpen={isRecommendationsOpen}
        onClose={() => setIsRecommendationsOpen(false)}
        onTrackSelect={handleRecommendationSelect}
      />

      {/* Playlist Management Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
      />

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={recordInteractionMutation.isPending} />
    </div>
  );
}
