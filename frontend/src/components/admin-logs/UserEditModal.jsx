import React, { useState, useEffect } from 'react';
import { UserCheck, X, Shield, Lock, Phone, Briefcase } from 'lucide-react';

/**
 * UserEditModal Component
 * Interactive modal for creating staff members or editing existing user attributes and roles.
 */
export default function UserEditModal({
  user,
  isOpen,
  onClose,
  onSave,
  cardBg,
  theme,
  t
}) {
  const isEditing = Boolean(user?.id);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: '',
    roleType: 'PURCHASING_SPECIALIST',
    position: '',
    phone: ''
  });

  useEffect(() => {
    if (user && user.id) {
      setFormData({
        id: user.id,
        username: user.username || '',
        password: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        roleType: user.roleType || 'SUPPLIER',
        position: user.position || '',
        phone: user.phone || ''
      });
    } else {
      setFormData({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        middleName: '',
        roleType: 'PURCHASING_SPECIALIST',
        position: '',
        phone: ''
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      return;
    }
    if (!isEditing && !formData.password.trim()) {
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border ${cardBg} p-6 space-y-4 animate-in zoom-in-95`}>
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-600" />
            <span>{isEditing ? 'Редактирование пользователя' : 'Создание сотрудника'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Логин (Username) *
              </label>
              <input
                type="text"
                disabled={isEditing}
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Пароль *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Имя *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Фамилия *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Системная роль (RBAC) *
              </label>
              <select
                value={formData.roleType}
                onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold"
              >
                <option value="ADMIN">ADMIN (Администратор)</option>
                <option value="PURCHASING_SPECIALIST">PURCHASING_SPECIALIST (Специалист по закупкам)</option>
                <option value="COMMISSION_MEMBER">COMMISSION_MEMBER (Член комиссии)</option>
                <option value="CLIENT">CLIENT (Заказчик / Госпиталь)</option>
                <option value="SUPPLIER">SUPPLIER (Поставщик)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Должность
              </label>
              <input
                type="text"
                placeholder="Напр. Ведущий эксперт ТК"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Телефон
            </label>
            <input
              type="text"
              placeholder="+993 12 00-00-00"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              {isEditing ? 'Сохранить изменения' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
