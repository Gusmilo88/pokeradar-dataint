/**
 * Presencia del sprite en el escenario.
 * Sale de la fase que ya conduce la Pokébola. No tiene un reloj propio.
 */
export type SceneReel = "throw" | "absorb" | "drop" | "resist" | "flash" | "still";

export type PerchPose = "shown" | "absorb" | "hidden";

export function perchPose(input: {
  caught: boolean;
  status: "idle" | "running" | "done" | "aborted";
  reel: SceneReel;
  reduced: boolean;
  step: number;
}): PerchPose {
  if (input.caught || input.status === "done") {
    return "hidden";
  }
  if (input.status !== "running") {
    return "shown";
  }
  if (input.reduced) {
    return input.step > 0 ? "hidden" : "shown";
  }
  if (input.reel === "absorb") {
    return "absorb";
  }
  if (input.reel === "drop" || input.reel === "resist" || input.reel === "flash") {
    return "hidden";
  }
  return "shown";
}
