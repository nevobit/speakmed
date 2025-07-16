import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReports, getReportDetail } from '../../api';
import styles from './Reports.module.css';
import { Eye } from 'lucide-react';

interface Report {
  id: string;
  date: string;
  duration?: string;
  summary?: string;
  content?: string;
}

const Reports: React.FC = () => {
    const { data: reports, isLoading } = useQuery<Report[]>({ queryKey: ['reports'], queryFn: getReports });
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const paginatedReports = reports ? reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];
    const totalPages = reports ? Math.ceil(reports.length / itemsPerPage) : 1;
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);

    // Helper para formatear duración en min y sec
    const formatDuration = (duration?: string | number) => {
        if (!duration) return '-';
        const totalSeconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
        if (isNaN(totalSeconds) || totalSeconds < 0) return '-';
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        if (min > 0) {
            return `${min} min${min > 1 ? 's' : ''} ${sec} sec`;
        }
        return `${sec} sec`;
    };

    const handleViewReport = async (reportId: string) => {
        setIsLoadingDetail(true);
        try {
            const reportDetail = await getReportDetail(reportId);
            setSelectedReport(reportDetail);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching report detail:', error);
            alert('Error al cargar el detalle del informe');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleSendEmail = async () => {
        setIsSending(true);
        setSendSuccess(null);
        setSendError(null);
        // Simulación de envío
        setTimeout(() => {
            if (email && email.includes('@')) {
                setSendSuccess('¡Informe enviado exitosamente!');
                setEmail('');
            } else {
                setSendError('Por favor ingresa un correo válido.');
            }
            setIsSending(false);
        }, 1200);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
    };

    console.log(reports);

    return (
        <div className={styles.container}>
            <div className={styles.header} >
            <h2>Historial de informes</h2>
                 
            </div>
            {isLoading ? (
                <div className={styles.empty}>Cargando...</div>
            ) : !reports || reports.length === 0 ? (
                <div className={styles.empty}>No hay informes médicos registrados.</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Duración de consulta</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedReports.map((r) => {
                            const dateObj = r.date ? new Date(r.date) : null;
                            return (
                                <tr key={r.id}>
                                    <td>{dateObj ? dateObj.toLocaleDateString() : '-'}</td>
                                    <td>{dateObj ? dateObj.toLocaleTimeString() : '-'}</td>
                                    <td>{formatDuration(r.duration)}</td>
                                    <td>
                                        <button 
                                            className={styles.iconBtn}
                                            onClick={() => handleViewReport(r.id)}
                                            disabled={isLoadingDetail}
                                            title="Ver informe"
                                        >
                                            <Eye size={22} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Paginación visual */}
            {reports && reports.length > itemsPerPage && (
                <div className={styles.paginationWrapper}>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        &#x25C0;
                    </button>
                    <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
                    <button
                        className={styles.pageBtn}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        &#x25B6;
                    </button>
                </div>
            )}

            {/* Modal para mostrar el detalle del reporte */}
            {isModalOpen && selectedReport && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Informe Médico</h3>
                            <button className={styles.closeBtn} onClick={closeModal}>×</button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.reportInfo}>
                                <p><strong>Fecha:</strong> {selectedReport.date ? new Date(selectedReport.date).toLocaleDateString() : '-'}</p>
                                <p><strong>Duración:</strong> {selectedReport.duration || '-'}</p>
                            </div>
                            <div className={styles.reportContent}>
                                {selectedReport.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedReport.content }} />
                                ) : (
                                    <p>No hay contenido disponible para este informe.</p>
                                )}
                            </div>
                            {/* Campo para enviar por correo electrónico */}
                            <div className={styles.emailSendBox}>
                                <h4>Enviar informe por correo electrónico</h4>
                                <div className={styles.emailFormRow}>
                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className={styles.emailInput}
                                        disabled={isSending}
                                    />
                                    <button
                                        className={styles.emailSendBtn}
                                        onClick={handleSendEmail}
                                        disabled={isSending || !email}
                                    >
                                        {isSending ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                                {sendSuccess && <div className={styles.emailSuccess}>{sendSuccess}</div>}
                                {sendError && <div className={styles.emailError}>{sendError}</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports; 