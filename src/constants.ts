import { Movie } from "./types";

export const FEATURED_MOVIES: Movie[] = [
  {
    id: "1",
    title: "Interstellar",
    overview: "Un equipo de exploradores viaja a través de un agujero de gusano en el espacio en un intento por asegurar la supervivencia de la humanidad.",
    posterPath: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80",
    backdropPath: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80",
    releaseDate: "2014-11-07",
    voteAverage: 8.4,
    genres: ["Ciencia Ficción", "Drama", "Aventura"],
    streamingUrl: "https://example.com/streaming/interstellar"
  },
  {
    id: "2",
    title: "The Dark Knight",
    overview: "Cuando la amenaza conocida como el Joker surge de su pasado misterioso, causa estragos y caos en la gente de Gotham.",
    posterPath: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
    backdropPath: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1200&q=80",
    releaseDate: "2008-07-18",
    voteAverage: 8.5,
    genres: ["Acción", "Crimen", "Drama"],
    streamingUrl: "https://example.com/streaming/dark-knight"
  },
  {
    id: "3",
    title: "Inception",
    overview: "Un ladrón que roba secretos corporativos a través del uso de la tecnología de compartir sueños se le da la tarea inversa de plantar una idea.",
    posterPath: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&q=80",
    backdropPath: "https://images.unsplash.com/photo-1542204113-e93847e2124b?w=1200&q=80",
    releaseDate: "2010-07-16",
    voteAverage: 8.3,
    genres: ["Acción", "Ciencia Ficción", "Aventura"],
    streamingUrl: "https://example.com/streaming/inception"
  },
  {
    id: "4",
    title: "Arrival",
    overview: "Una lingüista es reclutada por el ejército para ayudar a comunicarse con extraterrestres que han llegado a la Tierra.",
    posterPath: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
    backdropPath: "https://images.unsplash.com/photo-1446941611759-21bd21b33db2?w=1200&q=80",
    releaseDate: "2016-11-11",
    voteAverage: 7.9,
    genres: ["Drama", "Ciencia Ficción", "Misterio"],
    streamingUrl: "https://example.com/streaming/arrival"
  }
];

export const GENRES = [
  "Acción",
  "Aventura",
  "Animación",
  "Comedia",
  "Crimen",
  "Documental",
  "Drama",
  "Familia",
  "Fantasía",
  "Historia",
  "Terror",
  "Música",
  "Misterio",
  "Romance",
  "Ciencia Ficción",
  "Película de TV",
  "Superhéroes",
  "Suspense",
  "Bélica",
  "Western"
];

export const STREAMING_SERVICES: any[] = [
  {
    id: "s1",
    name: "Netflix",
    url: "https://www.netflix.com",
    logo: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&q=80",
    category: "Global",
    allowIframe: false
  },
  {
    id: "s2",
    name: "Amazon Prime",
    url: "https://www.primevideo.com",
    logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80",
    category: "Global",
    allowIframe: false
  },
  {
    id: "s3",
    name: "Claro Video",
    url: "https://www.clarovideo.com",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80",
    category: "Latam",
    allowIframe: false
  },
  {
    id: "s4",
    name: "Disney+",
    url: "https://www.disneyplus.com",
    logo: "https://images.unsplash.com/photo-1601933973783-43cf8a7d4c5f?w=400&q=80",
    category: "Global",
    allowIframe: false
  }
];
