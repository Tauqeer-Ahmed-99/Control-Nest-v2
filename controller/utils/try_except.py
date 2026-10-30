
import inspect
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Generic, TypeVar, overload

T = TypeVar("T")
E = TypeVar("E", bound=BaseException)


@dataclass(frozen=True)
class Success(Generic[T]):
    data: T
    error: None = None


@dataclass(frozen=True)
class Failure(Generic[E]):
    data: None
    error: E


type Result[T, E: BaseException] = Success[T] | Failure[E]


@overload
async def try_except(
    input: Awaitable[T],
    default_value: T | None = None,
) -> Result[T, BaseException]: ...


@overload
async def try_except(
    input: Callable[[], T],
    default_value: T | None = None,
) -> Result[T, BaseException]: ...


@overload
async def try_except(
    input: T,
    default_value: T | None = None,
) -> Result[T, BaseException]: ...


async def try_except(
    input: Awaitable[Any] | Callable[[], Any] | Any,
    default_value: Any = None,
) -> Result[Any, BaseException]:
    try:
        result = input() if callable(input) else input

        if inspect.isawaitable(result):
            result = await result

        return Success(data=result)

    except Exception as error:
        print(f"TryExcept: {str(error)}")
        if default_value is not None:
            return Success(data=default_value)

        return Failure(data=None, error=error)
