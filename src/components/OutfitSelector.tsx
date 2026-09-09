import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Check,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  CheckCheck,
  Package,
  Lock,
  Loader2,
  Eye,
  RefreshCw,
  Copy,
  Sliders,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Info,
} from 'lucide-react';
import { OutfitReference, ProductAnalysis, ApiConfig } from '../types';
import { fileToDataUrl } from '../utils/imageUtils';

interface OutfitSelectorProps {
  productName?: string;
  onChangeProductName?: (val: string) => void;
  outfitPrompt: string;
  onChangePrompt: (val: string) => void;
  uploadedOutfits: OutfitReference[];
  onAddUploadedOutfits: (outfits: OutfitReference[]) => void;
  onUpdateUploadedOutfit?: (id: string, updates: Partial<OutfitReference>) => void;
  onRemoveUploadedOutfit: (id: string) => void;
  onClearUploadedOutfits: () => void;
  onApplyToAll?: () => void;
  uploadedOutfit?: OutfitReference | null;
  apiConfig?: ApiConfig;
  onOpenVisionSettings?: () => void;
}

export const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  productName = '',
  onChangeProductName,
  outfitPrompt,
  onChangePrompt,
  uploadedOutfits,
  onAddUploadedOutfits,
  onUpdateUploadedOutfit,
  onRemoveUploadedOutfit,
  onClearUploadedOutfits,
  onApplyToAll,
  apiConfig,
  onOpenVisionSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState<boolean>(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Active outfit reference for inspection
  const activeOutfit =
    uploadedOutfits.find((o) => o.id === selectedOutfitId) ||
    uploadedOutfits[0] ||
    null;

  // Helper to generate default standard prompt
  const getStandardPrompt = (name: string) => {
    const trimmed = name.trim();
    return `Thay thế chính xác ${trimmed || 'mẫu sản phẩm'} theo ảnh tham chiếu ref2 vào hình gốc ref1, xóa toàn bộ chi tiết cũ, giữ nguyên phông nền và người mẫu`;
  };

  const handleProductNameChange = (newName: string) => {
    if (onChangeProductName) {
      onChangeProductName(newName);
    }
  };

  const handleApplyStandardPrompt = () => {
    onChangePrompt(getStandardPrompt(productName));
  };

  // Perform AI Vision Analysis on a product reference
  const runVisionAnalysis = async (outfit: OutfitReference) => {
    if (!outfit.dataUrl && !outfit.previewUrl) return;

    if (onUpdateUploadedOutfit) {
      onUpdateUploadedOutfit(outfit.id, { isAnalyzing: true, analysisError: undefined });
    }

    try {
      // Determine vision key & provider based on user config
      const customVisionKey = apiConfig?.visionAnalysis?.apiKey?.trim();
      const visionProvider = apiConfig?.visionAnalysis?.provider || (apiConfig?.activeProvider === 'gpt-image-2' ? 'openai' : 'gemini');
      const visionModel = apiConfig?.visionAnalysis?.model || (visionProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
      const fallbackKey =
        customVisionKey ||
        (visionProvider === 'gemini'
          ? apiConfig?.apiKey
          : apiConfig?.gptImage?.apiKey);

      const customBaseUrl = apiConfig?.visionAnalysis?.baseUrl?.trim() || undefined;

      const res = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl: outfit.dataUrl || outfit.previewUrl,
          mimeType: outfit.mimeType || 'image/jpeg',
          fileName: outfit.name,
          apiKey: customVisionKey || fallbackKey || undefined,
          provider: visionProvider,
          model: visionModel,
          baseUrl: customBaseUrl,
        }),
      });

      let data: any = null;
      try {
        const rawText = await res.text();
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseErr) {
        console.warn('Lỗi đọc dữ liệu JSON từ API phân tích ảnh:', parseErr);
      }

      if (res.ok && data?.success && data?.analysis) {
        const analysis: ProductAnalysis = data.analysis;

        if (onUpdateUploadedOutfit) {
          onUpdateUploadedOutfit(outfit.id, {
            analysis,
            isAnalyzing: false,
            description: `${analysis.productName}: ${analysis.suggestedPrompt}`,
          });
        }

        // Auto-update productName if current productName is empty or generic
        if (analysis.productName && onChangeProductName) {
          onChangeProductName(analysis.productName);
        }

        // Auto-update outfitPrompt with rich, analyzed prompt
        if (analysis.suggestedPrompt) {
          onChangePrompt(analysis.suggestedPrompt);
        }
      } else {
        const errorMsg = data?.error || data?.message || `Lỗi phản hồi từ máy chủ (HTTP ${res.status})`;
        if (onUpdateUploadedOutfit) {
          onUpdateUploadedOutfit(outfit.id, {
            isAnalyzing: false,
            analysisError: errorMsg,
          });
        }
      }
    } catch (err: any) {
      console.warn('Lỗi khi gọi API phân tích ảnh:', err);
      if (onUpdateUploadedOutfit) {
        onUpdateUploadedOutfit(outfit.id, {
          isAnalyzing: false,
          analysisError: err?.message || 'Lỗi kết nối phân tích ảnh',
        });
      }
    }
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newOutfits: OutfitReference[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        const refIndex = uploadedOutfits.length + i + 2; // ref2, ref3, ...
        const newOutfit: OutfitReference = {
          id: `outfit_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          previewUrl: dataUrl,
          dataUrl,
          mimeType: file.type || 'image/jpeg',
          description: `Sản phẩm tham chiếu ref${refIndex}: ${file.name}`,
          category: 'uploaded',
          isAnalyzing: true,
        };
        newOutfits.push(newOutfit);
      } catch (e) {
        console.error('Lỗi khi đọc file ảnh tham chiếu:', e);
      }
    }

    if (newOutfits.length > 0) {
      onAddUploadedOutfits(newOutfits);
      setSelectedOutfitId(newOutfits[0].id);

      // Trigger vision analysis for each new outfit
      newOutfits.forEach((outfit) => {
        runVisionAnalysis(outfit);
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleCopyPrompt = () => {
    if (!outfitPrompt) return;
    navigator.clipboard.writeText(outfitPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div id="outfit-selector-section" className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
      <div>
        {/* Hidden Multi-file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          id="multi-outfit-file-input"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-stone-900">
                Sản phẩm / trang phục thay thế (Tải lên ảnh tham chiếu)
              </h2>
              {uploadedOutfits.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {uploadedOutfits.length} ảnh
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenVisionSettings && (
              <button
                type="button"
                onClick={onOpenVisionSettings}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1 border border-amber-200/80 cursor-pointer"
                title="Cấu hình API Key riêng cho tác vụ phân tích ảnh Vision"
              >
                <KeyRound className="w-3 h-3 text-amber-600" />
                <span>{apiConfig?.visionAnalysis?.apiKey ? 'Khóa Vision riêng ✓' : 'API Key Phân Tích'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ảnh</span>
            </button>
            {uploadedOutfits.length > 0 && (
              <button
                type="button"
                onClick={onClearUploadedOutfits}
                className="text-[11px] text-stone-400 hover:text-rose-600 px-1.5 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                title="Xóa tất cả ảnh sản phẩm"
              >
                Xóa hết
              </button>
            )}
          </div>
        </div>

        {/* Upload & Prompt Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Left: Product Images Preview & Selector (cols 5) */}
          <div className="sm:col-span-5">
            {uploadedOutfits.length === 0 ? (
              <div
                id="multi-outfit-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center h-full min-h-[120px] ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-stone-300 hover:border-emerald-400 bg-stone-50/50'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1.5 shadow-2xs">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-800">
                  Kéo thả hoặc <span className="text-emerald-600 underline">chọn ảnh sản phẩm</span>
                </p>
                <p className="text-[10.5px] text-stone-500 mt-0.5">
                  AI sẽ tự động phân tích chi tiết & đưa vào Prompt
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
                  <span>Ảnh sản phẩm tham chiếu (ref2, ref3...):</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-h-[100px]">
                  {uploadedOutfits.map((outfit, index) => {
                    const isSelected = activeOutfit?.id === outfit.id;
                    return (
                      <div
                        key={outfit.id}
                        onClick={() => setSelectedOutfitId(outfit.id)}
                        className={`relative rounded-xl border p-1.5 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-2xs'
                            : 'border-stone-200 hover:border-emerald-300 bg-stone-50'
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-white shrink-0">
                          <img
                            src={outfit.previewUrl}
                            alt={outfit.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {outfit.isAnalyzing && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                            </div>
                          )}
                        </div>

                        <div className="max-w-[85px] leading-tight">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-emerald-800">
                              Ref {index + 2}
                            </span>
                            {outfit.analysis && (
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" title="Đã phân tích AI" />
                            )}
                          </div>
                          <span className="text-[10px] text-stone-700 font-medium truncate block" title={outfit.analysis?.productName || outfit.name}>
                            {outfit.analysis?.productName || outfit.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveUploadedOutfit(outfit.id);
                          }}
                          className="w-5 h-5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 flex items-center justify-center text-emerald-600 transition-colors cursor-pointer shrink-0"
                    title="Thêm ảnh sản phẩm khác"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Product Name & Prompt Textarea (cols 7) */}
          <div className="sm:col-span-7 space-y-2">
            {/* Field 1: Tên sản phẩm */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="product-name-input" className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tên sản phẩm thay thế:</span>
                </label>
                {productName && (
                  <span className="text-[10.5px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                    ✓ Đã nhận diện
                  </span>
                )}
              </div>
              <input
                id="product-name-input"
                type="text"
                value={productName}
                onChange={(e) => handleProductNameChange(e.target.value)}
                placeholder="VD: tạp dề thêu hoa Mexico, áo sơ mi lụa trắng, đồng hồ dây da..."
                className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all bg-white"
              />
            </div>

            {/* Field 2: Yêu cầu thay thế (Prompt) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="outfit-prompt-input" className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <span>Yêu cầu thay thế chi tiết (Prompt):</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="text-[10.5px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-0.5 cursor-pointer"
                    title="Sao chép prompt"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedPrompt ? 'Đã chép' : 'Chép'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyStandardPrompt}
                    className="text-[10.5px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Điền lại câu lệnh chuẩn"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Mẫu chuẩn</span>
                  </button>
                </div>
              </div>

              <textarea
                id="outfit-prompt-input"
                rows={2}
                value={outfitPrompt}
                onChange={(e) => onChangePrompt(e.target.value)}
                placeholder={`Thay thế chính xác ${productName.trim() || '[tên sản phẩm]'} theo ảnh tham chiếu ref2 vào hình gốc ref1, xóa toàn bộ chi tiết cũ, giữ nguyên phông nền và người mẫu`}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all resize-none bg-stone-50/50 hover:bg-white focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* AI Vision Analysis Details Card */}
        {activeOutfit && (
          <div className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/40 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {activeOutfit.isAnalyzing
                    ? 'AI đang phân tích chi tiết sản phẩm...'
                    : activeOutfit.analysis
                    ? '✨ Chi tiết phân tích AI của sản phẩm (Đã nạp vào Prompt)'
                    : 'Phân tích chi tiết hình ảnh sản phẩm'}
                </span>
                {activeOutfit.isAnalyzing && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 ml-1" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activeOutfit.isAnalyzing}
                  onClick={() => runVisionAnalysis(activeOutfit)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/80 transition-colors cursor-pointer disabled:opacity-50"
                  title="Chạy lại AI Vision phân tích sản phẩm này"
                >
                  <RefreshCw className={`w-3 h-3 ${activeOutfit.isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{activeOutfit.isAnalyzing ? 'Đang phân tích...' : 'Phân tích lại AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                  className="p-1 text-amber-700 hover:text-amber-950 rounded hover:bg-amber-100/60 cursor-pointer"
                >
                  {isAnalysisExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Analysis details contents */}
            {isAnalysisExpanded && (
              <>
                {activeOutfit.isAnalyzing ? (
                  <div className="py-2 flex items-center justify-center gap-2 text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    <span className="text-[11.5px]">Đang trích xuất màu sắc, họa tiết thêu/in, chữ viết và chất liệu sản phẩm...</span>
                  </div>
                ) : activeOutfit.analysis ? (
                  <div className="space-y-2 pt-1">
                    {/* Visual Attributes Chips Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70 space-y-0.5">
                        <span className="font-bold text-amber-900 block">🎨 Màu sắc & Phối màu:</span>
                        <p className="text-stone-700 leading-snug">{activeOutfit.analysis.colors}</p>
                      </div>

                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70 space-y-0.5">
                        <span className="font-bold text-amber-900 block">🌸 Họa tiết & Hình in:</span>
                        <p className="text-stone-700 leading-snug">{activeOutfit.analysis.patterns}</p>
                      </div>

                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70 space-y-0.5">
                        <span className="font-bold text-amber-900 block">🔤 Chữ viết & Typography:</span>
                        <p className="text-stone-700 leading-snug">{activeOutfit.analysis.textOrTypography || 'Không có chữ viết'}</p>
                      </div>

                      <div className="bg-white/90 p-2 rounded-lg border border-amber-200/70 space-y-0.5">
                        <span className="font-bold text-amber-900 block">🧵 Chất liệu & Chi tiết cấu trúc:</span>
                        <p className="text-stone-700 leading-snug">
                          {activeOutfit.analysis.materials} • {activeOutfit.analysis.keyFeatures}
                        </p>
                      </div>
                    </div>

                    {/* Quick action bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60 text-[11px]">
                      <span className="text-amber-800 font-medium">
                        ✓ Các đặc tính trên đã được tự động tối ưu vào Prompt để tạo ảnh chính xác nhất.
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeOutfit.analysis?.suggestedPrompt) {
                            onChangePrompt(activeOutfit.analysis.suggestedPrompt);
                          }
                        }}
                        className="font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded border border-emerald-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Nạp lại Prompt này</span>
                      </button>
                    </div>
                  </div>
                ) : activeOutfit.analysisError ? (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center justify-between">
                    <span>Lỗi phân tích: {activeOutfit.analysisError}</span>
                    <button
                      type="button"
                      onClick={() => runVisionAnalysis(activeOutfit)}
                      className="underline font-bold text-rose-900 hover:text-rose-950 ml-2"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div className="p-2 text-stone-500 text-[11px] flex items-center justify-between">
                    <span>Chưa phân tích chi tiết sản phẩm này.</span>
                    <button
                      type="button"
                      onClick={() => runVisionAnalysis(activeOutfit)}
                      className="font-bold text-amber-800 hover:underline"
                    >
                      Bấm để phân tích ngay bằng AI
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {uploadedOutfits.length > 0 && onApplyToAll && (
        <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>AI sẽ truyền tải chính xác từng hoa văn, chất liệu & màu sắc vào ảnh gốc</span>
          <button
            type="button"
            onClick={onApplyToAll}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đồng bộ cho tất cả ảnh</span>
          </button>
        </div>
      )}
    </div>
  );
};
