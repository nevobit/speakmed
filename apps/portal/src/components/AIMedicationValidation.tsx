import React, { useState } from 'react';
import { validateMedications } from '@/api';
import { Brain, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AIMedicationValidationProps {
  validation?: any;
  extractedMedications?: string[];
  summary?: any;
}

const AIMedicationValidation: React.FC<AIMedicationValidationProps> = ({ 
  validation, 
  extractedMedications, 
  summary, 
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleValidation = async () => {
    if (!text.trim()) {
      setError('Por favor ingresa algún texto para validar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Enviando validación de medicamentos:', { text: text.trim(), country: 'CHL' });
      
      const response = await validateMedications({
        text: text.trim(),
        country: 'CHL'
      });

      console.log('Respuesta de validación:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Error completo:', err);
      
      let errorMessage = 'Error al validar los medicamentos. Intenta de nuevo.';
      
      if (err.response) {
        // Error de respuesta del servidor
        console.error('Error de respuesta:', err.response.status, err.response.data);
        errorMessage = err.response.data?.error || errorMessage;
      } else if (err.request) {
        // Error de red
        console.error('Error de red:', err.request);
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else {
        // Otro tipo de error
        console.error('Error:', err.message);
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderValidationResult = (data: any) => {
    const { found, suggestions, summary } = data;

    return (
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Brain size={24} style={{ marginRight: '0.5rem' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
              Validación Automática de Medicamentos
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              🔍 {summary.totalFound + summary.totalNotFound} medicamentos extraídos
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              ✅ {summary.totalFound} encontrados
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              ❓ {summary.totalSuggestions} sugerencias
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}>
              ❌ {summary.totalNotFound} no encontrados
            </div>
          </div>
          
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            <strong>Método:</strong> Validación Manual Mejorada (máxima precisión)
          </div>
        </div>

        {found && found.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: '#166534', 
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
              Medicamentos Encontrados en el Vademecum de Chile
            </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {found.map((item: any, index: number) => (
                <div key={index} style={{ 
                  background: '#f0fdf4', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontWeight: '600', color: '#166534', marginBottom: '0.25rem' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                    Original: "{item.original}" • Similitud: {(item.similarity * 100).toFixed(1)}% • 
                    Confianza: <span style={{ 
                      fontWeight: '600',
                      color: item.confidence === 'ALTA' ? '#166534' : '#ca8a04'
                    }}>
                      {item.confidence}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sugerencias */}
        {suggestions && suggestions.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: '#92400e', 
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
              Sugerencias de IA
            </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {suggestions.map((item: any, index: number) => (
                <div key={index} style={{ 
                  background: '#fffbeb', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #fde68a'
                }}>
                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                    "{item.original}" - Posibles alternativas:
                  </div>
                  <ul style={{ 
                    margin: '0 0 0.5rem 0', 
                    paddingLeft: '1.5rem',
                    fontSize: '0.875rem',
                    color: '#a16207'
                  }}>
                    {item.suggestions.map((suggestion: string, sIndex: number) => (
                      <li key={sIndex}>{suggestion}</li>
                    ))}
                  </ul>
                  {item.reasoning && (
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#92400e',
                      fontStyle: 'italic',
                      background: 'rgba(251, 191, 36, 0.1)',
                      padding: '0.5rem',
                      borderRadius: '4px'
                    }}>
                      <strong>Razón:</strong> {item.reasoning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No encontrados */}
        {/* {notFound && notFound.length > 0 && (
          <div>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              color: '#991b1b', 
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center'
            }}>
              <AlertTriangle size={16} style={{ marginRight: '0.5rem' }} />
              No Encontrados en el Vademecum de Chile
            </h4>
            <div style={{ 
              background: '#fef2f2', 
              padding: '1rem', 
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                {notFound.map((item: string, index: number) => (
                  <span key={index} style={{ 
                    display: 'inline-block',
                    background: '#fee2e2',
                    padding: '0.25rem 0.5rem',
                    margin: '0.125rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {item}
                  </span>
                ))}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#dc2626',
                fontStyle: 'italic'
              }}>
                Estos términos no fueron encontrados en el Vademecum de Chile. 
                Verifica la ortografía o consulta con un farmacéutico.
              </div>
            </div>
          </div>
        )} */}
      </div>
    );
  };

  // Si se pasan props, mostrar solo el resultado
  if (validation && extractedMedications) {
    return renderValidationResult({ 
      found: validation.found || [], 
      notFound: validation.notFound || [], 
      suggestions: validation.suggestions || [], 
      summary 
    });
  }
  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '2rem auto', 
      background: '#fff', 
      borderRadius: 12, 
      padding: 32, 
      boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' 
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <Brain size={24} style={{ marginRight: '0.5rem' }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            Validación Automática de Medicamentos
          </h2>
        </div>
        <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.6' }}>
          Sistema inteligente que utiliza algoritmos avanzados para validar medicamentos 
          contra el Vademecum de Chile. Máxima precisión con detección de errores tipográficos.
        </p>
      </div>
      
      <div style={{ 
        background: '#f0f9ff', 
        padding: '1rem', 
        borderRadius: '8px',
        border: '1px solid #bae6fd',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <Brain size={16} style={{ marginRight: '0.5rem', color: '#0ea5e9' }} />
          <span style={{ fontWeight: '600', color: '#0c4a6e' }}>
            Validación Automática con IA
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.5' }}>
          El sistema utiliza algoritmos avanzados de similitud para extraer y validar medicamentos 
          contra el Vademecum de Chile con máxima precisión y detección de errores tipográficos.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          Texto de la consulta médica:
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
          background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: '#fff', 
          fontWeight: 'bold',
          fontSize: '1rem',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {loading ? (
          <>
            <Clock size={16} />
            Procesando automáticamente...
          </>
        ) : (
          <>
            <Brain size={16} />
            Validar Medicamentos
          </>
        )}
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

      {result && renderValidationResult(result)}
    </div>
  );
};

export default AIMedicationValidation; 