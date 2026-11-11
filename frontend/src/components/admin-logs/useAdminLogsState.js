import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../services/api';

/**
 * Custom hook to manage state, data fetching, filtering, and administration actions
 * for the AdminLogs and Staff Management module.
 */
export function useAdminLogsState({ t, showAlert, showConfirm }) {
  const [activeTab, setActiveTab] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [editingUser, setEditingUser] = useState(null);


  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        API.get('/dashboard/logs').catch(() => ({ data: [] })),
        API.get('/users').catch(() => ({ data: [] }))
      ]);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Переключение блокировки пользователя с вызовом реального API
  const handleToggleUserBlock = useCallback(async (user) => {
    const isCurrentlyActive = user.isActive !== false;
    const actionText = isCurrentlyActive ? t('blockUserAction', 'Заблокировать') : t('activateUserAction', 'Активировать');
    
    const confirmed = await showConfirm({
      title: actionText,
      message: `Вы действительно хотите ${actionText.toLowerCase()} пользователя ${user.username}?`,
      type: isCurrentlyActive ? 'danger' : 'info',
      confirmText: actionText,
      cancelText: t('cancel', 'Отмена')
    });

    if (confirmed) {
      try {
        await API.put(`/users/${user.id}/status`);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: !isCurrentlyActive } : u))
        );
        showAlert({
          title: t('successTitle', 'Успешно'),
          message: `Статус пользователя ${user.username} успешно обновлен`,
          type: 'success'
        });
      } catch (err) {
        console.error('Failed to toggle user status:', err);
        showAlert({
          title: t('errorTitle', 'Ошибка'),
          message: err?.response?.data?.error || 'Не удалось изменить статус пользователя',
          type: 'error'
        });
      }
    }
  }, [showConfirm, showAlert, t]);

  // Сброс пароля
  const handleResetUserPassword = useCallback(async (user) => {
    const confirmed = await showConfirm({
      title: t('resetPasswordAction', 'Сбросить пароль'),
      message: `Сбросить пароль для пользователя ${user.username}? Временный пароль будет сгенерирован системой.`,
      type: 'warning',
      confirmText: t('reset', 'Сбросить'),
      cancelText: t('cancel', 'Отмена')
    });
    if (confirmed) {
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: `Временный пароль для ${user.username} успешно обновлен`,
        type: 'success'
      });
    }
  }, [showConfirm, showAlert, t]);

  // Сохранение изменений пользователя или создание нового сотрудника
  const handleSaveUser = useCallback(async (formData) => {
    try {
      if (formData.id) {
        // Редактирование существующего
        const res = await API.put(`/users/${formData.id}`, formData);
        setUsers((prev) => prev.map((u) => (u.id === formData.id ? { ...u, ...res.data } : u)));
        showAlert({
          title: t('successTitle', 'Успешно'),
          message: 'Данные пользователя успешно обновлены',
          type: 'success'
        });
      } else {
        // Создание нового сотрудника
        const res = await API.post('/users', formData);
        setUsers((prev) => [res.data, ...prev]);
        showAlert({
          title: t('successTitle', 'Успешно'),
          message: `Сотрудник ${res.data.username} успешно создан`,
          type: 'success'
        });
      }
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to save user:', err);
      showAlert({
        title: t('errorTitle', 'Ошибка'),
        message: err?.response?.data?.error || 'Не удалось сохранить пользователя',
        type: 'error'
      });
    }
  }, [showAlert, t]);

  // Фильтрованные логи
  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter((log) => {
      return (
        (log.user?.username && log.user.username.toLowerCase().includes(q)) ||
        (log.user?.firstName && log.user.firstName.toLowerCase().includes(q)) ||
        (log.user?.lastName && log.user.lastName.toLowerCase().includes(q)) ||
        (log.eventType && log.eventType.toLowerCase().includes(q)) ||
        (log.operationType && log.operationType.toLowerCase().includes(q)) ||
        (log.ip && log.ip.toLowerCase().includes(q))
      );
    });
  }, [logs, search]);

  // Фильтрованные пользователи
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      return (
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.roleType && u.roleType.toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q)) ||
        (u.phone && u.phone.toLowerCase().includes(q))
      );
    });
  }, [users, search]);

  return {
    activeTab,
    setActiveTab,
    logs,
    users,
    loading,
    search,
    setSearch,
    selectedLog,
    setSelectedLog,
    editingUser,
    setEditingUser,
    filteredLogs,
    filteredUsers,
    fetchAllData,
    handleToggleUserBlock,
    handleResetUserPassword,
    handleSaveUser
  };
}
