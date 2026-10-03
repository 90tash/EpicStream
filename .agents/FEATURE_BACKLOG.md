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

## 🔌 Metadata & API Providers (Backup & Failover)

### 1. TheTVDB (TVDB v4) Integration as Backup Provider
- **Status:** Backlog / Deferred
- **API Key:** `b4d8e69f-6295-4c15-9b8c-390df5812061`
- **Authentication Requirement:** TheTVDB v4 API endpoint (`https://api4.thetvdb.com/v4/login`) requires user developer keys to authenticate with both `apikey` and a subscriber/project `pin`:
  ```json
  {
    "apikey": "b4d8e69f-6295-4c15-9b8c-390df5812061",
    "pin": "<SUBSCRIBER_OR_PROJECT_PIN>"
  }
  ```
- **How to retrieve PIN:**
  1. Log into your account at [TheTVDB.com](https://thetvdb.com/).
  2. Click the user menu in the top-right corner and select **Dashboard**.
  3. Go to **API Keys** or **Subscription**.
  4. Your unique **PIN** (or Subscriber PIN / Project PIN) is displayed next to or under the API key.
- **Intended Use Case:**
  - Additional fallback for TV show episode lists, air dates, series artwork, and episode images when TMDB or MDBList is missing specific regional metadata or high-res assets.

---

