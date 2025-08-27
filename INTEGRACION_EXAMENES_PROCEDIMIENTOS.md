# Integración de Procedimientos Extraídos en Exámenes Médicos

## Descripción

Se ha integrado la funcionalidad de extracción de procedimientos del audio en el endpoint de exámenes médicos, permitiendo que los exámenes generados incluyan los procedimientos reales extraídos del audio de la consulta médica en lugar de contenido genérico.

## Características Principales

### 🎯 **Integración Automática**
- **Extracción automática** de procedimientos del audio
- **Inclusión en exámenes** de procedimientos reales extraídos
- **Fallback inteligente** si no hay procedimientos disponibles
- **Diseño mejorado** con información estructurada

### 📋 **Información Incluida en Exámenes**
- **Nombre del procedimiento** extraído del audio
- **Descripción detallada** del procedimiento
- **Instrucciones específicas** para el paciente
- **Frecuencia** y duración del tratamiento
- **Prioridad** con indicadores visuales (Alta, Media, Baja)
- **Categoría** del procedimiento
- **Preparación requerida** (si aplica)
- **Seguimiento** requerido
- **Notas adicionales**

## Implementación Técnica

### **Backend - Endpoint de Exámenes**

#### **Modificación en `apps/http-api/src/routes/reports.ts`:**

```typescript
// Extraer procedimientos del audio si está disponible
let procedures = medicalData?.procedures || [];

if (procedures.length === 0 && medicalData?.audioBlob && OPENAI_API_KEY) {
    try {
        // Convertir base64 a Blob
        const audioBuffer = Buffer.from(medicalData.audioBlob, 'base64');
        const blob = new Blob([audioBuffer], { type: 'audio/webm' });
        
        const audioExtraction = await extractProceduresFromAudio(blob, OPENAI_API_KEY);
        if (audioExtraction.procedures && audioExtraction.procedures.length > 0) {
            procedures = audioExtraction.procedures;
        }
    } catch (error) {
        console.error('Error extracting procedures from audio:', error);
    }
}

// Si no hay procedimientos, usar información del reporte como fallback
if (procedures.length === 0) {
    procedures = [
        {
            name: 'Consulta Médica',
            description: report.summary || 'Sin hallazgos específicos reportados',
            instructions: 'Seguir indicaciones médicas',
            frequency: 'Una vez',
            duration: 'Indefinido',
            priority: 'Media',
            category: 'Consulta'
        }
    ];
}
```

### **Frontend - API Client**

#### **Nueva función en `apps/portal/src/api/index.ts`:**

```typescript
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
    audioBlob?: string;
}) => {
    return apiInstance.post(`/api/reports/${reportId}/examenes`, data, {
        responseType: 'blob',
    }).then(r => r.data);
};
```

### **Componente - Funcionalidad Extendida**

#### **Nueva función en `apps/portal/src/components/AudioProcedureExtraction.tsx`:**

```typescript
const downloadExamenesWithProcedures = async () => {
    if (!result) return;

    try {
        // Convertir audio a base64
        const arrayBuffer = await audioBlob!.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
            audioBlob: base64Audio
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
```

## Diseño Mejorado del HTML

### **Estructura de Procedimientos en Exámenes:**

```html
<div class="exam-result">
    <div class="exam-name">
        1. Análisis de Sangre
        <span class="priority-badge priority-alta">Alta</span>
    </div>
    <div class="exam-description">
        <strong>Descripción:</strong> Examen de laboratorio para evaluar parámetros sanguíneos
    </div>
    <div class="exam-instructions">
        <strong>Instrucciones:</strong> Acudir en ayunas de 8 horas al laboratorio
    </div>
    <div class="exam-details">
        <div class="exam-detail">
            <strong>Frecuencia:</strong> Una vez
        </div>
        <div class="exam-detail">
            <strong>Duración:</strong> 1 día
        </div>
        <div class="exam-detail">
            <strong>Categoría:</strong> Examen
        </div>
        <div class="exam-detail">
            <strong>Preparación:</strong> Ayuno de 8 horas
        </div>
        <div class="exam-detail">
            <strong>Seguimiento:</strong> Retirar resultados en 24 horas
        </div>
    </div>
    <div style="margin-top: 8px; font-size: 12px; color: #666; font-style: italic;">
        <strong>Notas:</strong> Llevar orden médica
    </div>
</div>
```

### **Estilos CSS Mejorados:**

```css
.exam-result { 
    margin-bottom: 15px; 
    padding: 15px; 
    border-left: 4px solid #008080; 
    background: #f8f9fa; 
}
.exam-name { 
    font-weight: bold; 
    color: #333; 
    margin-bottom: 8px; 
    font-size: 16px; 
}
.exam-description { 
    color: #666; 
    font-size: 14px; 
    margin-bottom: 8px; 
}
.exam-instructions { 
    color: #008080; 
    font-size: 14px; 
    font-weight: 500; 
    margin-bottom: 5px; 
}
.exam-details { 
    display: flex; 
    gap: 20px; 
    margin-top: 10px; 
    font-size: 12px; 
    color: #666; 
}
.priority-badge { 
    padding: 2px 8px; 
    border-radius: 12px; 
    font-size: 10px; 
    font-weight: bold; 
    text-transform: uppercase; 
}
.priority-alta { background: #e74c3c; color: white; }
.priority-media { background: #f39c12; color: white; }
.priority-baja { background: #27ae60; color: white; }
```

## Flujo de Integración

### **1. Extracción de Procedimientos**
- El audio se transcribe usando Whisper
- Se extraen procedimientos usando IA
- Se validan y mejoran los procedimientos

### **2. Integración en Exámenes**
- Los procedimientos extraídos se incluyen en el HTML
- Se aplica diseño mejorado con información estructurada
- Se muestran indicadores de prioridad

### **3. Fallback Inteligente**
- Si no hay procedimientos, usa información del reporte
- Mantiene compatibilidad con el sistema existente
- No rompe la funcionalidad actual

## Casos de Uso

### **Caso 1: Procedimientos Extraídos del Audio**
- **Audio**: "Necesito que te hagas un análisis de sangre completo, en ayunas de 8 horas"
- **Resultado**: Examen incluye procedimiento específico con instrucciones detalladas

### **Caso 2: Múltiples Procedimientos**
- **Audio**: "También te voy a dar fisioterapia 3 veces por semana y control en 15 días"
- **Resultado**: Examen incluye múltiples procedimientos con frecuencia y seguimiento

### **Caso 3: Sin Procedimientos Específicos**
- **Audio**: "El paciente presenta síntomas generales"
- **Resultado**: Examen usa información del reporte como fallback

## Beneficios

### **Para Médicos**
- ⚡ **Automatización**: Procedimientos extraídos automáticamente
- 📝 **Precisión**: Información específica del audio
- 🔄 **Consistencia**: Formato estandarizado
- 📱 **Facilidad**: Solo grabar la consulta

### **Para Pacientes**
- 📋 **Claridad**: Instrucciones específicas y claras
- ✅ **Completitud**: Información detallada de cada procedimiento
- 📄 **Profesionalismo**: Documento médico estructurado
- 🎯 **Acción**: Enfoque en lo que debe hacer

### **Para el Sistema**
- 🤖 **Integración**: Funcionalidad unificada
- 📊 **Trazabilidad**: Registro completo de procedimientos
- 🔍 **Auditoría**: Información estructurada
- 🎯 **Especialización**: Exámenes específicos y relevantes

## Diferencias con Versión Anterior

### **Versión Anterior:**
- ❌ Contenido genérico: "Medicina General - Medicina General"
- ❌ Información limitada: Solo resumen del reporte
- ❌ Sin estructura: Información no organizada
- ❌ Sin procedimientos específicos

### **Versión Actual:**
- ✅ Procedimientos reales extraídos del audio
- ✅ Información detallada y estructurada
- ✅ Diseño profesional con indicadores visuales
- ✅ Instrucciones específicas para cada procedimiento

## Archivos Modificados

### **Backend:**
- ✅ `apps/http-api/src/routes/reports.ts` - Integración de procedimientos en exámenes

### **Frontend:**
- ✅ `apps/portal/src/api/index.ts` - Nueva función `downloadExamenes`
- ✅ `apps/portal/src/components/AudioProcedureExtraction.tsx` - Funcionalidad extendida

## Conclusión

La integración de procedimientos extraídos del audio en los exámenes médicos representa una mejora significativa en la funcionalidad del sistema. Ahora los exámenes incluyen información real y específica extraída directamente del audio de la consulta médica, proporcionando documentos más útiles y relevantes tanto para médicos como para pacientes.

La implementación mantiene compatibilidad con el sistema existente mientras agrega funcionalidad avanzada de extracción y presentación de procedimientos médicos.
