# The Promise That Took Root

Official documentary screening player for **Alpha Kappa Alpha Sorority, Incorporated® — Pi Theta Omega Chapter**.

This is a purpose-built theatrical player for exhibition, gala, chapter program, and public screening use. It is not a standard website with an embedded YouTube page. After one click, the installation can run unattended for the length of an event:

1. Documentary screening
2. Five-minute intermission
3. Documentary screening
4. Five-minute intermission
5. Repeat indefinitely

## Setup

```bash
npm install
npm run dev
```

The local player will open at the Vite development address, usually `http://localhost:5173`.

Build a production copy with:

```bash
npm run build
npm run preview
```

## Change Documentary

Open `src/config.js` and paste the YouTube URL:

```js
youtubeUrl: "https://www.youtube.com/watch?v=PASTE_VIDEO_ID_HERE"
```

Accepted formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- A raw 11-character video ID

Do not edit the player logic to change films. The player reads only this configuration file.

## Change Donation Link

In `src/config.js`:

```js
donation: {
  enabled: true,
  url: "https://your-donation-link.example"
}
```

The **Support The Promise** button and the generated QR code both use this URL.

To hide the donation card entirely:

```js
donation: {
  enabled: false
}
```

## Replace QR Code

You have two options.

### Option A — custom image

Place a square QR image at:

```text
public/assets/donation-qr.png
```

Then keep this path in `src/config.js`:

```js
qrCodeImage: "./assets/donation-qr.png"
```

### Option B — generated automatically

If `donation-qr.png` is not present, the player generates a QR code from `donation.url`.

Use a high-contrast square image with white quiet space if you supply your own file. The on-screen code is sized for television and gallery viewing.

## Change Intermission Duration

```js
intermissionDuration: 300
```

The value is in seconds. `300` is five minutes.

Examples:

- `180` = three minutes
- `300` = five minutes
- `600` = ten minutes

## Optional Logo

Place an authorized event or chapter logo at:

```text
public/assets/logo.png
```

If the file is missing, the player uses the chapter name as a typographic wordmark. Do not add an official crest or seal unless you are authorized to use it.

```js
showLogo: true,
logoPath: "./assets/logo.png"
```

## Configuration Reference

All installation settings live in `src/config.js`.

| Setting | Purpose |
| --- | --- |
| `youtubeUrl` | Documentary source |
| `documentaryTitle` | Title treatment |
| `organizationName` | Organization line |
| `chapterName` | Chapter line |
| `eventSubtitle` | Usually `Presents` |
| `eventLabel` | Small launch-screen label |
| `optionalTagline` | Quiet intermission copy |
| `intermissionDuration` | Seconds between screenings |
| `showCountdownSeconds` | Show `05:00` style seconds |
| `fullscreenButton` | Discreet fullscreen control |
| `showPlaybackWatermark` | Optional faint playback label |
| `showLogo` / `logoPath` | Optional chapter artwork |
| `showTitleLogo` / `titleLogoPath` | Film title lockup |
| `donation.enabled` | Show or hide the support card |
| `donation.url` | Contribution link |
| `donation.qrCodeImage` | Optional custom QR image |

## Operating Instructions

1. Open the screening URL on the display computer.
2. Confirm the documentary URL and donation URL in `src/config.js` before the event.
3. Click **Enter Screening**.
4. The browser requests fullscreen.
5. The documentary begins.
6. When the film ends, the player fades to the intermission experience.
7. The countdown begins at `05:00` unless you changed the duration.
8. At `00:00`, the documentary restarts from the beginning.
9. The cycle continues for as long as the page remains open.

Refreshing the browser returns to the launch screen. That is intentional.

To preview the intermission and donation card without playing the film, open:

```text
http://localhost:5173/?preview=intermission
```

If the film cannot start with audio after the first click, a temporary **Start Film** control appears. After playback begins, that control is removed.

## Fullscreen Limitation

Modern browsers will not enter fullscreen or start sound without a user gesture. **Enter Screening** exists for that reason. The player requests fullscreen once from that click. If fullscreen is denied or unavailable, the documentary still plays in the window.

If someone presses Escape and leaves fullscreen, the film continues. Move the mouse to reveal the discreet fullscreen control, or press `F`.

## Keyboard Shortcuts

These are for the operator and do not appear on screen.

| Key | Action |
| --- | --- |
| `F` | Toggle fullscreen |
| `S` | Start screening immediately |
| `I` | Enter intermission immediately |
| `R` | Restart the documentary |
| `Space` | Play or pause during screening |

Shortcuts are ignored while typing in a form field.

## Deploy to GitHub Pages

This project includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. It builds the static player and publishes the `dist` folder whenever `main` is updated.

### Repository settings

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main`, or run the **Deploy to GitHub Pages** workflow manually.

The player is configured with a relative asset base, so it works at both:

- `https://username.github.io`
- `https://username.github.io/repository-name/`

No custom server is required.

## Design Notes

The visual system is built for a **1920 × 1080 / 16:9** television or projector first:

- Montserrat
- AKA Pink `#F887A2`
- AKA Green `#00AD41`
- Rich black `#050505` and green-black charcoal
- No purple, violet, or lavender anywhere — pink and green are layered, never blended into a muddy midpoint

The intermission is a single-screen installation: countdown and title on the left, Support The Promise on the right, with a slow-moving pink atmosphere and a quieter green counterpoint. On narrower displays, those panels stack.

## Reliability

The player is written for unattended exhibition use:

- YouTube playback is controlled through the official IFrame Player API
- YouTube’s built-in loop is not used, so the film’s end can be detected
- The intermission timer is based on a target timestamp, not a decrementing counter
- If a display sleeps and wakes after the countdown should have ended, the documentary restarts immediately
- Invalid video addresses and player failures show a calm retry state instead of technical errors
- Detailed diagnostics are written to the browser console for administrators

## Accessibility

- Semantic landmarks and labeled controls
- Keyboard-accessible buttons
- Visible focus states
- Tabular countdown numerals
- `prefers-reduced-motion` support
- Screen-reader updates at the start of intermission, one minute, and ten seconds — not every tick

## Project Structure

```text
/
├── index.html
├── README.md
├── package.json
├── vite.config.js
├── .github/workflows/deploy.yml
├── public/assets/
└── src/
    ├── main.js
    ├── config.js
    ├── styles.css
    ├── youtube.js
    ├── screening.js
    ├── intermission.js
    ├── qr.js
    └── utils.js
```
