import { CONFIG } from "./config.js";
import {
  renderDocumentaryTitle,
  renderStoneLegend,
  updateCountdownClock
} from "./intermission.js";
import { renderDonationQR } from "./qr.js";
import {
  PlayerState,
  createYouTubeController,
  loadYouTubeAPI
} from "./youtube.js";
import {
  exitAppFullscreen,
  extractYouTubeId,
  isAppFullscreen,
  isTypingTarget,
  loadImage,
  onFullscreenChange,
  prefersReducedMotion,
  requestAppFullscreen,
  resolvePublicAsset,
  setHidden,
  setText,
  splitMultiline,
  wait
} from "./utils.js";

export const STATES = {
  LAUNCH: "LAUNCH",
  SCREENING: "SCREENING",
  TRANSITION_TO_INTERMISSION: "TRANSITION_TO_INTERMISSION",
  INTERMISSION: "INTERMISSION",
  TRANSITION_TO_SCREENING: "TRANSITION_TO_SCREENING",
  ERROR: "ERROR"
};

const IDLE_MS = 3000;
const PLAYBACK_GRACE_MS = 2500;
const BLACK_HOLD_MS = 420;

export class ScreeningApp {
  constructor() {
    this.state = STATES.LAUNCH;
    this.player = null;
    this.videoId = null;
    this.sessionStarted = false;
    this.fullscreenRequested = false;
    this.intentionallyPaused = false;
    this.awaitingPlayback = false;
    this.intermissionEndsAt = null;
    this.countdownTimer = null;
    this.idleTimer = null;
    this.playbackWatchTimer = null;
    this.lastAnnouncedMark = null;
    this.elements = {};
  }

  async init() {
    this.cacheElements();
    this.bindConfig();
    this.bindEvents();
    await Promise.all([this.prepareLogo(), this.prepareDonationCard()]);
    this.setState(STATES.LAUNCH);
    this.updateFullscreenButton();
    this.applyPreviewMode();
  }

  cacheElements() {
    const root = document.getElementById("app");
    this.elements = {
      root,
      launch: document.getElementById("launch"),
      screening: document.getElementById("screening"),
      intermission: document.getElementById("intermission"),
      error: document.getElementById("error"),
      veil: document.getElementById("veil"),
      atmosphere: document.getElementById("atmosphere"),
      enterButton: document.getElementById("enter-screening"),
      startFilmButton: document.getElementById("start-film"),
      fullscreenButton: document.getElementById("fullscreen-toggle"),
      retryButton: document.getElementById("retry-screening"),
      donateButton: document.getElementById("donate-button"),
      qrMount: document.getElementById("qr-mount"),
      countdown: document.getElementById("countdown"),
      countdownStatus: document.getElementById("countdown-status"),
      continueCopy: document.getElementById("continue-copy"),
      imminentCopy: document.getElementById("imminent-copy"),
      watermark: document.getElementById("playback-watermark"),
      playerHost: document.getElementById("player-host"),
      supportCard: document.getElementById("support-card"),
      tagline: document.getElementById("tagline"),
      stoneLegend: document.getElementById("stone-legend"),
      logos: Array.from(document.querySelectorAll("[data-logo]")),
      logoFallbacks: Array.from(document.querySelectorAll("[data-logo-fallback]"))
    };
  }

  bindConfig() {
    document.title = `${CONFIG.documentaryTitle} — ${CONFIG.chapterName}`;

    document.querySelectorAll("[data-config]").forEach((element) => {
      const path = element.getAttribute("data-config");
      const value = getConfigValue(path);
      if (typeof value === "string") {
        if (element.hasAttribute("data-multiline")) {
          element.replaceChildren(
            ...splitMultiline(value).map((line) => {
              const span = document.createElement("span");
              span.textContent = line;
              return span;
            })
          );
        } else {
          setText(element, value);
        }
      }
    });

    document.querySelectorAll("[data-film-title]").forEach((element) => {
      renderDocumentaryTitle(element, CONFIG.documentaryTitle);
    });
    renderStoneLegend(this.elements.stoneLegend, CONFIG.stoneLegend);

    if (this.elements.donateButton) {
      this.elements.donateButton.href = CONFIG.donation.url || "#";
    }

    if (!CONFIG.donation.enabled && this.elements.supportCard) {
      this.elements.supportCard.hidden = true;
      this.elements.root.classList.add("is-donation-hidden");
    }

    if (!CONFIG.fullscreenButton && this.elements.fullscreenButton) {
      this.elements.fullscreenButton.hidden = true;
    }

    if (this.elements.watermark) {
      setText(this.elements.watermark, CONFIG.chapterName);
      this.elements.watermark.hidden = !CONFIG.showPlaybackWatermark;
    }
  }

  async prepareLogo() {
    const enabled = CONFIG.showLogo && CONFIG.logoPath;
    if (!enabled) {
      this.toggleLogo(false);
      return;
    }

    const image = await loadImage(resolvePublicAsset(CONFIG.logoPath));
    if (!image) {
      this.toggleLogo(false);
      return;
    }

    this.elements.logos.forEach((img) => {
      img.src = image.src;
      img.alt = `${CONFIG.chapterName} logo`;
      img.hidden = false;
    });
    this.elements.logoFallbacks.forEach((fallback) => {
      fallback.hidden = true;
    });
  }

  toggleLogo(hasCustomLogo) {
    this.elements.logos.forEach((img) => {
      if (!hasCustomLogo) {
        img.hidden = true;
        img.removeAttribute("src");
      }
    });
    this.elements.logoFallbacks.forEach((fallback) => {
      fallback.hidden = hasCustomLogo;
    });
  }

  async prepareDonationCard() {
    if (!CONFIG.donation.enabled) {
      return;
    }
    await renderDonationQR(this.elements.qrMount, CONFIG.donation);
  }

  bindEvents() {
    this.elements.enterButton?.addEventListener("click", () => {
      this.enterScreening();
    });

    this.elements.startFilmButton?.addEventListener("click", () => {
      this.attemptPlayback({ userInitiated: true });
    });

    this.elements.retryButton?.addEventListener("click", () => {
      this.retryScreening();
    });

    this.elements.fullscreenButton?.addEventListener("click", () => {
      this.toggleFullscreen();
    });

    document.addEventListener("keydown", (event) => {
      this.handleShortcut(event);
    });

    ["mousemove", "mousedown", "touchstart", "pointerdown"].forEach((eventName) => {
      document.addEventListener(eventName, () => this.markActivity(), {
        passive: true
      });
    });

    document.addEventListener("visibilitychange", () => {
      this.handleVisibilityChange();
    });

    onFullscreenChange(() => {
      this.updateFullscreenButton();
    });

    window.addEventListener("resize", () => {
      this.elements.root.style.setProperty("--vh", `${window.innerHeight}px`);
    });
    this.elements.root.style.setProperty("--vh", `${window.innerHeight}px`);
  }

  setState(nextState) {
    this.state = nextState;
    this.elements.root.dataset.state = nextState;
    this.elements.root.setAttribute("data-state", nextState);
    console.info("[screening] State:", nextState);

    const screeningActive = nextState === STATES.SCREENING;
    this.elements.launch?.setAttribute(
      "aria-hidden",
      nextState === STATES.LAUNCH ? "false" : "true"
    );
    this.elements.intermission?.setAttribute(
      "aria-hidden",
      nextState === STATES.INTERMISSION ? "false" : "true"
    );
    this.elements.error?.setAttribute(
      "aria-hidden",
      nextState === STATES.ERROR ? "false" : "true"
    );
    this.elements.screening?.setAttribute(
      "aria-hidden",
      screeningActive ? "false" : "true"
    );

    if (nextState === STATES.SCREENING) {
      this.markActivity();
    } else {
      document.body.classList.remove("is-idle");
    }
  }

  async enterScreening() {
    if (this.sessionStarted || this.state !== STATES.LAUNCH) {
      return;
    }

    this.sessionStarted = true;
    setHidden(this.elements.enterButton, true);

    if (!this.fullscreenRequested) {
      this.fullscreenRequested = true;
      await requestAppFullscreen();
    }

    this.elements.root.classList.add("is-entered");
    this.setVeil(true);
    await wait(prefersReducedMotion() ? 0 : 720);
    this.setState(STATES.SCREENING);
    await this.ensurePlayer();
  }

  async ensurePlayer() {
    this.videoId = extractYouTubeId(CONFIG.youtubeUrl);

    if (!this.videoId) {
      console.error(
        "[screening] Invalid YouTube URL. Update youtubeUrl in src/config.js.",
        CONFIG.youtubeUrl
      );
      this.showError();
      return;
    }

    try {
      if (!this.player) {
        await loadYouTubeAPI();
        this.rebuildPlayerHost();
        this.player = createYouTubeController({
          hostId: "yt-player",
          videoId: this.videoId,
          onReady: () => {
            this.attemptPlayback({ userInitiated: true });
          },
          onPlaying: () => {
            this.handlePlaybackStarted();
          },
          onPaused: () => {
            this.handlePlaybackPaused();
          },
          onEnded: () => {
            this.handleDocumentaryEnded();
          },
          onBuffering: () => {
            console.info("[screening] Documentary is buffering");
          },
          onError: () => {
            this.showError();
          }
        });
      } else {
        this.attemptPlayback({ userInitiated: true });
      }
    } catch (error) {
      console.error("[screening] Failed to initialize YouTube player", error);
      this.showError();
    }
  }

  rebuildPlayerHost() {
    const stage = document.getElementById("player-stage");
    if (!stage) {
      return;
    }
    stage.replaceChildren();
    const host = document.createElement("div");
    host.id = "yt-player";
    host.className = "yt-player";
    stage.appendChild(host);
    this.elements.playerHost = host;
  }

  attemptPlayback({ userInitiated = false } = {}) {
    if (!this.player) {
      return;
    }

    this.awaitingPlayback = true;
    this.intentionallyPaused = false;
    this.player.unmute();
    this.player.play();

    window.clearTimeout(this.playbackWatchTimer);
    this.playbackWatchTimer = window.setTimeout(() => {
      if (!this.awaitingPlayback) {
        return;
      }
      if (this.player?.isPlaying()) {
        this.handlePlaybackStarted();
        return;
      }
      if (userInitiated || this.state === STATES.SCREENING) {
        this.showStartFilmControl();
      }
    }, PLAYBACK_GRACE_MS);
  }

  handlePlaybackStarted() {
    this.awaitingPlayback = false;
    this.intentionallyPaused = false;
    window.clearTimeout(this.playbackWatchTimer);
    this.hideStartFilmControl();
    if (
      this.state === STATES.SCREENING ||
      this.state === STATES.TRANSITION_TO_SCREENING ||
      this.state === STATES.LAUNCH
    ) {
      this.setState(STATES.SCREENING);
      this.setVeil(false);
    }
  }

  handlePlaybackPaused() {
    if (this.state !== STATES.SCREENING) {
      return;
    }
    if (this.intentionallyPaused) {
      return;
    }
    if (document.visibilityState === "hidden") {
      return;
    }
  }

  async handleDocumentaryEnded() {
    if (
      this.state !== STATES.SCREENING &&
      this.state !== STATES.TRANSITION_TO_SCREENING
    ) {
      return;
    }
    await this.beginIntermission();
  }

  async beginIntermission({ immediate = false } = {}) {
    if (
      this.state === STATES.INTERMISSION ||
      this.state === STATES.TRANSITION_TO_INTERMISSION
    ) {
      if (immediate) {
        this.startCountdown();
      }
      return;
    }

    this.hideStartFilmControl();
    this.setState(STATES.TRANSITION_TO_INTERMISSION);
    this.setVeil(true);
    this.player?.pause();
    this.player?.stop();

    await wait(immediate ? 0 : BLACK_HOLD_MS + 900);
    this.startCountdown();
    this.setState(STATES.INTERMISSION);
    this.setVeil(false);
  }

  startCountdown() {
    this.clearCountdown();
    const duration = Math.max(1, Number(CONFIG.intermissionDuration) || 300);
    this.intermissionEndsAt = Date.now() + duration * 1000;
    this.lastAnnouncedMark = null;
    this.elements.root.classList.remove("is-final-minute", "is-imminent");
    this.tickCountdown();
  }

  tickCountdown() {
    if (this.state !== STATES.INTERMISSION) {
      return;
    }

    const remaining = this.intermissionEndsAt - Date.now();
    this.renderCountdown(remaining);

    if (remaining <= 0) {
      this.beginReturnToScreening();
      return;
    }

    this.countdownTimer = window.setTimeout(() => this.tickCountdown(), 200);
  }

  renderCountdown(remainingMs) {
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    updateCountdownClock(this.elements.countdown, remainingMs, {
      showSeconds: CONFIG.showCountdownSeconds || remainingSeconds < 60
    });

    const finalMinute = remainingSeconds <= 60 && remainingSeconds > 0;
    const imminent = remainingSeconds <= 10 && remainingSeconds > 0;

    this.elements.root.classList.toggle("is-final-minute", finalMinute);
    this.elements.root.classList.toggle("is-imminent", imminent);

    if (this.elements.continueCopy) {
      this.elements.continueCopy.hidden = imminent;
    }
    if (this.elements.imminentCopy) {
      this.elements.imminentCopy.hidden = !imminent;
    }

    this.announceCountdown(remainingSeconds);
  }

  announceCountdown(remainingSeconds) {
    if (!this.elements.countdownStatus) {
      return;
    }

    let mark = null;
    if (this.lastAnnouncedMark == null) {
      mark = "start";
    } else if (remainingSeconds === 60) {
      mark = 60;
    } else if (remainingSeconds === 10) {
      mark = 10;
    }

    if (mark == null || mark === this.lastAnnouncedMark) {
      return;
    }

    this.lastAnnouncedMark = mark;
    if (mark === "start") {
      const minutes = Math.max(
        1,
        Math.round((Number(CONFIG.intermissionDuration) || 300) / 60)
      );
      this.elements.countdownStatus.textContent =
        `Intermission started. Next screening in ${minutes} minutes.`;
    } else if (mark === 60) {
      this.elements.countdownStatus.textContent = "One minute until the next screening.";
    } else if (mark === 10) {
      this.elements.countdownStatus.textContent = "Screening beginning shortly.";
    }
  }

  async beginReturnToScreening() {
    if (this.state !== STATES.INTERMISSION) {
      return;
    }

    this.clearCountdown();
    this.setState(STATES.TRANSITION_TO_SCREENING);
    this.setVeil(true);
    await wait(BLACK_HOLD_MS + 720);

    if (!this.player) {
      this.setState(STATES.SCREENING);
      await this.ensurePlayer();
      return;
    }

    this.setState(STATES.SCREENING);
    this.player.restart();
    this.attemptPlayback({ userInitiated: false });
  }

  async retryScreening() {
    this.setVeil(true);
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.setState(STATES.SCREENING);
    await this.ensurePlayer();
  }

  showError() {
    this.clearCountdown();
    this.hideStartFilmControl();
    this.setState(STATES.ERROR);
    this.setVeil(false);
  }

  showStartFilmControl() {
    if (!this.elements.startFilmButton) {
      return;
    }
    this.elements.startFilmButton.hidden = false;
    this.elements.startFilmButton.focus({ preventScroll: true });
  }

  hideStartFilmControl() {
    if (this.elements.startFilmButton) {
      this.elements.startFilmButton.hidden = true;
    }
  }

  setVeil(visible) {
    this.elements.root.classList.toggle("is-veiled", visible);
  }

  clearCountdown() {
    if (this.countdownTimer) {
      window.clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.intermissionEndsAt = null;
    this.elements.root.classList.remove("is-final-minute", "is-imminent");
  }

  markActivity() {
    document.body.classList.add("is-active");
    document.body.classList.remove("is-idle");
    window.clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => {
      document.body.classList.remove("is-active");
      if (this.state === STATES.SCREENING) {
        document.body.classList.add("is-idle");
      }
    }, IDLE_MS);
  }

  handleVisibilityChange() {
    if (document.visibilityState !== "visible") {
      return;
    }

    if (this.state === STATES.INTERMISSION && this.intermissionEndsAt) {
      if (Date.now() >= this.intermissionEndsAt) {
        this.beginReturnToScreening();
        return;
      }
      this.tickCountdown();
    }

    if (
      this.state === STATES.SCREENING &&
      this.player &&
      !this.intentionallyPaused &&
      !this.player.isPlaying()
    ) {
      const state = this.player.getState();
      if (state === PlayerState.PAUSED || state === PlayerState.CUED) {
        this.attemptPlayback();
      }
    }
  }

  applyPreviewMode() {
    const preview = new URLSearchParams(window.location.search).get("preview");
    if (preview !== "intermission") {
      return;
    }

    this.sessionStarted = true;
    setHidden(this.elements.enterButton, true);
    this.setState(STATES.INTERMISSION);
    this.startCountdown();
    console.info(
      "[screening] Intermission preview is active. Remove ?preview=intermission for the live event."
    );
  }

  handleShortcut(event) {
    if (isTypingTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();

    if (event.code === "Space") {
      if (this.state === STATES.SCREENING && this.player) {
        event.preventDefault();
        if (this.player.isPlaying()) {
          this.intentionallyPaused = true;
          this.player.pause();
        } else {
          this.attemptPlayback({ userInitiated: true });
        }
      }
      return;
    }

    if (key === "f") {
      event.preventDefault();
      this.toggleFullscreen();
      return;
    }

    if (key === "s") {
      event.preventDefault();
      if (this.state === STATES.LAUNCH) {
        this.enterScreening();
      } else if (
        this.state === STATES.INTERMISSION ||
        this.state === STATES.ERROR
      ) {
        this.restartDocumentary();
      }
      return;
    }

    if (!this.sessionStarted) {
      return;
    }

    if (key === "i") {
      event.preventDefault();
      this.beginIntermission({ immediate: true });
      return;
    }

    if (key === "r") {
      event.preventDefault();
      this.restartDocumentary();
    }
  }

  async restartDocumentary() {
    this.clearCountdown();
    this.hideStartFilmControl();
    this.setState(STATES.TRANSITION_TO_SCREENING);
    this.setVeil(true);
    await wait(BLACK_HOLD_MS);
    this.setState(STATES.SCREENING);
    if (!this.player) {
      await this.ensurePlayer();
      return;
    }
    this.player.restart();
  }

  async toggleFullscreen() {
    if (isAppFullscreen()) {
      await exitAppFullscreen();
    } else {
      await requestAppFullscreen();
    }
    this.updateFullscreenButton();
  }

  updateFullscreenButton() {
    const button = this.elements.fullscreenButton;
    if (!button || !CONFIG.fullscreenButton) {
      return;
    }

    const fullscreen = isAppFullscreen();
    button.setAttribute("aria-pressed", fullscreen ? "true" : "false");
    button.setAttribute(
      "aria-label",
      fullscreen ? CONFIG.copy.exitFullscreen : CONFIG.copy.fullscreen
    );
    button.classList.toggle("is-fullscreen", fullscreen);
    this.elements.root.classList.toggle("is-fullscreen", fullscreen);
  }
}

function getConfigValue(path) {
  return path.split(".").reduce((value, key) => {
    if (value && Object.prototype.hasOwnProperty.call(value, key)) {
      return value[key];
    }
    return undefined;
  }, CONFIG);
}
