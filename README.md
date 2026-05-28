# 🎬 EpicStream

EpicStream is a premium, high-performance streaming discovery platform built with **React** and powered by the **TMDB API**. It features a modern, cinematic UI with advanced CSS optimizations, dynamic hero banners, and a seamless responsive experience.

![EpicStream Preview](https://via.placeholder.com/1280x720/050607/ff2633?text=EpicStream+Cinematic+Experience)

## ✨ Features

- **Dynamic Hero Banners:** Auto-sliding hero section with intelligent gradient overlays (120vh) and fixed-point blending for a seamless transition into content.
- **TMDB Integration:** Real-time data fetching for Trending, Popular, Top Rated, and Genre-specific content.
- **Comprehensive Details:** Deep-dive into Movies and TV Shows with cast credits, similar recommendations, and status tracking.
- **TV Series Management:** Interactive season and episode selection with detailed overview and thumbnails.
- **Advanced UI/UX:** 
  - Glassmorphism effects and CSS3 animations.
  - Stationary poster cards with adaptive centered text layouts.
  - Custom responsive breakpoints for mobile, tablet, and desktop.
- **Search & Discovery:** Explore a vast library of content with optimized search functionality.

## 🚀 Tech Stack

- **Framework:** [React.js](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** [React Router Dom](https://reactrouter.com/)
- **API:** [TMDB API](https://www.themoviedb.org/documentation/api)
- **Styling:** Custom Modern CSS (CSS Variables, Flexbox, Grid)

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/EpicStream.git
   cd EpicStream
   ```

2. **Setup API Keys:**
   Create a `.env` file in the `frontend` directory and add your TMDB API key:
   ```env
   VITE_TMDB_API_KEY=your_api_key_here
   ```

3. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

4. **Run the Application:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```text
EpicStream/
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (Navbar, Footer, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components (Home, MovieDetails, etc.)
│   │   ├── utils/           # Helper functions and API logic
│   │   └── stores/          # State management logic
│   ├── public/              # Static assets
│   └── index.html           # Entry point
└── README.md
```

## 🎨 UI Highlights

### Stationary Hero Layout
The Movie and TV details pages utilize a unique layout where the poster remains stationary while the title and metadata arrange themselves dynamically. The background gradient is locked to the viewport to ensure a perfect blend even when the synopsis expands.

```css
/* Optimized Gradient Blend */
linear-gradient(180deg, transparent 0%, rgba(5, 6, 7, 0.3) 40%, #050607 90vh);
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
Built with ❤️ by [Your Name/Team]
