import React, { useState } from 'react';
import { extractProceduresFromAudio, downloadProceduresRecipe, downloadExamenes } from '@/api';
import { Mic, Brain, Download, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface ExtractedProcedure {
  name: string;
  description: string;
  instructions: string;
  frequency: string;
  duration: string;
  priority: 'Alta' | 'Media' | 'Baja';
  category: string;
  preparation?: string;
  followUp?: string;
  additionalNotes?: string;
}

interface ExtractionResult {
  procedures: ExtractedProcedure[];
  summary: {
    totalProcedures: number;
    confidence: number;
    extractionMethod: string;
  };
  rawText?: string;
}

const AudioProcedureExtraction: React.FC = () => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [patientData, setPatientData] = useState({
    name: 'Juan Pérez',
    age: '35 años',
    gender: 'Masculino',
    id: '12345678-9'
  });

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
      const extractionResult = await extractProceduresFromAudio(audioBlob);
      setResult(extractionResult);
    } catch (err: any) {
      setError(err.message || 'Error al extraer procedimientos del audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadProceduresRecipe = async () => {
    if (!result) return;

    try {
      const recipeData = {
        reportId: `PROC-${Date.now()}`,
        patientData,
        procedures: result.procedures,
        audioBlob: await blobToBase64(audioBlob!)
      };

      const blob = await downloadProceduresRecipe(recipeData);
      
      // Crear y descargar el archivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receta_procedimientos_${recipeData.reportId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading procedures recipe:', error);
      setError('Error al descargar la receta de procedimientos');
    }
  };
    console.log({ "audioBlob": audioBlob })

  const downloadExamenesWithProcedures = async () => {
    if (!result) return;
    if (!audioBlob) {
      setError('No hay audio para procesar');
      return;
    }

    console.log({ "audioBlob": audioBlob })
    try {
      // Convertir audio a base64
      // const arrayBuffer = await audioBlob!.arrayBuffer();
      // const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const examenesData = {
        clinicName: 'Clínica Alemana',
        doctorName: 'Dr. MÉDICO ESPECIALISTA',
        doctorRut: '12345678-9',
        doctorSpecialty: 'Medicina General',
        doctorLocation: 'CONSULTORIO',
        patientName: patientData.name,
        patientGender: patientData.gender,
        patientRut: patientData.id,
        patientBirthDate: patientData.age,
        procedures: result.procedures,
        audioBlob: await blobToBase64(audioBlob)
      };

      const reportId = `EXAM-${Date.now()}`;
      const blob = await downloadExamenes(reportId, examenesData);
      
      // Crear y descargar el archivo
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `examenes_medicos_${reportId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading examenes:', error);
      setError('Error al descargar los exámenes médicos');
    }
  };

  // Función auxiliar para convertir Blob a base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64 (sin el prefijo data:audio/webm;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return '#e74c3c';
      case 'Media': return '#f39c12';
      case 'Baja': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: '2rem auto', 
      background: '#fff', 
      borderRadius: 12, 
      padding: 32, 
      boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' 
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <FileText size={24} style={{ marginRight: '0.5rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            Extracción de Procedimientos Médicos del Audio
          </h2>
        </div>
        <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.6' }}>
          Graba una consulta médica y extrae automáticamente los procedimientos, exámenes y tratamientos 
          que el paciente debe realizar usando IA avanzada.
        </p>
      </div>

      {/* Información del Paciente */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
          Información del Paciente
        </h3>
        <div style={{ 
          background: '#f8fafc', 
          padding: '1rem', 
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong>Nombre:</strong> {patientData.name}
            </div>
            <div>
              <strong>Edad:</strong> {patientData.age}
            </div>
            <div>
              <strong>Género:</strong> {patientData.gender}
            </div>
            <div>
              <strong>ID:</strong> {patientData.id}
            </div>
          </div>
        </div>
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
              background: isProcessing ? '#9ca3af' : 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
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
                Extraer Procedimientos del Audio
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
              {result.summary.totalProcedures} procedimientos encontrados • 
              Confianza: {result.summary.confidence}% • 
              Método: {result.summary.extractionMethod}
            </div>
          </div>

          {/* Lista de Procedimientos */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#374151' }}>
              Procedimientos Extraídos:
            </h4>
            {result.procedures.map((proc, index) => (
              <div key={index} style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    {proc.name}
                  </div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'white',
                    background: getPriorityColor(proc.priority)
                  }}>
                    {proc.priority}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  <strong>Categoría:</strong> {proc.category}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                  <strong>Descripción:</strong> {proc.description}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                  <strong>Instrucciones:</strong> {proc.instructions}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                  <div><strong>Frecuencia:</strong> {proc.frequency}</div>
                  <div><strong>Duración:</strong> {proc.duration}</div>
                </div>
                {proc.preparation && (
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                    <strong>Preparación:</strong> {proc.preparation}
                  </div>
                )}
                {proc.followUp && (
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                    <strong>Seguimiento:</strong> {proc.followUp}
                  </div>
                )}
                {proc.additionalNotes && (
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                    <strong>Notas:</strong> {proc.additionalNotes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botones de Descarga */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadProceduresRecipe}
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
              Descargar Receta de Procedimientos
            </button>
            
            <button
              onClick={downloadExamenesWithProcedures}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                background: '#3498db',
                color: '#fff',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FileText size={16} />
              Descargar Exámenes Médicos
            </button>
          </div>
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

export default AudioProcedureExtraction;
