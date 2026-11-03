export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: unknown,
  ) {
    super(message);
  }
  get code(): string | undefined {
    return this.errors &&
      typeof this.errors === "object" &&
      "code" in this.errors
      ? String(this.errors.code)
      : undefined;
  }
}
