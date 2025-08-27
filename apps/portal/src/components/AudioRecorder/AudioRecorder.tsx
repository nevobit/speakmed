import React, { useState, useRef, useEffect } from 'react';
import styles from './AudioRecorder.module.css';
import { Mic, StopCircle, FileText, Download, Copy, RefreshCw, FileDown, Receipt, Settings, User, UserCheck } from 'lucide-react';
import Editor from './Editor';
import { updateReport } from '../../api';
import AIMedicationValidation from '../AIMedicationValidation';
import { cleanAndProcessHtml, htmlToPlainText } from '../../utils/htmlCleaner';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

type View = 'recording' | 'preview' | 'report' | 'medicalData';
interface Template {
  id: string;
  name: string;
}

interface MedicalData {
  clinicName: string;
  doctorName: string;
  doctorRut: string;
  doctorSpecialty: string;
  doctorLocation: string;
  patientName: string;
  patientGender: string;
  patientRut: string;
  patientBirthDate: string;
  doctorSignature: string | null;
}

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  hideTemplateSelector?: boolean;
  hideReport?: boolean;
  reloadStats?: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, hideTemplateSelector, hideReport, reloadStats }) => {
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
  const [reportId, setReportId] = useState<string | null>(null);
  const [medicationValidation, setMedicationValidation] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingReceta, setIsDownloadingReceta] = useState(false);
  const [isDownloadingInforme, setIsDownloadingInforme] = useState(false);
  const [isDownloadingExamenes, setIsDownloadingExamenes] = useState(false);

  // Estado para datos médicos
  const [medicalData, setMedicalData] = useState<MedicalData>({
    clinicName: 'Clínica Alemana',
    doctorName: 'Dr. MÉDICO ESPECIALISTA',
    doctorRut: '12345678-9',
    doctorSpecialty: 'Medicina General',
    doctorLocation: 'CONSULTORIO',
    patientName: 'PACIENTE EJEMPLO',
    patientGender: 'MASCULINO',
    patientRut: '98765432-1',
    patientBirthDate: '01/01/1980 (43a)',
    doctorSignature: null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para manejar la carga de firma del médico
  const handleSignatureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('La imagen es demasiado grande. Por favor selecciona una imagen menor a 2MB.');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Comprimir la imagen antes de guardarla
        compressImage(result, (compressedImage) => {
          setMedicalData(prev => ({
            ...prev,
            doctorSignature: compressedImage
          }));
          setError(null); // Limpiar errores anteriores
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para comprimir imagen
  const compressImage = (base64String: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calcular nuevas dimensiones (máximo 300x150 píxeles)
      const maxWidth = 300;
      const maxHeight = 150;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Comprimir con calidad 0.7 (70%)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedBase64);
      }
    };
    img.src = base64String;
  };

  // Función para abrir el selector de archivo de firma
  const openSignatureUpload = () => {
    fileInputRef.current?.click();
  };

  // Función para actualizar datos médicos
  const updateMedicalData = (field: keyof MedicalData, value: string) => {
    setMedicalData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para guardar datos médicos en localStorage
  const saveMedicalData = () => {
    localStorage.setItem('medicalData', JSON.stringify(medicalData));
    setView('report');
  };

  // Función para cargar datos médicos desde localStorage
  const loadMedicalData = () => {
    const saved = localStorage.getItem('medicalData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMedicalData(parsed);
      } catch (error) {
        console.error('Error loading medical data:', error);
      }
    }
  };

  useEffect(() => {
    // Fetch templates on component mount
    const fetchTemplates = async () => {
      try {
        // This is a placeholder. Replace with your actual API endpoint.
        const response = await fetch(`${BASE_URL}/api/templates`); 
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

    // Cargar datos médicos guardados
    loadMedicalData();

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



  // Función para copiar texto plano
  const copyPlainText = async () => {
    const plainSummary = htmlToPlainText(summary);
    const plainReport = htmlToPlainText(report);
    const textToCopy = `Resumen: ${plainSummary}\n\nInforme: ${plainReport}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      // Opcional: mostrar un mensaje de éxito
    } catch (err) {
      setError('Error al copiar al portapapeles');
    }
  };

  // Función para guardar en la base de datos
  const saveToDatabase = async () => {
    if (!reportId) {
      setError('No hay un informe para guardar');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateReport(reportId, {
        content: report,
        summary: summary,
        duration: timer.toString()
      });
      // Opcional: mostrar un mensaje de éxito
    } catch (err) {
      setError('Error al guardar en la base de datos');
    } finally {
      setIsSaving(false);
    }
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
      const transcribeRes = await fetch(`${BASE_URL}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });
      if (!transcribeRes.ok) {
        throw new Error('Error al transcribir el audio');
      }
      const transcribeData = await transcribeRes.json();
      const transcript = transcribeData.transcript;
      
      // Guardar la validación de medicamentos si está disponible
      if (transcribeData.medicationValidation) {
        setMedicationValidation(transcribeData.medicationValidation);
      }

      const reportRes = await fetch(`${BASE_URL}/api/reports`, {
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
      // Procesar el contenido para asegurar espacios correctos
      const processedContent = cleanAndProcessHtml(reportData.content || '');
      const processedSummary = cleanAndProcessHtml(reportData.summary || '');
      setReport(processedContent);
      setSummary(processedSummary);
      setReportId(reportData.id || null);
      setView('report');
      
      // Recargar estadísticas si la función está disponible
      if (reloadStats) {
        reloadStats();
      }
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
    setReportId(null);
    setMedicationValidation(null);
  };

  // Función para descargar la receta médica en PDF
  const downloadReceta = async () => {
    if (!reportId) {
      setError('No hay un informe para generar la receta');
      return;
    }

    setIsDownloadingReceta(true);
    setError(null);

    try {
      // Preparar datos médicos incluyendo medicamentos si están disponibles
      const recetaData = {
        ...medicalData,
        medications: medicationValidation?.found?.map((med: any) => ({
          name: med.name,
          dosage: '',
          form: 'comprimido',
          manufacturer: '',
          type: 'Permanente',
          composition: med.name,
          instructions: 'Según indicación médica',
          startDate: new Date().toLocaleDateString('es-CL'),
          additionalNotes: '',
          audioBlob: audioBlob
        })) || []
      };

      const response = await fetch(`${BASE_URL}/api/reports/${reportId}/receta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recetaData),
      });
      
      if (!response.ok) {
        throw new Error('Error al generar la receta médica');
      }
      
      const htmlContent = await response.text();
      
      // Crear una nueva ventana con el contenido HTML
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        // Fallback: descargar como archivo HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receta_medica_${reportId}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Error al descargar la receta médica');
    } finally {
      setIsDownloadingReceta(false);
    }
  };

  // Función para descargar el informe completo en PDF
  const downloadInforme = async () => {
    if (!reportId) {
      setError('No hay un informe para descargar');
      return;
    }

    setIsDownloadingInforme(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/api/reports/${reportId}/informe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicalData),
      });
      
      if (!response.ok) {
        throw new Error('Error al generar el informe');
      }
      
      const htmlContent = await response.text();
      
      // Crear una nueva ventana con el contenido HTML
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        // Fallback: descargar como archivo HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe_medico_${reportId}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Error al descargar el informe');
    } finally {
      setIsDownloadingInforme(false);
    }
  };

  // Función para descargar el PDF de exámenes médicos
  const downloadExamenes = async () => {
    if (!reportId) {
      setError('No hay un informe para generar el documento de exámenes');
      return;
    }

    setIsDownloadingExamenes(true);
    setError(null);

    try {
      // Preparar datos con audio si está disponible
      const examenesData = {
        ...medicalData,
        audioBlob: audioBlob ? await blobToBase64(audioBlob) : undefined
      };

      const response = await fetch(`${BASE_URL}/api/reports/${reportId}/examenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examenesData),
      });
      
      if (!response.ok) {
        throw new Error('Error al generar el documento de exámenes');
      }
      
      const htmlContent = await response.text();
      
      // Crear una nueva ventana con el contenido HTML
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        // Fallback: descargar como archivo HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `examenes_medicos_${reportId}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Error al descargar el documento de exámenes');
    } finally {
      setIsDownloadingExamenes(false);
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
          <Editor
            value={cleanAndProcessHtml(summary)}
            onChange={setSummary}
            placeholder="Edita el resumen aquí..."
          />
        </div>

        <div className={styles.reportSection}>
          <h3>Informe de la atención médica</h3>
          <Editor
            value={cleanAndProcessHtml(report)}
            onChange={setReport}
            placeholder="Edita el informe aquí..."
          />
        </div>

        {/* Validación de medicamentos con IA */}
        {medicationValidation && (
          <div className={styles.reportSection}>
            <AIMedicationValidation 
              validation={medicationValidation}
              extractedMedications={medicationValidation.extractedMedications}
              summary={medicationValidation.summary}
              // aiAnalysis={medicationValidation.aiAnalysis}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={copyPlainText}>
            <Copy size={16} /> Copiar
          </button>
          <button className={styles.primaryBtn} onClick={saveToDatabase} disabled={isSaving}>
            <Download size={16} /> {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className={styles.secondaryBtn} onClick={() => setView('medicalData')}>
            <Settings size={16} /> Editar Datos
          </button>
          <button className={styles.secondaryBtn} onClick={downloadReceta} disabled={isDownloadingReceta}>
            <Receipt size={16} /> {isDownloadingReceta ? 'Descargando...' : 'Descargar Receta'}
          </button>
          <button className={styles.secondaryBtn} onClick={downloadInforme} disabled={isDownloadingInforme}>
            <FileDown size={16} /> {isDownloadingInforme ? 'Descargando...' : 'Descargar Informe'}
          </button>
          <button className={styles.secondaryBtn} onClick={downloadExamenes} disabled={isDownloadingExamenes}>
            <FileDown size={16} /> {isDownloadingExamenes ? 'Descargando...' : 'Descargar Exámenes'}
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

  const renderMedicalDataView = () => (
    <div className={styles.card}>
      <h2>Configuración de Datos Médicos</h2>
      
      <div className={styles.medicalDataForm}>
        <div className={styles.formSection}>
          <h3><User size={16} /> Datos del Médico</h3>
          
          <div className={styles.formGroup}>
            <label>Nombre de la Clínica:</label>
            <input
              type="text"
              value={medicalData.clinicName}
              onChange={(e) => updateMedicalData('clinicName', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Nombre del Médico:</label>
            <input
              type="text"
              value={medicalData.doctorName}
              onChange={(e) => updateMedicalData('doctorName', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>RUT del Médico:</label>
            <input
              type="text"
              value={medicalData.doctorRut}
              onChange={(e) => updateMedicalData('doctorRut', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Especialidad:</label>
            <input
              type="text"
              value={medicalData.doctorSpecialty}
              onChange={(e) => updateMedicalData('doctorSpecialty', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Lugar de Consulta:</label>
            <input
              type="text"
              value={medicalData.doctorLocation}
              onChange={(e) => updateMedicalData('doctorLocation', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Firma del Médico:</label>
            <div className={styles.signatureSection}>
              <small className={styles.helpText}>
                Formatos: JPG, PNG. Tamaño máximo: 2MB. La imagen se comprimirá automáticamente.
              </small>
              {medicalData.doctorSignature ? (
                <div className={styles.signaturePreview}>
                  <img src={medicalData.doctorSignature} alt="Firma del médico" />
                  <button 
                    onClick={() => updateMedicalData('doctorSignature', '')}
                    className={styles.removeSignature}
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <button onClick={openSignatureUpload} className={styles.uploadBtn}>
                  Subir Firma
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3><UserCheck size={16} /> Datos del Paciente</h3>
          
          <div className={styles.formGroup}>
            <label>Nombre del Paciente:</label>
            <input
              type="text"
              value={medicalData.patientName}
              onChange={(e) => updateMedicalData('patientName', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Género:</label>
            <select
              value={medicalData.patientGender}
              onChange={(e) => updateMedicalData('patientGender', e.target.value)}
              className={styles.select}
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>RUT del Paciente:</label>
            <input
              type="text"
              value={medicalData.patientRut}
              onChange={(e) => updateMedicalData('patientRut', e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Fecha de Nacimiento:</label>
            <input
              type="text"
              value={medicalData.patientBirthDate}
              onChange={(e) => updateMedicalData('patientBirthDate', e.target.value)}
              className={styles.input}
              placeholder="DD/MM/YYYY (XXa)"
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={saveMedicalData} className={styles.primaryBtn}>
          Guardar Datos
        </button>
        <button onClick={() => setView('report')} className={styles.secondaryBtn}>
          Cancelar
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {view === 'recording' && renderRecordingView()}
      {view === 'preview' && renderPreviewView()}
      {view === 'report' && renderReportView()}
      {view === 'medicalData' && renderMedicalDataView()}
    </div>
  );
};

export default AudioRecorder; 