import { CreditCard } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// WebPayVoucher — Comprobante de pago WebPay en /gracias.
// Transbank EXIGE mostrar estos datos en la página de resultado para aprobar
// la validación oficial: monto, orden de compra, código de autorización,
// fecha, tipo de pago y últimos 4 dígitos de la tarjeta.
// ════════════════════════════════════════════════════════════════════════
const TIPO_PAGO = {
  VN: 'Venta normal (crédito)', VC: 'Venta en cuotas', SI: '3 cuotas sin interés',
  S2: '2 cuotas sin interés', NC: 'N cuotas sin interés', VD: 'Venta débito', VP: 'Venta prepago',
};

export default function WebPayVoucher({ voucher }) {
  if (!voucher) return null;
  const fecha = voucher.transaction_date
    ? new Date(voucher.transaction_date).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
    : '';
  const filas = [
    ['Orden de compra', voucher.buy_order],
    ['Monto', `$${Number(voucher.amount || 0).toLocaleString('es-CL')}`],
    ['Código de autorización', voucher.authorization_code],
    ['Fecha de la transacción', fecha],
    ['Tipo de pago', TIPO_PAGO[voucher.payment_type_code] || voucher.payment_type_code],
    voucher.installments_number > 0 ? ['Cuotas', String(voucher.installments_number)] : null,
    ['Tarjeta', voucher.card_number ? `**** **** **** ${voucher.card_number}` : ''],
  ].filter((f) => f && f[1]);

  return (
    <div className="mt-4 bg-white rounded-2xl p-4 text-left" style={{ border: '1.5px solid #E8DDD0' }}>
      <p className="font-bold text-sm mb-2.5 flex items-center gap-1.5" style={{ color: '#2C1810' }}>
        <CreditCard className="w-4 h-4" style={{ color: '#0F8B6C' }} /> Comprobante WebPay Plus
      </p>
      <div className="space-y-1.5 text-xs">
        {filas.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <span style={{ color: '#A08070' }}>{k}</span>
            <span className="font-semibold text-right" style={{ color: '#2C1810' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}