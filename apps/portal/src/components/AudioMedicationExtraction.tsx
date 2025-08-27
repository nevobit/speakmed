import React, { useState } from 'react';
import { extractMedicationsFromAudio } from '@/api';
import { Mic, Brain, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface ExtractedMedication {
  name: string;
  dosage: string;
  form: string;
  manufacturer?: string;
  type: string;
  composition: string;
  instructions: string;
  startDate: string;
  additionalNotes?: string;
}

interface ExtractionResult {
  medications: ExtractedMedication[];
  summary: {
    totalMedications: number;
    confidence: number;
    extractionMethod: string;
  };
  rawText?: string;
}

const AudioMedicationExtraction: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioChunks([]);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setError(null);
      setResult(null);
    } catch (err) {
      setError('Error al acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleExtraction = async () => {
    if (!audioBlob) {
      setError('No hay audio para procesar');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const extractionResult = await extractMedicationsFromAudio(audioBlob);
      setResult(extractionResult);
    } catch (err: any) {
      setError(err.message || 'Error al extraer medicamentos del audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMedications = () => {
    if (!result) return;

    const medicationsText = result.medications.map(med => 
      `${med.name} ${med.dosage} ${med.form}\n` +
      `Composición: ${med.composition}\n` +
      `Instrucciones: ${med.instructions}\n` +
      `Tipo: ${med.type}\n` +
      `Fecha inicio: ${med.startDate}\n` +
      `${med.additionalNotes ? `Notas: ${med.additionalNotes}\n` : ''}` +
      `---`
    ).join('\n\n');

    const blob = new Blob([medicationsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicamentos_extraidos.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '2rem auto', 
      background: '#fff', 
      borderRadius: 12, 
      padding: 32, 
      boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' 
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <Brain size={24} style={{ marginRight: '0.5rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            Extracción de Medicamentos del Audio
          </h2>
        </div>
        <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.6' }}>
          Graba una consulta médica y extrae automáticamente los medicamentos recetados 
          con sus detalles completos usando IA avanzada.
        </p>
      </div>

      {/* Grabación de Audio */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
          <Mic size={20} style={{ marginRight: '0.5rem', display: 'inline' }} />
          Grabación de Audio
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {!isRecording ? (
            <button
              onClick={startRecording}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#ef4444',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Mic size={16} />
              Iniciar Grabación
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#374151',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Mic size={16} />
              Detener Grabación
            </button>
          )}
        </div>

        {audioBlob && (
          <div style={{ 
            background: '#f0f9ff', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <p style={{ margin: 0, color: '#0c4a6e', fontWeight: '500' }}>
              ✅ Audio grabado correctamente
            </p>
            <audio 
              src={URL.createObjectURL(audioBlob)} 
              controls 
              style={{ marginTop: '0.5rem', width: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Botón de Extracción */}
      {audioBlob && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={handleExtraction}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isProcessing ? (
              <>
                <Brain size={16} />
                Procesando audio...
              </>
            ) : (
              <>
                <Brain size={16} />
                Extraer Medicamentos del Audio
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            background: '#f0fdf4', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <CheckCircle size={16} style={{ marginRight: '0.5rem', color: '#166534' }} />
              <span style={{ fontWeight: '600', color: '#166534' }}>
                Extracción Completada
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#059669' }}>
              {result.summary.totalMedications} medicamentos encontrados • 
              Confianza: {result.summary.confidence}% • 
              Método: {result.summary.extractionMethod}
            </div>
          </div>

          {/* Lista de Medicamentos */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
              Medicamentos Extraídos:
            </h4>
            {result.medications.map((med, index) => (
              <div key={index} style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                  {med.name} {med.dosage} {med.form}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5' }}>
                  <div><strong>Composición:</strong> {med.composition}</div>
                  <div><strong>Instrucciones:</strong> {med.instructions}</div>
                  <div><strong>Tipo:</strong> {med.type}</div>
                  <div><strong>Fecha inicio:</strong> {med.startDate}</div>
                  {med.manufacturer && <div><strong>Fabricante:</strong> {med.manufacturer}</div>}
                  {med.additionalNotes && <div><strong>Notas:</strong> {med.additionalNotes}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Botón de Descarga */}
          <button
            onClick={downloadMedications}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: '#10b981',
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Download size={16} />
            Descargar Lista de Medicamentos
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#fef2f2', 
          color: '#991b1b', 
          borderRadius: '8px',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Texto Transcrito */}
      {result?.rawText && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
            Texto Transcrito:
          </h4>
          <div style={{ 
            background: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: '#374151'
          }}>
            {result.rawText}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioMedicationExtraction;
