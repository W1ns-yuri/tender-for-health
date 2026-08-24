import React, { useState } from 'react';
import { ShieldAlert, Users, Key, Database, RefreshCw, Search } from 'lucide-react';

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState('logs');

  const logsData = [
    { id: 1, user: 'jemal.2020', name: 'Jemal', event: 'Ulgama giriş', operation: 'ÝAZMAK', ip: '172.16.10.34', date: '27.03.2026 08:53' },
    { id: 2, user: 'arzy', name: 'Arzy', event: 'Ulgama giriş', operation: 'ÝAZMAK', ip: '172.16.10.34', date: '26.03.2026 17:47' },
    { id: 3, user: 'aman.0423', name: 'Aman', event: 'Ulgamdan çykyş', operation: 'TÄZELEMEK', ip: '172.16.10.34', date: '26.03.2026 17:05' },
    { id: 4, user: 'resul.bayramow', name: 'Resul', event: 'Ulgama giriş', operation: 'ÝAZMAK', ip: '172.16.10.34', date: '25.03.2026 12:01' },
    { id: 5, user: 'merjen', name: 'Merjen', event: 'Ulgamdan çykyş', operation: 'TÄZELEMEK', ip: '172.22.1.233', date: '25.03.2026 12:01' },
  ];

  const usersData = [
    { id: 1, username: 'arzy', name: 'Arzygül', surname: 'Berdiýewa', middle: 'Berdiýewna', role: 'Admin', active: 'Hawa', lastLogin: '26.03.2026 14:11' },
    { id: 2, username: 'begli', name: 'Begli', surname: 'Begjanow', middle: 'Batyrowiç', role: 'Admin', active: 'Hawa', lastLogin: '26.03.2026 08:40' },
    { id: 3, username: 'aman.0423', name: 'Aman', surname: 'Amano', middle: 'Amonowiç', role: 'Admin', active: 'Hawa', lastLogin: '26.03.2026 15:07' },
    { id: 4, username: 'resul.bayramow', name: 'Resul', surname: 'Baýramow', middle: '-', role: 'Admin', active: 'Hawa', lastLogin: '26.03.2026 10:59' },
    { id: 5, username: 'merjen', name: 'Merjen', surname: 'Süleýmanowa', middle: 'Döwletgeldanýewna', role: 'Admin', active: 'Hawa', lastLogin: '26.03.2026 10:12' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Administrasiýa we Логи (Admin)</h2>
          <p className="text-xs text-slate-400 font-medium">Безопасность, журнал аудита и список пользователей</p>
        </div>
      </div>

      {/* Плитка раздела Администрирование (Слайд 29) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('logs')}
          className={`p-4 rounded-xl border text-left transition-all ${activeTab === 'logs' ? 'bg-teal-50 border-teal-500 shadow-xs' : 'bg-white border-slate-200'}`}
        >
          <p className="font-bold text-sm text-slate-800">Loglar</p>
          <p className="text-[11px] text-slate-400">Журнал событий (Аудит)</p>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`p-4 rounded-xl border text-left transition-all ${activeTab === 'users' ? 'bg-teal-50 border-teal-500 shadow-xs' : 'bg-white border-slate-200'}`}
        >
          <p className="font-bold text-sm text-slate-800">Ulanyjylar</p>
          <p className="text-[11px] text-slate-400">Пользователи системы</p>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`p-4 rounded-xl border text-left transition-all ${activeTab === 'roles' ? 'bg-teal-50 border-teal-500 shadow-xs' : 'bg-white border-slate-200'}`}
        >
          <p className="font-bold text-sm text-slate-800">Rollar</p>
          <p className="text-[11px] text-slate-400">Права доступа (RBAC)</p>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`p-4 rounded-xl border text-left transition-all ${activeTab === 'backup' ? 'bg-teal-50 border-teal-500 shadow-xs' : 'bg-white border-slate-200'}`}
        >
          <p className="font-bold text-sm text-slate-800">Backup</p>
          <p className="text-[11px] text-slate-400">Резервное копирование</p>
        </button>
      </div>

      {/* Таблицы (Слайд 30 и 32) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-800 capitalize">
            {activeTab === 'logs' ? 'Loglar / Журнал аудита (Слайд 32)' : 'Ulanyjylar / Пользователи (Слайд 30)'}
          </h3>

          <div className="relative w-48">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Gözleg..." className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'logs' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e3a8a] text-white">
                  <th className="py-3 px-4">Ulanyjy</th>
                  <th className="py-3 px-4">Doly ady</th>
                  <th className="py-3 px-4">Waka</th>
                  <th className="py-3 px-4 text-center">Amal</th>
                  <th className="py-3 px-4 text-center">IP</th>
                  <th className="py-3 px-4 text-center">Döredilen senesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsData.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-teal-800">{log.user}</td>
                    <td className="py-3 px-4 text-slate-800">{log.name}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{log.event}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold text-[11px]">{log.operation}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">{log.ip}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e3a8a] text-white">
                  <th className="py-3 px-4">Ulanyjy ady</th>
                  <th className="py-3 px-4">Ady</th>
                  <th className="py-3 px-4">Familiýasy</th>
                  <th className="py-3 px-4">Atasynyň ady</th>
                  <th className="py-3 px-4 text-center">Rol</th>
                  <th className="py-3 px-4 text-center">İşjeň</th>
                  <th className="py-3 px-4 text-center">Soňky giriş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersData.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-teal-800">{u.username}</td>
                    <td className="py-3 px-4 text-slate-800">{u.name}</td>
                    <td className="py-3 px-4 text-slate-800">{u.surname}</td>
                    <td className="py-3 px-4 text-slate-500">{u.middle}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">{u.role}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">{u.active}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{u.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
