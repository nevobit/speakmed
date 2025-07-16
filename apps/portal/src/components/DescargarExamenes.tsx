import React, { useState } from 'react';

const DescargarExamenes: React.FC = () => {
  const [examenId, setExamenId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!examenId) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/examenes/${examenId}/descargar`);
      if (!res.ok) throw new Error('No se pudo descargar el archivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `examenes_${examenId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Error al descargar el archivo');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' }}>
      <h2>Descargar exámenes médicos</h2>
      <input value={examenId} onChange={e => setExamenId(e.target.value)} placeholder="ID de exámenes" style={{ padding: 8, borderRadius: 6, width: '100%', marginBottom: 16 }} />
      <button onClick={handleDownload} disabled={downloading || !examenId} style={{ padding: 10, borderRadius: 6, width: '100%', background: '#1362bc', color: '#fff', fontWeight: 'bold' }}>Descargar PDF</button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </div>
  );
};

export default DescargarExamenes; 