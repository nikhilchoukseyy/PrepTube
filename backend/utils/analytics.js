import { PostHog } from "posthog-node";

const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://app.posthog.com";

const posthogClient = process.env.POSTHOG_KEY
  ? new PostHog(process.env.POSTHOG_KEY, { host: POSTHOG_HOST })
  : null;

export function trackEvent(userId, eventName, properties = {}) {
  const distinctId = String(userId || "").trim();

  if (!posthogClient || !distinctId || !eventName) {
    return;
  }

  try {
    posthogClient.capture({
      distinctId,
      event: eventName,
      properties,
    });
  } catch (error) {
    console.error("PostHog capture failed:", error.message);
  }
}

export function flushAnalytics() {
  if (!posthogClient) {
    return Promise.resolve();
  }

  try {
    return Promise.resolve(posthogClient.shutdown()).catch((error) => {
      console.error("PostHog shutdown failed:", error.message);
    });
  } catch (error) {
    console.error("PostHog shutdown failed:", error.message);
    return Promise.resolve();
  }
}
