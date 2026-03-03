import { getPendingPayments } from '@/lib/actions/payments'
import { PaymentList } from '@/components/admin/PaymentList'

export default async function AdminPaymentsPage() {
  const payments = await getPendingPayments()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Төлөмдөрдү тастыктоо</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {payments.length > 0 ? (
          <PaymentList initialPayments={payments} />
        ) : (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">Азырынча жаңы төлөмдөр жок.</p>
          </div>
        )}
      </div>
    </div>
  )
}
