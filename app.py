from flask import Flask, request, send_file
from flask_cors import CORS
import io
import os
from dotenv import load_dotenv
from groq import Groq
from elevenlabs.client import ElevenLabs
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Get API keys from environment
groq_api_key = os.getenv("GROQ_API_KEY")
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")

if not groq_api_key or not elevenlabs_api_key:
    logger.error("Missing API keys in environment variables")
    raise ValueError("API keys are not set")

logger.info("API keys loaded successfully")

# Initialize clients
groq_client = Groq(api_key=groq_api_key)
elevenlabs_client = ElevenLabs(api_key=elevenlabs_api_key)

logger.info("Clients initialized successfully")

def generate_sound_effect(text, duration_seconds=2.0, prompt_influence=0.3):
    logger.info(f"Generating sound effect for: '{text}'")
    start_time = time.time()

    result = elevenlabs_client.text_to_sound_effects.convert(
        text=text,
        duration_seconds=duration_seconds,
        prompt_influence=prompt_influence
    )

    temp_file = "assets/sound/level1/bullet.mp3"
    with open(temp_file, "wb") as f:
        for chunk in result:
            f.write(chunk)

    total_time = (time.time() - start_time) * 1000
    logger.info(f"Sound effect generated in {total_time:.2f} ms")

    return temp_file

@app.route('/process_audio', methods=['POST'])
def process_audio():
    logger.info("Received request to /process_audio")
    if 'audio' not in request.files:
        logger.warning("No audio file in request")
        return 'No audio file', 400

    audio_file = request.files['audio']
    logger.info(f"Received audio file: {audio_file.filename}")

    # Save the received audio file temporarily
    temp_input_file = "temp_input_audio.mp3"
    audio_file.save(temp_input_file)

    try:
        # Perform transcription using Groq
        with open(temp_input_file, "rb") as file:
            logger.info("Sending file to Groq for transcription")
            transcription = groq_client.audio.transcriptions.create(
                file=(temp_input_file, file.read()),
                model="whisper-large-v3-turbo",
                response_format="json",
                language="en",
                temperature=0.0
            )
        logger.info(f"Transcription received: {transcription.text}")

        # Generate sound effect based on transcription
        sound_effect_file = generate_sound_effect(transcription.text)

        # Send the generated sound effect back to the frontend
        return send_file(sound_effect_file, mimetype='audio/mp3')

    except Exception as e:
        logger.error(f"Error during processing: {str(e)}")
        return 'Processing failed', 500

    # finally:
    #     # Clean up temporary files
    #     for file in [temp_input_file, "temp_sound_effect.mp3"]:
    #         try:
    #             os.remove(file)
    #             logger.debug(f"Temporary file {file} removed")
    #         except Exception as e:
    #             logger.warning(f"Failed to remove temporary file {file}: {str(e)}")

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(debug=True)
