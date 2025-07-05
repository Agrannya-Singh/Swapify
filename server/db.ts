import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://singhagrannya:FLT5NTP0mfM9bJvs@sandbox1.jyidath.mongodb.net/?retryWrites=true&w=majority&appName=SandBox1';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Track schema
const trackSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Use Spotify track ID as _id
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String, required: true },
  albumArt: { type: String, required: true },
  previewUrl: { type: String, default: null },
  duration: { type: Number, required: true },
  popularity: { type: Number, required: true },
  spotifyUrl: { type: String, required: true },
  year: { type: String, default: null },
}, { collection: 'tracks' });

// User interaction schema
const userInteractionSchema = new mongoose.Schema({
  trackId: { type: String, required: true },
  action: { type: String, required: true }, // 'like', 'skip', 'super_like'
  createdAt: { type: Date, default: Date.now },
}, { collection: 'user_interactions' });

// Playlist schema
const playlistSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Use Spotify playlist ID as _id
  name: { type: String, required: true },
  description: { type: String, default: null },
  image: { type: String, default: null },
  spotifyUrl: { type: String, required: true },
  trackCount: { type: Number, required: true },
  isImported: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { collection: 'playlists' });

// Playlist tracks schema
const playlistTrackSchema = new mongoose.Schema({
  playlistId: { type: String, required: true },
  trackId: { type: String, required: true },
  position: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
}, { collection: 'playlist_tracks' });

export const Track = mongoose.model('Track', trackSchema);
export const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);
export const Playlist = mongoose.model('Playlist', playlistSchema);
export const PlaylistTrack = mongoose.model('PlaylistTrack', playlistTrackSchema);

// MongoDB connection
let isConnected = false;

export const connectToMongoDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};