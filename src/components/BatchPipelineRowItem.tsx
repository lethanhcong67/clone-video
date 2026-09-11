import React, { useState, useRef } from 'react';
import {
  Trash2,
  RefreshCw,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  Play,
  Film,
  Sparkles,
  Layers,
  Maximize2,
  Subtitles,
  CheckCheck,
  User,
  Shirt,
  CheckSquare,
  Square,
  Lock,
  ShieldCheck,
  UserCheck,
  Check,
  RotateCcw,
  Pencil,
  Mountain,
  Settings,
  ChevronDown,
  ChevronUp,
  Camera,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  FileText,
  Copy,
  X,
  RotateCw,
  UploadCloud,
  Plus,
  ImagePlus,
} from 'lucide-react';
import { AppliedReplacementConfig, BatchImageItem, BatchSettings, OutfitReference, ApiConfig } from '../types';
import { fileToDataUrl, downloadImage, downloadVideo } from '../utils/imageUtils';
import { generateFullPromptText } from '../utils/promptHelper';

interface BatchPipelineRowItemProps {
  item: BatchImageItem;
  index: number;
  settings: BatchSettings;
  apiConfig?: ApiConfig;
  uploadedOutfit?: OutfitReference | null;
  uploadedOutfits?: OutfitReference[];
  isProcessingAll: boolean;
  onUpdateItem: (id: string, updates: Partial<BatchImageItem>) => void;
  onRemoveItem: (id: string) => void;
  onProcessSingleItem: (item: BatchImageItem) => Promise<void>;
  onOpenKlingSettings?: () => void;
  onOpenLightbox: (url: string, title: string) => void;
  onGenerateKlingVideo: (item: BatchImageItem) => void;
  onGenerateInstantVideo: (item: BatchImageItem) => void;
}

export const BatchPipelineRowItem: React.FC<BatchPipelineRowItemProps> = ({
  item,
  index,
  settings,
  apiConfig,
  uploadedOutfit,
  uploadedOutfits = [],
  isProcessingAll,
  onUpdateItem,
  onRemoveItem,
  onProcessSingleItem,
  onOpenKlingSettings,
  onOpenLightbox,
  onGenerateKlingVideo,
  onGenerateInstantVideo,
}) => {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isFullPromptModalOpen, setIsFullPromptModalOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [localPrompt, setLocalPrompt] = useState<string>('');
  const [isSavedToast, setIsSavedToast] = useState(false);

  const isRowProcessing = item.status === 'processing';
  const isRowCompleted = item.status === 'completed' && Boolean(item.resultImageUrl);
  const isRowError = item.status === 'error';
  const hasVideo = Boolean(item.videoUrl);
  const isVideoGenerating = item.videoStatus === 'generating';

  // Default auto-generated prompt
  const defaultPromptText = generateFullPromptText(item, settings, uploadedOutfits, uploadedOutfit);
  const activePromptText = (item.customPrompt || item.appliedConfig?.customPrompt || defaultPromptText).trim();
  const isPromptCustomized = Boolean(
    (item.customPrompt || item.appliedConfig?.customPrompt) &&
    (item.customPrompt || item.appliedConfig?.customPrompt)?.trim() !== defaultPromptText.trim()
  );

  const handleOpenPromptModal = () => {
    setLocalPrompt(item.customPrompt || item.appliedConfig?.customPrompt || defaultPromptText);
    setIsFullPromptModalOpen(true);
  };

  const handleSaveCustomPrompt = () => {
    const trimmed = localPrompt.trim();
    onUpdateItem(item.id, {
      customPrompt: trimmed,
      appliedConfig: {
        ...(item.appliedConfig || {
          enableCharacter: item.appliedConfig?.enableCharacter ?? settings.enableCharacter,
          enableOutfit: item.appliedConfig?.enableOutfit ?? settings.enableOutfit,
          characterPrompt: appliedCharacter,
          outfitPrompt: appliedOutfitPrompt,
        }),
        customPrompt: trimmed,
        appliedAt: Date.now(),
      },
    });

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleResetToDefaultPrompt = () => {
    const freshDefault = generateFullPromptText(item, settings, uploadedOutfits, uploadedOutfit);
    setLocalPrompt(freshDefault);
    onUpdateItem(item.id, {
      customPrompt: undefined,
      appliedConfig: item.appliedConfig ? {
        ...item.appliedConfig,
        customPrompt: undefined,
        appliedAt: Date.now(),
      } : undefined,
    });

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const rowFileInputRef = useRef<HTMLInputElement>(null);

  const handleRowFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = (Array.from(files) as File[]).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newRefs: OutfitReference[] = [];
    const currentList = item.appliedConfig?.productReferences && item.appliedConfig.productReferences.length > 0
      ? item.appliedConfig.productReferences
      : (uploadedOutfits.length > 0 ? uploadedOutfits : (uploadedOutfit ? [uploadedOutfit] : []));

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const refIndex = currentList.length + i + 2;
        const newRef: OutfitReference = {
          id: `row_ref_${item.id}_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          previewUrl: dataUrl,
          dataUrl,
          mimeType: file.type || 'image/jpeg',
          description: `Ảnh tham chiếu riêng ref${refIndex}: ${file.name}`,
          category: 'uploaded',
        };
        newRefs.push(newRef);
      } catch (err) {
        console.error('Lỗi đọc ảnh tham chiếu hàng:', err);
      }
    }

    if (newRefs.length > 0) {
      const updatedList = [...currentList, ...newRefs];
      updateItemConfig({
        productReferences: updatedList,
        outfitImageUrl: updatedList[0]?.dataUrl || updatedList[0]?.previewUrl || null,
        outfitImageName: updatedList[0]?.name || null,
        enableOutfit: true,
      });
    }

    if (rowFileInputRef.current) {
      rowFileInputRef.current.value = '';
    }
  };

  const handleRemoveRowRef = (refId: string) => {
    const currentList = item.appliedConfig?.productReferences || [];
    const filtered = currentList.filter((r) => r.id !== refId);
    updateItemConfig({
      productReferences: filtered.length > 0 ? filtered : undefined,
      outfitImageUrl: filtered[0]?.dataUrl || filtered[0]?.previewUrl || null,
      outfitImageName: filtered[0]?.name || null,
    });
  };

  const handleResetToGlobalRefs = () => {
    updateItemConfig({
      productReferences: undefined,
      outfitImageUrl: uploadedOutfits[0]?.previewUrl || uploadedOutfit?.previewUrl || null,
      outfitImageName: uploadedOutfits[0]?.name || uploadedOutfit?.name || null,
    });
  };

  // Applied config data for this specific row
  const appliedCharacter = item.appliedConfig?.characterPrompt || settings.characterPrompt;
  const hasCustomRowRefs = Boolean(
    item.appliedConfig?.productReferences && item.appliedConfig.productReferences.length > 0
  );
  const appliedProductReferences: OutfitReference[] =
    item.appliedConfig?.productReferences && item.appliedConfig.productReferences.length > 0
      ? item.appliedConfig.productReferences
      : (uploadedOutfits.length > 0 ? uploadedOutfits : (uploadedOutfit ? [uploadedOutfit] : []));
  const appliedOutfitName = appliedProductReferences[0]?.name || item.appliedConfig?.outfitImageName || uploadedOutfit?.name;
  const appliedOutfitImg = appliedProductReferences[0]?.previewUrl || item.appliedConfig?.outfitImageUrl || uploadedOutfit?.previewUrl;
  const appliedOutfitPrompt = item.appliedConfig?.outfitPrompt || settings.outfitPrompt;
  const isConfigApplied = Boolean(item.appliedConfig?.appliedAt);

  // Helper to update applied configuration
  const updateItemConfig = (updates: Partial<AppliedReplacementConfig>) => {
    const currentConfig: AppliedReplacementConfig = item.appliedConfig || {
      enableCharacter: item.appliedConfig?.enableCharacter ?? settings.enableCharacter,
      enableOutfit: item.appliedConfig?.enableOutfit ?? settings.enableOutfit,
      enableBackground: item.appliedConfig?.enableBackground ?? Boolean(settings.backgroundPrompt?.trim()),
      characterPrompt: appliedCharacter,
      outfitPrompt: appliedOutfitPrompt,
      backgroundPrompt: item.appliedConfig?.backgroundPrompt ?? settings.backgroundPrompt ?? '',
      productReferences: appliedProductReferences,
      outfitImageUrl: appliedOutfitImg || null,
      outfitImageName: appliedOutfitName || null,
      preservePose: item.appliedConfig?.preservePose ?? settings.preservePose,
      appliedAt: Date.now(),
    };

    onUpdateItem(item.id, {
      appliedConfig: {
        ...currentConfig,
        ...updates,
        appliedAt: Date.now(),
      },
    });
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const ext = url.includes('.webp') ? '.webp' : url.includes('.jpeg') || url.includes('.jpg') ? '.jpg' : '.png';
    const baseName = filename.replace(/\.[^/.]+$/, '');
    downloadImage(url, `swapped_${baseName}${ext}`);
  };

  const handleDownloadVideo = (url: string, filename: string) => {
    const isMp4 = url.includes('.mp4') || (!url.startsWith('blob:') && !url.includes('.webm'));
    const ext = isMp4 ? '.mp4' : '.webm';
    const baseName = filename.replace(/\.[^/.]+$/, '');
    downloadVideo(url, `video_${baseName}${ext}`);
  };



  return (
    <div
      id={`pipeline-row-${item.id}`}
      className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-xs ${
        isRowProcessing
          ? 'border-indigo-400 ring-2 ring-indigo-100'
          : isRowCompleted
          ? 'border-stone-200 hover:border-stone-300'
          : 'border-stone-200'
      }`}
    >
      {/* Row Top Header */}
      <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-stone-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            #{index + 1}
          </span>
          <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
            {item.name}
          </span>
          <span className="text-[11px] text-stone-400 shrink-0 font-medium hidden sm:inline">
            {(item.size / 1024).toFixed(0)} KB
            {item.originalDimensions && ` • ${item.originalDimensions.width}×${item.originalDimensions.height}`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">

          {isRowProcessing && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
              Đang tạo ảnh AI...
            </span>
          )}
          {isRowCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã xong ảnh mới
            </span>
          )}
          {isRowError && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Lỗi tạo ảnh
            </span>
          )}
          {hasVideo && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200">
              <Film className="w-3 h-3" />
              Đã có video
            </span>
          )}

          <button
            type="button"
            onClick={() => onRemoveItem(item.id)}
            disabled={isRowProcessing || isProcessingAll}
            className="w-7 h-7 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            title="Xóa hàng này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row Body: 4 Symmetrical Parallel Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch">
        
        {/* COLUMN 1: Original Image */}
        <div className="flex flex-col bg-stone-50/80 rounded-xl p-3 border border-stone-200/90 h-[430px] sm:h-[460px] justify-between shadow-2xs">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                1. Ảnh gốc cần thay thế
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenLightbox(item.dataUrl, `Ảnh gốc: ${item.name}`)}
                  className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
                  title="Phóng to ảnh gốc"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 w-full min-h-0 rounded-lg overflow-hidden bg-stone-900/5 border border-stone-200/80 shadow-2xs group flex items-center justify-center my-1">
              <img
                src={item.dataUrl}
                alt={`Original ${item.name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain transition-all duration-200"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenLightbox(item.dataUrl, `Ảnh gốc: ${item.name}`)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/95 text-stone-900 text-xs font-semibold shadow-md hover:bg-white cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem ảnh gốc
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 shrink-0">
            <span>Sẵn sàng thay đổi</span>
            <button
              type="button"
              onClick={() => onProcessSingleItem(item)}
              disabled={isRowProcessing || isProcessingAll}
              className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline flex items-center gap-1 disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Tạo riêng ảnh này</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: Target Character & Outfit / Product replacement */}
        <div className="flex flex-col bg-stone-50/80 rounded-xl p-3 border border-stone-200/90 h-[430px] sm:h-[460px] justify-between shadow-2xs">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                2. Cấu hình thay thế
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenPromptModal}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer border ${
                    isPromptCustomized
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300'
                      : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border-indigo-200/80'
                  }`}
                  title="Xem và chỉnh sửa toàn bộ prompt AI gửi đi cho ảnh này"
                >
                  <Eye className="w-3 h-3 text-indigo-600" />
                  <span>{isPromptCustomized ? 'Prompt đã sửa ✨' : 'Xem & Sửa prompt'}</span>
                </button>
                {isConfigApplied ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                    <CheckCheck className="w-3 h-3" />
                    Đã đồng bộ
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-medium">Theo mẫu chung</span>
                )}
              </div>
            </div>

            {/* Scrollable specs container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 my-1">
              
              {/* Sub-item A: Character */}
              {(() => {
                const isCharEnabled = Boolean(item.appliedConfig?.enableCharacter);
                const isPosePreserved = item.appliedConfig?.preservePose ?? true;
                const currentCharVal = item.appliedConfig?.characterPrompt || '';

                return (
                  <div
                    className={`p-2.5 rounded-lg border transition-all ${
                      isCharEnabled
                        ? 'bg-white border-violet-300 shadow-2xs'
                        : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900">
                        <User className={`w-3.5 h-3.5 ${isCharEnabled ? 'text-violet-600' : 'text-emerald-600'}`} />
                        <span>Tùy chọn nhân vật:</span>
                      </div>

                      {/* Segmented Switch: Giữ người gốc vs Đổi nhân vật */}
                      <div className="inline-flex rounded-md p-0.5 bg-stone-200/80 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            updateItemConfig({
                              enableCharacter: false,
                            });
                          }}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            !isCharEnabled
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Giữ người gốc
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateItemConfig({
                              enableCharacter: true,
                              characterPrompt: currentCharVal || '',
                            });
                          }}
                          className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                            isCharEnabled
                              ? 'bg-violet-600 text-white shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Đổi nhân vật
                        </button>
                      </div>
                    </div>

                    {isCharEnabled ? (
                      <div className="space-y-1.5">
                        <textarea
                          rows={2}
                          value={currentCharVal}
                          onChange={(e) => {
                            updateItemConfig({
                              characterPrompt: e.target.value,
                              enableCharacter: true,
                            });
                          }}
                          placeholder="Nhập mô tả nhân vật mới: tuổi, giới tính, phong cách, tóc..."
                          className="w-full text-xs font-medium text-stone-800 bg-stone-50/80 hover:bg-white focus:bg-white border border-stone-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-200 rounded p-1.5 transition-all resize-none outline-none leading-relaxed placeholder:text-stone-400"
                        />
                        <div className="flex items-center justify-between gap-1 pt-0.5 text-[10.5px]">
                          <button
                            type="button"
                            onClick={() => updateItemConfig({ preservePose: !isPosePreserved })}
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              isPosePreserved
                                ? 'text-violet-700 bg-violet-50 border-violet-200'
                                : 'text-stone-500 bg-stone-100 border-stone-200'
                            }`}
                          >
                            <Check className={`w-3 h-3 ${isPosePreserved ? 'opacity-100 text-violet-600' : 'opacity-0'}`} />
                            <span>{isPosePreserved ? 'Giữ dáng gốc' : 'Dáng tự do'}</span>
                          </button>
                          <span className="text-[10px] text-stone-400">
                            {currentCharVal.length} ký tự
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium bg-emerald-100/60 px-2 py-1.5 rounded border border-emerald-200/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">Giữ 100% người mẫu & biểu cảm của ảnh gốc</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sub-item B: Outfit & Target Products */}
              {(() => {
                const isOutfitActive = item.appliedConfig?.enableOutfit !== false;
                return (
                  <div
                    className={`p-2 rounded-lg border transition-all ${
                      isOutfitActive
                        ? 'bg-white border-emerald-200 shadow-2xs'
                        : 'bg-stone-100/70 border-stone-200'
                    }`}
                  >
                    {/* Hidden file input for uploading row-specific reference image */}
                    <input
                      ref={rowFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleRowFileUpload}
                      className="hidden"
                    />

                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-900">
                        <Shirt className={`w-3.5 h-3.5 ${isOutfitActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                        <span>Trang phục / Đồ:</span>
                        {hasCustomRowRefs && (
                          <span className="text-[9.5px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-1.5 py-0.2 rounded-full">
                            Ảnh riêng
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {hasCustomRowRefs && (
                          <button
                            type="button"
                            onClick={handleResetToGlobalRefs}
                            className="text-[10px] text-stone-400 hover:text-emerald-700 font-medium underline inline-flex items-center gap-0.5 cursor-pointer mr-0.5"
                            title="Khôi phục về ảnh tham chiếu chung của cột bên trái"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Mẫu chung</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => updateItemConfig({ enableOutfit: !isOutfitActive })}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            isOutfitActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/80'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300 border border-stone-300'
                          }`}
                        >
                          {isOutfitActive ? (
                            <>
                              <CheckSquare className="w-3 h-3 text-emerald-600" />
                              <span>Thay thế</span>
                            </>
                          ) : (
                            <>
                              <Square className="w-3 h-3 text-stone-400" />
                              <span>Giữ gốc</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isOutfitActive ? (
                      <div className="space-y-1.5">
                        {/* Reference Images Toolbar & Thumbnails */}
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          {appliedProductReferences.map((prod, pIdx) => {
                            const pRefTag = `Ref ${pIdx + 2}`;
                            const isRowCustomSingle = item.appliedConfig?.productReferences?.some((r) => r.id === prod.id);
                            return (
                              <div
                                key={prod.id || pIdx}
                                className="group relative flex items-center gap-1 p-0.5 pr-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/90 transition-colors shadow-2xs"
                                title={
                                  prod.analysis
                                    ? `✨ Đã phân tích AI: ${prod.analysis.productName}\n🎨 Màu sắc: ${prod.analysis.colors}\n🌸 Họa tiết: ${prod.analysis.patterns}\n🔤 Chữ/Logo: ${prod.analysis.textOrTypography || 'Không có'}`
                                    : `${pRefTag}: ${prod.name}`
                                }
                              >
                                <div
                                  className="w-6 h-6 rounded overflow-hidden bg-stone-100 cursor-pointer shrink-0 border border-emerald-300/60"
                                  onClick={() => onOpenLightbox(prod.previewUrl || prod.dataUrl || '', `${pRefTag}: ${prod.name}`)}
                                >
                                  <img
                                    src={prod.previewUrl || prod.dataUrl}
                                    alt={prod.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <span className="text-[9.5px] font-bold text-emerald-900">{pRefTag}</span>
                                  {prod.analysis && (
                                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                  )}
                                </div>
                                {isRowCustomSingle && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveRowRef(prod.id);
                                    }}
                                    className="ml-0.5 p-0.5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Xóa ảnh tham chiếu này khỏi hàng"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {/* Add/Upload new reference image for this row button */}
                          <button
                            type="button"
                            onClick={() => rowFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/90 border border-emerald-300/90 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                            title="Tải lên ảnh mẫu/sản phẩm tham chiếu riêng cho hàng này"
                          >
                            <Plus className="w-3 h-3 text-emerald-700" />
                            <span>Tải ảnh ref mới</span>
                          </button>
                        </div>

                        {appliedProductReferences.length === 0 && !appliedOutfitImg && (
                          <button
                            type="button"
                            onClick={() => rowFileInputRef.current?.click()}
                            className="w-full py-2 px-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <UploadCloud className="w-4 h-4 text-emerald-600" />
                            <span>Bấm để tải ảnh tham chiếu riêng cho hàng này</span>
                          </button>
                        )}

                        <textarea
                          rows={2}
                          value={item.appliedConfig?.outfitPrompt !== undefined ? item.appliedConfig.outfitPrompt : appliedOutfitPrompt}
                          onChange={(e) => updateItemConfig({ outfitPrompt: e.target.value })}
                          placeholder={`Thay thế chính xác ${item.appliedConfig?.productName || settings.productName || 'sản phẩm'} theo ảnh tham chiếu image2 vào hình gốc image1 (xóa bỏ sản phẩm cũ ở image1)`}
                          className="w-full text-xs font-medium text-stone-800 bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 rounded p-1.5 transition-all resize-none outline-none leading-relaxed placeholder:text-stone-400 placeholder:italic"
                        />
                        {item.appliedConfig?.outfitPrompt !== undefined && item.appliedConfig.outfitPrompt !== settings.outfitPrompt && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => updateItemConfig({ outfitPrompt: settings.outfitPrompt })}
                              className="text-[10px] text-stone-400 hover:text-emerald-600 font-medium underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Mẫu chung</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 py-0.5">
                        <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>Giữ nguyên trang phục ảnh gốc</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sub-item C: Background */}
              {(() => {
                const hasBgPrompt = Boolean(
                  (item.appliedConfig?.backgroundPrompt !== undefined
                    ? item.appliedConfig.backgroundPrompt.trim()
                    : (settings.backgroundPrompt?.trim() || ''))
                );
                const isBgActive = Boolean(
                  item.appliedConfig?.enableBackground !== undefined
                    ? item.appliedConfig.enableBackground
                    : hasBgPrompt
                );
                const currentBgVal =
                  item.appliedConfig?.backgroundPrompt !== undefined
                    ? item.appliedConfig.backgroundPrompt
                    : (settings.backgroundPrompt || '');
                const isCustomBg =
                  item.appliedConfig?.backgroundPrompt !== undefined &&
                  item.appliedConfig.backgroundPrompt !== settings.backgroundPrompt;

                return (
                  <div
                    className={`p-2 rounded-lg border transition-all ${
                      isBgActive
                        ? 'bg-white border-sky-200 shadow-2xs'
                        : 'bg-stone-100/70 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                        <Mountain className={`w-3.5 h-3.5 ${isBgActive ? 'text-sky-600' : 'text-stone-500'}`} />
                        <span>Bối cảnh / Nền:</span>
                        {isCustomBg && (
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1 py-0.2 rounded leading-none">
                            Riêng
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextActive = !isBgActive;
                          updateItemConfig({
                            enableBackground: nextActive,
                            backgroundPrompt: nextActive ? currentBgVal : '',
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          isBgActive
                            ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-300/80'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300 border border-stone-300'
                        }`}
                      >
                        {isBgActive ? (
                          <>
                            <Check className="w-3 h-3 text-sky-600" />
                            <span>Thay đổi</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-stone-500" />
                            <span>Giữ gốc</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isBgActive ? (
                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={currentBgVal}
                          onChange={(e) => updateItemConfig({ enableBackground: true, backgroundPrompt: e.target.value })}
                          placeholder="Mô tả bối cảnh mới (chỉ đổi nền, giữ nguyên vị trí sản phẩm & nhân vật)..."
                          className="w-full text-xs font-medium text-stone-800 bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 rounded p-1.5 transition-all resize-none outline-none leading-relaxed placeholder:text-stone-400 placeholder:italic"
                        />
                        <div className="flex items-center justify-between text-[10px] text-sky-800 font-medium">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>Chỉ đổi nền, giữ nguyên vị trí sản phẩm & người mẫu</span>
                          </span>
                          {isCustomBg && (
                            <button
                              type="button"
                              onClick={() => {
                                updateItemConfig({
                                  backgroundPrompt: settings.backgroundPrompt || '',
                                  enableBackground: Boolean(settings.backgroundPrompt?.trim()),
                                });
                              }}
                              className="text-stone-400 hover:text-sky-600 font-medium underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Mẫu chung</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium bg-stone-50 px-2 py-1 rounded border border-stone-200/60">
                        <span className="truncate">Giữ nguyên bối cảnh gốc</span>
                        <button
                          type="button"
                          onClick={() => updateItemConfig({ enableBackground: true, backgroundPrompt: currentBgVal || '' })}
                          className="text-[10.5px] font-bold text-sky-700 hover:underline flex items-center gap-0.5 ml-1 shrink-0 cursor-pointer"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>Đổi nền</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-stone-200/60 shrink-0">
              <button
                type="button"
                onClick={handleOpenPromptModal}
              className={`font-medium inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                isPromptCustomized
                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                  : 'text-stone-500 hover:text-indigo-600 hover:bg-stone-50'
              }`}
              title="Xem và chỉnh sửa toàn bộ prompt AI gửi đi cho ảnh này"
            >
              <FileText className={`w-3.5 h-3.5 ${isPromptCustomized ? 'text-amber-600' : 'text-indigo-500'}`} />
              <span>{isPromptCustomized ? 'Prompt đã sửa thủ công' : 'Xem & Sửa prompt'}</span>
              {isPromptCustomized && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const syncOutfits = uploadedOutfits.length > 0 ? uploadedOutfits : (uploadedOutfit ? [uploadedOutfit] : []);
                onUpdateItem(item.id, {
                  appliedConfig: {
                    enableCharacter: item.appliedConfig?.enableCharacter ?? true,
                    enableOutfit: item.appliedConfig?.enableOutfit ?? true,
                    enableBackground: item.appliedConfig?.enableBackground ?? Boolean(settings.backgroundPrompt?.trim()),
                    characterPrompt: settings.characterPrompt,
                    outfitPrompt: settings.outfitPrompt,
                    backgroundPrompt: settings.backgroundPrompt || '',
                    productReferences: syncOutfits,
                    outfitImageUrl: syncOutfits[0]?.dataUrl || syncOutfits[0]?.previewUrl || null,
                    outfitImageName: syncOutfits[0]?.name || null,
                    preservePose: settings.preservePose,
                    appliedAt: Date.now(),
                  },
                });
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>
      </div>

        {/* COLUMN 3: New AI Result Image */}
        <div className="flex flex-col bg-stone-50/80 rounded-xl p-3 border border-stone-200/90 h-[430px] sm:h-[460px] justify-between shadow-2xs">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isRowCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
                3. Ảnh AI tạo mới
              </span>

              <div className="flex items-center gap-1">
                {isRowCompleted && (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(item.resultImageUrl!, `Ảnh mới đã thay thế: ${item.name}`)}
                    className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
                    title="Phóng to ảnh mới"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Multiple variations buttons */}
            {isRowCompleted && item.resultImageUrls && item.resultImageUrls.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto py-1 mb-1 shrink-0">
                <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1 mr-0.5">
                  <Layers className="w-3 h-3" />
                  {item.resultImageUrls.length} biến thể:
                </span>
                {item.resultImageUrls.map((url, vIdx) => {
                  const isAct = (item.activeResultIndex ?? 0) === vIdx;
                  return (
                    <button
                      key={vIdx}
                      type="button"
                      onClick={() => {
                        onUpdateItem(item.id, {
                          activeResultIndex: vIdx,
                          resultImageUrl: url,
                        });
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        isAct
                          ? 'bg-indigo-600 text-white shadow-xs scale-105'
                          : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      Ảnh {vIdx + 1}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Display Area for New Image */}
            <div className="relative flex-1 w-full min-h-0 rounded-lg overflow-hidden bg-stone-900/5 border border-stone-200/80 shadow-2xs flex items-center justify-center my-1">
              {isRowCompleted && item.resultImageUrl ? (
                <div className="relative w-full h-full group flex items-center justify-center">
                  <img
                    src={item.resultImageUrl}
                    alt={`Result ${item.name}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain transition-all duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(item.resultImageUrl!, `Ảnh mới đã thay thế: ${item.name}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/95 text-stone-900 text-xs font-semibold shadow-md hover:bg-white cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Phóng to
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadImage(item.resultImageUrl!, item.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-md hover:bg-indigo-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải ảnh
                    </button>
                  </div>
                </div>
              ) : isRowProcessing ? (
                <div className="flex flex-col items-center justify-center p-4 text-center bg-indigo-50/50 w-full h-full">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mb-2" />
                  <p className="text-xs font-bold text-stone-800">Đang tạo ảnh bằng AI...</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">Xóa phụ đề & áp dụng nhân vật/sản phẩm</p>
                </div>
              ) : isRowError ? (
                <div className="flex flex-col items-center justify-center p-3 text-center bg-rose-50/70 w-full h-full rounded-lg border border-rose-200">
                  <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                  <p className="text-xs font-bold text-rose-800">Chưa tạo được ảnh từ AI</p>
                  <p className="text-[11px] text-rose-700 mt-1 max-w-[220px] line-clamp-2" title={item.error}>
                    {item.error || 'Vui lòng kiểm tra lại cấu hình API'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onProcessSingleItem(item)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-stone-300 rounded-lg w-full h-full bg-white/60">
                  <Sparkles className="w-6 h-6 text-stone-300 mb-1" />
                  <p className="text-xs font-semibold text-stone-600">Chưa tạo ảnh mới</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Áp dụng nhân vật & trang phục vào ảnh gốc
                  </p>
                  <button
                    type="button"
                    onClick={() => onProcessSingleItem(item)}
                    disabled={isProcessingAll}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Tạo ảnh AI
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 shrink-0">
            {isRowCompleted ? (
              <>
                <span className="text-emerald-700 font-medium">Ảnh AI đã sẵn sàng</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onProcessSingleItem(item)}
                    disabled={isRowProcessing || isProcessingAll}
                    className="text-stone-500 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer"
                    title="Tạo lại ảnh mới"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Tạo lại
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(item.resultImageUrl!, item.name)}
                    className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                    title="Tải ảnh về máy"
                  >
                    <Download className="w-3 h-3" />
                    Tải về
                  </button>
                </div>
              </>
            ) : (
              <span>Sẵn sàng tạo ảnh AI</span>
            )}
          </div>
        </div>

        {/* COLUMN 4: Video corresponding to this Row & Video Studio */}
        <div className="flex flex-col bg-stone-50/80 rounded-xl p-3 border border-stone-200/90 h-[430px] sm:h-[460px] justify-between shadow-2xs">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-violet-600" />
                4. Video Kling AI
              </span>

              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-100/80 text-violet-700 border border-violet-200/60">
                  {apiConfig?.kling?.model || 'kling-v2-6'} • {apiConfig?.kling?.duration || '5'}s
                </span>
                {onOpenKlingSettings && (
                  <button
                    type="button"
                    onClick={onOpenKlingSettings}
                    className="text-stone-400 hover:text-violet-600 p-1 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
                    title="Cấu hình API Key Kling AI"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Display / Generator Area for Video */}
            <div className="relative flex-1 w-full min-h-0 rounded-lg overflow-hidden flex flex-col justify-between my-1">
              
              {/* STATE 1: Completed Video */}
              {hasVideo && item.videoUrl ? (
                <div className="flex-1 flex flex-col min-h-0 justify-between">
                  <div className="relative flex-1 w-full min-h-0 rounded-lg overflow-hidden bg-black flex items-center justify-center group">
                    <video
                      src={item.videoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Optional prompt modification drawer when video already exists */}
                  {isPromptExpanded && (
                    <div className="mt-2 p-2.5 bg-white rounded-lg border border-violet-200 shadow-2xs space-y-1.5 animate-in fade-in duration-200">
                      <textarea
                        rows={2}
                        value={item.videoPrompt || ''}
                        onChange={(e) => onUpdateItem(item.id, { videoPrompt: e.target.value })}
                        placeholder="Nhập prompt video mới để tạo lại..."
                        className="w-full text-xs rounded border border-stone-300 p-1.5 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-stone-50/50 resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsPromptExpanded(false);
                            onGenerateKlingVideo(item);
                          }}
                          disabled={isVideoGenerating}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Tạo video mới</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isVideoGenerating ? (
                /* STATE 2: Video Generating Progress */
                <div className="flex flex-col items-center justify-center p-4 text-center bg-violet-50/70 border border-violet-200/80 rounded-lg w-full h-full">
                  <Loader2 className="w-7 h-7 text-violet-600 animate-spin mb-2" />
                  <p className="text-xs font-bold text-stone-800">Đang tạo video với Kling AI...</p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {item.videoTaskId ? `Task: ${item.videoTaskId.slice(0, 14)}...` : 'Đang gửi yêu cầu tạo video...'}
                  </p>
                  <div className="w-36 bg-stone-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-violet-600 h-full transition-all duration-300"
                      style={{ width: `${item.videoProgress || 20}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-violet-600 mt-1">{item.videoProgress || 20}%</span>
                </div>
              ) : item.videoStatus === 'error' ? (
                /* STATE 3: Video Error */
                <div className="flex flex-col items-center justify-center p-3 text-center bg-rose-50/70 border border-rose-200 rounded-lg w-full h-full">
                  <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
                  <p className="text-xs font-bold text-rose-800">Chưa tạo được video</p>
                  <p className="text-[11px] text-rose-700 mt-0.5 max-w-[220px] line-clamp-2" title={item.videoError}>
                    {item.videoError || 'Lỗi xử lý video từ Kling AI'}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onGenerateKlingVideo(item)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Thử lại
                    </button>
                    {onOpenKlingSettings && (
                      <button
                        type="button"
                        onClick={onOpenKlingSettings}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                      >
                        <Settings className="w-3 h-3" />
                        Cấu hình
                      </button>
                    )}
                  </div>
                </div>
              ) : isRowCompleted ? (
                /* STATE 4: Ready for Video Creation (Direct Manual Video Prompt Input) */
                <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-violet-200/80 shadow-2xs">
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    {/* Header: Manual Prompt Label */}
                    <div className="flex items-center justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 shrink-0">
                        <Film className="w-3.5 h-3.5 text-violet-600" />
                        <span>Prompt video:</span>
                      </div>
                      <span className="text-[10px] text-violet-600 font-medium bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                        Nhập thủ công
                      </span>
                    </div>

                    {/* Video Prompt Textarea */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      <textarea
                        rows={4}
                        value={item.videoPrompt || ''}
                        onChange={(e) => onUpdateItem(item.id, { videoPrompt: e.target.value })}
                        placeholder="Nhập prompt mô tả chuyển động video của bạn tại đây (ví dụ: người mẫu tạo dáng tự nhiên, quay chậm cinematic, giữ cố định form áo và logo)..."
                        className="w-full flex-1 min-h-[90px] text-xs rounded-md border border-stone-300 p-2 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1.5 focus:ring-violet-500 bg-stone-50/50 resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Submit Kling AI Video Button */}
                  <div className="mt-2 pt-2 border-t border-stone-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => onGenerateKlingVideo(item)}
                      disabled={isVideoGenerating}
                      className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Tạo video Kling AI</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* STATE 5: Idle (Before Image is Created) */
                <div className="flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-stone-200 rounded-lg w-full h-full bg-stone-100/40 text-stone-400">
                  <Film className="w-6 h-6 mb-1 text-stone-300" />
                  <p className="text-xs font-medium">Vị trí video tương ứng</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Sẽ kích hoạt sau khi ảnh AI ở Cột 3 được tạo xong
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom action for video */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-200/60 shrink-0">
            {hasVideo ? (
              <>
                <span className="text-violet-700 font-semibold">Video hoàn tất</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPromptExpanded((prev) => !prev)}
                    className="text-stone-500 hover:text-violet-600 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Sửa prompt</span>
                    {isPromptExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onGenerateKlingVideo(item)}
                    disabled={isVideoGenerating}
                    className="text-stone-500 hover:text-violet-600 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Tạo lại
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadVideo(item.videoUrl!, item.name)}
                    className="text-violet-600 hover:text-violet-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Tải video
                  </button>
                </div>
              </>
            ) : (
              <span>Cùng hàng với ảnh gốc & ảnh mới</span>
            )}
          </div>
        </div>
      </div>

      {/* Full AI Image Prompt Modal (Editable) */}
      {isFullPromptModalOpen && (
        <div
          id={`full-prompt-modal-${item.id}`}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsFullPromptModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>Prompt tạo ảnh AI đầy đủ</span>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                      Hàng #{index + 1} • {item.name}
                    </span>
                    {isPromptCustomized && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        ✨ Đang dùng Prompt tùy chỉnh
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Toàn bộ nội dung lệnh và hướng dẫn inpainting sẽ gửi sang AI để xử lý ảnh này. Bạn có thể trực tiếp chỉnh sửa bên dưới.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFullPromptModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0">
              {/* Quick Summary Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-medium block">Nhân vật</span>
                  <span className="font-bold text-stone-800 truncate block text-[11px]">
                    {item.appliedConfig?.enableCharacter
                      ? item.appliedConfig?.characterPrompt || 'Thay đổi nhân vật'
                      : 'Giữ 100% người gốc'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-medium block">Trang phục / Đồ</span>
                  <span className="font-bold text-emerald-700 truncate block text-[11px]">
                    {item.appliedConfig?.enableOutfit !== false ? 'Thay theo ref2' : 'Giữ đồ gốc'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-medium block">Bối cảnh / Nền</span>
                  <span className="font-bold text-stone-800 truncate block text-[11px]">
                    {item.appliedConfig?.enableBackground && item.appliedConfig?.backgroundPrompt
                      ? item.appliedConfig.backgroundPrompt
                      : 'Giữ bối cảnh gốc'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-medium block">Xóa phụ đề</span>
                  <span className="font-bold text-stone-800 truncate block text-[11px]">
                    {settings.removeSubtitles ? 'Đang bật' : 'Tắt'}
                  </span>
                </div>
              </div>

              {/* Full Editable Prompt Box */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Nội dung Prompt gửi sang AI (Cho phép chỉnh sửa trực tiếp):</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetToDefaultPrompt}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer border border-stone-300"
                      title="Khôi phục về prompt tự động sinh từ cấu hình hàng"
                    >
                      <RotateCcw className="w-3 h-3 text-stone-500" />
                      <span>Khôi phục mặc định</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(localPrompt);
                        setCopiedPrompt(true);
                        setTimeout(() => setCopiedPrompt(false), 2000);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={12}
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    placeholder="Nhập hoặc chỉnh sửa toàn bộ prompt tạo ảnh tại đây..."
                    className="w-full bg-stone-900 text-stone-100 rounded-xl p-3.5 font-mono text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-stone-800 shadow-inner resize-y select-text"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 pt-0.5">
                  <span>
                    💡 Bạn có thể tự do sửa từ khóa, thêm chi tiết, thay đổi văn bản mô tả bằng tiếng Anh hoặc tiếng Việt.
                  </span>
                  <span className="font-mono text-stone-400">
                    {localPrompt.length} ký tự
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isSavedToast ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-4 h-4" />
                    Đã lưu prompt tùy chỉnh thành công!
                  </span>
                ) : localPrompt.trim() !== defaultPromptText.trim() ? (
                  <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Prompt đã được chỉnh sửa (Nhấn "Lưu prompt" để áp dụng)
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">
                    Đang sử dụng prompt mặc định chuẩn
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomPrompt}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu prompt cho ảnh này</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullPromptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
