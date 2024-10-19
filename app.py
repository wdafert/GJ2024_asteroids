from flask import Flask, request, send_file
from flask_cors import CORS
import io

app = Flask(__name__)
CORS(app)

@app.route('/process_audio', methods=['POST'])
def process_audio():
    if 'audio' not in request.files:
        return 'No audio file', 400

    audio_file = request.files['audio']
    
    # Read the audio file into a BytesIO object
    buffer = io.BytesIO()
    audio_file.save(buffer)
    buffer.seek(0)

    # Return the audio file without processing
    return send_file(buffer, mimetype='audio/mp3')

if __name__ == '__main__':
    app.run(debug=True)
