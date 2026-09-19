# Screening Assets

Place optional installation artwork in this folder. Nothing here is required for the player to run.

## `logo.png`

Optional chapter or event logo.

- Shown on the launch screen and intermission
- If this file is missing, the player uses a typographic wordmark
- Do not add an official Alpha Kappa Alpha crest or seal unless you are authorized to use it
- Transparent PNG works best
- Recommended height: 160–240 pixels

Enable or disable the logo in `src/config.js`:

```js
showLogo: true,
logoPath: "./assets/logo.png"
```

## `donation-qr.png`

Optional custom QR-code image for contributions.

- If this file is present, it is used during intermission
- If this file is missing, the player generates a QR code from `CONFIG.donation.url`
- Keep the code square, high contrast, and surrounded by white quiet space
- Recommended size: at least 600 × 600 pixels

The custom image path is also set in `src/config.js`:

```js
donation: {
  qrCodeImage: "./assets/donation-qr.png"
}
```
