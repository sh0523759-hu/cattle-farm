import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Printer, Download, Sprout, CheckCircle2, Building, Calendar, CreditCard, User, Hash } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

export const ReceiptModal = ({ isOpen, onClose, data, type = 'income', settings = {} }) => {
  const printRef = useRef(null);

  if (!data) return null;

  const isIncome = type === 'income';
  const docTitle = isIncome ? 'OFFICIAL INCOME RECEIPT' : 'EXPENSE VOUCHER';
  const docId = data.id ? data.id : `REC-${Date.now().toString().slice(-4)}`;

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isIncome ? "Sales Invoice & Receipt" : "Payment Expense Voucher"}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Printable Area Wrapper */}
        <div
          ref={printRef}
          className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-slate-800 printable-receipt"
        >
          {/* Receipt Header Banner */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center space-x-3">
              {settings?.logo ? (
                <img src={settings.logo} alt="Farm Logo" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
              ) : (
                <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs">
                  <Sprout className="w-6 h-6" />
                </div>
              )}
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {settings?.farmName || 'Cattle ERP Farm'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {settings?.address || 'Cattle Farm Operations & Registry'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {settings?.phone ? `Tel: ${settings.phone}` : ''} {settings?.email ? `• ${settings.email}` : ''}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className={`inline-block px-2.5 py-1 text-[11px] font-extrabold rounded-lg uppercase tracking-wider ${
                isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {docTitle}
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">#{docId}</p>
              <p className="text-[11px] text-slate-400 font-medium">{formatDate(data.date)}</p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                {isIncome ? 'Customer / Buyer' : 'Expense Category'}
              </span>
              <span className="font-extrabold text-slate-800 text-sm">
                {isIncome ? (data.customer || 'General Buyer') : data.category}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                Payment Method
              </span>
              <span className="font-extrabold text-slate-800 text-sm">
                {data.paymentMethod || 'Cash'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                Transaction Date
              </span>
              <span className="font-bold text-slate-700">
                {formatDate(data.date)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                Status
              </span>
              <span className="inline-flex items-center text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Completed & Verified
              </span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-3">Particulars / Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">
                    {data.description || (isIncome ? `${data.category} transaction record` : `${data.category} operational expense`)}
                  </td>
                  <td className="p-3 font-medium text-slate-600">
                    {data.category}
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900 text-sm">
                    {formatCurrency(data.amount, settings?.currency)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200 font-extrabold text-sm">
                  <td colSpan="2" className="p-3 text-slate-800 uppercase tracking-wider text-xs">Total Amount Paid</td>
                  <td className={`p-3 text-right text-base ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(data.amount, settings?.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Signatures */}
          <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-[11px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">{settings?.ownerName || 'Farm Manager'}</p>
              <p className="text-[10px] text-slate-400">Authorized Signature</p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-700">Cattle ERP Generated Voucher</p>
              <p className="text-[10px] text-slate-400">System Verified Record</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden during Print) */}
        <div className="flex items-center justify-between pt-2 no-print">
          <span className="text-xs text-slate-400 font-medium">Click print to print or save as PDF</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice / Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
