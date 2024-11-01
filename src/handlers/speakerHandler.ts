import { 
    TextChannel, 
    User, 
    ButtonBuilder, 
    ActionRowBuilder 
  } from 'discord.js';
  import { DailyService } from '../services/DailyService';
import { BUTTONS } from '../constants/constants';
  
  export async function manageSpeakerTurn(
    channel: TextChannel,
    dailyService: DailyService,
    currentSpeaker: User,
    participants: User[],
    onTurnComplete: () => Promise<void>
  ): Promise<void> {
    await channel.send(`${currentSpeaker.username}, é a sua vez de falar.`);
  
    // Gerenciar permissões
    for (const user of participants) {
      await channel.permissionOverwrites.edit(user, { 
        SendMessages: user.id === currentSpeaker.id 
      });
    }
  
    const discussButton = new ButtonBuilder()
      .setCustomId(BUTTONS.END_TURN.id)
      .setLabel(BUTTONS.END_TURN.label)
      .setStyle(BUTTONS.END_TURN.style);
  
    const discussRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(discussButton);
  
    const discussMessage = await channel.send({
      content: `${currentSpeaker.username}, clique no botão abaixo quando terminar.`,
      components: [discussRow]
    });
  
    const discussCollector = discussMessage.createMessageComponentCollector({ 
      time: dailyService.config.maxTurnDuration 
    });
  
    discussCollector.on('collect', async (i) => {
      if (i.customId === BUTTONS.END_TURN.id && i.user.id === currentSpeaker.id) {
        await handleDiscussion(
          channel,
          dailyService,
          currentSpeaker,
          onTurnComplete
        );
        discussCollector.stop();
      } else {
        await i.reply({ 
          content: 'Apenas o participante atual pode abrir a discussão.',
          ephemeral: true 
        });
      }
    });
  
    discussCollector.on('end', async (collected) => {
      if (collected.size === 0) {
        await channel.send(
          `${currentSpeaker.username} não concluiu em tempo. Passando para o próximo.`
        );
        await onTurnComplete();
      }
    });
  }
  
  async function handleDiscussion(
    channel: TextChannel,
    dailyService: DailyService,
    currentSpeaker: User,
    onTurnComplete: () => Promise<void>
  ): Promise<void> {
    const thread = await dailyService.createDiscussionThread(
      channel,
      currentSpeaker
    );
  
    await thread.send(
      `${currentSpeaker.username}, você abriu uma discussão. Os outros membros podem contribuir aqui.`
    );
  
    const closeButton = new ButtonBuilder()
      .setCustomId(BUTTONS.CLOSE_DISCUSSION.id)
      .setLabel(BUTTONS.CLOSE_DISCUSSION.label)
      .setStyle(BUTTONS.CLOSE_DISCUSSION.style);
  
    const closeRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(closeButton);
  
    const closeMessage = await thread.send({
      content: `Clique para encerrar a discussão, ${currentSpeaker.username}.`,
      components: [closeRow]
    });
  
    const closeCollector = closeMessage.createMessageComponentCollector({ 
      time: dailyService.config.maxDiscussionDuration 
    });
  
    closeCollector.on('collect', async (i) => {
      if (i.customId === BUTTONS.CLOSE_DISCUSSION.id && 
          i.user.id === currentSpeaker.id) {
        await i.update({ 
          content: 'Discussão encerrada.',
          components: [] 
        });
        await thread.setArchived(true);
        await onTurnComplete();
      } else {
        await i.reply({ 
          content: 'Apenas o participante atual pode encerrar a discussão.',
          ephemeral: true 
        });
      }
    });
  
    closeCollector.on('end', async (collected) => {
      if (collected.size === 0) {
        await thread.send(
          'A discussão foi encerrada automaticamente por inatividade.'
        );
        await thread.setArchived(true);
        await onTurnComplete();
      }
    });
  }