import { Music } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "Finding your next favorite song..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-4">
          <div className="w-16 h-16 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
          <Music className="w-6 h-6 text-spotify-green absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
}
