import React from 'react';

interface MedicationValidationProps {
  validation: {
    found: Array<{ name: string; similarity: number; original: string }>;
    notFound: string[];
    suggestions: Array<{ original: string; suggestions: string[] }>;
    summary: {
      totalFound: number;
      totalNotFound: number;
      totalSuggestions: number;
    };
  };
}

const MedicationValidation: React.FC<MedicationValidationProps> = ({ validation }) => {
  const { found, notFound, suggestions, summary } = validation;

  return (
    <div style={{ 
      marginTop: '2rem', 
      padding: '1.5rem', 
      background: '#f8fafc', 
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        color: '#1e293b', 
        fontSize: '1.25rem',
        fontWeight: '600'
      }}>
        Validación de Medicamentos
      </h3>

      {/* Resumen */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          background: '#dcfce7', 
          color: '#166534', 
          padding: '0.5rem 1rem', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          ✅ {summary.totalFound} encontrados
        </div>
        <div style={{ 
          background: '#fef3c7', 
          color: '#92400e', 
          padding: '0.5rem 1rem', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          ❓ {summary.totalSuggestions} sugerencias
        </div>
        <div style={{ 
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: '0.5rem 1rem', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          ❌ {summary.totalNotFound} no encontrados
        </div>
      </div>

      {/* Medicamentos encontrados */}
      {found.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#166534', 
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            ✅ Medicamentos Encontrados en el Vademecum
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {found.map((item, index) => (
              <div key={index} style={{ 
                background: '#f0fdf4', 
                padding: '0.75rem', 
                borderRadius: '8px',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontWeight: '600', color: '#166534' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                  Original: "{item.original}" • Similitud: {(item.similarity * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugerencias */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#92400e', 
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            ❓ Posibles Medicamentos Similares
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestions.map((item, index) => (
              <div key={index} style={{ 
                background: '#fffbeb', 
                padding: '0.75rem', 
                borderRadius: '8px',
                border: '1px solid #fde68a'
              }}>
                <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                  "{item.original}" - Posibles alternativas:
                </div>
                <ul style={{ 
                  margin: '0', 
                  paddingLeft: '1.5rem',
                  fontSize: '0.875rem',
                  color: '#a16207'
                }}>
                  {item.suggestions.map((suggestion, sIndex) => (
                    <li key={sIndex}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No encontrados */}
      {notFound.length > 0 && (
        <div>
          <h4 style={{ 
            margin: '0 0 0.75rem 0', 
            color: '#991b1b', 
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            ❌ No Encontrados en el Vademecum
          </h4>
          <div style={{ 
            background: '#fef2f2', 
            padding: '0.75rem', 
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
              {notFound.map((item, index) => (
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
              marginTop: '0.5rem', 
              fontSize: '0.75rem', 
              color: '#dc2626',
              fontStyle: 'italic'
            }}>
              Estos términos no fueron encontrados en la base de datos del Vademecum. 
              Verifica la ortografía o consulta con un farmacéutico.
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay medicamentos */}
      {summary.totalFound === 0 && summary.totalNotFound === 0 && summary.totalSuggestions === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#64748b',
          fontStyle: 'italic'
        }}>
          No se detectaron medicamentos en la transcripción.
        </div>
      )}
    </div>
  );
};

export default MedicationValidation; 