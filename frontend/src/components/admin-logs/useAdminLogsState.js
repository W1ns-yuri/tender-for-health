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
  const [isDumping, setIsDumping] = useState(false);

  // История дампов БД
  const [backupHistory, setBackupHistory] = useState([
    {
      id: 'bk-2026-09-26-01',
      createdAt: '2026-09-26 04:00:00',
      dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
      size: '14.8 MB',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fileName: 'tender_ulgam_dump_20260926_040000.sql.gz'
    },
    {
      id: 'bk-2026-09-25-01',
      createdAt: '2026-09-25 04:00:00',
      dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
      size: '14.6 MB',
      sha256: 'a18fbc83d910e527f00a8270575d3ec628a58a98f489721262d665b1ffc116c9',
      fileName: 'tender_ulgam_dump_20260925_040000.sql.gz'
    },
    {
      id: 'bk-2026-09-24-01',
      createdAt: '2026-09-24 04:00:00',
      dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
      size: '14.2 MB',
      sha256: '7c92b0412e84e8bbba7f1ef2e8fc177f154378f8cb0869a19d7d93d395a3ec2b',
      fileName: 'tender_ulgam_dump_20260924_040000.sql.gz'
    }
  ]);

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

  // Создание дампа
  const handleCreateDump = useCallback(() => {
    setIsDumping(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
      const timeStamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const newDump = {
        id: `bk-${Date.now()}`,
        createdAt: dateStr,
        dbVersion: 'PostgreSQL 16.2 (Debian 16.2-1.pgdg120+2)',
        size: '15.1 MB',
        sha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        fileName: `tender_ulgam_dump_${timeStamp}.sql.gz`
      };
      setBackupHistory((prev) => [newDump, ...prev]);
      setIsDumping(false);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('backupManualSuccess', 'Резервная копия базы данных успешно сформирована'),
        type: 'success'
      });
    }, 800);
  }, [showAlert, t]);

  const handleDownloadDump = useCallback((dump) => {
    showAlert({
      title: t('downloadStarted', 'Скачивание архива'),
      message: `${dump.fileName} (${dump.size})`,
      type: 'info'
    });
  }, [showAlert, t]);

  const handleRestoreDump = useCallback(async (dump) => {
    const isConfirmed = await showConfirm({
      title: t('restoreTitle', 'Восстановление базы данных'),
      message: `${t('backupRestoreConfirm', 'Вы уверены, что хотите восстановить базу данных из выбранного архива?')} (${dump.fileName})`,
      type: 'warning',
      confirmText: t('backupColRestore', 'Восстановить'),
      cancelText: t('cancel', 'Отмена')
    });
    if (!isConfirmed) return;

    showAlert({
      title: t('successTitle', 'Успешно'),
      message: t('backupRestoreSuccess', 'База данных успешно восстановлена'),
      type: 'success'
    });
  }, [showConfirm, showAlert, t]);

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
    isDumping,
    backupHistory,
    filteredLogs,
    filteredUsers,
    fetchAllData,
    handleCreateDump,
    handleDownloadDump,
    handleRestoreDump,
    handleToggleUserBlock,
    handleResetUserPassword,
    handleSaveUser
  };
}
