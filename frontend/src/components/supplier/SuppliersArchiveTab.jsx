import React from 'react';
import { Archive, CheckCircle2, XCircle, Clock, RefreshCw, Eye, UserCheck } from 'lucide-react';
import {
  StatCard,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableEmptyState,
  Badge,
  Button,
  SearchInput,
  Tabs,
} from '../ui';
import { safeString } from '../../utils/themeUtils';
import { getTranslation } from '../../utils/translations';

export default function SuppliersArchiveTab({
  archiveLogs = [],
  archiveStats = {
    totalDecisions: 0,
    totalApproved: 0,
    totalRejected: 0,
    pendingCount: 0,
  },
  archiveSearch = '',
  onArchiveSearchChange,
  archiveFilter = 'ALL',
  onArchiveFilterChange,
  archiveLoading = false,
  onViewSupplier,
  lang = 'RU',
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const filterTabs = [
    { id: 'ALL', label: t('allBtn', 'Все') },
    { id: 'APPROVED', label: t('approvedKpi', 'Одобрено') },
    { id: 'REJECTED', label: t('rejectedKpi', 'Отклонено') },
    { id: 'RESUBMITTED', label: t('statusResubmittedBadge', 'Повторные') },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Сводные KPI карточки на базе StatCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalDecisionsKpi', 'Всего решений')}
          value={archiveStats.totalDecisions}
          icon={<Archive size={20} />}
          color="purple"
          subtitle="История решений модератора"
        />

        <StatCard
          title={t('approvedKpi', 'Одобрено')}
          value={archiveStats.totalApproved}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
          subtitle="Компании получили статус"
        />

        <StatCard
          title={t('rejectedKpi', 'Отклонено')}
          value={archiveStats.totalRejected}
          icon={<XCircle size={20} />}
          color="rose"
          subtitle="Отправлено на доработку"
        />

        <StatCard
          title={t('pendingQueueKpi', 'В очереди на проверку')}
          value={archiveStats.pendingCount}
          icon={<Clock size={20} />}
          color="amber"
          subtitle="Текущие активные заявки"
        />
      </div>

      {/* 2. Фильтры и таблица архива */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <SearchInput
              placeholder={t('searchArchivePlaceholder', 'Поиск по компании, STŞK или модератору...')}
              value={archiveSearch}
              onChange={(e) => onArchiveSearchChange(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-auto overflow-x-auto">
            <Tabs
              variant="segmented"
              size="sm"
              activeTab={archiveFilter}
              onChange={onArchiveFilterChange}
              tabs={filterTabs}
            />
          </div>
        </div>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('dateDecisionLabel', 'Дата и время')}</TableHeaderCell>
                <TableHeaderCell>{t('supplierName', 'Компания')}</TableHeaderCell>
                <TableHeaderCell align="center">{t('decisionLabel', 'Решение')}</TableHeaderCell>
                <TableHeaderCell>{t('moderatorLabel', 'Модератор')}</TableHeaderCell>
                <TableHeaderCell>{t('remarksLabel', 'Замечания / Причина')}</TableHeaderCell>
                <TableHeaderCell align="right">{t('action', 'Действие')}</TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {archiveLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>{t('loading', 'Ýüklenýär...')}</span>
                    </div>
                  </td>
                </tr>
              ) : archiveLogs.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  icon={<Archive size={28} className="text-slate-400" />}
                  title={t('emptyArchive', 'Архив решений пуст')}
                  description={t('moderationHistoryEmptyNotice', 'История проверок и принятых решений будет накапливаться здесь.')}
                />
              ) : (
                archiveLogs.map((log) => (
                  <TableRow key={log.id}>
                    {/* Дата и время */}
                    <TableCell className="font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(t('localeCode', 'ru-RU'), {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    {/* Компания и STSK */}
                    <TableCell>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {safeString(log.supplier?.name || '-')}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>{log.supplier?.type || ''}</span>
                        {log.supplier?.taxId && <span>• STŞK: {log.supplier.taxId}</span>}
                      </div>
                    </TableCell>

                    {/* Решение / Статус */}
                    <TableCell align="center" className="whitespace-nowrap">
                      {log.action === 'APPROVED' ? (
                        <Badge variant="emerald" icon={<CheckCircle2 size={12} />} size="sm">
                          {t('statusApprovedBadge', 'Одобрено')}
                        </Badge>
                      ) : log.action === 'REJECTED' ? (
                        <Badge variant="rose" icon={<XCircle size={12} />} size="sm">
                          {t('statusRejectedBadge', 'Отклонено')}
                        </Badge>
                      ) : log.action === 'RESUBMITTED' ? (
                        <Badge variant="blue" icon={<RefreshCw size={12} />} size="sm">
                          {t('statusResubmittedBadge', 'Повторная подача')}
                        </Badge>
                      ) : (
                        <Badge variant="amber" icon={<Clock size={12} />} size="sm">
                          {t('statusSubmittedBadge', 'Первичная подача')}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Модератор */}
                    <TableCell className="whitespace-nowrap">
                      {log.admin ? (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium text-xs">
                          <UserCheck size={14} className="text-blue-500 shrink-0" />
                          <span>{log.admin.firstName} {log.admin.lastName || log.admin.username}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">
                          {log.action === 'SUBMITTED' || log.action === 'RESUBMITTED'
                            ? t('supplierStr', 'Поставщик')
                            : t('adminStr', 'Администратор')}
                        </span>
                      )}
                    </TableCell>

                    {/* Замечания / Комментарий */}
                    <TableCell className="max-w-xs">
                      {log.reason ? (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug break-words">
                          {log.reason}
                        </p>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>

                    {/* Действие: переход в профиль */}
                    <TableCell align="right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onViewSupplier(log.supplierId)}
                        title={t('viewProfileTooltip', 'Посмотреть профиль')}
                      >
                        <Eye size={15} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
