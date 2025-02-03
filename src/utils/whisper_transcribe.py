import sys
import whisper
import json
import torch
import os
from datetime import datetime

def save_transcription(guild_id, username, text):
    try:
        # Create transcriptions directory if it doesn't exist
        transcription_dir = os.path.join(os.getcwd(), 'transcriptions')
        os.makedirs(transcription_dir, exist_ok=True)
        
        transcription_file = os.path.join(transcription_dir, f"{guild_id}.json")
        
        # Read existing transcriptions or create new array
        transcriptions = []
        if os.path.exists(transcription_file):
            with open(transcription_file, 'r') as f:
                transcriptions = json.load(f)
        
        # Add new transcription with timestamp
        transcriptions.append({
            "username": username,
            "text": text,
            "timestamp": datetime.now().isoformat()
        })
        
        # Write back to file
        with open(transcription_file, 'w') as f:
            json.dump(transcriptions, f, indent=2)
            
        return True
    except Exception as e:
        print(f"Error saving transcription: {str(e)}", file=sys.stderr)
        return False

def transcribe_audio(audio_path, guild_id, username):
    try:
        # Verify file exists and is readable
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        file_size = os.path.getsize(audio_path)
        print(f"Audio file size: {file_size} bytes", file=sys.stderr)
        
        if file_size == 0:
            raise ValueError("Audio file is empty")

        # Check if CUDA is available, otherwise use CPU
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Using device: {device}", file=sys.stderr)
        
        # Load the model (will download on first run)
        print("Loading Whisper model...", file=sys.stderr)
        model = whisper.load_model("small").to(device)
        print("Model loaded successfully", file=sys.stderr)
        
        # Transcribe the audio
        print(f"Transcribing audio file: {audio_path}", file=sys.stderr)
        result = model.transcribe(
            audio_path,
            fp16=False  # Disable half-precision on CPU
        )
        print("Transcription completed", file=sys.stderr)
        
        transcribed_text = result["text"].strip()
        print(f"Transcribed text: {transcribed_text}", file=sys.stderr)
        
        if transcribed_text:
            # Save transcription to file
            if save_transcription(guild_id, username, transcribed_text):
                print(json.dumps({
                    "success": True,
                    "text": transcribed_text
                }))
            else:
                print(json.dumps({
                    "success": False,
                    "error": "Failed to save transcription"
                }))
        else:
            print(json.dumps({
                "success": False,
                "error": "Empty transcription"
            }))
            
    except Exception as e:
        error_message = f"Error during transcription: {str(e)}"
        print(error_message, file=sys.stderr)
        print(json.dumps({
            "success": False,
            "error": error_message
        }))

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({
            "success": False,
            "error": "Usage: script.py <audio_file> <guild_id> <username>"
        }))
    else:
        transcribe_audio(sys.argv[1], sys.argv[2], sys.argv[3]) 