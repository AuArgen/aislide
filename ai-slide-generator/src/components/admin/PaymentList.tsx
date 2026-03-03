'use client'

import { useState } from 'react'
import { updatePaymentStatus } from '@/lib/actions/payments'

interface PaymentListProps {
  initialPayments: any[]
}

export function PaymentList({ initialPayments }: PaymentListProps) {
  const [payments, setPayments] = useState(initialPayments)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleStatusUpdate = async (id: string, status: 'active' | 'rejected') => {
    setProcessingId(id)
    try {
      const result = await updatePaymentStatus(id, status)
      if (result.success) {
        setPayments(prev => prev.filter(p => p.id !== id))
      } else {
        alert('Ката кетти: ' + result.error)
      }
    } catch (error) {
      alert('Тармактык ката кетти')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Колдонуучу</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Чек (Proof)</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-900">Дата</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Аракеттер</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900">{payment.users?.full_name}</div>
                <div className="text-sm text-gray-500">{payment.users?.email}</div>
              </td>
              <td className="px-6 py-4">
                {payment.payment_proof_url ? (
                  <a 
                    href={payment.payment_proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    Чети көрүү ↗
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">Чек жок</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(payment.created_at).toLocaleDateString('ky-KG')}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleStatusUpdate(payment.id, 'active')}
                    disabled={!!processingId}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    Тастыктоо
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(payment.id, 'rejected')}
                    disabled={!!processingId}
                    className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    Четке кагуу
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
