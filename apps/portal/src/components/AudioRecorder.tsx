import React, { useState, useRef } from 'react';

const AudioRecorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    setTranscript('');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new window.MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      setAudioUrl(URL.createObjectURL(audioBlob));
      sendAudio(audioBlob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendAudio = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setTranscript(data.transcript || 'No se pudo transcribir el audio.');
    } catch (error) {
      setTranscript('Error al enviar el audio.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <h2>Grabador de Audio</h2>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Detener grabación' : 'Iniciar grabación'}
      </button>
      {audioUrl && (
        <div style={{ marginTop: 16 }}>
          <audio src={audioUrl} controls />
        </div>
      )}
      {transcript && (
        <div style={{ marginTop: 16 }}>
          <strong>Transcripción:</strong>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 