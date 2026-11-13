export function formatLatitude(latitude: number): string {
  const hemisphere = latitude >= 0 ? "N" : "S";
  return `${Math.abs(latitude).toFixed(2)}° ${hemisphere}`;
}

export function formatLongitude(longitude: number): string {
  const hemisphere = longitude >= 0 ? "E" : "O";
  return `${Math.abs(longitude).toFixed(2)}° ${hemisphere}`;
}
