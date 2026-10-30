export type APIResponse<T = unknown, E = unknown> =
  | {
      success: true;
      message: string;
      data: T;
      details: null;
      errors: null;
    }
  | {
      success: false;
      message: string;
      data: null;
      details: null;
      errors: E;
    };
// | { details: string };
