interface LanguageStrings {
  day: string;
  days: string;
  hour: string;
  hours: string;
  minute: string;
  minutes: string;
  second: string;
  seconds: string;
  ago: string;
}

const languageStrings: Record<string, LanguageStrings> = {
  en: {
    day: 'day',
    days: 'days',
    hour: 'hour',
    hours: 'hours',
    minute: 'minute',
    minutes: 'minutes',
    second: 'second',
    seconds: 'seconds',
    ago: 'ago',
  },
  es: {
    day: 'día',
    days: 'días',
    hour: 'hora',
    hours: 'horas',
    minute: 'minuto',
    minutes: 'minutos',
    second: 'segundo',
    seconds: 'segundos',
    ago: 'hace',
  },
  fr: {
    day: 'jour',
    days: 'jours',
    hour: 'heure',
    hours: 'heures',
    minute: 'minute',
    minutes: 'minutes',
    second: 'seconde',
    seconds: 'secondes',
    ago: 'depuis',
  },
};

export const fromNow = (d: Date, language: string = 'en'): string => {
  const date = new Date(d);
  const currentDate = new Date();
  const timeDiff = currentDate.getTime() - date.getTime();
  const secondsDiff = Math.round(timeDiff / 1000);
  const minutesDiff = Math.round(secondsDiff / 60);
  const hoursDiff = Math.round(minutesDiff / 60);
  const daysDiff = Math.round(hoursDiff / 24);

  let formattedDate = '';
  if (daysDiff > 0) {
    formattedDate = `${daysDiff} ${languageStrings[language as keyof typeof languageStrings].days} ${languageStrings[language as keyof typeof languageStrings].ago}`;
  } else if (hoursDiff > 0) {
    formattedDate = `${hoursDiff} ${languageStrings[language as keyof typeof languageStrings].hours} ${languageStrings[language as keyof typeof languageStrings].ago}`;
  } else if (minutesDiff > 0) {
    formattedDate = `${minutesDiff} ${languageStrings[language as keyof typeof languageStrings].minutes} ${languageStrings[language as keyof typeof languageStrings].ago}`;
  } else {
    formattedDate = `${secondsDiff} ${languageStrings[language as keyof typeof languageStrings].seconds}`;
    if (secondsDiff !== 1) {
      formattedDate += ` ${languageStrings[language as keyof typeof languageStrings].ago}`;
    } else {
      formattedDate += ` ${languageStrings[language as keyof typeof languageStrings].second}`;
    }
  }

  return formattedDate;
};
