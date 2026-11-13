export class PokeApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "PokeApiError";
    this.status = status;
  }
}
