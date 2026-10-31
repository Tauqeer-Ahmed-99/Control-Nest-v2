type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

function tryCatch<T, E = Error>(
  promise: Promise<T>,
  defaultValue?: NoInfer<T>,
): Promise<Result<T, E>>;

function tryCatch<F extends () => unknown, E = Error>(
  callback: F,
  defaultValue?: NoInfer<Awaited<ReturnType<F>>>,
): Promise<Result<Awaited<ReturnType<F>>, E>>;

async function tryCatch(
  input: Promise<unknown> | (() => unknown),
  defaultValue?: unknown,
): Promise<Result<unknown, Error>> {
  try {
    const result = typeof input === "function" ? input() : input;

    return {
      data: await result,
      error: null,
    };
  } catch (error) {
    if (defaultValue !== undefined) {
      return {
        data: defaultValue,
        error: null,
      };
    }

    return {
      data: null,
      error: error as Error,
    };
  }
}

export default tryCatch;
