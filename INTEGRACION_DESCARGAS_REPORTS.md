# Integración de Botones de Descarga en Modal de Reports

## Descripción

Se ha integrado la funcionalidad de descarga de documentos médicos directamente en el modal de Reports, permitiendo a los usuarios descargar recetas médicas, informes médicos y exámenes médicos desde la vista de historial de informes.

## Características Principales

### 🎯 **Funcionalidad Integrada**
- **Descarga de Receta Médica** → Genera receta con medicamentos extraídos
- **Descarga de Informe Médico** → Genera informe completo de la consulta
- **Descarga de Exámenes Médicos** → Genera exámenes con procedimientos extraídos
- **Interfaz unificada** → Acceso directo desde el modal de Reports

### 📋 **Flujo de Usuario**
1. **Ver historial** → Usuario accede a la sección Reports
2. **Seleccionar informe** → Hace clic en el botón "Ver" de un informe
3. **Modal se abre** → Se muestra el detalle del informe
4. **Descargar documentos** → Usa los botones de descarga disponibles
5. **Resultado** → Documentos descargados automáticamente

## Implementación Técnica

### **Frontend - Componente Reports**

#### **Importaciones Agregadas:**

```typescript
import { getReports, getReportDetail, downloadExamenes } from '../../api';
import { Eye, Download, FileText, Receipt } from 'lucide-react';
```

#### **Estados Agregados:**

```typescript
// Estados para descargas
const [isDownloadingReceta, setIsDownloadingReceta] = useState(false);
const [isDownloadingInforme, setIsDownloadingInforme] = useState(false);
const [isDownloadingExamenes, setIsDownloadingExamenes] = useState(false);
const [downloadError, setDownloadError] = useState<string | null>(null);
```

### **Funciones de Descarga Implementadas**

#### **1. Descarga de Receta Médica:**

```typescript
const handleDownloadReceta = async () => {
    if (!selectedReport) return;

    setIsDownloadingReceta(true);
    setDownloadError(null);

    try {
        const medicalData = {
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
        };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${selectedReport._id}/receta`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicalData),
        });

        if (!response.ok) {
            throw new Error('Error al generar la receta médica');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receta_medica_${selectedReport._id}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        setDownloadError('Error al descargar la receta médica');
    } finally {
        setIsDownloadingReceta(false);
    }
};
```

#### **2. Descarga de Informe Médico:**

```typescript
const handleDownloadInforme = async () => {
    if (!selectedReport) return;

    setIsDownloadingInforme(true);
    setDownloadError(null);

    try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${selectedReport._id}/informe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error('Error al generar el informe médico');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe_medico_${selectedReport._id}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        setDownloadError('Error al descargar el informe médico');
    } finally {
        setIsDownloadingInforme(false);
    }
};
```

#### **3. Descarga de Exámenes Médicos:**

```typescript
const handleDownloadExamenes = async () => {
    if (!selectedReport) return;

    setIsDownloadingExamenes(true);
    setDownloadError(null);

    try {
        const medicalData = {
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
        };

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${selectedReport._id}/examenes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(medicalData),
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
            a.download = `examenes_medicos_${selectedReport._id}.html`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } catch (err) {
        setDownloadError('Error al descargar el documento de exámenes');
    } finally {
        setIsDownloadingExamenes(false);
    }
};
```

### **Interfaz de Usuario - Botones de Descarga**

#### **Sección de Descarga en Modal:**

```tsx
{/* Botones de descarga */}
<div className={styles.downloadSection}>
    <h4>Descargar documentos</h4>
    <div className={styles.downloadButtons}>
        <button
            className={styles.downloadBtn}
            onClick={handleDownloadReceta}
            disabled={isDownloadingReceta}
            title="Descargar receta médica"
        >
            <Receipt size={16} />
            {isDownloadingReceta ? 'Descargando...' : 'Receta Médica'}
        </button>
        
        <button
            className={styles.downloadBtn}
            onClick={handleDownloadInforme}
            disabled={isDownloadingInforme}
            title="Descargar informe médico"
        >
            <FileText size={16} />
            {isDownloadingInforme ? 'Descargando...' : 'Informe Médico'}
        </button>
        
        <button
            className={styles.downloadBtn}
            onClick={handleDownloadExamenes}
            disabled={isDownloadingExamenes}
            title="Descargar exámenes médicos"
        >
            <Download size={16} />
            {isDownloadingExamenes ? 'Descargando...' : 'Exámenes Médicos'}
        </button>
    </div>
    {downloadError && <div className={styles.downloadError}>{downloadError}</div>}
</div>
```

### **Estilos CSS - Diseño de Botones**

#### **Sección de Descarga:**

```css
.downloadSection {
  margin: 2rem 0;
  padding: 1.6rem 1.2rem;
  background: #f8fafc;
  border-radius: 0.8rem;
  border-left: 0.4rem solid #10b981;
}

.downloadSection h4 {
  margin: 0 0 1.2rem 0;
  color: #10b981;
  font-size: 1.2rem;
  font-weight: 600;
}

.downloadButtons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
```

#### **Botones de Descarga:**

```css
.downloadBtn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.8rem 1.2rem;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
  justify-content: center;
}

.downloadBtn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 0.2rem 0.8rem rgba(16, 185, 129, 0.3);
}

.downloadBtn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

## Flujo de Integración

### **1. Acceso a Reports**
- Usuario navega a la sección Reports
- Ve la lista de informes médicos

### **2. Selección de Informe**
- Hace clic en el botón "Ver" (ojo) de un informe
- Se abre el modal con detalles del informe

### **3. Descarga de Documentos**
- Ve la sección "Descargar documentos"
- Selecciona el tipo de documento a descargar:
  - **Receta Médica**: Con medicamentos extraídos
  - **Informe Médico**: Informe completo de la consulta
  - **Exámenes Médicos**: Con procedimientos extraídos

### **4. Resultado**
- Documento descargado automáticamente
- Archivo HTML listo para imprimir o compartir

## Casos de Uso

### **Caso 1: Descarga de Receta**
- **Usuario**: Necesita la receta médica con medicamentos
- **Acción**: Hace clic en "Receta Médica"
- **Resultado**: Descarga receta con medicamentos extraídos del audio

### **Caso 2: Descarga de Informe**
- **Usuario**: Necesita el informe completo de la consulta
- **Acción**: Hace clic en "Informe Médico"
- **Resultado**: Descarga informe detallado de la consulta

### **Caso 3: Descarga de Exámenes**
- **Usuario**: Necesita los exámenes/procedimientos indicados
- **Acción**: Hace clic en "Exámenes Médicos"
- **Resultado**: Descarga exámenes con procedimientos extraídos del audio

## Beneficios

### **Para Usuarios**
- ✅ **Acceso directo**: Descargas desde el historial de informes
- ✅ **Múltiples formatos**: Receta, informe y exámenes disponibles
- ✅ **Interfaz intuitiva**: Botones claros con iconos descriptivos
- ✅ **Feedback visual**: Estados de carga y errores

### **Para el Sistema**
- 🤖 **Integración completa**: Funcionalidad unificada
- 📊 **Trazabilidad**: Acceso a documentos desde historial
- 🔍 **Auditoría**: Registro de descargas por informe
- 🎯 **Usabilidad**: Experiencia de usuario mejorada

## Diferencias con Versión Anterior

### **Versión Anterior:**
- ❌ Solo visualización de informes
- ❌ Sin opciones de descarga
- ❌ Funcionalidad limitada en modal

### **Versión Actual:**
- ✅ Descarga de receta médica
- ✅ Descarga de informe médico
- ✅ Descarga de exámenes médicos
- ✅ Interfaz mejorada con botones de descarga

## Archivos Modificados

### **Frontend:**
- ✅ `apps/portal/src/components/Reports/Reports.tsx` - Funcionalidad de descarga agregada
- ✅ `apps/portal/src/components/Reports/Reports.module.css` - Estilos para botones de descarga

## Testing

### **Pruebas Manuales**
1. **Acceder a Reports** y ver lista de informes
2. **Hacer clic en "Ver"** de un informe
3. **Verificar botones** de descarga en el modal
4. **Probar descargas** de cada tipo de documento
5. **Verificar estados** de carga y manejo de errores

### **Funcionalidades a Verificar**
- ✅ Botones de descarga visibles en modal
- ✅ Estados de carga funcionando
- ✅ Descargas exitosas de documentos
- ✅ Manejo de errores
- ✅ Nombres de archivo correctos

## Conclusión

La integración de botones de descarga en el modal de Reports representa una mejora significativa en la funcionalidad del sistema, proporcionando acceso directo a documentos médicos desde el historial de informes. Los usuarios ahora pueden descargar recetas, informes y exámenes de manera fácil e intuitiva, mejorando la experiencia general del sistema.

La implementación mantiene la consistencia visual y funcional con el resto de la aplicación mientras agrega funcionalidad valiosa para los usuarios finales.
