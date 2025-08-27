# Integración Completa de Procedimientos en AudioRecorder

## Descripción

Se ha integrado completamente la funcionalidad de extracción de procedimientos del audio en el componente `AudioRecorder` existente, permitiendo que los exámenes generados incluyan automáticamente los procedimientos reales extraídos del audio de la consulta médica.

## Características Principales

### 🎯 **Integración Automática en AudioRecorder**
- **Extracción automática** de procedimientos del audio grabado
- **Inclusión en exámenes** de procedimientos reales extraídos
- **Compatibilidad total** con el flujo existente de AudioRecorder
- **Sin cambios en la interfaz** del usuario

### 📋 **Flujo Integrado**
1. **Grabación de Audio** → Usuario graba la consulta médica
2. **Generación de Reporte** → Se crea el informe médico
3. **Descarga de Exámenes** → Automáticamente incluye procedimientos extraídos
4. **Resultado** → Examen con procedimientos reales del audio

## Implementación Técnica

### **Backend - Endpoint de Exámenes**

#### **Modificación en `apps/http-api/src/routes/reports.ts`:**

```typescript
// Extraer procedimientos del audio si está disponible
let procedures: any[] = [];
console.log({ "audioBlob": medicalData.audioBlob })

if (procedures.length === 0 && medicalData?.audioBlob) {
    try {
        // Convertir base64 a Blob
        console.log({ "audioBlob": medicalData.audioBlob })
        const audioBuffer = Buffer.from(medicalData.audioBlob, 'base64');
        const blob = new Blob([audioBuffer], { type: 'audio/webm' });

        const audioExtraction = await extractProceduresFromAudio(blob, OPENAI_API_KEY!);

        if (audioExtraction.procedures && audioExtraction.procedures.length > 0) {
            procedures = audioExtraction.procedures;
            console.log({ procedures })
        }
    } catch (error) {
        console.error('Error extracting procedures from audio:', error);
    }
}
```

### **Frontend - AudioRecorder Component**

#### **Modificación en `apps/portal/src/components/AudioRecorder/AudioRecorder.tsx`:**

```typescript
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
```

### **API Client - Tipos Corregidos**

#### **Modificación en `apps/portal/src/api/index.ts`:**

```typescript
// Descargar exámenes con procedimientos extraídos
export const downloadExamenes = (reportId: string, data: {
  clinicName?: string;
  doctorName?: string;
  doctorRut?: string;
  doctorSpecialty?: string;
  doctorLocation?: string;
  patientName?: string;
  patientGender?: string;
  patientRut?: string;
  patientBirthDate?: string;
  doctorSignature?: string;
  procedures?: any[];
  audioBlob?: string; // Cambiado de Blob a string (base64)
}) => {
  return apiInstance.post(`/api/reports/${reportId}/examenes`, data, {
    responseType: 'blob',
  }).then(r => r.data);
};
```

## Flujo de Integración Completo

### **1. Grabación de Audio**
- Usuario graba la consulta médica usando AudioRecorder
- El audio se almacena como Blob en el estado del componente

### **2. Generación de Reporte**
- Se genera el informe médico con transcripción y resumen
- Se obtiene el reportId para futuras operaciones

### **3. Descarga de Exámenes**
- Al hacer clic en "Descargar Exámenes":
  - Se convierte el audio Blob a base64
  - Se envía al backend con los datos médicos
  - El backend extrae procedimientos del audio
  - Se genera el HTML con procedimientos reales

### **4. Resultado**
- Examen HTML con procedimientos extraídos del audio
- Información estructurada y profesional
- Instrucciones específicas para el paciente

## Casos de Uso

### **Caso 1: Consulta con Procedimientos Específicos**
- **Usuario graba**: "Necesito que te hagas un análisis de sangre completo, en ayunas de 8 horas"
- **Resultado**: Examen incluye procedimiento específico con instrucciones detalladas

### **Caso 2: Múltiples Procedimientos**
- **Usuario graba**: "También te voy a dar fisioterapia 3 veces por semana y control en 15 días"
- **Resultado**: Examen incluye múltiples procedimientos con frecuencia y seguimiento

### **Caso 3: Sin Procedimientos Específicos**
- **Usuario graba**: "El paciente presenta síntomas generales"
- **Resultado**: Examen usa información del reporte como fallback

## Beneficios

### **Para Usuarios Existentes**
- ✅ **Sin cambios en la interfaz**: Mismo flujo de trabajo
- ✅ **Funcionalidad automática**: No requiere configuración adicional
- ✅ **Compatibilidad total**: Funciona con el sistema existente
- ✅ **Mejora automática**: Exámenes más útiles sin esfuerzo adicional

### **Para el Sistema**
- 🤖 **Automatización completa**: Sin intervención manual
- 📊 **Trazabilidad**: Registro completo de procedimientos
- 🔍 **Auditoría**: Información estructurada
- 🎯 **Relevancia**: Exámenes específicos y útiles

## Diferencias con Versión Anterior

### **Versión Anterior:**
- ❌ Contenido genérico en exámenes
- ❌ Sin extracción de procedimientos del audio
- ❌ Información limitada del reporte

### **Versión Actual:**
- ✅ Procedimientos reales extraídos del audio
- ✅ Integración automática en AudioRecorder
- ✅ Información detallada y estructurada
- ✅ Compatibilidad total con flujo existente

## Archivos Modificados

### **Backend:**
- ✅ `apps/http-api/src/routes/reports.ts` - Integración de procedimientos en exámenes

### **Frontend:**
- ✅ `apps/portal/src/components/AudioRecorder/AudioRecorder.tsx` - Función downloadExamenes modificada
- ✅ `apps/portal/src/api/index.ts` - Tipos corregidos para audioBlob

## Testing

### **Pruebas Manuales**
1. **Grabar audio** con procedimientos mencionados usando AudioRecorder
2. **Generar reporte** normalmente
3. **Descargar exámenes** usando el botón existente
4. **Verificar** que incluye procedimientos extraídos del audio

### **Logs de Debugging**
Los logs muestran:
- `{ "audioBlob": "base64string" }` - Audio convertido a base64
- `{ procedures: [...] }` - Procedimientos extraídos del audio

## Conclusión

La integración completa en AudioRecorder representa una mejora significativa en la funcionalidad del sistema sin requerir cambios en la experiencia del usuario. Los exámenes ahora incluyen automáticamente los procedimientos reales extraídos del audio de la consulta médica, proporcionando documentos más útiles y relevantes.

La implementación mantiene total compatibilidad con el flujo existente mientras agrega funcionalidad avanzada de extracción y presentación de procedimientos médicos de manera transparente para el usuario.
