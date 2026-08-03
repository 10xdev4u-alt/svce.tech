export type AlertType = 'postponed' | 'venue-change' | 'cancelled' | 'general';

export interface EventAlert {
  message: string;
  type?: AlertType;
}

export interface Event {
  eventName: string;
  eventDescription: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM 24h
  eventEndDate?: string; // YYYY-MM-DD (multi-day)
  eventEndTime?: string; // HH:MM 24h
  eventVenue: string;
  eventLink: string;
  location: string;
  communityName: string;
  communityLogo?: string;
  alert?: EventAlert;
}

export interface Community {
  name: string;
  description?: string;
  logo?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  discord?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  telegram?: string;
}
