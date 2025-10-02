import React from 'react';
import { ArrowLeft, Mic } from 'lucide-react';
import styles from './InfoPanel.module.css';

interface InfoPanelProps {
  duration: string;
  size: string;
  aiEngine: string;
  language: string;
  transcriptionTime: number;
  aiGenerationTime: number;
  totalTime: number;
  onBackToRecording: () => void;
  onNewRecording: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  duration,
  size,
  aiEngine,
  language,
  transcriptionTime,
  aiGenerationTime,
  totalTime,
  onBackToRecording,
  onNewRecording
}) => {
  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Información</h3>
        <div className={styles.separator}></div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Duración:</span>
            <span className={styles.value}>{duration}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Tamaño:</span>
            <span className={styles.value}>{size}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Motor IA:</span>
            <span className={styles.value}>{aiEngine}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Idioma:</span>
            <span className={styles.value}>{language}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tiempos de Procesamiento</h3>
        <div className={styles.separator}></div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Transcripción:</span>
            <span className={styles.value}>{transcriptionTime}s</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Generación IA:</span>
            <span className={styles.value}>{aiGenerationTime}s</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Total:</span>
            <span className={styles.value}>{totalTime}s</span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.backButton} onClick={onBackToRecording}>
          <ArrowLeft size={16} />
          Volver a Grabación
        </button>
        <button className={styles.newButton} onClick={onNewRecording}>
          Nueva Grabación
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
