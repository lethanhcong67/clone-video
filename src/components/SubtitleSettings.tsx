import React, { useState } from 'react';
import { Subtitles, ShieldCheck, Ratio, Mountain, Check, RotateCcw } from 'lucide-react';
import { BatchSettings } from '../types';

interface SubtitleSettingsProps {
  settings: BatchSettings;
  onChangeSettings: (newSettings: Partial<BatchSettings>) => void;
}

export const SubtitleSettings: React.FC<SubtitleSettingsProps> = ({
  settings,
  onChangeSettings,
}) => {
  const [showBgInput, setShowBgInput] = useState(Boolean(settings.backgroundPrompt?.trim()));

  const aspectRatios: Array<{ id: BatchSettings['aspectRatio']; label: string; title: string }> = [
    { id: '9:16', label: '9:16 (Dọc)', title: 'Dọc TikTok / Story / Reels (Mặc định)' },
    { id: '3:4', label: '3:4', title: 'Chân dung 3:4' },
    { id: '1:1', label: '1:1', title: 'Vuông 1:1' },
    { id: '4:3', label: '4:3', title: 'Tiêu chuẩn 4:3' },
    { id: '16:9', label: '16:9', title: 'Màn ngang 16:9' },
  ];

  const isChangingBg = Boolean(settings.backgroundPrompt?.trim()) || (showBgInput && !settings.preserveBackground);

  return (
    <div id="subtitle-settings-section" className="bg-white rounded-xl border border-stone-200 p-2 sm:px-3 shadow-2xs space-y-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        {/* Left: Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle 1: Subtitle removal */}
          <label
            htmlFor="remove-subtitles-toggle"
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
              settings.removeSubtitles
                ? 'border-amber-300 bg-amber-50/80 text-amber-950 font-bold shadow-2xs'
                : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:bg-stone-100 font-medium'
            }`}
          >
            <Subtitles className={`w-3.5 h-3.5 shrink-0 ${settings.removeSubtitles ? 'text-amber-600' : 'text-stone-400'}`} />
            <span className="text-xs">Xóa phụ đề & chữ cũ</span>
            <input
              id="remove-subtitles-toggle"
              type="checkbox"
              checked={settings.removeSubtitles}
              onChange={(e) => onChangeSettings({ removeSubtitles: e.target.checked })}
              className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer ml-1"
            />
          </label>

          {/* Toggle 2: Background mode (Giữ gốc HOẶC Đổi bối cảnh mới) */}
          <button
            type="button"
            onClick={() => {
              if (isChangingBg) {
                // Switch back to keep original
                setShowBgInput(false);
                onChangeSettings({ preserveBackground: true, backgroundPrompt: '' });
              } else {
                // Switch to change background
                setShowBgInput(true);
                onChangeSettings({ preserveBackground: false });
              }
            }}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${
              isChangingBg
                ? 'border-sky-300 bg-sky-50/90 text-sky-950 font-bold shadow-2xs'
                : 'border-indigo-300 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs'
            }`}
          >
            {isChangingBg ? (
              <>
                <Mountain className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="text-xs">Đổi bối cảnh mới (Đang bật)</span>
                <span className="text-[10px] bg-sky-200/80 text-sky-800 px-1.5 py-0.5 rounded font-bold">Tùy biến</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-xs">Giữ nguyên cảnh nền & ánh sáng</span>
                <Check className="w-3 h-3 text-indigo-600 ml-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Right: Aspect ratio selector */}
        <div className="flex items-center gap-1.5 text-xs text-stone-700 self-end lg:self-auto">
          <span className="font-semibold text-stone-500 flex items-center gap-1 text-[11px]">
            <Ratio className="w-3.5 h-3.5" />
            Tỉ lệ:
          </span>
          <div className="flex items-center gap-1">
            {aspectRatios.map((ar) => (
              <button
                key={ar.id}
                type="button"
                title={ar.title}
                onClick={() => onChangeSettings({ aspectRatio: ar.id })}
                className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${
                  settings.aspectRatio === ar.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Background prompt input when custom background is active */}
      {isChangingBg && (
        <div className="pt-1.5 border-t border-sky-100 flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-sky-50/40 p-2 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 shrink-0">
            <Mountain className="w-3.5 h-3.5 text-sky-600" />
            <span>Mô tả bối cảnh mới:</span>
          </div>
          <div className="flex-1 w-full flex items-center gap-2">
            <input
              type="text"
              value={settings.backgroundPrompt || ''}
              onChange={(e) =>
                onChangeSettings({
                  backgroundPrompt: e.target.value,
                  preserveBackground: false,
                })
              }
              placeholder="VD: quán cafe ấm cúng, studio hiện đại, góc bếp sang trọng..."
              className="w-full text-xs font-medium text-stone-800 bg-white border border-sky-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-300 rounded-md px-2.5 py-1 outline-none placeholder:text-stone-400 placeholder:italic"
            />
            <button
              type="button"
              onClick={() => {
                setShowBgInput(false);
                onChangeSettings({ preserveBackground: true, backgroundPrompt: '' });
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:bg-stone-100 px-2 py-1 rounded-md shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-stone-400" />
              <span>Khôi phục nền gốc</span>
            </button>
          </div>
          <div className="w-full text-[11px] text-sky-800 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Chỉ đổi bối cảnh nền theo yêu cầu, giữ nguyên 100% vị trí, tỉ lệ và tư thế của sản phẩm & nhân vật.</span>
          </div>
        </div>
      )}
    </div>
  );
};

