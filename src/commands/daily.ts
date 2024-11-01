import { 
    ButtonInteraction,
    Client,
    CommandInteraction,
    SlashCommandBuilder,
    TextChannel
  } from 'discord.js';
  import { DailyService } from '../services/DailyService';
import { BUTTONS, DEFAULT_CONFIG } from '../constants/constants';
import { handleDailyStart } from '../handlers/dailyHandler';
  
  export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Inicia uma daily meeting.');
  
  export async function execute(
    interaction: CommandInteraction, 
    client: Client
  ): Promise<void> {
    const dailyService = new DailyService();
    
    await interaction.reply({
      content: 'Iniciando a daily... Clique no botão para participar!',
      ephemeral: true
    });
  
    const channel = await client.channels.fetch(DEFAULT_CONFIG.dailyChannelId) as TextChannel;
  
    if (interaction.channelId !== channel.id) {
      await interaction.followUp({ 
        content: 'Este comando só pode ser usado no canal daily.',
        ephemeral: true 
      });
      return;
    }
  
    const row = await dailyService.createButtons();
    
    const message = await channel.send({
      content: 'Clique no botão para participar da daily. A reunião começará automaticamente em 2 minutos ou manualmente quando todos entrarem.',
      components: [row]
    });
  
    const participantMessage = await channel.send(
      'Participantes atuais: (Nenhum)'
    );
  
    const collector = message.createMessageComponentCollector({ 
      time: DEFAULT_CONFIG.autoStartDelay 
    });
  
    collector.on('collect', async (i: ButtonInteraction) => {
      if (i.customId === BUTTONS.JOIN.id) {
        dailyService.addParticipant(i.user);
        console.log(`Usuário ${i.user.tag} entrou na daily`);
  
        await participantMessage.edit(
          `Participantes atuais: ${dailyService.getParticipantsList()}`
        );
        
        await i.reply({ 
          content: 'Você entrou na daily!',
          ephemeral: true 
        });
      } else if (i.customId === BUTTONS.START.id) {
        collector.stop('started_manually');
      }
    });
  
    collector.on('end', async (collected, reason) => {
      await handleDailyStart(channel, dailyService, reason);
    });
  }
  