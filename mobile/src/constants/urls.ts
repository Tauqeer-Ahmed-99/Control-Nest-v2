export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL!;

if (!SERVER_URL) {
  throw new Error("[ENV]: EXPO_PUBLIC_SERVER_URL is not set in .env");
}
