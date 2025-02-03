const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  AudioReceiveStream,
} = require('@discordjs/voice');
const { pipeline } = require('stream');
const { createWriteStream } = require('fs');
const { join } = require('path');
const prism = require('prism-media');
const { transcribeAudio } = require('../utils/transcription');
const { generateSummary } = require('../utils/summary');
const wav = require('node-wav');

const activeConnections = new Map();

async function setupVoiceConnection(channel, textChannel) {
  if (activeConnections.has(channel.guild.id)) {
    return;
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log('Connected to voice channel!');

    const audioPlayer = createAudioPlayer();
    connection.subscribe(audioPlayer);

    const userStreams = new Map();
    
    connection.receiver.speaking.on('start', (userId) => {
      const user = channel.guild.members.cache.get(userId);
      if (!user) return;

      console.log(`${user.displayName} started speaking`);

      const audioStream = connection.receiver.subscribe(userId, {
        end: {
          behavior: 'manual',
        },
      });

      // Create a buffer to store audio data
      let audioBuffer = Buffer.alloc(0);
      const filename = `./recordings/${channel.guild.id}_${userId}_${Date.now()}.wav`;
      
      const opusDecoder = new prism.opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 960
      });

      // Handle opus decoder errors
      opusDecoder.on('error', (error) => {
        console.error('Opus decoder error:', error);
      });

      // Handle audio stream errors
      audioStream.on('error', (error) => {
        console.error('Audio stream error:', error);
      });

      // Process the audio stream
      audioStream.pipe(opusDecoder);

      // Collect decoded audio data
      opusDecoder.on('data', (chunk) => {
        audioBuffer = Buffer.concat([audioBuffer, chunk]);
      });

      // Handle the end of speaking
      const handleEnd = async () => {
        try {
          if (audioBuffer.length === 0) {
            console.log('No audio data received');
            return;
          }

          // Convert raw PCM to WAV format
          const wavData = {
            sampleRate: 48000,
            channelData: [
              new Float32Array(audioBuffer.length / 4), // Left channel
              new Float32Array(audioBuffer.length / 4)  // Right channel
            ]
          };

          // Convert the buffer to float32 samples
          for (let i = 0; i < audioBuffer.length; i += 4) {
            const sample = audioBuffer.readInt16LE(i) / 32768.0;
            wavData.channelData[0][i/4] = sample;
            wavData.channelData[1][i/4] = sample;
          }

          // Encode as WAV
          const wavBuffer = wav.encode(wavData.channelData, {
            sampleRate: wavData.sampleRate,
            float: false,
            bitDepth: 16
          });

          // Write WAV file
          await new Promise((resolve, reject) => {
            const writeStream = createWriteStream(filename);
            writeStream.write(wavBuffer);
            writeStream.end();
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });

          console.log(`Saved audio file: ${filename}`);

          // Process the audio file
          const transcribed = await transcribeAudio(filename, user.displayName, channel.guild.id);
          if (transcribed) {
            console.log('Transcription saved for', user.displayName);
          } else {
            console.log('Skipping empty transcription for', user.displayName);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
        } finally {
          // Clean up
          audioBuffer = Buffer.alloc(0);
          if (userStreams.has(userId)) {
            const streams = userStreams.get(userId);
            streams.audioStream.destroy();
            streams.decoder.destroy();
            userStreams.delete(userId);
          }
        }
      };

      // Store the streams for cleanup
      userStreams.set(userId, {
        audioStream,
        decoder: opusDecoder,
        handleEnd
      });
    });

    connection.receiver.speaking.on('end', (userId) => {
      console.log(`User ${userId} stopped speaking`);
      const streamData = userStreams.get(userId);
      if (streamData) {
        streamData.handleEnd();
      }
    });

    activeConnections.set(channel.guild.id, {
      connection,
      audioPlayer,
      userStreams,
    });

  } catch (error) {
    console.error('Error setting up voice connection:', error);
    connection.destroy();
    activeConnections.delete(channel.guild.id);
  }
}

function disconnectFromVoice(guildId) {
  const connectionData = activeConnections.get(guildId);
  if (connectionData) {
    connectionData.userStreams.forEach((streamData) => {
      streamData.audioStream.destroy();
      streamData.decoder.destroy();
    });
    connectionData.connection.destroy();
    activeConnections.delete(guildId);
  }
}

module.exports = {
  setupVoiceConnection,
  disconnectFromVoice,
}; 