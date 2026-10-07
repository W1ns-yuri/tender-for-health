/**
 * authConstants.js
 * Константы, демонстрационные аккаунты и утилиты валидации для модуля аутентификации
 */

export const COUNTRIES = [
  { id: 'TM', nameKey: 'countryTM', defaultName: 'Туркменистан (+993)', prefix: '+993' },
  { id: 'RU', nameKey: 'countryRU', defaultName: 'Россия (+7)', prefix: '+7' },
  { id: 'TR', nameKey: 'countryTR', defaultName: 'Турция (+90)', prefix: '+90' },
  { id: 'DE', nameKey: 'countryDE', defaultName: 'Германия (+49)', prefix: '+49' },
  { id: 'CN', nameKey: 'countryCN', defaultName: 'Китай (+86)', prefix: '+86' },
  { id: 'IN', nameKey: 'countryIN', defaultName: 'Индия (+91)', prefix: '+91' },
  { id: 'AE', nameKey: 'countryAE', defaultName: 'ОАЭ (+971)', prefix: '+971' },
  { id: 'KZ', nameKey: 'countryKZ', defaultName: 'Казахстан (+7)', prefix: '+7' },
  { id: 'UZ', nameKey: 'countryUZ', defaultName: 'Узбекистан (+998)', prefix: '+998' },
  { id: 'OTHER', nameKey: 'countryOther', defaultName: 'Другая страна (Международный)', prefix: '+' },
];

export const TENDER_ILLUSTRATIONS = [
  {
    id: 'variant-6',
    src: '/assets/tender-variant-6.jpg',
    titleKey: 'illVariant6Title',
    defaultTitle: 'Геометрический стиль: Тендерная документация и заявки',
    tagKey: 'illVariant6Tag',
    defaultTag: 'Вариант 1 (В стиле оригинала)',
  },
  {
    id: 'variant-2',
    src: '/assets/tender-variant-2.jpg',
    titleKey: 'illVariant2Title',
    defaultTitle: 'Панель торгов: Сравнение ценовых предложений и рейтинг',
    tagKey: 'illVariant2Tag',
    defaultTag: 'Вариант 2 (Аукцион и лоты)',
  },
  {
    id: 'variant-1',
    src: '/assets/tender-variant-1.jpg',
    titleKey: 'illVariant1Title',
    defaultTitle: 'Электронный контракт: Цифровая подпись и верификация',
    tagKey: 'illVariant1Tag',
    defaultTag: 'Вариант 3 (ЭЦП и контракт)',
  },
  {
    id: 'variant-3',
    src: '/assets/tender-variant-3.jpg',
    titleKey: 'illVariant3Title',
    defaultTitle: 'Медицинские закупки: Поставки медикаментов и логистика',
    tagKey: 'illVariant3Tag',
    defaultTag: 'Вариант 4 (Фармацевтика)',
  },
  {
    id: 'variant-4',
    src: '/assets/tender-variant-4.jpg',
    titleKey: 'illVariant4Title',
    defaultTitle: 'Деловое партнерство: Утверждение победителя тендера',
    tagKey: 'illVariant4Tag',
    defaultTag: 'Вариант 5 (Партнерство)',
  },
  {
    id: 'variant-5',
    src: '/assets/tender-variant-5.jpg',
    titleKey: 'illVariant5Title',
    defaultTitle: '3D Экосистема: Электронная платформа торгов',
    tagKey: 'illVariant5Tag',
    defaultTag: 'Вариант 6 (3D Экосистема)',
  },
  {
    id: 'original',
    src: '/assets/login-page-ullustration.jpg',
    titleKey: 'illOriginalTitle',
    defaultTitle: 'Исходная иллюстрация (Абстрактная)',
    tagKey: 'illOriginalTag',
    defaultTag: 'Оригинал',
  },
];

/**
 * Реестр демонстрационных учетных записей из базы данных
 */
export const DEMO_ACCOUNTS = [
  {
    role: 'ADMIN',
    username: 'admin',
    password: 'password123',
    name: 'Главный Администратор',
    company: 'Министерство здравоохранения и медицинской промышленности',
    badge: 'ADMIN',
    category: 'Тендерный комитет',
    desc: 'Полный доступ ко всем модулям, публикация, вскрытие и оценка заявок',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    role: 'SUPPLIER',
    username: 'derman_saglyk',
    password: 'supplier123',
    name: 'HJ «Derman Saglyk»',
    company: 'Hojalyk Jemgyýeti «Derman Saglyk»',
    badge: 'HJ',
    category: 'Фармацевтика и ЛС',
    desc: 'Поставщик жизненно важных лекарственных препаратов и растворов',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    role: 'SUPPLIER',
    username: 'medtehnika',
    password: 'supplier123',
    name: 'ÝGP «MedTehnika Üpjünçilik»',
    company: 'Ýöriteleşdirilen Kärhana «MedTehnika Üpjünçilik»',
    badge: 'ÝGP',
    category: 'Медицинская техника',
    desc: 'Поставка и сервисное обслуживание диагностического оборудования',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    role: 'SUPPLIER',
    username: 'arassa_lukman',
    password: 'supplier123',
    name: 'HK «Arassa Lukman Enjamlary»',
    company: 'Hususy Kärhana «Arassa Lukman Enjamlary»',
    badge: 'HK',
    category: 'Расходные материалы',
    desc: 'Одноразовые шприцы, системы инфузий, перевязочные средства',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    role: 'SUPPLIER',
    username: 'sanly_lukman',
    password: 'supplier123',
    name: 'HJ «Sanly Lukmançylyk Ulgamlary»',
    company: 'Hojalyk Jemgyýeti «Sanly Lukmançylyk Ulgamlary»',
    badge: 'HJ',
    category: 'IT и цифровая медицина',
    desc: 'Разработка МИС, телемедицина и интеграционные серверные шлюзы',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    role: 'SUPPLIER',
    username: 'gurlusyk_med',
    password: 'supplier123',
    name: 'HJ «Gurluşyk Med Inžiniring»',
    company: 'Hojalyk Jemgyýeti «Gurluşyk Med Inžiniring»',
    badge: 'HJ',
    category: 'Инжиниринг и сервис ЛПУ',
    desc: 'Монтаж чистых помещений, вентиляции и систем медицинских газов',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    role: 'SUPPLIER',
    username: 'bio_reagent',
    password: 'supplier123',
    name: 'HK «BioReagent Standart»',
    company: 'Hususy Kärhana «BioReagent Standart»',
    badge: 'HK',
    category: 'Лабораторные реактивы',
    desc: 'Тест-системы ИФА/ПЦР, биохимические реагенты и калибраторы',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

/**
 * Форматирование номеров телефонов по маскам стран
 */
export const formatPhoneTM = (val) => {
  const v = val.replace(/\D/g, '').slice(0, 8);
  if (v.length > 6) return `${v.slice(0, 2)} ${v.slice(2, 4)}-${v.slice(4, 6)}-${v.slice(6)}`;
  if (v.length > 4) return `${v.slice(0, 2)} ${v.slice(2, 4)}-${v.slice(4)}`;
  if (v.length > 2) return `${v.slice(0, 2)} ${v.slice(2)}`;
  return v;
};

export const formatPhoneRU = (val) => {
  const v = val.replace(/\D/g, '').slice(0, 10);
  if (v.length > 7) return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 8)}-${v.slice(8)}`;
  if (v.length > 5) return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6)}`;
  if (v.length > 3) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
  if (v.length > 0) return `(${v}`;
  return v;
};

export const formatPhoneTR = (val) => {
  const v = val.replace(/\D/g, '').slice(0, 10);
  if (v.length > 6) return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6, 8)} ${v.slice(8)}`;
  if (v.length > 3) return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
  if (v.length > 0) return `${v.slice(0, 3)} ${v.slice(3)}`;
  return v;
};

export const formatPhoneByCountry = (countryCode, val) => {
  if (countryCode === 'TM') return formatPhoneTM(val);
  if (countryCode === 'RU' || countryCode === 'KZ') return formatPhoneRU(val);
  if (countryCode === 'TR') return formatPhoneTR(val);
  if (countryCode === 'OTHER') return val.replace(/[^\d+\s-]/g, '').slice(0, 20);
  return val.replace(/[^\d\s-]/g, '').slice(0, 16);
};

export const isPhoneValidForCountry = (countryCode, phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (countryCode === 'TM') return digits.length === 8;
  if (countryCode === 'RU' || countryCode === 'KZ' || countryCode === 'TR') return digits.length >= 10;
  if (countryCode === 'OTHER') return digits.length >= 7;
  return digits.length >= 6;
};

/**
 * Очистка названия компании от ОПФ при регистрации
 */
export const cleanCompanyName = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  const cleaned = trimmed
    .replace(/^(ип|хо|ооо|чп|hj|dh|hk|telekeçi|hojalyk\s+jemgyýeti|hususy\s+telekeçi|hususy\s+kärhana)\s*["«'”]?\s*/i, '')
    .replace(/["»'”]$/, '')
    .trim();
  return cleaned || trimmed;
};
