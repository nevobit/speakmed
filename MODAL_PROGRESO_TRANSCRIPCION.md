# Modal de Progreso para Transcripción y Análisis

## Descripción

Se ha implementado un modal de progreso que muestra en tiempo real el estado de la transcripción del audio y el análisis médico, proporcionando feedback visual detallado sobre el tiempo que toma cada proceso y el progreso general.

## Características Principales

### 🎯 **Funcionalidad del Modal**
- **Progreso en tiempo real** de transcripción y análisis
- **Tiempo de duración** de cada paso del proceso
- **Estados visuales** claros (pendiente, en progreso, completado, error)
- **Barra de progreso general** con porcentaje de completado
- **Información detallada** de cada paso del proceso

### 📋 **Pasos del Proceso**
1. **Transcripción del Audio** → Convierte audio a texto usando OpenAI Whisper
2. **Análisis Médico** → Procesa el texto y genera el informe médico
3. **Generación del Informe** → Crea el documento final con formato

### 🔄 **Flujo de Usuario**
1. **Usuario graba audio** y selecciona plantilla
2. **Hace clic en "Generar informe"** → Se abre el modal de progreso
3. **Ve el progreso en tiempo real** de cada paso
4. **Modal se cierra automáticamente** cuando termina el proceso
5. **Resultado** → Informe médico generado y listo para usar

## Implementación Técnica

### **Componente ProgressModal**

#### **Archivo: `apps/portal/src/components/ProgressModal/ProgressModal.tsx`**

```typescript
interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  duration?: number;
  error?: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  steps: ProgressStep[];
  currentStep: string;
  totalDuration: number;
  onClose?: () => void;
}
```

#### **Características del Componente:**
- ✅ **Estados de progreso** con iconos visuales
- ✅ **Tiempo de duración** de cada paso
- ✅ **Barra de progreso general** con porcentaje
- ✅ **Manejo de errores** con mensajes informativos
- ✅ **Animaciones** para estados en progreso
- ✅ **Diseño responsivo** para diferentes pantallas

### **Integración en AudioRecorder**

#### **Estados Agregados:**

```typescript
// Estados para el modal de progreso
const [showProgressModal, setShowProgressModal] = useState(false);
const [progressSteps, setProgressSteps] = useState([
  { id: 'transcription', title: 'Transcripción del Audio', status: 'pending' as const },
  { id: 'analysis', title: 'Análisis Médico', status: 'pending' as const },
  { id: 'report-generation', title: 'Generación del Informe', status: 'pending' as const }
]);
const [currentProgressStep, setCurrentProgressStep] = useState('');
const [progressStartTime, setProgressStartTime] = useState(0);
const [progressDuration, setProgressDuration] = useState(0);
```

#### **Funciones de Control:**

```typescript
// Función para actualizar el estado de un paso
const updateProgressStep = (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error', duration?: number, error?: string) => {
  setProgressSteps(prev => prev.map(step => 
    step.id === stepId 
      ? { ...step, status, duration, error }
      : step
  ));
};

// Función para iniciar el progreso
const startProgress = () => {
  setShowProgressModal(true);
  setProgressStartTime(Date.now());
  setProgressDuration(0);
  setCurrentProgressStep('transcription');
  
  // Resetear todos los pasos a pending
  setProgressSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, duration: undefined, error: undefined })));
};

// Función para cerrar el modal
const closeProgressModal = () => {
  setShowProgressModal(false);
  setProgressStartTime(0);
  setProgressDuration(0);
  setCurrentProgressStep('');
};
```

### **Modificación de generateReport**

#### **Proceso con Progreso Detallado:**

```typescript
const generateReport = async () => {
  // ... validaciones iniciales ...
  
  // Iniciar el modal de progreso
  startProgress();

  try {
    // Paso 1: Transcripción del Audio
    const transcriptionStartTime = Date.now();
    updateProgressStep('transcription', 'in-progress');
    setCurrentProgressStep('transcription');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const transcribeRes = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });
    
    // Completar transcripción
    const transcriptionDuration = Math.floor((Date.now() - transcriptionStartTime) / 1000);
    updateProgressStep('transcription', 'completed', transcriptionDuration);

    // Paso 2: Análisis Médico
    const analysisStartTime = Date.now();
    updateProgressStep('analysis', 'in-progress');
    setCurrentProgressStep('analysis');

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
    
    // Completar análisis
    const analysisDuration = Math.floor((Date.now() - analysisStartTime) / 1000);
    updateProgressStep('analysis', 'completed', analysisDuration);

    // Paso 3: Generación del Informe
    const reportStartTime = Date.now();
    updateProgressStep('report-generation', 'in-progress');
    setCurrentProgressStep('report-generation');

    const reportData = await reportRes.json();
    
    // Procesar y guardar datos
    const processedContent = cleanAndProcessHtml(reportData.content || '');
    const processedSummary = cleanAndProcessHtml(reportData.summary || '');
    setReport(processedContent);
    setSummary(processedSummary);
    setReportId(reportData.id || null);
    
    // Completar generación del informe
    const reportDuration = Math.floor((Date.now() - reportStartTime) / 1000);
    updateProgressStep('report-generation', 'completed', reportDuration);
    
    // Cerrar modal de progreso después de un breve delay
    setTimeout(() => {
      closeProgressModal();
      setView('report');
    }, 1000);
    
  } catch (err) {
    // Marcar el paso actual como error
    updateProgressStep(currentProgressStep, 'error', undefined, err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    
    // Cerrar modal de progreso después de mostrar el error
    setTimeout(() => {
      closeProgressModal();
    }, 3000);
  } finally {
    setIsLoading(false);
  }
};
```

## Interfaz de Usuario

### **Diseño del Modal**

#### **Estructura Visual:**
- **Header** → Título "Procesando Audio" con botón de cerrar
- **Barra de Progreso General** → Muestra porcentaje de completado
- **Lista de Pasos** → Cada paso con su estado y duración
- **Información Adicional** → Tiempo total y pasos completados

#### **Estados Visuales:**
- **Pendiente** → Icono de reloj gris
- **En Progreso** → Icono giratorio azul con barra de progreso
- **Completado** → Icono de check verde con duración
- **Error** → Icono de alerta rojo con mensaje de error

### **Estilos CSS**

#### **Archivo: `apps/portal/src/components/ProgressModal/ProgressModal.module.css`**

```css
/* Modal Overlay */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

/* Barra de Progreso */
.progressBar {
  width: 100%;
  height: 0.8rem;
  background: #e2e8f0;
  border-radius: 0.4rem;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 0.4rem;
  transition: width 0.3s ease;
}

/* Pasos del Proceso */
.stepItem {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  padding: 1.2rem;
  border-radius: 0.8rem;
  border: 0.1rem solid #e5e7eb;
  background: #fff;
  transition: all 0.2s;
}

.stepItem.currentStep {
  border-color: #3b82f6;
  background: #f0f9ff;
  box-shadow: 0 0.2rem 0.8rem rgba(59, 130, 246, 0.1);
}

/* Iconos de Estado */
.completedIcon { color: #16a34a; }
.errorIcon { color: #dc2626; }
.pendingIcon { color: #64748b; }
.spinningIcon { 
  color: #3b82f6;
  animation: spin 1s linear infinite;
}
```

## Flujo de Integración

### **1. Inicio del Proceso**
- Usuario hace clic en "Generar informe"
- Se abre el modal de progreso
- Se inicia el cronómetro general

### **2. Transcripción del Audio**
- Paso marcado como "en progreso"
- Se envía el audio al servidor
- Se muestra el tiempo transcurrido
- Al completarse, se marca como "completado" con duración

### **3. Análisis Médico**
- Paso marcado como "en progreso"
- Se procesa el texto transcrito
- Se genera el informe médico
- Al completarse, se marca como "completado" con duración

### **4. Generación del Informe**
- Paso marcado como "en progreso"
- Se procesa y formatea el contenido
- Se guardan los datos finales
- Al completarse, se marca como "completado" con duración

### **5. Finalización**
- Modal se cierra automáticamente
- Usuario ve el informe generado
- Proceso completado exitosamente

## Casos de Uso

### **Caso 1: Proceso Exitoso**
- **Usuario**: Graba audio y genera informe
- **Progreso**: Ve cada paso completándose
- **Resultado**: Informe generado en tiempo esperado

### **Caso 2: Error en Transcripción**
- **Usuario**: Audio con problemas de calidad
- **Progreso**: Ve error en paso de transcripción
- **Resultado**: Mensaje de error claro y específico

### **Caso 3: Error en Análisis**
- **Usuario**: Audio con contenido no médico
- **Progreso**: Ve error en paso de análisis
- **Resultado**: Información sobre el problema específico

## Beneficios

### **Para Usuarios**
- ✅ **Transparencia total** del proceso
- ✅ **Feedback visual** en tiempo real
- ✅ **Información de duración** de cada paso
- ✅ **Manejo claro de errores**
- ✅ **Experiencia profesional** y confiable

### **Para el Sistema**
- 🤖 **Monitoreo de rendimiento** de cada paso
- 📊 **Métricas de tiempo** para optimización
- 🔍 **Debugging mejorado** con información detallada
- 🎯 **Experiencia de usuario** significativamente mejorada

## Diferencias con Versión Anterior

### **Versión Anterior:**
- ❌ Solo indicador de carga genérico
- ❌ Sin información de progreso
- ❌ Sin detalles de duración
- ❌ Manejo de errores limitado

### **Versión Actual:**
- ✅ Modal de progreso detallado
- ✅ Información de cada paso del proceso
- ✅ Tiempo de duración de cada paso
- ✅ Manejo visual de errores
- ✅ Experiencia de usuario profesional

## Archivos Modificados

### **Frontend:**
- ✅ `apps/portal/src/components/ProgressModal/ProgressModal.tsx` - Componente del modal
- ✅ `apps/portal/src/components/ProgressModal/ProgressModal.module.css` - Estilos del modal
- ✅ `apps/portal/src/components/AudioRecorder/AudioRecorder.tsx` - Integración del modal

## Testing

### **Pruebas Manuales**
1. **Grabar audio** y generar informe
2. **Verificar modal** se abre correctamente
3. **Observar progreso** de cada paso
4. **Verificar duración** de cada proceso
5. **Probar manejo de errores**

### **Funcionalidades a Verificar**
- ✅ Modal se abre al iniciar proceso
- ✅ Progreso se actualiza en tiempo real
- ✅ Tiempo de duración se muestra correctamente
- ✅ Estados visuales funcionan apropiadamente
- ✅ Modal se cierra automáticamente al completar
- ✅ Manejo de errores funciona correctamente

## Conclusión

El modal de progreso representa una mejora significativa en la experiencia de usuario del sistema de transcripción y análisis médico. Proporciona transparencia total del proceso, información detallada sobre el rendimiento de cada paso, y un manejo profesional de errores.

La implementación mantiene la funcionalidad existente mientras agrega una capa de feedback visual que mejora significativamente la confianza del usuario en el sistema y proporciona información valiosa para el monitoreo y optimización del rendimiento.

### **Características Destacadas:**
- 🎯 **Progreso en tiempo real** con información detallada
- ⏱️ **Métricas de duración** para cada paso del proceso
- 🎨 **Interfaz visual profesional** con estados claros
- 🔄 **Manejo robusto de errores** con información específica
- 📱 **Diseño responsivo** para diferentes dispositivos


