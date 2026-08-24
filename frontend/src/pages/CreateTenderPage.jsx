import React, { useState, useRef, useEffect } from 'react';
import { Plus, Save, Trash2, Edit2, ArrowLeft, X, Upload } from 'lucide-react';
import API from '../services/api';
import { getRoleTheme, safeString } from '../utils/themeUtils';
import { getTranslation } from '../utils/translations';

export default function CreateTenderPage({ onNavigate, role, isDarkMode, lang = 'RU' }) {
  const theme = getRoleTheme(role, isDarkMode);
  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    clientId: '1',
    type: 'YERLI',
    announcementDate: new Date().toISOString().split('T')[0],
    deadline: '',
    description: '',
    technicalSpecs: '',
    status: 'ACYK',
    visibility: 'ACYK',
    currency: 'TMT'
  });

  const [specs, setSpecs] = useState([]);
  const [docs, setDocs] = useState([]);

  const [showSpecModal, setShowSpecModal] = useState(false);
  const [editSpecIndex, setEditSpecIndex] = useState(null);
  const [newSpec, setNewSpec] = useState({
    haryt: '',
    unit: '',
    type: 'Haryt',
    brand: '',
    mukdar: 1,
    desc: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Загружаем справочники с API
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  useEffect(() => {
    API.get('/catalogs/categories')
      .then(res => { if (Array.isArray(res.data)) setCategories(res.data); }).catch(() => {});
    API.get('/catalogs/units')
      .then(res => { if (Array.isArray(res.data)) setUnits(res.data); }).catch(() => {});
    API.get('/catalogs/manufacturers')
      .then(res => { if (Array.isArray(res.data)) setManufacturers(res.data); }).catch(() => {});
  }, []);

  const handleSaveSpec = () => {
    if (!newSpec.haryt || !newSpec.unit || !newSpec.mukdar) {
      alert(t('fillRequiredFields', 'Заполните обязательные поля (Haryt, Ölçeg birligi, Mukdary)'));
      return;
    }
    const selectedUnit = units.find(u => u.id === newSpec.unit);
    const selectedBrand = manufacturers.find(m => m.id === newSpec.brand);

    const formattedSpec = {
      ...newSpec,
      unitName: selectedUnit ? selectedUnit.shortName : newSpec.unit,
      brandName: selectedBrand ? selectedBrand.name : newSpec.brand
    };

    if (editSpecIndex !== null) {
      const updatedSpecs = [...specs];
      updatedSpecs[editSpecIndex] = { ...formattedSpec, hk: updatedSpecs[editSpecIndex].hk };
      setSpecs(updatedSpecs);
    } else {
      setSpecs([...specs, { ...formattedSpec, hk: (specs.length + 1).toString() }]);
    }
    
    setShowSpecModal(false);
    setEditSpecIndex(null);
    setNewSpec({ haryt: '', unit: '', type: 'Haryt', brand: '', mukdar: 1, desc: '' });
  };

  const handleEditSpec = (index) => {
    setNewSpec(specs[index]);
    setEditSpecIndex(index);
    setShowSpecModal(true);
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    // In a real scenario, you'd optionally send tenderId or documentTypeId if the endpoint requires it.

    try {
      setLoading(true);
      setErrorMsg('');
      const response = await API.post('/documents/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newDoc = {
        id: response.data.id || Date.now().toString(),
        name: response.data.fileName || file.name,
        desc: t('uploadedFile', 'Загруженный файл'),
        type: file.name.split('.').pop().toUpperCase(),
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('ru-RU')
      };

      setDocs([...docs, newDoc]);
    } catch (err) {
      console.error(err);
      alert(t('fileUploadError', 'Ошибка загрузки файла') + ': ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (specs.length === 0) {
      setErrorMsg(t('specRequired', 'Добавьте хотя бы одну спецификацию (Tender spesifikasiýasy)'));
      setLoading(false);
      return;
    }

    if (!formData.announcementDate || !formData.deadline) {
      setErrorMsg(t('fillRequired', 'Заполните обязательные поля (даты)'));
      setLoading(false);
      return;
    }

    try {
      await API.post('/tenders', {
        lotNumber: `Lot № ${Math.floor(Math.random() * 900) + 100}`,
        title: formData.title,
        description: formData.description,
        technicalSpecs: formData.technicalSpecs,
        type: formData.type,
        status: formData.status,
        visibility: formData.visibility,
        // categoryId is omitted because "1" is not a valid UUID in the database
        categoryId: formData.categoryId !== '' ? formData.categoryId : undefined,
        announcementDate: new Date(formData.announcementDate).toISOString(),
        deadline: new Date(formData.deadline).toISOString(),
        specs: specs.map((s, idx) => ({
          positionNumber: idx + 1,
          name: s.haryt,
          quantity: parseFloat(s.mukdar) || 1,
          unitId: s.unit || undefined,
          manufacturerId: s.brand || undefined,
          description: s.desc
        })),
        documents: docs.map(d => d.id) // passing array of document IDs if the backend supports it
      });

      alert(t('tenderCreatedSuccess', 'Тендер успешно создан!'));
      if (onNavigate) onNavigate('tenders');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* 1. Заголовок страницы */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${theme.primaryText}`}>
            {t('createTenderBtn', 'Täze tender döretmek')}
          </h2>
          <p className={`text-xs ${theme.subText} mt-0.5`}>
            {t('createTenderSubtitle', 'Форма публикации нового тендерного лота')}
          </p>
        </div>

        <button
          onClick={() => { if (onNavigate) onNavigate('tenders'); }}
          className={`flex items-center text-xs font-semibold ${theme.subText} hover:text-slate-900 transition-colors`}
        >
          <ArrowLeft size={16} className="mr-1" /> {t('backToList', 'Yza gaýtmak')}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-medium">
          ❌ {errorMsg}
        </div>
      )}

      {/* 2. Форма ввода данных */}
      <form id="create-tender-form" onSubmit={handleSubmit} className={`p-6 rounded-xl border shadow-xs space-y-5 ${theme.cardBg}`}>
        {/* Строка 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('tenderName', 'Tender ady')}*</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('category', 'Kategoriýa')}*</label>
            <div className="flex space-x-1.5">
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
              >
                <option value="">{t('selectCategory', 'Выберите категорию')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('client', 'Sargyt ediji')}*</label>
            <div className="flex space-x-1.5">
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
              >
                <option value="1">{t('clientArkadag', 'Arkadag şäh. hassahanalary')}</option>
                <option value="2">{t('clientMinZdrav', 'Министерство Здравоохранения')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Строка 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('type', 'Görnüşi')}*</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="YERLI">{t('typeLocal', 'Ýerli')}</option>
              <option value="HALKARA">{t('typeGlobal', 'Halkara')}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('announcementDate', 'Yglan edilen senesi')}*</label>
            <input
              type="date"
              required
              value={formData.announcementDate}
              onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('deadline', 'Soňky möhleti')}*</label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            />
          </div>
        </div>

        {/* Строка 3 */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <label>{t('description', 'Tender mazmuny')}*</label>
          </div>
          <textarea
            rows={4}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full p-3 rounded-lg text-xs ${theme.inputBg}`}
          />
        </div>

        {/* Строка 4 */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-semibold">
            <label>{t('techSpecs', 'Tehniki şartler')}*</label>
          </div>
          <textarea
            rows={4}
            required
            value={formData.technicalSpecs}
            onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
            className={`w-full p-3 rounded-lg text-xs ${theme.inputBg}`}
          />
        </div>

        {/* Строка 5 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t('status', 'Status')}*</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="ACYK">{t('statusAcyk', 'Açyk')}</option>
              <option value="TASLAMA">{t('statusTaslama', 'Taslama')}</option>
              <option value="YAPYK">{t('statusYapyk', 'Ýapyk')}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('visibility', 'Açyklygy')}*</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="ACYK">{t('visibilityPublic', 'Açyk')}</option>
              <option value="YAPYK">{t('visibilityPrivate', 'Ýapyk')}</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t('currency', 'Walýuta')}*</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg text-xs ${theme.inputBg}`}
            >
              <option value="TMT">TMT</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </form>

      {/* 3. Спецификации */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-base">{t('tenderSpecs', 'Tender spesifikasiýasy')}</h3>
          <button type="button" onClick={() => setShowSpecModal(true)} className="p-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-teal-600 text-white font-medium">
                <th className="py-3 px-4 w-[5%] text-center">H/K</th>
                <th className="py-3 px-4 w-[25%]">{t('specProduct', 'Haryt')}</th>
                <th className="py-3 px-4 w-[10%] text-center">{t('specUnit', 'Ölçeg birligi')}</th>
                <th className="py-3 px-4 w-[15%] text-center">{t('specBrand', 'Öndüriji')}</th>
                <th className="py-3 px-4 w-[10%] text-center">{t('specQty', 'Mukdar')}</th>
                <th className="py-3 px-4 w-[25%]">{t('specDesc', 'Mazmuny')}</th>
                <th className="py-3 px-4 w-[10%] text-center">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {specs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {t('noSpecs', 'Спецификации пока не добавлены')}
                  </td>
                </tr>
              ) : specs.map((item, idx) => (
                <tr key={idx} className={theme.tableRowHover}>
                  <td className="py-3 px-4 font-semibold text-slate-400 text-center">{item.hk}</td>
                  <td className="py-3 px-4 font-medium">{item.haryt}</td>
                  <td className="py-3 px-4 text-center">{item.unitName}</td>
                  <td className="py-3 px-4 text-center">{item.brandName || '-'}</td>
                  <td className="py-3 px-4 text-center font-bold">{item.mukdar}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.desc}</td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <button type="button" onClick={() => handleEditSpec(idx)} className="p-1 hover:bg-teal-500/10 text-teal-600 rounded">
                      <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={() => setSpecs(specs.filter((_, i) => i !== idx))} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Документы */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${theme.cardBg}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-base">{t('documents', 'Resminamalar')}</h3>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button type="button" onClick={handleFileClick} className="p-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-teal-600 text-white font-medium">
                <th className="py-3 px-4 w-[5%] text-center">#</th>
                <th className="py-3 px-4 w-[25%]">{t('fileName', 'Faýl ady')}</th>
                <th className="py-3 px-4 w-[35%]">{t('fileDesc', 'Mazmuny')}</th>
                <th className="py-3 px-4 text-center w-[10%]">{t('fileType', 'Görnüşi')}</th>
                <th className="py-3 px-4 text-center w-[10%]">{t('fileSize', 'Ölçegi')}</th>
                <th className="py-3 px-4 text-center w-[10%]">{t('uploadDate', 'Ýüklenen senesi')}</th>
                <th className="py-3 px-4 text-center w-[5%]">{t('action', 'Amal')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    {t('noDocs', 'Документы пока не загружены')}
                  </td>
                </tr>
              ) : docs.map((doc, idx) => (
                <tr key={idx} className={theme.tableRowHover}>
                  <td className="py-3 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold truncate max-w-xs">{doc.name}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{doc.desc}</td>
                  <td className="py-3 px-4 text-center font-bold text-teal-600">{doc.type}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{doc.size}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{doc.date}</td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <button type="button" onClick={() => setDocs(docs.filter((_, i) => i !== idx))} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          form="create-tender-form"
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          <Save size={18} />
          <span>{loading ? t('saving', 'Saklanýar...') : t('saveTender', 'Ýatda sakla')}</span>
        </button>
      </div>

      {/* Модальное окно для добавления спецификации */}
      {showSpecModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-xl shadow-2xl border w-full max-w-md p-6 space-y-4 animate-in zoom-in-95`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">{editSpecIndex !== null ? t('editSpec', 'Изменить позицию') : t('addSpec', 'Täze pozisiýa goş')}</h3>
              <button onClick={() => { setShowSpecModal(false); setEditSpecIndex(null); setNewSpec({ haryt: '', unit: '', type: 'Haryt', brand: '', mukdar: 1, desc: '' }); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t('specProduct', 'Haryt')}*</label>
                <input
                  type="text"
                  value={newSpec.haryt}
                  onChange={(e) => setNewSpec({ ...newSpec, haryt: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">{t('specUnit', 'Ölçeg birligi')}*</label>
                  <select
                    value={newSpec.unit}
                    onChange={(e) => setNewSpec({ ...newSpec, unit: e.target.value })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  >
                    <option value="">Выберите ед. изм.</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t('specQty', 'Mukdary')}*</label>
                  <input
                    type="number"
                    min="1"
                    value={newSpec.mukdar}
                    onChange={(e) => setNewSpec({ ...newSpec, mukdar: Number(e.target.value) })}
                    className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('specBrand', 'Öndüriji')}</label>
                <select
                  value={newSpec.brand}
                  onChange={(e) => setNewSpec({ ...newSpec, brand: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                >
                  <option value="">Выберите производителя (опционально)</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t('specDesc', 'Mazmuny')}</label>
                <input
                  type="text"
                  value={newSpec.desc}
                  onChange={(e) => setNewSpec({ ...newSpec, desc: e.target.value })}
                  className={`w-full p-2 border rounded-md ${theme.inputBg}`}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowSpecModal(false); setEditSpecIndex(null); setNewSpec({ haryt: '', unit: '', type: 'Haryt', brand: '', mukdar: 1, desc: '' }); }}
                className="px-5 py-2.5 rounded-lg border text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                {t('cancel', 'Отмена')}
              </button>
              <button
                type="button"
                onClick={handleSaveSpec}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors text-sm"
              >
                {t('save', 'Ýatda sakla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
