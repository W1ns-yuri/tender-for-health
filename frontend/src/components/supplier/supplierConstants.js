import { Building2, FileText, Award, User, FileCheck } from 'lucide-react';

// Регионы Туркменистана (официальные наименования)
export const TURKMEN_REGIONS = [
  { id: 'Aşgabat ş.', key: 'region_asgabat', defaultName: 'Aşgabat ş.' },
  { id: 'Ahal welaýaty', key: 'region_ahal', defaultName: 'Ahal welaýaty' },
  { id: 'Balkan welaýaty', key: 'region_balkan', defaultName: 'Balkan welaýaty' },
  { id: 'Daşoguz welaýaty', key: 'region_dasoguz', defaultName: 'Daşoguz welaýaty' },
  { id: 'Lebap welaýaty', key: 'region_lebap', defaultName: 'Lebap welaýaty' },
  { id: 'Mary welaýaty', key: 'region_mary', defaultName: 'Mary welaýaty' },
];

export const REGIONS = TURKMEN_REGIONS;

// Коммерческие банки Туркменистана (официальные наименования)
export const TURKMEN_BANKS = [
  { id: 'Rysgal', name: 'PTB «Rysgal»', key: 'bank_rysgal', code: '390101744' },
  { id: 'Senagat', name: 'AKB «Senagat»', key: 'bank_senagat', code: '390101742' },
  { id: 'Turkmenbasy', name: 'DTB «Türkmenbaşy»', key: 'bank_turkmenbasy', code: '390101741' },
  { id: 'Halkbank', name: 'DTB «Halkbank»', key: 'bank_halkbank', code: '390101705' },
  { id: 'Dayhanbank', name: 'DTB «Daýhanbank»', key: 'bank_dayhanbank', code: '390101712' },
  { id: 'DasaryYkdysady', name: 'Türkmenistanyň Daşary ykdysady iş banky', key: 'bank_dasary', code: '390101726' },
  { id: 'TurkmenTurk', name: 'Türkmen-Türk paýdarlar täjirçilik banky', key: 'bank_turkmenturk', code: '390101735' },
  { id: 'Prezidentbank', name: '«Prezidentbank»', key: 'bank_prezidentbank', code: '390101701' },
  { id: 'OTHER', name: 'Другой банк / Inisi...', key: 'otherBankOption', code: '', isCustom: true },
];

// Целевые слоты загрузки документов поставщика
export const DOCUMENT_SLOTS = [
  {
    key: 'REG_CERTIFICATE',
    titleKey: 'slotRegCertificateTitle',
    defaultTitle: 'Свидетельство о гос. регистрации (ЕГР)',
    descKey: 'slotRegCertificateDesc',
    defaultDesc: 'Копия свидетельства о государственной регистрации юрлица или ИП',
    required: true,
    icon: Building2
  },
  {
    key: 'CHARTER',
    titleKey: 'slotCharterTitle',
    defaultTitle: 'Устав организации (для юрлиц)',
    descKey: 'slotCharterDesc',
    defaultDesc: 'Устав хозяйственного общества или предприятия с отметками регистрации',
    required: false,
    icon: FileText
  },
  {
    key: 'MINHEALTH_LICENSE',
    titleKey: 'slotLicenseTitle',
    defaultTitle: 'Копия лицензии Минздрава',
    descKey: 'slotLicenseDesc',
    defaultDesc: 'Для поставщиков фармацевтической продукции и медтехники',
    required: false,
    icon: Award,
    isLicenseSlot: true
  },
  {
    key: 'DIRECTOR_APPOINTMENT',
    titleKey: 'slotDirectorAppointmentTitle',
    defaultTitle: 'Документ о полномочиях руководителя',
    descKey: 'slotDirectorAppointmentDesc',
    defaultDesc: 'Приказ о назначении директора или протокол общего собрания',
    required: false,
    icon: User
  },
  {
    key: 'OTHER',
    titleKey: 'slotOtherTitle',
    defaultTitle: 'Дополнительные сертификаты и лицензии',
    descKey: 'slotOtherDesc',
    defaultDesc: 'Сертификаты ISO, GMP, доверенности, патенты',
    required: false,
    icon: FileCheck
  },
];

// Ограничения на загрузку файлов
export const ALLOWED_DOCUMENT_EXTS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
export const MAX_DOCUMENT_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
