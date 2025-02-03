const { Collection, REST, Routes } = require('discord.js');
const { join } = require('path');
const fs = require('fs');

async function registerCommands(client) {
  client.commands = new Collection();
  
  const commands = [];
  const commandFiles = fs.readdirSync(join(__dirname, 'commands')).filter(file => file.endsWith('.js') && !file.startsWith('._'));

  for (const file of commandFiles) {
    const command = require(join(__dirname, 'commands', file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  registerCommands,
}; 