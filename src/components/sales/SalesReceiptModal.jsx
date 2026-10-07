import React from 'react';
import { Modal } from '../common/Modal';
import { useFarm } from '../../context/FarmContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const SalesReceiptModal = ({ isOpen, onClose, sale }) => {
  const { settings } = useFarm();

  if (!sale) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider"><CheckCircle2 className="w-3 h-3 mr-1" /> PAID</span>;
      case 'Partial':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wider"><Clock className="w-3 h-3 mr-1" /> PARTIAL</span>;
      case 'Credit':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 uppercase tracking-wider"><AlertCircle className="w-3 h-3 mr-1" /> UNPAID / CREDIT</span>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sales Receipt"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Thermal Print Area */}
        <div id="printable-thermal-receipt" className="bg-white p-5 border border-slate-200 rounded-xl font-mono text-slate-800 space-y-4 shadow-2xs printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
              {settings.farmName || "GreenPastures Cattle Farm"}
            </h2>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">{settings.address || "Main Farm Road, Cattle Zone"}</p>
            <p className="text-[11px] text-slate-500 font-sans">{settings.phone || "Contact: +92 300 0000000"}</p>
            <div className="mt-2 text-xs font-bold tracking-widest text-slate-700 uppercase">
              *** SALES RECEIPT ***
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="text-xs space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Invoice No:</span>
              <span className="font-extrabold text-slate-900">{sale.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Date & Time:</span>
              <span className="font-bold">{formatDate(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Customer:</span>
              <span className="font-bold">{sale.customerName || 'Walk-in Customer'}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Phone:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Sale Category:</span>
              <span className="font-bold text-emerald-800">{sale.category} Sale</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-b border-dashed border-slate-300 pb-3">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-sans">
                  <th className="pb-1">Item Description</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Rate</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 font-bold">
                        {item.description || item.animalTag || 'Milk Yield'}
                        {item.animalType ? ` (${item.animalType})` : ''}
                      </td>
                      <td className="py-1.5 text-center">{item.quantity}</td>
                      <td className="py-1.5 text-right">{item.rate}</td>
                      <td className="py-1.5 text-right font-bold">{formatCurrency(item.total, settings.currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-1.5 font-bold">{sale.category} Sale Item</td>
                    <td className="py-1.5 text-center">1</td>
                    <td className="py-1.5 text-right">{sale.totalAmount}</td>
                    <td className="py-1.5 text-right font-bold">{formatCurrency(sale.totalAmount, settings.currency)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Payment Breakdown */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 font-sans">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.totalAmount, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-1.5">
              <span>TOTAL AMOUNT:</span>
              <span className="text-slate-900">{formatCurrency(sale.totalAmount, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 font-bold">
              <span>Amount Paid ({sale.paymentMethod || 'Cash'}):</span>
              <span>{formatCurrency(sale.paidAmount, settings.currency)}</span>
            </div>
            {Number(sale.remainingAmount) > 0 && (
              <div className="flex justify-between text-xs text-rose-600 font-extrabold border-t border-dashed border-rose-200 pt-1">
                <span>REMAINING / CREDIT:</span>
                <span>{formatCurrency(sale.remainingAmount, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 font-sans">Payment Status:</span>
              {getStatusBadge(sale.paymentStatus)}
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-500 font-sans space-y-0.5">
            <p className="font-bold text-slate-700">Thank you for your business!</p>
            <p>Computer generated invoice. No signature required.</p>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden when printing) */}
        <div className="flex justify-between items-center pt-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
