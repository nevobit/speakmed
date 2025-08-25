import React, { useState } from 'react';
import { Download, FileText, User} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: string;
  manufacturer?: string;
  type?: string;
  composition?: string;
  instructions: string;
  startDate: string;
  additionalNotes?: string;
}

const DescargarReceta: React.FC = () => {
  const [recetaId, setRecetaId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Datos de ejemplo basados en la imagen
  const sampleMedications: Medication[] = [
    {
      id: '1',
      name: 'colmibe',
      dosage: '40 / 10',
      form: 'comprimido',
      manufacturer: 'Tecnofarma',
      type: 'Permanente',
      composition: 'atorvastatina 40 mg + ezetimiba 10 mg comprimido',
      instructions: '1 comprimido CADA 24 HORAS, PERMANENTE, ORAL',
      startDate: '20/11/2023',
      additionalNotes: 'noche +56998840888'
    },
    {
      id: '2',
      name: 'carvedilol',
      dosage: '12,5 mg',
      form: 'comprimido',
      type: 'Permanente',
      composition: '12,5 miligramo',
      instructions: 'CADA 12 HORAS, PERMANENTE, ORAL',
      startDate: '29/04/2024'
    }
  ];

  const handleDownload = async () => {
    if (!recetaId) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recetas/${recetaId}/descargar`);
      if (!res.ok) throw new Error('No se pudo descargar la receta');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receta_${recetaId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Error al descargar la receta');
    } finally {
      setDownloading(false);
    }
  };

  const renderMedication = (medication: Medication) => (
    <div key={medication.id} style={{ marginBottom: '1.5rem' }}>
      {/* Primera línea: Nombre, dosis, forma */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ 
          fontSize: '1.2rem', 
          marginRight: '0.5rem', 
          marginTop: '0.2rem',
          color: '#000'
        }}>•</span>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: '500',
            color: '#000',
            lineHeight: '1.4'
          }}>
            {medication.name} {medication.dosage} {medication.form}
            {medication.manufacturer && ` (${medication.manufacturer})`}
            {medication.type && ` (${medication.type})`}
          </div>
          
          {/* Segunda línea: Composición */}
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#374151',
            marginTop: '0.25rem',
            marginLeft: '1.5rem',
            lineHeight: '1.4'
          }}>
            {medication.composition}
          </div>
          
          {/* Tercera línea: Instrucciones */}
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#374151',
            marginTop: '0.25rem',
            marginLeft: '1.5rem',
            lineHeight: '1.4'
          }}>
            {medication.instructions}
          </div>
          
          {/* Cuarta línea: Fecha de inicio */}
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#374151',
            marginTop: '0.25rem',
            marginLeft: '1.5rem',
            lineHeight: '1.4'
          }}>
            A partir de: {medication.startDate}
          </div>
          
          {/* Quinta línea: Notas adicionales (si existen) */}
          {medication.additionalNotes && (
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#374151',
              marginTop: '0.25rem',
              marginLeft: '1.5rem',
              lineHeight: '1.4'
            }}>
              {medication.additionalNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '2rem auto', 
      background: '#fff', 
      borderRadius: 12, 
      padding: 32, 
      boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' 
    }}>
      {/* Header de la receta */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '1rem'
      }}>
        <h1 style={{ 
          fontSize: '1.8rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: '0 0 0.5rem 0'
        }}>
          Clínica Alemana
        </h1>
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontWeight: '600', 
          color: '#374151',
          margin: '0 0 1rem 0'
        }}>
          Receta Médica
        </h2>
      </div>

      {/* Información del profesional y paciente */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        marginBottom: '2rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <User size={16} style={{ marginRight: '0.5rem', color: '#6b7280' }} />
            <span style={{ fontWeight: '600', color: '#374151' }}>Profesional:</span>
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Dr. Juan Pérez<br />
            Médico General<br />
            RUT: 12.345.678-9
          </div>
        </div>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <User size={16} style={{ marginRight: '0.5rem', color: '#6b7280' }} />
            <span style={{ fontWeight: '600', color: '#374151' }}>Paciente:</span>
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            María González<br />
            RUT: 98.765.432-1<br />
            Fecha: {new Date().toLocaleDateString('es-CL')}
          </div>
        </div>
      </div>

      {/* Sección de medicamentos */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          color: '#1f2937',
          margin: '0 0 1rem 0',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '0.5rem'
        }}>
          Receta médica
        </h3>
        
        <div style={{ padding: '1rem', background: '#fff', borderRadius: '8px' }}>
          {sampleMedications.map(renderMedication)}
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        marginTop: '2rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button 
          onClick={() => setShowPreview(!showPreview)}
          style={{ 
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            background: '#f3f4f6',
            color: '#374151',
            fontWeight: '600',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={16} />
          {showPreview ? 'Ocultar Vista' : 'Vista Previa'}
        </button>
        
        <button 
          onClick={handleDownload} 
          disabled={downloading || !recetaId}
          style={{ 
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            background: downloading ? '#9ca3af' : '#1362bc',
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            cursor: downloading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Download size={16} />
          {downloading ? 'Descargando...' : 'Descargar PDF'}
        </button>
      </div>

      {/* Campo de ID de receta */}
      <div style={{ 
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          ID de receta para descarga:
        </label>
        <input 
          value={recetaId} 
          onChange={e => setRecetaId(e.target.value)} 
          placeholder="Ingrese el ID de la receta" 
          style={{ 
            padding: '0.75rem', 
            borderRadius: '6px', 
            width: '100%', 
            border: '1px solid #d1d5db',
            fontSize: '1rem'
          }} 
        />
      </div>

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#fef2f2', 
          color: '#991b1b', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Vista previa expandida */}
      {showPreview && (
        <div style={{ 
          marginTop: '2rem',
          padding: '2rem',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            color: '#374151',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            Vista Previa de la Receta
          </h4>
          <div style={{ 
            background: '#fff', 
            padding: '2rem', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {sampleMedications.map(renderMedication)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DescargarReceta; 