import { Box, Chip, Paper, Typography } from '@mui/material';

import { CheckInMemo } from '@/components/ui/CheckInMemo';
import { Media } from '@/components/ui/media';

import { WashiTape } from './scrapbookHelpers';

export const FEATURE_EMOJI_MAP: Record<string, string> = {
  Food: '🍕',
  'Non-Alcoholic Drinks': '🧃',
  'Alcoholic Drinks': '🍷',
  Music: '🎵',
  DJ: '🎧',
  'Live Band': '🎸',
  Games: '🎮',
  'Photo Booth': '📸',
  'Surprise Gifts': '🎁',
  'Educational Activities': '📚',
  'Group Activities': '👥',
  Networking: '🤝',
  'Dance Floor': '💃',
  Workshops: '🔧',
  Art: '🎨',
  Karaoke: '🎤',
  Bonfire: '🔥',
  Fireworks: '🎆',
  Pool: '🏊',
  'Outdoor Seating': '⛱️',
  'Indoor Seating': '🪑',
  Decorations: '🎀',
  'Themed Costumes': '🎭',
  Raffle: '🎟️',
  Trivia: '🧠',
  'Kids Zone': '🧒',
  'Pet-Friendly': '🐾',
  'Open Bar': '🍹',
  'VIP Lounge': '✨',
  Parking: '🅿️',
};
export const DetailsSection = ({
  event,
  isHost,
  displayNeeds,
}: {
  event: any;
  isHost: boolean;
  displayNeeds: any[];
}) => {
  const TAG_DISPLAY: Record<
    string,
    {
      label: string;
      emoji: string;
      bg: string;
      border: string;
      text: string;
      chipBg: string;
    }
  > = {
    featured: {
      label: 'Featured',
      emoji: '⭐',
      bg: '#fef3c7',
      border: '#f59e0b',
      text: '#92400e',
      chipBg: '#fef9c3',
    },
    additional: {
      label: 'Additional',
      emoji: '➕',
      bg: '#dbeafe',
      border: '#3b82f6',
      text: '#1e40af',
      chipBg: '#eff6ff',
    },
    extra: {
      label: 'Extra',
      emoji: '🎁',
      bg: '#d1fae5',
      border: '#10b981',
      text: '#065f46',
      chipBg: '#ecfdf5',
    },
  };
  const features = event.features || [];
  const grouped: Record<string, { name: string; tag: string }[]> = {};
  features.forEach((f: { name: string; tag: string }) => {
    if (!grouped[f.tag]) grouped[f.tag] = [];
    grouped[f.tag].push(f);
  });
  const tagOrder = ['featured', 'additional', 'extra'];

  const allChips = tagOrder.flatMap((tag) => {
    const items = grouped[tag];
    if (!items || items.length === 0) return [];
    const cfg = TAG_DISPLAY[tag];
    return items.map((f: { name: string; tag: string }, idx: number) => ({
      ...f,
      cfg,
      idx,
    }));
  });

  return null;
};
