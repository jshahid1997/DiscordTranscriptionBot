const { SlashCommandBuilder } = require('discord.js');
const { disconnectFromVoice } = require('../../voice/voiceConnection');
const { getTranscriptions } = require('../../utils/transcription');
const { generateSummary } = require('../../utils/summary');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leaves the voice channel and sends transcription summary'),

  async execute(interaction) {
    // Check if bot is in a voice channel
    const voiceChannel = interaction.guild.members.me.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: 'I am not in a voice channel!',
        ephemeral: true,
      });
    }

    try {
      // First, get all transcriptions
      const transcriptions = await getTranscriptions(interaction.guild.id);
      
      // Disconnect from voice
      disconnectFromVoice(interaction.guild.id);

      if (!transcriptions || transcriptions.length === 0) {
        return interaction.reply({
          content: `Left ${voiceChannel.name}. No transcriptions were recorded.`,
        });
      }

      // Format transcriptions for display
      const formattedTranscriptions = transcriptions
        .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.username}: ${t.text}`)
        .join('\n\n');

      // Generate a summary of the entire conversation
      const conversationText = transcriptions
        .map(t => `${t.username}: ${t.text}`)
        .join('\n');
      const summary = await generateSummary(conversationText);

      // Send transcriptions in an embed
      await interaction.reply({
        embeds: [{
          title: `Voice Channel Transcription - ${voiceChannel.name}`,
          description: formattedTranscriptions,
          fields: summary ? [
            {
              name: 'Conversation Summary',
              value: summary,
            },
          ] : [],
          color: 0x0099ff,
          timestamp: new Date(),
          footer: {
            text: `Session duration: ${formatDuration(new Date() - voiceChannel.joinedTimestamp)}`,
          },
        }],
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while processing the transcriptions!',
        ephemeral: true,
      });
    }
  },
};

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);
  
  return parts.join(' ') || '0s';
} 