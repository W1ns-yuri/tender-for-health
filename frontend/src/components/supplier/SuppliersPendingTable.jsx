import React from 'react';
import { Eye, CheckCircle2, XCircle, Shield } from 'lucide-react';
import {
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
} from '../ui';
import { safeString } from '../../utils/themeUtils';
import { getTranslation } from '../../utils/translations';
import { parseSupplierChanges } from './supplierUtils';

export default function SuppliersPendingTable({
  pendingSuppliers = [],
  onView,
  onApprove,
  onReject,
  lang = 'RU',
}) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t('companyColumnTitle', 'Компания')}</TableHeaderCell>
            <TableHeaderCell>{t('typeTaxIdColumn', 'Тип / ИНН')}</TableHeaderCell>
            <TableHeaderCell>{t('contacts', 'Контакты')}</TableHeaderCell>
            <TableHeaderCell>{t('bankColumnTitle', 'Банк')}</TableHeaderCell>
            <TableHeaderCell align="center">{t('status', 'Статус')}</TableHeaderCell>
            <TableHeaderCell align="right">{t('action', 'Действие')}</TableHeaderCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {pendingSuppliers.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              icon={<Shield size={28} className="text-emerald-500" />}
              title={t('noModerationApplications', 'Нет заявок на модерацию')}
              description={t('allCompaniesReviewedNotice', 'Все компании проверены и имеют актуальный статус.')}
            />
          ) : (
            pendingSuppliers.map((s, idx) => {
              const parsedNotes = parseSupplierChanges(s.notes);
              const hasChanges = Boolean(parsedNotes && parsedNotes.changes && parsedNotes.changes.length > 0);

              return (
              <TableRow key={s.id || idx}>
                {/* 1. Название компании и категории */}
                <TableCell>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {safeString(s.name)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {s.categories && s.categories.length > 0 ? (
                      s.categories.map((sc, scIdx) => (
                        <span
                          key={sc.categoryId || scIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          {sc.category?.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {t('noCategoriesAssigned', 'Направления не указаны')}
                      </span>
                    )}
                  </div>
                  {hasChanges ? (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {t('moderationFieldChangedBadge', 'Изменено')}:
                      </span>
                      {parsedNotes.changes.map((c, cIdx) => (
                        <span
                          key={c.field || cIdx}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        >
                          {t(c.key, c.label)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    s.verificationStatus === 'PENDING_REVIEW' && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                          {t('initialSubmissionNotice', 'Первичная анкета')}
                        </span>
                      </div>
                    )
                  )}
                </TableCell>

                {/* 2. Тип / ИНН */}
                <TableCell>
                  <span className="inline-block font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[11px]">
                    {s.type || 'ÝAŞ / HJ'}
                  </span>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {safeString(s.taxId)}
                  </p>
                </TableCell>

                {/* 3. Контакты */}
                <TableCell>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {safeString(s.phone || s.user?.phone || '-')}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    {safeString(s.email || '-')}
                  </p>
                </TableCell>

                {/* 4. Банк */}
                <TableCell>
                  <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                    {safeString(s.bankName || '-')}
                  </p>
                  <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {safeString(s.bankAccount || '-')}
                  </p>
                </TableCell>

                {/* 5. Статус */}
                <TableCell align="center">
                  <Badge variant="amber" pulse size="sm">
                    {s.verificationStatus === 'PENDING_REVIEW'
                      ? t('statusInReviewBadge', 'На проверке')
                      : t('statusPendingBadge', 'Требует проверки')}
                  </Badge>
                </TableCell>

                {/* 6. Действия */}
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onView(s)}
                      title={t('viewProfileTooltip', 'Посмотреть профиль')}
                    >
                      <Eye size={15} />
                    </Button>

                    <Button
                      size="icon-sm"
                      variant="success"
                      onClick={() => onApprove(s)}
                      title={t('approveTooltip', 'Одобрить верификацию')}
                    >
                      <CheckCircle2 size={15} />
                    </Button>

                    <Button
                      size="icon-sm"
                      variant="danger"
                      onClick={() => onReject(s)}
                      title={t('rejectTooltip', 'Отклонить заявку')}
                    >
                      <XCircle size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
