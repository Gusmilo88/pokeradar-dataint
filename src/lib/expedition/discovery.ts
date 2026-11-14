/**
 * El estado vive junto al id estable del encuentro, no junto a la posición en un array.
 */
export const DISCOVERY_STATES = ["undiscovered", "seen", "caught"] as const;

export type DiscoveryState = (typeof DISCOVERY_STATES)[number];

export interface DiscoveryRecord {
  encounterId: string;
  state: DiscoveryState;
}

export function undiscovered(encounterId: string): DiscoveryRecord {
  return { encounterId, state: "undiscovered" };
}
