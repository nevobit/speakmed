import AudioRecorder from './components/AudioRecorder/AudioRecorder';
import Layout from './components/Layout/Layout';
// import Login from './components/Auth/Login';
// import Register from './components/Auth/Register';
import Reports from './components/Reports/Reports';
import Personalization from './components/Personalization/Personalization';
import Subscription from './components/Subscription/Subscription';
import Profile from './components/Profile/Profile';
import { useState, useEffect } from 'react';
import { Mic, FileText, Download, Clock, TrendingUp, Users } from 'lucide-react';
import './App.css';

interface DashboardStats {
  totalRecordings: number;
  totalReports: number;
  totalDownloads: number;
  averageDuration: number;
  recentActivity: Array<{
    id: string;
    type: 'recording' | 'report' | 'download';
    title: string;
    date: string;
  }>;
}

function App() {
  // const [auth, setAuth] = useState<'login' | 'register' | 'app'>('login');
  const [section, setSection] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalRecordings: 0,
    totalReports: 0,
    totalDownloads: 0,
    averageDuration: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar estadísticas reales desde la API
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/stats`);
        
        if (!response.ok) {
          throw new Error('Error al cargar estadísticas');
        }
        
        const realStats: DashboardStats = await response.json();
        setStats(realStats);
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback a datos básicos si hay error
        setStats({
          totalRecordings: 0,
          totalReports: 0,
          totalDownloads: 0,
          averageDuration: 0,
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    if (section === 'dashboard') {
      loadStats();
    }
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'recording':
        return <Mic size={16} className="text-blue-500" />;
      case 'report':
        return <FileText size={16} className="text-green-500" />;
      case 'download':
        return <Download size={16} className="text-purple-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para recargar estadísticas
  const reloadStats = () => {
    if (section === 'dashboard') {
      const loadStats = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/stats`);
          
          if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
          }
          
          const realStats: DashboardStats = await response.json();
          setStats(realStats);
        } catch (error) {
          console.error('Error loading stats:', error);
        } finally {
          setLoading(false);
        }
      };
      loadStats();
    }
  };

  // if (auth === 'login') {
  //   return <Login onLogin={() => setAuth('app')} onSwitch={() => setAuth('register')} />;
  // }
  // if (auth === 'register') {
  //   return <Register onRegister={() => setAuth('app')} onSwitch={() => setAuth('login')} />;
  // }
  return (
    <Layout userName="Jose Arbelaes" active={section} onNavigate={setSection}>
      {section === 'dashboard' && (
        <div className="dashboard">
          <div className="dashboard-header">
            <h1>Bienvenido a Speakmed</h1>
            <p>Panel de control y estadísticas del sistema</p>
          </div>

          {loading ? (
            <div className="loading-stats">
              <div className="spinner"></div>
              <p>Cargando estadísticas...</p>
            </div>
          ) : (
            <>
              {/* Tarjetas de estadísticas */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Mic size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalRecordings}</h3>
                    <p>Grabaciones Totales</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FileText size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalReports}</h3>
                    <p>Reportes Generados</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Download size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalDownloads}</h3>
                    <p>Documentos Descargados</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.averageDuration} min</h3>
                    <p>Duración Promedio</p>
                  </div>
                </div>
              </div>

              {/* Gráfico de tendencias */}
              <div className="trends-section">
                <div className="trends-header">
                  <h2><TrendingUp size={20} /> Tendencias del Mes</h2>
                </div>
                <div className="trends-chart">
                  <div className="chart-bar" style={{ height: '60%' }}>
                    <span>Semana 1</span>
                  </div>
                  <div className="chart-bar" style={{ height: '80%' }}>
                    <span>Semana 2</span>
                  </div>
                  <div className="chart-bar" style={{ height: '45%' }}>
                    <span>Semana 3</span>
                  </div>
                  <div className="chart-bar" style={{ height: '90%' }}>
                    <span>Semana 4</span>
                  </div>
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="recent-activity">
                <div className="activity-header">
                  <h2><Users size={20} /> Actividad Reciente</h2>
                </div>
                <div className="activity-list">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>{formatDate(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="quick-actions">
                <h2>Acciones Rápidas</h2>
                <div className="actions-grid">
                  <button 
                    className="action-btn primary"
                    onClick={() => setSection('recording')}
                  >
                    <Mic size={20} />
                    Nueva Grabación
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => setSection('reports')}
                  >
                    <FileText size={20} />
                    Ver Reportes
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => setSection('personalization')}
                  >
                    <Users size={20} />
                    Configuración
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {section === 'recording' && <AudioRecorder reloadStats={reloadStats} />}
      {section === 'reports' && <Reports />}
      {section === 'personalization' && <Personalization />}
      {section === 'subscription' && <Subscription />}
      {section === 'profile' && <Profile />}
      {/* Aquí irán las demás secciones: reports, personalization, subscription, profile */}
    </Layout>
  );
}

export default App;
