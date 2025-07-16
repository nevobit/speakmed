import AudioRecorder from './components/AudioRecorder/AudioRecorder';
import Layout from './components/Layout/Layout';
// import Login from './components/Auth/Login';
// import Register from './components/Auth/Register';
import Reports from './components/Reports/Reports';
import Personalization from './components/Personalization/Personalization';
import Subscription from './components/Subscription/Subscription';
import Profile from './components/Profile/Profile';
import { useState } from 'react';

function App() {
  // const [auth, setAuth] = useState<'login' | 'register' | 'app'>('login');
  const [section, setSection] = useState('dashboard');

  // if (auth === 'login') {
  //   return <Login onLogin={() => setAuth('app')} onSwitch={() => setAuth('register')} />;
  // }
  // if (auth === 'register') {
  //   return <Register onRegister={() => setAuth('app')} onSwitch={() => setAuth('login')} />;
  // }
  return (
    <Layout userName="Jose Arbelaes" active={section} onNavigate={setSection}>
      {section === 'dashboard' && (
        <>
          <h1>Bienvenido a Speakmed</h1>
          <p>Selecciona una opción del menú para comenzar.</p>
        </>
      )}
      {section === 'recording' && <AudioRecorder />}
      {section === 'reports' && <Reports />}
      {section === 'personalization' && <Personalization />}
      {section === 'subscription' && <Subscription />}
      {section === 'profile' && <Profile />}
      {/* Aquí irán las demás secciones: reports, personalization, subscription, profile */}
    </Layout>
  );
}

export default App;
