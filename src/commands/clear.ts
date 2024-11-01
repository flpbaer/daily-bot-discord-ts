import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction,
    TextChannel,
    PermissionsBitField
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens do canal atual')
    .addIntegerOption(option => 
        option
            .setName('quantidade')
            .setDescription('Número de mensagens para deletar (máximo 100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({
                content: 'Você não tem permissão para usar este comando.',
                ephemeral: true
            });
            return;
        }

        if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
            await interaction.reply({
                content: 'Este comando só pode ser usado em canais de texto.',
                ephemeral: true
            });
            return;
        }

        const channel = interaction.channel;

        if (!channel.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            await interaction.reply({
                content: 'O bot não tem permissão para deletar mensagens neste canal.',
                ephemeral: true
            });
            return;
        }

        const amount = interaction.options.getInteger('quantidade') || 100;

        await interaction.deferReply({ ephemeral: true });

        try {
            const messages = await channel.messages.fetch({ limit: amount });
            const messagesToDelete = messages.filter(msg => {
                const messageAge = Date.now() - msg.createdTimestamp;
                const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
                return messageAge < fourteenDaysInMs;
            });

            if (messagesToDelete.size === 0) {
                await interaction.editReply({
                    content: 'Não há mensagens elegíveis para deletar (mensagens mais antigas que 14 dias não podem ser deletadas em massa).'
                });
                return;
            }

            // Deletar mensagens
            const deletedCount = await channel.bulkDelete(messagesToDelete, true)
                .then(deleted => deleted.size);

            if (deletedCount === 0) {
                await interaction.editReply({
                    content: 'Não foi possível deletar nenhuma mensagem.'
                });
                return;
            }

            // Mensagem de sucesso
            const pluralSuffix = deletedCount === 1 ? '' : 's';
            await interaction.editReply({
                content: `✅ ${deletedCount} mensagem${pluralSuffix} ${deletedCount === 1 ? 'foi deletada' : 'foram deletadas'} com sucesso!`
            });

        } catch (error) {
            console.error('Erro ao deletar mensagens:', error);
            await interaction.editReply({
                content: 'Ocorreu um erro ao tentar deletar as mensagens.'
            });
        }

    } catch (error) {
        console.error('Erro ao executar comando clear:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: 'Ocorreu um erro ao executar o comando.',
                ephemeral: true
            });
        } else {
            await interaction.editReply({
                content: 'Ocorreu um erro ao executar o comando.'
            });
        }
    }
}