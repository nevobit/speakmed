import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubscription, updateSubscription } from '../../api';
import styles from './Subscription.module.css';

interface Subscription {
  plan: string;
  active: boolean;
}

const plans = [
  {
    name: 'BASIC',
    price: { monthly: 49, yearly: 49 * 12 * 0.83 },
    features: [
      '🔥 50% de descuento con el código "EARLYACCESS"',
      'Consultas mensuales 100',
      'Consulta adicional 0.69 USD + tax',
      'Paga anual y obtén 2 meses GRATIS',
    ],
  },
  {
    name: 'PLUS',
    price: { monthly: 79, yearly: 79 * 12 * 0.83 },
    features: [
      '🔥 50% de descuento con el código "EARLYACCESS"',
      'Consultas mensuales 200',
      'Consulta adicional 0.59 USD + tax',
      'Paga anual y obtén 2 meses GRATIS',
    ],
    popular: true,
  },
  {
    name: 'ELITE',
    price: { monthly: 99, yearly: 99 * 12 * 0.83 },
    features: [
      '🔥 50% de descuento con el código "EARLYACCESS"',
      'Consultas ilimitadas',
      'Paga anual y obtén 2 meses GRATIS',
    ],
  },
];

const Subscription: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Subscription>({ queryKey: ['subscription'], queryFn: getSubscription });
  const mutation = useMutation({
    mutationFn: updateSubscription,
    onSuccess: () => {
      setSubscribed(true);
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      setTimeout(() => setSubscribed(false), 2000);
    },
  });
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (plan: string) => {
    mutation.mutate({ plan, active: true });
  };

  if (isLoading) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <h2>Suscripción</h2>
      <div className={styles.toggleRow}>
        <button
          className={period === 'monthly' ? styles.activeToggle : ''}
          onClick={() => setPeriod('monthly')}
        >
          Mensualmente
        </button>
        <button
          className={period === 'yearly' ? styles.activeToggle : ''}
          onClick={() => setPeriod('yearly')}
        >
          Anualmente
        </button>
      </div>
      <div className={styles.plansRow}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={styles.planCard + (plan.popular ? ' ' + styles.popular : '')}
          >
            {plan.popular && <div className={styles.popularLabel}>Más popular</div>}
            <h3>{plan.name}</h3>
            <div className={styles.price}>
              USD {period === 'monthly' ? plan.price.monthly : plan.price.yearly.toFixed(0)}
              <span className={styles.period}>/ {period === 'monthly' ? 'mes' : 'año'}</span>
            </div>
            <ul className={styles.features}>
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <button
              className={styles.subscribeBtn}
              onClick={() => handleSubscribe(plan.name)}
              disabled={data?.plan === plan.name}
            >
              {data?.plan === plan.name ? 'Suscrito' : 'Suscribirse'}
            </button>
            {subscribed && data?.plan === plan.name && (
              <div className={styles.confirmation}>¡Suscripción exitosa a {plan.name}!</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription; 