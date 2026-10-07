import React, { useState, useEffect, useRef } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { normalizeAndClassifyBackup, validateBackupPayload } from '../../utils/backupNormalizer';
import { parseExcelBackup } from '../../utils/excelParser';
import {
  Save, Download, Upload, ShieldAlert, Building, Sliders,
  Loader2, CheckCircle2, FileText, Database, AlertCircle, Check, Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export const SettingsPage = () => {
  const {
    settings,
    updateSettings,
    exportAllData,
    importAllData,
    showToast
  } = useFarm();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState(settings);
  const [isImporting, setIsImporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [importResult, setImportResult] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const fileExcelInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        showToast('Image file size must be under 8MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData(prev => ({ ...prev, logo: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateSettings(formData);
    if (updateUser) {
      updateUser({
        email: formData.email || user?.email,
        name: formData.ownerName || user?.name,
        farmName: formData.farmName || user?.farmName
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name || '';
    const isExcel = /\.(xlsx|xls)$/i.test(fileName) ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel';

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target.result;
          const { normalized, rowErrors, processedSheets, totalValid, totalFailed } = parseExcelBackup(buffer);

          if (totalValid === 0 && !normalized.hasSettings) {
            if (rowErrors.length > 0) {
              showToast(`Excel validation error: ${rowErrors[0].message}`, 'error');
            } else {
              showToast('No recognizable Cattle ERP farm records found in this Excel file.', 'error');
            }
            return;
          }

          setImportPreview({
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + ' KB',
            fileType: 'excel',
            exportDate: normalized.exportDate || null,
            farmName: normalized.farmName || null,
            counts: normalized.counts,
            totalRecords: normalized.totalRecords,
            hasSettings: normalized.hasSettings,
            normalizedData: normalized,
            rawJson: null,
            rowErrors: rowErrors || [],
            processedSheets: processedSheets || [],
            totalFailed: totalFailed || 0
          });

          setImportMode('merge');
          setImportModalOpen(true);
        } catch (err) {
          showToast('Excel parse error: ' + (err.message || 'Corrupted or unreadable Excel file'), 'error');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (fileExcelInputRef.current) fileExcelInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        showToast('Could not read the selected Excel file.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (fileExcelInputRef.current) fileExcelInputRef.current.value = '';
      };

      reader.readAsArrayBuffer(file);
      return;
    }

    // JSON file handling
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || (typeof parsed !== 'object' && !Array.isArray(parsed))) {
          showToast('The selected file is not a valid JSON document.', 'error');
          return;
        }

        const normalized = normalizeAndClassifyBackup(parsed);
        const validation = validateBackupPayload(normalized);

        if (!validation.valid) {
          showToast(validation.message, 'error');
          return;
        }

        setImportPreview({
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          fileType: 'json',
          exportDate: normalized.exportDate || null,
          farmName: normalized.farmName || null,
          counts: normalized.counts,
          totalRecords: normalized.totalRecords,
          hasSettings: normalized.hasSettings,
          normalizedData: normalized,
          rawJson: parsed,
          rowErrors: [],
          processedSheets: []
        });

        setImportMode('merge');
        setImportModalOpen(true);
      } catch (err) {
        showToast('JSON parse error: ' + (err.message || 'Corrupted or unreadable file'), 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (fileExcelInputRef.current) fileExcelInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      showToast('Could not read the selected file.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (fileExcelInputRef.current) fileExcelInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.normalizedData || isImporting) return;
    setIsImporting(true);
    try {
      const res = await importAllData(importPreview.normalizedData, { mode: importMode });
      if (res && res.success !== false) {
        setImportModalOpen(false);
        setImportPreview(null);
        if (res.report) {
          setImportResult(res.report);
          setReportModalOpen(true);
        }
      }
    } catch (err) {
      showToast('Import failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">System & Farm Settings</h2>
        <p className="text-xs text-slate-500 font-medium">
          Configure farm details, measurement units, categories, and database backup options
        </p>
      </div>

      {/* 1. Farm Profile Settings */}
      <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <Building className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-extrabold text-slate-800">Farm Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Farm Name</label>
            <input
              type="text"
              name="farmName"
              value={formData.farmName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Manager Name</label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Farm Address</label>
            <input
              type="text"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Farm Logo Upload */}
          <div className="sm:col-span-2 space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-800">Farm Logo / Header Image</label>
            <div className="flex items-center space-x-4">
              {formData.logo && (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                  <img src={formData.logo} alt="Farm Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <label className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-2 shadow-xs">
                  <Upload className="w-4 h-4 text-emerald-200" />
                  <span>Upload Logo from System / Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400">Upload your farm brand logo (PNG, JPG)</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Units & Formats */}
        <div className="pt-4 border-t border-slate-100 flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-emerald-700" />
          <h4 className="text-xs font-extrabold text-slate-800">General Measurement Units</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              name="currency"
              value={formData?.currency ?? ''}
              onChange={handleChange}
              placeholder="PKR"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Weight Unit</label>
            <input
              type="text"
              name="weightUnit"
              value={formData?.weightUnit ?? ''}
              onChange={handleChange}
              placeholder="Kilogram, lbs"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Milk Yield Unit</label>
            <input
              type="text"
              name="milkUnit"
              value={formData?.milkUnit ?? ''}
              onChange={handleChange}
              placeholder="Liter, Gal"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* 3. Data Backup & Import */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b pb-3">
          <ShieldAlert className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-extrabold text-slate-800">Database Backup & Data Management</h3>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Export your farm database as a JSON backup file or import records from JSON and Excel (.xlsx, .xls) files.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportAllData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Export Full JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>Import JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileExcelInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Import Excel (.xlsx / .xls)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileSelect}
            className="hidden"
          />

          <input
            ref={fileExcelInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Import Backup Preview & Confirmation Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          if (!isImporting) {
            setImportModalOpen(false);
            setImportPreview(null);
          }
        }}
        title={importPreview?.fileType === 'excel' ? 'Import Farm Records from Excel' : 'Restore Database from JSON Backup'}
        maxWidth="max-w-2xl"
      >
        {importPreview && (
          <div className="space-y-5">
            {/* File Info Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                  importPreview.fileType === 'excel'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-100/70 border-emerald-200 text-emerald-800'
                }`}>
                  {importPreview.fileType === 'excel' ? <FileSpreadsheet className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-800 break-all">{importPreview.fileName}</h4>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {importPreview.fileType === 'excel' ? 'Excel' : 'JSON'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Size: <strong>{importPreview.fileSize}</strong>
                    {importPreview.farmName && ` • Farm: ${importPreview.farmName}`}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {importPreview.totalRecords} Records Detected
                </span>
              </div>
            </div>

            {/* If Excel has sheet breakdown, display chips */}
            {importPreview.processedSheets && importPreview.processedSheets.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Detected Excel Worksheets</label>
                <div className="flex flex-wrap gap-1.5">
                  {importPreview.processedSheets.map((sh, idx) => (
                    <span key={idx} className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      <span className="text-emerald-700 font-extrabold">{sh.sheetName}</span>
                      <span className="text-slate-400">•</span>
                      <span>{sh.rowCount} rows ({sh.module})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Row Validation Warnings / Errors (if any rows failed required validation) */}
            {importPreview.rowErrors && importPreview.rowErrors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {importPreview.rowErrors.length} row(s) had missing required fields and will be skipped:
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs text-slate-600">
                  {importPreview.rowErrors.map((err, idx) => (
                    <div key={idx} className="bg-white/90 p-2 rounded-lg border border-amber-200 flex items-start justify-between gap-2 shadow-2xs">
                      <div>
                        <span className="font-extrabold text-amber-900">{err.sheet ? `[${err.sheet}] ` : ''}Row {err.row}:</span>{' '}
                        <span className="text-slate-700">{err.message}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex-shrink-0">
                        Col: {err.column}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detected Module Badges */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Detected Data Breakdown</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">🐄 Animals</span>
                  <span className="text-xs font-extrabold text-emerald-700">{importPreview.counts.animals}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">🥛 Milk Records</span>
                  <span className="text-xs font-extrabold text-sky-700">{importPreview.counts.milkRecords}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">🌾 Feed & Usage</span>
                  <span className="text-xs font-extrabold text-amber-700">{importPreview.counts.feedItems + importPreview.counts.feedLogs}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">💉 Health & Vaccines</span>
                  <span className="text-xs font-extrabold text-rose-700">{importPreview.counts.healthRecords + importPreview.counts.vaccinations + importPreview.counts.medicines}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">🧬 Breeding & Calves</span>
                  <span className="text-xs font-extrabold text-purple-700">{importPreview.counts.calves + importPreview.counts.breedingRecords}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">👥 Staff & Customers</span>
                  <span className="text-xs font-extrabold text-indigo-700">{importPreview.counts.employees + importPreview.counts.customers}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">🛒 Sales & Invoices</span>
                  <span className="text-xs font-extrabold text-emerald-700">{importPreview.counts.sales}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">💰 Income & Expense</span>
                  <span className="text-xs font-extrabold text-emerald-700">{importPreview.counts.income + importPreview.counts.expenses}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">💳 Accounts & Payroll</span>
                  <span className="text-xs font-extrabold text-slate-700">{importPreview.counts.accounts + importPreview.counts.payroll}</span>
                </div>
              </div>
            </div>

            {/* Import Mode Options (No Duplication / No Redundancy) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Select Import Strategy</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Merge Option (Recommended / Default) */}
                <div
                  onClick={() => setImportMode('merge')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    importMode === 'merge'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800">Smart Merge (Append)</span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Preserves all existing animals and farm records. Appends only new records and prevents duplicate tags.
                  </p>
                </div>

                {/* Replace Option */}
                <div
                  onClick={() => setImportMode('replace')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    importMode === 'replace'
                      ? 'border-amber-600 bg-amber-50/60 shadow-2xs ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-slate-800 flex items-center space-x-1.5">
                      <span>Full Replace</span>
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      importMode === 'replace' ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Overwrite
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    Cleans out existing records and resets data solely to this backup file.
                  </p>
                </div>
              </div>

              {importMode === 'replace' && (
                <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-[11px] text-rose-800 font-semibold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Notice: Overwrite mode will erase current records and reset the data solely to this backup file.</span>
                </div>
              )}
            </div>

            {/* Confirmation Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={isImporting}
                onClick={() => {
                  setImportModalOpen(false);
                  setImportPreview(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleConfirmImport}
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                  importMode === 'replace' ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{importMode === 'replace' ? 'Overwriting & Restoring Data...' : 'Processing & Importing Data...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>
                      {importMode === 'replace'
                        ? 'Confirm Overwrite & Replace'
                        : importPreview?.fileType === 'excel'
                        ? 'Confirm & Import Excel Records'
                        : 'Confirm & Restore Backup'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Complete Import Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setImportResult(null);
        }}
        title="Database Restore & Import Report"
        maxWidth="max-w-2xl"
      >
        {importResult && (
          <div className="space-y-5">
            {/* Top Stat Summary Grid: Total Records → Imported → Updated → Skipped → Failed */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Records</span>
                <span className="text-xl font-extrabold text-slate-800">{importResult.totalFound ?? 0}</span>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Imported</span>
                <span className="text-xl font-extrabold text-emerald-800">{importResult.totalInserted ?? 0}</span>
              </div>
              <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Updated</span>
                <span className="text-xl font-extrabold text-indigo-800">{importResult.totalUpdated ?? 0}</span>
              </div>
              <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-sky-700 uppercase tracking-wider">Skipped</span>
                <span className="text-xl font-extrabold text-sky-800">{importResult.totalSkipped ?? 0}</span>
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-2xl text-center">
                <span className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">Failed</span>
                <span className={`text-xl font-extrabold ${(importResult.totalFailed || 0) > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {importResult.totalFailed ?? 0}
                </span>
              </div>
            </div>

            {/* Module Breakdown List */}
            {importResult.modules && Object.keys(importResult.modules).length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Module-wise Breakdown</label>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {Object.entries(importResult.modules)
                    .filter(([, m]) => (m.found || 0) > 0 || (m.inserted || 0) > 0 || (m.skipped || 0) > 0 || (m.updated || 0) > 0)
                    .map(([key, m]) => (
                      <div key={key} className="p-2.5 px-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60">
                        <span className="font-bold text-slate-700 capitalize flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                        </span>
                        <div className="flex items-center space-x-3 text-[11px]">
                          <span className="text-slate-500">Found: <strong>{m.found}</strong></span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">+{m.inserted} imported</span>
                          {(m.updated || 0) > 0 && (
                            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded">{m.updated} updated</span>
                          )}
                          {m.skipped > 0 && (
                            <span className="text-sky-700 font-medium bg-sky-50 px-2 py-0.5 rounded">{m.skipped} skipped</span>
                          )}
                          {m.failed > 0 && (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">{m.failed} failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Error logs if any */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-xs font-bold text-rose-800 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Validation / Import Warnings (Module • Row • Field • Reason)</span>
                </span>
                <div className="max-h-36 overflow-y-auto text-[11px] text-rose-700 space-y-1 pl-3 font-mono">
                  {importResult.errors.map((err, i) => {
                    const mod = err.module ? `[${err.module}] ` : '';
                    const loc = err.row || err.record || err.index ? `Row ${err.row || err.record || err.index}: ` : '';
                    const fld = err.field ? `Field "${err.field}" - ` : '';
                    const msg = err.reason || err.message || (typeof err === 'string' ? err : JSON.stringify(err));
                    return (
                      <p key={i} className="leading-tight">
                        • <strong className="font-bold text-rose-900">{mod}{loc}</strong>{fld}{msg}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  setImportResult(null);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Close Report
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
