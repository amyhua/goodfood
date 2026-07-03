import Constants from "expo-constants";

/**
 * Base URL of the goodfood REST API the mobile app reuses (same endpoints as the web app).
 * Order: EXPO_PUBLIC_API_URL env → app.json extra.apiUrl → localhost for a dev machine.
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "http://localhost:3000";
