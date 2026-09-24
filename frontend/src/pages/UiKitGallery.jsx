import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  CustomSelect,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableEmptyState,
  Alert,
  StatCard,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  Tabs,
  Pagination,
  SearchInput,
  SkeletonTable,
  FileDropzone,
} from '../components/ui';

import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  FileText,
  DollarSign,
  Users,
  Building,
  Sparkles,
  Shield,
  Eye,
  Clock,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';

const TEXTS = {
  RU: {
    bannerTag: 'W1ns UI Kit • Медицинская платформа v2.0',
    bannerTitle: 'W1ns UI Kit & Единая Дизайн-Система',
    bannerDesc: 'Утвержденная библиотека переиспользуемых элементов. Изменение компонента в одном месте (шрифт, отступы, скругления) мгновенно обновляет весь сайт.',
    roleAdmin: 'Администратор (Изумрудный)',
    roleSupplier: 'Поставщик (Синий)',
    themeMode: 'Тема оформления',
    langSelector: 'Язык отображения',
    sectionMetrics: '1. Аналитические метрики (StatCard для Дашборда и Аналитики)',
    metricTenders: 'Всего торгов',
    metricTurnover: 'Общий оборот',
    metricSuppliers: 'Зарегистрировано поставщиков',
    metricPending: 'На проверке модератором',
    sectionRoles: '2. Разделение стилей: Администратор и Поставщик (Buttons & Themes)',
    adminThemeTitle: 'Тема Администратора (Изумрудный акцент)',
    supplierThemeTitle: 'Тема Поставщика (Синий акцент)',
    sectionInputs: '3. Поля ввода и выпадающие списки (Input, Select, CustomSelect)',
    customSelectTitle: 'Портальный CustomSelect (не обрезается overflow, с поиском и автопозиционированием)',
    nativeSelectTitle: 'Нативный Select',
    sectionBadges: '4. Статусные бейджи и Уведомления (Badges & Alerts)',
    sectionTabs: '5. Переключатели вкладок (Tabs)',
    sectionTables: '6. Стандартизированные таблицы: 2 основных типа системы',
    tableTypeAdmin: 'Тип А: Административная таблица управления (Поставщики / Модерация)',
    tableTypeDashboard: 'Тип Б: Обзорная таблица дашборда (Тендеры / Лоты)',
    sectionDropzone: '7. Зона загрузки документов (File Dropzone)',
    sectionModals: '8. Модальные окна и подтверждения (Modals & Dialogs)',
    sectionSkeletons: '9. Скелетоны загрузки (Skeleton Loaders)',
    openModalBtn: 'Открыть стандартный модал',
    openConfirmBtn: 'Открыть диалог удаления',
    searchPlaceholder: 'Поиск по названию или коду...',
  },
  TM: {
    bannerTag: 'W1ns UI Kit • Lukmançylyk ulgamy v2.0',
    bannerTitle: 'W1ns UI Kit & Ýeke-täk dizaýn ulgamy',
    bannerDesc: 'Taslamanyň ähli sahypalarynda dizaýn birligini üpjün edýän tassyklanan komponentler toplumy. Bir ýerde üýtgetmek ähli sahypalara täsir edýär.',
    roleAdmin: 'Administrator (Zümerret)',
    roleSupplier: 'Üpjün ediji (Gök)',
    themeMode: 'Dizaýn tertibi',
    langSelector: 'Görkezilýän dil',
    sectionMetrics: '1. Analitiki Metrika Kartlary (Stat Cards)',
    metricTenders: 'Jemi söwdalar',
    metricTurnover: 'Umumy dolanyşyk',
    metricSuppliers: 'Hasaba alnan üpjün edijiler',
    metricPending: 'Barlagda garaşýanlar',
    sectionRoles: '2. Rol aýratynlyklary: Admin we Üpjün ediji (Buttons & Themes)',
    adminThemeTitle: 'Admin dizaýn mowzugy (Zümerret reňk)',
    supplierThemeTitle: 'Üpjün ediji dizaýn mowzugy (Gök reňk)',
    sectionInputs: '3. Maglumat girizilýän meýdanlar (Input, Select, CustomSelect)',
    customSelectTitle: 'Portal CustomSelect (konteýnerden daşary çykmaýar, gözlegli)',
    nativeSelectTitle: 'Standart Select',
    sectionBadges: '4. Status belgileri we Duýduryşlar (Badges & Alerts)',
    sectionTabs: '5. Saýlaw panelleri (Tabs)',
    sectionTables: '6. Standartlaşdyrylan tablisalar: 2 sany esasy görnüş',
    tableTypeAdmin: 'Görnüş A: Dolandyryş tablisasy (Üpjün edijiler / Moderasiýa)',
    tableTypeDashboard: 'Görnüş B: Esasy sahypa tablisasy (Tenderler / Lotlar)',
    sectionDropzone: '7. Resminama ýükleýiş zolagy (File Dropzone)',
    sectionModals: '8. Modallar we Tassyklama penjireleri (Modals & Dialogs)',
    sectionSkeletons: '9. Ýükleniş skeletleri (Skeleton Loaders)',
    openModalBtn: 'Standart Modaly açmak',
    openConfirmBtn: 'Pozmak tassyklama penjiresini açmak',
    searchPlaceholder: 'Ady ýa-da kody boýunça gözleg...',
  },
  EN: {
    bannerTag: 'W1ns UI Kit • Medical Platform v2.0',
    bannerTitle: 'W1ns UI Kit & Unified Design System',
    bannerDesc: 'Approved reusable components library. Changing a font, padding, or radius here instantly updates the entire website consistently.',
    roleAdmin: 'Administrator (Emerald)',
    roleSupplier: 'Supplier (Blue)',
    themeMode: 'Color Theme',
    langSelector: 'Display Language',
    sectionMetrics: '1. Analytical Metric Cards (StatCard for Dashboard & Analytics)',
    metricTenders: 'Total Tenders',
    metricTurnover: 'Total Turnover',
    metricSuppliers: 'Registered Suppliers',
    metricPending: 'Pending Review',
    sectionRoles: '2. Role Styles: Administrator vs Supplier (Buttons & Themes)',
    adminThemeTitle: 'Administrator Theme (Emerald Accent)',
    supplierThemeTitle: 'Supplier Theme (Blue Accent)',
    sectionInputs: '3. Input Fields & Dropdowns (Input, Select, CustomSelect)',
    customSelectTitle: 'Portal CustomSelect (overflow-safe, searchable & responsive)',
    nativeSelectTitle: 'Native Select',
    sectionBadges: '4. Status Badges & Alerts (Badges & Alerts)',
    sectionTabs: '5. Tab Switchers (Tabs)',
    sectionTables: '6. Standardized Tables: 2 Main Architectural Patterns',
    tableTypeAdmin: 'Pattern A: Management Table (Suppliers / Moderation)',
    tableTypeDashboard: 'Pattern B: Dashboard Overview Table (Tenders / Lots)',
    sectionDropzone: '7. Document Upload Area (File Dropzone)',
    sectionModals: '8. Modals & Confirmation Dialogs (Modals & Dialogs)',
    sectionSkeletons: '9. Skeleton Loaders',
    openModalBtn: 'Open Standard Modal',
    openConfirmBtn: 'Open Delete Confirmation',
    searchPlaceholder: 'Search by title or code...',
  },
};

export default function UiKitGallery({
  role: initialRole = 'ADMIN',
  isDarkMode = false,
  setIsDarkMode,
  lang: initialLang = 'RU'
}) {
  // Gallery interactive controls
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [isDark, setIsDark] = useState(isDarkMode);
  const [currentLang, setCurrentLang] = useState(initialLang);

  useEffect(() => {
    setIsDark(isDarkMode);
  }, [isDarkMode]);

  const handleToggleDark = () => {
    const nextVal = !isDark;
    setIsDark(nextVal);
    if (setIsDarkMode) {
      setIsDarkMode(nextVal);
    } else {
      document.documentElement.classList.toggle('dark', nextVal);
      localStorage.setItem('tender_theme', nextVal ? 'dark' : 'light');
    }
  };

  const t = TEXTS[currentLang] || TEXTS.RU;
  const isAdmin = currentRole === 'ADMIN';

  // Demo interactive states
  const [btnLoading, setBtnLoading] = useState(false);
  const [inputValue, setInputValue] = useState('Winfinity Tech');
  const [selectedCurrency, setSelectedCurrency] = useState('TMT');
  const [customSelectedCategory, setCustomSelectedCategory] = useState('1');
  const [activeTab, setActiveTab] = useState('pills');
  const [activeSegment, setActiveSegment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [mockFile, setMockFile] = useState(null);
  const [showEmptyTable, setShowEmptyTable] = useState(false);

  // Sample data for Pattern A: Management / Suppliers table
  const sampleSuppliersData = [
    { id: 1, name: 'Dermanhana HJ', country: 'Türkmenistan', category: 'Derman serişdeleri', taxId: '10928374', license: 'MOH-TM-081', status: 'emerald', statusLabel: currentLang === 'RU' ? 'Активен' : 'Işjeň' },
    { id: 2, name: 'MedEnjam Hojalyk Jemgyýeti', country: 'Türkmenistan', category: 'Lukmançylyk enjamlary', taxId: '20194821', license: 'MOH-TM-114', status: 'amber', statusLabel: currentLang === 'RU' ? 'На модерации' : 'Barlagda' },
    { id: 3, name: 'Biolab Diagnostic GmbH', country: 'Germaniýa', category: 'Laboratoriýa reagentleri', taxId: 'DE81928471', license: 'EU-GMP-992', status: 'emerald', statusLabel: currentLang === 'RU' ? 'Активен' : 'Işjeň' },
    { id: 4, name: 'HealthCare Logistics', country: 'Türkiýe', category: 'Sarp ediş serişdeleri', taxId: 'TR99018274', license: 'EXP-TR-004', status: 'rose', statusLabel: currentLang === 'RU' ? 'Неактивен' : 'Işjeň däl' },
  ];

  // Sample data for Pattern B: Dashboard / Tender Lots table
  const sampleLotsData = [
    { id: 'LOT-101', title: 'Parasetamol 500mg (10,000 gutusy)', budget: '45,000 TMT', bidsCount: 4, deadline: '2 günüň içinde', status: 'emerald', statusLabel: currentLang === 'RU' ? 'Прием заявок' : 'Teklip kabul edilýär' },
    { id: 'LOT-102', title: 'Sanly Rentgen enjamy X-Ray Ultra', budget: '620,000 TMT', bidsCount: 2, deadline: '5 günüň içinde', status: 'blue', statusLabel: currentLang === 'RU' ? 'Оценка комиссией' : 'Bahalandyrma' },
    { id: 'LOT-103', title: 'Steril lukmançylyk ellikleri (50,000 jübüt)', budget: '40,000 TMT', bidsCount: 6, deadline: 'Tamamlandy', status: 'slate', statusLabel: currentLang === 'RU' ? 'Завершен' : 'Tamamlanan' },
  ];

  const categoryOptions = [
    { id: '1', name: currentLang === 'RU' ? '💊 Лекарственные средства и препараты' : '💊 Derman serişdeleri we preparatlar' },
    { id: '2', name: currentLang === 'RU' ? '🩺 Медицинское оборудование и аппараты' : '🩺 Lukmançylyk enjamlary we abzallary' },
    { id: '3', name: currentLang === 'RU' ? '🧤 Расходные материалы и перчатки' : '🧤 Sarp ediş serişdeleri we ellikler' },
    { id: '4', name: currentLang === 'RU' ? '🔬 Лабораторные реактивы и тесты' : '🔬 Laboratoriýa reagentleri we testler' },
  ];

  return (
    <div className={`space-y-8 max-w-7xl mx-auto pb-16 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      {/* 0. INTERACTIVE TOOLBAR & CONTROLS HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-3">
              <Sparkles size={14} />
              <span>{t.bannerTag}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
              {t.bannerTitle}
            </h1>
            <p className="text-sm text-blue-100 leading-relaxed">
              {t.bannerDesc}
            </p>
          </div>

          {/* Quick interactive switches */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-blue-100">{t.langSelector}:</span>
              <div className="flex rounded-lg overflow-hidden border border-white/30">
                {['RU', 'TM', 'EN'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setCurrentLang(l)}
                    className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                      currentLang === l ? 'bg-white text-blue-900' : 'text-white hover:bg-white/20'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-blue-100">Роль системы:</span>
              <div className="flex rounded-lg overflow-hidden border border-white/30">
                <button
                  onClick={() => setCurrentRole('ADMIN')}
                  className={`px-3 py-1 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    currentRole === 'ADMIN' ? 'bg-emerald-500 text-white shadow-xs' : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Shield size={12} />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => setCurrentRole('SUPPLIER')}
                  className={`px-3 py-1 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    currentRole === 'SUPPLIER' ? 'bg-blue-500 text-white shadow-xs' : 'text-white hover:bg-white/20'
                  }`}
                >
                  <Building size={12} />
                  <span>Supplier</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-semibold text-blue-100">{t.themeMode}:</span>
              <button
                onClick={handleToggleDark}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isDark ? <Moon size={13} className="text-amber-300" /> : <Sun size={13} className="text-amber-300" />}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. STAT CARDS (METRICS FOR ANALYTICS & DASHBOARD) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionMetrics}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t.metricTenders}
            value="128"
            icon={<FileText size={20} />}
            color={isAdmin ? 'emerald' : 'blue'}
            trend={{ value: '+14.2%', direction: 'up', isPositive: true }}
            subtitle="По сравнению с прошлым месяцем"
          />
          <StatCard
            title={t.metricTurnover}
            value="4,850,200 TMT"
            icon={<DollarSign size={20} />}
            color="emerald"
            trend={{ value: '+8.5%', direction: 'up', isPositive: true }}
            subtitle="Объем медицинских торгов"
          />
          <StatCard
            title={t.metricSuppliers}
            value="342"
            icon={<Building size={20} />}
            color="purple"
            trend={{ value: '+24', direction: 'up', isPositive: true }}
            subtitle="Прошедшие верификацию"
          />
          <StatCard
            title={t.metricPending}
            value="12"
            icon={<Users size={20} />}
            color="amber"
            trend={{ value: '-3', direction: 'down', isPositive: false }}
            subtitle="Ожидают решения модератора"
          />
        </div>
      </section>

      {/* 2. ROLE STYLING: ADMIN VS SUPPLIER */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionRoles}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Admin Card */}
          <Card className="border-t-4 border-t-emerald-600">
            <CardHeader>
              <div>
                <CardTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Shield size={18} />
                  <span>{t.adminThemeTitle}</span>
                </CardTitle>
                <CardDescription>Акцентные кнопки изумрудного цвета, бейджи модерации, подтверждения</CardDescription>
              </div>
              <CardAction>
                <Badge variant="emerald">ADMIN</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="success" leftIcon={<CheckCircle2 size={16} />}>Одобрить заявку</Button>
                <Button variant="danger" leftIcon={<Trash2 size={16} />}>Отклонить</Button>
                <Button variant="outline">Настройки каталога</Button>
                <Button
                  variant="success"
                  size="sm"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1200);
                  }}
                >
                  {btnLoading ? 'Спиннер...' : 'Тест загрузки'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Card */}
          <Card className="border-t-4 border-t-blue-600">
            <CardHeader>
              <div>
                <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Building size={18} />
                  <span>{t.supplierThemeTitle}</span>
                </CardTitle>
                <CardDescription>Акцентные кнопки синего цвета, подача коммерческих предложений</CardDescription>
              </div>
              <CardAction>
                <Badge variant="blue">SUPPLIER</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" leftIcon={<Plus size={16} />}>Подать предложение</Button>
                <Button variant="secondary">Сохранить черновик</Button>
                <Button variant="outline">Мой профиль</Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 1200);
                  }}
                >
                  {btnLoading ? 'Спиннер...' : 'Тест загрузки'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. INPUTS, SELECT & CUSTOMSELECT */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionInputs}
        </h2>
        <Card>
          <CardContent className="space-y-6">
            {/* CustomSelect Showcase */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.customSelectTitle}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                    Категория (с поисковым фильтром, роль {currentRole}):
                  </label>
                  <CustomSelect
                    role={currentRole}
                    isDarkMode={isDark}
                    searchable={true}
                    value={customSelectedCategory}
                    onChange={(val) => setCustomSelectedCategory(val)}
                    options={categoryOptions}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                    Компактный размер (size="sm"):
                  </label>
                  <CustomSelect
                    role={currentRole}
                    isDarkMode={isDark}
                    size="sm"
                    value={selectedCurrency}
                    onChange={(val) => setSelectedCurrency(val)}
                    options={[
                      { id: 'TMT', name: 'TMT — Туркменский манат' },
                      { id: 'USD', name: 'USD — Доллар США' },
                      { id: 'EUR', name: 'EUR — Евро' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Standard inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Input
                label="Наименование компании"
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                clearable
                onClear={() => setInputValue('')}
                hint="Согласно свидетельству о гос. регистрации"
              />

              <Input
                label="Код ОКПО / ИНН (моноширинный)"
                mono
                defaultValue="20485910"
                leftIcon={<Building size={16} />}
                hint="8 цифр, шрифт font-mono"
              />

              <Select
                label="Нативный Select (fallback)"
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                options={[
                  { value: 'TMT', label: 'TMT — Туркменский манат' },
                  { value: 'USD', label: 'USD — Доллар США' },
                  { value: 'EUR', label: 'EUR — Евро' },
                ]}
              />

              <div className="md:col-span-2">
                <SearchInput
                  placeholder={t.searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onSearch={(q) => console.log('Searching:', q)}
                />
              </div>

              <Input
                label="Пример поля с ошибкой валидации"
                defaultValue="invalid_tax_code"
                error="Неверный формат налогового номера"
              />

              <div className="md:col-span-3">
                <Textarea
                  label="Дополнительные условия или спецификация"
                  rows={2}
                  maxLength={300}
                  showCount
                  defaultValue="Все лекарственные средства должны сопровождаться сертификатами GMP и регистрацией Минздрава."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. BADGES & ALERTS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionBadges}
        </h2>
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-3">Статусные бейджи:</h4>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="emerald" pulse>Активный тендер</Badge>
                <Badge variant="emerald" icon={<CheckCircle2 size={12} />}>Одобрен Минздравом</Badge>
                <Badge variant="amber" pulse>На модерации</Badge>
                <Badge variant="amber" dot>Ожидает решения</Badge>
                <Badge variant="rose" dot>Отклонен</Badge>
                <Badge variant="blue">Новое предложение</Badge>
                <Badge variant="purple">Аналитика</Badge>
                <Badge variant="slate">Архив решений</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert
                variant="info"
                title="Информационное уведомление"
                description="Срок подачи предложений истекает через 3 календарных дня."
              />

              <Alert
                variant="success"
                title="Успешное сохранение"
                description="Коммерческое предложение зарегистрировано и зашифровано в системе."
              />

              <Alert
                variant="warning"
                title="Срок действия лицензии"
                description="Лицензия поставщика истекает через 15 дней. Рекомендуется обновить документы."
              />

              <Alert
                variant="danger"
                title="Ошибка валидации"
                description="Сумма предложения превышает максимальный предельный бюджет лота."
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. TABS & SEGMENTED CONTROLS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionTabs}
        </h2>
        <Card>
          <CardContent className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-2">Pills (для фильтрации списков и модерации):</h4>
              <Tabs
                variant="pills"
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { id: 'pills', label: 'Все поставщики', count: 342 },
                  { id: 'pending', label: 'На проверке', count: 12 },
                  { id: 'archive', label: 'Архив решений', count: 85 },
                ]}
              />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 mb-2">Segmented (компактный переключатель):</h4>
              <Tabs
                variant="segmented"
                size="sm"
                activeTab={activeSegment}
                onChange={setActiveSegment}
                tabs={[
                  { id: 'all', label: 'Все направления' },
                  { id: 'pharma', label: 'Фармацевтика' },
                  { id: 'equipment', label: 'Медоборудование' },
                  { id: 'consumables', label: 'Расходные материалы' },
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. TABLES: BOTH ARCHITECTURAL PATTERNS */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionTables}
        </h2>

        {/* Pattern A: Admin Management Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-600" />
              <span>{t.tableTypeAdmin}</span>
            </h3>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setShowEmptyTable(!showEmptyTable)}
            >
              {showEmptyTable ? 'С данными' : 'Пустая таблица (Empty state)'}
            </Button>
          </div>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell sortable>Наименование компании</TableHeaderCell>
                  <TableHeaderCell>Направление</TableHeaderCell>
                  <TableHeaderCell>Страна</TableHeaderCell>
                  <TableHeaderCell>ИНН / STŞK</TableHeaderCell>
                  <TableHeaderCell>Лицензия</TableHeaderCell>
                  <TableHeaderCell align="center">Статус</TableHeaderCell>
                  <TableHeaderCell align="right">Действия</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {showEmptyTable ? (
                  <TableEmptyState
                    colSpan={7}
                    title="Поставщики не найдены"
                    description="По заданным критериям поиска поставщиков в базе не обнаружено."
                    action={
                      <Button size="sm" variant="success" leftIcon={<Plus size={14} />}>
                        Добавить поставщика
                      </Button>
                    }
                  />
                ) : (
                  sampleSuppliersData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</TableCell>
                      <TableCell>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{row.category}</span>
                      </TableCell>
                      <TableCell className="text-slate-500">{row.country}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{row.taxId}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{row.license}</TableCell>
                      <TableCell align="center">
                        <Badge variant={row.status} size="sm">{row.statusLabel}</Badge>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="icon-sm" variant="ghost" title="Просмотр"><Eye size={14} /></Button>
                          <Button size="icon-sm" variant="ghost" title="Редактировать"><Edit2 size={14} /></Button>
                          <Button size="icon-sm" variant="ghost" title="Удалить"><Trash2 size={14} className="text-rose-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination
              currentPage={currentPage}
              totalPages={4}
              totalItems={38}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              showingText={currentLang === 'RU' ? 'Показано' : 'Görkezilýär'}
              ofText={currentLang === 'RU' ? 'из' : 'jemi'}
              itemsText={currentLang === 'RU' ? 'записей' : 'ýazgy'}
            />
          </TableContainer>
        </div>

        {/* Pattern B: Dashboard / Tender Lots Overview Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers size={14} className="text-blue-600" />
            <span>{t.tableTypeDashboard}</span>
          </h3>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Номер лота</TableHeaderCell>
                  <TableHeaderCell>Наименование медицинского товара</TableHeaderCell>
                  <TableHeaderCell align="right">Предельный бюджет</TableHeaderCell>
                  <TableHeaderCell align="center">Заявок</TableHeaderCell>
                  <TableHeaderCell>Срок подачи</TableHeaderCell>
                  <TableHeaderCell align="center">Статус</TableHeaderCell>
                  <TableHeaderCell align="right">Действие</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleLotsData.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-500">{lot.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{lot.title}</TableCell>
                    <TableCell align="right" className="font-mono font-black text-slate-900 dark:text-slate-100">{lot.budget}</TableCell>
                    <TableCell align="center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {lot.bidsCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        <Clock size={13} />
                        <span>{lot.deadline}</span>
                      </div>
                    </TableCell>
                    <TableCell align="center">
                      <Badge variant={lot.status} size="sm">{lot.statusLabel}</Badge>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="xs" variant={isAdmin ? 'success' : 'primary'}>
                        {currentLang === 'RU' ? 'Перейти' : 'Görmek'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </section>

      {/* 7. FILE DROPZONE */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionDropzone}
        </h2>
        <Card>
          <CardContent>
            <FileDropzone
              file={mockFile}
              onFileSelect={(f) => setMockFile(f)}
              onFileRemove={() => setMockFile(null)}
              title={currentLang === 'RU' ? 'Загрузите медицинскую лицензию или сертификат' : 'Lukmançylyk ygtyýarnamasyny ýükläň'}
              subtitle={currentLang === 'RU' ? 'PDF, DOCX или скан-изображение (до 25 МБ)' : 'PDF, DOCX ýa-da skan surat (25MB çenli)'}
            />
          </CardContent>
        </Card>
      </section>

      {/* 8. MODALS & CONFIRM DIALOGS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionModals}
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant={isAdmin ? 'success' : 'primary'} onClick={() => setIsModalOpen(true)}>
                {t.openModalBtn}
              </Button>

              <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
                {t.openConfirmBtn}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 9. SKELETON LOADERS */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          {t.sectionSkeletons}
        </h2>
        <SkeletonTable rows={3} cols={5} />
      </section>

      {/* Interactive Modal Demo */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader onClose={() => setIsModalOpen(false)}>
          <ModalTitle>Новая запись реестра</ModalTitle>
          <ModalDescription>Добавление нового подразделения или сертификата в реестр</ModalDescription>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Input label="Название подразделения" placeholder="Например: Аптечный склад №1" />
          <CustomSelect
            role={currentRole}
            isDarkMode={isDark}
            label="Ответственное лицо"
            options={[
              { id: '1', name: 'Оразов Максат (Директор)' },
              { id: '2', name: 'Аманова Марал (Главный бухгалтер)' },
            ]}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
          <Button variant={isAdmin ? 'success' : 'primary'} onClick={() => setIsModalOpen(false)}>Сохранить</Button>
        </ModalFooter>
      </Modal>

      {/* Interactive Confirm Dialog Demo */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          alert('Действие подтверждено!');
        }}
        title="Удаление позиции"
        message="Вы уверены, что хотите удалить выбранную запись? Это действие необратимо."
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
}
