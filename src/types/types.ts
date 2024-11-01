import { User } from "discord.js";

export interface DailyConfig {
  dailyChannelId: string;
  maxDailyDuration: number;
  maxTurnDuration: number;
  maxDiscussionDuration: number;
  autoStartDelay: number;
}

export interface DailySession {
  participants: Set<User>;
  currentSpeaker?: User;
  messagesLog: string[];
  isActive: boolean;
}
