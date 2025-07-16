import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import styles
import styles from './AudioRecorder.module.css';
import { Mic, StopCircle, FileText, Download, Copy, RefreshCw } from 'lucide-react';

type View = 'recording' | 'preview' | 'report';
interface Template {
  id: string;
  name: string;
}

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  hideTemplateSelector?: boolean;
  hideReport?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, hideTemplateSelector, hideReport }) => {
  const [view, setView] = useState<View>('recording');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [report, setReport] = useState('');
  const [summary, setSummary] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);


  useEffect(() => {
    // Fetch templates on component mount
    const fetchTemplates = async () => {
      try {
        // This is a placeholder. Replace with your actual API endpoint.
        const response = await fetch('http://localhost:8000/api/templates'); 
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    fetchTemplates();

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    // Reset state
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunks.current = [];
    setTimer(0);
    setError(null);
    setIsPaused(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const newAudioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setAudioBlob(newAudioBlob);
        setAudioUrl(URL.createObjectURL(newAudioBlob));
        if (onRecordingComplete) onRecordingComplete(newAudioBlob);
        setView('preview');
      };

      mediaRecorder.onpause = () => {
        setIsPaused(true);
      };

      mediaRecorder.onresume = () => {
        setIsPaused(false);
      };

      mediaRecorder.start();
      setRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } catch (err) {
      setError('Could not start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      timerIntervalRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateReport = async () => {
    if (!audioBlob || !selectedTemplate) {
      setError('Por favor graba un audio y selecciona una plantilla.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const transcribeRes = await fetch('http://localhost:8000/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!transcribeRes.ok) {
        throw new Error('Error al transcribir el audio');
      }
      const transcribeData = await transcribeRes.json();
      const transcript = transcribeData.transcript;

      const reportRes = await fetch('http://localhost:8000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          content: transcript,
          date: new Date().toISOString(),
          duration: timer,
          summary: '',
        }),
      });
      if (!reportRes.ok) {
        throw new Error('Error al generar el informe');
      }
      const reportData = await reportRes.json();
      setReport(reportData.content || '');
      setSummary(reportData.summary || '');
      setView('report');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewRecording = () => {
    setView('recording');
    setTimer(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setError(null);
    setReport('');
    setSummary('');
  };

  const renderRecordingView = () => (
    <div className={styles.card}>
      <h2>¡Comencemos!</h2>
      <div className={styles.timerRow}>
        <span className={recording && !isPaused ? styles.blinkingDot : styles.hiddenDot}></span>
        <span className={styles.timer}>{formatTime(timer)}</span>
      </div>
      <div className={styles.controls}>
        {!recording && (
          <button className={styles.recordBtn} onClick={startRecording}>
            <Mic size={48} strokeWidth='1.5px' />
          </button>
        )}
        {recording && (
          <>
            <button className={styles.pauseBtn} onClick={isPaused ? resumeRecording : pauseRecording}>
              {isPaused ? (
                <svg width="48" height="48" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="#fff"/><rect x="14" y="4" width="4" height="16" fill="#fff"/></svg>
              )}
            </button>
            <button className={styles.stopBtn} onClick={stopRecording}>
              <StopCircle size={48} strokeWidth='1.5px' />
            </button>
          </>
        )}
      </div>
      <p className={styles.instructions}>
        {recording ? (isPaused ? 'Presiona el botón para reanudar la grabación' : 'Presiona el botón para pausar o detener la grabación') : 'Presiona el botón para comenzar a grabar'}
      </p>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );

  const renderPreviewView = () => (
    <div className={styles.card}>
      <h2>¡Comencemos!</h2>
      <div className={styles.subHeader}>
        <h3>Grabación de audio</h3>
        <div className={styles.timer}>{formatTime(timer)}</div>
      </div>
      
      {audioUrl && <audio src={audioUrl} controls className={styles.audioPlayer} />}

      {!hideTemplateSelector && (
        <div className={styles.templateSelector}>
          <label htmlFor="template">Seleccione la plantilla a utilizar:</label>
          <select id="template" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className={styles.select} disabled={isLoading}>
            <option value="">Seleccione una plantilla</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
      )}

      {!hideTemplateSelector && (
        <div className={styles.actions}>
          <button onClick={generateReport} className={styles.primaryBtn} disabled={isLoading}>
            {isLoading ? 'Generando...' : <><FileText size={16} /> Generar informe</>}
          </button>
          <button onClick={startNewRecording} className={styles.secondaryBtn} disabled={isLoading}>
            <RefreshCw size={16} /> Nueva grabación
          </button>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );

  const renderReportView = () => (
    <>{!hideReport && (
      <div className={styles.card}>
        <h2>Informe generado</h2>
        
        <div className={styles.reportSection}>
          <h3>Resumen de atención médica</h3>
          <div className={styles.summaryBox} dangerouslySetInnerHTML={{ __html: summary.replace('```html', '') }} />
        </div>

        <div className={styles.reportSection}>
          <h3>Informe de la atención médica</h3>
          <div className={styles.summaryBox} dangerouslySetInnerHTML={{ __html: report.replace('```html', '') }} />
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={() => navigator.clipboard.writeText(`Resumen: ${summary}\n\nInforme: ${report}`)}>
            <Copy size={16} /> Copiar
          </button>
          <button className={styles.primaryBtn}>
            <Download size={16} /> Guardar
          </button>
        </div>

        <div className={styles.newRecordingAction}>
          <button onClick={startNewRecording} className={styles.secondaryBtn}>
            <RefreshCw size={16} /> Nueva grabación
          </button>
        </div>

      </div>
    )}</>
  );

  return (
    <div className={styles.container}>
      {view === 'recording' && renderRecordingView()}
      {view === 'preview' && renderPreviewView()}
      {view === 'report' && renderReportView()}
    </div>
  );
};

export default AudioRecorder; 