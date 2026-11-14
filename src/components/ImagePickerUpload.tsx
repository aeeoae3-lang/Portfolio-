import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Trash2,
  Camera,
  AlertCircle,
  Sparkles,
  Library
} from 'lucide-react';
import {
  validateImageFile,
  formatFileSize,
  compressImageFile,
  getRecommendedPresets,
  PresetImage,
  isDataUrl
} from '../utils/imageUtils';

interface ImagePickerUploadProps {
  value?: string;
  onChange: (dataUrlOrUrl: string) => void;
  label?: string;
  category?: 'crop' | 'pest' | 'disease' | 'tip';
  required?: boolean;
  testId?: string;
  onProcessingChange?: (isBusy: boolean) => void;
}

export const ImagePickerUpload: React.FC<ImagePickerUploadProps> = ({
  value,
  onChange,
  label = 'Photo / Image',
  category = 'crop',
  required = false,
  testId,
  onProcessingChange
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const presets = getRecommendedPresets(category);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }

    setIsProcessing(true);
    onProcessingChange?.(true);
    try {
      const result = await compressImageFile(file, 720, 540, 0.72, 95 * 1024);
      onChange(result.dataUrl);
      setFileDetails({
        name: file.name,
        size: result.sizeBytes
      });
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMessage(err.message || 'Failed to process image. Please try another file.');
    } finally {
      setIsProcessing(false);
      onProcessingChange?.(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setFileDetails(null);
    setErrorMessage(null);
  };

  const handleSelectPreset = (preset: PresetImage) => {
    onChange(preset.url);
    setFileDetails({
      name: preset.label,
      size: 0
    });
    setErrorMessage(null);
  };

  const hasImage = Boolean(value && value.trim());

  return (
    <div className="space-y-3" data-testid={testId}>
      {/* Label & Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs sm:text-sm font-bold text-stone-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Tab Switcher: Device Upload vs Preset Library */}
        <div className="flex items-center gap-1 p-0.5 bg-stone-100 rounded-xl border border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload from Device</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>Presets ({presets.length})</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label={`Upload ${label} from device`}
      />

      {/* Current Image Preview Card if an image is selected */}
      {hasImage && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-stone-900/5 shadow-xs p-3 flex flex-col sm:flex-row items-center gap-3">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-28 h-32 sm:h-24 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200 shadow-2xs">
            <img
              src={value}
              alt="Selected Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80';
              }}
            />
            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold shadow-2xs flex items-center gap-0.5">
              <Check className="w-3 h-3" />
              <span>Active</span>
            </div>
          </div>

          {/* Details & Controls */}
          <div className="flex-1 min-w-0 text-center sm:text-left w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                {fileDetails?.name || (isDataUrl(value!) ? 'Uploaded Device Photo' : 'Selected Agricultural Photo')}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {fileDetails?.size
                ? `Optimized for web: ${formatFileSize(fileDetails.size)}`
                : isDataUrl(value!)
                ? 'High-res device capture ready for instant display'
                : 'High-definition agriculture profile image'}
            </p>

            {/* Quick Action buttons */}
            <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Change Photo</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Upload from Device Drop Zone */}
      {activeTab === 'upload' && !hasImage && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
              : 'border-stone-300 hover:border-emerald-400 bg-stone-50/60 hover:bg-emerald-50/20'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-2xs">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6 stroke-[2]" />
            )}
          </div>

          <p className="text-xs sm:text-sm font-bold text-stone-800">
            {isProcessing ? 'Optimizing photo for display...' : 'Tap to select photo from device or camera'}
          </p>
          <p className="text-[11px] text-stone-500 mt-1 max-w-sm">
            Supports JPG, PNG, WebP or Camera snaps on phone (automatically compressed for fast loading)
          </p>

          <button
            type="button"
            disabled={isProcessing}
            className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Choose Photo from Device</span>
          </button>
        </div>
      )}

      {/* TAB 2: Curated Agricultural Presets */}
      {activeTab === 'presets' && (
        <div className="space-y-2 bg-stone-50/60 p-3.5 rounded-2xl border border-stone-200">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
            <span className="font-semibold flex items-center gap-1 text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Verified Agricultural Photos
            </span>
            <span>Tap to apply</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
            {presets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-300 shadow-sm'
                      : 'border-stone-200 hover:border-emerald-400'
                  }`}
                >
                  <div className="h-20 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-1.5 bg-white text-[11px] font-bold text-stone-800 truncate text-center">
                    {preset.label}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
