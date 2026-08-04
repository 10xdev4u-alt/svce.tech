import { NextRequest, NextResponse } from 'next/server';
import { reminderId } from '@/lib/reminders';

const GITHUB_REPO = process.env.GITHUB_REPOSITORY || '10xdev4u-alt/svce.tech';

interface CancelBody {
  subscriptionId?: string;
  eventName?: string;
  eventDate?: string;
}

/**
 * Cancels a per-event reminder by dispatching to GitHub Actions,
 * which deletes the matching reminder file from the subscriptions repo.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json(
      { error: 'Push notifications are only enabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as CancelBody;

    if (!body.subscriptionId || !body.eventName || !body.eventDate) {
      return NextResponse.json(
        { error: 'subscriptionId, eventName and eventDate are required' },
        { status: 400 }
      );
    }

    const id = reminderId(body.subscriptionId, {
      eventName: body.eventName,
      eventDate: body.eventDate
    });

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

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
        event_type: 'remove_reminder',
        client_payload: {
          reminder: { id, timestamp: new Date().toISOString() }
        }
      })
    });

    if (!response.ok) {
      console.error('GitHub dispatch failed:', await response.text());
      return NextResponse.json({ error: 'Failed to cancel reminder' }, { status: 502 });
    }

    return NextResponse.json({ success: true, reminderId: id });
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
