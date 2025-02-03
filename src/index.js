require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { setupVoiceConnection } = require('./voice/voiceConnection');
const { registerCommands } = require('./commands/commandHandler');
const { handleVoiceStateUpdate } = require('./events/voiceStateHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Handle ready event
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  registerCommands(client);
});

// Handle interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing this command!',
      ephemeral: true,
    });
  }
});

// Handle voice state updates
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN); 