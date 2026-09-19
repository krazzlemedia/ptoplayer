/**
 * Screening Player Configuration
 *
 * Edit this file to change the documentary, branding, intermission,
 * donation details, and optional display features.
 *
 * You should not need to edit any other file for routine installation updates.
 */
export const CONFIG = {
  /**
   * Documentary YouTube URL.
   * Accepted formats:
   *   https://www.youtube.com/watch?v=VIDEO_ID
   *   https://youtu.be/VIDEO_ID
   *   https://www.youtube.com/embed/VIDEO_ID
   *   A raw 11-character video ID
   */
  youtubeUrl: "https://www.youtube.com/watch?v=tYZi9ugG7Gk",

  documentaryTitle: "The Promise That Took Root",

  organizationName: "Alpha Kappa Alpha Sorority, Incorporated®",

  chapterName: "Pi Theta Omega Chapter",

  eventSubtitle: "Presents",

  eventLabel: "An Official Documentary Screening",

  optionalTagline: "A legacy planted.\nA promise nurtured.\nA brighter tomorrow.",

  /**
   * Intermission length in seconds.
   * 300 = five minutes
   */
  intermissionDuration: 300,

  showCountdownSeconds: true,

  fullscreenButton: true,

  showPlaybackWatermark: false,

  showLogo: true,

  logoPath: "./assets/logo.png",

  showTitleLogo: true,

  titleLogoPath: "./assets/promise-title.png",

  donation: {
    enabled: true,
    url: "https://givebutter.com/2026PearlGala_40Years",
    qrCodeImage: "./assets/donation-qr.png",
    headline: "Support The Promise",
    description:
      "Help us continue the work, preserve the story, and support the mission behind The Promise That Took Root.",
    ctaLabel: "Support The Promise",
    scanLabel: "Scan to Support"
  },

  pillars: "Legacy  |  Service  |  Sisterhood  |  Impact",

  footerLeft: "Scholarship   |   Service   |   Sisterhood   |   Social Justice",

  footerRight: "In service to a brighter tomorrow",

  stoneLegend: ["People", "Purpose", "Progress", "Together"],

  impact: [
    { label: "Preserve Stories" },
    { label: "Empower Communities" },
    { label: "Invest in Tomorrow" }
  ],

  copy: {
    enterScreening: "Enter Screening",
    startFilm: "Start Film",
    nextScreening: "Next Screening",
    continueIn: "The Promise continues in",
    beginningShortly: "Screening beginning shortly",
    continuous: "Screening continuously throughout the event",
    errorTitle: "Screening Temporarily Unavailable",
    errorMessage:
      "Please check the video connection and refresh the screening player.",
    retry: "Retry",
    fullscreen: "Enter fullscreen",
    exitFullscreen: "Exit fullscreen"
  }
};
