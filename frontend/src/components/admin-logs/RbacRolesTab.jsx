import React from 'react';
import { ShieldCheck, Truck } from 'lucide-react';

/**
 * RbacRolesTab Component
 * Роли, которые реально есть в системе. Раньше тут были ещё три роли (специалист, комиссия,
 * заказчик), под которые нет ни одного экрана и которых нельзя назначить.
 */
export default function RbacRolesTab({ cardBg, t }) {
  const systemRoles = [
    {
      code: 'ADMIN',
      name: t('systemAdminRole', 'Администратор системы'),
      desc: t(
        'adminRoleDescription',
        'Полный доступ ко всей платформе: модерация, создание и публикация закупок, утверждение протоколов, верификация поставщиков и управление системой'
      ),
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      icon: ShieldCheck
    },
    {
      code: 'SUPPLIER',
      name: t('supplierRoleTitle', 'Поставщик (Участник торгов)'),
      desc: t(
        'supplierRoleDescription',
        'Просмотр открытых и приглашенных закупок, расчет ценовых предложений по лотам, загрузка лицензий, сертификатов и спецификаций'
      ),
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      icon: Truck
    }
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
          {t('catRoles', 'Роли и права (RBAC)')}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('rbacSubtitle', 'Матрица прав доступа, ролевые привилегии и разграничение полномочий')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
        {systemRoles.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.code} className={`p-4 rounded-xl border ${cardBg} space-y-2.5 transition-all shadow-xs`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Icon size={16} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{r.name}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${r.badgeColor}`}>
                  {r.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
