export type IntegrityMode = "mock" | "real";

function readIntegrityMode(): IntegrityMode {
  return process.env.EXPO_PUBLIC_INTEGRITY_MODE === "real" ? "real" : "mock";
}

export const mobileConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  integrityMode: readIntegrityMode(),
  requireNativeRuntime:
    process.env.EXPO_PUBLIC_REQUIRE_NATIVE_RUNTIME === "true",
} as const;
