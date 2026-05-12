export interface Movie {
  id: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  genres: string[];
  streamingUrl?: string;
  isAdSupported?: boolean;
  mediaType?: 'movie' | 'tv';
}

export interface StreamingService {
  id: string;
  name: string;
  url: string;
  logo: string;
  category: string;
  allowIframe?: boolean;
}

export interface WatchlistItem {
  id: string;
  title: string;
  url: string;
  source: string;
  addedAt: string;
  posterUrl?: string;
  contentType?: 'web' | 'video';
  genres?: string[];
  mediaType?: 'movie' | 'tv';
}
