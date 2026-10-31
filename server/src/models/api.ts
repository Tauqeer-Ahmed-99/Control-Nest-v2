import { NextResponse } from "next/server";

export class APIResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T | null | undefined;
  errors?: unknown | null | undefined;

  constructor({
    success = true,
    message,
    data,
    errors,
  }:
    | {
        success?: true;
        message: string;
        data: T;
        errors?: null;
      }
    | {
        success?: false;
        message: string;
        data?: null;
        errors: unknown;
      }) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static fromData<T>({
    message,
    data,
    statusCode = 200,
  }: {
    message: string;
    data: T;
    statusCode?: number;
  }) {
    return NextResponse.json(
      new APIResponse({ success: true, data, message }),
      { status: statusCode },
    );
  }

  static fromError(error: unknown) {
    if (error instanceof APIError) {
      const { success, message, errors, statusCode } = error;
      return NextResponse.json(
        new APIResponse({ success, message, errors, data: undefined }),
        {
          status: statusCode,
        },
      );
    }

    if (error instanceof Error) {
      const { message } = error;
      return NextResponse.json(
        new APIResponse({ success: false, message, errors: null }),
        { status: 500 },
      );
    }

    return NextResponse.json(
      new APIResponse({
        success: false,
        message: "Server Error",
        errors: null,
      }),
      { status: 500 },
    );
  }
}

export class APIError<T> extends Error {
  success: boolean;
  statusCode: number;
  errors?: T;

  constructor({
    message,
    errors,
    success = false,
    statusCode = 500,
  }: {
    message: string;
    errors?: T;
    success?: boolean;
    statusCode?: number;
  }) {
    super(message);
    this.success = success;
    this.errors = errors;
    this.statusCode = statusCode;
  }
}
