import env from "@/env/vars";
import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";

export const getCurrentWeather = async ({ location }: { location: string }) => {
  const weatherUrl = new URL(
    "/v1/current.json",
    env.variables.WEATHER_API_URL,
  );
  weatherUrl.searchParams.set("key", env.variables.WEATHER_API_KEY);
  weatherUrl.searchParams.set("q", location);
  weatherUrl.searchParams.set("aqi", "no");

  const { data: weatherResponse, error: fetchError } = await tryCatch(
    fetch(weatherUrl, { cache: "no-store" }),
  );

  if (fetchError) {
    throw new APIError({
      message: "Unable to reach the weather provider",
      statusCode: 502,
    });
  }

  if (!weatherResponse.ok) {
    throw new APIError({
      message: "The weather provider could not return weather data",
      statusCode: 502,
    });
  }

  const { data, error: parseError } = await tryCatch(weatherResponse.json());

  if (parseError) {
    throw new APIError({
      message: "Unable to read weather data from the provider",
      statusCode: 502,
    });
  }

  return data;
};
