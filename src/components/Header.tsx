import React from 'react';
import { Sparkles, Wand2, KeyRound, ShieldCheck, HelpCircle, RotateCcw, Terminal } from 'lucide-react';
import { ApiConfig } from '../types';

interface HeaderProps {
  hasApiKey: boolean;
  hasOpenAiKey?: boolean;
  apiConfig: ApiConfig;
  batchCount: number;
  completedCount: number;
  onReset: () => void;
  onOpenGuide: () => void;
  onOpenApiSettings: () => void;
  onOpenLogModal?: () => void;
  hasApiLog?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  hasOpenAiKey = false,
  apiConfig,
  batchCount,
  completedCount,
  onReset,
  onOpenGuide,
  onOpenApiSettings,
  onOpenLogModal,
  hasApiLog = false,
}) => {
  const isGpt = apiConfig.activeProvider === 'gpt-image-2';
  const isCustomActive = isGpt
    ? Boolean(apiConfig.gptImage?.isCustomKeyActive && apiConfig.gptImage?.apiKey)
    : Boolean(apiConfig.isCustomKeyActive && apiConfig.apiKey);

  const activeModelName = isGpt
    ? (apiConfig.gptImage?.model || 'GPT-Image-2')
    : (apiConfig.model || 'Gemini 3.1 Flash Image');

  const isSystemReady = isGpt ? hasOpenAiKey : hasApiKey;

  return (
    <header
      id="app-header"
      className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-all shadow-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Title and Branding */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ring-1 ring-black/5 ${isGpt
            ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-100'
            : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-indigo-100'
            }`}>
            {isGpt ? (
              <Wand2 className="w-5 h-5 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                CLONE VIDEO V1.0
              </h1>
              <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${isGpt
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                }`}>
                {activeModelName}
              </span>
            </div>
            <p className="text-xs text-stone-500 line-clamp-1">
              Thay thế nhân vật, đổi trang phục mẫu và xóa phụ đề vietsub hàng loạt
            </p>
          </div>
        </div>

        {/* Action Controls & Indicators */}
        <div className="flex items-center flex-wrap gap-2 self-end sm:self-auto">
          {/* Key Settings Button */}
          <button
            id="header-api-key-btn"
            type="button"
            onClick={onOpenApiSettings}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${isCustomActive
              ? isGpt
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              : isSystemReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            title="Cấu hình API Key & Động cơ tạo ảnh"
          >
            {isCustomActive ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            <span>
              {isCustomActive
                ? `${isGpt ? 'GPT-Image-2' : 'Gemini'}: Khóa riêng`
                : isSystemReady
                  ? 'Khóa hệ thống'
                  : 'Cấu hình API Key'}
            </span>
          </button>

          {/* View Body Log Button */}
          {onOpenLogModal && (
            <button
              id="header-view-log-btn"
              type="button"
              onClick={onOpenLogModal}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 ${hasApiLog
                ? 'bg-stone-900 text-emerald-400 border-stone-700 hover:bg-stone-800 shadow-xs'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200/80'
                }`}
              title="Xem toàn bộ Body và Prompt đã gửi đến API tạo ảnh"
            >
              <Terminal className={`w-3.5 h-3.5 ${hasApiLog ? 'text-emerald-400' : 'text-stone-500'}`} />
              <span>Log Body API</span>
              {hasApiLog && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          )}

          {/* Guide button */}
          <button
            id="guide-modal-btn"
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-stone-400" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          {/* Reset button */}
          {(batchCount > 0 || completedCount > 0) && (
            <button
              id="reset-all-btn"
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors"
              title="Làm mới lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
