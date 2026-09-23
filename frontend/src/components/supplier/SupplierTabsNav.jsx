import React from 'react';
import { Archive, Users, Shield } from 'lucide-react';
import { Tabs } from '../ui';
import { getTranslation } from '../../utils/translations';

export default function SupplierTabsNav({
  activeTab = 'all',
  onChange,
  pendingCount = 0,
  archiveCount = 0,
  lang = 'RU',
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const tabs = [
    {
      id: 'all',
      label: t('allSuppliers', 'Все поставщики'),
      icon: <Users size={15} />,
    },
    {
      id: 'pending',
      label: t('underModerationTab', 'На модерации'),
      count: pendingCount,
      icon: <Shield size={15} />,
    },
    {
      id: 'archive',
      label: t('moderationArchiveTab', 'Архив модерации'),
      count: archiveCount,
      icon: <Archive size={15} />,
    },
  ];

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
      <Tabs
        variant="pills"
        activeTab={activeTab}
        onChange={onChange}
        tabs={tabs}
      />
    </div>
  );
}
