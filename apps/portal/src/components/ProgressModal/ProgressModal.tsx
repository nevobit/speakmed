import React from 'react';
import styles from './ProgressModal.module.css';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  duration?: number;
  error?: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  steps: ProgressStep[];
  currentStep: string;
  totalDuration: number;
  onClose?: () => void;
}

const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  steps,
  currentStep,
  totalDuration,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle size={20} className={styles.completedIcon} />;
      case 'in-progress':
        return <Loader2 size={20} className={styles.spinningIcon} />;
      case 'error':
        return <AlertCircle size={20} className={styles.errorIcon} />;
      default:
        return <Clock size={20} className={styles.pendingIcon} />;
    }
  };

  const getStepStatusText = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return step.duration ? `Completado en ${formatDuration(step.duration)}` : 'Completado';
      case 'in-progress':
        return 'En progreso...';
      case 'error':
        return step.error || 'Error';
      default:
        return 'Pendiente';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Procesando Audio</h3>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>
              ×
            </button>
          )}
        </div>
        
        <div className={styles.modalContent}>
          {/* Barra de progreso general */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>Progreso General</span>
              <span>{completedSteps}/{steps.length} pasos completados</span>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className={styles.totalDuration}>
              Tiempo total: {formatDuration(totalDuration)}
            </div>
          </div>

          {/* Lista de pasos */}
          <div className={styles.stepsSection}>
            <h4>Detalles del Proceso</h4>
            <div className={styles.stepsList}>
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`${styles.stepItem} ${step.status === 'in-progress' ? styles.currentStep : ''}`}
                >
                  <div className={styles.stepIcon}>
                    {getStepIcon(step)}
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <div className={`${styles.stepStatus} ${styles[step.status]}`}>
                      {getStepStatusText(step)}
                    </div>
                    {step.duration && step.status === 'completed' && (
                      <div className={styles.stepDuration}>
                        Duración: {formatDuration(step.duration)}
                      </div>
                    )}
                  </div>
                  {step.status === 'in-progress' && (
                    <div className={styles.stepProgress}>
                      <div className={styles.stepProgressBar}>
                        <div className={styles.stepProgressFill} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Información adicional */}
          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <Clock size={16} />
              <span>Tiempo transcurrido: {formatDuration(totalDuration)}</span>
            </div>
            <div className={styles.infoItem}>
              <CheckCircle size={16} />
              <span>Pasos completados: {completedSteps}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;


