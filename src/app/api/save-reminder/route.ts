import { NextRequest, NextResponse } from 'next/server';
import { REMINDER_OFFSETS, reminderId, computeRemindAt, eventKeyFor } from '@/lib/reminders';

const GITHUB_REPO = process.env.GITHUB_REPOSITORY || '10xdev4u-alt/svce.tech';

interface ReminderBody {
  subscriptionId?: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLink?: string;
  offset?: string;
}

/**
 * Saves a per-event reminder by dispatching to a GitHub Actions workflow.
 * The workflow writes one reminder JSON file per (subscription, event) pair
 * in the private subscriptions repo; a cron workflow later sends it.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json(
      { error: 'Push notifications are only enabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as ReminderBody;

    if (!body.subscriptionId || typeof body.subscriptionId !== 'string') {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }
    if (!body.eventName || !body.eventDate || !body.eventTime) {
      return NextResponse.json({ error: 'event fields are required' }, { status: 400 });
    }

    const offset = REMINDER_OFFSETS.find((o) => o.id === body.offset)?.id;
    if (!offset) {
      return NextResponse.json(
        { error: `offset must be one of ${REMINDER_OFFSETS.map((o) => o.id).join(', ')}` },
        { status: 400 }
      );
    }

    const event = {
      eventName: body.eventName,
      eventDate: body.eventDate,
      eventTime: body.eventTime
    };
    const id = reminderId(body.subscriptionId, event);
    const remindAt = computeRemindAt(event, offset);

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
        event_type: 'save_reminder',
        client_payload: {
          reminder: {
            id,
            subscriptionId: body.subscriptionId,
            eventName: body.eventName,
            eventDate: body.eventDate,
            eventTime: body.eventTime,
            eventLink: body.eventLink ?? '',
            offset,
            remindAt,
            eventKey: eventKeyFor(event),
            timestamp: new Date().toISOString()
          }
        }
      })
    });

    if (!response.ok) {
      console.error('GitHub dispatch failed:', await response.text());
      return NextResponse.json({ error: 'Failed to save reminder' }, { status: 502 });
    }

    return NextResponse.json({ success: true, reminderId: id, remindAt }, { status: 201 });
  } catch (error) {
    console.error('Error saving reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
