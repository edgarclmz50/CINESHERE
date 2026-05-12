import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Movie Extraction (based on user's Blog de Pelis analysis)
  app.post("/api/extract-link", async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Cache-Control': 'no-cache'
      };

      // 1. Fetch the movie page
      const response = await axios.get(url, { headers, timeout: 15000 });
      const html = response.data;
      const $ = cheerio.load(html);

      // Flexible search for the player iframe (barmonrey or others)
      let playerIframe = $('iframe[src*="barmonrey.com"]').attr('src') || 
                         $('iframe[src*="vidmoly"]').attr('src') ||
                         $('iframe[src*="streamwish"]').attr('src');
      
      if (!playerIframe) {
        const matches = html.match(/src=["'](https?:\/\/[^"']+\/player\/[^"']+)["']/);
        if (matches) playerIframe = matches[1];
      }

      if (!playerIframe) {
        return res.json({ 
          success: false, 
          message: "Protección detectada. Usa el Navegador Seguro (Botón Azul)." 
        });
      }

      if (playerIframe.startsWith('//')) playerIframe = 'https:' + playerIframe;

      // 2. Extract from player
      const playerResponse = await axios.get(playerIframe, {
        headers: { ...headers, 'Referer': url },
        timeout: 10000
      });

      // Extract specifically the .m3u8 link
      const streamMatch = playerResponse.data.match(/"file"\s*:\s*"(https?:\/\/[^"]+video\.m3u8[^"]*)"/) ||
                         playerResponse.data.match(/file:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/);

      if (streamMatch && streamMatch[1]) {
        // Enforce proxying for barmonrey to fix Referer issue
        const streamUrl = streamMatch[1];
        const needsProxy = streamUrl.includes('barmonrey') || streamUrl.includes('9bg.net') || streamUrl.includes('m3u8');
        
        return res.json({
          success: true,
          streamUrl: needsProxy ? `/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(playerIframe)}` : streamUrl,
          isProxied: needsProxy,
          title: $('h1.entry-title').text().trim() || $('h1').text().trim() || 'CineSphere Video',
          poster: $('.poster img').attr('src') || $('.wp-post-image').attr('src') || ''
        });
      }

      return res.json({ success: false, message: "No se encontró enlace directo. Intenta modo seguro." });
    } catch (error: any) {
      return res.status(500).json({ error: "Fallo en el motor de análisis" });
    }
  });

  // Proxy route to bypass Referer/Origin blocks
  app.options("/api/proxy", (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.sendStatus(204);
  });

  app.get("/api/proxy", async (req, res) => {
    const { url, referer } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).send("URL missing");

    try {
      const targetUrl = new URL(url);
      const headers: any = {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer || `${targetUrl.protocol}//${targetUrl.hostname}/`,
        'Origin': `${targetUrl.protocol}//${targetUrl.hostname}`,
        'Accept': '*/*',
        'Accept-Encoding': 'identity' // Prevent double compression issues
      };

      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      console.log(`[Proxy] Loading: ${url.substring(0, 50)}... Referer: ${headers.Referer}`);

      const response = await axios.get(url, {
        headers,
        responseType: 'arraybuffer',
        timeout: 30000,
        maxRedirects: 10,
        validateStatus: (status) => status >= 200 && status < 400
      });

      const responseContentType = response.headers['content-type'] as string | undefined;
      const isPlaylist = url.includes('.m3u8') || responseContentType?.includes('mpegurl') || responseContentType?.includes('application/x-mpegURL');

      if (isPlaylist) {
        let content = response.data.toString();
        const effectiveReferer = headers.Referer;
        
        // 1. Rewrite URI tags (used for encryption keys)
        content = content.replace(/URI=["']([^"']+)["']/g, (match: string, p1: string) => {
          if (p1.includes('/api/proxy')) return match;
          try {
            const absoluteUrl = new URL(p1, url).href;
            return `URI="/api/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(effectiveReferer)}"`;
          } catch (e) {
            return match;
          }
        });

        // 2. Rewrite relative path lines (segments/sub-playlists)
        content = content.replace(/^(?!#)(.+)$/gm, (line: string) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('http') || trimmed.includes('/api/proxy')) return line;
          try {
            const absoluteUrl = new URL(trimmed, url).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(effectiveReferer)}`;
          } catch (e) {
            return line;
          }
        });

        // 3. Rewrite absolute URLs (that are not already proxied)
        // We ensure we don't match URLs that are already part of a proxy URL
        content = content.replace(/(?<!url=)https?:\/\/[^\s\r\n"']+/g, (match: string) => {
          if (match.includes('/api/proxy')) return match;
          return `/api/proxy?url=${encodeURIComponent(match)}&referer=${encodeURIComponent(effectiveReferer)}`;
        });

        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.set('Access-Control-Allow-Headers', '*');
        return res.send(content);
      }

      // Proxy other content (segments .ts, images, etc)
      const contentRange = response.headers['content-range'];
      
      if (responseContentType) res.set('Content-Type', responseContentType);
      if (contentRange) res.set('Content-Range', contentRange);
      
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.set('Access-Control-Allow-Headers', '*');
      res.set('Cache-Control', 'public, max-age=3600');
      
      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error("[Proxy Error]", url, error.message);
      res.status(error.response?.status || 500).send("Proxy error: " + error.message);
    }
  });

  // NEW: Catalog Scraper API
  app.get("/api/catalog/latest", async (req, res) => {
    try {
      const response = await axios.get("https://blogdepelis.net/", {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000
      });
      const $ = cheerio.load(response.data);
      const movies: any[] = [];

      $('.item').each((i, el) => {
        if (i > 15) return;
        const item = $(el);
        movies.push({
          id: `ext-${i}`,
          title: item.find('.title').text().trim(),
          posterPath: item.find('img').attr('src'),
          backdropPath: item.find('img').attr('src'),
          streamingUrl: item.find('a').attr('href'),
          voteAverage: parseFloat(item.find('.rating').text()) || 7.5,
          genres: ["Estreno"]
        });
      });

      res.json(movies);
    } catch (e) {
      res.status(500).json({ error: "Error cargando catálogo" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
