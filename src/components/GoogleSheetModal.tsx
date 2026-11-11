import React, { useState } from 'react';
import { X, Database, ExternalLink, RefreshCw, PlusCircle, CheckCircle, AlertCircle, FileSpreadsheet, Lock } from 'lucide-react';
import { Crop, Pest, Disease, FarmingTip } from '../types';
import {
  createAgriNexSpreadsheet,
  fetchAllSheetData,
  pushFullDataToSheet,
  saveStoredSpreadsheetId
} from '../services/sheets';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  spreadsheetId: string | null;
  onSpreadsheetConnected: (id: string) => void;
  crops: Crop[];
  pests: Pest[];
  diseases: Disease[];
  tips: FarmingTip[];
  onDataLoadedFromSheet: (data: { crops: Crop[]; pests: Pest[]; diseases: Disease[]; tips: FarmingTip[] }) => void;
  isOwner: boolean;
  userEmail?: string | null;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  spreadsheetId,
  onSpreadsheetConnected,
  crops,
  pests,
  diseases,
  tips,
  onDataLoadedFromSheet,
  isOwner,
  userEmail
}) => {
  const [inputSheetId, setInputSheetId] = useState(spreadsheetId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Extract ID if user pastes full Google Sheets URL
  const sanitizeSheetId = (input: string) => {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return urlMatch ? urlMatch[1] : trimmed;
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Please sign in with Google first to create a spreadsheet.' });
      return;
    }
    if (!isOwner) {
      setStatusMessage({ type: 'error', text: 'Only the verified owner can create or configure the database spreadsheet.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await createAgriNexSpreadsheet(accessToken, { crops, pests, diseases, tips });
      onSpreadsheetConnected(res.spreadsheetId);
      setInputSheetId(res.spreadsheetId);
      setStatusMessage({
        type: 'success',
        text: `Successfully created and initialized "AgriNex Database" in your Google Drive!`
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create spreadsheet. Please check your connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectExisting = async () => {
    const cleanId = sanitizeSheetId(inputSheetId);
    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Google Spreadsheet ID or URL.' });
      return;
    }
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'Please sign in with Google first.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const loaded = await fetchAllSheetData(accessToken, cleanId);
      onSpreadsheetConnected(cleanId);
      saveStoredSpreadsheetId(cleanId);
      if (loaded.crops.length > 0 || loaded.pests.length > 0) {
        onDataLoadedFromSheet(loaded);
      }
      setStatusMessage({
        type: 'success',
        text: `Connected to spreadsheet! Loaded ${loaded.crops.length} crops, ${loaded.pests.length} pests, and ${loaded.diseases.length} diseases.`
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Could not connect to sheet (${err.message}). Ensure the sheet is shared or created with your account.`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncFromSheet = async () => {
    if (!spreadsheetId || !accessToken) return;
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const loaded = await fetchAllSheetData(accessToken, spreadsheetId);
      onDataLoadedFromSheet(loaded);
      setStatusMessage({
        type: 'success',
        text: `Synced latest changes from Google Sheet (${loaded.crops.length} crops updated).`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Sync failed: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToSheet = async () => {
    if (!spreadsheetId || !accessToken) return;
    if (!isOwner) {
      setStatusMessage({ type: 'error', text: 'Only the site owner can push edits to the database.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      await pushFullDataToSheet(accessToken, spreadsheetId, { crops, pests, diseases, tips });
      setStatusMessage({
        type: 'success',
        text: 'Successfully updated Google Sheet with all current crops, pests, and tips!'
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to update sheet: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheets-modal-title"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-700 to-green-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 id="sheets-modal-title" className="text-xl font-bold">
                Google Sheets Database Sync
              </h3>
              <p className="text-xs text-emerald-200">
                Live two-way spreadsheet storage for crops, pests & diseases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}

          {/* Owner Verification Notice */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Owner Access Status:</span>
            </div>
            {isOwner ? (
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Verified Owner ({userEmail})
              </span>
            ) : (
              <span className="font-medium text-stone-500">
                {userEmail ? 'Signed in as non-owner (Read-only)' : 'Public visitor mode'}
              </span>
            )}
          </div>

          {/* Option A: One-click Create New Sheet */}
          {isOwner && (
            <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-left">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    Create New AgriNex Spreadsheet
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Automatically initializes a new Google Sheet in your Google Drive with formatted tabs for Crops, Pests, Diseases, and Tips.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateNewSheet}
                disabled={isLoading}
                className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isLoading ? 'Creating Sheet...' : 'Create & Link Google Sheet'}</span>
              </button>
            </div>
          )}

          {/* Option B: Link existing or active spreadsheet */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
              Google Spreadsheet ID or URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputSheetId}
                onChange={(e) => setInputSheetId(e.target.value)}
                placeholder="Paste Spreadsheet ID or full Google Docs URL..."
                className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleConnectExisting}
                disabled={isLoading}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-60 shrink-0"
              >
                {isLoading ? 'Connecting...' : 'Connect Sheet'}
              </button>
            </div>
            <p className="text-[11px] text-stone-400 mt-1.5">
              Example: https://docs.google.com/spreadsheets/d/<strong>1BxiMVs0XRA5...</strong>/edit
            </p>
          </div>

          {/* Active Sheet Sync Controls */}
          {spreadsheetId && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" /> Currently Connected:
                </span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Open in Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSyncFromSheet}
                  disabled={isLoading}
                  className="px-3 py-2 bg-white border border-stone-300 hover:border-emerald-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Pull Latest from Sheet</span>
                </button>

                {isOwner && (
                  <button
                    type="button"
                    onClick={handlePushToSheet}
                    disabled={isLoading}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Push App Edits to Sheet</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
