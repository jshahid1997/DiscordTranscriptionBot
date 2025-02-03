const { SlashCommandBuilder } = require('discord.js');
const { setupVoiceConnection } = require('../../voice/voiceConnection');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins your voice channel and starts transcribing'),

  async execute(interaction) {
    // Check if user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: 'You need to be in a voice channel first!',
        ephemeral: true,
      });
    }

    // Check if bot has permission to join and speak in the voice channel
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        content: 'I need permissions to join and speak in your voice channel!',
        ephemeral: true,
      });
    }

    try {
      // Get the transcription channel
      const transcriptionChannel = interaction.guild.channels.cache.get(process.env.TRANSCRIPTION_CHANNEL_ID);

      if (!transcriptionChannel) {
        return interaction.reply({
          content: 'Transcription channel not found! Please check the configuration.',
          ephemeral: true,
        });
      }

      await setupVoiceConnection(voiceChannel, transcriptionChannel);
      
      await interaction.reply({
        content: `Joined ${voiceChannel.name} and started transcribing! Transcriptions will be sent to ${transcriptionChannel.name}.`,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while joining the voice channel!',
        ephemeral: true,
      });
    }
  },
}; 