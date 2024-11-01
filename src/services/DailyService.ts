import { 
    ActionRowBuilder, 
    ButtonBuilder,
    ChannelType,
    PermissionsBitField,
    TextChannel,
    ThreadChannel,
    User
  } from 'discord.js';
  import fs from 'fs/promises';
  import path from 'path';
import { BUTTONS, DEFAULT_CONFIG } from '../constants/constants';
import { DailyConfig, DailySession } from '../types/types';
  
  export class DailyService {
    public session: DailySession;
    public config: DailyConfig;
    
    constructor(config: DailyConfig = DEFAULT_CONFIG) {
      this.config = config;
      this.session = this.createNewSession();
    }
  
    private createNewSession(): DailySession {
      return {
        participants: new Set<User>(),
        messagesLog: [],
        isActive: false
      };
    }
  
    public addParticipant(user: User): void {
      this.session.participants.add(user);
    }
  
    public getParticipantsList(): string {
      return Array.from(this.session.participants)
        .map(user => user.username)
        .join(', ') || 'Nenhum';
    }
  
    public async createButtons(): Promise<ActionRowBuilder<ButtonBuilder>> {
      const joinButton = new ButtonBuilder()
        .setCustomId(BUTTONS.JOIN.id)
        .setLabel(BUTTONS.JOIN.label)
        .setStyle(BUTTONS.JOIN.style);
  
      const startButton = new ButtonBuilder()
        .setCustomId(BUTTONS.START.id)
        .setLabel(BUTTONS.START.label)
        .setStyle(BUTTONS.START.style);
  
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(joinButton, startButton);
    }
  
    public async saveSessionLog(guildId: string): Promise<string> {
      const fileName = `daily_log_${Date.now()}.txt`;
      const filePath = path.join(__dirname, '../logs', fileName);
      
      await fs.writeFile(filePath, this.session.messagesLog.join('\n'), 'utf8');
      
      return filePath;
    }
  
    public async createDiscussionThread(
      channel: TextChannel,
      speaker: User
    ): Promise<ThreadChannel> {
      return await channel.threads.create({
        name: `Discussão de ${speaker.username}`,
        autoArchiveDuration: 1440,
        reason: 'Discussão sobre pontos levantados'
      });
    }
  
    public logMessage(username: string, content: string): void {
      this.session.messagesLog.push(`${username}: ${content}`);
    }
  
    public resetSession(): void {
      this.session = this.createNewSession();
    }
  }