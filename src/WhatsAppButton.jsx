import React from "react";

/** Número internacional sin + ni espacios (Cuba) */
const SUPPORT_WHATSAPP = "5354732279";

const DEFAULT_MESSAGE = "Hola, necesito soporte con RobLoren.";

export default function WhatsAppButton() {
  const href = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    DEFAULT_MESSAGE
  )}`;

  return (
    <a
      className="whatsapp-float"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Soporte por WhatsApp"
      title="Soporte por WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        width="28"
        height="28"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M19.11 17.37c-.26-.13-1.52-.75-1.76-.83-.24-.09-.41-.13-.58.13-.17.26-.67.83-.82 1-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.1-1.29-.78-.7-1.3-1.56-1.45-1.82-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.5-.42-.43-.58-.44h-.5c-.17 0-.45.06-.68.32-.23.26-.9.88-.9 2.14s.92 2.48 1.05 2.65c.13.17 1.8 2.75 4.37 3.85 1.64.71 2.28.76 3.1.64.47-.07 1.52-.62 1.74-1.22.21-.6.21-1.11.15-1.22-.07-.11-.24-.17-.5-.3z" />
        <path d="M16.02 3C9.39 3 4 8.39 4 15.02c0 2.11.55 4.16 1.6 5.98L4 29l8.2-2.15a11.96 11.96 0 0 0 3.82.62c6.63 0 12.02-5.39 12.02-12.02C28.04 8.39 22.65 3 16.02 3zm0 21.9c-1.3 0-2.57-.34-3.68-.98l-.26-.15-4.86 1.27 1.3-4.74-.17-.28a9.86 9.86 0 0 1-1.51-5.25c0-5.45 4.43-9.88 9.88-9.88s9.88 4.43 9.88 9.88-4.43 9.88-9.88 9.88z" />
      </svg>
    </a>
  );
}
