import React from 'react';
import { Shield, XCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SupplierAdminPanel({
  supplier,
  isAdmin,
  isModerating,
  onOpenRejectModal,
  onApprove,
  t = (k, f) => f
}) {
  const navigate = useNavigate();

  if (!isAdmin || !supplier) return null;

  return supplier.verificationStatus !== 'VERIFIED' ? (
    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="text-blue-600" size={16} />
            {t('adminReviewDossier', 'Анкета поставщика')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('adminReviewDossierSubtitle', 'Проверка данных и прикрепленных документов компании')}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenRejectModal}
            disabled={isModerating}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <XCircle size={16} />
            <span>{t('rejectSupplier', 'Отклонить заявку')}</span>
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={isModerating}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 size={16} />
            <span>{t('approveSupplier', 'Одобрить верификацию')}</span>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              {t('verifiedDossierStatus', '🟢 Профиль поставщика верифицирован')}
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              {t('fullAuthorizationNotice', 'Компания имеет полный доступ к участию в электронных торгах.')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/suppliers', { state: { activeTab: 'pending' } })}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{t('backToModerationList', 'Вернуться к заявкам')}</span>
        </button>
      </div>
    </div>
  );
}
