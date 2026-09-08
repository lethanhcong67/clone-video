import React, { useState } from 'react';
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
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import { AppliedReplacementConfig, BatchImageItem, BatchSettings, OutfitReference, ApiConfig, CameraMovementType } from '../types';
import { CAMERA_MOVEMENT_PRESETS } from '../data/presets';

interface BatchPipelineRowItemProps {
  item: BatchImageItem;
  index: number;
  settings: BatchSettings;
  apiConfig?: ApiConfig;
  uploadedOutfit?: OutfitReference | null;
  uploadedOutfits?: OutfitReference[];
  isProcessingAll: boolean;
  imageFitCover: boolean;
  setImageFitCover: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdateItem: (id: string, updates: Partial<BatchImageItem>) => void;
  onRemoveItem: (id: string) => void;
  onProcessSingleItem: (item: BatchImageItem) => Promise<void>;
  onOpenKlingSettings?: () => void;
  onOpenLightbox: (url: string, title: string) => void;
  onOpenComparison: (item: BatchImageItem) => void;
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
  imageFitCover,
  setImageFitCover,
  onUpdateItem,
  onRemoveItem,
  onProcessSingleItem,
  onOpenKlingSettings,
  onOpenLightbox,
  onOpenComparison,
  onGenerateKlingVideo,
  onGenerateInstantVideo,
}) => {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  const isRowProcessing = item.status === 'processing';
  const isRowCompleted = item.status === 'completed' && Boolean(item.resultImageUrl);
  const isRowError = item.status === 'error';
  const hasVideo = Boolean(item.videoUrl);
  const isVideoGenerating = item.videoStatus === 'generating';

  // Applied config data for this specific row
  const appliedCharacter = item.appliedConfig?.characterPrompt || settings.characterPrompt;
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
    const link = document.createElement('a');
    link.href = url;
    link.download = `swapped_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVideo = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `video_${filename.replace(/\.[^/.]+$/, '')}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Video quick suggestions
  const videoPromptSuggestions = [
    'Giữ cố định thiết kế sản phẩm, người mẫu cử động tự nhiên',
    'Chuyển động nhẹ nhàng cinematic',
    'Người mẫu tạo dáng thanh lịch, tóc bay nhẹ',
    'Camera lia chậm, giữ nguyên logo và form áo',
  ];

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
          {settings.removeSubtitles && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
              <Subtitles className="w-3 h-3" />
              Xóa phụ đề
            </span>
          )}

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
                  onClick={() => setImageFitCover((prev) => !prev)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                    imageFitCover
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'text-stone-500 hover:text-stone-800 bg-stone-200/70 hover:bg-stone-200'
                  }`}
                  title={imageFitCover ? 'Đang phóng to phủ kín (Bấm để xem vừa khung)' : 'Bấm để phóng to phủ kín'}
                >
                  <Square className={`w-3 h-3 ${imageFitCover ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                  <span>{imageFitCover ? 'Phủ kín' : 'Vừa khung'}</span>
                </button>
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
                className={`w-full h-full transition-all duration-200 ${imageFitCover ? 'object-cover' : 'object-contain'}`}
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
                <button
                  type="button"
                  onClick={() => setImageFitCover((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900/90 text-white text-xs font-semibold shadow-md hover:bg-black cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  {imageFitCover ? 'Vừa khung' : 'Phủ kín ô'}
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
              {isConfigApplied ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  <CheckCheck className="w-3 h-3" />
                  Đã đồng bộ
                </span>
              ) : (
                <span className="text-[10px] text-stone-400 font-medium">Theo mẫu chung</span>
              )}
            </div>

            {/* Scrollable specs container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 my-1">
              
              {/* Sub-item A: Character */}
              {(() => {
                const hasCharPrompt = Boolean(
                  (item.appliedConfig?.characterPrompt !== undefined
                    ? item.appliedConfig.characterPrompt.trim()
                    : settings.characterPrompt.trim())
                );
                const isCharEnabled = Boolean(
                  (item.appliedConfig?.enableCharacter ?? settings.enableCharacter) && hasCharPrompt
                );
                const isPosePreserved = item.appliedConfig?.preservePose ?? settings.preservePose;
                const isCustomCharPrompt =
                  item.appliedConfig?.characterPrompt !== undefined &&
                  item.appliedConfig.characterPrompt !== settings.characterPrompt;
                const currentCharVal =
                  item.appliedConfig?.characterPrompt !== undefined
                    ? item.appliedConfig.characterPrompt
                    : appliedCharacter;

                return (
                  <div
                    className={`p-2 rounded-lg border transition-all ${
                      isCharEnabled
                        ? 'bg-white border-violet-200 shadow-2xs'
                        : 'bg-stone-100/70 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                        <User className={`w-3.5 h-3.5 ${isCharEnabled ? 'text-violet-600' : 'text-stone-500'}`} />
                        <span>Nhân vật:</span>
                        {isCustomCharPrompt && (
                          <span className="text-[9px] font-bold text-violet-700 bg-violet-100 px-1 py-0.2 rounded leading-none">
                            Riêng
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextEnabled = !isCharEnabled;
                          updateItemConfig({
                            enableCharacter: nextEnabled,
                            characterPrompt: item.appliedConfig?.characterPrompt ?? appliedCharacter ?? settings.characterPrompt,
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          isCharEnabled
                            ? 'bg-violet-100 text-violet-800 hover:bg-violet-200 border border-violet-300/80'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/80'
                        }`}
                        title={isCharEnabled ? 'Bấm để giữ nguyên ảnh gốc' : 'Bấm để thay thế nhân vật'}
                      >
                        {isCharEnabled ? (
                          <>
                            <UserCheck className="w-3 h-3 text-violet-600" />
                            <span>Thay thế</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Giữ gốc</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isCharEnabled ? (
                      <div className="space-y-1">
                        <textarea
                          rows={2}
                          value={currentCharVal}
                          onChange={(e) => {
                            updateItemConfig({
                              characterPrompt: e.target.value,
                              enableCharacter: true,
                            });
                          }}
                          placeholder="Nhập mô tả nhân vật..."
                          className="w-full text-xs font-medium text-stone-800 bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-200 rounded p-1.5 transition-all resize-none outline-none leading-relaxed placeholder:text-stone-400 placeholder:italic"
                        />
                        <div className="flex items-center justify-between gap-1 pt-0.5">
                          <button
                            type="button"
                            onClick={() => updateItemConfig({ preservePose: !isPosePreserved })}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                              isPosePreserved
                                ? 'text-violet-700 bg-violet-50 border-violet-200'
                                : 'text-stone-500 bg-stone-100 border-stone-200'
                            }`}
                          >
                            <Check className={`w-2.5 h-2.5 ${isPosePreserved ? 'opacity-100 text-violet-600' : 'opacity-0'}`} />
                            <span>{isPosePreserved ? 'Giữ dáng gốc' : 'Dáng tự do'}</span>
                          </button>

                          {isCustomCharPrompt && (
                            <button
                              type="button"
                              onClick={() => updateItemConfig({ characterPrompt: settings.characterPrompt })}
                              className="text-[10px] text-stone-400 hover:text-violet-600 font-medium underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Mẫu chung</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60">
                        <span className="truncate">Giữ nguyên người ảnh gốc</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateItemConfig({
                              enableCharacter: true,
                              characterPrompt: item.appliedConfig?.characterPrompt || settings.characterPrompt || 'nữ 65 tuổi',
                            });
                          }}
                          className="text-[10.5px] font-bold text-violet-700 hover:underline flex items-center gap-0.5 ml-1 shrink-0 cursor-pointer"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>Sửa</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Sub-item B: Outfit */}
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
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                        <Shirt className={`w-3.5 h-3.5 ${isOutfitActive ? 'text-emerald-600' : 'text-stone-400'}`} />
                        <span>Trang phục / Đồ:</span>
                      </div>
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

                    {isOutfitActive ? (
                      <div className="space-y-1">
                        {appliedProductReferences.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {appliedProductReferences.map((prod, pIdx) => {
                              const pRefTag = `Ref ${pIdx + 2}`;
                              return (
                                <div
                                  key={prod.id || pIdx}
                                  className="flex items-center gap-1 p-0.5 pr-1.5 rounded bg-emerald-50 border border-emerald-200/80"
                                >
                                  <div
                                    className="w-6 h-6 rounded overflow-hidden bg-stone-100 cursor-pointer"
                                    onClick={() => onOpenLightbox(prod.previewUrl || prod.dataUrl || '', `${pRefTag}: ${prod.name}`)}
                                  >
                                    <img
                                      src={prod.previewUrl || prod.dataUrl}
                                      alt={prod.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-emerald-800">{pRefTag}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : appliedOutfitImg ? (
                          <div
                            className="flex items-center gap-1.5 p-1 rounded bg-emerald-50 border border-emerald-200/80 mb-1 cursor-pointer"
                            onClick={() => onOpenLightbox(appliedOutfitImg, `Ảnh mẫu: ${appliedOutfitName || ''}`)}
                          >
                            <img src={appliedOutfitImg} alt="Mẫu" className="w-6 h-6 rounded object-cover" />
                            <span className="text-[10px] font-semibold text-emerald-800 truncate">{appliedOutfitName || 'Ref 2'}</span>
                          </div>
                        ) : null}

                        <textarea
                          rows={2}
                          value={item.appliedConfig?.outfitPrompt !== undefined ? item.appliedConfig.outfitPrompt : appliedOutfitPrompt}
                          onChange={(e) => updateItemConfig({ outfitPrompt: e.target.value })}
                          placeholder={`Thay thế chính xác ${item.appliedConfig?.productName || settings.productName || 'mẫu sản phẩm'} theo ảnh tham chiếu ref2 vào hình gốc ref1, xóa toàn bộ chi tiết cũ, giữ nguyên phông nền và người mẫu`}
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
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-stone-200/60 shrink-0">
            <span className="text-stone-400">Đồng bộ mẫu mới</span>
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
                  <>
                    <button
                      type="button"
                      onClick={() => setImageFitCover((prev) => !prev)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                        imageFitCover
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'text-stone-500 hover:text-stone-800 bg-stone-200/70 hover:bg-stone-200'
                      }`}
                      title={imageFitCover ? 'Đang phủ kín (Bấm để xem vừa khung)' : 'Bấm để phủ kín'}
                    >
                      <Square className={`w-3 h-3 ${imageFitCover ? 'fill-indigo-600 text-indigo-600' : ''}`} />
                      <span>{imageFitCover ? 'Phủ kín' : 'Vừa khung'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenComparison(item)}
                      className="text-indigo-600 hover:text-indigo-800 text-[10.5px] font-semibold px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors cursor-pointer"
                      title="So sánh Trước / Sau"
                    >
                      So sánh
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenLightbox(item.resultImageUrl!, `Ảnh mới đã thay thế: ${item.name}`)}
                      className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-200/60 transition-colors cursor-pointer"
                      title="Phóng to ảnh mới"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </>
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
                    className={`w-full h-full transition-all duration-200 ${imageFitCover ? 'object-cover' : 'object-contain'}`}
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
                      onClick={() => setImageFitCover((prev) => !prev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900/90 text-white text-xs font-semibold shadow-md hover:bg-black cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      {imageFitCover ? 'Vừa khung' : 'Phủ kín ô'}
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
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDownloadVideo(item.videoUrl!, item.name)}
                        className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-violet-600 transition-colors shadow-md cursor-pointer"
                        title="Tải video MP4/WebM"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                /* STATE 4: Ready for Video Creation (Studio Form inside Column 4 - Compact & Space-Saving) */
                <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-3 bg-white rounded-lg border border-violet-200/80 shadow-2xs">
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    
                    {/* Header: Label + Compact Camera Dropdown inline on the SAME line */}
                    <div className="flex items-center justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-800 shrink-0">
                        <Film className="w-3 h-3 text-violet-600" />
                        <span>Prompt video:</span>
                      </div>

                      {/* Compact Camera Selector directly beside the prompt label */}
                      <div className="flex items-center gap-1 min-w-0">
                        <Camera className="w-3 h-3 text-violet-500 shrink-0" />
                        <select
                          value={item.selectedCameraMotion || settings.defaultCameraMotion || 'static'}
                          onChange={(e) => {
                            const newMotionId = e.target.value as CameraMovementType;
                            const selectedPreset = CAMERA_MOVEMENT_PRESETS.find((p) => p.id === newMotionId);
                            if (selectedPreset) {
                              onUpdateItem(item.id, {
                                selectedCameraMotion: newMotionId,
                                videoPrompt: selectedPreset.prompt,
                              });
                            }
                          }}
                          className="text-[10.5px] font-bold text-violet-900 bg-violet-50 hover:bg-violet-100 border border-violet-200 focus:border-violet-500 rounded px-1.5 py-0.5 outline-none cursor-pointer truncate max-w-[130px] sm:max-w-[155px]"
                          title="Chọn góc máy & chuyển động camera"
                        >
                          {CAMERA_MOVEMENT_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.title.split(' ')[0]} ({preset.badge})
                            </option>
                          ))}
                        </select>

                        {/* Reset prompt button if modified */}
                        {(() => {
                          const currentMotionId = item.selectedCameraMotion || settings.defaultCameraMotion || 'static';
                          const activePreset = CAMERA_MOVEMENT_PRESETS.find((p) => p.id === currentMotionId);
                          const isCustom = item.videoPrompt && activePreset && item.videoPrompt !== activePreset.prompt;
                          return isCustom ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (activePreset) {
                                  onUpdateItem(item.id, { videoPrompt: activePreset.prompt });
                                }
                              }}
                              className="text-[10px] text-violet-600 hover:text-violet-800 p-0.5 rounded hover:bg-violet-50 shrink-0 cursor-pointer"
                              title="Khôi phục lại prompt chuẩn của góc máy này"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                            </button>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {/* Quick Camera Motion Badges (Space-saving pills) */}
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-[9.5px] shrink-0">
                      {CAMERA_MOVEMENT_PRESETS.map((preset) => {
                        const isSelected = (item.selectedCameraMotion || settings.defaultCameraMotion || 'static') === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              onUpdateItem(item.id, {
                                selectedCameraMotion: preset.id,
                                videoPrompt: preset.prompt,
                              });
                            }}
                            className={`shrink-0 px-1.5 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-violet-600 text-white font-bold shadow-2xs'
                                : 'bg-stone-100 hover:bg-violet-50 hover:text-violet-700 text-stone-600 border border-stone-200/60'
                            }`}
                            title={preset.description}
                          >
                            {preset.title.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Video Prompt Textarea */}
                    <div className="flex-1 min-h-0 flex flex-col">
                      <textarea
                        rows={3}
                        value={
                          item.videoPrompt !== undefined
                            ? item.videoPrompt
                            : (CAMERA_MOVEMENT_PRESETS.find((p) => p.id === (item.selectedCameraMotion || settings.defaultCameraMotion || 'static'))?.prompt || '')
                        }
                        onChange={(e) => onUpdateItem(item.id, { videoPrompt: e.target.value })}
                        placeholder="Nhập prompt video Kling AI..."
                        className="w-full flex-1 min-h-[75px] text-xs rounded-md border border-stone-300 p-2 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1.5 focus:ring-violet-500 bg-stone-50/50 resize-none leading-relaxed"
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
    </div>
  );
};
