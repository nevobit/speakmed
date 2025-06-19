interface MonthNames {
    en: string;
    es: string;
    fr: string;
    de: string;
    ja: string;
    zh: string;
}

const months: MonthNames[] = [
    {
        en: 'Jan',
        es: 'Ene',
        fr: 'Janv',
        de: 'Jan',
        ja: '1月',
        zh: '一月',
    },
    {
        en: 'Feb',
        es: 'Feb',
        fr: 'Fév',
        de: 'Feb',
        ja: '2月',
        zh: '二月',
    },
    {
        en: 'Mar',
        es: 'Mar',
        fr: 'Mar',
        de: 'Mär',
        ja: '3月',
        zh: '三月',
    },
    {
        en: 'April',
        es: 'Abril',
        fr: 'Avr',
        de: 'Apr',
        ja: '4月',
        zh: '四月',
    },
    {
        en: 'May',
        es: 'Mayo',
        fr: 'Mai',
        de: 'Mai',
        ja: '5月',
        zh: '五月',
    },
    {
        en: 'June',
        es: 'Jun',
        fr: 'Juin',
        de: 'Juni',
        ja: '6月',
        zh: '六月',
    },
    {
        en: 'July',
        es: 'Jul',
        fr: 'Juil',
        de: 'Juli',
        ja: '7月',
        zh: '七月',
    },
    {
        en: 'Aug',
        es: 'Ago',
        fr: 'Août',
        de: 'Aug',
        ja: '8月',
        zh: '八月',
    },
    {
        en: 'Sep',
        es: 'Sep',
        fr: 'Sept',
        de: 'Sep',
        ja: '9月',
        zh: '九月',
    },
    {
        en: 'Oct',
        es: 'Oct',
        fr: 'Oct',
        de: 'Okt',
        ja: '10月',
        zh: '十月',
    },
    {
        en: 'Nov',
        es: 'Nov',
        fr: 'Nov',
        de: 'Nov',
        ja: '11月',
        zh: '十一月',
    },
    {
        en: 'Dec',
        es: 'Dic',
        fr: 'Déc',
        de: 'Dez',
        ja: '12月',
        zh: '十二月',
    },
];

export const getMonth = (monthNumber: number, language: string): string => {
    const monthIndex = monthNumber - 1;
    const selectedMonth = months[monthIndex];

    if (selectedMonth) {
        return selectedMonth[language as keyof MonthNames];
    } else {
        throw new Error('Invalid month number');
    }
}

