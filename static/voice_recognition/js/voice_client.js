/**
 * Voice Recognition Client
 * A JavaScript client for voice recognition services
 */
class VoiceRecognitionClient {
    /**
     * Create a new VoiceRecognitionClient
     * @param {string} apiBaseUrl - Base URL for the voice recognition API
     */
    constructor(apiBaseUrl = '/api/voice') {
        this.apiBaseUrl = apiBaseUrl;
        this.isListening = false;
        this.selectedMicrophoneIndex = null;
        this.onRecognitionResult = null;
        this.onError = null;
        this.onStatusChange = null;
        this.currentStream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        
        console.log('Voice Recognition Client initialized with API base URL:', apiBaseUrl);
    }

    /**
     * Set callback for recognition results
     * @param {Function} callback - Function to call with recognition results
     */
    setRecognitionResultCallback(callback) {
        this.onRecognitionResult = callback;
    }
    
    /**
     * Set callback for errors
     * @param {Function} callback - Function to call with error messages
     */
    setErrorCallback(callback) {
        this.onError = callback;
    }
    
    /**
     * Set callback for status updates
     * @param {Function} callback - Function to call with status messages
     */
    setStatusCallback(callback) {
        this.onStatusChange = callback;
    }

    /**
     * Reports status changes
     * @param {string} status - Status message
     * @private
     */
    _reportStatus(status) {
        console.log(`Voice Recognition Status: ${status}`);
        if (this.onStatusChange) {
            this.onStatusChange(status);
        }
    }

    /**
     * Reports errors
     * @param {string} error - Error message
     * @private
     */
    _reportError(error) {
        console.error(`Voice Recognition Error: ${error}`);
        if (this.onError) {
            this.onError(error);
        }
    }
    
    /**
     * Get available microphones
     * @returns {Promise<Array>} - Promise resolving to array of available microphone devices
     */
    async getMicrophones() {
        try {
            // Check if media devices are supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                throw new Error('Media devices API not supported');
            }

            // Request permission to access devices
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Get all media devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            // Filter for audio input devices
            const microphones = devices.filter(device => device.kind === 'audioinput');
            
            console.log('Available microphones:', microphones);
            
            return microphones;
        } catch (error) {
            this._reportError(`Failed to get microphones: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Set active microphone by index
     * @param {number} index - Index of microphone to use
     */
    async setMicrophone(index) {
        const microphones = await this.getMicrophones();
        
        if (index >= 0 && index < microphones.length) {
            this.selectedMicrophoneIndex = index;
            this._reportStatus(`Microphone set to: ${microphones[index].label || 'Device ' + index}`);
        } else {
            this._reportError(`Invalid microphone index: ${index}`);
        }
    }

    /**
     * Start voice recognition
     * @returns {Promise<Object|null>} - Promise resolving to recognition result or null on error
     */
    async startRecognition() {
        if (this.isListening) {
            this._reportStatus('Already listening');
            return null;
        }
        
        try {
            this.isListening = true;
            this._reportStatus('Starting voice recognition...');
            
            // If WebSpeechAPI is available, use it
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                return this._startBrowserRecognition();
            }
            // Otherwise use server-side recognition
            else {
                return this._startServerRecognition();
            }
        } catch (error) {
            this.isListening = false;
            this._reportError(error.message || 'Failed to start recognition');
            return null;
        }
    }

    /**
     * Start browser-based speech recognition using Web Speech API
     * @returns {Promise<Object>} - Promise resolving to recognition result
     * @private
     */
    _startBrowserRecognition() {
        return new Promise((resolve, reject) => {
            try {
                // Initialize Speech Recognition API
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                
                recognition.onstart = () => {
                    this._reportStatus('Browser recognition started');
                };
                
                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    const confidence = event.results[0][0].confidence;
                    
                    const result = {
                        text: transcript,
                        confidence: confidence
                    };
                    
                    if (this.onRecognitionResult) {
                        this.onRecognitionResult(result);
                    }
                    
                    this._reportStatus('Recognition complete');
                    this.isListening = false;
                    resolve(result);
                };
                
                recognition.onerror = (event) => {
                    this._reportError(`Recognition error: ${event.error}`);
                    this.isListening = false;
                    reject(new Error(event.error));
                };
                
                recognition.onend = () => {
                    this.isListening = false;
                    this._reportStatus('Recognition ended');
                };
                
                // Start recognition
                recognition.start();
                
            } catch (error) {
                this.isListening = false;
                this._reportError(`Browser recognition failed: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * Start server-side speech recognition by recording audio and sending to backend
     * @returns {Promise<Object>} - Promise resolving to recognition result
     * @private
     */
    async _startServerRecognition() {
        try {
            // Get microphone stream
            const constraints = {
                audio: this.selectedMicrophoneIndex !== null 
                    ? { deviceId: { exact: (await this.getMicrophones())[this.selectedMicrophoneIndex].deviceId } }
                    : true 
            };
            
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.audioChunks = [];
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(this.currentStream);
            
            // Set up event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // Handle recording stop
            this.mediaRecorder.onstop = async () => {
                try {
                    // Stop all tracks in the stream
                    if (this.currentStream) {
                        this.currentStream.getTracks().forEach(track => track.stop());
                        this.currentStream = null;
                    }
                    
                    this._reportStatus('Processing audio...');
                    
                    // Create audio blob from recorded chunks
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    
                    // Create form data
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');
                    
                    // Send to server for processing
                    const response = await fetch(`/api/voice-recognition`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                    }
                    
                    // Process result
                    const result = await response.json();
                    
                    // Call callback with result
                    if (this.onRecognitionResult) {
                        this.onRecognitionResult(result);
                    }
                    
                    this._reportStatus('Recognition complete');
                    this.isListening = false;
                    
                    return result;
                } catch (error) {
                    this._reportError(`Processing error: ${error.message}`);
                    this.isListening = false;
                    return null;
                }
            };
            
            // Start recording for 5 seconds
            this.mediaRecorder.start();
            this._reportStatus('Recording started...');
            
            // Set timeout to stop recording after 5 seconds
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                        this.mediaRecorder.stop();
                        this._reportStatus('Recording stopped');
                    }

                    // Resolve with placeholder result - actual result will come from onstop handler
                    resolve({ text: '', inProgress: true });
                }, 5000);
            });
        } catch (error) {
            this.isListening = false;
            this._reportError(`Server recognition failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Stop ongoing recognition
     */
    stopRecognition() {
        if (!this.isListening) {
            return;
        }

        this.isListening = false;
        
        // Stop media recorder if active
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        // Stop all tracks in current stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        this._reportStatus('Recognition stopped by user');
    }
}

// Expose the client globally
window.VoiceRecognitionClient = VoiceRecognitionClient;
console.log("VoiceRecognitionClient class registered globally");

// Create a global instance for easy access
window.voiceClient = new VoiceRecognitionClient('/api/voice-recognition');
console.log("voiceClient instance created globally"); 