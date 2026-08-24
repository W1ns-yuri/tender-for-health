import React, { useState } from 'react';
import { Trophy, Unlock, CheckCircle, AlertCircle } from 'lucide-react';
import API from '../services/api';

export default function Evaluation() {
  const [tenderId, setTenderId] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [message, setMessage] = useState('');

  // 1. Процедура вскрытия предложений (Teklipleri açmak)
  const handleOpenBids = async () => {
    try {
      const res = await API.post(`/evaluation/open/${tenderId}`);
      setMessage(res.data.message || '🔔 Вскрытие предложений успешно проведено!');
    } catch (e) {
      alert('❌ Ошибка при вскрытии предложений: ' + (e.response?.data?.error || e.message));
    }
  };

  // 2. Оценка комиссии (Bahalandyrmak)
  const handleEvaluate = async () => {
    try {
      const res = await API.get(`/evaluation/evaluate/${tenderId}`);
      setEvaluationResult(res.data);
    } catch (e) {
      alert('❌ Ошибка при оценке: ' + (e.response?.data?.error || e.message));
    }
  };

  // 3. Объявление победителя (ýeňiji yglan edildi)
  const handleSelectWinner = async (offerId) => {
    try {
      await API.post('/evaluation/select-winner', { tenderId: tenderId, winningOfferId: offerId });
      alert('🏆 Победитель тендера успешно объявлен!');
      handleEvaluate();
    } catch (e) {
      alert('❌ Ошибка при выборе победителя: ' + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* 
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Komissiýa / Bahalandyrmak we Ýeňijilik</h2>
          <p className="text-xs text-slate-400 font-medium">Процедуры вскрытия предложений и финансово-технической оценки</p>
        </div>
      </div>
      */}

      <div className="p-8 text-center text-slate-500 font-medium border-2 border-dashed border-slate-300 rounded-xl mt-4">
        {/* Пока контент не определен (В разработке) */}
        
      </div>

    </div>
  );
}
