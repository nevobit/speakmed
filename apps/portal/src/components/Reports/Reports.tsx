import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReports, getReportDetail } from '../../api';
import styles from './Reports.module.css';
import { Eye, Download, FileText, Receipt } from 'lucide-react';

interface Report {
  _id: string;
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
    
    // Estados para descargas
    const [isDownloadingReceta, setIsDownloadingReceta] = useState(false);
    const [isDownloadingInforme, setIsDownloadingInforme] = useState(false);
    const [isDownloadingExamenes, setIsDownloadingExamenes] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

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

    // Función para descargar receta médica
    const handleDownloadReceta = async () => {
        if (!selectedReport) return;

        setIsDownloadingReceta(true);
        setDownloadError(null);

        try {
            const medicalData = {
                clinicName: 'Clínica Alemana',
                doctorName: 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: '12345678-9',
                doctorSpecialty: 'Medicina General',
                doctorLocation: 'CONSULTORIO',
                patientName: 'PACIENTE EJEMPLO',
                patientGender: 'MASCULINO',
                patientRut: '98765432-1',
                patientBirthDate: '01/01/1980 (43a)',
                doctorSignature: null
            };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${selectedReport._id}/receta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(medicalData),
            });

            if (!response.ok) {
                throw new Error('Error al generar la receta médica');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receta_medica_${selectedReport._id}.html`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setDownloadError('Error al descargar la receta médica');
        } finally {
            setIsDownloadingReceta(false);
        }
    };

    // Función para descargar informe médico
    const handleDownloadInforme = async () => {
        if (!selectedReport) return;

        setIsDownloadingInforme(true);
        setDownloadError(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${selectedReport._id}/informe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                throw new Error('Error al generar el informe médico');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `informe_medico_${selectedReport._id}.html`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setDownloadError('Error al descargar el informe médico');
        } finally {
            setIsDownloadingInforme(false);
        }
    };

    // Función para descargar exámenes médicos
    const handleDownloadExamenes = async () => {
        if (!selectedReport) return;

        setIsDownloadingExamenes(true);
        setDownloadError(null);

        try {
            const medicalData = {
                clinicName: 'Clínica Alemana',
                doctorName: 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: '12345678-9',
                doctorSpecialty: 'Medicina General',
                doctorLocation: 'CONSULTORIO',
                patientName: 'PACIENTE EJEMPLO',
                patientGender: 'MASCULINO',
                patientRut: '98765432-1',
                patientBirthDate: '01/01/1980 (43a)',
                doctorSignature: null
            };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/${selectedReport._id}/examenes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(medicalData),
            });

            if (!response.ok) {
                throw new Error('Error al generar el documento de exámenes');
            }

            const htmlContent = await response.text();
            
            // Crear una nueva ventana con el contenido HTML
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(htmlContent);
                newWindow.document.close();
            } else {
                // Fallback: descargar como archivo HTML
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `examenes_medicos_${selectedReport._id}.html`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            setDownloadError('Error al descargar el documento de exámenes');
        } finally {
            setIsDownloadingExamenes(false);
        }
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
                                <tr key={r._id}>
                                    <td>{dateObj ? dateObj.toLocaleDateString() : '-'}</td>
                                    <td>{dateObj ? dateObj.toLocaleTimeString() : '-'}</td>
                                    <td>{formatDuration(r.duration)}</td>
                                    <td>
                                        <button 
                                            className={styles.iconBtn}
                                            onClick={() => handleViewReport(r._id)}
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
                            
                            {/* Botones de descarga */}
                            <div className={styles.downloadSection}>
                                <h4>Descargar documentos</h4>
                                <div className={styles.downloadButtons}>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={handleDownloadReceta}
                                        disabled={isDownloadingReceta}
                                        title="Descargar receta médica"
                                    >
                                        <Receipt size={16} />
                                        {isDownloadingReceta ? 'Descargando...' : 'Receta Médica'}
                                    </button>
                                    
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={handleDownloadInforme}
                                        disabled={isDownloadingInforme}
                                        title="Descargar informe médico"
                                    >
                                        <FileText size={16} />
                                        {isDownloadingInforme ? 'Descargando...' : 'Informe Médico'}
                                    </button>
                                    
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={handleDownloadExamenes}
                                        disabled={isDownloadingExamenes}
                                        title="Descargar exámenes médicos"
                                    >
                                        <Download size={16} />
                                        {isDownloadingExamenes ? 'Descargando...' : 'Exámenes Médicos'}
                                    </button>
                                </div>
                                {downloadError && <div className={styles.downloadError}>{downloadError}</div>}
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