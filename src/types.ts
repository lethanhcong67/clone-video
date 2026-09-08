export type CameraMovementType =
  | 'static'
  | 'zoom_in'
  | 'zoom_out'
  | 'tilt_up'
  | 'tilt_down'
  | 'pan_left'
  | 'pan_right'
  | 'orbit'
  | 'runway'
  | 'handheld';

export interface CameraMovementPreset {
  id: CameraMovementType;
  title: string;
  subtitle: string;
  iconName: string;
  badge: string;
  prompt: string;
  description: string;
}

export interface AppliedReplacementConfig {
  enableCharacter: boolean; // Whether to replace character for this image
  enableOutfit: boolean; // Whether to replace outfit/product for this image
  enableBackground?: boolean; // Whether to change background for this image
  characterPrompt: string;
  productName?: string; // Tên sản phẩm thay thế (ví dụ: tạp dề, áo sơ mi, đồng hồ...)
  outfitPrompt: string;
  backgroundPrompt?: string; // Prompt for new background/scenery
  // Multiple product reference images: ref2, ref3, ...
  productReferences?: OutfitReference[];
  outfitImageUrl?: string | null; // legacy backwards compatibility
  outfitImageName?: string | null;
  preservePose?: boolean;
  preserveBackground?: boolean;
  appliedAt?: number;
}

export interface BatchImageItem {
  id: string;
  name: string;
  size: number;
  dataUrl: string;
  mimeType: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  resultImageUrl?: string;
  resultImageUrls?: string[]; // Multiple generated image variations (up to 5 images)
  activeResultIndex?: number; // Currently selected variation index
  error?: string;
  originalDimensions?: { width: number; height: number };
  // Video fields for same-row pipeline
  selectedCameraMotion?: CameraMovementType;
  videoPrompt?: string;
  videoUrl?: string;
  videoStatus?: 'idle' | 'generating' | 'completed' | 'error';
  videoProgress?: number;
  videoTaskId?: string;
  videoError?: string;
  // Applied character & outfit/product replacement config for this specific row
  appliedConfig?: AppliedReplacementConfig;
  customSettings?: {
    characterPrompt?: string;
    productName?: string;
    outfitPrompt?: string;
    removeSubtitles?: boolean;
    preserveBackground?: boolean;
    preservePose?: boolean;
  };
}

export interface OutfitReference {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl?: string;
  mimeType?: string;
  description: string;
  category: 'uploaded' | 'preset';
}

export interface CharacterPreset {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  avatarIcon: string;
  tag: string;
}

export interface OutfitPreset {
  id: string;
  title: string;
  category: string;
  prompt: string;
  previewUrl: string;
  description: string;
}

export interface BatchSettings {
  enableCharacter: boolean;
  characterPrompt: string;
  selectedCharacterPresetId?: string;
  enableOutfit: boolean;
  productName?: string; // Tên sản phẩm thay thế (ví dụ: tạp dề, áo sơ mi...)
  outfitPrompt: string;
  selectedOutfitPresetId?: string;
  selectedOutfitRefId?: string;
  productReferences?: OutfitReference[]; // Multiple reference products: ref2, ref3, ...
  defaultCameraMotion?: CameraMovementType;
  removeSubtitles: boolean;
  preservePose: boolean;
  preserveBackground: boolean;
  backgroundPrompt?: string; // Optional general background prompt
  stylePreset: 'photorealistic' | 'cinematic' | 'anime' | 'korean_drama' | 'cyberpunk' | 'historical_costume';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  concurrency: number; // Số lượng ảnh xử lý đồng thời cùng 1 lúc (mặc định 5, tối đa 5)
  variationsPerItem?: number; // Số lượng ảnh biến thể tạo cho mỗi ảnh (1 - 5, mặc định 1, tối đa 5)
}

export type ApiProviderType = 'gemini' | 'gpt-image-2';

export interface GptImageConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  size?: string;
  quality: 'standard' | 'medium' | 'hd';
  isCustomKeyActive: boolean;
  isValidated: boolean;
  lastValidatedAt?: string;
}

export interface KlingVideoConfig {
  apiKey: string;
  accessKey?: string;
  secretKey?: string;
  baseUrl: string;
  model: string;
  mode: 'std' | 'pro';
  duration: '5' | '10';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  multiShot?: boolean;
  cfgScale?: number;
  negativePrompt?: string;
  watermarkEnabled?: boolean;
  isCustomKeyActive: boolean;
  isValidated: boolean;
  lastValidatedAt?: string;
}

export interface ApiConfig {
  activeProvider: ApiProviderType;
  // Gemini settings
  apiKey: string;
  model: string;
  isCustomKeyActive: boolean;
  isValidated: boolean;
  lastValidatedAt?: string;
  // GPT-Image-2 settings
  gptImage?: GptImageConfig;
  // Kling AI Video settings
  kling?: KlingVideoConfig;
}

export interface ImageModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  isRecommended?: boolean;
}

