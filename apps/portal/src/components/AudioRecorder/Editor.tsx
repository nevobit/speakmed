import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from './AudioRecorder.module.css';
import { cleanAndProcessHtml } from '../../utils/htmlCleaner';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, placeholder, readOnly = false }) => {
  const modules = {
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  // Función para manejar cambios asegurando espacios correctos
  const handleChange = (content: string) => {
    // Limpiar el contenido para asegurar espacios correctos
    const cleanedContent = cleanAndProcessHtml(content);
    onChange(cleanedContent);
  };

  return (
    <div className={styles.editorContainer}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        className={styles.quillEditor}
      />
    </div>
  );
};

export default Editor; 