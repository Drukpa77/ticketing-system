"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#e9f0ec",
          color: "#10231c",
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.14em", color: "#1a6b4a" }}>
            SYSTEM ERROR
          </p>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>Something broke</h1>
          <p style={{ color: "#4d6359", fontSize: 14 }}>
            {error.message || "Please reload the page."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#0f3d2e",
              color: "white",
              border: 0,
              padding: "12px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
