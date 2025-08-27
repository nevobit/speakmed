# Extracción de Procedimientos Médicos del Audio

## Descripción

Nueva funcionalidad que permite extraer automáticamente procedimientos médicos, exámenes y tratamientos directamente desde archivos de audio de consultas médicas, utilizando IA avanzada para generar recetas enfocadas únicamente en las acciones que el paciente debe realizar.

## Características Principales

### 🎯 **Extracción Especializada**
- Transcribe automáticamente el audio usando OpenAI Whisper
- Extrae procedimientos específicos que el paciente debe realizar
- **NO incluye diagnósticos ni resúmenes generales**
- Enfocado en acciones concretas: exámenes, tratamientos, terapias, controles

### 📋 **Información Extraída**
- **Nombre del procedimiento**
- **Descripción detallada** del procedimiento
- **Instrucciones específicas** para el paciente
- **Frecuencia** (diario, cada 8 horas, semanal, etc.)
- **Duración** del tratamiento
- **Prioridad** (Alta, Media, Baja)
- **Categoría** (Examen, Tratamiento, Terapia, Cirugía, Control, etc.)
- **Preparación requerida** (si aplica)
- **Seguimiento** requerido
- **Notas adicionales**

### 🔄 **Flujo de Procesamiento**

1. **Grabación/Subida de Audio**
   - Grabación directa desde el navegador
   - Soporte para archivos de audio existentes

2. **Transcripción**
   - Uso de OpenAI Whisper para transcripción precisa
   - Soporte para español chileno

3. **Extracción de Procedimientos**
   - Análisis del texto transcrito con IA
   - Identificación de procedimientos específicos para el paciente
   - **Filtrado de información no relevante** (diagnósticos, resúmenes)

4. **Validación**
   - Validación médica de procedimientos
   - Mejora de instrucciones para claridad del paciente
   - Categorización y priorización

5. **Generación de Receta**
   - Receta HTML enfocada solo en procedimientos
   - Diseño profesional y claro
   - Información estructurada para el paciente

## Implementación Técnica

### Backend

#### **Business Logic (`packages/business-logic/src/procedures/extract-from-audio.ts`)**

```typescript
export const extractProceduresFromAudio = async (
  audioBlob: Blob,
  apiKey: string
): Promise<ProcedureExtractionResult>
```

**Funciones principales:**
- `transcribeAudio()`: Transcribe audio usando Whisper
- `extractProceduresFromText()`: Extrae procedimientos del texto
- `validateProcedures()`: Valida y mejora procedimientos
- `calculateConfidence()`: Calcula nivel de confianza

#### **API Endpoint (`apps/http-api/src/routes/audio-procedure-extraction.ts`)**

```typescript
POST /api/audio-procedure-extraction
Content-Type: multipart/form-data
```

**Respuesta:**
```json
{
  "procedures": [
    {
      "name": "Análisis de Sangre",
      "description": "Examen de laboratorio para evaluar parámetros sanguíneos",
      "instructions": "Acudir en ayunas de 8 horas al laboratorio",
      "frequency": "Una vez",
      "duration": "1 día",
      "priority": "Alta",
      "category": "Examen",
      "preparation": "Ayuno de 8 horas",
      "followUp": "Retirar resultados en 24 horas",
      "additionalNotes": "Llevar orden médica"
    }
  ],
  "summary": {
    "totalProcedures": 1,
    "confidence": 85,
    "extractionMethod": "AI + Medical Validation"
  },
  "rawText": "Texto transcrito completo..."
}
```

### Frontend

#### **API Client (`apps/portal/src/api/index.ts`)**

```typescript
export const extractProceduresFromAudio = (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  
  return apiInstance.post('/api/audio-procedure-extraction', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(r => r.data);
};

export const downloadProceduresRecipe = (data: {
  reportId: string;
  patientData: any;
  procedures?: any[];
  audioBlob?: string;
}) => {
  return apiInstance.post('/api/download-procedures-recipe', data, {
    responseType: 'blob',
  }).then(r => r.data);
};
```

#### **Componente de Prueba (`apps/portal/src/components/AudioProcedureExtraction.tsx`)**

- Interfaz completa para grabación de audio
- Visualización de procedimientos extraídos
- Descarga de receta de procedimientos
- Manejo de errores robusto

## Generación de Recetas de Procedimientos

### **Endpoint de Receta (`apps/http-api/src/routes/procedure-recipes.ts`)**

```typescript
POST /api/download-procedures-recipe
```

**Características de la Receta:**
- **Enfoque específico**: Solo procedimientos que el paciente debe realizar
- **Diseño profesional**: HTML con CSS moderno
- **Información estructurada**: Cada procedimiento con todos sus detalles
- **Priorización visual**: Colores según prioridad (Alta: rojo, Media: naranja, Baja: verde)
- **Información del paciente**: Datos completos del paciente
- **Firma médica**: Espacio para firma del médico

### **Estructura de la Receta HTML:**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Receta de Procedimientos Médicos</title>
    <!-- CSS profesional y responsive -->
</head>
<body>
    <div class="container">
        <!-- Header con título -->
        <!-- Información del paciente -->
        <!-- Lista de procedimientos con detalles -->
        <!-- Firma médica -->
        <!-- Footer con información -->
    </div>
</body>
</html>
```

## Casos de Uso

### **Caso 1: Exámenes de Laboratorio**
- **Audio**: "Necesito que te hagas un análisis de sangre completo, en ayunas de 8 horas"
- **Resultado**: Procedimiento extraído con preparación específica

### **Caso 2: Tratamientos Múltiples**
- **Audio**: "También te voy a dar fisioterapia 3 veces por semana y control en 15 días"
- **Resultado**: 2 procedimientos con frecuencia y seguimiento

### **Caso 3: Procedimientos Especializados**
- **Audio**: "Te programo una resonancia magnética para la próxima semana, con contraste"
- **Resultado**: Procedimiento con preparación específica y programación

## Diferencias con Recetas de Medicamentos

### **Receta de Medicamentos:**
- ✅ Enfocada en medicamentos recetados
- ✅ Información de dosis, frecuencia, composición
- ✅ Validación contra Vademecum
- ✅ Instrucciones de administración

### **Receta de Procedimientos:**
- ✅ Enfocada en acciones que el paciente debe realizar
- ✅ Exámenes, tratamientos, terapias, controles
- ✅ Instrucciones de preparación y seguimiento
- ✅ **NO incluye diagnósticos ni resúmenes generales**

## Configuración

### **Variables de Entorno Requeridas**

```bash
OPENAI_API_KEY=tu_api_key_de_openai
```

### **Dependencias**

```json
{
  "axios": "^1.0.0",
  "@repo/business-logic": "workspace:*",
  "handlebars": "^4.7.0"
}
```

## Pruebas

### **Archivo de Prueba**
```javascript
// Probar extracción de procedimientos
const testData = {
  text: 'El paciente necesita análisis de sangre en ayunas, fisioterapia 3 veces por semana y control en 15 días',
  country: 'CHL'
};

const response = await axios.post(`${BASE_URL}/api/audio-procedure-extraction`, testData);
```

### **Pruebas Manuales**

1. **Grabar audio** con procedimientos mencionados
2. **Procesar extracción** usando el componente
3. **Verificar resultados** en la interfaz
4. **Descargar receta** de procedimientos
5. **Verificar que NO incluya** diagnósticos ni resúmenes

## Beneficios

### **Para Médicos**
- ⚡ **Ahorro de tiempo**: No necesita escribir manualmente los procedimientos
- 📝 **Precisión**: Extracción automática con validación
- 🔄 **Consistencia**: Formato estandarizado para todas las recetas
- 📱 **Facilidad**: Solo grabar la consulta

### **Para Pacientes**
- 📋 **Claridad**: Instrucciones específicas y claras
- ✅ **Enfoque**: Solo información relevante para el paciente
- 📄 **Documentación**: Receta profesional y estructurada
- 🎯 **Acción**: Enfoque en lo que debe hacer, no en diagnósticos

### **Para el Sistema**
- 🤖 **Automatización**: Proceso completamente automatizado
- 📊 **Trazabilidad**: Registro completo de procedimientos
- 🔍 **Auditoría**: Información estructurada para auditorías
- 🎯 **Especialización**: Recetas específicas para diferentes tipos de información

## Limitaciones y Consideraciones

### **Limitaciones Técnicas**
- **Calidad del audio**: Requiere audio claro para transcripción precisa
- **Dependencia de IA**: Requiere conexión a OpenAI
- **Idioma**: Optimizado para español chileno

### **Consideraciones Médicas**
- **Validación humana**: Los resultados deben ser revisados por el médico
- **Contexto clínico**: La IA puede no capturar todo el contexto médico
- **Especificidad**: Enfocado solo en procedimientos, no en diagnósticos

## Futuras Mejoras

### **Funcionalidades Planificadas**
1. **Soporte multiidioma**: Inglés, portugués, etc.
2. **Validación en tiempo real**: Feedback inmediato durante la grabación
3. **Integración con sistemas hospitalarios**: Conectividad con HIS
4. **Análisis de complejidad**: Evaluación de la complejidad de procedimientos
5. **Personalización**: Adaptación a especialidades médicas específicas

### **Optimizaciones Técnicas**
1. **Caché de transcripciones**: Evitar reprocesamiento
2. **Procesamiento offline**: Funcionalidad sin conexión
3. **Compresión de audio**: Optimización de transferencia
4. **Validación local**: Validación sin dependencia externa

## Archivos Creados/Modificados

### **Nuevos Archivos:**
- ✅ `packages/business-logic/src/procedures/extract-from-audio.ts`
- ✅ `apps/http-api/src/routes/audio-procedure-extraction.ts`
- ✅ `apps/http-api/src/routes/procedure-recipes.ts`
- ✅ `apps/portal/src/components/AudioProcedureExtraction.tsx`
- ✅ `EXTRACCION_PROCEDIMIENTOS_AUDIO.md`

### **Archivos Modificados:**
- ✅ `packages/business-logic/src/index.ts`
- ✅ `apps/http-api/src/routes/index.ts`
- ✅ `apps/portal/src/api/index.ts`

## Conclusión

Esta nueva funcionalidad representa un avance significativo en la automatización de procesos médicos, permitiendo extraer procedimientos específicos directamente del audio de consultas médicas con alta precisión. La generación de recetas enfocadas únicamente en las acciones que el paciente debe realizar proporciona claridad y enfoque, diferenciándose de las recetas de medicamentos tradicionales.

La implementación asegura que los pacientes reciban información clara y específica sobre lo que deben hacer, sin confusión con diagnósticos o resúmenes médicos generales.
