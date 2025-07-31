import { apiInstance } from '@/api';
import React, { useState } from 'react';

const countries = [
  { code: 'ARG', name: 'Argentina' },
  // { code: 'MEX', name: 'México' },
  { code: 'CHL', name: 'Chile' },
  { code: 'COL', name: 'Colombia' },
];

const Vademecum: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [meds, setMeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeds = async (code: string) => {
    setLoading(true);
    setError(null);
    setMeds([]);
    try {
      const { data } = await apiInstance.get(`/api/vademecum?pais=${code}`);
      if (!data) throw new Error('Error al obtener medicamentos');
      setMeds(data.medicamentos || []);
    } catch (e) {
      setError('No se pudo obtener el vademécum');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' }}>
      <h2>Vademécum por país</h2>
      <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); fetchMeds(e.target.value); }} style={{ padding: 8, borderRadius: 6, marginBottom: 16, width: '100%' }}>
        <option value="">Selecciona un país</option>
        {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>
      {loading && <div>Cargando...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {meds.length > 0 && (
        <ul style={{ marginTop: 16 }}>
          {meds.map(med => <li key={med}>{med}</li>)}
        </ul>
      )}
    </div>
  );
};

export default Vademecum; 