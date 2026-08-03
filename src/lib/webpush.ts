// Web push utilities — VAPID configuration, payload building, subscription validation.
import webpush from 'web-push';

const isProduction = process.env.NODE_ENV === 'production';
let configured = false;

/**
 * Lazily configure VAPID details. Must be called inside the request path, not at
 * module scope — otherwise the production build validates keys at build time and
 * crashes route collection.
 */
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) {
    webpush.setVapidDetails(
      process.env.WEB_PUSH_CONTACT || 'https://svce-tech.vercel.app/',
      publicKey,
      privateKey
    );
    configured = true;
  }
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface WebPushError extends Error {
  statusCode?: number;
}

/**
 * Validate a subscription object shape (defense against malformed requests).
 */
export function isValidSubscription(subscription: unknown): subscription is PushSubscription {
  return Boolean(
    subscription &&
      typeof subscription === 'object' &&
      'endpoint' in subscription &&
      typeof (subscription as PushSubscription).endpoint === 'string' &&
      'keys' in subscription &&
      typeof (subscription as PushSubscription).keys === 'object' &&
      (subscription as PushSubscription).keys !== null &&
      typeof (subscription as PushSubscription).keys.p256dh === 'string' &&
      typeof (subscription as PushSubscription).keys.auth === 'string'
  );
}

/**
 * Send a notification to a single subscription.
 * Returns { ok, gone } — 'gone' means the subscription is dead (410) and should be pruned.
 */
export async function sendNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: boolean; gone: boolean }> {
  if (!isProduction) {
    console.log('[DEV] Notifications disabled outside production:', payload.title);
    return { ok: false, gone: false };
  }

  try {
    ensureConfigured();
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        url: payload.url || '/'
      })
    );
    return { ok: true, gone: false };
  } catch (error) {
    const statusCode = (error as WebPushError)?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      console.log('Subscription expired (410/404), should be pruned:', subscription.endpoint);
      return { ok: false, gone: true };
    }
    console.error('Error sending notification:', error);
    return { ok: false, gone: false };
  }
}

/**
 * Send to many subscriptions in parallel, returning counts and dead endpoints to prune.
 */
export async function sendBulkNotifications(
  subscriptions: PushSubscription[],
  payload: { title: string; body: string; url?: string }
): Promise<{ success: number; failed: number; prune: PushSubscription[] }> {
  if (!isProduction) {
    console.log('[DEV] Bulk notifications disabled outside production');
    return { success: 0, failed: 0, prune: [] };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendNotification(sub, payload))
  );

  const success = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
  const failed = results.length - success;
  const prune = subscriptions.filter(
    (_, i) => results[i].status === 'fulfilled' && results[i].value.gone
  );

  return { success, failed, prune };
}
