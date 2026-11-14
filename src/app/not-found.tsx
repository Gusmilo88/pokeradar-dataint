import Link from "next/link";
import "@/components/expedition/encounter.css";

export default function NotFound() {
  return (
    <main className="not-found-screen">
      <div>
        <p className="font-mono text-[11px] tracking-[0.2em] text-phosphor uppercase">PokéRadar</p>
        <p className="not-found-mark" aria-hidden="true">
          <span>4</span>
          <span className="not-found-ball" />
          <span>4</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold">404 — Señal no encontrada</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-quiet">
          Esta frecuencia no pertenece a la expedición.
        </p>
        <Link href="/" className="action-button mt-5 inline-flex items-center justify-center">
          Volver a la expedición
        </Link>
      </div>
    </main>
  );
}
