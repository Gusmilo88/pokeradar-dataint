import { StatusPanel } from "@/components/states/status-panel";

export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <StatusPanel
        tone="loading"
        title="Preparando la expedición"
        description="El radar y el mapa de Argentina se están armando."
      />
    </div>
  );
}
