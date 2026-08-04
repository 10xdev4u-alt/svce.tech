'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRinging, X } from '@phosphor-icons/react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr;
}

export default function PushSubscribe() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkStatus() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setIsSupported(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    } catch {
      setIsSupported(false);
    }
  }

  async function subscribe() {
    setIsLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Permission denied');

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const response = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save subscription');
      }

      const { subscriptionId } = await response.json();
      localStorage.setItem('svce-subscription-id', subscriptionId);
      setIsSubscribed(true);
      setPromptOpen(false);
    } catch (err) {
      console.error('Subscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/remove-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        }).catch(() => {});
      }
      localStorage.removeItem('svce-subscription-id');
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkStatus();
    if (!VAPID_PUBLIC_KEY) setIsSupported(false);
    if (process.env.NODE_ENV !== 'production') return;
    const timer = setTimeout(() => {
      if (!isSubscribed) setPromptOpen(true);
    }, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSupported) return null;

  return (
    <>
      {/* Prompt — rendered via portal to <body> so the sticky header's
          backdrop-filter can't hijack its fixed positioning */}
      {promptOpen &&
        !isSubscribed &&
        createPortal(
          <div className="fixed bottom-5 right-5 z-[60] w-80 rounded-2xl border border-aurora-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aurora-100 text-aurora-700">
                <Bell size={18} weight="fill" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold text-ink">Stay in the loop</p>
                <p className="mt-0.5 text-xs text-ink/60">
                  Get notified when new events and opportunities are added.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPromptOpen(false)}
                className="text-ink/40 transition-colors hover:text-ink"
                aria-label="Dismiss notification prompt"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={subscribe}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-aurora-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-aurora-700 disabled:opacity-50"
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </button>
              <button
                type="button"
                onClick={() => setPromptOpen(false)}
                className="flex-1 rounded-lg bg-ink/5 px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/10"
              >
                Later
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Bell button */}
      <button
        type="button"
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isSubscribed
            ? 'bg-aurora-100 text-aurora-800 hover:bg-aurora-200'
            : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
        }`}
        title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
      >
        {isSubscribed ? (
          <BellRinging size={18} weight="fill" />
        ) : (
          <Bell size={18} weight={isLoading ? 'bold' : 'regular'} />
        )}
        <span className="hidden sm:inline">{isSubscribed ? 'On' : 'Notify me'}</span>
      </button>

      {error &&
        createPortal(
          <div className="fixed bottom-5 right-5 z-[60] w-80 rounded-2xl border border-red-200 bg-white p-4 shadow-2xl">
            <p className="text-sm font-semibold text-red-700">Something went wrong</p>
            <p className="mt-1 text-xs text-ink/60">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
            >
              Dismiss
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
