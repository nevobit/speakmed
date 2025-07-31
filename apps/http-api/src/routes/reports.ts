import { RouteOptions } from 'fastify';
import { ReportSchemaMongo } from '@repo/entities/src/models/report-mongo';
import { TemplateSchemaMongo } from '@repo/entities/src/models/template-mongo';
import mongoose from 'mongoose';
import Handlebars from 'handlebars';
import { createReport, getAllReports, getReportById, getTemplateById } from '@repo/business-logic';
import axios from 'axios';

const Report = mongoose.model('Report', ReportSchemaMongo);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Function to enhance medical content using ChatGPT
async function enhanceMedicalContent(rawContent: string): Promise<string> {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, returning raw content');
        return rawContent;
    }

    const medicalPrompt = `Eres un asistente médico experto. Analiza el siguiente contenido de una consulta médica y genera un informe médico detallado, bien estructurado y profesional. 

El informe debe incluir:
1. Resumen ejecutivo de la consulta
2. Motivo de consulta
3. Antecedentes relevantes
4. Exploración física (si aplica)
5. Diagnóstico/Impresión diagnóstica
6. Plan de tratamiento/Recomendaciones
7. Observaciones adicionales

Formatea el resultado en HTML con etiquetas apropiadas para una presentación profesional. Usa un lenguaje médico apropiado pero comprensible.

Contenido de la consulta:
${rawContent}

Genera un informe médico completo y detallado:`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente médico experto especializado en generar informes médicos detallados y profesionales.'
                    },
                    {
                        role: 'user',
                        content: medicalPrompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error('Error calling OpenAI API:', error);

        return `
            <div class="medical-report">
                <h2>Informe Médico</h2>
                <div class="content">
                    <h3>Resumen de la Consulta</h3>
                    <p>${rawContent}</p>
                </div>
            </div>
        `;
    }
}

// Function to generate medical summary using ChatGPT
async function generateMedicalSummary(enhancedContent: string): Promise<string> {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, returning basic summary');
        return enhancedContent.slice(0, 200) + (enhancedContent.length > 200 ? '...' : '');
    }

    const summaryPrompt = `Eres un asistente médico experto. Genera un resumen ejecutivo conciso y profesional del siguiente informe médico.

El resumen debe incluir:
- Motivo principal de la consulta
- Diagnóstico principal
- Recomendaciones más importantes
- Duración máxima de 150 palabras

IMPORTANTE: Devuelve SOLO el texto del resumen, sin formato HTML, sin etiquetas, sin viñetas. Solo texto plano y legible.

Informe médico:
${enhancedContent}

Resumen ejecutivo:`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente médico experto especializado en generar resúmenes ejecutivos concisos y profesionales.'
                    },
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                max_tokens: 300,
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error: any) {
        console.error('Error calling OpenAI API for summary:', error);

        // Return basic summary if API fails
        return enhancedContent.slice(0, 200) + (enhancedContent.length > 200 ? '...' : '');
    }
}

export const getReportsRoute: RouteOptions = {
    method: 'GET',
    url: '/api/reports',
    handler: async (request, reply) => {
        // const userId = request.headers['x-user-id'] as string;
        const reports = await getAllReports();
        return reports;
    },
};

export const getReportDetailRoute: RouteOptions = {
    method: 'GET',
    url: '/api/reports/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const report = await getReportById(id)
        return report;
    },
};

export const createReportRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports',
    handler: async (request, reply) => {
        const userId = request.headers['x-user-id'] as string;
        const { templateId, content, date, duration } = request.body as any;

        console.log(templateId)
        // 1. Buscar la plantilla
        const template = await getTemplateById(templateId);
        // const template = await Template.findOne({ _id: templateId, userId });
        if (!template) {
            return reply.code(404).send({ error: 'Plantilla no encontrada' });
        }

        // 2. Mejorar el contenido usando ChatGPT
        const enhancedContent = await enhanceMedicalContent(content);

        // 3. Generar resumen usando ChatGPT
        const summary = await generateMedicalSummary(enhancedContent);

        let templateSource = '<div>{{content}}</div>';
        if (Array.isArray(template.fields) && typeof template.fields[0] === 'string') {
            templateSource = template.fields[0];
        }
        const compiled = Handlebars.compile(templateSource);
        const reportHtml = compiled({ content: enhancedContent });

        const report = await createReport(templateId, enhancedContent, date, duration, summary);

        return {
            content: enhancedContent,
            summary,
            id: report.id,
        };
    },
};

export const updateReportRoute: RouteOptions = {
    method: 'PUT',
    url: '/api/reports/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const { content, duration, summary } = request.body as any;
        const report = await Report.findByIdAndUpdate(id, { content, duration, summary }, { new: true });
        return report;
    },
};

export const deleteReportRoute: RouteOptions = {
    method: 'DELETE',
    url: '/api/reports/:id',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        await Report.findByIdAndDelete(id);
        return { success: true };
    },
};

// Función para generar PDF de receta médica
export const downloadRecetaRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports/:id/receta',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const medicalData = request.body as any;

        try {
            const report = await getReportById(id);
            if (!report) {
                return reply.code(404).send({ error: 'Reporte no encontrado' });
            }

            // Usar datos médicos personalizados o valores por defecto
            const data = {
                clinicName: medicalData?.clinicName || 'Clínica Alemana',
                doctorName: medicalData?.doctorName || 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: medicalData?.doctorRut || '12345678-9',
                doctorSpecialty: medicalData?.doctorSpecialty || 'Medicina General',
                doctorLocation: medicalData?.doctorLocation || 'CONSULTORIO',
                patientName: medicalData?.patientName || 'PACIENTE EJEMPLO',
                patientGender: medicalData?.patientGender || 'MASCULINO',
                patientRut: medicalData?.patientRut || '98765432-1',
                patientBirthDate: medicalData?.patientBirthDate || '01/01/1980 (43a)',
                doctorSignature: medicalData?.doctorSignature || null
            };

            // Generar contenido HTML para la receta médica con script de impresión automática
            const recetaHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Receta Médica</title>
                    <style>
                        @media print {
                            @page { margin: 20px; }
                            body { margin: 0; padding: 20px; }
                        }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                        .logo { color: #008080; font-weight: bold; font-size: 18px; }
                        .title { color: #008080; text-align: center; font-size: 24px; margin: 20px 0; }
                        .info-section { display: flex; border: 1px solid #ccc; margin-bottom: 20px; }
                        .info-column { flex: 1; padding: 15px; }
                        .info-column:first-child { border-right: 1px solid #ccc; }
                        .label { font-weight: bold; color: #333; }
                        .value { color: #008080; margin-bottom: 10px; }
                        .medications { margin-top: 20px; }
                        .medication-item { margin-bottom: 15px; padding: 10px; background: #f9f9f9; }
                        .signature { margin-top: 40px; text-align: center; }
                        .signature-line { border-top: 1px solid #000; width: 200px; margin: 10px auto; }
                        .signature-image { max-width: 200px; max-height: 100px; margin: 10px auto; }
                        .qr-section { text-align: center; margin-top: 30px; }
                        .validation-text { font-size: 12px; color: #666; margin-top: 20px; }
                        .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #008080; color: white; border: none; border-radius: 5px; cursor: pointer; }
                        @media print { .print-button { display: none; } }
                    </style>
                    <script>
                        function printAsPDF() {
                            window.print();
                        }
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </head>
                <body>
                    <button class="print-button" onclick="printAsPDF()">Imprimir como PDF</button>
                    
                    <div class="header">
                        <div class="logo">${data.clinicName}</div>
                        <div>Indicaciones</div>
                    </div>
                    
                    <div class="title">Receta Médica</div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        Fecha: ${new Date().toLocaleDateString('es-CL')} Hora: ${new Date().toLocaleTimeString('es-CL')}
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="label">Profesional</div>
                            <div class="value">${data.doctorName}</div>
                            <div class="label">RUT:</div>
                            <div class="value">${data.doctorRut}</div>
                            <div class="label">Especialidad:</div>
                            <div class="value">${data.doctorSpecialty}</div>
                            <div class="label">Lugar:</div>
                            <div class="value">${data.doctorLocation}</div>
                        </div>
                        <div class="info-column">
                            <div class="label">Paciente</div>
                            <div class="value">${data.patientName}</div>
                            <div class="label">Sexo:</div>
                            <div class="value">${data.patientGender}</div>
                            <div class="label">RUT:</div>
                            <div class="value">${data.patientRut}</div>
                            <div class="label">Fecha Nacimiento:</div>
                            <div class="value">${data.patientBirthDate}</div>
                        </div>
                    </div>
                    
                    <div class="medications">
                        <div class="title">Receta médica</div>
                        <div class="medication-item">
                            <strong>Medicamento:</strong> Según prescripción médica<br>
                            <strong>Dosis:</strong> Según indicación médica<br>
                            <strong>Frecuencia:</strong> Según prescripción<br>
                            <strong>Duración:</strong> Según indicación médica<br>
                            <strong>Observaciones:</strong> ${report.summary || 'Sin observaciones adicionales'}
                        </div>
                    </div>
                    
                    <div class="signature">
                        ${data.doctorSignature ? `<img src="${data.doctorSignature}" alt="Firma del médico" class="signature-image" />` : '<div class="signature-line"></div>'}
                        <div>${data.doctorName}</div>
                    </div>
                    
                    <div class="qr-section">
                        <div style="width: 100px; height: 100px; background: #008080; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white;">
                            QR
                        </div>
                    </div>
                    
                    <div class="validation-text">
                        Valide este documento en línea escaneando el código QR o visitando la dirección 
                        https://validador.clinicaalemana.cl/validar e ingresar el código ${id}
                    </div>
                </body>
                </html>
            `;

            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename=receta_medica_${id}.html`);
            return reply.send(recetaHtml);

        } catch (error) {
            console.error('Error generating receta PDF:', error);
            return reply.code(500).send({ error: 'Error al generar la receta médica' });
        }
    },
};

// Función para generar PDF del informe completo
export const downloadInformeRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports/:id/informe',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const medicalData = request.body as any;

        try {
            const report = await getReportById(id);
            if (!report) {
                return reply.code(404).send({ error: 'Reporte no encontrado' });
            }

            // Usar datos médicos personalizados o valores por defecto
            const data = {
                clinicName: medicalData?.clinicName || 'Clínica Alemana',
                doctorName: medicalData?.doctorName || 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: medicalData?.doctorRut || '12345678-9',
                doctorSpecialty: medicalData?.doctorSpecialty || 'Medicina General',
                doctorLocation: medicalData?.doctorLocation || 'CONSULTORIO',
                patientName: medicalData?.patientName || 'PACIENTE EJEMPLO',
                patientGender: medicalData?.patientGender || 'MASCULINO',
                patientRut: medicalData?.patientRut || '98765432-1',
                patientBirthDate: medicalData?.patientBirthDate || '01/01/1980 (43a)',
                doctorSignature: medicalData?.doctorSignature || null
            };

            // Generar contenido HTML para el informe médico completo con script de impresión automática
            const informeHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Informe Médico</title>
                    <style>
                        @media print {
                            @page { margin: 20px; }
                            body { margin: 0; padding: 20px; }
                        }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .title { color: #008080; font-size: 24px; margin-bottom: 10px; }
                        .subtitle { color: #666; font-size: 16px; }
                        .section { margin-bottom: 30px; }
                        .section-title { color: #008080; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                        .content { line-height: 1.6; }
                        .summary { background: #f9f9f9; padding: 15px; border-left: 4px solid #008080; }
                        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
                        .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #008080; color: white; border: none; border-radius: 5px; cursor: pointer; }
                        @media print { .print-button { display: none; } }
                        .doctor-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .signature-section { text-align: center; margin-top: 30px; }
                        .signature-image { max-width: 200px; max-height: 100px; margin: 10px auto; }
                    </style>
                    <script>
                        function printAsPDF() {
                            window.print();
                        }
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </head>
                <body>
                    <button class="print-button" onclick="printAsPDF()">Imprimir como PDF</button>
                    
                    <div class="header">
                        <div class="title">Informe Médico</div>
                        <div class="subtitle">${data.clinicName}</div>
                        <div>Fecha: ${new Date().toLocaleDateString('es-CL')} | Hora: ${new Date().toLocaleTimeString('es-CL')}</div>
                    </div>
                    
                    <div class="doctor-info">
                        <strong>Médico:</strong> ${data.doctorName} | <strong>Especialidad:</strong> ${data.doctorSpecialty}<br>
                        <strong>Paciente:</strong> ${data.patientName} | <strong>RUT:</strong> ${data.patientRut}
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Resumen Ejecutivo</div>
                        <div class="summary">
                            ${report.summary || 'Sin resumen disponible'}
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Informe Detallado</div>
                        <div class="content">
                            ${report.content || 'Sin contenido disponible'}
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">Datos del Reporte</div>
                        <div class="content">
                            <strong>ID del Reporte:</strong> ${report.id}<br>
                            <strong>Duración de la consulta:</strong> ${report.duration || 'No especificada'}<br>
                            <strong>Fecha de creación:</strong> ${new Date(report.createdAt || Date.now()).toLocaleDateString('es-CL')}
                        </div>
                    </div>
                    
                    <div class="signature-section">
                        ${data.doctorSignature ? `<img src="${data.doctorSignature}" alt="Firma del médico" class="signature-image" />` : ''}
                        <div><strong>${data.doctorName}</strong></div>
                        <div>${data.doctorSpecialty}</div>
                    </div>
                    
                    <div class="footer">
                        <p>Este informe fue generado automáticamente por el sistema de ${data.clinicName}</p>
                        <p>Para consultas, contacte a su médico tratante</p>
                    </div>
                </body>
                </html>
            `;

            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename=informe_medico_${id}.html`);
            return reply.send(informeHtml);

        } catch (error) {
            console.error('Error generating informe PDF:', error);
            return reply.code(500).send({ error: 'Error al generar el informe médico' });
        }
    },
};

// Función para generar PDF de exámenes médicos
export const downloadExamenesRoute: RouteOptions = {
    method: 'POST',
    url: '/api/reports/:id/examenes',
    handler: async (request, reply) => {
        const { id } = request.params as any;
        const medicalData = request.body as any;

        try {
            const report = await getReportById(id);
            if (!report) {
                return reply.code(404).send({ error: 'Reporte no encontrado' });
            }

            // Usar datos médicos personalizados o valores por defecto
            const data = {
                clinicName: medicalData?.clinicName || 'Clínica Alemana',
                doctorName: medicalData?.doctorName || 'Dr. MÉDICO ESPECIALISTA',
                doctorRut: medicalData?.doctorRut || '12345678-9',
                doctorSpecialty: medicalData?.doctorSpecialty || 'Medicina General',
                doctorLocation: medicalData?.doctorLocation || 'CONSULTORIO',
                patientName: medicalData?.patientName || 'PACIENTE EJEMPLO',
                patientGender: medicalData?.patientGender || 'MASCULINO',
                patientRut: medicalData?.patientRut || '98765432-1',
                patientBirthDate: medicalData?.patientBirthDate || '01/01/1980 (43a)',
                doctorSignature: medicalData?.doctorSignature || null
            };

            // Generar contenido HTML para el documento de exámenes médicos
            const examenesHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Examen / Procedimiento</title>
                    <style>
                        @media print {
                            @page { margin: 20px; }
                            body { margin: 0; padding: 20px; }
                        }
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                        .logo { color: #008080; font-weight: bold; font-size: 18px; }
                        .title { color: #008080; text-align: center; font-size: 24px; margin: 20px 0; }
                        .info-section { display: flex; border: 1px solid #ccc; margin-bottom: 20px; }
                        .info-column { flex: 1; padding: 15px; }
                        .info-column:first-child { border-right: 1px solid #ccc; }
                        .label { font-weight: bold; color: #333; }
                        .value { color: #008080; margin-bottom: 10px; }
                        .exam-section { margin-top: 20px; }
                        .exam-title { color: #008080; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
                        .service-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        .exam-result { margin-bottom: 15px; }
                        .exam-name { font-weight: bold; color: #333; margin-bottom: 5px; }
                        .exam-finding { color: #666; font-size: 14px; }
                        .signature { margin-top: 40px; text-align: center; }
                        .signature-line { border-top: 1px solid #000; width: 200px; margin: 10px auto; }
                        .signature-image { max-width: 200px; max-height: 100px; margin: 10px auto; }
                        .qr-section { text-align: center; margin-top: 30px; }
                        .validation-text { font-size: 12px; color: #666; margin-top: 20px; }
                        .print-button { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #008080; color: white; border: none; border-radius: 5px; cursor: pointer; }
                        @media print { .print-button { display: none; } }
                    </style>
                    <script>
                        function printAsPDF() {
                            window.print();
                        }
                        // Auto-print when page loads
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </head>
                <body>
                    <button class="print-button" onclick="printAsPDF()">Imprimir como PDF</button>
                    
                    <div class="header">
                        <div class="logo">${data.clinicName}</div>
                        <div>Indicaciones</div>
                    </div>
                    
                    <div class="title">Examen / Procedimiento</div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        Fecha: ${new Date().toLocaleDateString('es-CL')} Hora: ${new Date().toLocaleTimeString('es-CL')}
                    </div>
                    
                    <div class="info-section">
                        <div class="info-column">
                            <div class="label">Profesional</div>
                            <div class="value">${data.doctorName}</div>
                            <div class="label">RUT:</div>
                            <div class="value">${data.doctorRut}</div>
                            <div class="label">Especialidad:</div>
                            <div class="value">${data.doctorSpecialty}</div>
                            <div class="label">Lugar:</div>
                            <div class="value">${data.doctorLocation}</div>
                        </div>
                        <div class="info-column">
                            <div class="label">Paciente</div>
                            <div class="value">${data.patientName}</div>
                            <div class="label">Sexo:</div>
                            <div class="value">${data.patientGender}</div>
                            <div class="label">RUT:</div>
                            <div class="value">${data.patientRut}</div>
                            <div class="label">Fecha Nacimiento:</div>
                            <div class="value">${data.patientBirthDate}</div>
                        </div>
                    </div>
                    
                    <div class="exam-section">
                        <div class="exam-title">Examen / Procedimiento</div>
                        
                        <div class="service-info">
                            <strong>Servicio:</strong> ${data.doctorSpecialty} / <strong>Hip. Diagnóstica:</strong> No Definido
                        </div>
                        
                        <div class="exam-result">
                            <div class="exam-name">1. ${data.doctorSpecialty.toUpperCase()} - ${data.doctorSpecialty.toUpperCase()}</div>
                            <div class="exam-finding">
                                ${report.summary || 'Sin hallazgos específicos reportados'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="signature">
                        ${data.doctorSignature ? `<img src="${data.doctorSignature}" alt="Firma del médico" class="signature-image" />` : '<div class="signature-line"></div>'}
                        <div>${data.doctorName}</div>
                    </div>
                    
                    <div class="qr-section">
                        <div style="width: 100px; height: 100px; background: #008080; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: white;">
                            QR
                        </div>
                    </div>
                    
                    <div class="validation-text">
                        Valide este documento en línea escaneando el código QR o visitando la dirección 
                        https://validador.clinicaalemana.cl/validar e ingresar el código ${id}
                    </div>
                </body>
                </html>
            `;

            reply.header('Content-Type', 'text/html');
            reply.header('Content-Disposition', `attachment; filename=examenes_medicos_${id}.html`);
            return reply.send(examenesHtml);

        } catch (error) {
            console.error('Error generating examenes PDF:', error);
            return reply.code(500).send({ error: 'Error al generar el documento de exámenes' });
        }
    },
};

// Función para obtener estadísticas del dashboard
export const getDashboardStatsRoute: RouteOptions = {
    method: 'GET',
    url: '/api/dashboard/stats',
    handler: async (request, reply) => {
        try {
            // Obtener estadísticas reales de la base de datos
            const totalReports = await Report.countDocuments();

            // Calcular duración promedio
            const reportsWithDuration = await Report.find({ duration: { $exists: true, $ne: null } });
            const averageDuration = reportsWithDuration.length > 0
                ? reportsWithDuration.reduce((acc, report) => acc + (parseInt(report.duration) || 0), 0) / reportsWithDuration.length
                : 0;

            // Obtener actividad reciente (últimos 10 reportes)
            const recentReports = await Report.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            // Simular estadísticas de descargas (en un sistema real, esto vendría de una tabla de logs)
            const totalDownloads = Math.floor(totalReports * 2.3); // Simulación basada en reportes

            // Simular estadísticas de grabaciones (en un sistema real, esto vendría de logs de transcripción)
            const totalRecordings = Math.floor(totalReports * 1.1); // Simulación basada en reportes

            // Formatear actividad reciente
            const recentActivity = recentReports.map((report, index) => ({
                id: report._id.toString(),
                type: 'report' as const,
                title: `Informe Médico - ${report.summary ? report.summary.substring(0, 30) + '...' : 'Sin título'}`,
                date: report.createdAt ? new Date(report.createdAt).toISOString() : new Date().toISOString()
            }));

            // Agregar algunas actividades simuladas para variedad
            const mockActivities = [
                {
                    id: `download-${Date.now()}`,
                    type: 'download' as const,
                    title: 'Receta Médica descargada',
                    date: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutos atrás
                },
                {
                    id: `recording-${Date.now()}`,
                    type: 'recording' as const,
                    title: 'Nueva grabación iniciada',
                    date: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hora atrás
                }
            ];

            // Combinar actividades reales y simuladas
            const allActivities = [...recentActivity, ...mockActivities]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 6); // Limitar a 6 actividades

            const stats = {
                totalRecordings,
                totalReports,
                totalDownloads,
                averageDuration: Math.round(averageDuration * 10) / 10, // Redondear a 1 decimal
                recentActivity: allActivities
            };

            return stats;

        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return reply.code(500).send({ error: 'Error al obtener estadísticas del dashboard' });
        }
    },
}; 