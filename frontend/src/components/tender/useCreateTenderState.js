import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../services/api';
import { sanitizeInputText } from './tenderConstants';

/**
 * Кастомный хук оркестрации состояния и логики создания/редактирования тендера.
 * Инкапсулирует загрузку справочников, работу с черновиком, атомарные операции над лотами,
 * загрузку документов и валидацию публикации.
 */
export default function useCreateTenderState({
  id,
  navigate,
  showAlert,
  showConfirm,
  showToast,
  t,
}) {
  const tenderId = id || null;

  // Базовые данные тендера (Шаг 1)
  const [formData, setFormData] = useState({
    tenderNumber: '',
    title: '',
    categoryId: '',
    clientId: '',
    type: 'YERLI',
    procurementType: 'GOODS',
    announcementDate: new Date().toISOString().split('T')[0],
    deadline: '',
    description: '',
    technicalSpecs: '',
    status: 'TASLAMA',
    visibility: 'ACYK',
    invitedSupplierIds: [],
  });

  // Лоты тендера (Шаг 2 - Закладки)
  const [lots, setLots] = useState([]);
  const [activeLotIndex, setActiveLotIndex] = useState(0);

  // Навигационные вкладки верхнего уровня: 'params' | 'lots' | 'docs'
  const [activeTopTab, setActiveTopTab] = useState(tenderId ? 'lots' : 'params');
  const [tenderFiles, setTenderFiles] = useState([]);

  // Состояние загрузки и сохранения
  const [pageLoading, setPageLoading] = useState(Boolean(tenderId));
  const [savingBase, setSavingBase] = useState(false);
  const [savingActiveLot, setSavingActiveLot] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeLotDirty, setActiveLotDirty] = useState(false);

  // Справочники
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [deliveryTerms, setDeliveryTerms] = useState([]);
  const [products, setProducts] = useState([]);

  // Модальное окно быстрого добавления товаров в каталог
  const [catalogModal, setCatalogModal] = useState({
    isOpen: false,
    catalogId: 'productsMNN',
    editingItem: null,
    specIdx: null
  });

  // Загрузка справочников
  useEffect(() => {
    API.get('/catalogs/categories').then(res => { if (Array.isArray(res.data)) setCategories(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/units').then(res => { if (Array.isArray(res.data)) setUnits(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/manufacturers').then(res => { if (Array.isArray(res.data)) setManufacturers(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/delivery-terms').then(res => { if (Array.isArray(res.data)) setDeliveryTerms(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/clients').then(res => { if (Array.isArray(res.data)) setClients(res.data.filter(c => c.isActive)); }).catch(() => {});
    API.get('/catalogs/products').then(res => { if (Array.isArray(res.data)) setProducts(res.data.filter(p => p.isActive)); }).catch(() => {});
  }, []);

  // Если это режим создания с нуля: генерируем следующий порядковый номер тендера
  useEffect(() => {
    if (!tenderId) {
      API.get('/tenders/next-number')
        .then(res => {
          if (res.data?.nextTenderNumber) {
            setFormData(prev => ({ ...prev, tenderNumber: res.data.nextTenderNumber }));
          }
        })
        .catch(e => console.warn('Failed to fetch next tender number', e));
    }
  }, [tenderId]);

  // Загрузка существующего тендера по ID (при открытии /tenders/:id/edit)
  const loadTenderData = useCallback(async (targetId) => {
    try {
      setPageLoading(true);
      const res = await API.get(`/tenders/${targetId}`);
      const tData = res.data;
      if (tData) {
        setFormData({
          tenderNumber: tData.tenderNumber || '',
          title: tData.title || '',
          categoryId: tData.categoryId || '',
          clientId: tData.clientId || '',
          type: tData.type || 'YERLI',
          procurementType: tData.procurementType || 'GOODS',
          announcementDate: tData.announcementDate ? tData.announcementDate.split('T')[0] : new Date().toISOString().split('T')[0],
          deadline: tData.deadline ? tData.deadline.split('T')[0] : '',
          description: tData.description || '',
          technicalSpecs: tData.technicalSpecs || '',
          status: tData.status || 'TASLAMA',
          visibility: tData.visibility || 'ACYK',
          invitedSupplierIds: (tData.invitedSuppliers || []).map(inv => inv.supplierId || inv.supplier?.id).filter(Boolean),
        });

        const loadedLots = (tData.lots || []).map(lot => ({
          id: lot.id,
          lotNumber: lot.lotNumber || 1,
          name: lot.name || `Лот №${lot.lotNumber || 1}`,
          description: lot.description || '',
          lotType: lot.lotType || 'GOODS',
          categoryId: lot.categoryId || '',
          endUser: lot.endUser || '',
          deliveryTermId: lot.deliveryTermId || '',
          deliveryAddress: lot.deliveryAddress || '',
          workAddress: lot.workAddress || '',
          workPeriod: lot.workPeriod || '',
          licenseRequired: Boolean(lot.licenseRequired),
          serviceFormat: lot.serviceFormat || 'ON_SITE',
          slaPeriod: lot.slaPeriod || '',
          files: lot.files || [],
          specs: (lot.specs || []).map((s, sIdx) => ({
            id: s.id,
            hk: String(s.positionNumber || (sIdx + 1)),
            positionNumber: s.positionNumber || (sIdx + 1),
            generalProductId: s.generalProductId || null,
            haryt: s.name || '',
            name: s.name || '',
            unit: s.unitId || '',
            brand: s.manufacturerId || '',
            mukdar: s.quantity || 1,
            desc: s.description || ''
          }))
        }));

        setLots(loadedLots);
        setTenderFiles(tData.files || []);
        if (loadedLots.length > 0) {
          setActiveLotIndex(0);
          setActiveTopTab('lots');
        } else {
          setActiveTopTab('params');
        }
      }
    } catch (err) {
      console.error('Failed to load tender', err);
      showAlert({ message: t('tenderLoadError', 'Ошибка загрузки тендера'), type: 'error' });
    } finally {
      setPageLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    if (tenderId) {
      loadTenderData(tenderId);
    }
  }, [tenderId, loadTenderData]);

  // Хэндлеры изменения полей формы тендера
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: sanitizeInputText(value) }));
  }, []);

  // Шаг 1: Создание черновика тендера и переход к управлению лотами
  const handleCreateBaseTender = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!formData.title?.trim()) {
      showToast({
        title: t('attentionTitle', 'Внимание'),
        message: t('titleRequired', 'Пожалуйста, введите название тендера'),
        type: 'warning',
      });
      return;
    }
    if (!formData.deadline) {
      showToast({
        title: t('attentionTitle', 'Внимание'),
        message: t('deadlineRequired', 'Укажите крайний срок подачи заявок (дедлайн)'),
        type: 'warning',
      });
      return;
    }

    // Проверка соответствия сроков дедлайна и даты объявления
    if (formData.deadline && formData.announcementDate) {
      const ann = new Date(formData.announcementDate);
      const ddl = new Date(formData.deadline);
      if (ddl <= ann) {
        showToast({
          title: t('validationError', 'Ошибка валидации'),
          message: t('deadlineBeforeAnnouncementError', 'Крайний срок подачи заявок (дедлайн) должен быть позже даты объявления тендера'),
          type: 'error',
        });
        return;
      }
    }

    // Валидация закрытого тендера: необходимо минимум 2 приглашенных поставщика для конкурентности
    if (formData.visibility === 'YAPYK' && (!formData.invitedSupplierIds || formData.invitedSupplierIds.length < 2)) {
      showToast({
        title: t('validationError', 'Ошибка валидации'),
        message: t('minTwoInvitedSuppliersError', 'Для закрытого тендера необходимо пригласить минимум 2 поставщиков для обеспечения конкурентности'),
        type: 'warning',
      });
      return;
    }

    try {
      setSavingBase(true);

      const payload = {
        tenderNumber: formData.tenderNumber?.trim() || undefined,
        title: sanitizeInputText(formData.title),
        description: sanitizeInputText(formData.description),
        technicalSpecs: sanitizeInputText(formData.technicalSpecs),
        type: formData.type,
        status: 'TASLAMA',
        visibility: formData.visibility,
        invitedSupplierIds: formData.visibility === 'YAPYK' ? (formData.invitedSupplierIds || []) : [],
        categoryId: formData.categoryId || undefined,
        clientId: formData.clientId || undefined,
        procurementType: formData.procurementType || 'GOODS',
        announcementDate: new Date(formData.announcementDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        lots: []
      };

      const res = await API.post('/tenders', payload);
      const newTender = res.data;

      if (newTender?.id) {
        // Создаем начальный первый лот для удобства
        await API.post(`/tenders/${newTender.id}/lots`, {
          lotNumber: 1,
          name: 'Лот №1',
          lotType: formData.procurementType === 'SERVICES_WORKS' ? 'WORKS' : 'GOODS'
        });

        showToast({
          title: t('successTitle', 'Успешно'),
          message: t('tenderDraftCreated', 'Черновик тендера создан! Теперь добавьте позиции в лоты.'),
          type: 'success'
        });

        // Переходим на страницу управления лотами созданного тендера
        navigate(`/tenders/${newTender.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error('Error creating base tender draft', err);
      const backendError = err.response?.data?.error || t('errorSaving', 'Ошибка сохранения данных');
      showToast({
        title: t('errorTitle', 'Ошибка'),
        message: backendError,
        type: 'error'
      });
    } finally {
      setSavingBase(false);
    }
  }, [formData, navigate, showToast, t]);

  // Сохранение общих данных существующего тендера (PUT /api/tenders/:id)
  const handleUpdateBaseTender = useCallback(async () => {
    if (!tenderId) return;

    // Проверка соответствия сроков дедлайна и даты объявления
    if (formData.deadline && formData.announcementDate) {
      const ann = new Date(formData.announcementDate);
      const ddl = new Date(formData.deadline);
      if (ddl <= ann) {
        showToast({
          title: t('validationError', 'Ошибка валидации'),
          message: t('deadlineBeforeAnnouncementError', 'Крайний срок подачи заявок (дедлайн) должен быть позже даты объявления тендера'),
          type: 'error',
        });
        return;
      }
    }

    // Валидация закрытого тендера: необходимо минимум 2 приглашенных поставщика для конкурентности
    if (formData.visibility === 'YAPYK' && (!formData.invitedSupplierIds || formData.invitedSupplierIds.length < 2)) {
      showToast({
        title: t('validationError', 'Ошибка валидации'),
        message: t('minTwoInvitedSuppliersError', 'Для закрытого тендера необходимо пригласить минимум 2 поставщиков для обеспечения конкурентности'),
        type: 'warning',
      });
      return;
    }

    try {
      setSavingBase(true);
      await API.put(`/tenders/${tenderId}`, {
        tenderNumber: formData.tenderNumber?.trim() || undefined,
        title: sanitizeInputText(formData.title),
        description: sanitizeInputText(formData.description),
        technicalSpecs: sanitizeInputText(formData.technicalSpecs),
        type: formData.type,
        status: formData.status,
        visibility: formData.visibility,
        invitedSupplierIds: formData.visibility === 'YAPYK' ? (formData.invitedSupplierIds || []) : [],
        categoryId: formData.categoryId || undefined,
        clientId: formData.clientId || undefined,
        procurementType: formData.procurementType || 'GOODS',
        announcementDate: formData.announcementDate ? new Date(formData.announcementDate).toISOString() : undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      });

      showToast({
        title: t('successTitle', 'Успешно'),
        message: t('generalDataSaved', 'Общие сведения о тендере успешно обновлены!'),
        type: 'success'
      });
      if (lots.length > 0) {
        setActiveTopTab('lots');
      }
    } catch (err) {
      console.error('Error updating tender info', err);
      showToast({
        title: t('errorTitle', 'Ошибка'),
        message: err.response?.data?.error || t('errorSaving', 'Ошибка обновления'),
        type: 'error'
      });
    } finally {
      setSavingBase(false);
    }
  }, [tenderId, formData, lots.length, showToast, t]);

  // Шаг 2: Добавление нового лота (Закладка + легкий запрос на сервер)
  const handleAddNewLotTab = useCallback(async () => {
    if (!tenderId) return;
    const nextLotNumber = (lots.reduce((max, l) => Math.max(max, l.lotNumber || 0), 0)) + 1;
    const initialLotType = formData.procurementType === 'SERVICES_WORKS' ? 'WORKS' : 'GOODS';

    try {
      const res = await API.post(`/tenders/${tenderId}/lots`, {
        lotNumber: nextLotNumber,
        name: `Лот №${nextLotNumber}`,
        lotType: initialLotType,
        categoryId: formData.categoryId || undefined
      });

      const createdLot = res.data;
      const formattedLot = {
        id: createdLot.id,
        lotNumber: createdLot.lotNumber || nextLotNumber,
        name: createdLot.name || `Лот №${nextLotNumber}`,
        description: createdLot.description || '',
        lotType: createdLot.lotType || initialLotType,
        categoryId: createdLot.categoryId || '',
        endUser: createdLot.endUser || '',
        deliveryTermId: createdLot.deliveryTermId || '',
        deliveryAddress: createdLot.deliveryAddress || '',
        workAddress: createdLot.workAddress || '',
        workPeriod: createdLot.workPeriod || '',
        licenseRequired: Boolean(createdLot.licenseRequired),
        serviceFormat: createdLot.serviceFormat || 'ON_SITE',
        slaPeriod: createdLot.slaPeriod || '',
        files: createdLot.files || [],
        specs: []
      };

      setLots(prev => [...prev, formattedLot]);
      setActiveLotIndex(lots.length);
      setActiveLotDirty(false);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('lotCreatedSuccess', `Лот №${nextLotNumber} создан и добавлен в закладки`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error creating new lot', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка добавления лота'), type: 'error' });
    }
  }, [tenderId, lots, formData.procurementType, formData.categoryId, showAlert, t]);

  // Текущий активный лот
  const activeLot = lots[activeLotIndex] || null;

  // Изменение полей активного лота
  const handleActiveLotChange = useCallback((field, value) => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    setLots(prev => {
      const nextLots = [...prev];
      nextLots[activeLotIndex] = {
        ...nextLots[activeLotIndex],
        [field]: sanitizeInputText(value)
      };
      return nextLots;
    });
  }, [activeLot, activeLotIndex]);

  // Добавление позиции в спецификацию активного лота
  const handleAddSpecRow = useCallback(() => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    let defaultUnitId = '';
    if (activeLot.lotType === 'SERVICES') {
      const srvUnit = units.find(u => (u.shortName || '').toLowerCase().includes('усл') || (u.name || '').toLowerCase().includes('услуг'));
      defaultUnitId = srvUnit ? srvUnit.id : (units[0]?.id || '');
    } else if (activeLot.lotType === 'WORKS') {
      const wrkUnit = units.find(u => (u.shortName || '').toLowerCase().includes('этап') || (u.shortName || '').toLowerCase().includes('компл') || (u.shortName || '').toLowerCase().includes('шт'));
      defaultUnitId = wrkUnit ? wrkUnit.id : (units[0]?.id || '');
    } else {
      const goodsUnit = units.find(u => (u.shortName || '').toLowerCase().includes('уп') || (u.shortName || '').toLowerCase().includes('шт'));
      defaultUnitId = goodsUnit ? goodsUnit.id : (units[0]?.id || '');
    }
    setLots(prev => {
      const nextLots = [...prev];
      const nextSpecs = [...(nextLots[activeLotIndex].specs || [])];
      nextSpecs.push({
        id: Date.now() + Math.random(),
        hk: String(nextSpecs.length + 1),
        positionNumber: nextSpecs.length + 1,
        generalProductId: null,
        haryt: '',
        name: '',
        unit: defaultUnitId,
        brand: '',
        mukdar: 1,
        desc: ''
      });
      nextLots[activeLotIndex] = { ...nextLots[activeLotIndex], specs: nextSpecs };
      return nextLots;
    });
  }, [activeLot, activeLotIndex, units]);

  // Изменение позиции в спецификации активного лота
  const handleSpecChange = useCallback((specIdx, field, value, extraParam) => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    setLots(prev => {
      const nextLots = [...prev];
      const nextSpecs = [...(nextLots[activeLotIndex].specs || [])];

      if (field === 'productSelect') {
        nextSpecs[specIdx] = {
          ...nextSpecs[specIdx],
          haryt: value,
          name: value,
          generalProductId: extraParam || null
        };
      } else {
        nextSpecs[specIdx] = {
          ...nextSpecs[specIdx],
          [field]: sanitizeInputText(value)
        };
      }

      nextLots[activeLotIndex] = { ...nextLots[activeLotIndex], specs: nextSpecs };
      return nextLots;
    });
  }, [activeLot, activeLotIndex]);

  // Удаление позиции из спецификации активного лота
  const handleRemoveSpec = useCallback((specIdx) => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    setLots(prev => {
      const nextLots = [...prev];
      let nextSpecs = [...(nextLots[activeLotIndex].specs || [])];
      nextSpecs = nextSpecs.filter((_, i) => i !== specIdx);
      nextSpecs.forEach((s, idx) => {
        s.hk = String(idx + 1);
        s.positionNumber = idx + 1;
      });
      nextLots[activeLotIndex] = { ...nextLots[activeLotIndex], specs: nextSpecs };
      return nextLots;
    });
  }, [activeLot, activeLotIndex]);

  // АТОМАРНОЕ СОХРАНЕНИЕ ТОЛЬКО АКТИВНОГО ЛОТА (PUT /api/tenders/:id/lots/:lotId)
  const handleSaveActiveLot = useCallback(async () => {
    if (!tenderId || !activeLot) return;

    try {
      setSavingActiveLot(true);
      const validSpecs = (activeLot.specs || [])
        .filter(s => (s.haryt || s.name) && (s.haryt || s.name).trim() !== '')
        .map((s, idx) => ({
          positionNumber: idx + 1,
          generalProductId: s.generalProductId || undefined,
          name: sanitizeInputText(s.haryt || s.name).trim(),
          quantity: parseFloat(s.mukdar) || 1,
          unitId: s.unit || undefined,
          manufacturerId: s.brand || undefined,
          description: s.desc ? sanitizeInputText(s.desc).trim() : undefined
        }));

      const payload = {
        lotNumber: parseInt(activeLot.lotNumber, 10) || (activeLotIndex + 1),
        name: sanitizeInputText(activeLot.name) || `Лот №${activeLotIndex + 1}`,
        description: activeLot.description ? sanitizeInputText(activeLot.description) : undefined,
        lotType: activeLot.lotType || 'GOODS',
        categoryId: activeLot.categoryId || undefined,
        endUser: activeLot.endUser ? sanitizeInputText(activeLot.endUser).trim() : undefined,
        deliveryTermId: activeLot.lotType === 'GOODS' ? (activeLot.deliveryTermId || undefined) : undefined,
        deliveryAddress: activeLot.deliveryAddress ? sanitizeInputText(activeLot.deliveryAddress).trim() : undefined,
        workAddress: activeLot.workAddress ? sanitizeInputText(activeLot.workAddress).trim() : undefined,
        workPeriod: activeLot.workPeriod ? sanitizeInputText(activeLot.workPeriod).trim() : undefined,
        licenseRequired: Boolean(activeLot.licenseRequired),
        serviceFormat: activeLot.serviceFormat || undefined,
        slaPeriod: activeLot.slaPeriod ? sanitizeInputText(activeLot.slaPeriod).trim() : undefined,
        specs: validSpecs
      };

      const res = await API.put(`/tenders/${tenderId}/lots/${activeLot.id}`, payload);
      const updatedLot = res.data;

      // Обновляем локальное состояние
      setLots(prev => {
        const nextLots = [...prev];
        nextLots[activeLotIndex] = {
          ...nextLots[activeLotIndex],
          ...updatedLot,
          specs: (updatedLot.specs || []).map((s, sIdx) => ({
            id: s.id,
            hk: String(s.positionNumber || (sIdx + 1)),
            positionNumber: s.positionNumber || (sIdx + 1),
            generalProductId: s.generalProductId || null,
            haryt: s.name || '',
            name: s.name || '',
            unit: s.unitId || '',
            brand: s.manufacturerId || '',
            mukdar: s.quantity || 1,
            desc: s.description || ''
          }))
        };
        return nextLots;
      });

      setActiveLotDirty(false);
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('lotSavedSuccess', `Данные лота "${activeLot.name}" сохранены!`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error saving active lot', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка сохранения лота'), type: 'error' });
    } finally {
      setSavingActiveLot(false);
    }
  }, [tenderId, activeLot, activeLotIndex, showAlert, t]);

  // Удаление отдельного лота (DELETE /api/tenders/:id/lots/:lotId)
  const handleDeleteActiveLot = useCallback(async (targetIndex = null) => {
    const idxToDelete = targetIndex !== null ? targetIndex : activeLotIndex;
    const lotToDelete = lots[idxToDelete];
    if (!tenderId || !lotToDelete) return;

    const confirmed = await showConfirm({
      title: t('deleteLotBtn', 'Удалить лот'),
      message: t('confirmDeleteLot', `Вы уверены, что хотите удалить лот "${lotToDelete.name}"? Это действие необратимо.`),
      type: 'danger',
      isDanger: true,
      confirmText: t('delete', 'Удалить'),
      cancelText: t('cancel', 'Отмена')
    });

    if (!confirmed) return;

    try {
      await API.delete(`/tenders/${tenderId}/lots/${lotToDelete.id}`);
      const remainingLots = lots.filter((_, idx) => idx !== idxToDelete);
      setLots(remainingLots);
      setActiveLotIndex(Math.max(0, Math.min(activeLotIndex, remainingLots.length - 1)));
      setActiveLotDirty(false);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('lotDeleted', 'Лот успешно удален'),
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting lot', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка удаления лота'), type: 'error' });
    }
  }, [activeLotIndex, lots, showConfirm, showAlert, t, tenderId]);

  // Прикрепление документа к конкретному активному лоту
  const handleLotFileUpload = useCallback(async (e) => {
    if (!activeLot) return;
    
    let rawFiles = [];
    if (e?.target?.files) {
      rawFiles = Array.from(e.target.files);
    } else if (e?.dataTransfer?.files) {
      rawFiles = Array.from(e.dataTransfer.files);
    } else if (Array.isArray(e)) {
      rawFiles = e;
    } else if (e instanceof File) {
      rawFiles = [e];
    }

    if (rawFiles.length === 0) return;

    try {
      const uploadedDocs = [];
      for (const file of rawFiles) {
        const data = new FormData();
        data.append('file', file);
        data.append('name', file.name);
        data.append('lotId', activeLot.id);

        const res = await API.post('/documents/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data) uploadedDocs.push(res.data);
      }

      // Обновляем список файлов активного лота с гарантией отсутствия дубликатов
      setLots(prev => {
        const nextLots = [...prev];
        const curLot = { ...nextLots[activeLotIndex] };
        const existingDocIds = new Set((curLot.files || []).map(f => f.documentId || f.document?.id || f.id));
        const newFileItems = uploadedDocs
          .filter(doc => !existingDocIds.has(doc.id))
          .map(doc => ({ id: doc.id, documentId: doc.id, document: doc }));
        curLot.files = [...(curLot.files || []), ...newFileItems];
        nextLots[activeLotIndex] = curLot;
        return nextLots;
      });

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: uploadedDocs.length === 1 
          ? t('fileUploaded', `Файл "${rawFiles[0].name}" прикреплен к лоту!`)
          : t('filesUploadedCount', `Прикреплено файлов к лоту: ${uploadedDocs.length}`, { count: uploadedDocs.length }),
        type: 'success'
      });
    } catch (err) {
      console.error('Error uploading lot documents', err);
      showAlert({ message: err.response?.data?.error || t('fileUploadError', 'Ошибка загрузки файлов'), type: 'error' });
    } finally {
      if (e?.target) e.target.value = '';
    }
  }, [activeLot, activeLotIndex, showAlert, t]);

  // Удаление документа из лота
  const handleLotFileDelete = useCallback(async (docId) => {
    if (!docId) return;
    try {
      await API.delete(`/documents/${docId}`);
      setLots(prev => {
        const nextLots = [...prev];
        const curLot = { ...nextLots[activeLotIndex] };
        curLot.files = (curLot.files || []).filter(f => f.documentId !== docId && f.document?.id !== docId && f.id !== docId);
        nextLots[activeLotIndex] = curLot;
        return nextLots;
      });
    } catch (err) {
      console.error('Error deleting lot file', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка удаления файла'), type: 'error' });
    }
  }, [activeLotIndex, showAlert, t]);

  // Прикрепление ОБЩЕГО документа к тендеру (POST /api/documents/upload)
  const handleTenderFileUpload = useCallback(async (e, meta = {}) => {
    if (!tenderId) return;

    let rawFiles = [];
    if (e?.target?.files) {
      rawFiles = Array.from(e.target.files);
    } else if (e?.dataTransfer?.files) {
      rawFiles = Array.from(e.dataTransfer.files);
    } else if (Array.isArray(e)) {
      rawFiles = e;
    } else if (e instanceof File) {
      rawFiles = [e];
    }

    if (rawFiles.length === 0) return;

    try {
      const uploadedDocs = [];
      for (const file of rawFiles) {
        const data = new FormData();
        data.append('file', file);
        data.append('name', file.name);
        data.append('tenderId', tenderId);
        if (meta && Object.keys(meta).length > 0) {
          data.append('description', JSON.stringify(meta));
        }

        const res = await API.post('/documents/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data) uploadedDocs.push(res.data);
      }

      setTenderFiles(prev => {
        const existingDocIds = new Set((prev || []).map(f => f.documentId || f.document?.id || f.id));
        const newItems = uploadedDocs
          .filter(doc => !existingDocIds.has(doc.id))
          .map(doc => ({ id: doc.id, documentId: doc.id, document: doc }));
        return [...(prev || []), ...newItems];
      });

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: uploadedDocs.length === 1
          ? t('fileUploaded', `Файл "${rawFiles[0].name}" прикреплен к тендеру!`)
          : t('filesUploadedCount', `Прикреплено файлов к тендеру: ${uploadedDocs.length}`, { count: uploadedDocs.length }),
        type: 'success'
      });
    } catch (err) {
      console.error('Error uploading tender document', err);
      showAlert({ message: err.response?.data?.error || t('fileUploadError', 'Ошибка загрузки файла'), type: 'error' });
    } finally {
      if (e?.target) e.target.value = '';
    }
  }, [showAlert, t, tenderId]);

  // Удаление общего документа из тендера
  const handleTenderFileDelete = useCallback(async (docId) => {
    if (!docId) return;
    try {
      await API.delete(`/documents/${docId}`);
      setTenderFiles(prev => prev.filter(f => f.documentId !== docId && f.document?.id !== docId));
      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('fileDeleted', 'Файл успешно удален'),
        type: 'success'
      });
    } catch (err) {
      console.error('Error deleting tender file', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка удаления файла'), type: 'error' });
    }
  }, [showAlert, t]);

  // ФИНАЛЬНАЯ ПУБЛИКАЦИЯ ТЕНДЕРА (POST /api/tenders/:id/publish)
  const handlePublishTender = useCallback(async () => {
    if (!tenderId) return;

    if (lots.length === 0) {
      showToast({ title: t('attentionTitle', 'Внимание'), message: t('noLotsYet', 'Добавьте хотя бы один лот для публикации тендера'), type: 'warning' });
      return;
    }

    if (activeLotDirty) {
      showToast({ title: t('attentionTitle', 'Внимание'), message: t('cannotPublishUnsavedChanges', 'Сохраните изменения в текущем лоте перед публикацией тендера'), type: 'warning' });
      return;
    }

    const hasEmpty = lots.some(l => !l.specs || l.specs.length === 0 || !l.specs.some(s => (s.haryt || s.name)?.trim()));
    if (hasEmpty) {
      showToast({ title: t('attentionTitle', 'Внимание'), message: t('cannotPublishEmptyLots', 'Для публикации добавьте минимум 1 позицию спецификации во все лоты'), type: 'warning' });
      return;
    }

    const hasDocs = (tenderFiles && tenderFiles.length > 0) || lots.some(l => l.files && l.files.length > 0);
    if (!hasDocs) {
      showToast({ title: t('attentionTitle', 'Внимание'), message: t('mustAttachDocToPublish', 'Прикрепите хотя бы один документ для публикации тендера'), type: 'warning' });
      return;
    }

    const confirmed = await showConfirm({
      title: t('publishTenderBtn', 'Опубликовать тендер'),
      message: t('publishConfirm', 'Вы уверены, что хотите опубликовать тендер? Он станет открытым и поставщики смогут подавать предложения.'),
      type: 'info',
      confirmText: t('publishTenderBtn', 'Опубликовать'),
      cancelText: t('cancel', 'Отмена')
    });

    if (!confirmed) return;

    try {
      setPublishing(true);
      await API.post(`/tenders/${tenderId}/publish`);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('tenderPublishedSuccess', 'Тендер успешно опубликован! Поставщики могут подавать заявки.'),
        type: 'success'
      });

      navigate(`/tenders/${tenderId}`);
    } catch (err) {
      console.error('Error publishing tender', err);
      showToast({ title: t('errorTitle', 'Ошибка'), message: err.response?.data?.error || t('errorSaving', 'Ошибка публикации тендера'), type: 'error' });
    } finally {
      setPublishing(false);
    }
  }, [activeLotDirty, lots, navigate, showAlert, showConfirm, showToast, t, tenderFiles, tenderId]);

  // Модалка добавления позиции (товара, работы или услуги) в каталог
  const handleOpenProductModal = useCallback((initialName = '', specIdx = null) => {
    const lotType = activeLot?.lotType || 'GOODS';
    const catalogId = lotType === 'WORKS' ? 'works' : lotType === 'SERVICES' ? 'services' : 'productsMNN';
    setCatalogModal({
      isOpen: true,
      catalogId,
      editingItem: initialName ? { name: initialName } : null,
      specIdx
    });
  }, [activeLot?.lotType]);

  const handleSaveProductFromModal = useCallback(async (savedData) => {
    try {
      const lotType = activeLot?.lotType || 'GOODS';
      const itemType = savedData.itemType || lotType;
      const res = await API.post('/catalogs/products', {
        name: savedData.name?.trim(),
        tradeName: savedData.tradeName?.trim() || undefined,
        code: savedData.code?.trim() || undefined,
        description: savedData.description?.trim() || undefined,
        categoryId: savedData.categoryId || activeLot?.categoryId || formData.categoryId || undefined,
        itemType,
        type: itemType === 'GOODS' ? 'HARYT' : 'HYZMAT'
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);
        if (catalogModal.specIdx !== null) {
          const displayName = created.tradeName ? `${created.name} (${created.tradeName})` : created.name;
          handleSpecChange(catalogModal.specIdx, 'productSelect', displayName, created.id);
        }
        setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, specIdx: null });
      }
    } catch (err) {
      console.error('Failed to create product in catalog', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка создания позиции'), type: 'error' });
    }
  }, [activeLot?.categoryId, activeLot?.lotType, catalogModal.specIdx, formData.categoryId, handleSpecChange, showAlert, t]);

  // Проверка готовности к публикации и прогресса шагов
  const isStep1Done = Boolean(tenderId);
  const hasEmptyLots = lots.length === 0 || lots.some(l => !l.specs || l.specs.length === 0 || !l.specs.some(s => (s.haryt || s.name)?.trim()));
  const hasValidLots = isStep1Done && lots.length > 0 && !hasEmptyLots && !activeLotDirty;
  const hasGeneralDocuments = Boolean(tenderFiles && tenderFiles.length > 0);
  const hasDocuments = hasGeneralDocuments || lots.some(l => l.files && l.files.length > 0);

  // Динамический прогресс: 0% / 33% / 66% / 100%
  const progressPercent = useMemo(() => {
    if (!isStep1Done) return 0;
    if (!hasValidLots) return 33;
    if (!hasGeneralDocuments) return 66;
    return 100;
  }, [isStep1Done, hasValidLots, hasGeneralDocuments]);

  const canAccessLots = isStep1Done;
  const canAccessDocs = isStep1Done && lots.length > 0 && !hasEmptyLots;

  const handleNavigateTab = useCallback((targetTab) => {
    if (targetTab === 'params') {
      setActiveTopTab('params');
      return;
    }
    if (targetTab === 'lots') {
      if (!canAccessLots) {
        showToast({
          title: t('stepLocked', 'Шаг заблокирован'),
          message: t('fillBaseParamsFirst', 'Заполните параметры закупки и сохраните черновик для перехода к лотам'),
          type: 'warning'
        });
        return;
      }
      setActiveTopTab('lots');
      return;
    }
    if (targetTab === 'docs') {
      if (!canAccessLots) {
        showToast({
          title: t('stepLocked', 'Шаг заблокирован'),
          message: t('fillBaseParamsFirst', 'Заполните параметры закупки и сохраните черновик для перехода к документам'),
          type: 'warning'
        });
        return;
      }
      if (!canAccessDocs) {
        showToast({
          title: t('stepLocked', 'Шаг заблокирован'),
          message: t('addLotBeforeDocs', 'Добавьте хотя бы один лот с заполненной спецификацией для перехода к документам'),
          type: 'warning'
        });
        return;
      }
      setActiveTopTab('docs');
      return;
    }
  }, [canAccessLots, canAccessDocs, showToast, t]);

  const canPublish = isStep1Done && hasValidLots && hasGeneralDocuments;

  const publishDisabledReason = useMemo(() => {
    if (!isStep1Done) return t('fillBaseParamsFirst', 'Заполните параметры закупки и сохраните черновик');
    if (activeLotDirty) return t('cannotPublishUnsavedChanges', 'Сохраните изменения в текущем лоте перед публикацией');
    if (hasEmptyLots) return t('cannotPublishEmptyLots', 'Для публикации добавьте минимум 1 позицию спецификации во все лоты');
    if (!hasGeneralDocuments) return t('mustAttachGeneralDocToPublish', 'Прикрепите общие документы тендера (проект договора или регламент) во вкладке 3');
    return '';
  }, [isStep1Done, activeLotDirty, hasEmptyLots, hasGeneralDocuments, t]);

  return {
    tenderId,
    formData,
    setFormData,
    handleFormChange,
    lots,
    setLots,
    activeLotIndex,
    setActiveLotIndex,
    activeLot,
    activeLotDirty,
    setActiveLotDirty,
    activeTopTab,
    setActiveTopTab,
    handleNavigateTab,
    tenderFiles,
    pageLoading,
    savingBase,
    savingActiveLot,
    publishing,
    categories,
    clients,
    units,
    manufacturers,
    deliveryTerms,
    products,
    catalogModal,
    setCatalogModal,
    handleCreateBaseTender,
    handleUpdateBaseTender,
    handleAddNewLotTab,
    handleActiveLotChange,
    handleAddSpecRow,
    handleSpecChange,
    handleRemoveSpec,
    handleSaveActiveLot,
    handleDeleteActiveLot,
    handleLotFileUpload,
    handleLotFileDelete,
    handleTenderFileUpload,
    handleTenderFileDelete,
    handlePublishTender,
    handleOpenProductModal,
    handleSaveProductFromModal,
    isStep1Done,
    hasEmptyLots,
    hasValidLots,
    hasDocuments,
    progressPercent,
    canAccessLots,
    canAccessDocs,
    canPublish,
    publishDisabledReason,
  };
}
