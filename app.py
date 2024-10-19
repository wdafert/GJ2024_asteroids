from flask import Flask, request, send_file
from flask_cors import CORS
import io
import os
from dotenv import load_dotenv
from groq import Groq
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
logger.debug(f"Environment variables loaded. GROQ_API_KEY present: {'GROQ_API_KEY' in os.environ}")

# Get the API key from the environment
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    logger.error("GROQ_API_KEY not found in environment variables")
    raise ValueError("GROQ_API_KEY is not set")

logger.debug(f"GROQ_API_KEY loaded: {api_key[:5]}...")  # Log first 5 characters for verification

# Add this after loading the API key
logger.debug(f"API Key length: {len(api_key)}")
logger.debug(f"API Key first 5 chars: {api_key[:5]}")
logger.debug(f"API Key last 5 chars: {api_key[-5:]}")

# Initialize the Groq client
try:
    client = Groq(api_key=api_key)
    logger.debug("Groq client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {str(e)}")
    raise

@app.route('/process_audio', methods=['POST'])
def process_audio():
    logger.debug("Received request to /process_audio")
    if 'audio' not in request.files:
        logger.warning("No audio file in request")
        return 'No audio file', 400

    audio_file = request.files['audio']
    logger.debug(f"Received audio file: {audio_file.filename}")
    
    # Read the audio file into a BytesIO object
    buffer = io.BytesIO()
    audio_file.save(buffer)
    buffer.seek(0)
    logger.debug("Audio file read into buffer")

    # Save the audio file temporarily
    temp_filename = "temp_audio.mp3"
    with open(temp_filename, "wb") as temp_file:
        temp_file.write(buffer.getvalue())
    logger.debug(f"Temporary file saved: {temp_filename}")

    # Perform transcription using Groq
    try:
        with open(temp_filename, "rb") as file:
            logger.debug("Sending file to Groq for transcription")
            transcription = client.audio.transcriptions.create(
                file=(temp_filename, file.read()),
                model="whisper-large-v3-turbo",
                response_format="json",
                language="en",
                temperature=0.0
            )
        logger.info(f"Transcription received: {transcription.text}")
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        return 'Transcription failed', 500

    # Clean up the temporary file
    try:
        os.remove(temp_filename)
        logger.debug(f"Temporary file {temp_filename} removed")
    except Exception as e:
        logger.warning(f"Failed to remove temporary file: {str(e)}")

    # For now, return the original audio file
    buffer.seek(0)
    logger.debug("Returning original audio file")
    return send_file(buffer, mimetype='audio/mp3')

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(debug=True)
