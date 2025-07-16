import React, { useState } from 'react';

const DescargarReceta: React.FC = () => {
  const [recetaId, setRecetaId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 0.4rem 2.4rem rgba(30,41,59,0.08)' }}>
      <h2>Descargar receta médica</h2>
      <input value={recetaId} onChange={e => setRecetaId(e.target.value)} placeholder="ID de receta" style={{ padding: 8, borderRadius: 6, width: '100%', marginBottom: 16 }} />
      <button onClick={handleDownload} disabled={downloading || !recetaId} style={{ padding: 10, borderRadius: 6, width: '100%', background: '#1362bc', color: '#fff', fontWeight: 'bold' }}>Descargar PDF</button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </div>
  );
};

export default DescargarReceta; 