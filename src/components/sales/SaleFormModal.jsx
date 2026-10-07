import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useFarm } from '../../context/FarmContext';
import { formatCurrency } from '../../utils/formatters';
import { Milk, ShoppingCart, UserCheck, Plus, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export const SaleFormModal = ({ isOpen, onClose, onSaleCreated }) => {
  const { animals, milkRecords, customers, accounts = [], addSale, settings, availableMilk, totalMilkProduced, totalMilkSold } = useFarm();

  // Wizard Step: 1 = Category, 2 = Item Selection, 3 = Customer & Payment
  const [step, setStep] = useState(1);

  // Category: 'Milk' | 'Animal'
  const [category, setCategory] = useState('Milk');

  // Milk Item State
  const todayStr = new Date().toISOString().slice(0, 10);
  const [milkQty, setMilkQty] = useState(availableMilk > 0 ? Math.min(availableMilk, 20) : 0);
  const [milkRate, setMilkRate] = useState(settings.defaultMilkRate || 200);

  // Animal Item State - exclude Sold Out animals
  const availableAnimals = useMemo(() => {
    return animals.filter(a => {
      const s = (a.status || '').toLowerCase();
      return !['sold out', 'sold', 'deceased'].includes(s);
    });
  }, [animals]);

  const [selectedAnimalTag, setSelectedAnimalTag] = useState(availableAnimals.length > 0 ? availableAnimals[0].tagNo : '');
  const [animalPrice, setAnimalPrice] = useState('');

  // Customer & Payment State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const bankAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'Bank' || a.type === 'Card');
  }, [accounts]);

  // Auto-calculated item total
  const calculatedTotal = useMemo(() => {
    if (category === 'Milk') {
      return Number(((Number(milkQty) || 0) * (Number(milkRate) || 0)).toFixed(2));
    } else {
      return Number(animalPrice) || 0;
    }
  }, [category, milkQty, milkRate, animalPrice]);

  // Selected Animal Details
  const selectedAnimal = useMemo(() => {
    return animals.find(a => a.tagNo === selectedAnimalTag);
  }, [animals, selectedAnimalTag]);

  // When selecting an existing customer, auto-fill name, phone & address
  const handleCustomerSelect = (custId) => {
    setSelectedCustomerId(custId);
    if (custId) {
      const cust = customers.find(c => c.id === custId || c._id === custId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone || '');
        setCustomerAddress(cust.address || '');
      }
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (category === 'Animal' && availableAnimals.length === 0) {
        setError('No animals currently available for sale.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (category === 'Milk') {
        const qtyNum = Number(milkQty);
        if (!qtyNum || qtyNum <= 0) {
          setError('Please enter a valid milk quantity in Liters.');
          return;
        }
        if (qtyNum > availableMilk) {
          setError(`Insufficient milk available for this sale. (Available: ${availableMilk} ${settings.milkUnit || 'Liter'}, Requested: ${qtyNum} ${settings.milkUnit || 'Liter'})`);
          return;
        }
        if (!milkRate || Number(milkRate) <= 0) {
          setError('Please enter a valid milk rate per Liter.');
          return;
        }
      } else {
        if (!selectedAnimalTag) {
          setError('Please select an animal for sale.');
          return;
        }
        if (!animalPrice || Number(animalPrice) <= 0) {
          setError('Please enter the agreed selling price for the animal.');
          return;
        }
      }
      // Pre-fill paid amount with full calculated total by default
      setPaidAmount(calculatedTotal.toString());
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Please enter customer name or select an existing customer.');
      return;
    }

    if (category === 'Milk') {
      const qtyNum = Number(milkQty);
      if (qtyNum > availableMilk) {
        setError(`Insufficient milk available for this sale. (Available: ${availableMilk} ${settings.milkUnit || 'Liter'}, Requested: ${qtyNum} ${settings.milkUnit || 'Liter'})`);
        return;
      }
    }

    const total = calculatedTotal;
    const paid = paidAmount === '' ? total : Number(paidAmount);

    if (isNaN(paid) || paid < 0) {
      setError('Paid amount cannot be negative.');
      return;
    }
    if (paid > total) {
      setError(`Paid amount cannot exceed total sale amount of ${formatCurrency(total, settings.currency)}.`);
      return;
    }

    // Build items payload
    let saleItems = [];
    if (category === 'Milk') {
      saleItems = [{
        id: `item-${Date.now()}`,
        description: `Fresh Milk Yield (${milkQty} ${settings.milkUnit || 'Liter'})`,
        quantity: Number(milkQty),
        rate: Number(milkRate),
        total: total
      }];
    } else {
      saleItems = [{
        id: `item-${Date.now()}`,
        animalTag: selectedAnimal.tagNo,
        animalName: selectedAnimal.name,
        animalType: selectedAnimal.type,
        quantity: 1,
        rate: Number(animalPrice),
        total: total,
        description: `Animal Sale: ${selectedAnimal.name} (${selectedAnimal.tagNo} - ${selectedAnimal.type})`
      }];
    }

    const payload = {
      date: todayStr,
      category: category,
      customerId: selectedCustomerId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      quantity: category === 'Milk' ? Number(milkQty) : 1,
      unitPrice: category === 'Milk' ? Number(milkRate) : Number(animalPrice),
      items: saleItems,
      totalAmount: total,
      paidAmount: paid,
      paymentMethod: paymentMethod,
      accountId: accountId,
      accountName: accountName,
      notes: notes
    };

    const savedSale = await addSale(payload);
    
    // Reset wizard
    setStep(1);
    onClose();
    if (onSaleCreated) {
      onSaleCreated(savedSale);
    }
  };

  const remaining = Math.max(0, calculatedTotal - (Number(paidAmount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Sale Invoice"
      maxWidth="max-w-lg"
    >
      {/* Wizard Progress Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-xs font-bold">
        <div className={`flex items-center space-x-1.5 ${step >= 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>1</span>
          <span>Category</span>
        </div>
        <div className="h-0.5 w-8 bg-slate-200"></div>
        <div className={`flex items-center space-x-1.5 ${step >= 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>2</span>
          <span>Select Items</span>
        </div>
        <div className="h-0.5 w-8 bg-slate-200"></div>
        <div className={`flex items-center space-x-1.5 ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-emerald-700 text-white' : 'bg-slate-200'}`}>3</span>
          <span>Payment</span>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
          {error}
        </div>
      )}

      {/* STEP 1: Select Category */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">Select what type of product/asset you are selling today:</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCategory('Milk')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                category === 'Milk'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl w-fit">
                <Milk className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Milk Sale</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Bulk or retail daily milk yield distribution</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCategory('Animal')}
              className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                category === 'Animal'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="p-3 bg-blue-100 text-blue-800 rounded-xl w-fit">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Animal Sale</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Sell registered cows, bulls, or calves from herd</p>
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <span>Continue to Items</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Item Selection */}
      {step === 2 && (
        <div className="space-y-4">
          {category === 'Milk' ? (
            <div className="space-y-4">
              {/* Live Available Milk Stock Indicator */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                availableMilk > 0
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    availableMilk > 0 ? 'bg-emerald-600 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    <Milk className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block opacity-75">
                      Available Milk Stock
                    </span>
                    <span className="text-lg font-black block">
                      {availableMilk} {settings.milkUnit || 'Liter'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                  <div>Produced: <strong className="text-slate-700">{totalMilkProduced} {settings.milkUnit || 'Liter'}</strong></div>
                  <div>Already Sold: <strong className="text-blue-700">{totalMilkSold} {settings.milkUnit || 'Liter'}</strong></div>
                </div>
              </div>

              {availableMilk <= 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  ⚠️ No milk available in inventory stock. All produced milk has already been sold. Please record new milk production before creating a milk sale.
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Quantity Sold ({settings.milkUnit || 'Liter'}) *</label>
                  <span className="text-[11px] font-semibold text-slate-500">Max available: {availableMilk} {settings.milkUnit || 'Liter'}</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={availableMilk}
                  required
                  value={milkQty}
                  onChange={(e) => {
                    setMilkQty(e.target.value);
                    if (Number(e.target.value) > availableMilk) {
                      setError(`Insufficient milk available for this sale. (Available: ${availableMilk} ${settings.milkUnit || 'Liter'})`);
                    } else {
                      setError('');
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-xl font-bold focus:ring-2 focus:outline-hidden ${
                    Number(milkQty) > availableMilk
                      ? 'border-rose-400 bg-rose-50/30 text-rose-700 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:ring-emerald-500/20'
                  }`}
                />
                {Number(milkQty) > availableMilk && (
                  <p className="mt-1 text-[11px] text-rose-600 font-bold">
                    ⚠️ Insufficient milk available for this sale. (Available: {availableMilk} {settings.milkUnit || 'Liter'})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rate per {settings.milkUnit || 'Liter'} ({settings.currency}) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={milkRate}
                  onChange={(e) => setMilkRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Available Animal *</label>
                <select
                  required
                  value={selectedAnimalTag}
                  onChange={(e) => {
                    setSelectedAnimalTag(e.target.value);
                    const selected = animals.find(a => a.tagNo === e.target.value);
                    if (selected && selected.purchasePrice) {
                      setAnimalPrice(selected.purchasePrice.toString());
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                >
                  {availableAnimals.map(a => (
                    <option key={a.id || a.tagNo} value={a.tagNo}>
                      {a.tagNo} - {a.name || 'Unnamed'} ({a.type} | {a.breed} | {a.weight}kg)
                    </option>
                  ))}
                </select>
              </div>

              {selectedAnimal && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Animal Tag & Name:</span>
                    <span className="font-extrabold text-slate-800">{selectedAnimal.tagNo} ({selectedAnimal.name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type & Breed:</span>
                    <span className="font-bold">{selectedAnimal.type} - {selectedAnimal.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Health & Weight:</span>
                    <span>{selectedAnimal.healthStatus} | {selectedAnimal.weight}kg</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price ({settings.currency}) *</label>
                <input
                  type="number"
                  step="100"
                  min="100"
                  required
                  placeholder="e.g. 350000"
                  value={animalPrice}
                  onChange={(e) => setAnimalPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Auto Total Calculation Display */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-900">Calculated Item Total:</span>
            <span className="text-lg font-black text-emerald-800">{formatCurrency(calculatedTotal, settings.currency)}</span>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <span>Customer & Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Customer & Payment */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer (Optional)</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              <option value="">-- New / Walk-in Customer --</option>
              {customers.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe / Dairy Buyer"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +92 300 1234567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Chak 24-RB, Faisalabad Road"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          {/* Payment Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-700">Total Invoice Amount:</span>
              <span className="text-base font-extrabold text-slate-900">{formatCurrency(calculatedTotal, settings.currency)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Amount Paid Today ({settings.currency}) *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max={calculatedTotal}
                  required
                  placeholder={calculatedTotal.toString()}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-extrabold text-emerald-800 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const method = e.target.value;
                    setPaymentMethod(method);
                    if (method === 'Bank Transfer' || method === 'Online') {
                      const firstBank = bankAccounts[0];
                      if (firstBank) {
                        setAccountId(firstBank.id || firstBank._id);
                        setAccountName(firstBank.name || firstBank.bankName);
                      }
                    } else {
                      setAccountId('');
                      setAccountName('Cash in Hand');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-medium"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online">Online / Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {(paymentMethod === 'Bank Transfer' || paymentMethod === 'Online') && bankAccounts.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Deposit To Bank Account</label>
                <select
                  value={accountId}
                  onChange={(e) => {
                    const acc = bankAccounts.find(a => (a.id || a._id) === e.target.value);
                    setAccountId(e.target.value);
                    setAccountName(acc ? (acc.name || acc.bankName) : '');
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id || b._id} value={b.id || b._id}>
                      {b.bankName || b.name} ({b.accountNumber ? `...${b.accountNumber.slice(-4)}` : b.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Remaining Udhaar Display */}
            <div className={`p-2.5 rounded-lg flex justify-between text-xs font-extrabold ${remaining > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
              <span>{remaining > 0 ? "Outstanding Credit / Udhaar:" : "Payment Status:"}</span>
              <span>{remaining > 0 ? formatCurrency(remaining, settings.currency) : "FULLY PAID"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Special Instructions</label>
            <input
              type="text"
              placeholder="e.g. Delivery arranged for tomorrow morning"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Complete Sale & Print Receipt</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
