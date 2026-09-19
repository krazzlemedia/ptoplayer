const API_SCRIPT_SRC = "https://www.youtube.com/iframe_api";
const API_TIMEOUT_MS = 15000;

let apiPromise = null;

function hasYouTubeAPI() {
  return Boolean(window.YT && typeof window.YT.Player === "function");
}

export function loadYouTubeAPI() {
  if (hasYouTubeAPI()) {
    return Promise.resolve(window.YT);
  }

  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise((resolve, reject) => {
    let settled = false;

    const finish = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      if (error) {
        apiPromise = null;
        reject(error);
        return;
      }
      resolve(window.YT);
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") {
        previousReady();
      }
      finish();
    };

    if (!document.querySelector(`script[src="${API_SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = API_SCRIPT_SRC;
      script.async = true;
      script.onerror = () => {
        finish(new Error("YouTube IFrame API failed to load"));
      };
      document.head.appendChild(script);
    }

    const timeoutId = window.setTimeout(() => {
      if (hasYouTubeAPI()) {
        finish();
        return;
      }
      finish(new Error("YouTube IFrame API timed out"));
    }, API_TIMEOUT_MS);
  });

  return apiPromise;
}

export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};

export function createYouTubeController({
  hostId,
  videoId,
  autoplay = 0,
  onReady,
  onPlaying,
  onPaused,
  onEnded,
  onBuffering,
  onError
}) {
  let player = null;
  let destroyed = false;
  let ready = false;

  const playerVars = {
    autoplay: autoplay ? 1 : 0,
    mute: 0,
    controls: 0,
    disablekb: 1,
    fs: 0,
    modestbranding: 1,
    rel: 0,
    iv_load_policy: 3,
    playsinline: 1,
    cc_load_policy: 0,
    enablejsapi: 1,
    origin: window.location.origin,
    widget_referrer: window.location.href
  };

  player = new window.YT.Player(hostId, {
    videoId,
    width: "100%",
    height: "100%",
    playerVars,
    events: {
      onReady(event) {
        if (destroyed) {
          return;
        }
        ready = true;
        hardenIframe(event.target);
        if (typeof onReady === "function") {
          onReady(event.target);
        }
      },
      onStateChange(event) {
        if (destroyed) {
          return;
        }

        switch (event.data) {
          case PlayerState.ENDED:
            if (typeof onEnded === "function") {
              onEnded(event.target);
            }
            break;
          case PlayerState.PLAYING:
            if (typeof onPlaying === "function") {
              onPlaying(event.target);
            }
            break;
          case PlayerState.PAUSED:
            if (typeof onPaused === "function") {
              onPaused(event.target);
            }
            break;
          case PlayerState.BUFFERING:
            if (typeof onBuffering === "function") {
              onBuffering(event.target);
            }
            break;
          default:
            break;
        }
      },
      onError(event) {
        const message = describeYouTubeError(event.data);
        console.error("[screening] YouTube player error", event.data, message);
        if (typeof onError === "function") {
          onError(message, event.data);
        }
      }
    }
  });

  function getIframe() {
    if (!player || typeof player.getIframe !== "function") {
      return null;
    }
    return player.getIframe();
  }

  function hardenIframe(instance) {
    const iframe = instance && typeof instance.getIframe === "function"
      ? instance.getIframe()
      : getIframe();

    if (!iframe) {
      return;
    }

    iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("title", "Documentary screening");
    iframe.setAttribute("tabindex", "-1");
    iframe.style.pointerEvents = "none";
  }

  function safeCall(methodName, ...args) {
    if (!player || typeof player[methodName] !== "function") {
      return undefined;
    }
    try {
      return player[methodName](...args);
    } catch (error) {
      console.warn(`[screening] Player method ${methodName} failed`, error);
      return undefined;
    }
  }

  return {
    play() {
      safeCall("playVideo");
    },
    pause() {
      safeCall("pauseVideo");
    },
    stop() {
      safeCall("stopVideo");
    },
    mute() {
      safeCall("mute");
    },
    unmute() {
      safeCall("unMute");
    },
    seekTo(seconds, allowSeekAhead = true) {
      safeCall("seekTo", seconds, allowSeekAhead);
    },
    restart() {
      safeCall("seekTo", 0, true);
      safeCall("unMute");
      safeCall("playVideo");
    },
    getState() {
      const state = safeCall("getPlayerState");
      return typeof state === "number" ? state : PlayerState.UNSTARTED;
    },
    isPlaying() {
      return this.getState() === PlayerState.PLAYING;
    },
    isPaused() {
      return this.getState() === PlayerState.PAUSED;
    },
    isReady() {
      return ready && !destroyed;
    },
    destroy() {
      destroyed = true;
      if (player && typeof player.destroy === "function") {
        try {
          player.destroy();
        } catch (error) {
          console.warn("[screening] Failed to destroy YouTube player", error);
        }
      }
      player = null;
    }
  };
}

function describeYouTubeError(code) {
  switch (code) {
    case 2:
      return "The documentary address is invalid.";
    case 5:
      return "The documentary could not start in this browser.";
    case 100:
      return "The documentary could not be found.";
    case 101:
    case 150:
      return "This documentary cannot be embedded for screening.";
    default:
      return "The documentary could not be loaded.";
  }
}
