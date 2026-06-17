# 🎬 EpicStream

EpicStream is a premium, high-performance streaming discovery platform built with **React** and powered by the **TMDB API**. It features a modern, cinematic UI with advanced CSS optimizations, dynamic hero banners, and a seamless responsive experience.

<p align="center"><img src="frontend/public/logo.png" width="500" alt="EpicStream Logo"></p>

## ✨ Features

- **Dynamic Hero Banners:** Auto-sliding hero section with intelligent gradient overlays and fixed-point blending for a seamless transition into content.
- **TMDB Integration:** Real-time data fetching for Trending, Popular, Top Rated, and Genre-specific content.
- **Curated Discovery:** Specialized rows for "TOP 10 Today", "Popular Shows", and "Currently Airing: Anime".
- **Comprehensive Details:** Deep-dive into Movies and TV Shows with cast credits, similar recommendations, and status tracking.
- **Video Integration:** Integrated trailer playback using `react-player`.
- **TV Series Management:** Interactive season and episode selection with detailed overviews and thumbnails.
- **Advanced UI/UX:** 
  - Glassmorphism effects and CSS3 animations.
  - Stationary poster cards with adaptive centered text layouts on detail pages.
  - Custom responsive breakpoints for mobile, tablet, and desktop.
- **Search & Discovery:** Explore a vast library of content with optimized search functionality.
- **Watchlist Ready:** Dedicated "My List" architecture, ready for personal collection management.

## 🚀 Tech Stack

- **Framework:** [React.js](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Routing:** [React Router Dom](https://reactrouter.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Media Player:** [React Player](https://www.npmjs.com/package/react-player)
- **Notifications:** [React Hot Toast](https://react-hot-toast.com/)
- **API:** [TMDB API](https://www.themoviedb.org/documentation/api)
- **Styling:** Custom Modern CSS (CSS Variables, Flexbox, Grid)

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ashishpatra/EpicStream.git
   cd EpicStream
   ```

2. **Setup API Keys:**
   Create a `.env` file in the `frontend` directory and add your TMDB API key:
   ```env
   VITE_TMDB_API_KEY=your_api_key_here
   ```

3. **Install Dependencies:**
   ```bash
   # Using the root package.json script
   npm install
   # Or manually
   cd frontend && npm install
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```text
EpicStream/
├── frontend/
│   ├── api/             # TMDB Proxy and API logic
│   ├── src/
│   │   ├── components/  # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── hooks/       # Custom React hooks (useGetTrendingContent, etc.)
│   │   ├── pages/       # Page components (Home, MovieDetails, etc.)
│   │   ├── stores/      # Zustand state management
│   │   ├── utils/       # Helper functions and TMDB formatting
│   │   └── App.jsx      # Main application routing
│   ├── public/          # Static assets
│   └── index.html       # Entry point
└── README.md
```

## 🎨 UI Highlights

### Stationary Hero Layout
The Movie and TV details pages utilize a unique layout where the poster remains stationary while the title and metadata arrange themselves dynamically. The background gradient is locked to the viewport to ensure a perfect blend even when the synopsis expands.

```css
/* Optimized Gradient Blend */
linear-gradient(180deg, transparent 0%, rgba(5, 6, 7, 0.3) 40%, #050607 90vh);
```

### Responsive Design
EpicStream is built with a mobile-first approach, ensuring that the cinematic experience translates perfectly from large 4K monitors down to mobile devices.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
Built with ❤️ by [Ashish Patra (90tash)](https://github.com/ashishpatra)
