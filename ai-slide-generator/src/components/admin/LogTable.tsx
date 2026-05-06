'use client'

import { useState } from 'react'
import Modal from '@/components/shared/Modal'

interface LogTableProps {
  logs: any[]
}

export default function LogTable({ logs }: LogTableProps) {
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  const getProviderLabel = (provider?: string) => {
    if (provider === 'openai') return 'ChatGPT'
    return 'Gemini'
  }

  const getProviderBadgeClass = (provider?: string) => {
    if (provider === 'openai') return 'bg-slate-900 text-white'
    return 'bg-blue-100 text-blue-700'
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopyStatus(type)
    setTimeout(() => setCopyStatus(null), 2000)
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50 flex">
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Колдонуучу</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/5">Сурам / Жооп</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Метрика</div>
            <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/5">Убакыт</div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {logs.map((log: any) => {
              const isPending = !log.response && !log.tokens_used;
              const isError = log.response?.startsWith('Error:') || (log.is_valid === false && log.response);
              
              return (
                <div 
                  key={log.id} 
                  className="flex hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="px-6 py-4 w-1/5">
                    <p className="text-sm font-medium text-gray-900 truncate">{log.users?.full_name || 'System'}</p>
                    <p className="text-sm text-gray-500 truncate">{log.users?.email || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {log.id.substring(0, 8)}...</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getProviderBadgeClass(log.provider)}`}>
                        {getProviderLabel(log.provider)}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-600 rounded-full">
                        {log.model || 'gemini-2.5-flash'}
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4 w-2/5">
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Input:</span>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded mt-1 line-clamp-2" title={log.client_prompt || log.prompt}>
                        {log.client_prompt || log.prompt}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase">Response Summary:</span>
                      {isPending ? (
                        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-1 border border-blue-100 italic animate-pulse">
                          Жооп күтүлүүдө... (Starting)
                        </p>
                      ) : (
                        <p className={`text-xs p-2 rounded mt-1 border line-clamp-1 ${isError ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {log.response || '(Жооп жок)'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4 w-1/5">
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        {isPending ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-700 rounded-full uppercase">Pending</span>
                        ) : isError ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-full uppercase">Error</span>
                        ) : log.is_valid ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 rounded-full uppercase">Valid</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full uppercase">Invalid</span>
                        )}
                        
                        {log.presentation_id && (
                          <a 
                            href={`/editor/${log.presentation_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full uppercase hover:bg-blue-200 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                        )}
                      </div>
                      <p><span className="text-gray-500">Токен:</span> {log.tokens_used?.toLocaleString() || '---'}</p>
                      <p><span className="text-gray-500">Чыгым:</span> <span className={log.cost_usd ? 'text-red-600' : 'text-gray-400'}>
                        {log.cost_usd ? `$${log.cost_usd.toFixed(6)}` : '---'}
                      </span></p>
                      <p><span className="text-gray-500">Убакыт:</span> {log.duration_ms ? ` ${(log.duration_ms / 1000).toFixed(1)} сек` : '---'}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4 w-1/5 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Логдун толук маалыматы"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-100 rounded-xl border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Колдонуучу</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{selectedLog.users?.full_name}</p>
                </div>
                <p className="text-sm text-gray-500">{selectedLog.users?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase ${getProviderBadgeClass(selectedLog.provider)}`}>
                    {getProviderLabel(selectedLog.provider)}
                  </span>
                  <span className="px-3 py-1 text-xs font-mono bg-white text-gray-700 border border-gray-200 rounded-lg">
                    {selectedLog.model || 'gemini-2.5-flash'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-end items-center gap-2 mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Статус</p>
                    {selectedLog.is_valid ? (
                      <span className="px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-lg">JSON ВАЛИДТҮҮ</span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-bold bg-red-500 text-white rounded-lg">JSON КАТА</span>
                    )}
                  </div>
                  {selectedLog.presentation_id && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Презентация</p>
                      <a 
                        href={`/editor/${selectedLog.presentation_id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                      >
                        АЧУУ
                      </a>
                    </div>
                  )}
                </div>
                <p className="font-medium text-gray-900">{new Date(selectedLog.created_at).toLocaleString('ru-RU')}</p>
                <div className="flex justify-end gap-3 mt-1 text-xs text-gray-500">
                  <span>{selectedLog.tokens_used} tokens</span>
                  <span>${selectedLog.cost_usd.toFixed(6)}</span>
                  <span>{(selectedLog.duration_ms / 1000).toFixed(2)}s</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Кардардын сурамы (Topic)</h3>
                  <button
                    onClick={() => handleCopy(selectedLog.client_prompt || selectedLog.prompt, 'client_prompt')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {copyStatus === 'client_prompt' ? 'Көчүрүлдү!' : 'Көчүрүү'}
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-xl text-sm font-mono overflow-auto max-h-48 whitespace-pre-wrap border border-gray-800 shadow-inner">
                  {selectedLog.client_prompt || selectedLog.prompt}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-700 uppercase">Толук Системалык Сурам</h3>
                  <button
                    onClick={() => handleCopy(selectedLog.full_prompt || selectedLog.prompt, 'full_prompt')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {copyStatus === 'full_prompt' ? 'Көчүрүлдү!' : 'Көчүрүү'}
                  </button>
                </div>
                <div className="bg-gray-800 text-gray-200 p-4 rounded-xl text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap border border-gray-700 shadow-inner">
                  {selectedLog.full_prompt || '(Эски логдо жок)'}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700 uppercase">ИИнин Жообу (Raw JSON)</h3>
                <button
                  onClick={() => handleCopy(selectedLog.response, 'response')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {copyStatus === 'response' ? 'Көчүрүлдү!' : 'Көчүрүү'}
                </button>
              </div>
              <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap border border-blue-100 shadow-inner">
                {selectedLog.response || '(Жок)'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
