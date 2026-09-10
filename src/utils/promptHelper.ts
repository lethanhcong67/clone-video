import { BatchImageItem, BatchSettings, OutfitReference } from '../types';

/**
 * Constructs the standard prompt text for a specific pipeline row item
 * taking into account all row-specific overrides (character, background, reference images, outfit, subtitles, etc.)
 */
export const generateFullPromptText = (
  item: BatchImageItem,
  settings: BatchSettings,
  uploadedOutfits: OutfitReference[] = [],
  uploadedOutfit?: OutfitReference | null
): string => {
  // If user explicitly entered/saved a custom prompt for this row, ALWAYS prioritize that prompt!
  const custom = (item.customPrompt || item.appliedConfig?.customPrompt)?.trim();
  if (custom) {
    return custom;
  }

  const isCharEnabled = Boolean(item.appliedConfig?.enableCharacter);
  const charPrompt = item.appliedConfig?.characterPrompt?.trim() || '';

  const isBgEnabled = Boolean(item.appliedConfig?.enableBackground);
  const bgPrompt = (item.appliedConfig?.backgroundPrompt !== undefined ? item.appliedConfig.backgroundPrompt : settings.backgroundPrompt)?.trim() || '';

  const isOutfitEnabled = item.appliedConfig?.enableOutfit !== false;
  const outfitPrompt = item.appliedConfig?.outfitPrompt?.trim() || settings.outfitPrompt?.trim() || '';

  const removeSubtitles = settings.removeSubtitles ?? true;

  const prods = item.appliedConfig?.productReferences && item.appliedConfig.productReferences.length > 0
    ? item.appliedConfig.productReferences
    : (uploadedOutfits.length > 0 ? uploadedOutfits : (uploadedOutfit ? [uploadedOutfit] : []));

  const isCharChange = Boolean(isCharEnabled && charPrompt);
  const isBgChange = Boolean(isBgEnabled && bgPrompt);
  const productName = (item.appliedConfig?.productName || settings.productName || '').trim();

  const parts: string[] = [];

  // 1. Thay nhân vật (nếu có)
  if (isCharChange) {
    parts.push(`thay nhân vật thành ${charPrompt}`);
  }

  // 2. Thay bối cảnh (nếu có)
  if (isBgChange) {
    parts.push(`thay bối cảnh ${bgPrompt}`);
  }

  // 3. Thay sản phẩm ở hình image2 sang hình image1 (phổ quát cho mọi loại sản phẩm)
  if (isOutfitEnabled) {
    const targetLabel = productName ? `sản phẩm "${productName}"` : 'sản phẩm';
    if (prods.length > 1) {
      const refList = prods.map((_, idx) => `image${idx + 2}`).join(', ');
      parts.push(`thay ${targetLabel} ở hình ${refList} sang hình image1 (xóa bỏ sản phẩm cũ ở image1 và thay thế chính xác bằng sản phẩm mới từ ${refList})`);
    } else {
      parts.push(`thay ${targetLabel} ở hình image2 sang hình image1 (xóa bỏ sản phẩm cũ ở image1 và thay thế chính xác bằng sản phẩm mới từ image2)`);
    }
    // If extra outfit prompt notes are provided, append them cleanly
    if (outfitPrompt && !outfitPrompt.toLowerCase().includes('thay sản phẩm ở hình image2') && !outfitPrompt.toLowerCase().includes('thay sản phẩm ở hình ref2') && !outfitPrompt.toLowerCase().includes('thay thế chính xác')) {
      parts.push(outfitPrompt);
    }
  }

  // 4. Xóa phụ đề subtext trong hình (nếu bật)
  if (removeSubtitles) {
    parts.push('xóa phụ đề subtext trong hình');
  }

  // 5. Giữ nguyên bối cảnh, bố cục và người mẫu (nếu có) mà không bảo toàn sản phẩm cũ
  if (!isCharChange && !isBgChange) {
    parts.push('giữ nguyên bố cục, ánh sáng, phông nền và người mẫu (nếu có)');
  } else if (!isBgChange) {
    parts.push('giữ nguyên bố cục, ánh sáng và phông nền');
  } else if (!isCharChange) {
    parts.push('giữ nguyên người mẫu và tư thế (nếu có)');
  }

  return parts.join(', ');
};
