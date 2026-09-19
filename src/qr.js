import QRCode from "qrcode";
import { loadImage, resolvePublicAsset } from "./utils.js";

const QR_SIZE = 420;

export async function renderDonationQR(container, donation) {
  if (!container) {
    return;
  }

  container.replaceChildren();

  const customSrc = donation.qrCodeImage
    ? resolvePublicAsset(donation.qrCodeImage)
    : "";

  if (customSrc) {
    const image = await loadImage(customSrc);
    if (image) {
      image.alt = "QR code for contributions";
      image.width = QR_SIZE;
      image.height = QR_SIZE;
      image.className = "qr-image";
      container.appendChild(image);
      return;
    }

    console.info(
      "[screening] Custom QR image was not found. Generating a QR code from the donation URL."
    );
  }

  if (!donation.url) {
    console.error("[screening] No donation URL available for QR generation.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "qr-image";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "QR code for contributions");

  try {
    await QRCode.toCanvas(canvas, donation.url, {
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#050505",
        light: "#ffffff"
      }
    });
    container.appendChild(canvas);
  } catch (error) {
    console.error("[screening] Failed to generate donation QR code", error);
  }
}
