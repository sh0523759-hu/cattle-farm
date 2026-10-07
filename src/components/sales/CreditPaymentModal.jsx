import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useFarm } from '../../context/FarmContext';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, CreditCard } from 'lucide-react';

export const CreditPaymentModal = ({ isOpen, onClose, sale }) => {
  const { recordCreditPayment, settings } = useFarm();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!sale) return null;

  const currentRemaining = Number(sale.remainingAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const recv = Number(paymentAmount);
    if (!recv || recv <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (recv > currentRemaining) {
      setError(`Payment amount cannot exceed the current outstanding balance of ${formatCurrency(currentRemaining, settings.currency)}.`);
      return;
    }

    recordCreditPayment(sale.id || sale._id, recv, paymentMethod, date, notes);
    onClose();
  };

  const newBalance = Math.max(0, currentRemaining - (Number(paymentAmount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${sale.invoiceNo}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer & Balance Summary */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Customer:</span>
            <span className="font-bold text-slate-800">{sale.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Original Invoice Total:</span>
            <span className="font-bold text-slate-700">{formatCurrency(sale.totalAmount, settings.currency)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-rose-700">
            <span className="font-bold">Current Outstanding Balance:</span>
            <span className="font-extrabold text-sm">{formatCurrency(currentRemaining, settings.currency)}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-medium"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Amount Received NOW ({settings.currency}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="1"
            max={currentRemaining}
            required
            placeholder={`Max: ${currentRemaining}`}
            value={paymentAmount}
            onChange={(e) => {
              setPaymentAmount(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
          />
        </div>

        {/* Dynamic New Balance Preview */}
        {Number(paymentAmount) > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between text-xs font-bold text-emerald-800">
            <span>New Remaining Balance:</span>
            <span>{formatCurrency(newBalance, settings.currency)}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes / Reference</label>
          <input
            type="text"
            placeholder="e.g. Received via cash counter / bank slip #"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <DollarSign className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
