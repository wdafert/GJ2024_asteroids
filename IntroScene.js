class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
    }

    create() {
        this.add.image(800, 600, 'background');

        const titleText = this.add.text(800, 300, 'Asteroids Game', {
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const instructionsText = this.add.text(800, 400, 'Press SPACE to record your voice\nfor 3 seconds. This will be used\nas the bullet sound in the game.', {
            fontSize: '32px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const startText = this.add.text(800, 550, 'Press ENTER to start the game', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-SPACE', this.startRecording, this);
        this.input.keyboard.on('keydown-ENTER', this.startGame, this);

        this.recordingText = this.add.text(800, 700, '', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.customBulletSound = null;
        
        // Check if we have a saved audio file
        const savedAudio = localStorage.getItem('customBulletSound');
        if (savedAudio) {
            this.customBulletSound = savedAudio;
            this.recordingText.setText('Saved audio found. Press SPACE to re-record or ENTER to use saved audio.');
        } else {
            this.recordingText.setText('No saved audio. Press SPACE to record.');
        }
    }

    startRecording() {
        if (this.isRecording) return;

        this.isRecording = true;
        this.recordingText.setText('Recording...');

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];

                this.mediaRecorder.addEventListener("dataavailable", event => {
                    this.audioChunks.push(event.data);
                });

                this.mediaRecorder.addEventListener("stop", () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp3' });
                    this.sendAudioToBackend(audioBlob);
                });

                this.mediaRecorder.start();

                this.time.delayedCall(3000, this.stopRecording, [], this);
            });
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.recordingText.setText('Recording complete. Processing...');
        }
    }

    sendAudioToBackend(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.mp3');

        fetch('http://localhost:5000/process_audio', {
            method: 'POST',
            body: formData
        })
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            // Store the ArrayBuffer in localStorage as a Base64 string
            const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
            localStorage.setItem('customBulletSound', base64);
            this.recordingText.setText('New audio processed and saved. Press ENTER to start or SPACE to re-record.');
        })
        .catch(error => {
            console.error('Error processing audio:', error);
            this.recordingText.setText('Error processing audio. Press SPACE to try again or ENTER to use default sound.');
        });
    }

    startGame() {
        // Get the latest custom bullet sound from localStorage
        const savedAudio = localStorage.getItem('customBulletSound');
        this.scene.start('MainScene', { customBulletSound: savedAudio });
    }
}

export default IntroScene;
