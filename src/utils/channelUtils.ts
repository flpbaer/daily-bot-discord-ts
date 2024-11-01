import { 
    TextChannel, 
    ChannelType, 
    PermissionsBitField 
  } from 'discord.js';
  
  export async function createOrGetLogChannel(channel: TextChannel) {
    let logChannel = channel.guild.channels.cache.find(
      c => c.name === 'daily-logs'
    ) as TextChannel;
  
    if (!logChannel) {
      logChannel = await channel.guild.channels.create({
        name: 'daily-logs',
        type: ChannelType.GuildText,
        topic: 'Logs das reuniões diárias',
        permissionOverwrites: [
          {
            id: channel.guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.SendMessages],
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ]
      }) as TextChannel;
    }
  
    return logChannel;
  }