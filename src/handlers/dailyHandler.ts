import { TextChannel, User, Message } from "discord.js";
import { DailyService } from "../services/DailyService";
import { manageSpeakerTurn } from "./speakerHandler";
import { createOrGetLogChannel } from "../utils/channelUtils";

export async function handleDailyStart(
    channel: TextChannel, 
    dailyService: DailyService,
    reason: string
): Promise<void> {
    console.log('[Daily] Starting daily session');
    const participants = Array.from(dailyService.session.participants);
    
    if (reason === 'started_manually' || participants.length > 0) {
        await channel.bulkDelete(await channel.messages.fetch());
        
        const participantsNames = dailyService.getParticipantsList();
        console.log(`[Daily] Participants: ${participantsNames}`);
        await channel.send(`A daily começou! Participantes: ${participantsNames}`);
        
        if (participants.length === 0) {
            console.log('[Daily] No participants joined');
            await channel.send('Ninguém entrou na daily. Reunião encerrada.');
            return;
        }

        await startDailyTurns(channel, dailyService, participants);
    } else {
        console.log('[Daily] No participants joined');
        await channel.send('Ninguém entrou na daily. Reunião encerrada.');
    }
}

async function startDailyTurns(
    channel: TextChannel,
    dailyService: DailyService,
    participants: User[]
): Promise<void> {
    let currentIndex = 0;
    console.log('[Daily] Starting turns');

    const messageCollector = channel.createMessageCollector({
        filter: (msg: Message) => {
            const isParticipant = participants.some(user => user.id === msg.author.id);
            if (isParticipant && msg.content) {
                console.log(`[Daily] Message collected from ${msg.author.username}: "${msg.content}"`);
            }
            return isParticipant && msg.content.length > 0;
        }
    });

    const cleanup = () => {
        console.log('[Daily] Stopping message collector');
        messageCollector.stop();
    };

    messageCollector.on('collect', async (msg: Message) => {
        if (msg.content) {
            console.log(`[Daily] Logging message from ${msg.author.username}: "${msg.content}"`);
            try {
                await dailyService.logMessage(msg.author.username, msg.content.trim());
                console.log('[Daily] Current session log:', 
                    dailyService.session.messagesLog.map(entry => `"${entry}"`));
            } catch (error) {
                console.error('[Daily] Error logging message:', error);
            }
        }
    });

    const handleTurn = async () => {
        if (currentIndex >= participants.length) {
            console.log('[Daily] All turns completed');
            cleanup();
            await finishDaily(channel, dailyService);
            return;
        }

        const currentSpeaker = participants[currentIndex];
        console.log(`[Daily] Current speaker: ${currentSpeaker.username}`);
        
        await manageSpeakerTurn(
            channel, 
            dailyService, 
            currentSpeaker, 
            participants,
            async () => {
                currentIndex++;
                await handleTurn();
            }
        );
    };

    await handleTurn();
}

async function finishDaily(
    channel: TextChannel,
    dailyService: DailyService
): Promise<void> {
    console.log('[Daily] Finishing daily session');
    
    if (dailyService.session.messagesLog.length === 0 || 
        dailyService.session.messagesLog.every(entry => !entry.includes(':'))) {
        console.log('[Daily] Warning: No valid messages were logged');
        await channel.send('Aviso: Nenhuma mensagem foi registrada durante a daily.');
        dailyService.resetSession();
        return;
    }
    
    await channel.send('A daily foi concluída. Bom trabalho a todos!');
    
    console.log('[Daily] Final session log:', 
        dailyService.session.messagesLog.map(entry => `"${entry}"`));
    
    try {
        const filePath = await dailyService.saveSessionLog(channel.guild.id);
        console.log(`[Daily] Session log saved to: ${filePath}`);
        
        const logChannel = await createOrGetLogChannel(channel);
        await logChannel.send({ 
            content: 'Histórico da última daily:',
            files: [filePath]
        });
    } catch (error) {
        console.error('[Daily] Error saving session log:', error);
        await channel.send('Houve um erro ao salvar o histórico da daily.');
    }

    dailyService.resetSession();
    console.log('[Daily] Session reset completed');
}