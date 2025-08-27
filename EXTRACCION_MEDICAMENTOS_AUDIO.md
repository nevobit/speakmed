# Extracción de Medicamentos del Audio

## Descripción

Nueva funcionalidad que permite extraer automáticamente medicamentos recetados directamente desde archivos de audio de consultas médicas, utilizando IA avanzada y validación contra el Vademecum de Chile.

## Características Principales

### 🎯 **Extracción Inteligente**
- Transcribe automáticamente el audio usando OpenAI Whisper
- Extrae medicamentos con detalles completos usando GPT-3.5-turbo
- Valida medicamentos contra el Vademecum de Chile
- Calcula nivel de confianza de la extracción

### 📋 **Información Extraída**
- **Nombre del medicamento**
- **Dosis específica** (500mg, 10ml, etc.)
- **Forma farmacéutica** (comprimido, jarabe, inyección, etc.)
- **Instrucciones de uso** detalladas
- **Composición** del medicamento
- **Fabricante** (si se menciona)
- **Tipo de tratamiento** (Permanente, Temporal, SOS)
- **Fecha de inicio** (si se menciona)
- **Notas adicionales**

### 🔄 **Flujo de Procesamiento**

1. **Grabación/Subida de Audio**
   - Grabación directa desde el navegador
   - Soporte para archivos de audio existentes

2. **Transcripción**
   - Uso de OpenAI Whisper para transcripción precisa
   - Soporte para español chileno

3. **Extracción de Medicamentos**
   - Análisis del texto transcrito con IA
   - Identificación de medicamentos y sus detalles

4. **Validación**
   - Validación contra Vademecum de Chile
   - Corrección de nombres y dosis
   - Mejora de instrucciones

5. **Resultados**
   - Lista estructurada de medicamentos
   - Nivel de confianza de la extracción
   - Texto transcrito completo

## Implementación Técnica

### Backend

#### **Business Logic (`packages/business-logic/src/medications/extract-from-audio.ts`)**

```typescript
export const extractMedicationsFromAudio = async (
  audioBlob: Blob,
  apiKey: string
): Promise<MedicationExtractionResult>
```

**Funciones principales:**
- `transcribeAudio()`: Transcribe audio usando Whisper
- `extractMedicationsFromText()`: Extrae medicamentos del texto
- `validateMedications()`: Valida contra Vademecum
- `calculateConfidence()`: Calcula nivel de confianza

#### **API Endpoint (`apps/http-api/src/routes/audio-medication-extraction.ts`)**

```typescript
POST /api/audio-medication-extraction
Content-Type: multipart/form-data
```

**Respuesta:**
```json
{
  "medications": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "form": "comprimido",
      "instructions": "1 comprimido cada 8 horas",
      "composition": "Paracetamol 500mg",
      "type": "Temporal",
      "startDate": "01/01/2024",
      "manufacturer": "Laboratorio Chile",
      "additionalNotes": "Tomar con alimentos"
    }
  ],
  "summary": {
    "totalMedications": 1,
    "confidence": 85,
    "extractionMethod": "AI + Vademecum Validation"
  },
  "rawText": "Texto transcrito completo..."
}
```

### Frontend

#### **API Client (`apps/portal/src/api/index.ts`)**

```typescript
export const extractMedicationsFromAudio = (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  
  return apiInstance.post('/api/audio-medication-extraction', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(r => r.data);
};
```

#### **Componente de Prueba (`apps/portal/src/components/AudioMedicationExtraction.tsx`)**

- Interfaz completa para grabación de audio
- Visualización de resultados
- Descarga de lista de medicamentos
- Manejo de errores

## Integración con Recetas

### **Uso en Generación de Recetas**

La función se integra automáticamente en el proceso de generación de recetas:

1. **Extracción automática**: Si no hay medicamentos en el informe, intenta extraer del audio
2. **Validación**: Los medicamentos extraídos se validan contra el Vademecum
3. **Inclusión en PDF**: Los medicamentos validados se incluyen en la receta generada

### **Flujo de Integración**

```typescript
// En el endpoint de receta
if (medications.length === 0 && medicalData?.audioBlob) {
  try {
    const audioExtraction = await extractMedicationsFromAudio(medicalData.audioBlob, OPENAI_API_KEY);
    if (audioExtraction.medications && audioExtraction.medications.length > 0) {
      medications = audioExtraction.medications;
    }
  } catch (error) {
    console.error('Error extracting medications from audio:', error);
  }
}
```

## Casos de Uso

### **Caso 1: Consulta Médica Completa**
- **Audio**: "El paciente presenta dolor de cabeza, le receto paracetamol 500mg cada 8 horas por 5 días"
- **Resultado**: Medicamento extraído con dosis, frecuencia y duración

### **Caso 2: Múltiples Medicamentos**
- **Audio**: "También le doy ibuprofeno 400mg para la inflamación y omeprazol 20mg en ayunas"
- **Resultado**: Lista de 3 medicamentos con instrucciones específicas

### **Caso 3: Medicamentos Especializados**
- **Audio**: "Le prescribo atorvastatina 20mg de Laboratorio Chile, tomar en la noche"
- **Resultado**: Medicamento con fabricante y horario específico

## Configuración

### **Variables de Entorno Requeridas**

```bash
OPENAI_API_KEY=tu_api_key_de_openai
```

### **Dependencias**

```json
{
  "axios": "^1.0.0",
  "@repo/business-logic": "workspace:*"
}
```

## Pruebas

### **Archivo de Prueba (`test-medication-validation.js`)**

```javascript
// Probar extracción de medicamentos
const testData = {
  text: 'El paciente presenta dolor de cabeza y le receté paracetamol 500mg cada 8 horas, también ibuprofeno para la inflamación',
  country: 'CHL'
};

const response = await axios.post(`${BASE_URL}/api/medication-validation`, testData);
```

### **Pruebas Manuales**

1. **Grabar audio** con medicamentos mencionados
2. **Procesar extracción** usando el componente
3. **Verificar resultados** en la interfaz
4. **Descargar lista** de medicamentos
5. **Generar receta** con medicamentos extraídos

## Beneficios

### **Para Médicos**
- ⚡ **Ahorro de tiempo**: No necesita escribir manualmente los medicamentos
- 📝 **Precisión**: Extracción automática con validación
- 🔄 **Consistencia**: Formato estandarizado para todas las recetas
- 📱 **Facilidad**: Solo grabar la consulta

### **Para Pacientes**
- 📋 **Claridad**: Instrucciones detalladas y claras
- ✅ **Validación**: Medicamentos verificados contra Vademecum
- 📄 **Documentación**: Receta completa y profesional

### **Para el Sistema**
- 🤖 **Automatización**: Proceso completamente automatizado
- 📊 **Trazabilidad**: Registro completo de medicamentos
- 🔍 **Auditoría**: Información estructurada para auditorías

## Limitaciones y Consideraciones

### **Limitaciones Técnicas**
- **Calidad del audio**: Requiere audio claro para transcripción precisa
- **Dependencia de IA**: Requiere conexión a OpenAI
- **Idioma**: Optimizado para español chileno

### **Consideraciones Médicas**
- **Validación humana**: Los resultados deben ser revisados por el médico
- **Contexto clínico**: La IA puede no capturar todo el contexto médico
- **Actualizaciones**: El Vademecum debe mantenerse actualizado

## Futuras Mejoras

### **Funcionalidades Planificadas**
1. **Soporte multiidioma**: Inglés, portugués, etc.
2. **Validación en tiempo real**: Feedback inmediato durante la grabación
3. **Integración con sistemas hospitalarios**: Conectividad con HIS
4. **Análisis de interacciones**: Detección de interacciones medicamentosas
5. **Personalización**: Adaptación a especialidades médicas específicas

### **Optimizaciones Técnicas**
1. **Caché de transcripciones**: Evitar reprocesamiento
2. **Procesamiento offline**: Funcionalidad sin conexión
3. **Compresión de audio**: Optimización de transferencia
4. **Validación local**: Validación sin dependencia externa

## Archivos Creados/Modificados

### **Nuevos Archivos:**
- ✅ `packages/business-logic/src/medications/extract-from-audio.ts`
- ✅ `apps/http-api/src/routes/audio-medication-extraction.ts`
- ✅ `apps/portal/src/components/AudioMedicationExtraction.tsx`
- ✅ `EXTRACCION_MEDICAMENTOS_AUDIO.md`

### **Archivos Modificados:**
- ✅ `packages/business-logic/src/index.ts`
- ✅ `apps/http-api/src/routes/index.ts`
- ✅ `apps/portal/src/api/index.ts`
- ✅ `apps/http-api/src/routes/reports.ts`

## Conclusión

Esta nueva funcionalidad representa un avance significativo en la automatización de procesos médicos, permitiendo extraer medicamentos directamente del audio de consultas médicas con alta precisión y validación automática. La integración con el sistema de recetas existente asegura una experiencia fluida y profesional para médicos y pacientes.
