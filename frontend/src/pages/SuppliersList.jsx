import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { getTranslation } from '../utils/translations';
import { useAlert } from '../context/AlertContext';

// Subcomponents & Modals
import {
  SupplierListHeader,
  SupplierTabsNav,
  SuppliersTable,
  SuppliersPendingTable,
  SuppliersArchiveTab,
  AddSupplierModal,
  EditSupplierModal,
  RejectSupplierModal,
} from '../components/supplier';

export default function SuppliersList({ role = 'ADMIN', isDarkMode = false, lang = 'RU' }) {
  const t = (key, fallback) => getTranslation(lang, key, fallback);
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert, showConfirm } = useAlert();

  // Основные списки данных
  const [suppliers, setSuppliers] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Фильтры основного списка
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Навигация по вкладкам: 'all', 'pending', 'archive'
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'all');

  // Архив модерации
  const [archiveLogs, setArchiveLogs] = useState([]);
  const [archiveStats, setArchiveStats] = useState({
    totalDecisions: 0,
    totalApproved: 0,
    totalRejected: 0,
    pendingCount: 0,
  });
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveFilter, setArchiveFilter] = useState('ALL');

  // Модальные окна
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [supplierToReject, setSupplierToReject] = useState(null);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    fetchSuppliers();
    fetchPendingSuppliers();
    if (role === 'ADMIN') {
      fetchModerationArchive();
    }
    API.get('/catalogs/countries')
      .then((r) => setCountries(r.data.filter((c) => c.isActive)))
      .catch(() => {});
    API.get('/catalogs/categories')
      .then((r) => setCategories(r.data.filter((c) => c.isActive)))
      .catch(() => {});
  }, [role]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/suppliers');
      if (res.data && Array.isArray(res.data)) {
        setSuppliers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSuppliers = async () => {
    if (role !== 'ADMIN') return;
    try {
      const res = await API.get('/suppliers/pending');
      if (res.data && Array.isArray(res.data)) {
        setPendingSuppliers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending suppliers', err);
    }
  };

  const fetchModerationArchive = async () => {
    if (role !== 'ADMIN') return;
    try {
      setArchiveLoading(true);
      const res = await API.get('/suppliers/moderation/archive');
      if (res.data) {
        setArchiveLogs(res.data.logs || []);
        setArchiveStats(
          res.data.stats || {
            totalDecisions: 0,
            totalApproved: 0,
            totalRejected: 0,
            pendingCount: 0,
          }
        );
      }
    } catch (err) {
      console.error('Failed to fetch moderation archive', err);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: t('deleteSupplierTitle', 'Удаление поставщика'),
      message: t('deleteConfirm', 'Вы действительно хотите удалить этого поставщика?'),
      type: 'danger',
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancel', 'Отмена'),
      isDanger: true,
    });
    if (!isConfirmed) return;

    try {
      await API.delete(`/suppliers/${id}`);
      fetchSuppliers();
      showAlert({
        title: t('success', 'Успешно'),
        message: t('supplierDeleted', 'Поставщик успешно удален'),
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to delete supplier', err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: t('errorCreateSupplier', 'Ошибка при удалении'),
        type: 'error',
      });
    }
  };

  const handleApprove = async (supplier) => {
    const confirmText = t(
      'approveConfirmText',
      'Вы уверены, что хотите одобрить верификацию компании «{name}»?'
    ).replace('{name}', supplier.name || '');

    const isConfirmed = await showConfirm({
      title: t('approveVerificationTitle', 'Одобрение верификации'),
      message: confirmText,
      type: 'success',
      confirmText: t('approve', 'Одобрить'),
      cancelText: t('cancel', 'Отмена'),
    });
    if (!isConfirmed) return;

    try {
      await API.post(`/suppliers/${supplier.id}/approve`, {});
      fetchPendingSuppliers();
      fetchSuppliers();
      fetchModerationArchive();
      showAlert({
        title: t('success', 'Успешно'),
        message: t('approvedSuccess', 'Верификация компании успешно одобрена'),
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      showAlert({
        title: t('error', 'Ошибка'),
        message: err?.response?.data?.error || 'Ошибка при одобрении',
        type: 'error',
      });
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!supplierToReject) return;
    try {
      await API.post(`/suppliers/${supplierToReject.id}/reject`, { rejectionReason: reason });
      fetchPendingSuppliers();
      fetchSuppliers();
      fetchModerationArchive();
    } catch (err) {
      console.error('Failed to reject supplier', err);
    } finally {
      setSupplierToReject(null);
    }
  };

  // Фильтрация основного списка поставщиков
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesCategory =
      categoryFilter === 'ALL' ||
      (s.categories && s.categories.some((c) => c.categoryId === categoryFilter));
    if (!matchesCategory) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.taxId || '').toLowerCase().includes(q) ||
      (s.regNumber || s.regNo || '').toLowerCase().includes(q) ||
      (s.country?.name || '').toLowerCase().includes(q) ||
      (s.categories && s.categories.some((c) => (c.category?.name || '').toLowerCase().includes(q)))
    );
  });

  // Фильтрация записей архива
  const filteredArchiveLogs = archiveLogs.filter((log) => {
    const matchesSearch =
      !archiveSearch.trim() ||
      (log.supplier?.name || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (log.supplier?.taxId || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
      (log.admin
        ? `${log.admin.firstName} ${log.admin.lastName} ${log.admin.username}`
        : ''
      )
        .toLowerCase()
        .includes(archiveSearch.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(archiveSearch.toLowerCase());

    const matchesAction = archiveFilter === 'ALL' || log.action === archiveFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* 1. Заголовок страницы и кнопки действий */}
      <SupplierListHeader
        role={role}
        lang={lang}
        onManageCategories={() => navigate('/umumy?catalog=categories')}
        onAddSupplier={() => setShowAddModal(true)}
      />

      {/* 2. Навигационные вкладки для администратора */}
      {role === 'ADMIN' && (
        <SupplierTabsNav
          role={role}
          activeTab={activeTab}
          onChange={setActiveTab}
          pendingCount={pendingSuppliers.length}
          archiveCount={archiveStats.totalDecisions}
          lang={lang}
        />
      )}

      {/* 3. Содержимое вкладок */}
      {activeTab === 'all' && (
        <SuppliersTable
          suppliers={filteredSuppliers}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          onView={(s) => navigate(`/suppliers/${s.id}`)}
          onEdit={(s) => setSupplierToEdit(s)}
          onDelete={handleDelete}
          role={role}
          isDarkMode={isDarkMode}
          lang={lang}
        />
      )}

      {activeTab === 'pending' && (
        <SuppliersPendingTable
          pendingSuppliers={pendingSuppliers}
          onView={(s) => navigate(`/suppliers/${s.id}`)}
          onApprove={handleApprove}
          onReject={(s) => setSupplierToReject(s)}
          lang={lang}
        />
      )}

      {activeTab === 'archive' && (
        <SuppliersArchiveTab
          archiveLogs={filteredArchiveLogs}
          archiveStats={archiveStats}
          archiveSearch={archiveSearch}
          onArchiveSearchChange={setArchiveSearch}
          archiveFilter={archiveFilter}
          onArchiveFilterChange={setArchiveFilter}
          archiveLoading={archiveLoading}
          onViewSupplier={(id) => navigate(`/suppliers/${id}`)}
          lang={lang}
        />
      )}

      {/* 4. Модальные окна */}
      {showAddModal && (
        <AddSupplierModal
          countries={countries}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchSuppliers();
            setShowAddModal(false);
          }}
        />
      )}

      {supplierToEdit && (
        <EditSupplierModal
          countries={countries}
          supplier={supplierToEdit}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setSupplierToEdit(null)}
          onSuccess={() => {
            fetchSuppliers();
            setSupplierToEdit(null);
          }}
        />
      )}

      {supplierToReject && (
        <RejectSupplierModal
          isOpen={Boolean(supplierToReject)}
          supplierName={supplierToReject?.name}
          lang={lang}
          isDarkMode={isDarkMode}
          onClose={() => setSupplierToReject(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}
