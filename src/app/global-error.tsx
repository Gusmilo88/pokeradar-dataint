"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const description =
    error instanceof Error && error.message.trim().length > 0
      ? error.message
      : "Falló el marco de la aplicación.";

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#06141c",
          color: "#e7f6f2",
          fontFamily: "sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <p style={{ letterSpacing: "0.16em", fontSize: "0.75rem" }}>ERROR</p>
          <h1 style={{ fontSize: "1.5rem", margin: "0.4rem 0" }}>
            PokéRadar no pudo iniciar
          </h1>
          <p style={{ color: "#b7d4ce" }}>{description}</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: "1rem",
              minHeight: "2.75rem",
              padding: "0 1rem",
              borderRadius: "999px",
              border: "1px solid #8ef6df",
              background: "transparent",
              color: "#e7fff8",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
