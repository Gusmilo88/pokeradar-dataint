import Link from "next/link";
import { StatusPanel } from "@/components/states/status-panel";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <StatusPanel
        tone="empty"
        title="Esta coordenada no existe"
        description="La ruta no forma parte de la expedición."
        action={
          <Link href="/" className="action-button">
            Volver al radar
          </Link>
        }
      />
    </div>
  );
}
