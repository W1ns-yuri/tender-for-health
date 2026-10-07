import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';

/**
 * Получение безопасной ссылки для скачивания документа без жестко захардкоженного localhost
 */
export function getFileDownloadUrl(doc) {
  if (!doc) return '';
  if (doc.filePath && doc.filePath.startsWith('http')) {
    return doc.filePath;
  }
  const cleanPath = (doc.filePath || `uploads/${doc.fileName || doc.name || ''}`).replace(/\\/g, '/');
  const normalized = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  const withUploads = normalized.startsWith('uploads/') ? normalized : `uploads/${normalized}`;
  return `/${withUploads}`;
}

export function useTenderDetailsState({ tenderId, role, t }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const activeTenderId = tenderId || paramId;

  const [tender, setTender] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [activeLotTab, setActiveLotTab] = useState(0);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загрузка данных тендера и профиля поставщика
  useEffect(() => {
    if (!activeTenderId) return;

    setLoading(true);
    setFetchError(null);

    API.get(`/tenders/${activeTenderId}`)
      .then((res) => {
        if (res.data) setTender(res.data);
      })
      .catch((e) => {
        const msg =
          e.response?.data?.error ||
          t('tenderFetchError', 'Ошибка загрузки данных тендера');
        setFetchError(msg);
      })
      .finally(() => {
        setLoading(false);
      });

    if (role === 'SUPPLIER') {
      API.get('/suppliers/profile')
        .then((res) => {
          if (res.data) setSupplierProfile(res.data);
        })
        .catch(() => {
          try {
            const u = JSON.parse(localStorage.getItem('tender_user'));
            if (u?.suppliers?.[0]) setSupplierProfile(u.suppliers[0]);
          } catch {}
        });
    }
  }, [activeTenderId, role, t]);

  const data = tender || {};

  // Проверка верификации поставщика
  const isSupplierVerified = useMemo(() => {
    return role !== 'SUPPLIER' || supplierProfile?.verificationStatus === 'VERIFIED';
  }, [role, supplierProfile]);

  // Список прикрепленных документов
  const docsList = useMemo(() => {
    if (Array.isArray(data?.files)) {
      return data.files.map((f) => f.document).filter(Boolean);
    }
    if (Array.isArray(data?.documents)) {
      return data.documents;
    }
    return [];
  }, [data]);

  // Проверка подачи КП текущим поставщиком
  const hasSubmittedOffer = useMemo(() => {
    return Boolean(data?.offers?.length > 0);
  }, [data?.offers]);

  // Текущий активный лот
  const currentLot = useMemo(() => {
    if (!data?.lots || data.lots.length === 0) return null;
    return data.lots[activeLotTab] || data.lots[0];
  }, [data?.lots, activeLotTab]);

  // Победитель текущего лота (если итоги подведены)
  const winningOffer = useMemo(() => {
    if (data.status !== 'YENIJI_YGLAN_EDILDI' || !data.offers || !currentLot?.specs) {
      return null;
    }
    const lotSpecIds = currentLot.specs.map((s) => s.id);
    return data.offers.find((offer) =>
      offer.specs?.some((os) => lotSpecIds.includes(os.tenderSpecId) && os.isAwarded)
    );
  }, [data.status, data.offers, currentLot]);

  // Определение текущего этапа жизненного цикла тендера (1-5)
  const lifecycleStep = useMemo(() => {
    const status = String(data?.status || '').toUpperCase();
    if (status === 'TASLAMA') return 1;
    if (status === 'ACYK' || status === 'OPEN') return 2;
    if (status === 'YAPYK' || status === 'CLOSED' || status === 'BAHALANDYRYLDY' || status === 'EVALUATION') return 3;
    if (status === 'YENIJI_YGLAN_EDILDI' || status === 'YENIJI') return 4;
    if (status === 'CONTRACT' || status === 'COMPLETED') return 5;
    return 2;
  }, [data?.status]);

  const formatDate = useCallback((dateVal) => {
    if (!dateVal) return '-';
    try {
      return new Date(dateVal).toLocaleDateString('ru-RU');
    } catch {
      return dateVal;
    }
  }, []);

  const getClientName = useCallback((tItem) => {
    return tItem?.client?.name || tItem?.clientId || '-';
  }, []);

  const getCategoryName = useCallback((tItem) => {
    return tItem?.category?.name || tItem?.categoryId || '-';
  }, []);

  const handleDownload = useCallback((doc) => {
    if (!doc) return;
    const url = getFileDownloadUrl(doc);
    if (url) {
      window.open(url, '_blank');
    }
  }, []);

  return {
    tender,
    data,
    loading,
    fetchError,
    activeLotTab,
    setActiveLotTab,
    supplierProfile,
    isSupplierVerified,
    hasSubmittedOffer,
    docsList,
    currentLot,
    winningOffer,
    lifecycleStep,
    formatDate,
    getClientName,
    getCategoryName,
    handleDownload,
    navigate,
  };
}
