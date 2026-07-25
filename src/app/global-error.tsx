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
          background: "#F8FAFC",
          color: "#0F172A",
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.14em", color: "#2563EB" }}>
            SYSTEM ERROR
          </p>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>Something broke</h1>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            {error.message || "Please reload the page."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#1E3A8A",
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
