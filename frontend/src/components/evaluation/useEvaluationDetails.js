import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import API from '../../services/api';

/**
 * Кастомный хук управления состоянием рабочего стола оценки предложений.
 * Инкапсулирует загрузку деталей закупки, выбор и снятие победителей по лотам,
 * раскрытие спецификаций предложений, расчёт прогресса утверждения и завершение процедуры.
 */
export default function useEvaluationDetails({
  id,
  showAlert,
  showConfirm,
  t,
}) {
  const [tenderDetails, setTenderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedOffers, setExpandedOffers] = useState({});

  const tRef = useRef(t);
  tRef.current = t;
  const showAlertRef = useRef(showAlert);
  showAlertRef.current = showAlert;
  const showConfirmRef = useRef(showConfirm);
  showConfirmRef.current = showConfirm;

  const fetchTenderDetails = useCallback(async (tenderId) => {
    if (!tenderId) return;
    setLoading(true);
    try {
      const res = await API.get(`/evaluation/tenders/${tenderId}/details`);
      setTenderDetails(res.data);
    } catch (e) {
      console.error('Failed to fetch tender details', e);
      showAlertRef.current?.({
        title: tRef.current('errorTitle', 'Ошибка'),
        message: tRef.current('failedToLoadEvaluationTender', 'Не удалось загрузить данные тендера для оценки'),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchTenderDetails(id);
    }
  }, [id, fetchTenderDetails]);

  const toggleOfferDetails = useCallback((offerId) => {
    setExpandedOffers(prev => ({ ...prev, [offerId]: !prev[offerId] }));
  }, []);

  const handleAwardLot = useCallback(async (lotId, offerId, isCurrentlyAwarded = false) => {
    if (isCurrentlyAwarded) {
      const isConfirmed = await showConfirmRef.current?.({
        title: tRef.current('deselectWinnerAction', 'Снять выбор победителя'),
        message: tRef.current('confirmDeselectWinnerMessage', 'Вы уверены, что хотите снять выбор победителя по данному лоту?'),
        type: 'warning',
        confirmText: tRef.current('deselectChoice', 'Снять выбор'),
        cancelText: tRef.current('cancelEditBtn', 'Отмена'),
      });
      if (!isConfirmed) return;

      try {
        await API.post('/evaluation/award-lot', { tenderId: id, lotId, offerId: null });
        fetchTenderDetails(id);
        showAlertRef.current?.({
          title: tRef.current('successTitle', 'Успешно'),
          message: tRef.current('winnerDeselectedSuccess', 'Выбор победителя по лоту снят'),
          type: 'info'
        });
      } catch (e) {
        console.error('Failed to unaward lot', e);
        showAlertRef.current?.({
          title: tRef.current('errorTitle', 'Ошибка'),
          message: tRef.current('profileSaveError', 'Ошибка при снятии выбора'),
          type: 'error'
        });
      }
      return;
    }

    const isConfirmed = await showConfirmRef.current?.({
      title: tRef.current('winnerSelectionTitle', 'Выбор победителя'),
      message: tRef.current('confirmAssignWinnerMessage', 'Вы уверены, что хотите назначить этого поставщика победителем для данного Лота?'),
      type: 'success',
      confirmText: tRef.current('selectActionBtn', 'Выбрать'),
      cancelText: tRef.current('cancelEditBtn', 'Отмена'),
    });
    if (!isConfirmed) return;

    try {
      await API.post('/evaluation/award-lot', { tenderId: id, lotId, offerId });
      fetchTenderDetails(id);
      showAlertRef.current?.({
        title: tRef.current('successTitle', 'Успешно'),
        message: tRef.current('winnerAssignedSuccess', 'Победитель по лоту успешно назначен'),
        type: 'success'
      });
    } catch (e) {
      console.error('Failed to award lot', e);
      showAlertRef.current?.({
        title: tRef.current('errorTitle', 'Ошибка'),
        message: tRef.current('profileSaveError', 'Ошибка при выборе победителя'),
        type: 'error'
      });
    }
  }, [id, fetchTenderDetails]);

  // Расчет прогресса утверждения лотов
  const lotsList = useMemo(() => tenderDetails?.lots || [], [tenderDetails?.lots]);

  const lotsWithOffers = useMemo(() => {
    const offers = tenderDetails?.offers || [];
    return lotsList.filter(lot => {
      const lotSpecIds = (lot.specs || []).map(s => s.id);
      return offers.some(offer =>
        (offer.specs || []).some(os => lotSpecIds.includes(os.tenderSpecId))
      );
    });
  }, [lotsList, tenderDetails?.offers]);

  const awardedLots = useMemo(() => {
    const offers = tenderDetails?.offers || [];
    return lotsList.filter(lot => {
      const lotSpecIds = (lot.specs || []).map(s => s.id);
      return offers.some(offer =>
        (offer.specs || []).some(os => lotSpecIds.includes(os.tenderSpecId) && os.isAwarded)
      );
    });
  }, [lotsList, tenderDetails?.offers]);

  const allLotsAwarded = useMemo(() => {
    return lotsWithOffers.length > 0 && awardedLots.length >= lotsWithOffers.length;
  }, [lotsWithOffers.length, awardedLots.length]);

  // Статус процедуры: если статус YENIJI_YGLAN_EDILDI, но распределены не все лоты, отображаем как оценку
  const effectiveStatus = useMemo(() => {
    if (tenderDetails?.status === 'YENIJI_YGLAN_EDILDI' && !allLotsAwarded) {
      return 'BAHALANDYRYLDY';
    }
    return tenderDetails?.status || 'BAHALANDYRYLDY';
  }, [tenderDetails?.status, allLotsAwarded]);

  const handleCompleteEvaluation = useCallback(async () => {
    if (awardedLots.length === 0) {
      showAlertRef.current?.({
        title: tRef.current('winnerNotSelectedAlert', 'Внимание: победитель не выбран'),
        message: tRef.current('noWinnerSelectedErrorMessage', 'Нельзя утвердить протокол: не выбран победитель ни по одному лоту тендера. Пожалуйста, назначьте хотя бы одного победителя.'),
        type: 'warning'
      });
      return;
    }

    if (!allLotsAwarded) {
      const isProceed = await showConfirmRef.current?.({
        title: tRef.current('notAllLotsAwardedAlert', 'Внимание: не все лоты распределены'),
        message: tRef.current('notAllLotsAwardedConfirmMessage', `Победители выбраны только для ${awardedLots.length} из ${lotsWithOffers.length} лотов. Вы уверены, что хотите завершить оценку сейчас?`, { awardedCount: awardedLots.length, totalCount: lotsWithOffers.length }),
        type: 'warning',
        confirmText: tRef.current('finishAnywayBtn', 'Завершить в любом случае'),
        cancelText: tRef.current('backToSelectionBtn', 'Вернуться к выбору'),
      });
      if (!isProceed) return;
    } else {
      const isConfirmed = await showConfirmRef.current?.({
        title: tRef.current('completeEvaluationTitle', 'Завершение оценки'),
        message: tRef.current('confirmApproveProtocolMessage', 'Вы уверены, что хотите утвердить итоговый протокол и огласить победителей? Всем поставщикам будут разосланы уведомления о результатах.'),
        type: 'success',
        confirmText: tRef.current('confirmBtn', 'Утвердить протокол'),
        cancelText: tRef.current('cancelEditBtn', 'Отмена'),
      });
      if (!isConfirmed) return;
    }

    try {
      await API.post(`/evaluation/complete/${id}`);
      await showAlertRef.current?.({
        title: tRef.current('successTitle', 'Успешно'),
        message: tRef.current('evaluationCompletedSuccess', 'Оценка успешно завершена! Итоги оглашены.'),
        type: 'success'
      });
      fetchTenderDetails(id);
    } catch (e) {
      showAlertRef.current?.({
        title: tRef.current('errorTitle', 'Ошибка'),
        message: e.response?.data?.error || (tRef.current('profileSaveError', 'Ошибка при завершении оценки')),
        type: 'error'
      });
    }
  }, [allLotsAwarded, awardedLots.length, fetchTenderDetails, id, lotsWithOffers.length]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return {
    tenderDetails,
    loading,
    expandedOffers,
    toggleOfferDetails,
    handleAwardLot,
    handleCompleteEvaluation,
    handlePrint,
    lotsList,
    lotsWithOffers,
    awardedLots,
    allLotsAwarded,
    effectiveStatus,
    fetchTenderDetails,
  };
}
