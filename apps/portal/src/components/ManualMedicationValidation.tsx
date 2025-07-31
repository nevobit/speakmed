import React, { useState } from 'react';
import { apiInstance } from '@/api';
import MedicationValidation from './MedicationValidation';

const ManualMedicationValidation: React.FC = () => {
  const [text, setText] = useState('');
  const [country, setCountry] = useState('ARG');
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countries = [
    { code: 'ARG', name: 'Argentina' },
    { code: 'CHL', name: 'Chile' },
    { code: 'COL', name: 'Colombia' },
  ];

  const handleValidation = async () => {
    if (!text.trim()) {
      setError('Por favor ingresa algún texto para validar');
      return;
    }

    setLoading(true);
    setError(null);
    setValidation(null);

    try {
      const response = await apiInstance.post('/api/medication-validation', {
        text: text.trim(),
        country
      });

      setValidation(response.data);
    } catch (err) {
      setError('Error al validar los medicamentos. Intenta de nuevo.');
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
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
      <h2 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>
        Validación Manual de Medicamentos
      </h2>
      
      <p style={{ 
        marginBottom: '1.5rem', 
        color: '#64748b',
        lineHeight: '1.6'
      }}>
        Ingresa el texto de la consulta médica para validar los medicamentos mencionados 
        contra la base de datos del Vademecum.
      </p>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          País:
        </label>
        <select 
          value={country} 
          onChange={(e) => setCountry(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            border: '1px solid #d1d5db',
            fontSize: '1rem'
          }}
        >
          {countries.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          Texto de la consulta:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ejemplo: El paciente presenta dolor de cabeza y le receté paracetamol 500mg cada 8 horas, también ibuprofeno para la inflamación..."
          style={{ 
            width: '100%', 
            minHeight: '150px', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>

      <button 
        onClick={handleValidation} 
        disabled={loading || !text.trim()}
        style={{ 
          width: '100%',
          padding: '0.75rem', 
          borderRadius: '8px', 
          background: loading ? '#9ca3af' : '#1362bc', 
          color: '#fff', 
          fontWeight: 'bold',
          fontSize: '1rem',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? 'Validando...' : 'Validar Medicamentos'}
      </button>

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

      {validation && (
        <MedicationValidation validation={validation} />
      )}
    </div>
  );
};

export default ManualMedicationValidation; 