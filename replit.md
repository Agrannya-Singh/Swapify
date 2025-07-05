# Spotify Music Discovery App

## Overview

This is a full-stack music discovery application built with React, Express, and Spotify API integration. The app provides a Tinder-like interface for discovering music tracks, allowing users to swipe through songs, like them, skip them, or super-like them. It features a modern UI with shadcn/ui components and includes audio preview functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Audio Handling**: Custom audio hooks for music preview playback

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Integration**: Spotify Web API for music data
- **Session Management**: In-memory storage with potential for database persistence

### Database Schema
- **tracks**: Stores Spotify track information (id, title, artist, album, artwork, etc.)
- **user_interactions**: Records user actions (like, skip, super_like) on tracks

## Key Components

### Frontend Components
- **MusicCard**: Displays track information with swipe functionality and audio controls
- **SwipeControls**: Button controls for user interactions (skip, like, super-like, rewind)
- **LikedSongsDrawer**: Sliding drawer showing user's liked tracks
- **LoadingOverlay**: Full-screen loading indicator during track fetching

### Backend Components
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **Spotify Integration**: Token management and API calls for track discovery
- **Routes**: RESTful API endpoints for tracks and user interactions

### Custom Hooks
- **useAudio**: Manages audio playback state and controls
- **useSwipe**: Handles touch/mouse swipe gestures with physics
- **useToast**: Toast notification system
- **useIsMobile**: Responsive design detection

## Data Flow

1. **Track Discovery**: 
   - Frontend requests tracks from `/api/tracks/discover`
   - Backend fetches Spotify access token using client credentials
   - Spotify API returns track data which is stored locally and returned to frontend

2. **User Interactions**:
   - User swipes or clicks action buttons
   - Frontend sends interaction to `/api/interactions`
   - Backend stores interaction in database
   - Frontend updates UI and moves to next track

3. **Audio Playback**:
   - Track preview URLs are played through HTML5 Audio API
   - Custom audio hook manages playback state and progress

4. **Liked Songs**:
   - Frontend requests liked tracks from `/api/tracks/liked`
   - Backend queries interactions table and returns corresponding tracks

## External Dependencies

### Spotify Integration
- **Client Credentials Flow**: Used for accessing Spotify's track search API
- **Environment Variables**: `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` required
- **API Endpoints**: Search tracks, get track details, audio previews

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle with PostgreSQL dialect

### UI Libraries
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component library

## Deployment Strategy

### Development
- **Dev Server**: Vite dev server with HMR for frontend
- **Backend**: tsx for TypeScript execution with hot reload
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment**: Single Node.js process serving both API and static files

### Environment Setup
- Spotify API credentials required
- PostgreSQL database URL needed
- All environment variables must be set for production

## Recent Changes

- July 05, 2025: Added advanced Spotify integration features:
  - AI-powered recommendations using Spotify's recommendation API
  - Playlist management with local storage and Spotify export
  - Enhanced music cards with "Open in Spotify" and "Add to Playlist" actions
  - ML-based recommendation engine as fallback for users without liked songs
  - User authentication flow for creating playlists directly in Spotify
  - Fixed card shadow display issues with proper z-index layering
  - Added multiple discovery modes (normal vs recommendations)
  - Enhanced UI with new modals for recommendations and playlist management

## Changelog

Changelog:
- July 05, 2025. Initial setup with basic swipe functionality
- July 05, 2025. Enhanced with advanced Spotify features and AI recommendations

## User Preferences

Preferred communication style: Simple, everyday language.