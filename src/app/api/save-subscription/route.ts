import { NextRequest, NextResponse } from 'next/server';
import { isValidSubscription } from '@/lib/webpush';

const GITHUB_REPO = process.env.GITHUB_REPOSITORY || '10xdev4u-alt/svce.tech';

/**
 * Saves a push subscription by dispatching to a GitHub Actions workflow.
 * The workflow stores each subscription as a JSON file in a private repo.
 */
export async function POST(request: NextRequest) {
  // Only enabled in production (like the rest of the push pipeline)
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json(
      { error: 'Push notifications are only enabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as { subscription?: unknown };
    const subscription = body.subscription;

    if (!isValidSubscription(subscription)) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    const subscriptionId = await hashEndpoint(subscription.endpoint);
    const [owner, repo] = GITHUB_REPO.split('/');

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'svce-tech/1.0'
      },
      body: JSON.stringify({
        event_type: 'save_push_subscription',
        client_payload: {
          subscription: {
            ...subscription,
            subscriptionId,
            timestamp: new Date().toISOString()
          }
        }
      })
    });

    if (!response.ok) {
      console.error('GitHub dispatch failed:', await response.text());
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 502 });
    }

    return NextResponse.json({ success: true, subscriptionId }, { status: 201 });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Deterministic ID for a subscription endpoint (SHA-256).
 * Used as the filename in the subscriptions repo.
 */
async function hashEndpoint(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
