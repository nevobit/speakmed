import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../../api';
import { User, Calendar, Phone, IdCard, Building2, Stethoscope, Save } from 'lucide-react';
import styles from './Profile.module.css';

interface Profile {
  name: string;
  gender: string;
  identification: string;
  city: string;
  country: string;
  email: string;
  enterprise: string;
  birth: string;
  phone: string;
  license: string;
  center: string;
  specialty: string;
}

const initialProfile: Profile = {
  name: '',
  gender: '',
  identification: '',
  city: '',
  country: '',
  email: '',
  enterprise: '',
  birth: '',
  phone: '',
  license: '',
  center: '',
  specialty: '',
};

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Profile>({ queryKey: ['profile'], queryFn: getProfile });
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setSaved(false), 2000);
    },
  });
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (data) {
      setProfile({
        ...initialProfile,
        ...data,
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(profile);
  };

  if (isLoading) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <h2><User size={20} style={{marginRight: '0.8rem'}} /> Mi perfil</h2>
      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.row}>
          <div className={styles.field}><IdCard size={18} />
            <input
              type="text"
              name="identification"
              placeholder="Número de identificación nacional"
              value={profile.identification}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <select name="gender" value={profile.gender} onChange={handleChange} className={styles.input}>
              <option value="">Selecciona tu género</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}><Calendar size={18} />
            <input
              type="date"
              name="birth"
              placeholder="Fecha de nacimiento"
              value={profile.birth}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}><Phone size={18} />
            <input
              type="text"
              name="phone"
              placeholder="Número de teléfono"
              value={profile.phone}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}><Stethoscope size={18} />
            <input
              type="text"
              name="license"
              placeholder="Número colegiado"
              value={profile.license}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}><Building2 size={18} />
            <select name="center" value={profile.center} onChange={handleChange} className={styles.input}>
              <option value="">Selecciona tu centro</option>
              <option value="Private Practice">Private Practice</option>
              <option value="Hospital">Hospital</option>
              <option value="Clinic">Clínica</option>
            </select>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.field} style={{flex: 1}}>
            <select name="specialty" value={profile.specialty} onChange={handleChange} className={styles.input}>
              <option value="">Selecciona tu especialidad</option>
              <option value="medicina">Medicina</option>
              <option value="cirugia">Cirugía</option>
              <option value="pediatria">Pediatría</option>
              <option value="otra">Otra</option>
            </select>
          </div>
        </div>
        <button className={styles.saveBtn} type="submit"><Save size={18} style={{marginRight: '0.6rem'}} /> Guardar</button>
        {saved && <div className={styles.savedMsg}>¡Perfil guardado!</div>}
      </form>
    </div>
  );
};

export default Profile; 