import { Heart, X, Star, RotateCcw } from "lucide-react";

interface SwipeControlsProps {
  onSkip: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onRewind: () => void;
}

export function SwipeControls({ onSkip, onLike, onSuperLike, onRewind }: SwipeControlsProps) {
  return (
    <div className="px-6 py-6 bg-spotify-dark/80 backdrop-blur-sm">
      <div className="flex items-center justify-center space-x-8">
        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200"
        >
          <X className="text-white w-6 h-6" />
        </button>

        {/* Super Like Button */}
        <button
          onClick={onSuperLike}
          className="w-12 h-12 bg-accent-purple hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200"
        >
          <Star className="text-white w-5 h-5" />
        </button>

        {/* Like Button */}
        <button
          onClick={onLike}
          className="w-14 h-14 bg-spotify-green hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200"
        >
          <Heart className="text-white w-6 h-6" />
        </button>

        {/* Rewind Button */}
        <button
          onClick={onRewind}
          className="w-12 h-12 bg-accent-orange hover:bg-orange-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200"
        >
          <RotateCcw className="text-white w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
