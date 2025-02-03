const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');

async function transcribeAudio(audioFilePath, username, guildId) {
  try {
    // Check if file exists and is not empty
    const stats = await fs.promises.stat(audioFilePath);
    if (stats.size === 0) {
      throw new Error('Audio file is empty');
    }

    const options = {
      mode: 'json',
      pythonPath: path.join(process.cwd(), 'venv', 'bin', 'python3.11'),
      scriptPath: path.join(__dirname),
      args: [audioFilePath, guildId, username],
      stderrParser: line => console.log('Python stderr:', line)
    };

    console.log(`Starting transcription for ${username}'s audio`);

    const results = await new Promise((resolve, reject) => {
      PythonShell.run('whisper_transcribe.py', options, (err, results) => {
        if (err) {
          console.error('Python script error:', err);
          reject(err);
          return;
        }
        if (!results || results.length === 0) {
          reject(new Error('No results from transcription'));
          return;
        }
        
        const lastResult = results[results.length - 1];
        console.log('Transcription result:', lastResult);
        resolve(lastResult);
      });
    });

    console.log(`Transcription completed for ${username}`);

    // Clean up the audio file after transcription
    try {
      await fs.promises.unlink(audioFilePath);
    } catch (err) {
      console.error('Error deleting audio file:', err);
    }

    if (!results.success) {
      throw new Error(results.error || 'Transcription failed');
    }

    return results.success;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    try {
      await fs.promises.unlink(audioFilePath);
    } catch (err) {
      // Ignore deletion errors in error handler
    }
    throw error;
  }
}

async function getTranscriptions(guildId) {
  const transcriptionFile = path.join(process.cwd(), 'transcriptions', `${guildId}.json`);
  
  try {
    if (!fs.existsSync(transcriptionFile)) {
      return null;
    }
    
    const data = fs.readFileSync(transcriptionFile, 'utf8');
    const transcriptions = JSON.parse(data);
    
    // Delete the file after reading
    fs.unlinkSync(transcriptionFile);
    
    return transcriptions;
  } catch (error) {
    console.error('Error reading transcriptions:', error);
    return null;
  }
}

module.exports = {
  transcribeAudio,
  getTranscriptions,
}; 