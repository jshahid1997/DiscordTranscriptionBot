const { setupVoiceConnection, disconnectFromVoice } = require('../voice/voiceConnection');

async function handleVoiceStateUpdate(oldState, newState) {
  // Get the transcription channel
  const transcriptionChannel = newState.guild.channels.cache.get(process.env.TRANSCRIPTION_CHANNEL_ID);
  if (!transcriptionChannel) {
    console.error('Transcription channel not found!');
    return;
  }

  // Bot's voice state changed
  if (oldState.member.id === oldState.client.user.id) {
    // Bot was disconnected from a voice channel
    if (oldState.channel && !newState.channel) {
      disconnectFromVoice(oldState.guild.id);
    }
    return;
  }

  // User joined a voice channel
  if (!oldState.channel && newState.channel) {
    // Check if there are other members in the channel (excluding bots)
    const humanMembers = newState.channel.members.filter(member => !member.user.bot);
    if (humanMembers.size >= 1) {
      await setupVoiceConnection(newState.channel, transcriptionChannel);
    }
  }
  // User left a voice channel
  else if (oldState.channel && !newState.channel) {
    // Check if there are still other members in the old channel (excluding bots)
    const humanMembers = oldState.channel.members.filter(member => !member.user.bot);
    if (humanMembers.size === 0) {
      disconnectFromVoice(oldState.guild.id);
    }
  }
  // User switched channels
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    // Check old channel
    const oldHumanMembers = oldState.channel.members.filter(member => !member.user.bot);
    if (oldHumanMembers.size === 0) {
      disconnectFromVoice(oldState.guild.id);
    }

    // Check new channel
    const newHumanMembers = newState.channel.members.filter(member => !member.user.bot);
    if (newHumanMembers.size >= 1) {
      await setupVoiceConnection(newState.channel, transcriptionChannel);
    }
  }
}

module.exports = {
  handleVoiceStateUpdate,
}; 