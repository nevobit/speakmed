import React, { useState } from 'react';
import AudioRecorder from './AudioRecorder/AudioRecorder';

const TranscripcionDiarizacion: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscribe = async (blob: Blob) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error al transcribir');
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError('No se pudo transcribir el audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' }}>
      <h2>Transcripción y diarización</h2>
      <AudioRecorder onRecordingComplete={setAudioBlob} hideTemplateSelector hideReport />
      <div style={{ margin: '1rem 0' }}>
        <label>O sube un archivo de audio:
          <input type="file" accept="audio/*" onChange={e => {
            if (e.target.files && e.target.files[0]) setAudioBlob(e.target.files[0]);
          }} />
        </label>
      </div>
      <button onClick={() => audioBlob && handleTranscribe(audioBlob)} disabled={!audioBlob || loading} style={{ padding: 10, borderRadius: 6, width: '100%', background: '#1362bc', color: '#fff', fontWeight: 'bold' }}>Transcribir</button>
      {loading && <div>Cargando...</div>}
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h3>Transcripción</h3>
          <div style={{ background: '#f4f6fb', borderRadius: 8, padding: 16 }}>{result.transcript}</div>
          <h3 style={{ marginTop: 16 }}>Diarización</h3>
          <ul>
            {result.diarization && result.diarization.map((d: any, i: number) => (
              <li key={i}><b>{d.speaker}:</b> {d.text}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TranscripcionDiarizacion; 