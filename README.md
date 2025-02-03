# Discord Voice Transcription Bot

A Discord bot that automatically transcribes voice conversations using the open-source Whisper model locally.

## Features

- Automatically joins voice channels when users join
- Transcribes voice conversations in real-time using local Whisper model
- Generates simple summaries of transcribed conversations
- Sends transcriptions and summaries to a designated channel
- Slash commands for manual control (/join, /leave)

## Prerequisites

- Node.js 16.9.0 or higher
- Python 3.7 or higher
- A Discord Bot Token
- FFmpeg installed on your system
- CUDA-capable GPU (recommended for better performance)

## Setup

1. Clone this repository
2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Install Python dependencies (will be installed automatically during npm install):
   ```bash
   python3 -m pip install -U openai-whisper
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token
   TRANSCRIPTION_CHANNEL_ID=your_channel_id
   ```

5. Create a `recordings` directory in the root folder:
   ```bash
   mkdir recordings
   ```

6. Start the bot:
   ```bash
   npm start
   ```

## Discord Bot Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the Bot section and create a bot
4. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
   - Voice State Intent
5. Generate and copy your bot token
6. Use the OAuth2 URL Generator to create an invite link with the following permissions:
   - Send Messages
   - Connect
   - Speak
   - Use Slash Commands

## Usage

The bot will automatically join voice channels when users join and leave when the last user leaves. You can also control it manually using the following slash commands:

- `/join` - Makes the bot join your current voice channel and start transcribing
- `/leave` - Makes the bot leave the voice channel and stop transcribing

## Environment Variables

- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `TRANSCRIPTION_CHANNEL_ID`: The ID of the channel where transcriptions will be sent

## Whisper Model Configuration

By default, the bot uses the "base" Whisper model. You can change the model size in `src/utils/whisper_transcribe.py` by modifying the `model = whisper.load_model("base")` line. Available models are:
- tiny (fastest, least accurate)
- base
- small
- medium
- large (slowest, most accurate)

Choose the model based on your hardware capabilities and accuracy requirements.

## License

MIT 