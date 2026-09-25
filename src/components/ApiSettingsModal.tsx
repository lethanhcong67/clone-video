import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Trash2,
  ClipboardPaste,
  Cpu,
  Globe,
  SlidersHorizontal,
  Layers,
  Wand2,
  Video,
  Film,
  Play,
  Code,
  HardDrive,
  FileSpreadsheet,
  Copy,
  Check,
} from 'lucide-react';
import { ApiConfig, ImageModelOption, ApiProviderType, GptImageConfig, KlingVideoConfig } from '../types';
import {
  getGoogleWebAppUrl,
  setGoogleWebAppUrl,
  testGoogleConnection,
} from '../utils/googleStorageService';

export const KLING_DEFAULT_NEGATIVE_PROMPT = '';

export const AVAILABLE_GEMINI_MODELS: ImageModelOption[] = [
  {
    id: 'gemini-3.1-flash-image',
    name: 'Gemini 3.1 Flash Image',
    badge: 'Mới nhất',
    description: 'Thế hệ mới nhất: Xử lý chi tiết trang phục, khuôn mặt và xóa phụ đề vietsub chính xác nhất.',
  },
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    badge: 'Tiêu chuẩn',
    description: 'Phiên bản chuẩn ổn định cao, tốc độ phản hồi nhanh và giữ nguyên dáng điệu tốt.',
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'Gemini 3.1 Flash Lite Image',
    badge: 'Siêu tốc',
    description: 'Tối ưu tốc độ xử lý hàng loạt nhiều ảnh, tiêu thụ ít hạn ngạch token hơn.',
  },
];

export const AVAILABLE_GPT_IMAGE_MODELS: ImageModelOption[] = [
  {
    id: 'gpt-image-2',
    name: 'OpenAI GPT-Image-2',
    badge: 'Mới nhất & Khuyên dùng',
    description: 'Thế hệ tạo và chỉnh sửa ảnh tiên tiến nhất từ OpenAI: Độ nét cao, tái hiện trang phục chân thực và sửa ảnh theo ngữ cảnh vượt trội.',
    isRecommended: true,
  },
  {
    id: 'gpt-image-1.5',
    name: 'OpenAI GPT-Image-1.5',
    badge: 'Tốc độ cao',
    description: 'Phiên bản tối ưu tốc độ sinh ảnh và chỉnh sửa chi tiết với thời gian phản hồi nhanh.',
  },
  {
    id: 'dall-e-3',
    name: 'OpenAI DALL·E 3',
    badge: 'Kinh điển',
    description: 'Mô hình tạo ảnh giàu tính nghệ thuật và tuân thủ mô tả ngữ cảnh chặt chẽ.',
  },
];

export const AVAILABLE_KLING_MODELS: ImageModelOption[] = [
  {
    id: 'kling-v2-6',
    name: 'Kling 2.6 (kling-v2-6)',
    badge: 'Mới nhất & Khuyên dùng',
    description: 'Thế hệ Kling v2.6 Pro: Tối ưu chuyển động người mẫu tự nhiên, giữ nguyên 100% thiết kế & họa tiết trang phục sản phẩm.',
    isRecommended: true,
  },
  {
    id: 'kling-v1',
    name: 'Kling 1.0 (kling-v1)',
    badge: 'Tiêu chuẩn & Tiết kiệm',
    description: 'Thế hệ tiêu chuẩn: Tốc độ xử lý nhanh, chuyển động mượt mà tự nhiên và tiết kiệm chi phí tối đa.',
  },
  {
    id: 'kling-v1-5',
    name: 'Kling 1.5 (kling-v1-5)',
    badge: 'Độ nét cao',
    description: 'Nâng cấp chất lượng hình ảnh, giữ chuẩn màu vải & trang phục, tối ưu chuyển động cơ thể.',
  },
  {
    id: 'kling-v1-6',
    name: 'Kling 1.6 (kling-v1-6)',
    badge: 'Mới nhất v1',
    description: 'Tối ưu biểu cảm nhân vật, góc lia camera mượt mà và tương thích tốt với ảnh chụp thời trang.',
  },
  {
    id: 'kling-v2-master',
    name: 'Kling 2.0 Master (kling-v2-master)',
    badge: 'Điện ảnh Pro',
    description: 'Thế hệ cao cấp nhất: Chuyển động điện ảnh chân thực, ánh sáng phức tạp và hiệu ứng camera sống động.',
  },
];

export const AVAILABLE_VISION_MODELS: ImageModelOption[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash Vision (OpenLux)',
    badge: 'Mặc định & Nhanh nhất',
    description: 'Phân tích đa phương thái cực nhanh, bóc tách chính xác từng chi tiết sợi vải, hoa văn thêu, logo, chữ viết và chất liệu.',
    isRecommended: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash Vision',
    badge: 'Khuyên dùng',
    description: 'Phân tích chi tiết từng sợi vải, hoa văn thêu, logo, chữ viết và chất liệu sản phẩm với tốc độ cực nhanh.',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash Vision',
    badge: 'Ổn định',
    description: 'Phiên bản chuẩn ổn định cao, tối ưu hạn ngạch token cho việc phân tích sản phẩm.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini Vision',
    badge: 'OpenAI / OpenLux',
    description: 'Nhận diện thị giác thông minh từ OpenAI, trích xuất cấu trúc và hoa văn sản phẩm sắc nét.',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o Vision Pro',
    badge: 'Chi tiết tối đa',
    description: 'Mô hình thị giác cao cấp nhất: Đọc hiểu văn bản nhỏ, hoa văn tinh xảo và chất liệu chi tiết.',
  },
];

export const DEFAULT_GPT_ENDPOINT_KEYS: Record<string, string> = {
  'https://api.openlux.ai/v1/images/edits': 'sk-2YrQt4dMCkJQCBR439Hq1rlvCtONjFfEvFu7MGrW4rledtzM',
  'https://www.mnapi.com/v1/images/edits': 'sk-tsuRNN1G5A25E9oGyXPSgeJjaR97tmdTzrxtFHKqgpzQ8ChR',
  'https://api.openai.com/v1': '',
};

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSaveConfig: (newConfig: ApiConfig) => void;
  systemHasKey: boolean;
  systemHasOpenAiKey?: boolean;
  systemHasKlingKey?: boolean;
  initialTab?: 'gemini' | 'gpt-image-2' | 'kling' | 'storage';
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  systemHasKey,
  systemHasOpenAiKey = false,
  systemHasKlingKey = false,
  initialTab,
}) => {
  // Modal active tab: 'gemini' | 'gpt-image-2' | 'kling' | 'storage'
  const [activeTab, setActiveTab] = useState<'gemini' | 'gpt-image-2' | 'kling' | 'storage'>(
    initialTab || (config.activeProvider === 'gpt-image-2' ? 'gpt-image-2' : 'gemini')
  );

  // Google Storage state (Google Drive + Sheets - 100% Free)
  const [googleWebAppUrl, setGoogleWebAppUrlState] = useState<string>(getGoogleWebAppUrl());
  const [isTestingGoogle, setIsTestingGoogle] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<{
    success: boolean;
    message: string;
    spreadsheetName?: string;
    folderName?: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Active engine / provider for image generation
  const [activeProvider, setActiveProvider] = useState<ApiProviderType>(config.activeProvider || 'gemini');

  // Gemini state
  const [geminiKey, setGeminiKey] = useState(config.apiKey || 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY');
  const [geminiBaseUrl, setGeminiBaseUrl] = useState(
    config.visionAnalysis?.baseUrl || 'https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent'
  );
  const [selectedGeminiModel, setSelectedGeminiModel] = useState(config.model || 'gemini-3.1-flash-image');
  const [useCustomGeminiKey, setUseCustomGeminiKey] = useState(config.isCustomKeyActive);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Vision Analysis Key state (Separate Key specifically for image analysis)
  const [visionKey, setVisionKey] = useState(config.visionAnalysis?.apiKey || 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY');
  const [visionProvider, setVisionProvider] = useState<'gemini' | 'openai' | 'openlux'>(
    config.visionAnalysis?.provider || 'gemini'
  );
  const [visionModel, setVisionModel] = useState(config.visionAnalysis?.model || 'gemini-3.5-flash');
  const [visionBaseUrl, setVisionBaseUrl] = useState(config.visionAnalysis?.baseUrl || 'https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent');
  const [showVisionKey, setShowVisionKey] = useState(false);
  const [isTestingVision, setIsTestingVision] = useState(false);
  const [visionTestResult, setVisionTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // GPT-Image-2 state & endpoint pairing map
  const [gptEndpointKeys, setGptEndpointKeys] = useState<Record<string, string>>(() => {
    const initialMap = {
      ...DEFAULT_GPT_ENDPOINT_KEYS,
      ...(config.gptImage?.endpointKeys || {}),
    };
    if (config.gptImage?.apiKey && config.gptImage?.baseUrl) {
      initialMap[config.gptImage.baseUrl] = config.gptImage.apiKey;
    }
    return initialMap;
  });
  const [gptBaseUrl, setGptBaseUrl] = useState(
    config.gptImage?.baseUrl || 'https://api.openlux.ai/v1/images/edits'
  );
  const [gptKey, setGptKey] = useState(
    config.gptImage?.apiKey || DEFAULT_GPT_ENDPOINT_KEYS['https://api.openlux.ai/v1/images/edits']
  );
  const [selectedGptModel, setSelectedGptModel] = useState(config.gptImage?.model || 'gpt-image-2');
  const [gptSize, setGptSize] = useState<string>(config.gptImage?.size || '1152x2048');
  const [gptQuality, setGptQuality] = useState<'standard' | 'medium' | 'hd'>(
    config.gptImage?.quality === 'standard' ? 'medium' : (config.gptImage?.quality || 'medium')
  );
  const [showGptKey, setShowGptKey] = useState(false);

  // Kling Video state
  const [klingKey, setKlingKey] = useState(config.kling?.apiKey || 'sk-L8zc8s3oiwytWv8TjurONzwhmHsuP5eBRtDqLDD0te1sWyIz');
  const [klingAccessKey, setKlingAccessKey] = useState(config.kling?.accessKey || '');
  const [klingSecretKey, setKlingSecretKey] = useState(config.kling?.secretKey || '');
  const [klingBaseUrl, setKlingBaseUrl] = useState(
    config.kling?.baseUrl || 'https://api.openlux.ai/kling/v1/videos/image2video'
  );
  const [selectedKlingModel, setSelectedKlingModel] = useState(config.kling?.model || 'kling-v2-6');
  const [klingMode, setKlingMode] = useState<'std' | 'pro'>(config.kling?.mode || 'pro');
  const [klingDuration, setKlingDuration] = useState<'5' | '10'>(config.kling?.duration || '5');
  const [klingAspectRatio, setKlingAspectRatio] = useState<'9:16' | '16:9' | '1:1'>(
    config.kling?.aspectRatio || '9:16'
  );
  const [klingMultiShot, setKlingMultiShot] = useState<boolean>(
    config.kling?.multiShot ?? false
  );
  const [klingCfgScale, setKlingCfgScale] = useState<number>(
    config.kling?.cfgScale ?? 0.6
  );
  const [klingNegativePrompt, setKlingNegativePrompt] = useState<string>(
    config.kling?.negativePrompt && !config.kling.negativePrompt.includes('camera movement')
      ? config.kling.negativePrompt
      : ''
  );
  const [klingWatermark, setKlingWatermark] = useState<boolean>(
    config.kling?.watermarkEnabled ?? false
  );
  const [showJsonSample, setShowJsonSample] = useState<boolean>(false);
  const [showKlingKey, setShowKlingKey] = useState(false);
  const [useAkSkMode, setUseAkSkMode] = useState(Boolean(config.kling?.accessKey && config.kling?.secretKey));

  // Testing statuses
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isTestingGpt, setIsTestingGpt] = useState(false);
  const [gptTestResult, setGptTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isTestingKling, setIsTestingKling] = useState(false);
  const [klingTestResult, setKlingTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Sync state when modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setActiveProvider(config.activeProvider || 'gemini');
      setGeminiKey(config.apiKey || 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY');
      setGeminiBaseUrl(config.visionAnalysis?.baseUrl || 'https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent');
      setSelectedGeminiModel(config.model || 'gemini-3.1-flash-image');
      setUseCustomGeminiKey(config.isCustomKeyActive);

      const curBaseUrl = config.gptImage?.baseUrl || 'https://api.openlux.ai/v1/images/edits';
      const map: Record<string, string> = {
        ...DEFAULT_GPT_ENDPOINT_KEYS,
        ...(config.gptImage?.endpointKeys || {}),
      };
      if (config.gptImage?.apiKey) {
        map[curBaseUrl] = config.gptImage.apiKey;
      }
      const curKey = config.gptImage?.apiKey || map[curBaseUrl] || DEFAULT_GPT_ENDPOINT_KEYS[curBaseUrl] || '';
      setGptEndpointKeys(map);
      setGptBaseUrl(curBaseUrl);
      setGptKey(curKey);
      setSelectedGptModel(config.gptImage?.model || 'gpt-image-2');
      setGptSize(config.gptImage?.size || '1152x2048');
      setGptQuality(config.gptImage?.quality === 'standard' ? 'medium' : (config.gptImage?.quality || 'medium'));
      setKlingKey(config.kling?.apiKey || '');
      setKlingAccessKey(config.kling?.accessKey || '');
      setKlingSecretKey(config.kling?.secretKey || '');
      setKlingBaseUrl(config.kling?.baseUrl || 'https://api.openlux.ai/kling/v1/videos/image2video');
      setSelectedKlingModel(config.kling?.model || 'kling-v2-6');
      setKlingMode(config.kling?.mode || 'pro');
      setKlingDuration(config.kling?.duration || '5');
      setKlingAspectRatio(config.kling?.aspectRatio || '9:16');
      setKlingMultiShot(config.kling?.multiShot ?? false);
      setKlingCfgScale(config.kling?.cfgScale ?? 0.6);
      setKlingNegativePrompt(
        config.kling?.negativePrompt && !config.kling.negativePrompt.includes('camera movement')
          ? config.kling.negativePrompt
          : ''
      );
      setKlingWatermark(config.kling?.watermarkEnabled ?? false);
      setUseAkSkMode(Boolean(config.kling?.accessKey && config.kling?.secretKey));
      setGeminiTestResult(null);
      setGptTestResult(null);
      setKlingTestResult(null);
    }
  }, [isOpen, config, initialTab]);

  const handleSelectGptEndpoint = (targetUrl: string) => {
    const curUrl = gptBaseUrl.trim();
    const updatedMap: Record<string, string> = {
      ...gptEndpointKeys,
      [curUrl]: gptKey.trim(),
    };
    const targetKey =
      updatedMap[targetUrl] !== undefined
        ? updatedMap[targetUrl]
        : (DEFAULT_GPT_ENDPOINT_KEYS[targetUrl] ?? '');

    updatedMap[targetUrl] = targetKey;
    setGptEndpointKeys(updatedMap);
    setGptBaseUrl(targetUrl);
    setGptKey(targetKey);
    setGptTestResult(null);
  };

  if (!isOpen) return null;

  // Clipboard helpers
  const handlePasteGemini = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setGeminiKey(text.trim());
        setUseCustomGeminiKey(true);
        setGeminiTestResult(null);
      }
    } catch (e) {
      console.warn('Không thể đọc clipboard:', e);
    }
  };

  const handlePasteGpt = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const val = text.trim();
        setGptKey(val);
        setGptEndpointKeys((prev) => ({
          ...prev,
          [gptBaseUrl.trim()]: val,
        }));
        setGptTestResult(null);
      }
    } catch (e) {
      console.warn('Không thể đọc clipboard:', e);
    }
  };

  const handlePasteKling = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setKlingKey(text.trim());
        setKlingTestResult(null);
      }
    } catch (e) {
      console.warn('Không thể đọc clipboard:', e);
    }
  };

  const handlePasteGoogleUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setGoogleWebAppUrlState(text.trim());
        setGoogleTestResult(null);
      }
    } catch (e) {
      console.warn('Không thể đọc clipboard:', e);
    }
  };

  const handleTestGoogleConnection = async () => {
    const urlToTest = googleWebAppUrl.trim();
    if (!urlToTest) {
      setGoogleTestResult({
        success: false,
        message: 'Vui lòng dán Google Apps Script Web App URL trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingGoogle(true);
    setGoogleTestResult(null);

    try {
      const res = await testGoogleConnection(urlToTest);
      if (res.ok) {
        setGoogleTestResult({
          success: true,
          message: res.message || 'Kết nối Google Drive & Sheets thành công!',
          spreadsheetName: res.spreadsheetName,
          folderName: res.folderName,
        });
      } else {
        setGoogleTestResult({
          success: false,
          message: res.message || 'Không thể kết nối đến Google Apps Script.',
        });
      }
    } catch (err: any) {
      setGoogleTestResult({
        success: false,
        message: err?.message || 'Lỗi khi kiểm tra kết nối Google Apps Script.',
      });
    } finally {
      setIsTestingGoogle(false);
    }
  };

  const handleCopyAppsScript = async () => {
    try {
      // Code template from GOOGLE_APPS_SCRIPT.js
      const scriptCode = `// GOOGLE APPS SCRIPT: TỰ ĐỘNG LƯU PROMPT & ẢNH VÀO GOOGLE DRIVE + GOOGLE SHEETS
const DRIVE_FOLDER_ID = ""; // Điền ID thư mục Google Drive (hoặc để trống để lưu vào My Drive)

function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    const action = data.action || "save_generation";
    let result = {};
    switch (action) {
      case "ping":
      case "test":
        result = handlePing();
        break;
      case "save_generation":
        result = handleSaveGeneration(data);
        break;
      case "get_history":
        result = handleGetHistory(data);
        break;
      case "save_project":
        result = handleSaveProject(data);
        break;
      case "get_projects":
        result = handleGetProjects(data);
        break;
      default:
        result = { success: false, error: "Action không hợp lệ: " + action };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "AI Storage API Active!" })).setMimeType(ContentService.MimeType.JSON);
}

function handlePing() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return { success: true, message: "Kết nối thành công!", spreadsheetName: ss.getName() };
}

function handleSaveGeneration(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Generations");
  if (!sheet) { sheet = ss.insertSheet("Generations"); }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Thời Gian", "Loại Tác Vụ", "Trạng Thái", "Prompt", "Negative Prompt / Camera", "Model AI", "Link Ảnh Gốc (Drive)", "Link Kết Quả (Drive)", "Thumbnail (Drive)", "Thông Số Chi Tiết (JSON)"]);
    sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#4F46E5").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  const folder = DRIVE_FOLDER_ID ? DriveApp.getFolderById(DRIVE_FOLDER_ID) : DriveApp.getRootFolder();
  const recordId = data.id || ("gen_" + Date.now());
  const timestamp = Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd HH:mm:ss");
  let inputDriveUrl = data.input_media_url || "";
  let outputDriveUrl = data.output_media_url || "";
  if (data.input_base64 || (typeof inputDriveUrl === "string" && inputDriveUrl.startsWith("data:"))) {
    inputDriveUrl = saveBase64ToDrive(folder, data.input_base64 || inputDriveUrl, "input_" + recordId + ".png");
  }
  if (data.output_base64 || (typeof outputDriveUrl === "string" && outputDriveUrl.startsWith("data:"))) {
    outputDriveUrl = saveBase64ToDrive(folder, data.output_base64 || outputDriveUrl, "result_" + recordId + ".png");
  }
  sheet.appendRow([recordId, timestamp, data.task_type || "image_swap", data.status || "completed", data.prompt || "", data.negative_prompt || data.camera_prompt || "", data.model_name || "", inputDriveUrl, outputDriveUrl, outputDriveUrl, JSON.stringify(data.parameters || {})]);
  return { success: true, message: "Đã lưu vào Drive & Sheet!", data: { id: recordId, timestamp: timestamp, input_media_url: inputDriveUrl, output_media_url: outputDriveUrl, thumbnail_url: outputDriveUrl } };
}

function handleGetHistory(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Generations");
  if (!sheet || sheet.getLastRow() <= 1) return { success: true, items: [], total: 0 };
  const lastRow = sheet.getLastRow();
  const limit = data.limit ? parseInt(data.limit, 10) : 100;
  const numRows = Math.min(limit, lastRow - 1);
  const startRow = Math.max(2, lastRow - numRows + 1);
  const values = sheet.getRange(startRow, 1, numRows, 11).getValues();
  const items = [];
  for (let i = values.length - 1; i >= 0; i--) {
    const row = values[i];
    let params = {};
    try { if (row[10]) params = JSON.parse(row[10]); } catch (e) {}
    items.push({ id: row[0], created_at: row[1], task_type: row[2], status: row[3], prompt: row[4], negative_prompt: row[5], model_name: row[6], input_media_url: row[7], output_media_url: row[8], thumbnail_url: row[9] || row[8], parameters: params });
  }
  return { success: true, items: items, total: lastRow - 1 };
}

function saveBase64ToDrive(folder, base64String, fileName) {
  try {
    let cleanBase64 = base64String;
    let contentType = "image/png";
    if (base64String.indexOf("data:") > -1) {
      const parts = base64String.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) contentType = match[1];
      cleanBase64 = parts[1];
    }
    const decoded = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decoded, contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (err) {
    return null;
  }
}`;
      await navigator.clipboard.writeText(scriptCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    } catch (e) {
      console.warn('Lỗi sao chép mã script:', e);
    }
  };

  // Test Gemini Key
  const handleTestGeminiKey = async () => {
    const keyToTest = geminiKey.trim();
    if (!keyToTest && !systemHasKey) {
      setGeminiTestResult({
        success: false,
        message: 'Vui lòng dán khóa Gemini API trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingGemini(true);
    setGeminiTestResult(null);

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keyToTest || undefined,
          model: selectedGeminiModel,
          baseUrl: geminiBaseUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setGeminiTestResult({
          success: true,
          message: data.message || 'Khóa API hợp lệ! Kết nối với Gemini AI thành công.',
        });
      } else {
        setGeminiTestResult({
          success: false,
          message: data.error || 'Khóa Gemini API không hợp lệ hoặc đã hết hạn ngạch.',
        });
      }
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        message: err?.message || 'Không thể kết nối đến máy chủ kiểm tra API Gemini.',
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  // Test GPT-Image-2 Key
  const handleTestGptKey = async () => {
    const keyToTest = gptKey.trim();
    if (!keyToTest && !systemHasOpenAiKey) {
      setGptTestResult({
        success: false,
        message: 'Vui lòng dán khóa API GPT-Image-2 (sk-...) trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingGpt(true);
    setGptTestResult(null);

    try {
      const res = await fetch('/api/validate-gpt-image-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keyToTest || undefined,
          baseUrl: gptBaseUrl.trim() || 'https://api.openlux.ai/v1/images/edits',
          model: selectedGptModel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setGptTestResult({
          success: true,
          message: data.message || 'Khóa API hợp lệ! Kết nối thành công.',
        });
      } else {
        setGptTestResult({
          success: false,
          message: data.error || 'Khóa API không hợp lệ hoặc đã hết hạn ngạch.',
        });
      }
    } catch (err: any) {
      setGptTestResult({
        success: false,
        message: err?.message || 'Không thể kết nối đến máy chủ kiểm tra API.',
      });
    } finally {
      setIsTestingGpt(false);
    }
  };

  // Test Kling AI Key
  const handleTestKlingKey = async () => {
    const rawInputKey = klingKey.trim() || klingSecretKey.trim() || klingAccessKey.trim();

    if (!rawInputKey && !systemHasKlingKey) {
      setKlingTestResult({
        success: false,
        message: 'Vui lòng nhập API Key của bạn trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingKling(true);
    setKlingTestResult(null);

    try {
      const res = await fetch('/api/validate-kling-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: rawInputKey || undefined,
          secretKey: klingSecretKey.trim() || undefined,
          baseUrl: klingBaseUrl.trim() || 'https://api.openlux.ai/kling/v1/videos/image2video',
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setKlingTestResult({
          success: true,
          message: data.message || 'Khóa API Kling AI hợp lệ! Kết nối dịch vụ tạo video thành công.',
        });
      } else {
        setKlingTestResult({
          success: false,
          message: data.error || 'Khóa API Kling AI không hợp lệ hoặc đã hết hạn ngạch.',
        });
      }
    } catch (err: any) {
      setKlingTestResult({
        success: false,
        message: err?.message || 'Không thể kết nối đến máy chủ kiểm tra API Kling AI.',
      });
    } finally {
      setIsTestingKling(false);
    }
  };

  // Test Vision AI Key
  const handleTestVisionKey = async () => {
    const rawKey = visionKey.trim();
    if (!rawKey && !systemHasKey && !systemHasOpenAiKey) {
      setVisionTestResult({
        success: false,
        message: 'Vui lòng nhập API Key cho Vision AI trước khi kiểm tra.',
      });
      return;
    }

    setIsTestingVision(true);
    setVisionTestResult(null);

    try {
      const res = await fetch('/api/validate-vision-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: rawKey || undefined,
          provider: visionProvider,
          model: visionModel,
          baseUrl: visionBaseUrl.trim() || undefined,
        }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.warn('Lỗi parse JSON kiểm tra vision:', e);
      }

      if (res.ok && data?.valid) {
        setVisionTestResult({
          success: true,
          message: data.message || 'Khóa API Vision hợp lệ! Kết nối thành công.',
        });
      } else {
        setVisionTestResult({
          success: false,
          message: data?.error || data?.message || `Khóa API Vision không hợp lệ (HTTP ${res.status}).`,
        });
      }
    } catch (err: any) {
      setVisionTestResult({
        success: false,
        message: err?.message || 'Không thể kết nối đến máy chủ kiểm tra API Vision.',
      });
    } finally {
      setIsTestingVision(false);
    }
  };

  const handlePasteVision = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setVisionKey(text.trim());
        setVisionTestResult(null);
      }
    } catch (e) {
      console.warn('Không thể đọc clipboard:', e);
    }
  };

  const handleSave = () => {
    const isCustomGeminiActive = Boolean(geminiKey.trim() && useCustomGeminiKey);
    const finalGptEndpointKeys: Record<string, string> = {
      ...gptEndpointKeys,
      [gptBaseUrl.trim()]: gptKey.trim(),
    };
    const updatedGptConfig: GptImageConfig = {
      apiKey: gptKey.trim(),
      baseUrl: gptBaseUrl.trim() || 'https://api.openlux.ai/v1/images/edits',
      model: selectedGptModel,
      size: gptSize.trim() || '1152x2048',
      quality: gptQuality,
      isCustomKeyActive: Boolean(gptKey.trim()),
      isValidated: gptTestResult?.success ?? config.gptImage?.isValidated ?? false,
      lastValidatedAt: gptTestResult?.success ? new Date().toISOString() : config.gptImage?.lastValidatedAt,
      endpointKeys: finalGptEndpointKeys,
    };

    const effectiveKey = klingKey.trim() || klingSecretKey.trim() || klingAccessKey.trim();
    const effectiveAk = klingAccessKey.trim() || (useAkSkMode ? effectiveKey : '');
    const isCustomKlingActive = Boolean(effectiveKey);
    const updatedKlingConfig: KlingVideoConfig = {
      apiKey: effectiveKey,
      accessKey: effectiveAk || undefined,
      secretKey: klingSecretKey.trim() || undefined,
      baseUrl: klingBaseUrl.trim() || 'https://api.openlux.ai/kling/v1/videos/image2video',
      model: selectedKlingModel || 'kling-v2-6',
      mode: klingMode || 'pro',
      duration: klingDuration || '5',
      aspectRatio: klingAspectRatio,
      multiShot: klingMultiShot,
      cfgScale: klingCfgScale,
      negativePrompt: klingNegativePrompt,
      watermarkEnabled: klingWatermark,
      isCustomKeyActive: isCustomKlingActive,
      isValidated: klingTestResult?.success ?? config.kling?.isValidated ?? false,
      lastValidatedAt: klingTestResult?.success ? new Date().toISOString() : config.kling?.lastValidatedAt,
    };

    const updatedVisionConfig = {
      apiKey: geminiKey.trim() || visionKey.trim() || 'sk-Zaijv0dEfEBxf2nc07glM0MFT464YajjKJceAb9nQ2r9BrTY',
      provider: visionProvider || 'gemini',
      model: selectedGeminiModel || visionModel || 'gemini-3.5-flash',
      baseUrl: geminiBaseUrl.trim() || visionBaseUrl.trim() || 'https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent',
      isCustomKeyActive: true,
      isValidated: geminiTestResult?.success ?? config.visionAnalysis?.isValidated ?? true,
      lastValidatedAt: geminiTestResult?.success ? new Date().toISOString() : config.visionAnalysis?.lastValidatedAt,
    };

    setGoogleWebAppUrl(googleWebAppUrl.trim());

    onSaveConfig({
      activeProvider,
      apiKey: geminiKey.trim(),
      model: selectedGeminiModel,
      isCustomKeyActive: isCustomGeminiActive,
      isValidated: geminiTestResult?.success ?? config.isValidated,
      lastValidatedAt: geminiTestResult?.success ? new Date().toISOString() : config.lastValidatedAt,
      gptImage: updatedGptConfig,
      kling: updatedKlingConfig,
      visionAnalysis: updatedVisionConfig,
    });
    onClose();
  };

  return (
    <div
      id="api-settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="api-settings-modal-card"
        className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl p-4 sm:p-5 relative my-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-api-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              Cấu hình API & Lưu trữ Cloud
            </h3>
          </div>
        </div>

        {/* Provider Switch Tabs - 4 Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3 p-1 bg-stone-100 rounded-xl border border-stone-200 shrink-0">
          <button
            type="button"
            id="tab-gpt-image-provider"
            onClick={() => {
              setActiveTab('gpt-image-2');
              setActiveProvider('gpt-image-2');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'gpt-image-2'
              ? 'bg-white text-emerald-700 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">GPT-Image</span>
            {activeProvider === 'gpt-image-2' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
            )}
          </button>

          <button
            type="button"
            id="tab-gemini-provider"
            onClick={() => {
              setActiveTab('gemini');
              setActiveProvider('gemini');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'gemini'
              ? 'bg-white text-indigo-700 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Gemini AI</span>
            {activeProvider === 'gemini' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
            )}
          </button>

          <button
            type="button"
            id="tab-kling-video-provider"
            onClick={() => setActiveTab('kling')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'kling'
              ? 'bg-white text-violet-700 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
          >
            <Video className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="truncate">Kling Video</span>
            {Boolean(klingKey.trim() || systemHasKlingKey) && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            )}
          </button>

          <button
            type="button"
            id="tab-google-storage-provider"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'storage'
              ? 'bg-white text-teal-700 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">Drive & Sheet</span>
            {Boolean(googleWebAppUrl.trim()) && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
            )}
          </button>
        </div>

        {/* Scrollable Tab Content Container */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
          {/* TAB 1: GOOGLE GEMINI */}
          {activeTab === 'gemini' && (
            <div className="space-y-3">
              {/* API Key input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="custom-api-key-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Gemini API Key riêng:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteGemini}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      Dán nhanh
                    </button>
                    {geminiKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setGeminiKey('');
                          setUseCustomGeminiKey(false);
                          setGeminiTestResult(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="custom-api-key-input"
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      if (e.target.value.trim()) {
                        setUseCustomGeminiKey(true);
                      }
                      setGeminiTestResult(null);
                    }}
                    placeholder="AIzaSy... hoặc sk-..."
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-stone-300 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="p-1 text-stone-400 hover:text-stone-700 transition-colors rounded"
                      title={showGeminiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                    >
                      {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {geminiKey.trim() && (
                  <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                    <input
                      id="toggle-custom-gemini-key-checkbox"
                      type="checkbox"
                      checked={useCustomGeminiKey}
                      onChange={(e) => setUseCustomGeminiKey(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-stone-300 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-stone-700">
                      Ưu tiên sử dụng khóa cá nhân này cho Gemini
                    </span>
                  </label>
                )}
              </div>

              {/* Gemini Base URL (Endpoint) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label htmlFor="gemini-base-url-input" className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-stone-500" />
                    <span>Endpoint / URL:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGeminiBaseUrl('https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${geminiBaseUrl.includes('openlux.ai')
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'text-stone-500 hover:text-indigo-700 underline'
                        }`}
                    >
                      OpenLux Gemini
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeminiBaseUrl('https://generativelanguage.googleapis.com')}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${geminiBaseUrl.includes('googleapis.com')
                          ? 'bg-stone-200 text-stone-800'
                          : 'text-stone-500 hover:text-stone-800 underline'
                        }`}
                    >
                      Google Gốc
                    </button>
                  </div>
                </div>
                <input
                  id="gemini-base-url-input"
                  type="text"
                  value={geminiBaseUrl}
                  onChange={(e) => setGeminiBaseUrl(e.target.value)}
                  placeholder="https://api.openlux.ai/v1beta/models/gemini-3.5-flash:generateContent"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Gemini Model Selection */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <label htmlFor="gemini-model-select" className="text-xs font-bold text-stone-800 flex items-center gap-1.5 shrink-0">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mô hình Gemini:</span>
                </label>
                <select
                  id="gemini-model-select"
                  value={selectedGeminiModel}
                  onChange={(e) => setSelectedGeminiModel(e.target.value)}
                  className="w-full max-w-[280px] px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {AVAILABLE_GEMINI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} — {model.badge}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test button & help link */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <button
                  id="test-gemini-key-btn"
                  type="button"
                  disabled={isTestingGemini}
                  onClick={handleTestGeminiKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTestingGemini ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>{isTestingGemini ? 'Đang kiểm tra...' : 'Kiểm tra Gemini Key'}</span>
                </button>

                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Lấy API Key tại Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Gemini Test Feedback */}
              {geminiTestResult && (
                <div
                  id="test-gemini-feedback"
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${geminiTestResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                >
                  {geminiTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-tight">
                    <p className="font-bold">{geminiTestResult.success ? 'Kết nối thành công!' : 'Kiểm tra thất bại'}</p>
                    <p className="text-[11px] mt-0.5">{geminiTestResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPENAI GPT-IMAGE-2 */}
          {activeTab === 'gpt-image-2' && (
            <div className="space-y-3">
              {/* API Key input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="gpt-image-key-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span>API Key GPT-Image-2:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteGpt}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      Dán nhanh
                    </button>
                    {gptKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setGptKey('');
                          setGptTestResult(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="gpt-image-key-input"
                    type={showGptKey ? 'text' : 'password'}
                    value={gptKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGptKey(val);
                      setGptEndpointKeys((prev) => ({
                        ...prev,
                        [gptBaseUrl.trim()]: val,
                      }));
                      setGptTestResult(null);
                    }}
                    placeholder="sk-proj-... hoặc sk-tsu..."
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-stone-300 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGptKey(!showGptKey)}
                      className="p-1 text-stone-400 hover:text-stone-700 transition-colors rounded"
                      title={showGptKey ? 'Ẩn khóa' : 'Hiện khóa'}
                    >
                      {showGptKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Base URL (Endpoint) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label htmlFor="gpt-base-url-input" className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-stone-500" />
                    <span>Endpoint:</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSelectGptEndpoint('https://api.openlux.ai/v1/images/edits')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${gptBaseUrl.includes('openlux.ai')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'text-stone-500 hover:text-emerald-700 underline'
                        }`}
                    >
                      OpenLux AI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectGptEndpoint('https://www.mnapi.com/v1/images/edits')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${gptBaseUrl.includes('mnapi.com')
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'text-stone-500 hover:text-emerald-700 underline'
                        }`}
                    >
                      MNAPI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectGptEndpoint('https://api.openai.com/v1')}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all cursor-pointer ${gptBaseUrl.includes('openai.com')
                        ? 'bg-stone-200 text-stone-800'
                        : 'text-stone-500 hover:text-stone-800 underline'
                        }`}
                    >
                      OpenAI Gốc
                    </button>
                  </div>
                </div>
                <input
                  id="gpt-base-url-input"
                  type="text"
                  value={gptBaseUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setGptBaseUrl(newUrl);
                    if (gptEndpointKeys[newUrl.trim()] !== undefined) {
                      setGptKey(gptEndpointKeys[newUrl.trim()]);
                    }
                  }}
                  placeholder="https://api.openlux.ai/v1/images/edits hoặc https://www.mnapi.com/v1/images/edits"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* GPT Model & Quality Settings */}
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="gpt-model-select" className="text-xs font-bold text-stone-800 flex items-center gap-1.5 shrink-0">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mô hình GPT:</span>
                  </label>
                  <select
                    id="gpt-model-select"
                    value={selectedGptModel}
                    onChange={(e) => setSelectedGptModel(e.target.value)}
                    className="w-full max-w-[240px] px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {AVAILABLE_GPT_IMAGE_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} — {model.badge}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Selection */}
                <div className="space-y-1.5 pt-2 border-t border-stone-200/70">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Kích thước tạo ảnh (Size):</span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {gptSize || '1152x2048'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: '1152x2048 (Mặc định 9:16)', value: '1152x2048' },
                      { label: '1024x1792', value: '1024x1792' },
                      { label: '768x1344', value: '768x1344' },
                      { label: '1440x2560', value: '1440x2560' },
                      { label: '1024x1024 (1:1)', value: '1024x1024' },
                      { label: '2048x1152 (16:9)', value: '2048x1152' },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setGptSize(preset.value)}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${gptSize === preset.value
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5 text-xs text-stone-500">
                    <span>Hoặc gõ tùy chỉnh:</span>
                    <input
                      type="text"
                      value={gptSize}
                      onChange={(e) => setGptSize(e.target.value.trim())}
                      placeholder="1152x2048"
                      className="w-28 px-2 py-1 rounded border border-stone-300 font-mono text-xs font-bold text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Quality Selection */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/70">
                  <span className="text-xs font-semibold text-stone-700">Chất lượng (Quality):</span>
                  <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-white shrink-0">
                    <button
                      type="button"
                      onClick={() => setGptQuality('medium')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${gptQuality === 'medium'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                        }`}
                    >
                      Medium (Mặc định)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGptQuality('standard')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${gptQuality === 'standard'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                        }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setGptQuality('hd')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${gptQuality === 'hd'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                        }`}
                    >
                      HD
                    </button>
                  </div>
                </div>
              </div>

              {/* Test button & help link */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <button
                  id="test-gpt-image-key-btn"
                  type="button"
                  disabled={isTestingGpt}
                  onClick={handleTestGptKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTestingGpt ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{isTestingGpt ? 'Đang kiểm tra...' : 'Kiểm tra GPT Key'}</span>
                </button>

                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  <span>Lấy API Key tại OpenAI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* GPT Test Feedback */}
              {gptTestResult && (
                <div
                  id="test-gpt-feedback"
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${gptTestResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                >
                  {gptTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-tight">
                    <p className="font-bold">{gptTestResult.success ? 'Kết nối thành công!' : 'Kiểm tra thất bại'}</p>
                    <p className="text-[11px] mt-0.5">{gptTestResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KLING AI VIDEO */}
          {activeTab === 'kling' && (
            <div className="space-y-3">
              {/* System key notification if applicable */}
              {systemHasKlingKey && !klingKey && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hệ thống đã có sẵn khóa Kling AI máy chủ.</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                    Server Key Active
                  </span>
                </div>
              )}

              {/* API Key input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="kling-api-key-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-violet-600" />
                    <span>{useAkSkMode ? 'Kling Access Key (AK):' : 'Khóa API Kling AI:'}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteKling}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      Dán nhanh
                    </button>
                    {klingKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setKlingKey('');
                          setKlingTestResult(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="kling-api-key-input"
                    type={showKlingKey ? 'text' : 'password'}
                    value={useAkSkMode ? (klingAccessKey || klingKey) : klingKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setKlingKey(val);
                      if (useAkSkMode) {
                        setKlingAccessKey(val);
                      }
                      setKlingTestResult(null);
                    }}
                    placeholder={
                      useAkSkMode
                        ? 'Nhập Access Key Kling AI...'
                        : 'Nhập Bearer Token hoặc API Key Kling AI...'
                    }
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-stone-300 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKlingKey(!showKlingKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showKlingKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Toggle AK/SK mode */}
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => setUseAkSkMode(!useAkSkMode)}
                    className="text-[11px] font-medium text-violet-600 hover:text-violet-800 underline flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    {useAkSkMode
                      ? 'Chuyển về 1 Token duy nhất'
                      : 'Tài khoản có cặp Access Key & Secret Key riêng? Nhấn vào đây'}
                  </button>
                </div>

                {/* Separate Secret Key input if in AK/SK mode */}
                {useAkSkMode && (
                  <div className="space-y-1 pt-1 p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <label htmlFor="kling-secret-key-input" className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-stone-500" />
                      Kling Secret Key (SK):
                    </label>
                    <input
                      id="kling-secret-key-input"
                      type="password"
                      value={klingSecretKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        setKlingSecretKey(val);
                        if (!klingKey) {
                          setKlingKey(val);
                        }
                        setKlingTestResult(null);
                      }}
                      placeholder="Nhập Secret Key..."
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                )}
              </div>

              {/* Base URL / Endpoint */}
              <div className="space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label htmlFor="kling-base-url-input" className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-stone-500" />
                    <span>Kling Endpoint:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setKlingBaseUrl('https://api.openlux.ai/kling/v1/videos/image2video')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${klingBaseUrl.includes('openlux.ai')
                        ? 'bg-violet-100 text-violet-800 border border-violet-300'
                        : 'text-stone-500 hover:text-violet-700 underline'
                        }`}
                    >
                      OpenLux AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setKlingBaseUrl('https://api.klingai.com')}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${klingBaseUrl === 'https://api.klingai.com'
                        ? 'bg-stone-200 text-stone-800'
                        : 'text-stone-500 hover:text-stone-800 underline'
                        }`}
                    >
                      api.klingai.com
                    </button>
                  </div>
                </div>
                <input
                  id="kling-base-url-input"
                  type="text"
                  value={klingBaseUrl}
                  onChange={(e) => setKlingBaseUrl(e.target.value)}
                  placeholder="https://api.openlux.ai/kling/v1/videos/image2video"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Kling Model Selection Dropdown */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <label htmlFor="kling-model-select" className="text-xs font-bold text-stone-800 flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-violet-600" />
                  <span>Mô hình Kling:</span>
                </label>
                <select
                  id="kling-model-select"
                  value={selectedKlingModel}
                  onChange={(e) => setSelectedKlingModel(e.target.value)}
                  className="w-full max-w-xs px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {AVAILABLE_KLING_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} — {model.badge}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unified Compact Video Parameters Box */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                {/* Row 1: Mode & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Chế độ (Mode):</span>
                    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-white shrink-0">
                      <button
                        type="button"
                        onClick={() => setKlingMode('std')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${klingMode === 'std'
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setKlingMode('pro')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${klingMode === 'pro'
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        Pro
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Thời lượng (Duration):</span>
                    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-white shrink-0">
                      <button
                        type="button"
                        onClick={() => setKlingDuration('5')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${klingDuration === '5'
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        5 giây
                      </button>
                      <button
                        type="button"
                        onClick={() => setKlingDuration('10')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${klingDuration === '10'
                          ? 'bg-violet-600 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        10 giây
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-200/70" />

                {/* Row 2: Aspect Ratio & CFG Scale */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Tỉ lệ khung hình:</span>
                    <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-white shrink-0">
                      {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setKlingAspectRatio(ratio)}
                          className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${klingAspectRatio === ratio
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'text-stone-600 hover:text-stone-900'
                            }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700 shrink-0">CFG Scale:</span>
                    <div className="flex items-center gap-2 w-full max-w-[150px]">
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={klingCfgScale}
                        onChange={(e) => setKlingCfgScale(parseFloat(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
                      />
                      <span className="text-[11px] font-mono font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded shrink-0">
                        {klingCfgScale.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-200/70" />

                {/* Row 3: Multi-shot & Watermark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Đa phân cảnh (Multi-shot):</span>
                    <button
                      type="button"
                      onClick={() => setKlingMultiShot(!klingMultiShot)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${klingMultiShot
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                    >
                      {klingMultiShot ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">Hình mờ (Watermark):</span>
                    <button
                      type="button"
                      onClick={() => setKlingWatermark(!klingWatermark)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${klingWatermark
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                    >
                      {klingWatermark ? 'BẬT' : 'TẮT'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample JSON Body Inspector (compact toggle) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowJsonSample(!showJsonSample)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 hover:text-violet-700 transition-colors"
                >
                  <Code className="w-3.5 h-3.5 text-violet-600" />
                  <span>{showJsonSample ? 'Ẩn JSON request body' : 'Xem JSON body gửi đến Kling AI'}</span>
                </button>
                {showJsonSample && (
                  <div className="mt-1.5 p-2.5 rounded-lg bg-stone-900 text-emerald-400 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-40">
                    <pre>{JSON.stringify(
                      {
                        model_name: selectedKlingModel || 'kling-v2-6',
                        mode: klingMode,
                        duration: klingDuration,
                        aspect_ratio: klingAspectRatio,
                        multi_shot: klingMultiShot,
                        image: '<url từ approved_images hoặc base64>',
                        prompt: '<prompt giữ cố định thiết kế sản phẩm, người mẫu cử động tự nhiên>',
                        negative_prompt: klingNegativePrompt,
                        cfg_scale: klingCfgScale,
                        watermark_info: {
                          enabled: klingWatermark,
                        },
                      },
                      null,
                      2
                    )}</pre>
                  </div>
                )}
              </div>

              {/* Test button & help link */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <button
                  id="test-kling-key-btn"
                  type="button"
                  disabled={isTestingKling}
                  onClick={handleTestKlingKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isTestingKling ? (
                    <Loader2 className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-violet-600" />
                  )}
                  <span>{isTestingKling ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Kling AI'}</span>
                </button>

                <a
                  href="https://klingai.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                >
                  <span>Tài liệu Kling AI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Kling Test Feedback */}
              {klingTestResult && (
                <div
                  id="test-kling-feedback"
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${klingTestResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                >
                  {klingTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-tight">
                    <p className="font-bold">{klingTestResult.success ? 'Kết nối thành công!' : 'Kiểm tra thất bại'}</p>
                    <p className="text-[11px] mt-0.5">{klingTestResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE & GOOGLE SHEETS STORAGE (100% FREE) */}
          {activeTab === 'storage' && (
            <div className="space-y-3.5">
              {/* Feature highlight banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border border-teal-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>Lưu trữ Google Drive & Google Sheets</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        100% Miễn phí
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                      Tự động lưu lại toàn bộ Prompt, Negative Prompt, Thông số Model vào <strong>Google Sheet</strong> và tải hình ảnh/video kết quả lên <strong>Google Drive</strong> của bạn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Web App URL Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="google-webapp-url-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-teal-600" />
                    <span>Google Apps Script Web App URL:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteGoogleUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Dán từ clipboard</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="google-webapp-url-input"
                    type="text"
                    value={googleWebAppUrl}
                    onChange={(e) => {
                      setGoogleWebAppUrlState(e.target.value);
                      setGoogleTestResult(null);
                    }}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-stone-800 bg-stone-50/50"
                  />
                </div>
                <p className="text-[10px] text-stone-500">
                  URL triển khai Web App dạng <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">https://script.google.com/macros/s/.../exec</code>
                </p>
              </div>

              {/* Test & Copy Script Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <button
                  id="test-google-btn"
                  type="button"
                  disabled={isTestingGoogle || !googleWebAppUrl.trim()}
                  onClick={handleTestGoogleConnection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isTestingGoogle ? (
                    <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  )}
                  <span>{isTestingGoogle ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Drive & Sheet'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-xs font-bold text-teal-700 transition-all active:scale-95 cursor-pointer"
                >
                  {copiedScript ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-teal-600" />
                  )}
                  <span>{copiedScript ? 'Đã sao chép mã Apps Script!' : '📋 Sao chép mã Google Apps Script'}</span>
                </button>
              </div>

              {/* Test Result Banner */}
              {googleTestResult && (
                <div
                  id="test-google-feedback"
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${googleTestResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                >
                  {googleTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="leading-tight">
                    <p className="font-bold">{googleTestResult.success ? 'Kết nối thành công!' : 'Kiểm tra thất bại'}</p>
                    <p className="text-[11px] mt-0.5">{googleTestResult.message}</p>
                    {googleTestResult.spreadsheetName && (
                      <p className="text-[10px] text-stone-600 mt-1">
                        📊 Google Sheet: <strong>{googleTestResult.spreadsheetName}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step-by-step instructions box */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-[11px] text-stone-600">
                <p className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                  <span>⚡ Hướng dẫn cài đặt nhanh trong 2 phút:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Mở <strong>Google Sheet</strong> của bạn ➜ Chọn menu <strong>Tiện ích mở rộng ➜ Apps Script</strong>.</li>
                  <li>Bấm nút <strong>"📋 Sao chép mã Google Apps Script"</strong> ở trên ➜ Dán vào Apps Script ➜ Bấm <strong>Lưu</strong>.</li>
                  <li>Bấm <strong>Triển khai (Deploy) ➜ Tùy chọn triển khai mới (New deployment)</strong> ➜ Chọn <strong>Ứng dụng web (Web app)</strong>:
                    <ul className="list-disc list-inside pl-4 mt-0.5 text-[10px] text-stone-500 space-y-0.5">
                      <li>Thực thi dưới dạng: <strong>Tôi (Me)</strong></li>
                      <li>Ai có quyền truy cập: <strong>Bất kỳ ai (Anyone)</strong></li>
                    </ul>
                  </li>
                  <li>Copy <strong>Web App URL</strong> và dán vào ô bên trên ➜ Bấm <strong>Kiểm tra kết nối</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}

        <div className="flex items-center justify-end gap-2.5 pt-3 mt-3 border-t border-stone-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            id="save-api-config-btn"
            type="button"
            onClick={handleSave}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer ${activeTab === 'storage'
              ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200'
              : activeTab === 'kling'
                ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'
                : activeProvider === 'gpt-image-2'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
          >
            {activeTab === 'storage'
              ? 'Lưu cấu hình Drive & Sheet'
              : activeTab === 'kling'
                ? 'Lưu cấu hình Kling AI Video'
                : activeProvider === 'gpt-image-2'
                  ? 'Lưu và Sử dụng GPT-Image-2'
                  : 'Lưu và Sử dụng Gemini'}
          </button>
        </div>
      </div>
    </div>
  );
};
