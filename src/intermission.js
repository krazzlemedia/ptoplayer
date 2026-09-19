import { CONFIG } from "./config.js";
import { formatCountdown, getCountdownParts, padTime, setText, splitMultiline } from "./utils.js";

export function renderDocumentaryTitle(element, title = CONFIG.documentaryTitle) {
  if (!element) {
    return;
  }

  const words = String(title).trim().split(/\s+/);
  element.replaceChildren();

  const article = document.createElement("span");
  article.className = "doc-title__the";

  const hero = document.createElement("span");
  hero.className = "doc-title__promise";

  const rest = document.createElement("span");
  rest.className = "doc-title__rest";

  if (words.length >= 3 && words[0].toLowerCase() === "the") {
    article.textContent = words[0];
    hero.textContent = words[1].toUpperCase();
    rest.textContent = words.slice(2).join(" ").toUpperCase();
    element.append(article, hero, rest);
    return;
  }

  if (words.length >= 2) {
    article.textContent = words[0];
    hero.textContent = words.slice(1).join(" ").toUpperCase();
    element.append(article, hero);
    return;
  }

  hero.textContent = title.toUpperCase();
  element.append(hero);
}

export function updateCountdownClock(element, remainingMs, { showSeconds = true } = {}) {
  if (!element) {
    return getCountdownParts(remainingMs);
  }

  const parts = getCountdownParts(remainingMs);
  const minutesNode = element.querySelector("[data-countdown-minutes]");
  const secondsNode = element.querySelector("[data-countdown-seconds]");
  const separatorNode = element.querySelector("[data-countdown-separator]");

  if (minutesNode && secondsNode) {
    if (!showSeconds && parts.totalSeconds >= 60) {
      minutesNode.textContent = padTime(Math.ceil(parts.totalSeconds / 60));
      secondsNode.textContent = "min";
      if (separatorNode) {
        separatorNode.hidden = true;
      }
    } else {
      const displayMinutes = parts.hours > 0 ? parts.hours * 60 + parts.minutes : parts.minutes;
      minutesNode.textContent = padTime(displayMinutes);
      secondsNode.textContent = padTime(parts.seconds);
      if (separatorNode) {
        separatorNode.hidden = false;
      }
    }
  } else {
    setText(element, formatCountdown(remainingMs, { showSeconds }));
  }

  element.setAttribute("aria-hidden", "true");
  return parts;
}

export function renderMultiline(element, value) {
  if (!element) {
    return;
  }

  element.replaceChildren(
    ...splitMultiline(value).map((line) => {
      const span = document.createElement("span");
      span.textContent = line;
      return span;
    })
  );
}

export function renderStoneLegend(element, lines = CONFIG.stoneLegend) {
  if (!element || !Array.isArray(lines)) {
    return;
  }

  element.replaceChildren(
    ...lines.map((line) => {
      const span = document.createElement("span");
      span.textContent = line;
      return span;
    })
  );
}
