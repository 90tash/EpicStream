# 📺 Server Screen Wake Lock Audit & Implementation Plan

## 📌 Background & Problem

During video playback, some streaming servers honor the device's display timeout rules (keeping the screen awake), while others let the screen turn off mid-playback according to normal system sleep timers.

### Why this happens:
1. **Iframe Permissions Policy:** Modern browsers block cross-origin `<iframe>` elements from calling `navigator.wakeLock.request('screen')` unless explicitly permitted with `allow="screen-wake-lock"`. *(Now enabled in `WatchPage.jsx`)*
2. **Audio/Video Pipeline Differences:** Native HTML5 `<video>` tags playing unmuted audio automatically inhibit OS sleep via browser media heuristics. Servers using nested iframes, custom blob/MSE players, canvas renderers, or delayed audio routing often fail to trigger this heuristic.
3. **Provider-Specific Behavior:** Some embeds do not implement the Wake Lock API at all or rely on native fullscreen to prevent sleep.

---

## 🧪 Server Testing Checklist

Use this table to record test results across different servers on your device.
*Test conditions:* Play video in normal (non-fullscreen) mode for longer than your system's sleep timer (e.g. 1–2 minutes) without touching the mouse or screen.

| Server ID | Server Name | Contains Ads | Keeps Screen Awake? (Yes / No) | Notes / Observations |
| :--- | :--- | :---: | :---: | :--- |
| `zxc` | Titan (Fast/HD) | No | [ ] | |
| `chillflix` / `chill` | Chill (Best - Server) | No | [ ] | |
| `vidlove` | Atlas (HD-Server) | No | [ ] | |
| `vidy` | Nova (Fast/HD) | No | [ ] | |
| `bingr` | Bingr (Hot/Best) | No | [ ] | |
| `vidstuck` / `star` | Star (Multi/Best) | No | [ ] | |
| `modiplay` | Ashoka (Indian-Server) | No | [ ] | |
| `vidrift` / `rift` | Rift (Best-Server) | No | [ ] | |
| `cinemaos` / `ninja` | Ninja (Fast/HD) | No | [ ] | |
| `vidbolt` | Eclipse (Multi-Server) | No | [ ] | |
| `peachify` | Peach (HD/Multi) | No | [ ] | |
| `vidnest` | Optimus (Multi-Server) | No | [ ] | |
| `zen` | Zen (Fast-Server) | No | [ ] | |
| `viduki_multi` | Goku (Multi-Server) | No | [ ] | |
| `vidfast` | Ghost (Fast/HD) | No | [ ] | |
| `nxsha` | Vayu (Best-Server) | Yes | [ ] | |
| `vidlink` | Vortex (Single-Server) | No | [ ] | |
| `vsembed` | Rocky (Fast-Server) | No | [ ] | |
| `mapple` | Rogue (4k) | No | [ ] | |
| `vidzee` | Neo (Multi/HD) | No | [ ] | |

---

## 🛠️ Next Steps / Targeted Fix Plan

Once the servers requiring screen lock are identified from testing:

1. **Tag identified servers in `WATCH_PROVIDERS` or create an array:**
   ```js
   const SERVERS_REQUIRING_WAKE_LOCK = new Set([
       "zen",
       "vsembed",
       // Add IDs of servers that failed the sleep test
   ]);
   ```

2. **Acquire top-level Screen Wake Lock conditionally in `WatchPage.jsx`:**
   ```js
   useEffect(() => {
       let wakeLockSentinel = null;

       const requestLock = async () => {
           if ("wakeLock" in navigator && SERVERS_REQUIRING_WAKE_LOCK.has(selectedProvider)) {
               try {
                   wakeLockSentinel = await navigator.wakeLock.request("screen");
               } catch (err) {
                   console.warn("Screen Wake Lock request failed:", err);
               }
           }
       };

       requestLock();

       // Re-acquire lock if tab switches back into visibility
       const handleVisibilityChange = () => {
           if (document.visibilityState === "visible") {
               requestLock();
           }
       };
       document.addEventListener("visibilitychange", handleVisibilityChange);

       return () => {
           document.removeEventListener("visibilitychange", handleVisibilityChange);
           if (wakeLockSentinel) {
               wakeLockSentinel.release().catch(() => {});
           }
       };
   }, [selectedProvider]);
   ```
