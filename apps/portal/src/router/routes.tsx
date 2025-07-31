import { RouteObject } from 'react-router-dom';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';
import { ErrorBoundary } from '../screens';
import GuardRoute from '@/guards';
import Layout from '@/components/Layout/Layout';
import AudioRecorder from '@/components/AudioRecorder/AudioRecorder';
import Reports from '@/components/Reports/Reports';
import Personalization from '@/components/Personalization/Personalization';
import Subscription from '@/components/Subscription/Subscription';
import Profile from '@/components/Profile/Profile';
import Vademecum from '../components/Vademecum';
import DescargarReceta from '../components/DescargarReceta';
import DescargarExamenes from '../components/DescargarExamenes';
import TranscripcionDiarizacion from '../components/TranscripcionDiarizacion';
import ManualMedicationValidation from '../components/ManualMedicationValidation';
import AIMedicationValidation from '../components/AIMedicationValidation';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/register',
    element: <Register />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: <GuardRoute privateValidation />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <Layout userName={'Usuario'} active={''} />,
        children: [
            {
            index: true,
        path: '/',
      
            element: (
              <>
                <h1>Bienvenido a Speakmed</h1>
                <p>Selecciona una opción del menú para comenzar.</p>
              </>
            ),
          },
          {
            path: '/dashboard',
            element: (
              <>
                <h1>Bienvenido a Speakmed</h1>
                <p>Selecciona una opción del menú para comenzar.</p>
              </>
            ),
          },
          {
            path: '/recording',
            element: <AudioRecorder />
          },
          {
            path: '/reports',
            element: <Reports />
          },
          {
            path: '/personalization',
            element: <Personalization />
          },
          {
            path: '/subscription',
            element: <Subscription />
          },
          {
            path: '/profile',
            element: <Profile />
          },
          {
            path: '/vademecum',
            element: <Vademecum />
          },
          {
            path: '/descargar-receta',
            element: <DescargarReceta />
          },
          {
            path: '/descargar-examenes',
            element: <DescargarExamenes />
          },
          {
            path: '/transcripcion-diarizacion',
            element: <TranscripcionDiarizacion />
          },
          {
            path: '/validacion-medicamentos',
            element: <ManualMedicationValidation />
          },
          {
            path: '/validacion-ia',
            element: <AIMedicationValidation />
          }
        ]
      }
    ]
  },

];
