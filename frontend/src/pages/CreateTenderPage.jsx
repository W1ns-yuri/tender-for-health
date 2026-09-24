import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Package, Plus, FileText, Paperclip } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';
import CatalogFormModal from '../components/CatalogFormModal';
import { useAlert } from '../context/AlertContext';

// Subcomponents & Constants
import { sanitizeInputText } from '../components/tender/tenderConstants';
import TenderHeader from '../components/tender/TenderHeader';
import TenderGeneralParamsTab from '../components/tender/TenderGeneralParamsTab';
import TenderLotsTabBar from '../components/tender/TenderLotsTabBar';
import TenderLotDetailsCard from '../components/tender/TenderLotDetailsCard';
import TenderLotDocuments from '../components/tender/TenderLotDocuments';
import TenderLotItemsTable from '../components/tender/TenderLotItemsTable';
import TenderLotStickyFooter from '../components/tender/TenderLotStickyFooter';
import TenderGeneralDocumentsTab from '../components/tender/TenderGeneralDocumentsTab';

export default function CreateTenderPage({ onNavigate: _onNavigate, role, isDarkMode, lang = 'RU', isEdit: _isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const theme = getRoleTheme(role, isDarkMode);
  const t = useCallback((key, fallback, params) => getTranslation(lang, key, fallback, params), [lang]);

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
  const [errorMsg, setErrorMsg] = useState('');
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

  // Если это режим создания с нуля: генерируем номер тендера
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
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: sanitizeInputText(value) }));
  };

  // Шаг 1: Создание черновика тендера и переход к управлению лотами
  const handleCreateBaseTender = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title?.trim()) {
      setErrorMsg(t('titleRequired', 'Пожалуйста, введите название тендера'));
      return;
    }
    if (!formData.deadline) {
      setErrorMsg(t('deadlineRequired', 'Укажите крайний срок подачи заявок (дедлайн)'));
      return;
    }

    try {
      setSavingBase(true);
      setErrorMsg('');

      const payload = {
        tenderNumber: formData.tenderNumber?.trim() || undefined,
        title: sanitizeInputText(formData.title),
        description: sanitizeInputText(formData.description),
        technicalSpecs: sanitizeInputText(formData.technicalSpecs),
        type: formData.type,
        status: 'TASLAMA',
        visibility: formData.visibility,
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

        showAlert({
          title: t('successTitle', 'Успешно'),
          message: t('tenderDraftCreated', 'Черновик тендера создан! Теперь добавьте позиции в лоты.'),
          type: 'success'
        });

        // Переходим на страницу управления лотами созданного тендера
        navigate(`/tenders/${newTender.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error('Error creating base tender draft', err);
      setErrorMsg(err.response?.data?.error || t('errorSaving', 'Ошибка сохранения данных'));
    } finally {
      setSavingBase(false);
    }
  };

  // Сохранение общих данных существующего тендера (PUT /api/tenders/:id)
  const handleUpdateBaseTender = async () => {
    if (!tenderId) return;
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
        categoryId: formData.categoryId || undefined,
        clientId: formData.clientId || undefined,
        procurementType: formData.procurementType || 'GOODS',
        announcementDate: formData.announcementDate ? new Date(formData.announcementDate).toISOString() : undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      });

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('generalDataSaved', 'Общие сведения о тендере успешно обновлены!'),
        type: 'success'
      });
      if (lots.length > 0) {
        setActiveTopTab('lots');
      }
    } catch (err) {
      console.error('Error updating tender info', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка обновления'), type: 'error' });
    } finally {
      setSavingBase(false);
    }
  };

  // Шаг 2: Добавление нового лота (Закладка + легкий запрос на сервер)
  const handleAddNewLotTab = async () => {
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
  };

  // Текущий активный лот
  const activeLot = lots[activeLotIndex] || null;

  // Изменение полей активного лота
  const handleActiveLotChange = (field, value) => {
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
  };

  // Добавление позиции в спецификацию активного лота
  const handleAddSpecRow = () => {
    if (!activeLot) return;
    setActiveLotDirty(true);
    const defaultUnitId = units.length > 0 ? units[0].id : '';
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
  };

  // Изменение позиции в спецификации активного лота
  const handleSpecChange = (specIdx, field, value, extraParam) => {
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
  };

  // Удаление позиции из спецификации активного лота
  const handleRemoveSpec = (specIdx) => {
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
  };

  // АТОМАРНОЕ СОХРАНЕНИЕ ТОЛЬКО АКТИВНОГО ЛОТА (PUT /api/tenders/:id/lots/:lotId)
  const handleSaveActiveLot = async () => {
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
  };

  // Удаление отдельного лота (DELETE /api/tenders/:id/lots/:lotId)
  const handleDeleteActiveLot = async (targetIndex = null) => {
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
  };

  // Прикрепление документа к конкретному активному лоту (POST /api/documents/upload)
  const handleLotFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeLot) return;

    const data = new FormData();
    data.append('file', file);
    data.append('name', file.name);
    data.append('lotId', activeLot.id);
    if (tenderId) data.append('tenderId', tenderId);

    try {
      const res = await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedDoc = res.data;

      // Обновляем список файлов активного лота
      setLots(prev => {
        const nextLots = [...prev];
        const curLot = nextLots[activeLotIndex];
        curLot.files = [...(curLot.files || []), { id: Date.now(), document: uploadedDoc }];
        return nextLots;
      });

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('fileUploaded', `Файл "${file.name}" прикреплен к лоту!`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error uploading lot document', err);
      showAlert({ message: err.response?.data?.error || t('fileUploadError', 'Ошибка загрузки файла'), type: 'error' });
    } finally {
      e.target.value = '';
    }
  };

  // Удаление документа из лота
  const handleLotFileDelete = async (docId) => {
    if (!docId) return;
    try {
      await API.delete(`/documents/${docId}`);
      setLots(prev => {
        const nextLots = [...prev];
        const curLot = nextLots[activeLotIndex];
        curLot.files = (curLot.files || []).filter(f => f.documentId !== docId && f.document?.id !== docId);
        return nextLots;
      });
    } catch (err) {
      console.error('Error deleting lot file', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка удаления файла'), type: 'error' });
    }
  };

  // Прикрепление ОБЩЕГО документа к тендеру (POST /api/documents/upload)
  const handleTenderFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !tenderId) return;

    const data = new FormData();
    data.append('file', file);
    data.append('name', file.name);
    data.append('tenderId', tenderId);

    try {
      const res = await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedDoc = res.data;
      setTenderFiles(prev => [...prev, { id: Date.now(), document: uploadedDoc }]);

      showAlert({
        title: t('successTitle', 'Успешно'),
        message: t('fileUploaded', `Файл "${file.name}" прикреплен к тендеру!`),
        type: 'success'
      });
    } catch (err) {
      console.error('Error uploading tender document', err);
      showAlert({ message: err.response?.data?.error || t('fileUploadError', 'Ошибка загрузки файла'), type: 'error' });
    } finally {
      e.target.value = '';
    }
  };

  // Удаление общего документа из тендера
  const handleTenderFileDelete = async (docId) => {
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
  };

  // ФИНАЛЬНАЯ ПУБЛИКАЦИЯ ТЕНДЕРА (POST /api/tenders/:id/publish)
  const handlePublishTender = async () => {
    if (!tenderId) return;

    if (lots.length === 0) {
      showAlert({ message: t('noLotsYet', 'Добавьте хотя бы один лот для публикации тендера'), type: 'warning' });
      return;
    }

    if (activeLotDirty) {
      showAlert({ message: t('cannotPublishUnsavedChanges', 'Сохраните изменения в текущем лоте перед публикацией тендера'), type: 'warning' });
      return;
    }

    const hasEmptyLots = lots.some(l => !l.specs || l.specs.length === 0 || !l.specs.some(s => (s.haryt || s.name)?.trim()));
    if (hasEmptyLots) {
      showAlert({ message: t('cannotPublishEmptyLots', 'Для публикации добавьте минимум 1 позицию спецификации во все лоты'), type: 'warning' });
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
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка публикации тендера'), type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  // Модалка добавления товара в каталог
  const handleOpenProductModal = (initialName = '', specIdx = null) => {
    setCatalogModal({
      isOpen: true,
      catalogId: 'productsMNN',
      editingItem: initialName ? { name: initialName } : null,
      specIdx
    });
  };

  const handleSaveProductFromModal = async (savedData) => {
    try {
      const res = await API.post('/catalogs/products', {
        name: savedData.name?.trim(),
        tradeName: savedData.tradeName?.trim() || undefined,
        code: savedData.code?.trim() || undefined,
        description: savedData.description?.trim() || undefined,
        categoryId: activeLot?.categoryId || formData.categoryId || undefined
      });
      if (res.data) {
        const created = res.data;
        setProducts(prev => [created, ...prev]);
        if (catalogModal.specIdx !== null) {
          handleSpecChange(catalogModal.specIdx, 'productSelect', created.name, created.id);
        }
        setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, specIdx: null });
      }
    } catch (err) {
      console.error('Failed to create product in catalog', err);
      showAlert({ message: err.response?.data?.error || t('errorSaving', 'Ошибка создания товара'), type: 'error' });
    }
  };

  // Проверка готовности к публикации
  const hasEmptyLots = lots.length === 0 || lots.some(l => !l.specs || l.specs.length === 0 || !l.specs.some(s => (s.haryt || s.name)?.trim()));
  const canPublish = Boolean(tenderId) && lots.length > 0 && !hasEmptyLots && !activeLotDirty;

  let publishDisabledReason = '';
  if (activeLotDirty) {
    publishDisabledReason = t('cannotPublishUnsavedChanges', 'Сохраните изменения в текущем лоте перед публикацией');
  } else if (hasEmptyLots) {
    publishDisabledReason = t('cannotPublishEmptyLots', 'Для публикации добавьте минимум 1 позицию спецификации во все лоты');
  }

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-3 text-slate-500">
        <RefreshCw className="animate-spin text-emerald-600" size={28} />
        <span className="text-sm font-medium">{t('loading', 'Загрузка данных тендера...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 🟢 ШАПКА ТЕНДЕРА: Номер, статус, действия */}
      <TenderHeader
        tenderId={tenderId}
        formData={formData}
        activeTopTab={activeTopTab}
        setActiveTopTab={setActiveTopTab}
        canPublish={canPublish}
        publishing={publishing}
        publishDisabledReason={publishDisabledReason}
        onPublishTender={handlePublishTender}
        errorMsg={errorMsg}
        theme={theme}
        t={t}
      />

      {/* 🟢 ЕДИНЫЙ БРАУЗЕРНЫЙ БЛОК: ВКЛАДКИ + СОДЕРЖИМОЕ (CHROME-STYLE TABS) */}
      <div className="relative">
        {/* Вкладки браузера: прикреплены вплотную к верхнему краю окна без отступа слева */}
        <div className="flex items-end gap-1.5 -mb-[1px] relative z-10 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTopTab('params')}
            className={`px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-t-2 border-x transition-all cursor-pointer select-none ${
              activeTopTab === 'params'
                ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
            }`}
          >
            <FileText size={16} />
            <span>{t('tabGeneralParams', 'Параметры закупки')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (tenderId) setActiveTopTab('lots');
            }}
            disabled={!tenderId}
            className={`px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-t-2 border-x transition-all select-none ${
              !tenderId
                ? 'opacity-40 cursor-not-allowed text-slate-400 border-transparent bg-slate-100/40 dark:bg-slate-800/20'
                : activeTopTab === 'lots'
                ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs cursor-pointer'
                : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent cursor-pointer'
            }`}
          >
            <Package size={16} />
            <span>{t('tabLotsSpecs', 'Лоты и спецификации')}</span>
            <span className={`font-mono text-xs px-2 py-0.5 rounded-full font-black ${
              activeTopTab === 'lots'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {lots.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (tenderId) setActiveTopTab('docs');
            }}
            disabled={!tenderId}
            className={`px-5 py-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border-t-2 border-x transition-all select-none ${
              !tenderId
                ? 'opacity-40 cursor-not-allowed text-slate-400 border-transparent bg-slate-100/40 dark:bg-slate-800/20'
                : activeTopTab === 'docs'
                ? 'bg-white dark:bg-[#111827] border-t-emerald-500 border-x-slate-200 dark:border-x-slate-800 border-b-transparent text-emerald-600 dark:text-emerald-400 shadow-xs cursor-pointer'
                : 'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent cursor-pointer'
            }`}
          >
            <Paperclip size={16} />
            <span>{t('tabGeneralDocs', 'Общие документы')}</span>
            <span className={`font-mono text-xs px-2 py-0.5 rounded-full font-black ${
              activeTopTab === 'docs'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {tenderFiles.length}
            </span>
          </button>
        </div>

        {/* Тело окна: единое целое со вкладками, активная вкладка сливается с карточкой */}
        <div className={`rounded-2xl ${activeTopTab === 'params' ? 'rounded-tl-none' : ''} border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs overflow-hidden`}>
          {/* 🟢 ВКЛАДКА 1: ПАРАМЕТРЫ ЗАКУПКИ */}
          <TenderGeneralParamsTab
            activeTopTab={activeTopTab}
            formData={formData}
            handleFormChange={handleFormChange}
            tenderId={tenderId}
            setFormData={setFormData}
            clients={clients}
            categories={categories}
            role={role}
            isDarkMode={isDarkMode}
            theme={theme}
            lang={lang}
            savingBase={savingBase}
            handleUpdateBaseTender={handleUpdateBaseTender}
            handleCreateBaseTender={handleCreateBaseTender}
            t={t}
          />

          {/* 🟢 ВКЛАДКА 2: ЛОТЫ И СПЕЦИФИКАЦИИ */}
          {activeTopTab === 'lots' && tenderId && (
            <div className="p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className={`text-base font-black ${theme.primaryText}`}>
                    {t('step2Title', 'Управление лотами и спецификацией')}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('lotsAtomicHint', 'Каждый лот сохраняется и обрабатывается независимо в виде отдельной вкладки')}
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  {t('totalLotsCount', 'Всего лотов')}: <span className="text-emerald-600 font-mono text-sm">{lots.length}</span>
                </div>
              </div>

              {/* 📑 БРАУЗЕРНЫЕ ВКЛАДКИ ЛОТОВ (CHROME/EDGE TABS STYLE) */}
              <div className="relative">
                <TenderLotsTabBar
                  lots={lots}
                  activeLotIndex={activeLotIndex}
                  setActiveLotIndex={setActiveLotIndex}
                  activeLotDirty={activeLotDirty}
                  setActiveLotDirty={setActiveLotDirty}
                  handleDeleteActiveLot={handleDeleteActiveLot}
                  handleAddNewLotTab={handleAddNewLotTab}
                  t={t}
                />

                {/* 📄 СОДЕРЖИМОЕ АКТИВНОГО ЛОТА */}
                {activeLot ? (
                  <div className={`p-6 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 ${theme.cardBg}`}>
                    {/* Параметры лота */}
                    <TenderLotDetailsCard
                      activeLot={activeLot}
                      activeLotIndex={activeLotIndex}
                      lots={lots}
                      handleActiveLotChange={handleActiveLotChange}
                      handleDeleteActiveLot={handleDeleteActiveLot}
                      categories={categories}
                      deliveryTerms={deliveryTerms}
                      role={role}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      t={t}
                    />

                    {/* Документы лота */}
                    <TenderLotDocuments
                      activeLot={activeLot}
                      handleLotFileUpload={handleLotFileUpload}
                      handleLotFileDelete={handleLotFileDelete}
                      t={t}
                    />

                    {/* Спецификация позиций */}
                    <TenderLotItemsTable
                      activeLot={activeLot}
                      products={products}
                      units={units}
                      manufacturers={manufacturers}
                      handleAddSpecRow={handleAddSpecRow}
                      handleSpecChange={handleSpecChange}
                      handleRemoveSpec={handleRemoveSpec}
                      handleOpenProductModal={handleOpenProductModal}
                      isDarkMode={isDarkMode}
                      theme={theme}
                      lang={lang}
                      t={t}
                      role={role}
                    />

                    {/* Закрепленный футер лота */}
                    <TenderLotStickyFooter
                      activeLot={activeLot}
                      activeLotIndex={activeLotIndex}
                      activeLotDirty={activeLotDirty}
                      savingActiveLot={savingActiveLot}
                      handleSaveActiveLot={handleSaveActiveLot}
                      t={t}
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 space-y-3">
                    <Package size={36} className="mx-auto text-slate-400 opacity-50" />
                    <p className="text-sm font-medium">
                      {t('noLotsYet', 'У тендера пока нет лотов. Нажмите «+ Добавить лот», чтобы создать первый лот.')}
                    </p>
                    <button
                      type="button"
                      onClick={handleAddNewLotTab}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>{t('addLotTab', '+ Добавить лот')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🟢 ВКЛАДКА 3: ОБЩИЕ ДОКУМЕНТЫ ТЕНДЕРА */}
          {activeTopTab === 'docs' && tenderId && (
            <TenderGeneralDocumentsTab
              tenderId={tenderId}
              tenderFiles={tenderFiles}
              handleTenderFileUpload={handleTenderFileUpload}
              handleTenderFileDelete={handleTenderFileDelete}
              theme={theme}
              t={t}
            />
          )}
        </div>
      </div>

      {/* Модальное окно быстрого добавления товара в каталог */}
      <CatalogFormModal
        isOpen={catalogModal.isOpen}
        onClose={() => setCatalogModal({ isOpen: false, catalogId: 'productsMNN', editingItem: null, specIdx: null })}
        onSave={handleSaveProductFromModal}
        catalogId="productsMNN"
        editingItem={catalogModal.editingItem}
        theme={theme}
        t={t}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
