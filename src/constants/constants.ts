import { ButtonStyle } from 'discord.js';
import { DailyConfig } from '../types/types';

export const BUTTONS = {
  JOIN: {
    id: 'join_daily',
    label: 'Participar da Daily',
    style: ButtonStyle.Primary
  },
  START: {
    id: 'start_daily',
    label: 'Iniciar Daily',
    style: ButtonStyle.Success
  },
  END_TURN: {
    id: 'end_turn',
    label: 'Encerrar e abrir discussão',
    style: ButtonStyle.Success
  },
  CLOSE_DISCUSSION: {
    id: 'close_discussion',
    label: 'Encerrar discussão',
    style: ButtonStyle.Danger
  }
} as const;

export const DEFAULT_CONFIG: DailyConfig = {
  dailyChannelId: process.env.DAILY_CHANNEL_ID || '',
  maxDailyDuration: 30 * 60 * 1000, // 30 minutes
  maxTurnDuration: 5 * 60 * 1000,   // 5 minutes
  maxDiscussionDuration: 10 * 60 * 1000, // 10 minutes
  autoStartDelay: 2 * 60 * 1000     // 2 minutes
};