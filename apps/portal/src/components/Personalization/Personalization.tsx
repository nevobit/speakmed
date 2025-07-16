import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSettings, updateSettings,
  getTemplates, createTemplate, updateTemplate, deleteTemplate
} from '../../api';
import styles from './Personalization.module.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AudioRecorder from '../AudioRecorder/AudioRecorder';

interface Settings {
  perspective: string;
  detailLevel: string;
  missingInfo: string;
  dictionary: string;
}

interface Template {
  _id: string;
  name: string;
  type: string;
  fields: string[];
  html?: string;
}

const Personalization: React.FC = () => {
  const queryClient = useQueryClient();
  // Settings
  const { data: settings, isLoading: loadingSettings } = useQuery<Settings>({ queryKey: ['settings'], queryFn: getSettings });
  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setTimeout(() => setSaved(false), 2000);
    },
  });
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Settings>({
    perspective: '',
    detailLevel: '',
    missingInfo: '',
    dictionary: '',
  });
  React.useEffect(() => {
    if (settings) {
      setForm({
        perspective: settings.perspective || '',
        detailLevel: settings.detailLevel || '',
        missingInfo: settings.missingInfo || '',
        dictionary: settings.dictionary || '',
      });
    }
  }, [settings]);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    settingsMutation.mutate(form);
  };

  // Templates CRUD
  const { data: templates, isLoading: loadingTemplates } = useQuery<Template[]>({ queryKey: ['templates'], queryFn: getTemplates });
  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Template> }) => updateTemplate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  // UI State for template creation/edit
  const [newTemplate, setNewTemplate] = useState({ name: '', type: '', fields: '', html: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState({ name: '', type: '', fields: '', html: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: newTemplate.name,
      type: newTemplate.type,
      fields: newTemplate.fields.split(',').map(f => f.trim()).filter(Boolean),
      html: newTemplate.html,
    });
    setNewTemplate({ name: '', type: '', fields: '', html: '' });
    setEditingId(null);
  };

  const handleEdit = (tpl: Template) => {
    setEditingId(tpl._id);
    setEditTemplate({ name: tpl.name, type: tpl.type, fields: tpl.fields.join(', '), html: tpl.html || '' });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editTemplate.name,
        type: editTemplate.type,
        fields: editTemplate.fields.split(',').map(f => f.trim()).filter(Boolean),
        html: editTemplate.html,
      },
    });
    setEditingId(null);
    setEditTemplate({ name: '', type: '', fields: '', html: '' });
  };

  const [voiceSample, setVoiceSample] = useState<Blob | null>(null);
  const [voiceUploadStatus, setVoiceUploadStatus] = useState<string | null>(null);

  // Función para subir la muestra de voz
  const uploadVoiceSample = async () => {
    if (!voiceSample) return;
    setVoiceUploadStatus('Cargando...');
    const formData = new FormData();
    formData.append('audio', voiceSample, 'voz-doctor.webm');
    try {
      const res = await fetch('/api/voz-doctor', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al subir la muestra de voz');
      setVoiceUploadStatus('¡Muestra de voz guardada!');
    } catch (e) {
      setVoiceUploadStatus('Error al subir la muestra de voz');
    }
  };

  if (loadingSettings || loadingTemplates) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <h2>Mi personalización</h2>
      {/* Plantillas CRUD */}
      <section className={styles.section}>
        <h3>Listado de plantillas</h3>
        <div className={styles.templatesHeader}>
          <span>Nombre de plantilla</span>
          <span>Tipo de informe</span>
          <span>Campos</span>
          <button className={styles.addBtn} onClick={() => setEditingId('new')}>Añadir plantilla +</button>
        </div>
        <div className={styles.templateList}>
          {templates && templates.length === 0 && <div>No hay plantillas registradas.</div>}
          {templates && templates.map((tpl) => (
            <div className={styles.templateRow} key={tpl._id}>
              {editingId === tpl._id ? (
                <form onSubmit={handleUpdate} style={{ display: 'flex', gap: '1rem', flex: 1, flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                      value={editTemplate.name}
                      onChange={e => setEditTemplate({ ...editTemplate, name: e.target.value })}
                      placeholder="Nombre"
                      style={{ flex: 1 }}
                    />
                    <input
                      value={editTemplate.type}
                      onChange={e => setEditTemplate({ ...editTemplate, type: e.target.value })}
                      placeholder="Tipo"
                      style={{ flex: 1 }}
                    />
                    <input
                      value={editTemplate.fields}
                      onChange={e => setEditTemplate({ ...editTemplate, fields: e.target.value })}
                      placeholder="Campos (separados por coma)"
                      style={{ flex: 2 }}
                    />
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    <label>HTML de la plantilla</label>
                    <ReactQuill value={editTemplate.html} onChange={html => setEditTemplate({ ...editTemplate, html })} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className={styles.saveBtn}>Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)} className={styles.saveBtn} style={{ background: '#64748b' }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <span>{tpl.name}</span>
                  <span>{tpl.type}</span>
                  <span>{tpl.fields.join(', ')}</span>
                  <button className={styles.viewBtn} onClick={() => handleEdit(tpl)}>✏️</button>
                  <button className={styles.viewBtn} onClick={() => deleteMutation.mutate(tpl._id)}>🗑️</button>
                </>
              )}
            </div>
          ))}
          {editingId === 'new' && (
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  value={newTemplate.name}
                  onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Nombre"
                  style={{ flex: 1 }}
                  required
                />
                <input
                  value={newTemplate.type}
                  onChange={e => setNewTemplate({ ...newTemplate, type: e.target.value })}
                  placeholder="Tipo"
                  style={{ flex: 1 }}
                  required
                />
                <input
                  value={newTemplate.fields}
                  onChange={e => setNewTemplate({ ...newTemplate, fields: e.target.value })}
                  placeholder="Campos (separados por coma)"
                  style={{ flex: 2 }}
                />
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label>HTML de la plantilla</label>
                <ReactQuill value={newTemplate.html} onChange={html => setNewTemplate({ ...newTemplate, html })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className={styles.saveBtn}>Crear</button>
                <button type="button" onClick={() => setEditingId(null)} className={styles.saveBtn} style={{ background: '#64748b' }}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      </section>
      {/* Configuración IA */}
      <form onSubmit={handleSave}>
        <section className={styles.section}>
          <h3>Configuraciones de IA</h3>
          <div className={styles.iaConfigRow}>
            <label>Perspectiva</label>
            <select name="perspective" value={form.perspective} onChange={handleChange}>
              <option value="">Selecciona</option>
              <option value="tercera">Tercera persona</option>
              <option value="primera">Primera persona</option>
            </select>
          </div>
          <div className={styles.iaConfigRow}>
            <label>Nivel de detalle</label>
            <select name="detailLevel" value={form.detailLevel} onChange={handleChange}>
              <option value="">Selecciona</option>
              <option value="detallado">Detallado</option>
              <option value="conciso">Conciso</option>
            </select>
          </div>
          <div className={styles.iaConfigRow}>
            <label>Manejo de información faltante</label>
            <select name="missingInfo" value={form.missingInfo} onChange={handleChange}>
              <option value="">Selecciona</option>
              <option value="breve">Respuesta breve</option>
              <option value="explicacion">Explicación detallada</option>
            </select>
          </div>
          <button className={styles.saveBtn} type="submit">Guardar</button>
          {saved && <div className={styles.charCount} style={{ color: '#22c55e' }}>¡Configuración guardada!</div>}
        </section>
        {/* Diccionario */}
        <section className={styles.section}>
          <h3>Diccionario personalizado</h3>
          <textarea
            className={styles.textarea}
            name="dictionary"
            value={form.dictionary}
            onChange={handleChange}
            placeholder="Ejemplo: ACV = Accidente Cerebrovascular, Paracetamol, Lóbulo Frontal, etc..."
            maxLength={600}
          />
          <div className={styles.charCount}>
            Caracteres utilizados: {form.dictionary.length} de 600.
          </div>
          <button className={styles.saveBtn} type="submit">Guardar</button>
          {saved && <div className={styles.charCount} style={{ color: '#22c55e' }}>¡Diccionario guardado!</div>}
        </section>
      </form>
      {/* Sección de muestra de voz del doctor */}
      <section className={styles.section}>
        <h3>Muestra de voz del doctor</h3>
        <p>Graba una muestra de tu voz para que el sistema pueda reconocerte en las consultas.</p>
        <AudioRecorder
          onRecordingComplete={(blob: Blob) => setVoiceSample(blob)}
          hideTemplateSelector
          hideReport
        />
        {voiceSample && (
          <button className={styles.saveBtn} type="button" onClick={uploadVoiceSample}>
            Guardar muestra de voz
          </button>
        )}
        {voiceUploadStatus && <div className={styles.charCount}>{voiceUploadStatus}</div>}
      </section>
    </div>
  );
};

export default Personalization; 