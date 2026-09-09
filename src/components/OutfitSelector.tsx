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
} from 'lucide-react';
import { OutfitReference } from '../types';
import { fileToDataUrl } from '../utils/imageUtils';

interface OutfitSelectorProps {
  productName?: string;
  onChangeProductName?: (val: string) => void;
  outfitPrompt: string;
  onChangePrompt: (val: string) => void;
  uploadedOutfits: OutfitReference[];
  onAddUploadedOutfits: (outfits: OutfitReference[]) => void;
  onRemoveUploadedOutfit: (id: string) => void;
  onClearUploadedOutfits: () => void;
  onApplyToAll?: () => void;
  uploadedOutfit?: OutfitReference | null;
}

export const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  productName = '',
  onChangeProductName,
  outfitPrompt,
  onChangePrompt,
  uploadedOutfits,
  onAddUploadedOutfits,
  onRemoveUploadedOutfit,
  onClearUploadedOutfits,
  onApplyToAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to generate the exact required prompt format
  const getStandardPrompt = (name: string) => {
    const trimmed = name.trim();
    return `Thay thế chính xác ${trimmed || 'mẫu sản phẩm'} theo ảnh tham chiếu ref2 vào hình gốc ref1, xóa toàn bộ chi tiết cũ, giữ nguyên phông nền và người mẫu`;
  };

  const handleProductNameChange = (newName: string) => {
    if (onChangeProductName) {
      onChangeProductName(newName);
    }
    // Automatically update prompt text to match the user's required pattern
    onChangePrompt(getStandardPrompt(newName));
  };

  const handleApplyStandardPrompt = () => {
    onChangePrompt(getStandardPrompt(productName));
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
        newOutfits.push({
          id: `outfit_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          previewUrl: dataUrl,
          dataUrl,
          mimeType: file.type || 'image/jpeg',
          description: `Sản phẩm tham chiếu ref${refIndex}: ${file.name}`,
          category: 'uploaded',
        });
      } catch (e) {
        console.error('Lỗi khi đọc file ảnh tham chiếu:', e);
      }
    }

    if (newOutfits.length > 0) {
      onAddUploadedOutfits(newOutfits);

      // Auto-detect product name from file name if productName is currently empty
      let detectedName = productName.trim();
      const firstFileName = newOutfits[0].name.toLowerCase();
      if (!detectedName) {
        if (firstFileName.includes('apron') || firstFileName.includes('tap') || firstFileName.includes('bep') || firstFileName.includes('cook')) {
          detectedName = 'tạp dề';
        } else if (firstFileName.includes('vong') || firstFileName.includes('bracelet') || firstFileName.includes('lac')) {
          detectedName = 'vòng tay';
        } else if (firstFileName.includes('dongho') || firstFileName.includes('watch')) {
          detectedName = 'đồng hồ';
        } else if (firstFileName.includes('chuyen') || firstFileName.includes('necklace')) {
          detectedName = 'dây chuyền';
        } else if (firstFileName.includes('ao') || firstFileName.includes('shirt') || firstFileName.includes('vest') || firstFileName.includes('suit')) {
          detectedName = 'áo';
        } else if (firstFileName.includes('quan') || firstFileName.includes('pant') || firstFileName.includes('jean')) {
          detectedName = 'quần';
        } else if (firstFileName.includes('dam') || firstFileName.includes('vay') || firstFileName.includes('dress')) {
          detectedName = 'váy';
        }
        if (detectedName && onChangeProductName) {
          onChangeProductName(detectedName);
        }
      }

      // Auto-suggest prompt if prompt is empty or is default
      if (!outfitPrompt || outfitPrompt.trim().length === 0 || outfitPrompt.includes('Thay thế chính xác')) {
        onChangePrompt(getStandardPrompt(detectedName));
      }
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

  return (
    <div id="outfit-selector-section" className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
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
                className="text-[11px] text-stone-400 hover:text-rose-600 px-1.5 py-1 rounded-md hover:bg-rose-50 transition-colors"
                title="Xóa tất cả ảnh sản phẩm"
              >
                Xóa hết
              </button>
            )}
          </div>
        </div>

        {/* Upload & Notes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Left: Product Images (cols 5) */}
          <div className="sm:col-span-5">
            {uploadedOutfits.length === 0 ? (
              <div
                id="multi-outfit-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center h-full min-h-[110px] ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-stone-300 hover:border-emerald-400 bg-stone-50/50'
                }`}
              >
                <UploadCloud className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="text-xs font-semibold text-stone-800">
                  Kéo thả hoặc <span className="text-emerald-600 underline">chọn ảnh sản phẩm</span>
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Ảnh mẫu ref2: Áo, đầm, tạp dề, phụ kiện...
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1">
                  <span>Ảnh sản phẩm tham chiếu (ref2):</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-h-[92px]">
                  {uploadedOutfits.map((outfit, index) => (
                    <div
                      key={outfit.id}
                      className="relative rounded-lg border border-emerald-200 bg-emerald-50/40 p-1 flex items-center gap-1.5 shrink-0 group hover:shadow-2xs"
                    >
                      <img
                        src={outfit.previewUrl}
                        alt={outfit.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded object-cover border border-emerald-300 bg-white"
                      />
                      <div className="max-w-[75px]">
                        <span className="text-[10px] font-bold text-emerald-800 block">
                          Ref {index + 2}
                        </span>
                        <span className="text-[10px] text-stone-600 truncate block" title={outfit.name}>
                          {outfit.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveUploadedOutfit(outfit.id)}
                        className="w-5 h-5 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-11 h-11 rounded-lg border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 flex items-center justify-center text-emerald-600 transition-colors cursor-pointer shrink-0"
                    title="Thêm ảnh sản phẩm khác"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Product Name Input & Instructions (cols 7) */}
          <div className="sm:col-span-7 space-y-2">
            {/* Field 1: Tên sản phẩm */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="product-name-input" className="text-xs font-bold text-stone-800 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tên sản phẩm:</span>
                </label>
                {productName && (
                  <span className="text-[10.5px] text-emerald-600 font-medium">
                    Đã cập nhật vào yêu cầu
                  </span>
                )}
              </div>
              <input
                id="product-name-input"
                type="text"
                value={productName}
                onChange={(e) => handleProductNameChange(e.target.value)}
                placeholder="VD: tạp dề, áo sơ mi trắng, đồng hồ, túi xách..."
                className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all bg-white"
              />
            </div>

            {/* Field 2: Yêu cầu thay thế (Prompt) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="outfit-prompt-input" className="text-xs font-semibold text-stone-700">
                  Yêu cầu thay thế:
                </label>
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

              <textarea
                id="outfit-prompt-input"
                rows={2}
                value={outfitPrompt}
                onChange={(e) => onChangePrompt(e.target.value)}
                placeholder={`Thay thế chính xác ${productName.trim() || '[tên sản phẩm]'} theo ảnh tham chiếu ref2 vào hình gốc ref1, xóa toàn bộ chi tiết cũ, giữ nguyên phông nền và người mẫu`}
                className="w-full rounded-lg border border-stone-300 p-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all resize-none bg-stone-50/50 hover:bg-white focus:bg-white"
              />

              <div className="mt-1 flex items-center gap-1 text-[11px] text-stone-500 truncate">
                <span className="shrink-0 text-stone-400">Chuẩn:</span>
                <button
                  type="button"
                  onClick={handleApplyStandardPrompt}
                  className="text-left text-emerald-700 hover:underline truncate font-medium cursor-pointer"
                  title="Nhấp để áp dụng text này"
                >
                  Thay thế chính xác {productName.trim() || '[tên sản phẩm]'} theo ảnh tham chiếu ref2 vào hình gốc ref1
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {uploadedOutfits.length > 0 && onApplyToAll && (
        <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
          <span>AI sẽ tự động ghép sản phẩm vào ảnh gốc</span>
          <button
            type="button"
            onClick={onApplyToAll}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Đồng bộ cho tất cả ảnh</span>
          </button>
        </div>
      )}
    </div>
  );
};
