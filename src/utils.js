const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

function isValidYouTubeId(value) {
  return typeof value === "string" && YOUTUBE_ID_PATTERN.test(value);
}

/**
 * Extract an 11-character YouTube video ID from common URL formats
 * or from a raw ID string.
 */
export function extractYouTubeId(input) {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();

  if (isValidYouTubeId(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return isValidYouTubeId(id) ? id : null;
    }

    const isYouTubeHost =
      hostname === "youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com" ||
      hostname === "youtube-nocookie.com";

    if (!isYouTubeHost) {
      return null;
    }

    const queryId = parsed.searchParams.get("v");
    if (isValidYouTubeId(queryId)) {
      return queryId;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const markers = new Set(["embed", "shorts", "live", "v", "e"]);

    for (let index = 0; index < segments.length; index += 1) {
      if (markers.has(segments[index])) {
        const candidate = segments[index + 1];
        if (isValidYouTubeId(candidate)) {
          return candidate;
        }
      }
    }
  } catch (error) {
    console.warn("[screening] Unable to parse YouTube URL", error);
    return null;
  }

  return null;
}

export function padTime(value) {
  return String(value).padStart(2, "0");
}

export function getCountdownParts(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}

/**
 * Format remaining milliseconds as a theatrical countdown string.
 */
export function formatCountdown(remainingMs, { showSeconds = true } = {}) {
  const { hours, minutes, seconds, totalSeconds } = getCountdownParts(remainingMs);

  if (!showSeconds && totalSeconds >= 60) {
    const wholeMinutes = Math.ceil(totalSeconds / 60);
    return `${padTime(wholeMinutes)} min`;
  }

  if (hours > 0) {
    return `${hours}:${padTime(minutes)}:${padTime(seconds)}`;
  }

  return `${padTime(minutes)}:${padTime(seconds)}`;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function wait(ms) {
  const duration = prefersReducedMotion() ? 0 : ms;
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export async function requestAppFullscreen(element = document.documentElement) {
  const request =
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||
    element.msRequestFullscreen;

  if (!request) {
    return false;
  }

  try {
    const result = request.call(element);
    if (result && typeof result.then === "function") {
      await result;
    }
    return true;
  } catch (error) {
    console.warn("[screening] Fullscreen request was denied or unsupported", error);
    return false;
  }
}

export async function exitAppFullscreen() {
  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;

  if (!exit || !isAppFullscreen()) {
    return false;
  }

  try {
    const result = exit.call(document);
    if (result && typeof result.then === "function") {
      await result;
    }
    return true;
  } catch (error) {
    console.warn("[screening] Unable to exit fullscreen", error);
    return false;
  }
}

export function isAppFullscreen() {
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
  );
}

export function onFullscreenChange(handler) {
  const events = ["fullscreenchange", "webkitfullscreenchange", "msfullscreenchange"];
  events.forEach((eventName) => {
    document.addEventListener(eventName, handler);
  });

  return () => {
    events.forEach((eventName) => {
      document.removeEventListener(eventName, handler);
    });
  };
}

export function resolvePublicAsset(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  const normalized = path.replace(/^\.\//, "");
  return new URL(normalized, window.location.href).href;
}

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      resolve(image.naturalWidth > 0 ? image : null);
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function setText(element, value) {
  if (!element) {
    return;
  }
  element.textContent = value ?? "";
}

export function setHidden(element, hidden) {
  if (!element) {
    return;
  }
  element.hidden = Boolean(hidden);
}

export function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

export function splitMultiline(value) {
  if (!value) {
    return [];
  }
  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
