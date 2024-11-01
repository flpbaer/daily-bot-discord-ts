import { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection,
    REST, 
    Routes,
    ApplicationCommandDataResolvable
  } from 'discord.js';
  import * as fs from 'fs';
  import * as path from 'path';
  import dotenv from 'dotenv';
  
  dotenv.config();
  
  interface BotConfig {
    token: string;
    clientId: string;
    guildId: string;
  }
  
  declare module 'discord.js' {
    export interface Client {
      commands: Collection<string, any>;
    }
  }
  
  const config: BotConfig = {
    token: process.env.BOT_TOKEN!,
    clientId: process.env.CLIENT_ID!,
    guildId: process.env.GUILD_ID!
  };
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages
    ],
    partials: [
      Partials.Message,
      Partials.Channel
    ]
  });
  
  client.commands = new Collection();
  
  async function registerCommands() {
    const commands: ApplicationCommandDataResolvable[] = [
      {
        name: 'daily',
        description: 'Inicia uma daily meeting.'
      },
      {
        name: 'clear',
        description: 'Limpa todas as mensagens do canal atual.'
      }
    ];
  
    const rest = new REST({ version: '10' }).setToken(config.token);
  
    try {
      console.log('Registrando comandos...');
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log('Comandos registrados!');
    } catch (error) {
      console.error('Erro ao registrar comandos:', error);
    }
  }
  
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.ts'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
  }
  
  client.once('ready', () => {
    console.log(`Bot online como ${client.user?.tag}`);
    registerCommands();
  });
  
  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
  
    const command = client.commands.get(interaction.commandName);
    if (command) {
      try {
        console.log(`Executando comando: ${interaction.commandName}`);
        await command.execute(interaction, client);
      } catch (error) {
        console.error('Erro ao executar o comando:', error);
        await interaction.reply({ 
          content: 'Ocorreu um erro ao executar este comando.',
          ephemeral: true 
        });
      }
    }
  });
  
  process.on('unhandledRejection', error => {
    console.error('Erro não tratado:', error);
  });
  
  client.login(config.token);