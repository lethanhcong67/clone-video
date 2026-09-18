import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Header } from './components/Header';
import { OutfitSelector } from './components/OutfitSelector';
import { SubtitleSettings } from './components/SubtitleSettings';
import { BatchControls } from './components/BatchControls';
import { BatchPipelineRows } from './components/BatchPipelineRows';
import { ApplyToAllBanner } from './components/ApplyToAllBanner';
import { GuideModal } from './components/GuideModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ApiStatusBanner } from './components/ApiStatusBanner';
import { ApiLogModal } from './components/ApiLogModal';
import { VideoSceneExtractor } from './components/VideoSceneExtractor';
import { HistoryGalleryModal } from './components/HistoryGalleryModal';
import { ProjectManagerBar } from './components/ProjectManagerBar';
import { BatchImageItem, BatchSettings, OutfitReference, ApiConfig, AppliedReplacementConfig, GptImageConfig, KlingVideoConfig, VisionAnalysisConfig, ProjectRecord } from './types';
import { downloadAllAsZip } from './utils/imageUtils';
import { createSampleBatchItem, generateFallbackResultImage } from './utils/sampleGenerator';
import { generateFullPromptText } from './utils/promptHelper';
import { uploadMediaToSupabase, saveGenerationRecord, updateProject, fetchProjectById } from './utils/supabaseClient';

const API_STORAGE_KEY = 'ai_image_api_config_v2';

const DEFAULT_GPT_CONFIG: GptImageConfig = {
  apiKey: 'sk-2YrQt4dMCkJQCBR439Hq1rlvCtONjFfEvFu7MGrW4rledtzM',
  baseUrl: 'https://api.openlux.ai/v1/images/edits',
  model: 'gpt-image-2',
  size: '1152x2048',
  quality: 'medium',
  isCustomKeyActive: true,
  isValidated: true,
  endpointKeys: {
    'https://api.openlux.ai/v1/images/edits': 'sk-2YrQt4dMCkJQCBR439Hq1rlvCtONjFfEvFu7MGrW4rledtzM',
    'https://www.mnapi.com/v1/images/edits': 'sk-tsuRNN1G5A25E9oGyXPSgeJjaR97tmdTzrxtFHKqgpzQ8ChR',
    'https://api.openai.com/v1': '',
  },
};

export const DEFAULT_KLING_NEGATIVE_PROMPT = '';

export const DEFAULT_KLING_PROMPT =
  'Người mẫu cử động tự nhiên, giữ cố định thiết kế sản phẩm và họa tiết trang phục, ánh sáng điện ảnh cao cấp, 4K';

const DEFAULT_KLING_CONFIG: KlingVideoConfig = {
  apiKey: 'sk-L8zc8s3oiwytWv8TjurONzwhmHsuP5eBRtDqLDD0te1sWyIz',
  baseUrl: 'https://api.openlux.ai/kling/v1/videos/image2video',
  model: 'kling-v2-6',
  mode: 'pro',
  duration: '5',
  aspectRatio: '9:16',
  multiShot: false,
  cfgScale: 0.6,
  negativePrompt: '',
  watermarkEnabled: false,
  isCustomKeyActive: true,
  isValidated: true,
};


export const DEFAULT_VISION_CONFIG: VisionAnalysisConfig = {
  apiKey: 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY',
  provider: 'gemini',
  model: 'gemini-3.5-flash',
  baseUrl: 'https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent',
  isCustomKeyActive: true,
  isValidated: true,
};

function loadSavedApiConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem(API_STORAGE_KEY) || localStorage.getItem('gemini_image_api_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedBaseUrl = parsed.gptImage?.baseUrl;
      const effectiveBaseUrl = savedBaseUrl || 'https://api.openlux.ai/v1/images/edits';

      const defaultGptEndpointKeys: Record<string, string> = {
        'https://api.openlux.ai/v1/images/edits': 'sk-2YrQt4dMCkJQCBR439Hq1rlvCtONjFfEvFu7MGrW4rledtzM',
        'https://www.mnapi.com/v1/images/edits': 'sk-tsuRNN1G5A25E9oGyXPSgeJjaR97tmdTzrxtFHKqgpzQ8ChR',
        'https://api.openai.com/v1': '',
      };
      const mergedGptEndpointKeys = {
        ...defaultGptEndpointKeys,
        ...(parsed.gptImage?.endpointKeys || {}),
      };
      if (parsed.gptImage?.apiKey && effectiveBaseUrl) {
        mergedGptEndpointKeys[effectiveBaseUrl] = parsed.gptImage.apiKey;
      }

      const activeGptKey = parsed.gptImage?.apiKey || mergedGptEndpointKeys[effectiveBaseUrl] || DEFAULT_GPT_CONFIG.apiKey;

      const savedKlingBaseUrl = parsed.kling?.baseUrl;
      const effectiveKlingBaseUrl =
        !savedKlingBaseUrl || savedKlingBaseUrl === 'https://api.klingai.com'
          ? 'https://api.openlux.ai/kling/v1/videos/image2video'
          : savedKlingBaseUrl;

      let activeProvider = parsed.activeProvider || 'gpt-image-2';
      if (activeProvider === 'gemini' && !parsed.apiKey?.startsWith('AIzaSy')) {
        activeProvider = 'gpt-image-2';
      }

      return {
        activeProvider,
        apiKey: parsed.apiKey || 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY',
        model: parsed.model || 'gemini-3.1-flash-image',
        isCustomKeyActive: Boolean(parsed.isCustomKeyActive ?? true),
        isValidated: Boolean(parsed.isValidated ?? true),
        lastValidatedAt: parsed.lastValidatedAt,
        gptImage: {
          apiKey: activeGptKey,
          baseUrl: effectiveBaseUrl,
          model: parsed.gptImage?.model || 'gpt-image-2',
          size: parsed.gptImage?.size || '1152x2048',
          quality: parsed.gptImage?.quality === 'standard' ? 'medium' : (parsed.gptImage?.quality || 'medium'),
          isCustomKeyActive: Boolean(activeGptKey),
          isValidated: parsed.gptImage?.isValidated !== undefined ? Boolean(parsed.gptImage?.isValidated) : DEFAULT_GPT_CONFIG.isValidated,
          lastValidatedAt: parsed.gptImage?.lastValidatedAt,
          endpointKeys: mergedGptEndpointKeys,
        },
        kling: {
          apiKey: parsed.kling?.apiKey || DEFAULT_KLING_CONFIG.apiKey,
          accessKey: parsed.kling?.accessKey,
          secretKey: parsed.kling?.secretKey,
          baseUrl: effectiveKlingBaseUrl,
          model: parsed.kling?.model || 'kling-v2-6',
          mode: parsed.kling?.mode || 'pro',
          duration: parsed.kling?.duration || '5',
          aspectRatio: parsed.kling?.aspectRatio || '9:16',
          multiShot: parsed.kling?.multiShot !== undefined ? parsed.kling.multiShot : false,
          cfgScale: parsed.kling?.cfgScale !== undefined ? parsed.kling.cfgScale : 0.6,
          negativePrompt:
            parsed.kling?.negativePrompt && !parsed.kling.negativePrompt.includes('camera movement')
              ? parsed.kling.negativePrompt
              : '',
          watermarkEnabled: parsed.kling?.watermarkEnabled !== undefined ? parsed.kling.watermarkEnabled : false,
          isCustomKeyActive: Boolean(
            parsed.kling?.apiKey ||
            DEFAULT_KLING_CONFIG.apiKey ||
            (parsed.kling?.accessKey && parsed.kling?.secretKey)
          ),
          isValidated: parsed.kling?.isValidated !== undefined ? Boolean(parsed.kling?.isValidated) : DEFAULT_KLING_CONFIG.isValidated,
          lastValidatedAt: parsed.kling?.lastValidatedAt,
        },
        visionAnalysis: {
          apiKey: parsed.visionAnalysis?.apiKey || DEFAULT_VISION_CONFIG.apiKey,
          provider: parsed.visionAnalysis?.provider || DEFAULT_VISION_CONFIG.provider,
          model: parsed.visionAnalysis?.model || DEFAULT_VISION_CONFIG.model,
          baseUrl: parsed.visionAnalysis?.baseUrl || DEFAULT_VISION_CONFIG.baseUrl,
          isCustomKeyActive: Boolean(parsed.visionAnalysis?.apiKey || DEFAULT_VISION_CONFIG.apiKey),
          isValidated: parsed.visionAnalysis?.isValidated !== undefined ? Boolean(parsed.visionAnalysis?.isValidated) : DEFAULT_VISION_CONFIG.isValidated,
          lastValidatedAt: parsed.visionAnalysis?.lastValidatedAt,
        },
      };
    }
  } catch (e) {
    console.warn('Lỗi đọc API config từ storage:', e);
  }
  return {
    activeProvider: 'gpt-image-2',
    apiKey: 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY',
    model: 'gemini-3.1-flash-image',
    isCustomKeyActive: true,
    isValidated: true,
    gptImage: DEFAULT_GPT_CONFIG,
    kling: DEFAULT_KLING_CONFIG,
    visionAnalysis: DEFAULT_VISION_CONFIG,
  };

}

export default function App() {
  const [items, setItems] = useState<BatchImageItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [uploadedOutfits, setUploadedOutfits] = useState<OutfitReference[]>([]);
  const uploadedOutfit = uploadedOutfits[0] || null;

  const handleAddUploadedOutfits = (newOutfits: OutfitReference[]) => {
    setUploadedOutfits((prev) => [...prev, ...newOutfits]);
  };

  const handleUpdateUploadedOutfit = (id: string, updates: Partial<OutfitReference>) => {
    setUploadedOutfits((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const handleRemoveUploadedOutfit = (id: string) => {
    setUploadedOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  const handleClearUploadedOutfits = () => {
    setUploadedOutfits([]);
  };

  // API Config state with local storage persistence
  const [apiConfig, setApiConfig] = useState<ApiConfig>(loadSavedApiConfig);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiModalTab, setApiModalTab] = useState<'gemini' | 'gpt-image-2' | 'kling'>('gpt-image-2');

  // Settings
  const [settings, setSettings] = useState<BatchSettings>({
    enableCharacter: false, // Default is FALSE: do NOT add or alter characters unless explicitly requested
    characterPrompt: '',
    enableOutfit: true,
    productName: '',
    productDescription: '',
    outfitPrompt: 'thay sản phẩm ở hình image2 sang hình image1',
    removeSubtitles: true,
    preservePose: true,
    preserveBackground: true,
    backgroundPrompt: '',
    stylePreset: 'photorealistic',
    aspectRatio: '9:16',
    concurrency: 5, // Concurrency limit: always runs up to 5 images simultaneously
    variationsPerItem: 1, // Number of variation images generated per image (1 to 5, max 5)
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [activeProcessingIds, setActiveProcessingIds] = useState<string[]>([]);
  const isCancelledRef = useRef(false);

  // API Status & Modals
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false);
  const [hasKlingKey, setHasKlingKey] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [latestApiLog, setLatestApiLog] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  // Project & Session Management State
  const [currentProject, setCurrentProject] = useState<ProjectRecord | null>(null);
  const [isProjectDirty, setIsProjectDirty] = useState(false);
  const [isProjectSaving, setIsProjectSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [extractorResetKey, setExtractorResetKey] = useState(0);

  // Check health and API key on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
        setHasOpenAiKey(Boolean(data.hasOpenAiKey));
        setHasKlingKey(Boolean(data.hasKlingKey));
      })
      .catch((err) => {
        console.warn('API health check error:', err);
      });
  }, []);

  // Prevent accidental page close or refresh if there are tasks or generated results
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing || (isProjectDirty && items.length > 0)) {
        e.preventDefault();
        e.returnValue = 'Bạn có dữ liệu trong dự án chưa lưu lên Cloud. Bạn có chắc muốn rời khỏi trang không?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing, isProjectDirty, items.length]);

  // Handle Reset: Clears entire workspace back to clean blank initial state
  const handleReset = () => {
    if (isProcessing) {
      showToast('Đang trong quá trình tạo ảnh AI, không thể làm mới!', 'warning');
      return;
    }

    const confirm = window.confirm('Bạn có chắc chắn muốn làm mới toàn bộ giao diện về trạng thái ban đầu (trắng hoàn toàn) không?');
    if (!confirm) return;

    setItems([]);
    setSelectedItemId(null);
    setUploadedOutfits([]);
    setExtractorResetKey((prev) => prev + 1);
    setSettings({
      enableCharacter: false,
      characterPrompt: '',
      enableOutfit: true,
      productName: '',
      productDescription: '',
      outfitPrompt: 'thay sản phẩm ở hình image2 sang hình image1',
      removeSubtitles: true,
      preservePose: true,
      preserveBackground: true,
      backgroundPrompt: '',
      stylePreset: 'photorealistic',
      aspectRatio: '9:16',
      concurrency: 5,
      variationsPerItem: 1,
    });
    setCurrentProject(null);
    setIsProjectDirty(false);
    setLastSavedAt(null);
    localStorage.removeItem('ai_app_active_project_id');
    showToast('Đã làm mới toàn bộ giao diện về trạng thái ban đầu sạch sẽ!', 'info');
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const isSkipDirtyTrackingRef = useRef(true);

  // Handler: Select and restore an existing project with full state
  const handleSelectProject = (project: ProjectRecord) => {
    isSkipDirtyTrackingRef.current = true;
    setExtractorResetKey((prev) => prev + 1);
    setCurrentProject(project);
    if (project.settings) {
      setSettings((prev) => ({ ...prev, ...project.settings }));
    }
    if (project.uploaded_outfits && project.uploaded_outfits.length > 0) {
      setUploadedOutfits(project.uploaded_outfits);
    } else {
      setUploadedOutfits([]);
    }
    if (project.items && project.items.length > 0) {
      setItems(project.items);
      setSelectedItemId(project.items[0].id);
    } else {
      setItems([]);
      setSelectedItemId(null);
    }
    setIsProjectDirty(false);
    setLastSavedAt(new Date(project.updated_at || project.created_at || Date.now()));
  };

  // Watch for workspace changes to mark dirty state for active project
  useEffect(() => {
    if (isSkipDirtyTrackingRef.current) {
      isSkipDirtyTrackingRef.current = false;
      return;
    }
    if (currentProject) {
      setIsProjectDirty(true);
    }
  }, [items, settings, uploadedOutfits]);

  // Keep refs in sync for non-blocking auto-save operations
  const currentProjectRef = useRef<ProjectRecord | null>(currentProject);
  const settingsRef = useRef(settings);
  const uploadedOutfitsRef = useRef(uploadedOutfits);
  const isAutoSavingRef = useRef(false);
  const pendingAutoSaveItemsRef = useRef<BatchImageItem[] | null>(null);

  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    uploadedOutfitsRef.current = uploadedOutfits;
  }, [uploadedOutfits]);

  // Non-blocking auto-save project when any image or video finishes generating
  const triggerAutoSaveProject = useCallback(async (latestItems: BatchImageItem[]) => {
    const proj = currentProjectRef.current;
    if (!proj?.id) return;

    if (isAutoSavingRef.current) {
      pendingAutoSaveItemsRef.current = latestItems;
      return;
    }

    isAutoSavingRef.current = true;
    setIsProjectSaving(true);

    try {
      const updated = await updateProject(proj.id, {
        settings: settingsRef.current,
        uploaded_outfits: uploadedOutfitsRef.current,
        items: latestItems,
      });

      if (updated) {
        setCurrentProject(updated);
        setIsProjectDirty(false);
        setLastSavedAt(new Date());
        console.log(`[Auto-Save Project] Đã tự động cập nhật dự án "${updated.name}" lên Supabase Cloud!`);
      }
    } catch (err) {
      console.warn('[Auto-Save Project Warning]:', err);
    } finally {
      isAutoSavingRef.current = false;
      setIsProjectSaving(false);

      if (pendingAutoSaveItemsRef.current) {
        const nextBatch = pendingAutoSaveItemsRef.current;
        pendingAutoSaveItemsRef.current = null;
        triggerAutoSaveProject(nextBatch);
      }
    }
  }, []);

  // Calculate if AI generation for images or videos is currently in progress
  const isGenerating =
    isProcessing ||
    activeProcessingIds.length > 0 ||
    items.some((it) => it.status === 'processing' || it.videoStatus === 'generating');

  // Handler: Save current project to Supabase (update existing project with latest state)
  const handleSaveCurrentProject = async (): Promise<boolean> => {
    if (isGenerating) {
      showToast('Đang có tiến trình tạo ảnh hoặc video AI đang chạy. Không thể lưu dự án lúc này, vui lòng đợi hoàn tất!', 'warning');
      return false;
    }

    if (!currentProject?.id) {
      showToast('Chưa chọn dự án nào. Hãy bấm "Dự Án Mới" để lưu.', 'warning');
      return false;
    }

    setIsProjectSaving(true);
    try {
      const updated = await updateProject(currentProject.id, {
        settings,
        uploaded_outfits: uploadedOutfits,
        items,
      });

      if (updated) {
        setCurrentProject(updated);
        setIsProjectDirty(false);
        setLastSavedAt(new Date());
        showToast(`Đã cập nhật các thay đổi mới nhất vào dự án "${updated.name}" trên Supabase Cloud!`, 'success');
        return true;
      } else {
        showToast('Không thể cập nhật dự án lên Supabase.', 'warning');
        return false;
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi cập nhật dự án.', 'warning');
      return false;
    } finally {
      setIsProjectSaving(false);
    }
  };

  // Global Ctrl+S shortcut to quickly save/update project
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isGenerating) {
          showToast('Đang trong quá trình tạo ảnh/video AI dở, vui lòng đợi hoàn tất!', 'warning');
          return;
        }
        if (currentProject?.id) {
          handleSaveCurrentProject();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, isGenerating, settings, uploadedOutfits, items]);

  // Quick load 3 sample images with subtitles
  const handleLoadSamples = () => {
    const sample1 = createSampleBatchItem(
      'sample_01',
      'Canh_Phim_Dien_Anh_01.jpg',
      'Nhân vật cũ: Chàng trai áo sơ mi cũ',
      'Sơ mi rách bạc màu',
      '[SUB] "Định mệnh đã đưa chúng ta gặp lại nhau ở đây..."',
      '#1e1b4b',
      '#312e81'
    );

    const sample2 = createSampleBatchItem(
      'sample_02',
      'Phim_Co_Trang_Kiem_Hiep_02.jpg',
      'Nhân vật cũ: Võ sĩ trung niên',
      'Vải gai thô sơ',
      '[EP 12 - 42:15] "Ta nhất định phải tìm ra sự thật!"',
      '#450a0a',
      '#7f1d1d'
    );

    const sample3 = createSampleBatchItem(
      'sample_03',
      'Poster_Phim_Chieu_Rap_03.jpg',
      'Nhân vật cũ: Cô gái thành thị',
      'Áo thun đơn giản',
      '© Netflix Official - Vietsub by MovieSubTeam',
      '#064e3b',
      '#065f46'
    );

    setItems([sample1, sample2, sample3]);
    setSelectedItemId(sample1.id);
    showToast('Đã nạp 3 ảnh mẫu kèm phụ đề sẵn sàng thử nghiệm!', 'success');
  };

  // Add new items from upload zone
  const handleAddItems = (newItems: BatchImageItem[]) => {
    // Crucial: Character is ONLY enabled if explicitly toggled on AND has a non-empty character prompt!
    const isCharActiveByDefault = Boolean(settings.enableCharacter && settings.characterPrompt.trim());

    const defaultAppliedConfig: AppliedReplacementConfig = {
      enableCharacter: isCharActiveByDefault,
      enableOutfit: true,
      enableBackground: Boolean(settings.backgroundPrompt?.trim()),
      characterPrompt: settings.characterPrompt,
      productName: settings.productName,
      productDescription: settings.productDescription,
      outfitPrompt: settings.outfitPrompt,
      backgroundPrompt: settings.backgroundPrompt || '',
      productReferences: uploadedOutfits.length > 0 ? [...uploadedOutfits] : undefined,
      outfitImageUrl: uploadedOutfit?.previewUrl || uploadedOutfit?.dataUrl || null,
      outfitImageName: uploadedOutfit?.name || null,
      preservePose: settings.preservePose,
      appliedAt: Date.now(),
    };

    const enhancedItems = newItems.map((item) => ({
      ...item,
      appliedConfig: item.appliedConfig || { ...defaultAppliedConfig },
    }));

    setItems((prev) => [...prev, ...enhancedItems]);
    if (!selectedItemId && enhancedItems.length > 0) {
      setSelectedItemId(enhancedItems[0].id);
    }
    showToast(`Đã thêm ${newItems.length} hình ảnh vào hàng đợi.`, 'info');
  };

  // Apply character and outfit/product replacement to ALL images
  const handleApplyToAll = () => {
    if (items.length === 0) {
      showToast('Chưa có hình ảnh nào trong danh sách để áp dụng. Hãy tải ảnh lên trước.', 'warning');
      return;
    }

    const isCharActive = Boolean(settings.enableCharacter && settings.characterPrompt.trim());

    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        appliedConfig: {
          // Explicitly follow settings.enableCharacter
          enableCharacter: isCharActive,
          enableOutfit: item.appliedConfig?.enableOutfit ?? true,
          enableBackground: item.appliedConfig?.enableBackground ?? Boolean(settings.backgroundPrompt?.trim()),
          characterPrompt: settings.characterPrompt,
          productName: settings.productName,
          productDescription: settings.productDescription,
          outfitPrompt: settings.outfitPrompt,
          backgroundPrompt: item.appliedConfig?.backgroundPrompt !== undefined ? item.appliedConfig.backgroundPrompt : (settings.backgroundPrompt || ''),
          productReferences: uploadedOutfits.length > 0 ? [...uploadedOutfits] : undefined,
          outfitImageUrl: uploadedOutfit?.previewUrl || uploadedOutfit?.dataUrl || null,
          outfitImageName: uploadedOutfit?.name || null,
          preservePose: settings.preservePose,
          appliedAt: Date.now(),
        },
      }))
    );

    const productDisplayName = settings.productName
      ? (settings.productDescription ? `sản phẩm "${settings.productName} (${settings.productDescription})"` : `sản phẩm "${settings.productName}"`)
      : (settings.productDescription ? `sản phẩm (${settings.productDescription})` : 'sản phẩm');

    showToast(
      isCharActive
        ? `Đã đồng bộ nhân vật & ${uploadedOutfits.length > 1 ? `${uploadedOutfits.length} sản phẩm tham chiếu` : productDisplayName} cho tất cả ${items.length} ảnh!`
        : `Đã đồng bộ thay thế ${uploadedOutfits.length > 1 ? `${uploadedOutfits.length} sản phẩm tham chiếu [ref2, ref3...]` : productDisplayName} (giữ nguyên người & ảnh gốc) cho tất cả ${items.length} ảnh!`,
      'success'
    );
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedItemId === id) {
      const remaining = items.filter((it) => it.id !== id);
      setSelectedItemId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Clear all
  const handleClearAll = () => {
    setItems([]);
    setSelectedItemId(null);
  };

  // Process a single image through server or local fallback
  const processSingleImage = async (item: BatchImageItem, variationIndex = 0): Promise<string> => {
    // Respect per-item appliedConfig first, then fallback to global settings
    // Crucial rule: Character replacement is ONLY active if BOTH enabled AND a non-empty character prompt exists!
    // If not enabled or no character prompt is specified, AI must NOT add or modify any character!
    const hasCharPrompt = Boolean(
      (item.appliedConfig?.characterPrompt && item.appliedConfig.characterPrompt.trim()) ||
      (settings.characterPrompt && settings.characterPrompt.trim())
    );
    const itemWantsChar = item.appliedConfig?.enableCharacter ?? settings.enableCharacter;
    const isCharacterEnabled = Boolean(itemWantsChar && hasCharPrompt);
    const isOutfitEnabled = item.appliedConfig?.enableOutfit !== false;

    const effectiveCharacterPrompt = isCharacterEnabled
      ? (item.appliedConfig?.characterPrompt?.trim() || settings.characterPrompt.trim())
      : '';
    const effectiveProductName = item.appliedConfig?.productName?.trim() || settings.productName?.trim() || '';
    let effectiveOutfitPrompt = isOutfitEnabled
      ? (item.appliedConfig?.outfitPrompt?.trim() || settings.outfitPrompt.trim())
      : '';
    const effectiveOutfitImageBase64 = isOutfitEnabled
      ? (item.appliedConfig?.outfitImageUrl || uploadedOutfit?.dataUrl || null)
      : null;

    // If prompt is empty, supply the exact required pattern
    if (isOutfitEnabled && !effectiveOutfitPrompt) {
      effectiveOutfitPrompt = 'thay sản phẩm ở hình image2 sang hình image1';
    }

    const hasItemBgConfig = item.appliedConfig?.enableBackground !== undefined;
    const isBgEnabledForItem = hasItemBgConfig
      ? Boolean(item.appliedConfig?.enableBackground)
      : Boolean(settings.backgroundPrompt?.trim());

    const effectiveBackgroundPrompt = isBgEnabledForItem
      ? (item.appliedConfig?.backgroundPrompt !== undefined ? item.appliedConfig.backgroundPrompt.trim() : (settings.backgroundPrompt?.trim() || ''))
      : '';
    const effectivePreserveBackground = effectiveBackgroundPrompt
      ? false
      : (item.appliedConfig?.preserveBackground ?? settings.preserveBackground);
    // When changing background, pose and position must strictly be preserved
    const effectivePreservePose = effectiveBackgroundPrompt ? true : (item.appliedConfig?.preservePose ?? settings.preservePose);

    // Resolve multiple product references for this row: image[ref1, ref2, ...]
    const targetProductRefs: OutfitReference[] = (item.appliedConfig?.productReferences && item.appliedConfig.productReferences.length > 0)
      ? item.appliedConfig.productReferences
      : (uploadedOutfits.length > 0 ? uploadedOutfits : (uploadedOutfit ? [uploadedOutfit] : []));

    const productImagesPayload = targetProductRefs.map((p, idx) => ({
      data: p.dataUrl || p.previewUrl,
      mimeType: p.mimeType || 'image/jpeg',
      name: p.name || `ref${idx + 2}`,
      refIndex: idx + 2,
    }));

    // Determine active provider and credentials (default: OpenLux AI / gpt-image-2)
    let providerToUse = apiConfig.activeProvider || 'gpt-image-2';
    const rawGeminiKey = apiConfig.apiKey ? apiConfig.apiKey.trim() : '';
    const rawGptKey = apiConfig.gptImage?.apiKey ? apiConfig.gptImage.apiKey.trim() : '';

    // Smart auto-detection: If using Gemini but key is sk- (OpenLux AI) or not native Google AIzaSy, ALWAYS use OpenLux AI (gpt-image-2)
    if (providerToUse === 'gemini' && !rawGeminiKey.startsWith('AIzaSy')) {
      providerToUse = 'gpt-image-2';
    } else if (providerToUse === 'gpt-image-2' && rawGptKey.startsWith('AIzaSy') && !rawGeminiKey) {
      providerToUse = 'gemini';
    }

    const effectiveApiKey = (providerToUse === 'gpt-image-2' ? rawGptKey : rawGeminiKey) || rawGptKey || rawGeminiKey;

    // Resolve the exact, complete prompt for this specific row item (matches what is shown in the Prompt Modal)
    const rowFullPrompt = (item.customPrompt || item.appliedConfig?.customPrompt)?.trim()
      || generateFullPromptText(item, settings, uploadedOutfits, uploadedOutfit);

    const requestPayload = {
      provider: providerToUse,
      variationIndex,
      prompt: rowFullPrompt,
      customPrompt: rowFullPrompt,
      gptImageConfig: {
        apiKey: effectiveApiKey ? 'sk-***' : undefined,
        baseUrl: apiConfig.gptImage?.baseUrl || 'https://api.openlux.ai/v1/images/edits',
        model: apiConfig.gptImage?.model || 'gpt-image-2',
        quality: apiConfig.gptImage?.quality || 'standard',
      },
      productImagesCount: productImagesPayload.length,
      originalMimeType: item.mimeType,
      enableCharacter: isCharacterEnabled,
      enableOutfit: isOutfitEnabled,
      enableBackground: Boolean(effectiveBackgroundPrompt),
      characterPrompt: effectiveCharacterPrompt,
      productName: effectiveProductName,
      outfitPrompt: effectiveOutfitPrompt,
      backgroundPrompt: effectiveBackgroundPrompt,
      removeSubtitles: settings.removeSubtitles,
      preserveBackground: effectivePreserveBackground,
      preservePose: effectivePreservePose,
      stylePreset: settings.stylePreset,
      aspectRatio: settings.aspectRatio,
      selectedModel: apiConfig.model || 'gemini-3.1-flash-image',
    };

    console.log(
      `%c[AI Image Generator] GỬI YÊU CẦU BODY TẠO ẢNH (Bản #${variationIndex + 1}) SANG SERVER:`,
      'background: #1e3a8a; color: #60a5fa; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 12px;',
      requestPayload
    );

    // Define provider cascade attempts for GPT-Image-2 (OpenLux AI -> MNAPI fallback)
    const gptEndpointsToTry = providerToUse === 'gpt-image-2'
      ? [
          {
            name: 'OpenLux AI',
            baseUrl: 'https://api.openlux.ai/v1/images/edits',
            apiKey:
              apiConfig.gptImage?.endpointKeys?.['https://api.openlux.ai/v1/images/edits'] ||
              (apiConfig.gptImage?.baseUrl?.includes('openlux.ai') ? apiConfig.gptImage?.apiKey : undefined) ||
              'sk-2YrQt4dMCkJQCBR439Hq1rlvCtONjFfEvFu7MGrW4rledtzM',
          },
          {
            name: 'MNAPI',
            baseUrl: 'https://www.mnapi.com/v1/images/edits',
            apiKey:
              apiConfig.gptImage?.endpointKeys?.['https://www.mnapi.com/v1/images/edits'] ||
              (apiConfig.gptImage?.baseUrl?.includes('mnapi.com') ? apiConfig.gptImage?.apiKey : undefined) ||
              'sk-tsuRNN1G5A25E9oGyXPSgeJjaR97tmdTzrxtFHKqgpzQ8ChR',
          },
        ]
      : [
          {
            name: 'Gemini',
            baseUrl: apiConfig.visionAnalysis?.baseUrl || 'https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent',
            apiKey: effectiveApiKey,
          },
        ];

    let lastErrorDetail = '';

    for (let attemptIdx = 0; attemptIdx < gptEndpointsToTry.length; attemptIdx++) {
      const currentAttempt = gptEndpointsToTry[attemptIdx];
      const attemptApiKey = currentAttempt.apiKey || effectiveApiKey;

      try {
        console.log(
          `%c[AI Image Generator] GỬI YÊU CẦU TẠO ẢNH (${currentAttempt.name} - Lượt ${attemptIdx + 1}/${gptEndpointsToTry.length}):`,
          'background: #1e3a8a; color: #60a5fa; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 12px;',
          {
            provider: providerToUse,
            targetProvider: currentAttempt.name,
            endpoint: currentAttempt.baseUrl,
            variationIndex,
          }
        );

        const response = await fetch('/api/generate-replacement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: providerToUse,
            variationIndex,
            prompt: rowFullPrompt,
            customPrompt: rowFullPrompt,
            gptImageConfig: {
              apiKey: attemptApiKey,
              baseUrl: currentAttempt.baseUrl,
              model: apiConfig.gptImage?.model || 'gpt-image-2',
              size: apiConfig.gptImage?.size || '1152x2048',
              quality: apiConfig.gptImage?.quality || 'medium',
              endpointKeys: apiConfig.gptImage?.endpointKeys,
            },
            productImages: productImagesPayload,
            originalImageBase64: item.dataUrl,
            originalMimeType: item.mimeType,
            enableCharacter: isCharacterEnabled,
            enableOutfit: isOutfitEnabled,
            enableBackground: Boolean(effectiveBackgroundPrompt),
            characterPrompt: effectiveCharacterPrompt,
            productName: effectiveProductName,
            outfitPrompt: effectiveOutfitPrompt,
            backgroundPrompt: effectiveBackgroundPrompt,
            outfitImageBase64: effectiveOutfitImageBase64,
            outfitMimeType: uploadedOutfit?.mimeType || 'image/jpeg',
            removeSubtitles: settings.removeSubtitles,
            preserveBackground: effectivePreserveBackground,
            preservePose: effectivePreservePose,
            stylePreset: settings.stylePreset,
            aspectRatio: settings.aspectRatio,
            apiKey: attemptApiKey,
            selectedModel: apiConfig.model || 'gemini-3.1-flash-image',
          }),
        });

        let data: any = {};
        const responseText = await response.text();
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch (parseErr) {
          data = { error: `HTTP ${response.status}: ${responseText.substring(0, 100)}` };
        }

        if (data.loggedBody) {
          console.log(
            '%c[AI Image Generator] PHẢN HỒI KÈM LOG BODY TẠO ẢNH TỪ SERVER:',
            'background: #064e3b; color: #34d399; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 12px;',
            data.loggedBody
          );
          setLatestApiLog(data.loggedBody);
        }

        if (response.ok && data.imageUrl) {
          if (attemptIdx > 0) {
            showToast(`Đã tự động chuyển đổi và tạo ảnh thành công qua ${currentAttempt.name}!`, 'success');
          }

          // Auto-save generated image & prompt to Supabase Cloud in background
          (async () => {
            try {
              const fileName = `img_${item.name ? item.name.replace(/[^a-zA-Z0-9._-]/g, '_') : Date.now()}.png`;
              const publicUrl = await uploadMediaToSupabase(data.imageUrl, fileName, 'outputs');
              await saveGenerationRecord({
                task_type: 'image_swap',
                status: 'completed',
                prompt: rowFullPrompt,
                output_media_url: publicUrl || data.imageUrl,
                thumbnail_url: publicUrl || data.imageUrl,
                model_name: providerToUse === 'gpt-image-2' ? (apiConfig.gptImage?.model || 'gpt-image-2') : (apiConfig.model || 'gemini-3.1-flash-image'),
                parameters: {
                  aspectRatio: settings.aspectRatio,
                  stylePreset: settings.stylePreset,
                  provider: providerToUse,
                  enableCharacter: isCharacterEnabled,
                  enableOutfit: isOutfitEnabled,
                },
                input_media: {
                  item_name: item.name,
                  product_name: effectiveProductName,
                },
              });
              console.log('[Supabase Cloud] Đã tự động lưu ảnh và Prompt vào Supabase Cloud!');
            } catch (supaErr) {
              console.warn('[Supabase Cloud Auto-Save Warning]:', supaErr);
            }
          })();

          return data.imageUrl;
        } else {
          lastErrorDetail = data.error || (data.needsApiKey ? 'Chưa cấu hình API Key hoặc Khóa API không hợp lệ.' : 'Máy chủ AI không thể tạo ảnh.');
          console.warn(`[Failover] ${currentAttempt.name} trả về lỗi:`, lastErrorDetail);

          // If there is another provider to try (e.g. MNAPI fallback), notify and continue
          if (attemptIdx < gptEndpointsToTry.length - 1) {
            const nextProvider = gptEndpointsToTry[attemptIdx + 1];
            showToast(`${currentAttempt.name} gặp sự cố, đang tự động gen lại bằng ${nextProvider.name}...`, 'info');
            continue;
          }
        }
      } catch (err: any) {
        lastErrorDetail = err?.message || String(err);
        console.warn(`[Failover] Ngoại lệ khi gọi ${currentAttempt.name}:`, lastErrorDetail);
        if (attemptIdx < gptEndpointsToTry.length - 1) {
          const nextProvider = gptEndpointsToTry[attemptIdx + 1];
          showToast(`${currentAttempt.name} lỗi, đang tự động gen lại bằng ${nextProvider.name}...`, 'info');
          continue;
        }
      }
    }

    // If all attempts fail, show warning and throw
    showToast(`Lỗi tạo ảnh sau khi thử tất cả dịch vụ: ${lastErrorDetail}`, 'warning');
    throw new Error(lastErrorDetail);
  };

  // Start batch processing queue with concurrency (up to 5 concurrent images at once)
  const handleStartProcessing = async () => {
    if (items.length === 0) {
      showToast('Vui lòng tải lên ít nhất 1 hình ảnh để xử lý!', 'warning');
      return;
    }

    // Determine pending items to process
    const pendingIndices: number[] = [];
    items.forEach((it, idx) => {
      if (it.status !== 'completed' || !it.resultImageUrl) {
        pendingIndices.push(idx);
      }
    });

    if (pendingIndices.length === 0) {
      showToast('Tất cả hình ảnh đã được xử lý hoàn tất!', 'info');
      return;
    }

    setIsProcessing(true);
    isCancelledRef.current = false;

    // Concurrency limit: 1 to 5 concurrent images at once (default 5)
    const concurrencyLimit = Math.min(Math.max(settings.concurrency || 5, 1), 5);
    const activeIds: string[] = [];
    let nextQueueIdx = 0;

    const runWorker = async (workerId: number) => {
      while (nextQueueIdx < pendingIndices.length) {
        if (isCancelledRef.current) break;

        const targetItemIndex = pendingIndices[nextQueueIdx];
        nextQueueIdx++;

        const currentItem = items[targetItemIndex];
        if (!currentItem) continue;

        activeIds.push(currentItem.id);
        setActiveProcessingIds([...activeIds]);
        setCurrentProcessingIndex(targetItemIndex);
        setSelectedItemId(currentItem.id);

        // Update item to processing
        setItems((prev) =>
          prev.map((it) =>
            it.id === currentItem.id
              ? { ...it, status: 'processing', progress: 30, error: undefined }
              : it
          )
        );

        try {
          const resultUrl = await processSingleImage(currentItem);

          if (isCancelledRef.current) break;

          setItems((prev) => {
            const next = prev.map((it) =>
              it.id === currentItem.id
                ? {
                  ...it,
                  status: 'completed',
                  progress: 100,
                  resultImageUrl: resultUrl,
                  resultImageUrls: [resultUrl],
                  activeResultIndex: 0,
                }
                : it
            );
            triggerAutoSaveProject(next);
            return next;
          });
        } catch (err: any) {
          if (!isCancelledRef.current) {
            setItems((prev) =>
              prev.map((it) =>
                it.id === currentItem.id
                  ? {
                    ...it,
                    status: 'error',
                    progress: 0,
                    error: err?.message || 'Lỗi khi xử lý hình ảnh',
                  }
                  : it
              )
            );
          }
        } finally {
          const remIdx = activeIds.indexOf(currentItem.id);
          if (remIdx !== -1) {
            activeIds.splice(remIdx, 1);
            setActiveProcessingIds([...activeIds]);
          }
        }
      }
    };

    const actualWorkersCount = Math.min(concurrencyLimit, pendingIndices.length);
    const workerPromises = Array.from({ length: actualWorkersCount }, (_, wId) => runWorker(wId));

    await Promise.all(workerPromises);

    setIsProcessing(false);
    setActiveProcessingIds([]);

    if (!isCancelledRef.current) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast(`Đã hoàn tất xử lý toàn bộ ảnh (tốc độ song song ${concurrencyLimit} ảnh cùng lúc)!`, 'success');
    }
  };

  // Stop processing
  const handleStopProcessing = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setActiveProcessingIds([]);
    showToast('Đã tạm dừng quá trình xử lý.', 'info');
  };

  // Update a single item by id (auto-syncs to project on image/video completion)
  const handleUpdateItem = (id: string, updates: Partial<BatchImageItem>) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      if (
        updates.status === 'completed' ||
        updates.videoStatus === 'completed' ||
        (updates.resultImageUrl && updates.status !== 'processing') ||
        (updates.videoUrl && updates.videoStatus !== 'generating')
      ) {
        triggerAutoSaveProject(next);
      }
      return next;
    });
  };

  // Process a single item directly from its row (generates 1 image)
  const handleProcessSingleItem = async (item: BatchImageItem) => {
    handleUpdateItem(item.id, { status: 'processing', progress: 30, error: undefined });

    try {
      const resultUrl = await processSingleImage(item);
      handleUpdateItem(item.id, {
        status: 'completed',
        progress: 100,
        resultImageUrl: resultUrl,
        resultImageUrls: [resultUrl],
        activeResultIndex: 0,
      });
      showToast(`Đã tạo ảnh mới thành công cho: ${item.name}`, 'success');
    } catch (err: any) {
      handleUpdateItem(item.id, {
        status: 'error',
        progress: 0,
        error: err.message || 'Lỗi khi tạo ảnh',
      });
      showToast(`Lỗi khi tạo ảnh cho: ${item.name}`, 'warning');
    }
  };

  // Retry single item
  const handleRetryItem = async (itemId: string) => {
    const itemIndex = items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;

    const targetItem = items[itemIndex];
    handleUpdateItem(itemId, { status: 'processing', progress: 50, error: undefined });

    try {
      const resultUrl = await processSingleImage(targetItem);
      handleUpdateItem(itemId, {
        status: 'completed',
        progress: 100,
        resultImageUrl: resultUrl,
        resultImageUrls: [resultUrl],
        activeResultIndex: 0,
      });
      showToast('Đã tạo lại ảnh thành công!', 'success');
    } catch (err: any) {
      handleUpdateItem(itemId, {
        status: 'error',
        error: err?.message || 'Lỗi tạo lại ảnh',
      });
      showToast('Lỗi khi tạo lại ảnh.', 'warning');
    }
  };

  // Download all as ZIP
  const handleDownloadAllZip = () => {
    const completedItems: Array<{ name: string; resultImageUrl: string }> = [];

    items.forEach((it) => {
      if (it.status === 'completed') {
        if (it.resultImageUrls && it.resultImageUrls.length > 1) {
          it.resultImageUrls.forEach((url, idx) => {
            const ext = it.name.includes('.') ? it.name.substring(it.name.lastIndexOf('.')) : '.png';
            const baseName = it.name.replace(/\.[^/.]+$/, '');
            completedItems.push({
              name: `${baseName}_ban_${idx + 1}${ext}`,
              resultImageUrl: url,
            });
          });
        } else if (it.resultImageUrl) {
          completedItems.push({
            name: it.name,
            resultImageUrl: it.resultImageUrl,
          });
        }
      }
    });

    if (completedItems.length === 0) {
      showToast('Chưa có ảnh nào hoàn thành để tải về dạng zip.', 'warning');
      return;
    }

    downloadAllAsZip(completedItems, `bo-anh-da-thay-the-${Date.now()}.zip`);
    showToast(`Đang tải về tệp ZIP chứa ${completedItems.length} ảnh đã tạo...`, 'success');
  };

  // Handle Save API configuration
  const handleSaveApiConfig = (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    try {
      localStorage.setItem(API_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Lỗi lưu cấu hình API vào bộ nhớ:', e);
    }
    if (newConfig.isCustomKeyActive && newConfig.apiKey) {
      showToast(`Đã kích hoạt khóa API riêng với mô hình ${newConfig.model}!`, 'success');
    } else {
      showToast('Đã lưu cấu hình API.', 'info');
    }
  };

  const completedCount = items.filter((it) => it.status === 'completed').length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const canStart = items.length > 0 && !isProcessing;

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-800 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-16">
      {/* Toast notification */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white transition-all transform animate-in fade-in slide-in-from-top-2 ${notification.type === 'success'
              ? 'bg-emerald-600'
              : notification.type === 'warning'
                ? 'bg-amber-600'
                : 'bg-indigo-600'
            }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        hasApiKey={hasApiKey}
        hasOpenAiKey={hasOpenAiKey}
        apiConfig={apiConfig}
        batchCount={items.length}
        completedCount={completedCount}
        onReset={handleReset}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenApiSettings={() => setIsApiModalOpen(true)}
        onOpenLogModal={() => setIsLogModalOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        hasApiLog={Boolean(latestApiLog)}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6 space-y-6 flex-1">
        {/* Project & Session Manager Bar (Supabase Cloud) */}
        <ProjectManagerBar
          currentProject={currentProject}
          onSelectProject={handleSelectProject}
          onSaveCurrentProject={handleSaveCurrentProject}
          isDirty={isProjectDirty}
          isSaving={isProjectSaving}
          isGenerating={isGenerating}
          lastSavedAt={lastSavedAt}
          currentSettings={settings}
          currentUploadedOutfits={uploadedOutfits}
          currentItems={items}
          showToast={showToast}
        />

        {/* API & Key Status Banner */}
        <ApiStatusBanner
          config={apiConfig}
          systemHasKey={hasApiKey}
          systemHasOpenAiKey={hasOpenAiKey}
          onOpenSettings={() => setIsApiModalOpen(true)}
        />

        {/* Video Scene Extractor: Upload sample video, slice scenes by interval/cut, select frames and import */}
        <VideoSceneExtractor
          key={`video-scene-extractor-${extractorResetKey}`}
          onImportToBatch={handleAddItems}
          showToast={showToast}
        />

        {/* Product / Outfit Reference Image Upload */}
        <OutfitSelector
          productName={settings.productName || ''}
          onChangeProductName={(val) =>
            setSettings((prev) => ({
              ...prev,
              productName: val,
            }))
          }
          productDescription={settings.productDescription || ''}
          onChangeProductDescription={(val) =>
            setSettings((prev) => ({
              ...prev,
              productDescription: val,
            }))
          }
          outfitPrompt={settings.outfitPrompt}
          onChangePrompt={(val) =>
            setSettings((prev) => ({ ...prev, outfitPrompt: val }))
          }
          uploadedOutfits={uploadedOutfits}
          onAddUploadedOutfits={handleAddUploadedOutfits}
          onUpdateUploadedOutfit={handleUpdateUploadedOutfit}
          onRemoveUploadedOutfit={handleRemoveUploadedOutfit}
          onClearUploadedOutfits={handleClearUploadedOutfits}
          uploadedOutfit={uploadedOutfit}
          onApplyToAll={handleApplyToAll}
          apiConfig={apiConfig}
        />


        {/* Action Banner: Apply Character & Outfit/Product replacement to ALL images */}
        <ApplyToAllBanner
          enableCharacter={settings.enableCharacter}
          characterPrompt={settings.characterPrompt}
          outfitPrompt={settings.outfitPrompt}
          uploadedOutfit={uploadedOutfit}
          uploadedOutfits={uploadedOutfits}
          preservePose={settings.preservePose}
          totalImagesCount={items.length}
          onApplyToAll={handleApplyToAll}
          hasApplied={items.length > 0 && items.every((it) => Boolean(it.appliedConfig?.appliedAt))}
        />

        {/* Subtitle Removal & Quality Settings */}
        <SubtitleSettings
          settings={settings}
          onChangeSettings={(newVal) => setSettings((prev) => ({ ...prev, ...newVal }))}
        />

        {/* Multi-Image Upload & Row-Based Pipeline: Each image is a Row with New AI Image and Video beside it */}
        <BatchPipelineRows
          items={items}
          onAddItems={handleAddItems}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onProcessSingleItem={handleProcessSingleItem}
          onUpdateItem={handleUpdateItem}
          settings={settings}
          isProcessingAll={isProcessing}
          uploadedOutfit={uploadedOutfit}
          uploadedOutfits={uploadedOutfits}
          onApplyToAll={handleApplyToAll}
          apiConfig={apiConfig}
          systemHasKlingKey={hasKlingKey}
          onOpenKlingSettings={() => {
            setApiModalTab('kling');
            setIsApiModalOpen(true);
          }}
          onDownloadAllZip={handleDownloadAllZip}
          onLogApiRequest={setLatestApiLog}
        />
      </main>

      {/* Floating Bottom Action Bar */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 mt-6">
        <BatchControls
          totalCount={items.length}
          completedCount={completedCount}
          errorCount={errorCount}
          isProcessing={isProcessing}
          currentProcessingIndex={currentProcessingIndex}
          activeProcessingCount={activeProcessingIds.length || 1}
          concurrency={settings.concurrency || 5}
          onChangeConcurrency={(val) => setSettings((prev) => ({ ...prev, concurrency: val }))}
          onStartProcessing={handleStartProcessing}
          onStopProcessing={handleStopProcessing}
          onDownloadAllZip={handleDownloadAllZip}
          canStart={canStart}
        />
      </div>

      {/* Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* API & Key Settings Modal */}
      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={apiConfig}
        onSaveConfig={handleSaveApiConfig}
        systemHasKey={hasApiKey}
        systemHasOpenAiKey={hasOpenAiKey}
        systemHasKlingKey={hasKlingKey}
        initialTab={apiModalTab}
      />

      {/* API Request Body Log Modal */}
      <ApiLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logData={latestApiLog}
      />

      {/* Supabase History Gallery Modal */}
      <HistoryGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onApplyPrompt={(promptText, type) => {
          if (type === 'video') {
            setItems((prev) =>
              prev.map((it) => ({
                ...it,
                videoPrompt: promptText,
              }))
            );
            showToast('Đã áp dụng prompt video cho danh sách!', 'success');
          } else {
            setSettings((prev) => ({
              ...prev,
              outfitPrompt: promptText,
            }));
            showToast('Đã áp dụng prompt vào mục thay thế sản phẩm / trang phục!', 'success');
          }
        }}
        showToast={showToast}
      />
    </div>
  );
}

