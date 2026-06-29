// Generates a URL-safe unique token for each survey send link.
// Uses crypto.randomUUID() — available on Node.js 14.17+ and all modern browsers.
export function generateSurveyToken(): string {
  return crypto.randomUUID().replace(/-/g, "")
}
