import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import sharp from "sharp";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;

// Helper to normalize Kling AI base endpoint
function normalizeKlingBaseUrl(inputUrl?: string): string {
  const defaultEndpoint = "https://api.openlux.ai/kling";
  const raw = (inputUrl && inputUrl.trim()) || defaultEndpoint;
  let clean = raw.replace(/\/+$/, "");
  // If user provided a full path like https://api.openlux.ai/kling/v1/videos/image2video or https://api.klingai.com/v1/videos/image2video
  if (clean.includes("/v1/videos")) {
    clean = clean.split("/v1/videos")[0];
  }
  return clean.replace(/\/+$/, "");
}

// Generate HS256 JWT for Kling AI AccessKey & SecretKey pair
function generateKlingJwt(accessKey: string, secretKey: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKey.trim(),
    exp: now + 1800,
    nbf: now - 5,
  };

  const b64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const encodedHeader = b64Url(header);
  const encodedPayload = b64Url(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secretKey.trim())
    .update(signingInput)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${signingInput}.${signature}`;
}

// Resolves Kling authorization token from API key, keeping the user's key 100% intact as-is
function resolveKlingAuthToken(apiKeyOrAk?: string, secretKey?: string): string | null {
  // If either field is filled, extract the raw key verbatim
  let rawKey = (apiKeyOrAk && apiKeyOrAk.trim()) || (secretKey && secretKey.trim()) || process.env.KLINGAI_API_KEY || process.env.KLINGAI_SECRET_KEY || "";

  if (!rawKey) return null;

  // Strip leading "Bearer " if user accidentally pasted it with the key
  if (rawKey.toLowerCase().startsWith("bearer ")) {
    rawKey = rawKey.slice(7).trim();
  }

  // GIỮ NGUYÊN 100% KEY NGƯỜI DÙNG NHẬP VÀO - TUYỆT ĐỐI KHÔNG TỰ ĐỘNG CHUẨN HÓA HAY TẠO JWT
  return rawKey;
}

// Helper to normalize OpenAI / OpenLux / Custom API endpoint
function normalizeEditsEndpoint(inputUrl?: string): { editUrl: string; baseUrl: string } {
  const defaultEndpoint = "https://api.openlux.ai/v1/images/edits";
  const raw = (inputUrl && inputUrl.trim()) || defaultEndpoint;
  let clean = raw.replace(/\/+$/, "");

  // If user specified exact edits endpoint
  if (clean.endsWith("/images/edits")) {
    return {
      editUrl: clean,
      baseUrl: clean.replace(/\/images\/edits$/, ""),
    };
  }
  // If user passed /images
  if (clean.endsWith("/images")) {
    const base = clean.replace(/\/images$/, "");
    return {
      editUrl: `${base}/images/edits`,
      baseUrl: base,
    };
  }
  // If user passed base like https://www.mnapi.com/v1
  return {
    editUrl: `${clean}/images/edits`,
    baseUrl: clean,
  };
}

// Lazy initialization of GoogleGenAI client with optional custom API key
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();

  // Increase payload limit for batch high-res images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
    const hasKlingKey = !!(
      process.env.KLINGAI_API_KEY ||
      (process.env.KLINGAI_ACCESS_KEY && process.env.KLINGAI_SECRET_KEY)
    );
    res.json({
      status: "ok",
      hasApiKey: hasKey,
      hasOpenAiKey: hasOpenAiKey,
      hasKlingKey: hasKlingKey,
      defaultModel: "gemini-3.1-flash-image",
      gptImageModel: "gpt-image-2",
    });
  });

  // Validate API key endpoint for Gemini
  app.post("/api/validate-key", async (req, res) => {
    try {
      const { apiKey, model = "gemini-3.1-flash-image" } = req.body;
      const keyToTest = (apiKey && apiKey.trim()) || process.env.GEMINI_API_KEY;

      if (!keyToTest) {
        return res.status(400).json({
          valid: false,
          error: "Không tìm thấy khóa API nào để kiểm tra. Vui lòng nhập khóa API của bạn.",
        });
      }

      const client = new GoogleGenAI({
        apiKey: keyToTest.trim(),
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      });

      // Quick test using a lightweight query
      const testResponse = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Ping",
      });

      if (testResponse) {
        return res.json({
          valid: true,
          message: "Khóa API hợp lệ! Kết nối Google Gemini thành công.",
          modelTested: model,
          isCustomKey: Boolean(apiKey && apiKey.trim()),
        });
      }

      return res.json({
        valid: false,
        error: "Không nhận được phản hồi từ dịch vụ Gemini.",
      });
    } catch (err: any) {
      console.warn("Lỗi kiểm tra API key Gemini:", err?.message || err);
      let errorMsg = err?.message || "Khóa API không hợp lệ hoặc đã hết hạn ngạch.";
      if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("invalid API key")) {
        errorMsg = "Khóa API không chính xác. Vui lòng kiểm tra lại chuỗi khóa được cấp từ Google AI Studio.";
      } else if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota")) {
        errorMsg = "Khóa API đã hết hạn ngạch (quota exceeded). Vui lòng đổi khóa khác hoặc kiểm tra tài khoản.";
      }
      return res.status(400).json({
        valid: false,
        error: errorMsg,
      });
    }
  });

  // Validate API key endpoint for GPT-Image-2 (OpenAI / OpenLux AI / OpenAI-compatible)
  app.post("/api/validate-gpt-image-key", async (req, res) => {
    try {
      const { apiKey, baseUrl = "https://api.openlux.ai/v1/images/edits", model = "gpt-image-2" } = req.body;
      const keyToTest = (apiKey && apiKey.trim()) || process.env.OPENAI_API_KEY;

      if (!keyToTest) {
        return res.status(400).json({
          valid: false,
          error: "Chưa nhập khóa API của GPT-Image-2 / OpenLux AI. Vui lòng nhập API Key (thường bắt đầu bằng sk-...).",
        });
      }

      const { baseUrl: cleanBaseUrl, editUrl } = normalizeEditsEndpoint(baseUrl);
      const targetUrl = `${cleanBaseUrl}/models`;

      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${keyToTest.trim()}`,
        },
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return res.json({
          valid: true,
          message: `Khóa API hợp lệ! Kết nối thành công tới ${editUrl} với mô hình ${model}.`,
          modelTested: model,
          endpoint: editUrl,
          isCustomKey: Boolean(apiKey && apiKey.trim()),
        });
      }

      const errData = await response.json().catch(() => ({}));
      let errMsg = errData?.error?.message || `Lỗi kết nối máy chủ (Mã phản hồi: ${response.status})`;
      if (response.status === 401) {
        errMsg = `Khóa API không chính xác hoặc token không hợp lệ đối với ${editUrl}. Vui lòng kiểm tra lại key.`;
      } else if (response.status === 429) {
        errMsg = "Khóa API đã hết hạn ngạch (Quota exceeded) hoặc vượt quá tần suất yêu cầu.";
      }

      return res.status(400).json({
        valid: false,
        error: errMsg,
      });
    } catch (err: any) {
      console.warn("Lỗi kiểm tra API key:", err?.message || err);
      return res.status(400).json({
        valid: false,
        error: err?.message || "Không thể kết nối đến máy chủ API. Vui lòng kiểm tra lại Base URL hoặc kết nối mạng.",
      });
    }
  });

  // Validate API key endpoint for Kling AI Video
  app.post("/api/validate-kling-key", async (req, res) => {
    try {
      const { apiKey, accessKey, secretKey, baseUrl = "https://api.openlux.ai/kling" } = req.body;
      const cleanBaseUrl = normalizeKlingBaseUrl(baseUrl);
      const token = resolveKlingAuthToken(apiKey || accessKey, secretKey);

      if (!token) {
        return res.status(400).json({
          valid: false,
          error: "Chưa nhập khóa API Kling AI. Vui lòng nhập API Key (hoặc cặp Access Key & Secret Key).",
        });
      }

      // Test authorization by querying Kling task list or pinging
      const targetUrl = `${cleanBaseUrl}/v1/videos/image2video?page=1&page_size=1`;
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok || data.code === 0) {
        return res.json({
          valid: true,
          message: `Khóa API Kling AI hợp lệ! Kết nối thành công tới ${cleanBaseUrl}.`,
          endpoint: cleanBaseUrl,
          isCustomKey: Boolean(apiKey || (accessKey && secretKey)),
        });
      }

      if (response.status === 401 || response.status === 403 || data.code === 1001 || data.code === 1002) {
        return res.status(400).json({
          valid: false,
          error: data.message || `Khóa API Kling AI không chính xác hoặc token không hợp lệ (Mã HTTP: ${response.status}).`,
        });
      }

      // If status is 404/405, server reached without auth rejection
      if (response.status === 404 || response.status === 405) {
        return res.json({
          valid: true,
          message: `Kết nối thành công tới máy chủ Kling AI (${cleanBaseUrl}). Token xác thực được chấp nhận.`,
          endpoint: cleanBaseUrl,
          isCustomKey: Boolean(apiKey || (accessKey && secretKey)),
        });
      }

      return res.status(400).json({
        valid: false,
        error: data.message || `Máy chủ Kling AI trả về phản hồi mã: ${response.status}.`,
      });
    } catch (err: any) {
      console.warn("Lỗi kiểm tra API key Kling:", err?.message || err);
      return res.status(400).json({
        valid: false,
        error: err?.message || "Không thể kết nối đến máy chủ Kling AI. Vui lòng kiểm tra lại URL hoặc kết nối mạng.",
      });
    }
  });

  // Initiate Video Generation with Kling AI
  app.post("/api/kling/create-video", async (req, res) => {
    try {
      const {
        image, // Base64 data URL or URL
        imageUrl,
        prompt,
        apiKey,
        accessKey,
        secretKey,
        baseUrl = "https://api.openlux.ai/kling",
        model,
        model_name,
        mode = "pro",
        duration = "5",
        aspect_ratio = "9:16",
        multi_shot = false,
        cfg_scale = 0.6,
        negative_prompt,
        watermark_info,
      } = req.body;

      const finalImage = image || imageUrl;
      if (!finalImage) {
        return res.status(400).json({
          error: "Thiếu hình ảnh đầu vào để tạo video (image is required)",
        });
      }

      const cleanBaseUrl = normalizeKlingBaseUrl(baseUrl);
      const token = resolveKlingAuthToken(apiKey || accessKey, secretKey);

      if (!token) {
        return res.status(400).json({
          error: "Chưa cấu hình API Key cho Kling AI. Vui lòng cấu hình API Key trong mục Cài đặt API.",
        });
      }

      // Format image: Kling AI accepts public URL or clean base64 string
      let formattedImage = finalImage;
      if (typeof finalImage === "string" && finalImage.startsWith("data:")) {
        const commaIdx = finalImage.indexOf(",");
        if (commaIdx !== -1) {
          formattedImage = finalImage.slice(commaIdx + 1);
        }
      }

      const defaultNegativePrompt = "";

      const defaultPrompt =
        "The model poses naturally and gracefully with subtle gentle breathing movements, keeping the product design, clothing prints, patterns, logos and apparel structure completely fixed and unchanged. Highly detailed, 4k photorealistic cinematic lighting.";

      // Build payload matching exact Kling AI image2video specification
      const payload: Record<string, any> = {
        model_name: model_name || model || "kling-v2-6",
        mode: mode === "std" ? "std" : "pro",
        duration: String(duration || "5"),
        aspect_ratio: aspect_ratio || "9:16",
        multi_shot: Boolean(multi_shot),
        image: formattedImage,
        prompt: (prompt && prompt.trim()) || defaultPrompt,
        negative_prompt:
          negative_prompt && typeof negative_prompt === "string" && !negative_prompt.includes("camera movement")
            ? negative_prompt.trim()
            : defaultNegativePrompt,
        cfg_scale: typeof cfg_scale === "number" ? cfg_scale : Number(cfg_scale) || 0.6,
        watermark_info:
          watermark_info && typeof watermark_info === "object"
            ? watermark_info
            : { enabled: false },
      };

      console.log(
        "[Kling AI Video Request] Model:",
        payload.model_name,
        "Mode:",
        payload.mode,
        "Duration:",
        payload.duration,
        "Aspect:",
        payload.aspect_ratio,
        "CFG:",
        payload.cfg_scale
      );

      const targetUrl = `${cleanBaseUrl}/v1/videos/image2video`;
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (data.code !== undefined && data.code !== 0)) {
        let errMsg = data.message || data.error?.message || data.error || `Lỗi máy chủ Kling AI (HTTP ${response.status})`;
        if (response.status === 401 || data.code === 1001) {
          errMsg = "Khóa API Kling AI không chính xác hoặc token đã hết hạn.";
        } else if (response.status === 429 || data.code === 1004) {
          errMsg = "Đã vượt quá hạn ngạch hoặc tần suất yêu cầu của Kling AI.";
        }
        return res.status(response.status || 400).json({
          error: errMsg,
          details: data,
          requestPayloadPreview: {
            ...payload,
            image: typeof payload.image === "string" && payload.image.length > 60
              ? `${payload.image.slice(0, 40)}... (${payload.image.length} bytes)`
              : payload.image,
          },
        });
      }

      const taskId = data.data?.task_id || data.task_id || data.data?.id || data.id;
      if (!taskId) {
        return res.status(500).json({
          error: "Kling AI không trả về task_id.",
          details: data,
        });
      }

      const rawStatus = data.data?.task_status || data.task_status || data.status || "submitted";
      return res.json({
        success: true,
        taskId,
        status: rawStatus,
        message: data.message || "Tác vụ tạo video đã được gửi tới Kling AI thành công.",
        requestPayloadPreview: {
          ...payload,
          image: typeof payload.image === "string" && payload.image.length > 60
            ? `${payload.image.slice(0, 40)}... (${payload.image.length} bytes)`
            : payload.image,
        },
      });
    } catch (err: any) {
      console.error("Lỗi gửi tác vụ tạo video Kling:", err);
      return res.status(500).json({
        error: err?.message || "Lỗi nội bộ khi tạo video qua Kling AI.",
      });
    }
  });

  // Check Video Generation Status with Kling AI
  app.get("/api/kling/task-status/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const {
        apiKey,
        accessKey,
        secretKey,
        baseUrl = "https://api.openlux.ai/kling",
      } = req.query as Record<string, string>;

      if (!taskId) {
        return res.status(400).json({ error: "Thiếu taskId" });
      }

      const cleanBaseUrl = normalizeKlingBaseUrl(baseUrl);
      const token = resolveKlingAuthToken(apiKey || accessKey, secretKey);

      if (!token) {
        return res.status(400).json({
          error: "Thiếu khóa xác thực Kling AI.",
        });
      }

      const targetUrl = `${cleanBaseUrl}/v1/videos/image2video/${taskId}`;
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (data.code !== undefined && data.code !== 0)) {
        return res.status(response.status || 400).json({
          error: data.message || `Lỗi truy vấn trạng thái tác vụ Kling (HTTP ${response.status})`,
          details: data,
        });
      }

      const taskData = data.data || data || {};
      let status = taskData.task_status || taskData.status || "processing";
      if (status === "success" || status === "completed" || status === "done") {
        status = "succeed";
      }
      const statusMsg = taskData.task_status_msg || taskData.message || "";
      const videos =
        taskData.task_result?.videos ||
        taskData.videos ||
        (taskData.video_url ? [{ url: taskData.video_url, duration: taskData.duration }] : []);
      const videoUrl = videos.length > 0 ? videos[0].url : (taskData.video_url || undefined);
      const videoDuration = videos.length > 0 ? videos[0].duration : (taskData.duration || undefined);

      return res.json({
        success: true,
        taskId,
        status,
        statusMsg,
        videoUrl,
        duration: videoDuration,
        raw: taskData,
      });
    } catch (err: any) {
      console.error("Lỗi truy vấn trạng thái Kling:", err);
      return res.status(500).json({
        error: err?.message || "Lỗi khi kiểm tra tiến trình video Kling.",
      });
    }
  });

  // Dictionary-based smart translator to ensure diffusion models accurately interpret product/clothing intents
  function enrichPromptWithEnglish(prompt: string): string {
    const p = prompt.trim();
    if (!p) return "";
    const pLower = p.toLowerCase();
    const additions: string[] = [];

    // Tạp dề / Kitchen Apron
    if (pLower.includes("tạp dề") || pLower.includes("tap de") || pLower.includes("apron") || pLower.includes("nấu ăn") || pLower.includes("làm bếp")) {
      additions.push("a kitchen cooking apron with clean cloth drape, neck strap, waist ties, chest bib, and the exact front printed artwork, graphics, and color pattern transferred from the reference");
    }

    // Jewelry & Wearables
    if (pLower.includes("vòng tay") || pLower.includes("lắc tay") || pLower.includes("vòng đeo tay")) {
      if (pLower.includes("tết da") || pLower.includes("da")) {
        additions.push("a premium braided black leather wrist bracelet with a polished silver magnetic clasp worn around the wrist");
      } else if (pLower.includes("vàng") || pLower.includes("gold")) {
        additions.push("an elegant 18k solid gold wrist bracelet worn on the wrist with rich reflective golden luster");
      } else if (pLower.includes("bạc") || pLower.includes("silver")) {
        additions.push("a sleek 925 sterling silver chain bracelet visibly worn on the wrist");
      } else {
        additions.push("a stylish wearable wrist bracelet worn snugly on the subject's wrist with detailed clasp and realistic lighting");
      }
    } else if (pLower.includes("đồng hồ")) {
      additions.push("a luxury chronograph wristwatch with sapphire glass dial and leather or stainless steel strap worn on the wrist");
    } else if (pLower.includes("dây chuyền") || pLower.includes("vòng cổ")) {
      additions.push("an elegant pendant necklace worn around the neck");
    } else if (pLower.includes("nhẫn")) {
      additions.push("a luxury jewelry ring worn on the finger with reflective metal finish");
    } else if (pLower.includes("túi xách") || pLower.includes("túi") || pLower.includes("balo")) {
      additions.push("a luxury leather designer handbag held by hand or on shoulder");
    }

    // Garments & Clothing
    if (pLower.includes("vest") || pLower.includes("suit")) {
      additions.push("a bespoke tailored navy or charcoal business suit jacket with crisp collar and dress shirt");
    } else if (pLower.includes("sơ mi")) {
      additions.push("a clean, perfectly pressed button-up cotton dress shirt");
    } else if (pLower.includes("đầm") || pLower.includes("váy")) {
      additions.push("an elegant flowing evening gown/dress with natural textile folds and flattering fit");
    } else if (pLower.includes("áo dài")) {
      additions.push("a traditional silk Vietnamese Ao Dai with high collar and graceful drapery");
    } else if (pLower.includes("áo thun") || pLower.includes("áo phông")) {
      additions.push("a premium fitted crewneck cotton t-shirt");
    } else if (pLower.includes("áo khoác") || pLower.includes("jacket")) {
      additions.push("a modern stylish outerwear jacket");
    }

    // Removal of old text/embroidery/patterns
    if (pLower.includes("xóa") || pLower.includes("loại bỏ") || pLower.includes("thay thế")) {
      additions.push("completely erase all old text, names, embroidery, and conflicting patterns from the original image item");
    }

    if (additions.length > 0) {
      return `${p} (Directives: ${additions.join("; ")})`;
    }
    return p;
  }

  // Multimodal visual inspector to compare Image 1 (base) and Image 2..N (product references)
  async function inspectReplacementPair(params: {
    ai: GoogleGenAI | null;
    openAiConfig?: {
      apiKey: string;
      baseUrl: string;
    };
    baseOriginal: string;
    originalMimeType: string;
    productRefs: Array<{ refIndex: number; name: string; mimeType: string; data: string }>;
    outfitPrompt?: string;
    characterPrompt?: string;
    enableCharacter: boolean;
  }): Promise<string | null> {
    const {
      ai,
      openAiConfig,
      baseOriginal,
      originalMimeType,
      productRefs,
      outfitPrompt,
      characterPrompt,
      enableCharacter,
    } = params;

    if (productRefs.length === 0) return null;

    // 1. Try Gemini Flash if ai client is available
    if (ai) {
      try {
        const parts: any[] = [
          {
            inlineData: {
              mimeType: originalMimeType,
              data: baseOriginal,
            },
          },
          ...productRefs.map((p) => ({
            inlineData: {
              mimeType: p.mimeType,
              data: p.data,
            },
          })),
          {
            text: `You are an expert AI vision analyst for image editing and product replacement.
Input images:
- Image 1: The ground-truth base photo.
- Image 2${productRefs.length > 1 ? ` to Image ${productRefs.length + 1}` : ""}: Target product reference(s) to replace into Image 1.

Analyze both images carefully and provide 3 concise bullet points in English:
1. TARGET PRODUCT DETAILS: Specifically describe the product in Image 2 (e.g., apron, shirt, bag, bracelet, or product; its exact pattern, artwork, illustrations, colors, typography, and straps).
2. SOURCE ITEM IN IMAGE 1 TO REPLACE: Identify the corresponding item in Image 1 that must be replaced (e.g., 'the Mexican floral embroidered apron with text VALENTINA/SOFIA'). Explicitly state that all old text, names, and embroidery on this item in Image 1 MUST BE COMPLETELY ERASED.
3. INPAINTING DIRECTIVE: Clearly state how to render the product from Image 2 into Image 1 (e.g., replace the apron in Image 1 with Image 2's apron; ${enableCharacter && characterPrompt ? `the newly modified character (${characterPrompt}) must be wearing this new product` : "maintain the exact same position/hanging display without adding people"}).
${outfitPrompt ? `User request notes: "${outfitPrompt}"` : ""}

Keep your output concise and directly actionable for an inpainting model.`,
          },
        ];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: { parts },
        });
        clearTimeout(timeout);

        const text = res.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join(" ")
          .trim();

        if (text && text.length > 25) {
          console.log("Vision Inspector (Gemini Flash) identified:", text);
          return text;
        }
      } catch (geminiFlashErr) {
        console.warn("Vision inspection via gemini-3.8-flash timed out or failed:", geminiFlashErr);
      }
    }

    // 2. Try OpenAI Vision (gpt-4o-mini) if OpenAI / MN API key is provided
    if (openAiConfig && openAiConfig.apiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const chatRes = await fetch(`${openAiConfig.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiConfig.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze Image 1 (ground-truth photo) and Image 2 (target product reference to wear/place). Provide 3 concise actionable bullet points in English:
1. TARGET PRODUCT DETAILS: Specifically describe the product in Image 2 (garment type, exact colors, pattern, typography, straps, fabric).
2. SOURCE ITEM TO REPLACE IN IMAGE 1: Identify the item in Image 1 that must be erased. All old text/embroidery must be completely erased.
3. INPAINTING DIRECTIVE: Specify how to render Image 2's product into Image 1 (${enableCharacter && characterPrompt ? `the modified subject (${characterPrompt}) must be visibly wearing this replacement product` : "place or replace the item in the scene naturally"}).
${outfitPrompt ? `User notes: "${outfitPrompt}"` : ""}`,
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:${originalMimeType};base64,${baseOriginal}` },
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:${productRefs[0].mimeType};base64,${productRefs[0].data}` },
                  },
                ],
              },
            ],
            max_tokens: 300,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (chatRes.ok) {
          const chatJson = await chatRes.json();
          const reply = chatJson?.choices?.[0]?.message?.content?.trim();
          if (reply && reply.length > 25) {
            console.log("Vision Inspector (OpenAI Vision via API Key) identified:", reply);
            return reply;
          }
        }
      } catch (openAiVisionErr) {
        console.warn("Vision inspection via OpenAI/MN API timed out or failed:", openAiVisionErr);
      }
    }

    // 3. Semantic synthesis based on filenames and prompt keywords (Zero extra API calls, instant & robust)
    const pNames = productRefs.map((p) => p.name.toLowerCase()).join(" ");
    const userP = (outfitPrompt || "").toLowerCase();
    const combined = `${pNames} ${userP}`;

    if (combined.includes("apron") || combined.includes("tap") || combined.includes("bep") || combined.includes("cook")) {
      return "Target product is a kitchen apron. Completely remove the existing apron in Image 1, erasing all old embroidery, names, and patterns. Render the replacement apron matching the exact fabric pattern, colors, and straps from reference Image 2.";
    }
    if (combined.includes("bracelet") || combined.includes("vong") || combined.includes("lac")) {
      return "Target product is a wrist bracelet/accessory. Place the exact bracelet from reference Image 2 onto the subject's wrist with realistic metallic luster and shadows, replacing any conflicting old accessory.";
    }
    if (combined.includes("shirt") || combined.includes("ao") || combined.includes("dress") || combined.includes("vay")) {
      return "Target product is clothing/garment. Replace the subject's worn clothing with the exact garment from reference Image 2, matching its fabric texture, colors, and drape.";
    }

    return `Target product reference: replace the corresponding worn or displayed item in Image 1 with the exact product from Image 2, erasing all old graphics and text from the original item.`;
  }

  // Ensure output image strictly conforms to requested 9:16 aspect ratio
  async function ensureAspectRatio(
    base64DataUrl: string,
    targetAspect: string
  ): Promise<string> {
    if (targetAspect !== "9:16") return base64DataUrl;

    try {
      const cleanB64 = base64DataUrl.includes(",") ? base64DataUrl.split(",")[1] : base64DataUrl;
      const inBuffer = Buffer.from(cleanB64, "base64");
      const meta = await sharp(inBuffer).metadata();
      if (!meta.width || !meta.height) return base64DataUrl;

      const currentRatio = meta.width / meta.height;
      // 9:16 is 0.5625. If currentRatio is close to 9:16 (0.52 to 0.60), keep as is
      if (currentRatio >= 0.52 && currentRatio <= 0.60) {
        return base64DataUrl;
      }

      // If image is square (e.g. 1.0) or landscape, format into 9:16 vertical canvas (1080x1920)
      const targetWidth = 1080;
      const targetHeight = 1920;

      // Create a blurred ambient background from the image itself
      const blurredBg = await sharp(inBuffer)
        .resize(targetWidth, targetHeight, { fit: "cover" })
        .blur(25)
        .modulate({ brightness: 0.65 })
        .toBuffer();

      // Fit main image cleanly in center of vertical canvas
      const fittedForeground = await sharp(inBuffer)
        .resize(targetWidth, targetHeight, { fit: "contain" })
        .toBuffer();

      const composited = await sharp(blurredBg)
        .composite([{ input: fittedForeground, gravity: "center" }])
        .png({ quality: 95 })
        .toBuffer();

      return `data:image/png;base64,${composited.toString("base64")}`;
    } catch (err) {
      console.warn("Could not adjust aspect ratio with sharp:", err);
      return base64DataUrl;
    }
  }

  // Helper to describe uploaded outfit/product image using prompt keywords and semantic enrichment
  function describeOutfitOrProduct(
    productName: string,
    userPrompt?: string
  ): string {
    const rawPrompt = userPrompt?.trim() || "";
    const enrichedUserPrompt = enrichPromptWithEnglish(rawPrompt);

    // If user provided a descriptive prompt, return it with English enrichment
    if (rawPrompt.length > 25 && !rawPrompt.includes("Khoác lên trang phục giống hệt mẫu")) {
      return enrichedUserPrompt;
    }

    const nameEnriched = enrichPromptWithEnglish(productName || "");
    if (nameEnriched && nameEnriched !== productName) {
      return nameEnriched;
    }

    return (
      enrichedUserPrompt ||
      "the target product reference item matching the exact pattern, color, and texture"
    );
  }

  // Image replacement and editing endpoint
  app.post("/api/generate-replacement", async (req, res) => {
    try {
      const {
        provider = "gemini", // "gemini" | "gpt-image-2"
        gptImageConfig,
        originalImageBase64, // pure base64 or data URL (ref1)
        originalMimeType = "image/jpeg",
        productImages = [], // array of references [ref2, ref3, ...] { data: string, mimeType?: string, name?: string } or string base64
        characterPrompt = "",
        productName = "",
        outfitPrompt = "",
        backgroundPrompt = "",
        outfitImageBase64 = null, // legacy fallback for single reference
        outfitMimeType = "image/jpeg",
        enableCharacter = true,
        enableOutfit = true,
        enableBackground = true,
        removeSubtitles = true,
        preserveBackground = true,
        preservePose = true,
        stylePreset = "photorealistic",
        aspectRatio = "1:1",
        apiKey = "",
        selectedModel = "gemini-3.1-flash-image",
      } = req.body;

      if (!originalImageBase64) {
        return res.status(400).json({
          error: "Thiếu dữ liệu hình ảnh gốc (originalImageBase64 is required)",
        });
      }

      // Clean base64 string if it contains data URI prefix
      const cleanBase64 = (str: string) => {
        if (!str) return "";
        if (str.includes(",")) {
          return str.split(",")[1];
        }
        return str;
      };

      const baseOriginal = cleanBase64(originalImageBase64);

      // Normalize multi-reference images: image[ref1, ref2, ...]
      // ref1 is ALWAYS originalImageBase64 (the original photo)
      // ref2, ref3, ... are product/garment/accessory reference images to replace into ref1
      interface NormalizedProductRef {
        refIndex: number;
        data: string;
        mimeType: string;
        name: string;
      }

      const rawProductList = Array.isArray(productImages) ? productImages : [];
      let normalizedProductRefs: NormalizedProductRef[] = rawProductList
        .map((item: any, idx: number) => {
          const dataStr = typeof item === "string" ? item : (item.data || item.dataUrl || item.previewUrl || "");
          const mime = (typeof item === "object" && item.mimeType) || "image/jpeg";
          const name = (typeof item === "object" && item.name) || `Sản phẩm ${idx + 1}`;
          return {
            refIndex: idx + 2, // ref2, ref3, ...
            data: cleanBase64(dataStr),
            mimeType: mime,
            name,
          };
        })
        .filter((p) => p.data && p.data.length > 20);

      // Legacy fallback: if productImages was empty but outfitImageBase64 was provided
      if (normalizedProductRefs.length === 0 && outfitImageBase64) {
        const cleanedLegacy = cleanBase64(outfitImageBase64);
        if (cleanedLegacy) {
          normalizedProductRefs.push({
            refIndex: 2,
            data: cleanedLegacy,
            mimeType: outfitMimeType || "image/jpeg",
            name: "Sản phẩm tham chiếu",
          });
        }
      }

      console.log("\n=======================================================");
      console.log("📥 [YÊU CẦU TẠO ẢNH: /api/generate-replacement]");
      console.log("Thời gian:", new Date().toLocaleString("vi-VN"));
      console.log("Động cơ / Provider:", provider);
      console.log("Tỉ lệ khung hình (aspectRatio):", aspectRatio);
      console.log("Hình ảnh gốc (Image 1):", `${originalMimeType} (~${Math.round(baseOriginal.length * 0.75 / 1024)} KB)`);
      console.log(
        "Sản phẩm tham chiếu:",
        normalizedProductRefs.length > 0
          ? normalizedProductRefs.map((p) => `ref${p.refIndex} [${p.name}]`).join(", ")
          : "(không có sản phẩm đính kèm)"
      );
      console.log("Nhân vật thay thế:", characterPrompt || "(giữ nguyên nhân vật gốc)");
      console.log("Trang phục / Sản phẩm:", outfitPrompt || "(tự động nhận diện từ ảnh mẫu)");
      console.log("Xóa phụ đề vietsub:", removeSubtitles ? "Có" : "Không");
      console.log("Bối cảnh:", backgroundPrompt ? `Thay đổi -> "${backgroundPrompt}"` : (preserveBackground ? "Giữ bối cảnh gốc" : "Tự do"));
      console.log("Giữ tư thế gốc:", preservePose ? "Có" : "Không");
      console.log("Phong cách:", stylePreset);
      console.log("=======================================================\n");

      // --- BRANCH A: GPT-IMAGE-2 (OpenAI / OpenAI-Compatible) ---
      if (provider === "gpt-image-2") {
        const headerOpenAiKey = req.headers["x-openai-api-key"] as string | undefined;
        const effectiveGptKey =
          (gptImageConfig?.apiKey && gptImageConfig.apiKey.trim()) ||
          (headerOpenAiKey && headerOpenAiKey.trim()) ||
          process.env.OPENAI_API_KEY;

        if (!effectiveGptKey) {
          return res.status(400).json({
            error: "Chưa cấu hình API Key cho GPT-Image-2. Vui lòng mở mục 'Cấu hình API & Key', chọn tab 'GPT-Image-2' và nhập API Key của bạn.",
            needsApiKey: true,
            provider: "gpt-image-2",
          });
        }

        const { editUrl, baseUrl: targetBaseUrl } = normalizeEditsEndpoint(gptImageConfig?.baseUrl);
        const gptModel = gptImageConfig?.model || "gpt-image-2";
        const gptQuality = gptImageConfig?.quality || "medium";

        // Determine size: prioritize user's explicit size in gptImageConfig, else map aspect ratio with 1152x2048 default for 9:16
        let gptSize = gptImageConfig?.size?.trim();
        if (!gptSize) {
          if (aspectRatio === "9:16") {
            gptSize = "1152x2048";
          } else if (aspectRatio === "3:4") {
            gptSize = "1024x1365";
          } else if (aspectRatio === "16:9") {
            gptSize = "2048x1152";
          } else if (aspectRatio === "4:3") {
            gptSize = "1365x1024";
          } else {
            gptSize = "1024x1024";
          }
        }

        // Run vision inspection to analyze Image 1 (base) and Image 2..N (product references)
        const visionSummary = await inspectReplacementPair({
          ai: getGeminiClient(),
          openAiConfig: {
            apiKey: effectiveGptKey,
            baseUrl: targetBaseUrl,
          },
          baseOriginal,
          originalMimeType,
          productRefs: normalizedProductRefs,
          outfitPrompt,
          characterPrompt,
          enableCharacter,
        });

        // Resolve descriptive outfit/product details using prompt & keywords for all references
        let resolvedOutfitDesc = "";
        if (enableOutfit && normalizedProductRefs.length > 0) {
          const descs = normalizedProductRefs.map((prod) => {
            const desc = describeOutfitOrProduct(
              prod.name,
              outfitPrompt
            );
            return `• ref${prod.refIndex} (Image ${prod.refIndex}) [${prod.name}]: ${desc}`;
          });
          resolvedOutfitDesc = descs.join("\n");
          if (visionSummary) {
            resolvedOutfitDesc = `${visionSummary}\n\n${resolvedOutfitDesc}`;
          }
          if (productName && productName.trim()) {
            resolvedOutfitDesc = `Target Product Name: "${productName.trim()}"\n${resolvedOutfitDesc}`;
          }
          if (outfitPrompt && outfitPrompt.trim()) {
            resolvedOutfitDesc += `\nAdditional user notes: ${outfitPrompt.trim()}`;
          }
        } else if (enableOutfit && (productName || outfitPrompt)) {
          resolvedOutfitDesc = [
            productName && productName.trim() ? `Target Product: ${productName.trim()}` : "",
            outfitPrompt && outfitPrompt.trim() ? outfitPrompt.trim() : "",
          ].filter(Boolean).join("\n");
        }

        const primaryOutfitMandate = enableOutfit
          ? (enableCharacter
              ? `CRITICAL MANDATORY TASK - COMPLETE OUTFIT & PRODUCT SWAP (HIGHEST PRIORITY):
- Both Image 1 (original photo) and Image 2 (product reference) are provided as direct visual references.
- YOUR PRIMARY OBJECTIVE: The person in the final photo MUST BE WEARING the exact product shown in Image 2!
- Target Product Description:
${resolvedOutfitDesc}
- SURGICAL REPLACEMENT:
  * Locate the corresponding garment, clothing, or apron in Image 1.
  * COMPLETELY ERASE and REMOVE this original garment and ALL of its text, names (such as 'SOFIA' or 'VALENTINA'), embroidery, and conflicting artwork from Image 1.
  * Render the person WEARING the replacement product from Image 2 (ref2).
  * Transfer ALL visual features of Image 2: the exact floral prints/graphics, colors, typography, fabric texture, neck straps, and waist ties.
  * HIGHEST PRIORITY: DO NOT KEEP THE OLD CLOTHING FROM IMAGE 1! The subject MUST be wearing the product from Image 2!`
              : `CRITICAL MANDATE - EXACT PRODUCT REPLACEMENT ONLY (NO CHARACTER ALTERATION / NO NEW PERSON):
- Both Image 1 (original photo) and Image 2 (product reference) are provided as visual references.
- YOUR PRIMARY OBJECTIVE: Replace the corresponding item in Image 1 with the exact product shown in Image 2.
- Target Product Description:
${resolvedOutfitDesc}
- SURGICAL REPLACEMENT: Identify the item in Image 1 (apron, shirt, bag, or displayed product). COMPLETELY ERASE all old text, names ('SOFIA', 'VALENTINA'), embroidery, and old patterns from this item in Image 1!
- Render the replacement product matching the exact artwork, print pattern, and colors from Image 2.
- STRICT RULE: DO NOT add, invent, or introduce any new person, model, human character, or face.
- If the original photo has a person: Keep their exact face, facial features, hair, identity, body, and pose 100% UNCHANGED. Only replace the clothing/apron they are wearing.
- If the original photo does NOT have a person (e.g. an apron hanging on a wall hook, product on a table, flat lay): DO NOT generate or add any human model! Simply replace the hanging or displayed item in place on the wall/hook/table in the exact same format and background.`)
          : "PRESERVE ORIGINAL CLOTHING: Keep existing garments and worn accessories completely unchanged.";

        const characterRequirement = enableCharacter
          ? (characterPrompt && characterPrompt.trim()
              ? `CHARACTER MODIFICATION:
- Modify the subject to match: "${characterPrompt.trim()}".
- Seamlessly replace the face, facial features, hair, and age while keeping the natural head tilt, body pose, hand gesture, and emotional expression from Image 1.
- CRITICAL: Even though her face/identity is changed, HER CLOTHING MUST BE THE REPLACEMENT PRODUCT FROM IMAGE 2 (ref2). Do NOT retain the clothing from Image 1 on the new character.`
              : "CHARACTER: Retain natural character appearance, face, and body pose from Image 1.")
          : `STRICT PROHIBITION - DO NOT ADD OR CHANGE ANY PERSON OR CHARACTER:
- DO NOT generate, invent, or add any new person, model, face, or human character into the image.
- If the source image contains a person, keep their identity, face, eyes, hair, age, and biological features 100% UNCHANGED.
- If the source image contains NO person, DO NOT add any human person. Only replace the product or clothing.`;

        const framingInstruction = enableCharacter
          ? "COMPOSITION & FRAMING: Vertical 9:16 mobile aspect ratio portrait framing (TikTok/Reels format). Clear view of the character, their upper body, hands, and the replaced outfit/product."
          : "COMPOSITION & FRAMING: Vertical 9:16 mobile aspect ratio framing. Focus strictly on the product and outfit replacement in the original composition. DO NOT introduce any new human models or people.";

        const hasBgChange = Boolean(backgroundPrompt && backgroundPrompt.trim());
        const backgroundDirective = hasBgChange
          ? `BACKGROUND REPLACEMENT DIRECTIVE (ONLY CHANGE BACKGROUND, STRICTLY LOCK FOREGROUND & POSITION):
- ONLY replace the background scenery and environment behind/around the subject with: "${backgroundPrompt.trim()}".
- CRITICAL POSITION & SUBJECT LOCK: Keep the EXACT spatial position, canvas coordinates, framing, scale, and bounding box of the person/character and product 100% UNCHANGED from Image 1. DO NOT move, shift, re-center, or re-scale the character or product.
- Keep the character's body pose, head tilt, face, gestures, and the worn/displayed product in their exact original pixel location.
- Only inpaint the new background around the subject, integrating realistic contact shadows, depth-of-field, and ambient lighting seamlessly.`
          : (preserveBackground ? "BACKGROUND PRESERVATION: Keep the exact background environment, room lighting, depth-of-field, and cinematic atmosphere identical to Image 1." : "");

        const typographyDirectives = `TYPOGRAPHY & GRAPHIC DETAIL MANDATE (ULTRA-SHARP VECTOR CLARITY):
- REPLICATE ALL TEXT & NAMES WITH VECTOR-GRADE CLARITY: Every word, title, name, letter, and decorative typography on the replacement product (Image 2) must be rendered with razor-sharp pixel edges, exact spelling, clean distinct font shapes, and zero blur.
- PERFECT FONT ALIGNMENT & CONTRAST: Preserve the distinct colorful typography, font weights, and spacing from Image 2 seamlessly integrated into the cloth texture without bleeding, smearing, or distortion.
- STRICT PROHIBITION OF TYPOGRAPHIC ARTIFACTS: Absolutely NO blurry text, NO smudged lettering, NO distorted or melting font shapes, NO scrambled pseudo-characters, NO hallucinated duplicate names, and NO low-resolution artifacts.`;

        // Build comprehensive prompt for GPT-Image-2 / MN API edits grounded on Image 1 and Image 2
        const promptInstructions = [
          "TASK: High-Precision Image-to-Image Multi-Reference Product Inpainting & Editing.",
          `- Image 1: Ground-truth base photo (${hasBgChange ? "exact subject location, character position, product placement" : "scene composition, camera angle, lighting, background"}).`,
          "- Image 2: Target product/outfit reference to replace onto the subject in Image 1.",
          primaryOutfitMandate,
          typographyDirectives,
          characterRequirement,
          preservePose ? "Strictly maintain the exact same body posture, gestures, and camera angle from the source image." : "",
          backgroundDirective,
          removeSubtitles ? "SUBTITLE REMOVAL: Cleanly erase any movie subtitles, captions, watermarks, or text overlays." : "",
          framingInstruction,
          `STYLE: ${stylePreset}. Photorealistic master photography, 8k resolution, authentic lighting, no cartoons, no drawings, no extra borders.`,
        ].filter(Boolean).join("\n\n");

        let generatedImageUrl: string | null = null;
        let lastGptError = "";
        let pngBuffer: Buffer | null = null;
        const productBlobs: Array<{ filename: string; blob: Blob; refIndex: number; size: number }> = [];

        // Primary execution: Call the exact edit endpoint (e.g. https://api.openlux.ai/v1/images/edits)
        try {
          const rawBuffer = Buffer.from(baseOriginal, "base64");
          // Convert input image buffer to an RGBA PNG buffer using Sharp
          try {
            pngBuffer = await sharp(rawBuffer)
              .resize(1024, 1024, { fit: "inside", withoutEnlargement: false })
              .ensureAlpha()
              .png({ compressionLevel: 8 })
              .toBuffer();
          } catch (sharpErr) {
            console.warn("sharp resize warning, using raw buffer:", sharpErr);
            pngBuffer = rawBuffer;
          }

          // Prepare all product reference buffers so they are sent as active visual references
          if (enableOutfit && normalizedProductRefs.length > 0) {
            for (const prod of normalizedProductRefs) {
              const rawProdBuf = Buffer.from(prod.data, "base64");
              let prodPng: Buffer;
              try {
                prodPng = await sharp(rawProdBuf)
                  .resize(1024, 1024, { fit: "inside", withoutEnlargement: false })
                  .ensureAlpha()
                  .png({ compressionLevel: 8 })
                  .toBuffer();
              } catch {
                prodPng = rawProdBuf;
              }
              productBlobs.push({
                filename: `image_${prod.refIndex}_product_reference.png`,
                blob: new Blob([new Uint8Array(prodPng)], { type: "image/png" }),
                refIndex: prod.refIndex,
                size: prodPng.length,
              });
            }
          }

          const formData = new FormData();
          // Image 1: Base scene photograph
          const mainImageBuffer = pngBuffer || rawBuffer;
          formData.append("image", new Blob([new Uint8Array(mainImageBuffer)], { type: "image/png" }), "image_1_base.png");
          // Image 2..N: Target product reference image files
          for (const p of productBlobs) {
            formData.append("image", p.blob, p.filename);
          }
          formData.append("prompt", promptInstructions);
          if (gptModel) {
            formData.append("model", gptModel);
          }
          formData.append("size", gptSize);
          if (gptQuality) {
            formData.append("quality", gptQuality);
          }
          formData.append("response_format", "b64_json");

          console.log("\n=======================================================");
          console.log("🚀 [BODY YÊU CẦU TẠO ẢNH: GPT-IMAGE-2 (multipart/form-data)]");
          console.log("Endpoint đích:", editUrl);
          console.log("Phương thức: POST");
          console.log("Header Authorization: Bearer sk-***");
          console.log("Các trường FormData gửi đi:");
          console.log(JSON.stringify({
            model: gptModel,
            size: gptSize,
            quality: gptQuality,
            response_format: "b64_json",
            input_images: [
              {
                role: "Image 1 (Ảnh gốc - Bố cục, bối cảnh, tư thế)",
                filename: "image_1_base.png",
                size: `${mainImageBuffer.length} bytes (1024x1024 RGBA PNG)`,
              },
              ...productBlobs.map((p) => ({
                role: `Image ${p.refIndex} (Ảnh sản phẩm/trang phục tham chiếu cần thay thế)`,
                filename: p.filename,
                size: `${p.size} bytes (1024x1024 RGBA PNG)`,
              })),
            ],
            total_reference_images: 1 + productBlobs.length,
            prompt_length: `${promptInstructions.length} ký tự`,
          }, null, 2));
          console.log("--- NỘI DUNG PROMPT HOÀN CHỈNH GỬI SANG GPT-IMAGE-2 ---");
          console.log(promptInstructions);
          console.log("-------------------------------------------------------");
          console.log("=======================================================\n");

          let editRes = await fetch(editUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${effectiveGptKey.trim()}`,
            },
            body: formData,
          });

          // Fallback A: If endpoint strictly rejects multiple image files in 'image', retry with single image + enhanced vision prompt
          if (!editRes.ok) {
            const errClone = await editRes.clone().json().catch(() => ({}));
            const errMsg = (errClone?.error?.message || "").toLowerCase();
            if (
              errMsg.includes("only 1") ||
              errMsg.includes("too many") ||
              errMsg.includes("single file") ||
              errMsg.includes("single image")
            ) {
              console.warn("Proxy endpoint only accepts single file, retrying with single image + vision prompt...");
              const singleFormData = new FormData();
              singleFormData.append("image", new Blob([new Uint8Array(mainImageBuffer)], { type: "image/png" }), "image.png");
              singleFormData.append("prompt", promptInstructions);
              if (gptModel) singleFormData.append("model", gptModel);
              singleFormData.append("size", gptSize);
              singleFormData.append("response_format", "b64_json");
              editRes = await fetch(editUrl, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${effectiveGptKey.trim()}`,
                },
                body: singleFormData,
              });
            }
          }

          // Fallback B: If size 1024x1792 was rejected because endpoint only accepts square sizes
          if (!editRes.ok) {
            const errClone = await editRes.clone().json().catch(() => ({}));
            const errMsg = errClone?.error?.message || "";
            if (errMsg.toLowerCase().includes("size") && gptSize !== "1024x1024") {
              console.warn("Edit endpoint rejected non-square size, retrying with 1024x1024...");
              formData.set("size", "1024x1024");
              editRes = await fetch(editUrl, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${effectiveGptKey.trim()}`,
                },
                body: formData,
              });
            }
          }

          // Fallback C: Inpainting fallback if proxy requires transparent mask
          if (!editRes.ok) {
            const errClone = await editRes.clone().json().catch(() => ({}));
            const errMsg = errClone?.error?.message || "";
            if (errMsg.toLowerCase().includes("mask") || errMsg.toLowerCase().includes("transparent")) {
              console.warn("Proxy requires mask, generating transparent mask with sharp...");
              try {
                const maskBuffer = await sharp({
                  create: {
                    width: 1024,
                    height: 1024,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                  },
                }).png().toBuffer();

                const retryFormData = new FormData();
                retryFormData.append("image", new Blob([new Uint8Array(mainImageBuffer)], { type: "image/png" }), "image_1_base.png");
                for (const p of productBlobs) {
                  retryFormData.append("image", p.blob, p.filename);
                }
                retryFormData.append("mask", new Blob([new Uint8Array(maskBuffer)], { type: "image/png" }), "mask.png");
                retryFormData.append("prompt", promptInstructions);
                if (gptModel) retryFormData.append("model", gptModel);
                retryFormData.append("size", gptSize);
                retryFormData.append("response_format", "b64_json");

                console.log("\n=======================================================");
                console.log("🔄 [BODY YÊU CẦU RETRY KÈM MASK TRONG SUỐT CHO PROXY]");
                console.log("Endpoint:", editUrl);
                console.log("-------------------------------------------------------");
                console.log("=======================================================\n");

                editRes = await fetch(editUrl, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${effectiveGptKey.trim()}`,
                  },
                  body: retryFormData,
                });
              } catch (maskErr) {
                console.warn("Could not generate mask buffer:", maskErr);
              }
            }
          }

          if (editRes.ok) {
            const editData = await editRes.json();
            if (editData.data && editData.data[0]) {
              if (editData.data[0].b64_json) {
                generatedImageUrl = `data:image/png;base64,${editData.data[0].b64_json}`;
              } else if (editData.data[0].url) {
                generatedImageUrl = editData.data[0].url;
              }
            }
          } else {
            const errObj = await editRes.json().catch(() => ({}));
            lastGptError = errObj?.error?.message || `HTTP ${editRes.status}`;
            console.warn(`Edit endpoint ${editUrl} returned error:`, lastGptError);
          }
        } catch (e: any) {
          lastGptError = e?.message || String(e);
          console.warn("Exception during image edit call:", lastGptError);
        }

        // Secondary fallback to /v1/images/generations if edits failed
        if (!generatedImageUrl) {
          const candidateModel = gptModel || "gpt-image-2";
          const fallbackPayload = {
            model: candidateModel,
            prompt: promptInstructions,
            size: gptSize,
            quality: candidateModel === "dall-e-3" ? gptQuality || "standard" : undefined,
            response_format: "b64_json",
          };

          try {
            console.log("\n=======================================================");
            console.log("⚠️ [BODY YÊU CẦU DỰ PHÒNG: /v1/images/generations (JSON)]");
            console.log("Endpoint:", `${targetBaseUrl}/images/generations`);
            console.log("JSON Body:", JSON.stringify(fallbackPayload, null, 2));
            console.log("=======================================================\n");

            const genRes = await fetch(`${targetBaseUrl}/images/generations`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${effectiveGptKey.trim()}`,
              },
              body: JSON.stringify(fallbackPayload),
            });

            if (genRes.ok) {
              const genData = await genRes.json();
              if (genData.data && genData.data[0]) {
                if (genData.data[0].b64_json) {
                  generatedImageUrl = `data:image/png;base64,${genData.data[0].b64_json}`;
                } else if (genData.data[0].url) {
                  generatedImageUrl = genData.data[0].url;
                }
              }
            } else {
              const genErrObj = await genRes.json().catch(() => ({}));
              lastGptError = genErrObj?.error?.message || lastGptError;
            }
          } catch (genErr: any) {
            console.warn("Generations fallback error:", genErr);
          }
        }

        if (!generatedImageUrl) {
          return res.status(400).json({
            error: `Lỗi từ ${editUrl}: ${lastGptError || "Không nhận được hình ảnh từ API. Vui lòng kiểm tra lại API Key hoặc hạn ngạch."}`,
            needsApiKey: lastGptError.toLowerCase().includes("token") || lastGptError.toLowerCase().includes("api key") || lastGptError.toLowerCase().includes("unauthorized"),
          });
        }

        // If returned image is a remote URL, convert it to base64 for canvas/zip without CORS
        if (generatedImageUrl.startsWith("http")) {
          try {
            const imgFetch = await fetch(generatedImageUrl);
            if (imgFetch.ok) {
              const imgBuffer = await imgFetch.arrayBuffer();
              const b64 = Buffer.from(imgBuffer).toString("base64");
              const cType = imgFetch.headers.get("content-type") || "image/png";
              generatedImageUrl = `data:${cType};base64,${b64}`;
            }
          } catch (fetchErr) {
            console.warn("Could not convert URL to data URL, using raw URL:", fetchErr);
          }
        }

        // Ensure strict 9:16 aspect ratio if requested
        generatedImageUrl = await ensureAspectRatio(generatedImageUrl, aspectRatio);

        const loggedBody = {
          provider: "gpt-image-2",
          endpoint: editUrl,
          method: "POST",
          headers: {
            Authorization: "Bearer sk-***",
            "Content-Type": "multipart/form-data",
          },
          formData: {
            model: gptModel,
            size: gptSize,
            quality: gptQuality,
            response_format: "b64_json",
            input_images: [
              {
                role: "Image 1 (Ảnh gốc - Bố cục, bối cảnh, tư thế)",
                filename: "image_1_base.png",
                size: `${Math.round((pngBuffer?.length || 0) / 1024)} KB`,
                dimensions: "1024x1024 RGBA PNG",
              },
              ...productBlobs.map((p) => ({
                role: `Image ${p.refIndex} (Ảnh sản phẩm/trang phục tham chiếu cần thay thế)`,
                filename: p.filename,
                size: `${Math.round(p.size / 1024)} KB`,
                dimensions: "1024x1024 RGBA PNG",
              })),
            ],
            total_reference_images: 1 + productBlobs.length,
            prompt: promptInstructions,
          },
          timestamp: new Date().toISOString(),
        };

        return res.json({
          success: true,
          imageUrl: generatedImageUrl,
          promptUsed: promptInstructions,
          provider: "gpt-image-2",
          modelUsed: gptModel,
          loggedBody,
        });
      }

      // --- BRANCH B: GOOGLE GEMINI (Default) ---
      // Support custom key from header or body
      const headerKey = req.headers["x-gemini-api-key"] as string | undefined;
      const effectiveKey = (apiKey && apiKey.trim()) || (headerKey && headerKey.trim()) || undefined;
      const ai = getGeminiClient(effectiveKey);

      if (!ai) {
        return res.status(400).json({
          error: "Chưa cấu hình API Key. Vui lòng nhập Khóa API tạo ảnh trong mục Cấu hình API hoặc thiết lập GEMINI_API_KEY trong Settings.",
          needsApiKey: true,
          provider: "gemini",
        });
      }

      // Run vision inspection to analyze Image 1 (base) and Image 2..N (product references)
      const visionSummary = await inspectReplacementPair({
        ai,
        baseOriginal,
        originalMimeType,
        productRefs: normalizedProductRefs,
        outfitPrompt,
        characterPrompt,
        enableCharacter,
      });

      // Build structured instructions for Gemini Image Editing with multiple references: image[ref1, ref2, ...]
      const referenceIndexMap = [
        "• ref1 (Image 1): HÌNH GỐC (GROUND-TRUTH BASE PHOTOGRAPH). Giữ nguyên toàn bộ bố cục, góc máy, ánh sáng, bối cảnh và phông nền của ảnh gốc.",
        ...normalizedProductRefs.map(
          (p) => `• ref${p.refIndex} (Image ${p.refIndex}): HÌNH ẢNH SẢN PHẨM THAM CHIẾU CẦN THAY THẾ [${p.name}].`
        ),
      ].join("\n");

      const promptInstructions = [
        "TASK: High-Precision Image-to-Image Photographic Editing and Product Inpainting.",
        "ARCHITECTURE - MULTIPLE INPUT IMAGES IN STRICT ORDER: [Image 1, Image 2, ...]",
        referenceIndexMap,
        visionSummary ? `\nAI VISION DIRECTIVE & SPECIFIC DETAILS:\n${visionSummary}` : "",
        "\nCORE MANDATE:",
        "- ref1 (Image 1) luôn là hình gốc (ground-truth canvas). Giữ nguyên bố cục, bối cảnh, ánh sáng, các chi tiết xung quanh từ ref1.",
        "- ref2, ref3, ... là các hình ảnh sản phẩm cần thay thế và đặt/mặc vào hình gốc ref1.",
        "\nCRITICAL RULES FOR SURGICAL REPLACEMENT (HIGHEST PRIORITY):",
        enableOutfit && normalizedProductRefs.length > 0
          ? `1. TARGET PRODUCT REPLACEMENT (SURGICAL INPAINTING):
   - Identify the corresponding clothing, apron, garment, or product displayed or worn in Image 1.
   - YOU MUST COMPLETELY REMOVE and ERASE this existing item from Image 1, including all of its original artwork, colors, patterns, and text (such as embroidery, names like 'SOFIA' or 'VALENTINA', floral illustrations, or graphics).
   - In its place, render the EXACT replacement product shown in Image 2 (ref2).
   - Transfer ALL visual attributes of Image 2 (ref2) onto the replaced item:
     * The exact fabric print and graphic pattern from Image 2
     * The exact color palette, illustrations, and typography from Image 2
     * The exact straps, waist ties, borders, and pocket details from Image 2
     * Natural cloth drapery, realistic folds, shadows, and lighting consistent with the scene in Image 1.
   - ZERO RESIDUAL: Do NOT leave any trace of the old item's pattern, embroidery, or text from Image 1!
   ${enableCharacter
     ? "- CRITICAL DUAL MODIFICATION: The newly modified character MUST be visibly wearing this replacement product from Image 2 (ref2)! DO NOT keep the old apron or clothing from Image 1 on her!"
     : "- STRICT RULE: Seamlessly replace or place these exact products into ref1 WITHOUT adding or altering any person or human model. If ref1 has a person, keep their exact face, identity, hair, skin, and body 100% UNCHANGED, only replacing their outfit or placing the accessory naturally. If ref1 does NOT have a person (e.g. an apron hanging on a wall hook or displayed on a rack), DO NOT add any person or character at all - simply replace the hanging/displayed item in place on the hook/wall!"}
   ${outfitPrompt ? `- User instruction notes: "${outfitPrompt}"` : ""}`
          : (enableOutfit && outfitPrompt ? `1. TARGET PRODUCT / OUTFIT REPLACEMENT: Replace garment or accessories with: "${outfitPrompt}". ${!enableCharacter ? 'DO NOT add any person or character.' : ''}` : "1. OUTFIT & PRODUCTS: Keep all original clothing, garments, and worn jewelry completely unchanged."),
        enableOutfit && normalizedProductRefs.length > 0
          ? `2. TYPOGRAPHY & GRAPHIC DETAIL MANDATE (ULTRA-SHARP VECTOR CLARITY):
   - REPLICATE ALL TEXT & NAMES WITH VECTOR-GRADE CLARITY: Every word, title, name, letter, and decorative typography on the replacement product (Image 2) must be rendered with razor-sharp pixel edges, exact spelling, clean distinct font shapes, and zero blur.
   - PERFECT FONT ALIGNMENT & CONTRAST: Preserve the distinct colorful typography, font weights, and spacing from Image 2 seamlessly integrated into the cloth texture without bleeding, smearing, or distortion.
   - STRICT PROHIBITION OF TYPOGRAPHIC ARTIFACTS: Absolutely NO blurry text, NO smudged lettering, NO distorted or melting font shapes, NO scrambled pseudo-characters, NO hallucinated duplicate names, and NO low-resolution artifacts.`
          : "",
        backgroundPrompt && backgroundPrompt.trim()
          ? `3. FOREGROUND POSITION & SUBJECT LOCK (CRITICAL):
   - STRICT POSITION LOCK: Keep the EXACT spatial position, canvas coordinates, scale, and bounding box of the person/character and product from Primary Image 1 100% UNCHANGED.
   - DO NOT move, shift, re-center, or resize the character or product.
   - The person's body pose, posture, hands, face, and worn/displayed product must remain in their exact same spot.
   - The result MUST keep the subject anchored in place while only replacing the environment behind/around them.`
          : `2. CANVAS & BACKGROUND INTEGRITY (GROUND TRUTH):
   - Retain the exact composition, room interior, background, ambient lighting, furniture, props, and any other unaffected people from Primary Image 1.
   - The result MUST be a seamless, photorealistic photograph matching Image 1.`,
        enableCharacter
          ? (characterPrompt
              ? `3. TARGET CHARACTER MODIFICATION:
   - Identify the character in Image 1 and realistically modify them into: "${characterPrompt}".
   - Keep the exact body pose, physical posture, head tilt, gestures, emotional warmth, and interaction with others from Image 1.
   - Blend facial anatomy, eyes, expression, skin pores, and hair naturally with the room's lighting.
   - The newly modified character MUST wear the replacement product from Image 2 (ref2).`
              : "3. CHARACTER: Retain natural character appearance and pose from Image 1.")
          : `3. STRICT PROHIBITION - DO NOT ADD OR ALTER ANY PERSON OR CHARACTER:
   - DO NOT generate, invent, or add any new person, model, human character, or face.
   - If Primary Image 1 contains a person, keep their face, identity, hair, skin, and body 100% UNCHANGED.
   - If Primary Image 1 contains NO person (e.g. apron hanging on a wall hook), DO NOT add any human person.
   - Only replace the garment or product into the original image.`,
        removeSubtitles
          ? "4. SUBTITLE & TEXT CLEANUP: Erase any movie subtitles, captions, timestamps, or text watermarks cleanly and inpaint the background smoothly."
          : "",
        backgroundPrompt && backgroundPrompt.trim()
          ? `5. BACKGROUND REPLACEMENT (ENVIRONMENT ONLY - KEEP SUBJECT & PRODUCT POSITION INTACT):
   - ONLY change and replace the background, scenery, and environment behind and around the subject with: "${backgroundPrompt.trim()}".
   - ZERO DISPLACEMENT: Keep the exact coordinates and spatial placement of the person, model, and product completely stationary. DO NOT re-position, re-scale, or alter the placement of the subject or product.
   - Seamlessly inpaint the requested new backdrop around the subject, casting natural contact shadows and subtle environmental light reflection onto the subject without moving them.`
          : (preserveBackground
              ? "5. BACKGROUND PRESERVATION: Keep the exact background, scene colors, and depth-of-field identical to Image 1."
              : ""),
        preservePose
          ? "6. POSE PRESERVATION: Strictly maintain the exact physical gesture and posture from Image 1."
          : "",
        enableCharacter
          ? `7. FORMAT & STYLE: Vertical 9:16 aspect ratio composition. Ultra-detailed photorealistic photography (${stylePreset}), natural lighting, 8k resolution, no artifacts, no borders, no cartoons.`
          : `7. FORMAT & STYLE: Vertical 9:16 aspect ratio composition matching the original. Ultra-detailed photorealistic photography (${stylePreset}), natural lighting, 8k resolution, no artifacts, no extra human models.`,
      ]
        .filter(Boolean)
        .join("\n");

      // Prepare parts for multimodal content with explicit positional reference labeling
      const parts: Array<{
        inlineData?: { mimeType: string; data: string };
        text?: string;
      }> = [
        {
          text: `[IMAGE 1: GROUND-TRUTH BASE PHOTOGRAPH]
The following image is Image 1. Retain the character body pose, person identity, and exact spatial coordinates of all subjects and products from this image.${backgroundPrompt && backgroundPrompt.trim() ? " ONLY replace the background environment behind them with the requested new scenery, keeping character and product positions strictly locked." : " Retain the room environment, background, and scene lighting from this image."}`,
        },
        {
          inlineData: {
            mimeType: originalMimeType,
            data: baseOriginal,
          },
        },
      ];

      // Push all product reference images (ref2, ref3, ...) into parts with explicit replacement directives
      if (enableOutfit && normalizedProductRefs.length > 0) {
        for (const prod of normalizedProductRefs) {
          parts.push({
            text: `[IMAGE ${prod.refIndex}: TARGET PRODUCT / OUTFIT REFERENCE - ${prod.name}]
CRITICAL TASK: Replace the corresponding garment/clothing/apron worn or displayed in Image 1 with the exact product in this reference image. Transfer its exact colors, patterns, logos/text, and straps. The subject MUST be wearing this item!`,
          });
          parts.push({
            inlineData: {
              mimeType: prod.mimeType,
              data: prod.data,
            },
          });
        }
      }

      parts.push({
        text: promptInstructions,
      });

      // Valid aspect ratio check (defaults to 9:16)
      const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      const chosenAspect = validAspectRatios.includes(aspectRatio)
        ? aspectRatio
        : "9:16";

      // Call Gemini Image model for editing
      const targetModel = selectedModel || "gemini-3.1-flash-image";

      console.log("\n=======================================================");
      console.log("🚀 [BODY YÊU CẦU TẠO ẢNH: GOOGLE GEMINI SDK]");
      console.log("Model đích:", targetModel);
      console.log("Cấu hình ảnh (imageConfig):", JSON.stringify({
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: chosenAspect,
          imageSize: "1K",
        },
      }, null, 2));
      console.log("Số lượng thành phần (parts count):", parts.length);
      console.log("Chi tiết các phần parts gửi đi:", parts.map((p, idx) => {
        if (p.inlineData) {
          return `Phần ${idx + 1} [Ảnh]: ${p.inlineData.mimeType} (~${Math.round(p.inlineData.data.length * 0.75 / 1024)} KB)`;
        }
        return `Phần ${idx + 1} [Prompt Văn Bản]: ${p.text?.length || 0} ký tự`;
      }));
      console.log("--- NỘI DUNG PROMPT HOÀN CHỈNH GỬI SANG GEMINI ---");
      console.log(promptInstructions);
      console.log("-------------------------------------------------");
      console.log("=======================================================\n");

      let response;
      let lastGeminiError = "";
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: {
            parts: parts as any,
          },
          config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: {
              aspectRatio: chosenAspect as any,
              imageSize: "1K",
            },
          },
        });
      } catch (firstErr: any) {
        lastGeminiError = firstErr?.message || String(firstErr);
        console.warn(
          `${targetModel} failed (${lastGeminiError}), attempting fallback to gemini-2.5-flash-image`
        );
        try {
          // Fallback model 1
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
              parts: parts as any,
            },
            config: {
              responseModalities: [Modality.IMAGE],
              imageConfig: {
                aspectRatio: chosenAspect as any,
              },
            },
          });
        } catch (secondErr: any) {
          lastGeminiError = secondErr?.message || String(secondErr);
          console.warn(
            `gemini-2.5-flash-image failed (${lastGeminiError}), attempting fallback to gemini-3.1-flash-lite-image`
          );
          try {
            // Fallback model 2
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite-image",
              contents: {
                parts: parts as any,
              },
              config: {
                responseModalities: [Modality.IMAGE],
              },
            });
          } catch (thirdErr: any) {
            lastGeminiError = thirdErr?.message || String(thirdErr);
            console.error("All Gemini image generation attempts failed:", lastGeminiError);
          }
        }
      }

      // Extract generated image
      let resultBase64: string | null = null;
      let resultMimeType = "image/png";

      if (response && response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            resultBase64 = part.inlineData.data;
            resultMimeType = part.inlineData.mimeType || "image/png";
            break;
          }
        }
      }

      if (!resultBase64) {
        // Look for text in case the model responded with explanation or rejection
        let returnedText = "";
        if (response && response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) returnedText += part.text + " ";
          }
        }
        const finalError =
          lastGeminiError ||
          returnedText.trim() ||
          "Không nhận được hình ảnh tạo từ Gemini AI. Vui lòng kiểm tra lại quyền hạn mức của API Key hoặc ảnh tải lên.";
        return res.status(400).json({
          error: finalError,
          needsApiKey: lastGeminiError.includes("API_KEY") || lastGeminiError.includes("401") || lastGeminiError.includes("403"),
        });
      }

      const formattedImageUrl = await ensureAspectRatio(
        `data:${resultMimeType};base64,${resultBase64}`,
        aspectRatio
      );

      const loggedBody = {
        provider: "gemini",
        model: targetModel,
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: chosenAspect,
            imageSize: "1K",
          },
        },
        partsSummary: {
          totalParts: parts.length,
          baseImage: `${originalMimeType} (~${Math.round(baseOriginal.length * 0.75 / 1024)} KB)`,
          productReferenceCount: normalizedProductRefs.length,
          input_images: [
            {
              role: "Image 1 (Ảnh gốc - Bố cục, bối cảnh, tư thế)",
              mimeType: originalMimeType,
              approxSize: `~${Math.round((baseOriginal.length * 0.75) / 1024)} KB`,
            },
            ...normalizedProductRefs.map((p) => ({
              role: `Image ${p.refIndex} (Ảnh sản phẩm/trang phục tham chiếu cần thay thế)`,
              name: p.name,
              mimeType: p.mimeType,
              approxSize: `~${Math.round((p.data.length * 0.75) / 1024)} KB`,
            })),
          ],
          promptCharacters: promptInstructions.length,
        },
        prompt: promptInstructions,
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        imageUrl: formattedImageUrl,
        promptUsed: promptInstructions,
        provider: "gemini",
        modelUsed: targetModel,
        loggedBody,
      });
    } catch (error: any) {
      console.error("Lỗi khi tạo ảnh qua Gemini:", error);
      res.status(500).json({
        error:
          error?.message ||
          "Đã xảy ra lỗi trong quá trình xử lý hình ảnh với Gemini AI. Vui lòng kiểm tra lại API Key.",
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server đang chạy trên http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Không thể khởi động server:", err);
});
