import React, { useState, useEffect } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

const ScreenRecorderComponent = () => {
    const {
        status,
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({ audio: false, screen: true, mediaRecorderOptions: { mimeType: 'video/webm' } });

    const [mediaBase64, setMediaBase64] = useState('');
    const [answer, setAnswer] = useState('');
    const [userInput, setUserInput] = useState('');  // State for text box input
    const msg = new SpeechSynthesisUtterance();

    function splitParagraphIntoChunks(paragraph, maxLength) {
        const words = paragraph.split(' ');
        const chunks = [];
        let currentChunk = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if ((currentChunk.length + word.length) <= maxLength) {
                currentChunk += (currentChunk.length > 0 ? ' ' : '') + word;
            } else {
                chunks.push(currentChunk.trim());
                currentChunk = word;
            }
        }
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    const speechHandler = (msg, toSpeech) => {
        if (toSpeech) {
            let stringArr = splitParagraphIntoChunks(toSpeech, 150)
            stringArr.forEach(string => {
                msg.text = string;
                window.speechSynthesis.speak(msg);
                console.log(string)
            });
        }
    };

    // Function to convert Blob URL to Base64 string
    const convertBlobToBase64 = async (blobUrl) => {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Effect hook to handle conversion and setting of mediaBase64 state
    useEffect(() => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance("testing");
        synth.speak(utterance);
        if (mediaBlobUrl) {
            convertBlobToBase64(mediaBlobUrl).then(setMediaBase64);
        }
    }, [mediaBlobUrl]);

    // Effect hook to send mediaBase64 to server and update answer state
    useEffect(() => {
        const sendData = async () => {
            try {
                const response = await fetch('https://us-central1-koboodle-telagram-alerts.cloudfunctions.net/openai-ass', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        blob: mediaBase64,
                        userInput: userInput  // Include the text box input in the request
                    }),
                });
                const data = await response.json();
                setAnswer(data.fullResponse);
                speechHandler(msg, data.fullResponse)
            } catch (error) {
                console.error(error);
            }
        };

        if (mediaBase64) {
            sendData();
        }
    }, [mediaBase64]);

    return (
        <div style={styles.container}>
            <p style={styles.status}>Status: {status}</p>
            <p style={styles.answer}>Answer: {answer}</p>
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter text here"
                style={styles.input}
            />
            <div style={styles.buttonContainer}>
                <button style={styles.button} onClick={startRecording}>Start Recording</button>
                <button style={styles.button} onClick={() => stopRecording()}>Stop Recording</button>
            </div>
            {mediaBlobUrl && (
                <video style={styles.video} width="320" height="240" src={mediaBlobUrl} controls autoPlay loop />
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        margin: 'auto',
        marginTop: '20px'
    },
    status: {
        fontSize: '18px',
        marginBottom: '10px',
        color: '#333'
    },
    answer: {
        fontSize: '16px',
        marginBottom: '20px',
        color: '#333'
    },
    input: {
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        width: '100%',
        marginBottom: '20px'
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '20px'
    },
    button: {
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        backgroundColor: '#007BFF',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '16px'
    },
    buttonStop: {
        backgroundColor: '#FF4136'
    },
    video: {
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }
};

export default ScreenRecorderComponent;
