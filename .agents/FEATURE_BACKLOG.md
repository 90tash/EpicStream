# 📋 EpicStream Feature Backlog & Roadmap

This document serves as a bucketed backlog for planned features, optimizations, and enhancement ideas to implement in future releases.

---

## 📺 TV Shows & Series Management

### 1. Dynamic Season-Specific Cast
- **Current State:** The series page uses TMDB's `aggregate_credits` to show major cast members across all seasons ranked by overall episode appearances.
- **Proposed Enhancement:** Dynamically update the Cast section whenever the user selects a different season from the season dropdown (`/tv/{id}/season/{season_number}/credits`).
- **Features:**
  - When viewing *Season 1*, show only Season 1 cast & guest stars.
  - When switching to *Season 2*, transition the cast carousel smoothly to Season 2's actors.
  - Add a toggle switch: `[ Season Cast | All-Time Main Cast ]` so users can switch views on demand.
  - Fallback to `aggregate_credits` if season-specific credits data is sparse or unavailable.

### 2. Episode-Level Guest Stars & Crew
- **Description:** Display guest stars, writers, and directors directly within the expanded episode cards.
- **Endpoint:** TMDB Season details already include `guest_stars` and `crew` arrays per episode.

### 3. Season Status & Air Dates Overview
- **Description:** Show season air status, premiere dates, and episode count badges on each season dropdown option.

---

## 🎬 Movies & Collections

### 1. Enhanced Franchise / Collection Explorer
- **Description:** Dedicated collection hub for film sagas (e.g., Marvel Cinematic Universe, Harry Potter, Star Wars) showing chronological and release-order paths.

### 2. Digital / Theatrical Release Timeline
- **Description:** Visual countdown or indicator for digital streaming availability for in-cinema movies.

---

## 🛠️ User Experience & Features

### 1. Custom Lists & Watchlist Enhancements
- **Description:** Custom list ordering (drag & drop), filter by genre/rating within personal lists, and shareable list export/import.

### 2. Video Player Enhancements
- **Description:** Quick keyboard shortcuts for playback speed, jump-to-next episode button directly in video player overlay.

---
