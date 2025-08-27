import { FastifyInstance, RouteOptions } from 'fastify';
import { healthCheckRoute } from './health-check';
import { authRoutes } from './auth';
import { getTemplatesRoute, createTemplateRoute, updateTemplateRoute, deleteTemplateRoute } from './templates';
import { getReportsRoute, getReportDetailRoute, createReportRoute, updateReportRoute, deleteReportRoute, downloadRecetaRoute, downloadInformeRoute, downloadExamenesRoute, getDashboardStatsRoute } from './reports';
import { getSettingsRoute, updateSettingsRoute } from './settings';
import { getSubscriptionRoute, updateSubscriptionRoute } from './subscription';
import { getProfileRoute, updateProfileRoute } from './profile';
import { transcribeRoute } from './transcribe';
import { vademecumRoute } from './vademecum';
import { medicationValidationRoute } from './medication-validation';
import { aiMedicationValidationRoute } from './ai-medication-validation';
import { audioMedicationExtractionRoute } from './audio-medication-extraction';
import { descargarRecetaRoute } from './recetas';
import { descargarExamenRoute } from './examenes';
import { vozDoctorRoute } from './voz-doctor';

const routes: RouteOptions[] = [
    healthCheckRoute,
    ...authRoutes,
    transcribeRoute,
    medicationValidationRoute,
    aiMedicationValidationRoute,
    audioMedicationExtractionRoute,
    getTemplatesRoute,
    createTemplateRoute,
    updateTemplateRoute,
    deleteTemplateRoute,
    getReportsRoute,
    getReportDetailRoute,
    createReportRoute,
    updateReportRoute,
    deleteReportRoute,
    downloadRecetaRoute,
    downloadInformeRoute,
    downloadExamenesRoute,
    getDashboardStatsRoute,
    getSettingsRoute,
    updateSettingsRoute,
    getSubscriptionRoute,
    updateSubscriptionRoute,
    getProfileRoute,
    updateProfileRoute,
    vademecumRoute,
    descargarRecetaRoute,
    descargarExamenRoute,
    vozDoctorRoute,
]

export const registerRoutes = (fasitfy: FastifyInstance) => {
    routes.map((route) => {
        fasitfy.route(route);
    })
}