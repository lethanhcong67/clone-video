import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Video,
  Play,
  Film,
  Sparkles,
  Layers,
  Maximize2,
  X,
  Subtitles,
  CheckCheck,
  User,
  Shirt,
  CheckSquare,
  Square,
  Lock,
  ShieldCheck,
  UserCheck,
  UserX,
  Check,
  RotateCcw,
  Pencil,
  Zap,
  Mountain,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppliedReplacementConfig, BatchImageItem, BatchSettings, OutfitReference, ApiConfig } from '../types';
import { fileToDataUrl, getImageDimensions } from '../utils/imageUtils';
import { generateMotionVideoFromImage } from '../utils/videoGenerator';
import { BatchPipelineRowItem } from './BatchPipelineRowItem';

interface BatchPipelineRowsProps {
  items: BatchImageItem[];
  onAddItems: (newItems: BatchImageItem[]) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onProcessSingleItem: (item: BatchImageItem) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<BatchImageItem>) => void;
  settings: BatchSettings;
  isProcessingAll: boolean;
  uploadedOutfit?: OutfitReference | null;
  uploadedOutfits?: OutfitReference[];
  onApplyToAll: () => void;
  apiConfig?: ApiConfig;
  systemHasKlingKey?: boolean;
  onOpenKlingSettings?: () => void;
}

export const BatchPipelineRows: React.FC<BatchPipelineRowsProps> = ({
  items,
  onAddItems,
  onRemoveItem,
  onClearAll,
  onProcessSingleItem,
  onUpdateItem,
  settings,
  isProcessingAll,
  uploadedOutfit,
  uploadedOutfits = [],
  onApplyToAll,
  apiConfig,
  systemHasKlingKey = false,
  onOpenKlingSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Modals
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [comparisonItem, setComparisonItem] = useState<BatchImageItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [imageFitCover, setImageFitCover] = useState<boolean>(false);
  const [expandedPromptRowId, setExpandedPromptRowId] = useState<string | null>(null);

  // File Upload Processor: Handles multiple files asynchronously & safely
  const processFiles = async (fileList: FileList | File[]) => {
    // Clone files to an independent array immediately so that resetting the input does not mutate the list
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;

    setIsLoadingFiles(true);

    try {
      // Filter image files by mime or common image extension
      const imageFiles = rawFiles.filter((file) => {
        const isMimeImage = file.type ? file.type.startsWith('image/') : false;
        const isExtImage = /\.(jpe?g|png|webp|bmp|gif|heic|avif)$/i.test(file.name);
        return isMimeImage || isExtImage;
      });

      if (imageFiles.length === 0) {
        setIsLoadingFiles(false);
        return;
      }

      // Read all images in parallel for fast and reliable batch upload
      const results = await Promise.allSettled(
        imageFiles.map(async (file, index) => {
          const dataUrl = await fileToDataUrl(file);
          const dimensions = await getImageDimensions(dataUrl);

          const item: BatchImageItem = {
            id: `img_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: file.size,
            dataUrl,
            mimeType: file.type || 'image/jpeg',
            status: 'idle',
            progress: 0,
            originalDimensions: dimensions,
            videoStatus: 'idle',
          };
          return item;
        })
      );

      const newItems: BatchImageItem[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled') {
          newItems.push(res.value);
        } else {
          console.error('Lỗi khi đọc file ảnh:', res.reason);
        }
      }

      if (newItems.length > 0) {
        onAddItems(newItems);
      }
    } catch (err) {
      console.error('Lỗi khi xử lý danh sách ảnh:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Take snapshot of files before resetting input value
      const filesArray = Array.from(e.target.files) as File[];
      e.target.value = '';
      processFiles(filesArray);
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
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      processFiles(filesArray);
    }
  };

  // Kling AI Video Generator for a specific row
  const handleGenerateKlingVideoForRow = async (item: BatchImageItem) => {
    if (!item.resultImageUrl) return;

    const klingConfig = apiConfig?.kling;
    const apiKey = klingConfig?.apiKey?.trim() || undefined;
    const accessKey = klingConfig?.accessKey?.trim() || undefined;
    const secretKey = klingConfig?.secretKey?.trim() || undefined;
    const baseUrl = klingConfig?.baseUrl?.trim() || 'https://api.klingai.com';
    const model = klingConfig?.model || 'kling-v2-6';
    const mode = klingConfig?.mode || 'pro';
    const duration = klingConfig?.duration || '5';
    const aspectRatio = klingConfig?.aspectRatio || '9:16';
    const multiShot = klingConfig?.multiShot !== undefined ? klingConfig.multiShot : false;
    const cfgScale = klingConfig?.cfgScale !== undefined ? klingConfig.cfgScale : 0.6;
    const negativePrompt =
      klingConfig?.negativePrompt && !klingConfig.negativePrompt.includes('camera movement')
        ? klingConfig.negativePrompt
        : '';
    const watermarkInfo = { enabled: klingConfig?.watermarkEnabled ?? false };

    const hasAnyKey = Boolean(apiKey || (accessKey && secretKey) || systemHasKlingKey);
    if (!hasAnyKey) {
      if (onOpenKlingSettings) {
        onOpenKlingSettings();
      }
      onUpdateItem(item.id, {
        videoStatus: 'error',
        videoError: 'Chưa có Kling AI API Key. Vui lòng mở Cấu hình API để nhập API Key hoặc AccessKey/SecretKey.',
      });
      return;
    }

    onUpdateItem(item.id, {
      videoStatus: 'generating',
      videoProgress: 10,
      videoError: undefined,
    });

    try {
      const defaultPromptText =
        'The model poses naturally with gentle body movement, natural breathing and posture adjustment, keeping the product design, logo, fabric print, patterns and apparel completely fixed, sharp and unchanged. Photorealistic 4k, cinematic soft lighting.';
      const promptText = item.videoPrompt?.trim() || defaultPromptText;

      const res = await fetch('/api/kling/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          accessKey,
          secretKey,
          baseUrl,
          model_name: model,
          model,
          mode,
          duration,
          aspect_ratio: aspectRatio,
          multi_shot: multiShot,
          cfg_scale: cfgScale,
          negative_prompt: negativePrompt,
          watermark_info: watermarkInfo,
          prompt: promptText,
          image: item.resultImageUrl,
          imageUrl: item.resultImageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi gửi yêu cầu tạo video Kling AI');
      }

      const taskId = data.taskId;
      onUpdateItem(item.id, {
        videoTaskId: taskId,
        videoProgress: 25,
      });

      // Poll status every 3.5 seconds
      let pollCount = 0;
      const maxPoll = 100;
      const pollTimer = setInterval(async () => {
        pollCount++;
        try {
          const params = new URLSearchParams();
          if (apiKey) params.set('apiKey', apiKey);
          if (accessKey) params.set('accessKey', accessKey);
          if (secretKey) params.set('secretKey', secretKey);
          if (baseUrl) params.set('baseUrl', baseUrl);

          const statusRes = await fetch(`/api/kling/task-status/${taskId}?${params.toString()}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'succeed') {
            clearInterval(pollTimer);
            onUpdateItem(item.id, {
              videoUrl: statusData.videoUrl,
              videoStatus: 'completed',
              videoProgress: 100,
            });
          } else if (statusData.status === 'failed') {
            clearInterval(pollTimer);
            onUpdateItem(item.id, {
              videoStatus: 'error',
              videoError: statusData.error || 'Quá trình tạo video thất bại từ Kling AI',
            });
          } else {
            // Still processing: increment smoothly from 25% up to 95%
            const prog = Math.min(95, 25 + Math.floor(pollCount * 2.5));
            onUpdateItem(item.id, {
              videoProgress: prog,
            });
          }

          if (pollCount >= maxPoll) {
            clearInterval(pollTimer);
            onUpdateItem(item.id, {
              videoStatus: 'error',
              videoError: 'Quá thời gian chờ tạo video từ Kling AI. Bạn có thể kiểm tra lại sau.',
            });
          }
        } catch (pollErr: any) {
          console.warn('Lỗi kiểm tra trạng thái video:', pollErr);
        }
      }, 3500);
    } catch (err: any) {
      console.error('Lỗi khi bắt đầu tạo video Kling AI:', err);
      onUpdateItem(item.id, {
        videoStatus: 'error',
        videoError: err.message || 'Không thể tạo video Kling AI',
      });
    }
  };

  // Instant client-side fallback motion video
  const handleGenerateInstantVideoForRow = async (item: BatchImageItem) => {
    if (!item.resultImageUrl) return;

    onUpdateItem(item.id, {
      videoStatus: 'generating',
      videoProgress: 5,
      videoError: undefined,
    });

    try {
      const videoUrl = await generateMotionVideoFromImage(
        item.resultImageUrl,
        3500,
        (progress) => {
          onUpdateItem(item.id, { videoProgress: progress });
        }
      );

      onUpdateItem(item.id, {
        videoUrl,
        videoStatus: 'completed',
        videoProgress: 100,
      });
    } catch (err: any) {
      console.error('Lỗi khi tạo video tức thì cho hàng:', err);
      onUpdateItem(item.id, {
        videoStatus: 'error',
        videoError: err.message || 'Không thể tạo video chuyển động tức thì từ ảnh này',
      });
    }
  };

  // Alias for backward compatibility
  const handleGenerateVideoForRow = handleGenerateKlingVideoForRow;

  // Download individual image
  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `swapped_${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download individual video
  const handleDownloadVideo = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `video_${filename.replace(/\.[^/.]+$/, '')}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="batch-pipeline-section" className="space-y-4">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="pipeline-multi-file-input"
      />

      {/* When no items: Friendly full dropzone */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Tải lên các hình ảnh cần xử lý
              </h2>
              <p className="text-xs text-stone-500">
                Mỗi ảnh sẽ là một hàng xử lý riêng biệt để đổi nhân vật, thay trang phục hoặc xóa phụ đề
              </p>
            </div>
          </div>

          <div
            id="pipeline-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                : 'border-stone-300 hover:border-indigo-400 bg-stone-50/50 hover:bg-stone-50'
            }`}
          >
            {isLoadingFiles ? (
              <div className="flex flex-col items-center justify-center py-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                <p className="text-xs font-semibold text-stone-700">Đang nạp và phân bổ các hàng hình ảnh...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-stone-200 flex items-center justify-center mb-2 text-indigo-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-stone-800 mb-0.5">
                  Kéo thả nhiều hình ảnh vào đây hoặc <span className="text-indigo-600 underline">chọn từ máy tính</span>
                </p>
                <p className="text-xs text-stone-400 max-w-md">
                  Hỗ trợ PNG, JPG, WEBP. Chọn nhiều ảnh cùng một lúc.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* When items exist: Clean, compact toolbar & slim dropzone */
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-stone-800">
                Danh sách ảnh cần xử lý ({items.length} hàng)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm ảnh</span>
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          {/* Slim Dropzone */}
          <div
            id="pipeline-dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl py-2 px-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/60 text-indigo-700 font-semibold'
                : 'border-stone-300 hover:border-indigo-400 bg-white hover:bg-stone-50 text-stone-600'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Kéo thả thêm ảnh vào đây hoặc click để tải thêm</span>
          </div>
        </div>
      )}

      {/* Main Row-Based Pipeline List */}
      {items.length > 0 && (
        <div className="space-y-4">
          {/* Render each Image as an independent ROW */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <BatchPipelineRowItem
                key={item.id}
                item={item}
                index={index}
                settings={settings}
                apiConfig={apiConfig}
                uploadedOutfit={uploadedOutfit}
                uploadedOutfits={uploadedOutfits}
                isProcessingAll={isProcessingAll}
                imageFitCover={imageFitCover}
                setImageFitCover={setImageFitCover}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
                onProcessSingleItem={onProcessSingleItem}
                onOpenKlingSettings={onOpenKlingSettings}
                onOpenLightbox={(url, title) => {
                  setLightboxImageUrl(url);
                  setLightboxTitle(title);
                }}
                onOpenComparison={(compItem) => {
                  setComparisonItem(compItem);
                  setSliderPosition(50);
                }}
                onGenerateKlingVideo={handleGenerateKlingVideoForRow}
                onGenerateInstantVideo={handleGenerateInstantVideoForRow}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImageUrl && (
        <div
          id="image-lightbox-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden flex flex-col p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 text-white">
              <p className="text-sm font-bold truncate">{lightboxTitle}</p>
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
              <img
                src={lightboxImageUrl}
                alt="Enlarged preview"
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal (Before / After Split Slider) */}
      {comparisonItem && comparisonItem.resultImageUrl && (
        <div
          id="row-comparison-modal"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setComparisonItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-stone-900">
                  So sánh Trước & Sau: {comparisonItem.name}
                </h4>
                <p className="text-xs text-stone-500">
                  Kéo thanh trượt ngang để kiểm tra chi tiết nhân vật, trang phục và phụ đề đã xóa
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparisonItem(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Before-After Interactive Canvas Container */}
            <div className="relative w-full h-[65vh] max-h-[640px] min-h-[420px] rounded-xl overflow-hidden select-none bg-stone-900 shadow-inner">
              {/* After image (Result) */}
              <img
                src={comparisonItem.resultImageUrl}
                alt="Sau khi đổi"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Before image (Original) clipped by slider */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={comparisonItem.dataUrl}
                  alt="Trước khi đổi"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ width: '100%', maxWidth: 'none' }}
                />
              </div>

              {/* Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg border border-stone-300 flex items-center justify-center text-stone-700 font-bold text-xs">
                  ⇔
                </div>
              </div>

              {/* Labels */}
              <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white pointer-events-none">
                Ảnh gốc
              </span>
              <span className="absolute top-3 right-3 px-2 py-1 rounded bg-indigo-600/80 backdrop-blur-xs text-[11px] font-bold text-white pointer-events-none">
                Ảnh mới AI
              </span>

              {/* Interactive Range Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Kéo chuột hoặc vuốt cảm ứng sang trái/phải để so sánh
              </span>
              <button
                type="button"
                onClick={() => setComparisonItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
