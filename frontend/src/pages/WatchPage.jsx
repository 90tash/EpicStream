/* eslint-disable react/prop-types */
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
    Star,
    Play,
    Pause,
    Volume1,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    RotateCcw,
    RotateCw,
    Subtitles,
    Headphones,
    PictureInPicture,
    Layout,
    Gauge,
    Sliders,
    SkipBack,
    SkipForward,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    formatMediaType,
    getTitle,
    imageUrl,
    tmdbFetch,
    tmdbGetImages,
    tmdbGetSeason,
} from "../utils/tmdb";
import { addToHistory, updateHistoryProgress, getHistory } from "../utils/history";
import { isAnime } from "../utils/anilist";
import "./watchPage.css";

const getPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
};

const formatRuntime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s]
        .map((value) => (value < 10 ? `0${value}` : `${value}`))
        .filter((value, index) => value !== "00" || index > 0)
        .join(":");
};

// Premium HLS Video Player Component with Custom Controls
const HlsPlayer = ({
    src,
    poster,
    savedProgress,
    onProgress,
    title,
    mediaType,
    season,
    episode,
    previousEpisode,
    nextEpisode,
    onNavigateEpisode,
    activeStream,
    streams,
    setActiveStream,
    details,
    isTheaterMode,
    setIsTheaterMode,
    titleLogo,
}) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const hlsRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const navigate = useNavigate();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    
    // Subtitles & Audio state
    const [subtitles, setSubtitles] = useState([]);
    const [activeSubtitle, setActiveSubtitle] = useState(-1);
    const [audioTracks, setAudioTracks] = useState([]);
    const [activeAudio, setActiveAudio] = useState(0);
    
    // Custom controls state
    const [activeMenu, setActiveMenu] = useState(null); // 'speed' | 'subtitles' | 'audio' | 'quality'
    const [isBuffering, setIsBuffering] = useState(false);
    const [bufferedPercent, setBufferedPercent] = useState(0);
    const [showFloatingInfo, setShowFloatingInfo] = useState(true);

    // Fade floating info after 4.5 seconds
    useEffect(() => {
        setShowFloatingInfo(true);
        const timer = setTimeout(() => {
            setShowFloatingInfo(false);
        }, 4500);
        return () => clearTimeout(timer);
    }, [src]);

    // Load Video stream
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setBufferedPercent(0);
        setSubtitles([]);
        setActiveSubtitle(-1);
        setAudioTracks([]);
        setActiveAudio(0);

        let hlsInstance = null;

        const loadVideo = () => {
            const isHls = src.includes(".m3u8") || src.includes("m3u8-proxy");

            if (isHls) {
                if (Hls.isSupported()) {
                    hlsInstance = new Hls({
                        maxMaxBufferLength: 30,
                        enableWorker: true,
                    });
                    hlsInstance.loadSource(src);
                    hlsInstance.attachMedia(video);
                    hlsRef.current = hlsInstance;

                    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                        if (savedProgress > 0) {
                            video.currentTime = savedProgress;
                        }
                        video.play()
                            .then(() => setIsPlaying(true))
                            .catch(() => setIsPlaying(false));
                    });

                    hlsInstance.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
                        setSubtitles(data.subtitleTracks || []);
                    });

                    hlsInstance.on(Hls.Events.AUDIO_TRACKS_UPDATED, (event, data) => {
                        setAudioTracks(data.audioTracks || []);
                    });

                    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    hlsInstance.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    hlsInstance.recoverMediaError();
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                    video.addEventListener("loadedmetadata", () => {
                        if (savedProgress > 0) {
                            video.currentTime = savedProgress;
                        }
                        video.play()
                            .then(() => setIsPlaying(true))
                            .catch(() => setIsPlaying(false));
                    });
                }
            } else {
                video.src = src;
                video.addEventListener("loadedmetadata", () => {
                    if (savedProgress > 0) {
                        video.currentTime = savedProgress;
                    }
                    video.play()
                        .then(() => setIsPlaying(true))
                        .catch(() => setIsPlaying(false));
                });
            }
        };

        if (typeof Hls === "undefined") {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
            script.async = true;
            script.onload = loadVideo;
            document.body.appendChild(script);
        } else {
            loadVideo();
        }

        return () => {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        };
    }, [src, savedProgress]);

    // Handle time updates & native playback state sync
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            if (video.duration) {
                setDuration(video.duration);
                const percentage = Math.round((video.currentTime / video.duration) * 100);
                onProgress({
                    currentTime: video.currentTime,
                    duration: video.duration,
                    percentage,
                });
            }
        };

        const handleDurationChange = () => {
            setDuration(video.duration);
        };

        const handleProgress = () => {
            if (video.buffered.length > 0 && video.duration) {
                let bufferedEnd = 0;
                for (let i = 0; i < video.buffered.length; i++) {
                    if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) >= video.currentTime) {
                        bufferedEnd = video.buffered.end(i);
                        break;
                    }
                }
                const pct = (bufferedEnd / video.duration) * 100;
                setBufferedPercent(pct);
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsBuffering(true);
        const handlePlaying = () => setIsBuffering(false);
        const handleSeeked = () => setIsBuffering(false);

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("durationchange", handleDurationChange);
        video.addEventListener("progress", handleProgress);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("playing", handlePlaying);
        video.addEventListener("seeked", handleSeeked);

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("durationchange", handleDurationChange);
            video.removeEventListener("progress", handleProgress);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("playing", handlePlaying);
            video.removeEventListener("seeked", handleSeeked);
        };
    }, [onProgress, src]);

    // Handle controls timeout visibility
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setActiveMenu(null);
            }, 3500); // Hide after 3.5s inactivity
        }
    };

    useEffect(() => {
        if (!isPlaying) {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        }
    }, [isPlaying]);

    // Close menus when controls fade
    useEffect(() => {
        if (!showControls) {
            setActiveMenu(null);
        }
    }, [showControls]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            const video = videoRef.current;
            if (!video) return;

            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === "input" || activeTag === "textarea") return;

            switch (e.key.toLowerCase()) {
                case " ":
                case "k":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "f":
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case "m":
                    e.preventDefault();
                    toggleMute();
                    break;
                case "arrowleft":
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case "arrowright":
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
                    break;
                case "arrowup":
                    e.preventDefault();
                    setVolume((prev) => {
                        const newVol = Math.min(1, prev + 0.1);
                        video.volume = newVol;
                        video.muted = false;
                        setIsMuted(false);
                        return newVol;
                    });
                    break;
                case "arrowdown":
                    e.preventDefault();
                    setVolume((prev) => {
                        const newVol = Math.max(0, prev - 0.1);
                        video.volume = newVol;
                        if (newVol === 0) {
                            video.muted = true;
                            setIsMuted(true);
                        } else {
                            video.muted = false;
                            setIsMuted(false);
                        }
                        return newVol;
                    });
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isPlaying, isMuted, volume]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        } else {
            video.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        const newMuted = !video.muted;
        video.muted = newMuted;
        setIsMuted(newMuted);
    };

    const handleVolumeChange = (e) => {
        const video = videoRef.current;
        if (!video) return;

        const newVol = parseFloat(e.target.value);
        video.volume = newVol;
        setVolume(newVol);
        if (newVol === 0) {
            video.muted = true;
            setIsMuted(true);
        } else {
            video.muted = false;
            setIsMuted(false);
        }
    };

    const handleScrub = (e) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleSpeedChange = (rate) => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = rate;
        setPlaybackRate(rate);
        setActiveMenu(null);
    };

    const handleSubtitleChange = (index) => {
        if (hlsRef.current) {
            hlsRef.current.subtitleTrack = index;
            setActiveSubtitle(index);
        } else {
            const video = videoRef.current;
            if (video && video.textTracks) {
                for (let i = 0; i < video.textTracks.length; i++) {
                    video.textTracks[i].mode = i === index ? "showing" : "disabled";
                }
                setActiveSubtitle(index);
            }
        }
        setActiveMenu(null);
    };

    const handleAudioChange = (index) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = index;
            setActiveAudio(index);
        }
        setActiveMenu(null);
    };

    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch((err) => {
                console.error("Error enabling fullscreen:", err);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const togglePip = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (video !== document.pictureInPictureElement) {
                await video.requestPictureInPicture();
            } else {
                await document.exitPictureInPicture();
            }
        } catch (err) {
            console.error("Picture-in-Picture failed:", err);
        }
    };

    const toggleMenu = (menuName) => {
        setActiveMenu((prev) => (prev === menuName ? null : menuName));
    };

    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return <VolumeX size={18} />;
        if (volume < 0.5) return <Volume1 size={18} />;
        return <Volume2 size={18} />;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const volumePercent = isMuted ? 0 : volume * 100;

    return (
        <div
            ref={containerRef}
            className={`epic-player-container ${showControls ? "controls-visible" : "controls-hidden"}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                className="epic-player-video"
                poster={poster}
                playsInline
                crossOrigin="anonymous"
            />

            {/* Top Overlay */}
            <div className="epic-player-top-bar" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="epic-player-btn accent-hover back-btn"
                    onClick={() => navigate(-1)}
                    title="Go Back"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="epic-player-top-title-group">
                    <span className="epic-player-top-title">{title}</span>
                    {mediaType === "tv" && (
                        <span className="epic-player-top-subtitle">
                            Season {season}, Episode {episode}
                        </span>
                    )}
                </div>
                <div className="epic-player-top-badges">
                    {activeStream && (
                        <>
                            <span className="epic-player-badge quality">
                                {activeStream.quality}
                            </span>
                            <span className="epic-player-badge server">
                                {activeStream.provider}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Center Loading Buffer Indicator */}
            {isBuffering && (
                <div className="epic-player-center-loading" onClick={(e) => e.stopPropagation()}>
                    <div className="epic-player-loader-spinner" />
                    <span className="epic-player-loader-text">Buffering...</span>
                </div>
            )}

            {/* Center Big Play Button Overlay */}
            <div
                className={`epic-player-center-play ${!isPlaying ? "paused" : ""}`}
                onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                }}
            >
                {!isPlaying ? <Play size={28} fill="#fff" style={{ marginLeft: 3 }} /> : <Pause size={28} fill="#fff" />}
            </div>

            {/* Pause Info Overlay */}
            {!isPlaying && showControls && (
                <div className="epic-player-pause-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="epic-player-pause-card">
                        {titleLogo ? (
                            <img
                                src={imageUrl(titleLogo, "w500")}
                                alt={title}
                                className="epic-player-pause-logo"
                            />
                        ) : (
                            <h2 className="epic-player-pause-title">{title}</h2>
                        )}
                        <p className="epic-player-pause-summary">
                            {details?.overview || "No summary available."}
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Information Panel on load */}
            {showFloatingInfo && (
                <div className="epic-player-floating-info" onClick={(e) => e.stopPropagation()}>
                    {details?.poster_path && (
                        <img 
                            src={imageUrl(details.poster_path, "w92")} 
                            alt="" 
                            className="epic-player-floating-poster"
                        />
                    )}
                    <div className="epic-player-floating-copy">
                        <span className="epic-player-floating-badge">Now Playing</span>
                        <h4>{title}</h4>
                        {mediaType === "tv" && <h5>Season {season}, Episode {episode}</h5>}
                        <p>{details?.overview || "Enjoy the show!"}</p>
                    </div>
                </div>
            )}

            {/* Bottom Controls Bar */}
            <div
                className="epic-player-controls"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Metadata Row */}
                {showControls && (
                    <div className="epic-player-meta-row">
                        <span className="epic-player-meta-title">{title}</span>
                        <span className="epic-player-meta-dot" />
                        {details && (
                            <>
                                {details.release_date && (
                                    <>
                                        <span>{new Date(details.release_date).getFullYear()}</span>
                                        <span className="epic-player-meta-dot" />
                                    </>
                                )}
                                {details.first_air_date && (
                                    <>
                                        <span>{new Date(details.first_air_date).getFullYear()}</span>
                                        <span className="epic-player-meta-dot" />
                                    </>
                                )}
                                {details.vote_average ? (
                                    <>
                                        <span className="rating-pill">
                                            <Star size={12} fill="currentColor" style={{ marginRight: 3 }} />
                                            {details.vote_average.toFixed(1)}
                                        </span>
                                        <span className="epic-player-meta-dot" />
                                    </>
                                ) : null}
                            </>
                        )}
                        <span>{formatTime(duration)}</span>
                    </div>
                )}

                {/* Custom Progress Scrubber */}
                <div className="epic-player-scrub-row">
                    <div className="epic-player-scrub-container">
                        <div className="epic-player-scrub-track-bg" />
                        <div
                            className="epic-player-scrub-track-buffer"
                            style={{ width: `${bufferedPercent}%` }}
                        />
                        <div
                            className="epic-player-scrub-track-played"
                            style={{ width: `${progressPercent}%` }}
                        />
                        <input
                            type="range"
                            className="epic-player-slider"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleScrub}
                        />
                    </div>
                </div>

                {/* Buttons Control Panel */}
                <div className="epic-player-buttons-row">
                    {/* Left Actions */}
                    <div className="epic-player-group">
                        <button
                            type="button"
                            className="epic-player-btn accent-hover"
                            onClick={togglePlay}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>

                        {/* Prev Episode button (Series Mode only) */}
                        {mediaType === "tv" && (
                            <>
                                <button
                                    type="button"
                                    className="epic-player-btn accent-hover"
                                    disabled={!previousEpisode}
                                    onClick={() => previousEpisode && onNavigateEpisode(previousEpisode.episode_number)}
                                    title="Previous Episode"
                                >
                                    <SkipBack size={16} fill="currentColor" />
                                </button>
                                <button
                                    type="button"
                                    className="epic-player-btn accent-hover"
                                    disabled={!nextEpisode}
                                    onClick={() => nextEpisode && onNavigateEpisode(nextEpisode.episode_number)}
                                    title="Next Episode"
                                >
                                    <SkipForward size={16} fill="currentColor" />
                                </button>
                            </>
                        )}

                        {/* Rewind / Forward 10s */}
                        <button
                            type="button"
                            className="epic-player-btn accent-hover"
                            onClick={() => {
                                const video = videoRef.current;
                                if (video) video.currentTime = Math.max(0, video.currentTime - 10);
                            }}
                            title="Rewind 10s"
                        >
                            <RotateCcw size={17} />
                        </button>
                        <button
                            type="button"
                            className="epic-player-btn accent-hover"
                            onClick={() => {
                                const video = videoRef.current;
                                if (video) video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
                            }}
                            title="Forward 10s"
                        >
                            <RotateCw size={17} />
                        </button>

                        {/* Volume controls */}
                        <div className="epic-player-volume-container">
                            <button
                                type="button"
                                className="epic-player-btn accent-hover"
                                onClick={toggleMute}
                            >
                                {getVolumeIcon()}
                            </button>
                            <input
                                type="range"
                                className="epic-player-volume-slider"
                                min={0}
                                max={1}
                                step={0.05}
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                style={{
                                    background: `linear-gradient(to right, #fff ${volumePercent}%, rgba(255, 255, 255, 0.2) ${volumePercent}%)`
                                }}
                            />
                        </div>

                        <span className="epic-player-time">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Right Actions */}
                    <div className="epic-player-group">
                        {/* Subtitle track Selector */}
                        <div className="epic-player-settings-wrapper">
                            <button
                                type="button"
                                className={`epic-player-btn ${activeMenu === "subtitles" ? "accent-hover active" : ""}`}
                                onClick={() => toggleMenu("subtitles")}
                                title="Subtitles"
                            >
                                <Subtitles size={18} />
                            </button>
                            {activeMenu === "subtitles" && (
                                <div className="epic-player-menu">
                                    <span className="epic-player-menu-title">Subtitles</span>
                                    <button
                                        type="button"
                                        className={`epic-player-menu-item ${activeSubtitle === -1 ? "active" : ""}`}
                                        onClick={() => handleSubtitleChange(-1)}
                                    >
                                        Off
                                    </button>
                                    {subtitles.map((track, idx) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            className={`epic-player-menu-item ${activeSubtitle === idx ? "active" : ""}`}
                                            onClick={() => handleSubtitleChange(idx)}
                                        >
                                            {track.name || track.label || `Track ${idx + 1}`}
                                        </button>
                                    ))}
                                    {subtitles.length === 0 && (
                                        <span className="epic-player-menu-title" style={{textTransform:'none', color:'#64748b'}}>None available</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Audio track Selector */}
                        <div className="epic-player-settings-wrapper">
                            <button
                                type="button"
                                className={`epic-player-btn ${activeMenu === "audio" ? "accent-hover active" : ""}`}
                                onClick={() => toggleMenu("audio")}
                                title="Audio Tracks"
                            >
                                <Headphones size={18} />
                            </button>
                            {activeMenu === "audio" && (
                                <div className="epic-player-menu">
                                    <span className="epic-player-menu-title">Audio Tracks</span>
                                    {audioTracks.map((track, idx) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            className={`epic-player-menu-item ${activeAudio === idx ? "active" : ""}`}
                                            onClick={() => handleAudioChange(idx)}
                                        >
                                            {track.name || track.label || `Track ${idx + 1}`}
                                        </button>
                                    ))}
                                    {audioTracks.length === 0 && (
                                        <span className="epic-player-menu-title" style={{textTransform:'none', color:'#64748b'}}>Default Track</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Playback speed selector */}
                        <div className="epic-player-settings-wrapper">
                            <button
                                type="button"
                                className={`epic-player-btn ${activeMenu === "speed" ? "accent-hover active" : ""}`}
                                onClick={() => toggleMenu("speed")}
                                title="Playback Speed"
                            >
                                <Gauge size={18} />
                            </button>

                            {activeMenu === "speed" && (
                                <div className="epic-player-menu">
                                    <span className="epic-player-menu-title">Speed</span>
                                    {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                                        <button
                                            type="button"
                                            key={rate}
                                            className={`epic-player-menu-item ${playbackRate === rate ? "active" : ""}`}
                                            onClick={() => handleSpeedChange(rate)}
                                        >
                                            {rate === 1 ? "Normal" : `${rate}x`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quality & Server selector */}
                        <div className="epic-player-settings-wrapper">
                            <button
                                type="button"
                                className={`epic-player-btn ${activeMenu === "quality" ? "accent-hover active" : ""}`}
                                onClick={() => toggleMenu("quality")}
                                title="Server / Quality"
                            >
                                <Sliders size={17} />
                            </button>

                            {activeMenu === "quality" && (
                                <div className="epic-player-menu quality-menu" style={{ width: 174 }}>
                                    <span className="epic-player-menu-title">Server & Quality</span>
                                    {streams.map((stream, idx) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            className={`epic-player-menu-item ${activeStream?.url === stream.url ? "active" : ""}`}
                                            onClick={() => {
                                                setActiveStream(stream);
                                                setActiveMenu(null);
                                            }}
                                        >
                                            {stream.title || stream.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Picture in Picture */}
                        <button
                            type="button"
                            className="epic-player-btn accent-hover"
                            onClick={togglePip}
                            title="Picture-in-Picture"
                        >
                            <PictureInPicture size={18} />
                        </button>

                        {/* Theater Mode */}
                        <button
                            type="button"
                            className={`epic-player-btn accent-hover ${isTheaterMode ? "active" : ""}`}
                            onClick={() => setIsTheaterMode(!isTheaterMode)}
                            title="Theater Mode"
                            style={{ color: isTheaterMode ? "var(--accent)" : "" }}
                        >
                            <Layout size={18} />
                        </button>

                        {/* Fullscreen */}
                        <button
                            type="button"
                            className="epic-player-btn accent-hover"
                            onClick={toggleFullscreen}
                            title="Fullscreen"
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WatchPage = () => {
    const { type, id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const episodeFilterRef = useRef(null);

    const mediaType = type === "tv" ? "tv" : "movie";
    const season = getPositiveInt(searchParams.get("season"), 1);
    const episode = getPositiveInt(searchParams.get("episode"), 1);

    const [details, setDetails] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
    const [error, setError] = useState("");
    const [episodeQuery, setEpisodeQuery] = useState("");
    const [isSeasonMenuOpen, setIsSeasonMenuOpen] = useState(false);
    
    // Direct stream list and active stream source
    const [streams, setStreams] = useState([]);
    const [activeStream, setActiveStream] = useState(null);
    const [isStreamsLoading, setIsStreamsLoading] = useState(false);

    // Layout configuration
    const [isTheaterMode, setIsTheaterMode] = useState(false);

    const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
    const providerMenuRef = useRef(null);
    const seasonMenuRef = useRef(null);
    const [openUpward, setOpenUpward] = useState(false);
    const [titleLogo, setTitleLogo] = useState(null);
    const [logoError, setLogoError] = useState(false);

    const title = getTitle(details);
    const anime = mediaType === "tv" && isAnime(details);

    const savedProgress = useMemo(() => {
        const historyItem = getHistory().find(h => h.id === Number(id));
        if (mediaType === "tv") {
            const isSameEpisode = historyItem?.season === season && historyItem?.episode === episode;
            return isSameEpisode ? Math.floor(historyItem.currentTime || 0) : 0;
        }
        return Math.floor(historyItem?.currentTime || 0);
    }, [id, mediaType, season, episode]);

    const seasonsList = useMemo(
        () => details?.seasons?.filter((item) => item.season_number > 0) || [],
        [details]
    );

    const currentSeason = seasonsList.find((item) => item.season_number === season);
    const currentEpisode = episodes.find((item) => item.episode_number === episode);
    const activeEpisodeIndex = episodes.findIndex((item) => item.episode_number === episode);
    const previousEpisode = activeEpisodeIndex > 0 ? episodes[activeEpisodeIndex - 1] : null;
    const nextEpisode = activeEpisodeIndex > -1 && activeEpisodeIndex < episodes.length - 1
        ? episodes[activeEpisodeIndex + 1]
        : null;

    const filteredEpisodes = useMemo(() => {
        const query = episodeQuery.trim().toLowerCase();
        if (!query) return episodes;

        return episodes.filter((item) => (
            item.name?.toLowerCase().includes(query) ||
            String(item.episode_number).includes(query)
        ));
    }, [episodeQuery, episodes]);

    useEffect(() => {
        window.scrollTo(0, 0);
        setIsLoading(true);
        setError("");
        setDetails(null);
        setEpisodes([]);
        setEpisodeQuery("");

        const fetchWatchData = async () => {
            try {
                const [detailsData, images] = await Promise.all([
                    tmdbFetch(`/${mediaType}/${id}`),
                    tmdbGetImages(mediaType, id),
                ]);
                setDetails(detailsData);

                // Find title logo
                const logos = images.logos || [];
                const logoPath = logos.find(l => l.iso_639_1 === "en")?.file_path ||
                                 logos.find(l => l.iso_639_1 === null)?.file_path ||
                                 logos[0]?.file_path;
                setTitleLogo(logoPath);
                setLogoError(false);
            } catch (fetchError) {
                console.error("Error loading watch page:", fetchError);
                setError("Unable to load this title right now.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWatchData();
    }, [id, mediaType]);

    useEffect(() => {
        if (mediaType !== "tv" || !id) return;

        const fetchEpisodes = async () => {
            setIsEpisodesLoading(true);
            try {
                const seasonData = await tmdbGetSeason(id, season);
                setEpisodes(seasonData.episodes || []);
            } finally {
                setIsEpisodesLoading(false);
            }
        };

        fetchEpisodes();
    }, [id, mediaType, season]);

    // Fetch video streams from TMDB Embed API
    useEffect(() => {
        if (!id) return;

        const fetchStreams = async () => {
            setIsStreamsLoading(true);
            setError("");
            setStreams([]);
            setActiveStream(null);

            try {
                const apiBase = import.meta.env.VITE_TMDB_EMBED_API_URL || "http://localhost:8787";
                const endpoint = mediaType === "tv"
                    ? `${apiBase}/api/streams/series/${id}/${season}/${episode}`
                    : `${apiBase}/api/streams/movie/${id}`;

                const response = await fetch(endpoint);
                if (!response.ok) throw new Error("Failed to fetch streams");

                const data = await response.json();
                if (data.success && Array.isArray(data.streams) && data.streams.length > 0) {
                    setStreams(data.streams);
                    
                    // Look if there is a saved provider in the history for this title
                    const historyItem = getHistory().find(h => h.id === Number(id));
                    const matchedStream = data.streams.find(s => s.provider === historyItem?.provider);
                    
                    // Default to matched provider, or falls back to first stream
                    setActiveStream(matchedStream || data.streams[0]);
                } else {
                    setError("No streaming sources found for this title.");
                }
            } catch (err) {
                console.error("Error fetching direct streams:", err);
                setError("Unable to connect to the streaming server. Please ensure the API is running.");
            } finally {
                setIsStreamsLoading(false);
            }
        };

        fetchStreams();
    }, [id, mediaType, season, episode]);

    useEffect(() => {
        if (!details) return;
        addToHistory(details, mediaType, mediaType === "tv" ? season : null, mediaType === "tv" ? episode : null, activeStream?.provider || null);
    }, [details, episode, mediaType, season, activeStream]);

    useEffect(() => {
        if (!details) {
            document.title = "EpicStream";
            return undefined;
        }

        if (mediaType === "tv") {
            const episodeTitle = currentEpisode?.name ? ` - ${currentEpisode.name}` : "";
            document.title = `${title} S${season}:E${episode}${episodeTitle} - EpicStream`;
        } else {
            document.title = `${title} - EpicStream`;
        }

        return () => {
            document.title = "EpicStream";
        };
    }, [currentEpisode, details, episode, mediaType, season, title]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (providerMenuRef.current && !providerMenuRef.current.contains(event.target)) {
                setIsProviderMenuOpen(false);
            }
            if (seasonMenuRef.current && !seasonMenuRef.current.contains(event.target)) {
                setIsSeasonMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isProviderMenuOpen && providerMenuRef.current) {
            const rect = providerMenuRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const menuHeight = 180;
            if (spaceBelow < menuHeight) {
                setOpenUpward(true);
            } else {
                setOpenUpward(false);
            }
        }
    }, [isProviderMenuOpen]);

    const navigateToEpisode = (episodeNumber, targetSeason = season) => {
        setSearchParams({
            season: String(targetSeason),
            episode: String(episodeNumber),
        });
    };

    const handleSeasonChange = (seasonNumber) => {
        setEpisodeQuery("");
        setIsSeasonMenuOpen(false);
        navigateToEpisode(1, seasonNumber);
    };

    const releaseDate = details?.release_date || details?.first_air_date;
    const runtime = mediaType === "movie"
        ? formatRuntime(details?.runtime)
        : formatRuntime(currentEpisode?.runtime || details?.episode_run_time?.[0]);
    const rating = details?.vote_average ? details.vote_average.toFixed(1) : null;
    const overview = currentEpisode?.overview || details?.overview || "No description available.";
    const backdrop = details?.backdrop_path || details?.poster_path;
    const poster = details?.poster_path || details?.backdrop_path;

    return (
        <div className="watch-page">
            {backdrop && (
                <img className="watch-backdrop" src={imageUrl(backdrop, "original")} alt="" />
            )}
            <div className="watch-shade" />

            <main className={`watch-shell ${mediaType === "movie" ? "movie-mode" : "series-mode"} ${isTheaterMode ? "theater-mode" : ""}`}>
                <section className="watch-main-grid">
                    <div className="watch-primary">
                        <section className="watch-player-card" aria-label={`${title} player`}>
                            {(isLoading || isStreamsLoading || error) && (
                                <div className="watch-state">
                                    {!error && <div className="watch-spinner" />}
                                    <strong>{error || (isLoading ? "Preparing player..." : "Fetching video streams...")}</strong>
                                </div>
                            )}

                            {!isLoading && !isStreamsLoading && !error && activeStream && (
                                <HlsPlayer
                                    src={activeStream.url}
                                    poster={imageUrl(backdrop, "original")}
                                    savedProgress={savedProgress}
                                    onProgress={(progress) => {
                                        updateHistoryProgress(id, {
                                            percentage: progress.percentage,
                                            currentTime: progress.currentTime,
                                            duration: progress.duration,
                                            timeStr: formatTime(progress.currentTime),
                                        });
                                    }}
                                    title={title}
                                    mediaType={mediaType}
                                    season={season}
                                    episode={episode}
                                    previousEpisode={previousEpisode}
                                    nextEpisode={nextEpisode}
                                    onNavigateEpisode={navigateToEpisode}
                                    activeStream={activeStream}
                                    streams={streams}
                                    setActiveStream={setActiveStream}
                                    details={details}
                                    isTheaterMode={isTheaterMode}
                                    setIsTheaterMode={setIsTheaterMode}
                                    titleLogo={titleLogo}
                                />
                            )}
                        </section>
                    </div>

                    {mediaType === "tv" && (
                        <aside className="watch-side-panel">
                            <div className="watch-sidebar-controls">
                                <label className="watch-filter">
                                    <Search size={16} />
                                    <input
                                        ref={episodeFilterRef}
                                        value={episodeQuery}
                                        onChange={(event) => setEpisodeQuery(event.target.value)}
                                        placeholder="Filter episodes..."
                                    />
                                </label>

                                {seasonsList.length > 0 && (
                                    <div className="watch-season-menu" ref={seasonMenuRef}>
                                        <button
                                            type="button"
                                            className="watch-season-trigger"
                                            onClick={() => setIsSeasonMenuOpen((value) => !value)}
                                            aria-expanded={isSeasonMenuOpen}
                                        >
                                            {currentSeason?.name || `Season ${season}`}
                                            <ChevronDown size={16} />
                                        </button>
                                        {isSeasonMenuOpen && (
                                            <div className="watch-season-list">
                                                {seasonsList.map((item) => (
                                                    <button
                                                        type="button"
                                                        key={item.id}
                                                        className={item.season_number === season ? "active" : ""}
                                                        onClick={() => handleSeasonChange(item.season_number)}
                                                    >
                                                        {item.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="watch-episode-list">
                                {isEpisodesLoading ? (
                                    <div className="watch-panel-empty">Loading episodes...</div>
                                ) : filteredEpisodes.length > 0 ? (
                                    filteredEpisodes.map((item) => (
                                        <button
                                            type="button"
                                            key={item.id}
                                            className={`watch-episode-card ${item.episode_number === episode ? "active" : ""}`}
                                            onClick={() => navigateToEpisode(item.episode_number)}
                                        >
                                            <div className="watch-episode-thumb">
                                                <img
                                                    src={imageUrl(item.still_path, "w300", "/hero.png")}
                                                    alt=""
                                                    loading="lazy"
                                                />
                                                <span>EP {item.episode_number}</span>
                                            </div>
                                            <div className="watch-episode-copy">
                                                <strong>{item.name || `Episode ${item.episode_number}`}</strong>
                                                <p>{item.overview || "No description available."}</p>
                                                <small>{formatDate(item.air_date)}</small>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="watch-panel-empty">No matching episodes.</div>
                                )}
                            </div>
                        </aside>
                    )}
                </section>

                <section className="watch-details">
                    <div className="watch-poster-wrap">
                        <img src={imageUrl(poster, "w500", "/hero.png")} alt="" loading="lazy" />
                    </div>

                    <div className="watch-details-copy">
                        <div className="watch-title-row">
                            <div className="watch-title-container">
                                {!logoError && titleLogo ? (
                                    <img 
                                        src={imageUrl(titleLogo, "w500")} 
                                        alt={title} 
                                        className="watch-title-logo"
                                        onError={() => setLogoError(true)}
                                    />
                                ) : (
                                    <h2>{title}</h2>
                                ) }
                            </div>
                        </div>

                        <div className="watch-meta-row">
                            {rating && (
                                <>
                                    <span className="rating">
                                        <Star size={13} fill="currentColor" />
                                        {rating}
                                    </span>
                                    <span className="dot" />
                                </>
                            )}
                            <span>{anime ? "Anime" : formatMediaType(mediaType)}</span>
                            {releaseDate && (
                                <>
                                    <span className="dot" />
                                    <span>{formatDate(releaseDate)}</span>
                                </>
                            )}
                            {runtime && (
                                <>
                                    <span className="dot" />
                                    <span>{runtime}</span>
                                </>
                            )}
                        </div>

                        {mediaType === "tv" && currentEpisode && (
                            <h3 className="watch-episode-title">
                                {currentEpisode.name || `Episode ${currentEpisode.episode_number}`}
                            </h3>
                        )}

                        <p className="watch-overview">{overview}</p>

                        {details?.genres?.length > 0 && (
                            <div className="watch-genres">
                                {details.genres.slice(0, 5).map((genre) => (
                                    <span key={genre.id}>{genre.name}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default WatchPage;
