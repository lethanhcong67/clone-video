import { CharacterPreset, OutfitPreset, BatchImageItem, CameraMovementPreset } from '../types';

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'korean_actor',
    title: 'Nam thần K-Drama',
    subtitle: 'Chàng trai Hàn Quốc 25 tuổi, tóc tỉa layer tự nhiên, nét mặt điển trai, mắt sáng ấm áp',
    prompt: 'A charismatic 25-year-old Korean male actor, styled Korean hair with natural curtain bangs, expressive friendly eyes, flawless radiant skin, elegant model posture',
    avatarIcon: 'Sparkles',
    tag: 'Hiện đại'
  },
  {
    id: 'korean_actress',
    title: 'Nữ thần K-Drama',
    subtitle: 'Cô gái trẻ 23 tuổi xinh đẹp dịu dàng, tóc đen mượt mà uốn lọn nhẹ, mắt trong trẻo',
    prompt: 'A graceful and elegant 23-year-old East Asian woman, natural soft makeup, sleek healthy dark wavy hair, gentle radiant smile, delicate facial features',
    avatarIcon: 'Heart',
    tag: 'Dịu dàng'
  },
  {
    id: 'wuxia_hero',
    title: 'Kiếm khách Cổ trang',
    subtitle: 'Đại hiệp phong trần, khí chất trượng nghĩa, tóc búi trâm ngọc, ánh mắt cương nghị',
    prompt: 'A heroic noble ancient Chinese martial arts swordsman, long tied hair with a silver jade hairpin, sharp determined eyes, windswept heroic demeanor',
    avatarIcon: 'Shield',
    tag: 'Cổ trang'
  },
  {
    id: 'wuxia_fairy',
    title: 'Nữ hiệp Cổ trang',
    subtitle: 'Nữ hiệp thanh tao thoát tục, trâm cài ngọc bích, phong thái uyển chuyển',
    prompt: 'A graceful ancient celestial fairy swordswoman, ethereal beauty, delicate jade hair ornaments, flowing soft hair, serene divine expression',
    avatarIcon: 'Feather',
    tag: 'Cổ trang'
  },
  {
    id: 'business_leader',
    title: 'Doanh nhân Thành đạt',
    subtitle: 'Khí chất tự tin, chuyên nghiệp, phong thái lãnh đạo điềm tĩnh',
    prompt: 'A confident, sophisticated modern business executive, poised expression, neat stylish haircut, intelligent and authoritative gaze',
    avatarIcon: 'Briefcase',
    tag: 'Công sở'
  },
  {
    id: 'cyberpunk_rebel',
    title: 'Chiến binh Cyberpunk',
    subtitle: 'Nhân vật viễn tưởng tương lai, có ánh sáng neon, cấy ghép công nghệ tinh tế',
    prompt: 'A futuristic cyberpunk rebel warrior, subtle glowing cybernetic eye implant, edgy undercut hair with neon cyan tint, rugged confident attitude',
    avatarIcon: 'Zap',
    tag: 'Sci-Fi'
  },
  {
    id: 'anime_protagonist',
    title: 'Nhân vật Anime Shonen',
    subtitle: 'Phong cách hoạt hình anime Nhật Bản chi tiết, đôi mắt sống động, tóc ấn tượng',
    prompt: 'High-budget modern anime film protagonist, vibrant animated aesthetic, dynamic hair, emotive detailed eyes, Makoto Shinkai lighting style',
    avatarIcon: 'Flame',
    tag: 'Anime'
  },
  {
    id: 'vintage_90s',
    title: 'Minh tinh Thập niên 90',
    subtitle: 'Nét hoài niệm retro Hong Kong, màu phim ấm áp, khí chất kinh điển',
    prompt: 'A classic 1990s Hong Kong cinema star, charismatic retro film photography vibe, warm nostalgic natural lighting, timeless cinematic charm',
    avatarIcon: 'Camera',
    tag: 'Retro'
  }
];

export const OUTFIT_PRESETS: OutfitPreset[] = [
  {
    id: 'vietnamese_aodai',
    title: 'Áo dài lụa truyền thống',
    category: 'Truyền thống',
    prompt: 'Traditional Vietnamese silk Ao Dai with intricate embroidered lotus blossom patterns, matching flowing silk trousers, luxurious fabric with subtle sheen',
    previewUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
    description: 'Áo dài lụa tơ tằm thêu hoa sen trang nhã, tôn dáng uyển chuyển'
  },
  {
    id: 'luxury_suit',
    title: 'Vest Tuxedo Doanh nhân',
    category: 'Hiện đại',
    prompt: 'Tailored charcoal navy Italian wool slim-fit blazer suit, crisp white dress shirt, silk pocket square, polished silver cufflinks, modern peak lapel',
    previewUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80',
    description: 'Bộ vest lịch lãm phong cách quý ông Ý, ôm vừa vặn cao cấp'
  },
  {
    id: 'evening_gown',
    title: 'Váy dạ hội lấp lánh',
    category: 'Dạ tiệc',
    prompt: 'Stunning floor-length midnight emerald evening gown with delicate crystal bead embroidery, draped flowing satin fabric, off-shoulder royal neckline',
    previewUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&auto=format&fit=crop&q=80',
    description: 'Váy dạ hội lụa satin xanh ngọc bích đính pha lê quý phái'
  },
  {
    id: 'hanfu_warrior',
    title: 'Y phục Cổ trang gấm thêu',
    category: 'Cổ trang',
    prompt: 'Regal ancient Hanfu warrior robe with multiple layered flowing silk, silver dragon cloud embroidery, leather waist sash with jade ornament',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    description: 'Hán phục kiếm hiệp nhiều lớp gấm lụa cao cấp thêu chỉ bạc'
  },
  {
    id: 'cyberpunk_jacket',
    title: 'Áo khoác Techwear Neon',
    category: 'Sci-Fi',
    prompt: 'High-tech cyberpunk tactical bomber jacket with glowing neon orange piping accents, water-resistant matte black carbon texture, futuristic straps and collars',
    previewUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400&auto=format&fit=crop&q=80',
    description: 'Áo khoác công nghệ tương lai viền đèn neon dạ quang'
  },
  {
    id: 'korean_streetwear',
    title: 'Streetwear Hàn Quốc Trẻ trung',
    category: 'Thời trang phố',
    prompt: 'Trendy oversized cream knit sweater paired with wide-leg beige trousers, minimalist layered silver necklace, effortless Seoul street style aesthetic',
    previewUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80',
    description: 'Phong cách dạo phố Seoul trẻ trung thoải mái'
  }
];

export const SAMPLE_BATCH_IMAGES = [
  {
    name: 'Phim_Chieu_Rap_Co_Phu_De_01.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    subtitleText: '[Phụ đề tiếng Việt: "Định mệnh đã đưa chúng ta gặp nhau ở đây..."]'
  },
  {
    name: 'Canh_Phim_Dien_Anh_02.jpg',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    subtitleText: '[Episode 12 - 42:15 - "Chúng ta phải rời khỏi nơi này ngay lập tức!"]'
  },
  {
    name: 'Chan_Dung_Co_Text_Watermark_03.jpg',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    subtitleText: '[SUB: "Tập tiếp theo vào 20:00 thứ 6 hàng tuần @Netflix"]'
  }
];

export const CAMERA_MOVEMENT_PRESETS: CameraMovementPreset[] = [
  {
    id: 'static',
    title: 'Cố định (Static Shot)',
    subtitle: 'Máy ảnh đứng yên, người mẫu cử động tự nhiên',
    iconName: 'Lock',
    badge: 'Khuyên dùng',
    prompt: 'Static locked camera shot, no camera shake or movement, subtle natural breathing and gentle model posture adjustments, keeping the product design, logo, fabric print, patterns and apparel completely fixed, sharp and unchanged. Photorealistic 4k, cinematic soft lighting.',
    description: 'Camera cố định 100%, giữ nguyên form dáng sản phẩm và độ sắc nét tối đa'
  },
  {
    id: 'zoom_in',
    title: 'Zoom In (Dolly In)',
    subtitle: 'Phóng to từ từ vào cận cảnh khuôn mặt & chi tiết đồ',
    iconName: 'ZoomIn',
    badge: 'Cận cảnh',
    prompt: 'Smooth slow cinematic zoom-in dolly camera moving towards the model, focusing on facial expressions and fine garment textures, flawless details, 4k resolution, studio lighting.',
    description: 'Lướt camera tiến gần, nhấn mạnh biểu cảm và chất liệu vải'
  },
  {
    id: 'zoom_out',
    title: 'Zoom Out (Dolly Out)',
    subtitle: 'Lùi dần từ cận cảnh ra toàn cảnh trang phục & bối cảnh',
    iconName: 'ZoomOut',
    badge: 'Toàn cảnh',
    prompt: 'Smooth slow cinematic zoom-out dolly shot pulling back gracefully to reveal the full stylish outfit and scenic ambient environment, high fashion editorial aesthetic.',
    description: 'Lùi camera từ từ để tôn vinh toàn bộ set đồ và bối cảnh'
  },
  {
    id: 'tilt_up',
    title: 'Tilt Up (Từ dưới lên)',
    subtitle: 'Lia máy dọc từ gấu váy/giày lên khuôn mặt',
    iconName: 'ArrowUp',
    badge: 'Lookbook',
    prompt: 'Cinematic vertical tilt-up camera movement starting from the footwear and lower outfit up to the model face, fashion runway lookbook style, ultra smooth motion.',
    description: 'Góc máy thời trang kinh điển, quét dọc trọn bộ trang phục'
  },
  {
    id: 'tilt_down',
    title: 'Tilt Down (Từ trên xuống)',
    subtitle: 'Lia máy dọc từ trên đỉnh đầu xuống dưới chân',
    iconName: 'ArrowDown',
    badge: 'Dáng đứng',
    prompt: 'Cinematic vertical tilt-down camera movement starting from the head and upper apparel gracefully down to the lower hem, studio high fashion look.',
    description: 'Quét từ gương mặt xuống các chi tiết quần/váy'
  },
  {
    id: 'pan_right',
    title: 'Pan Phải (Lướt sang phải)',
    subtitle: 'Camera lướt ngang mượt mà sang phải',
    iconName: 'ArrowRight',
    badge: 'Lướt ngang',
    prompt: 'Smooth horizontal camera pan moving slowly from left to right, capturing side profile of the model and subtle fabric dynamics, cinematic depth of field.',
    description: 'Lia ngang sang phải tạo cảm giác không gian rộng mở'
  },
  {
    id: 'pan_left',
    title: 'Pan Trái (Lướt sang trái)',
    subtitle: 'Camera lướt ngang mượt mà sang trái',
    iconName: 'ArrowLeft',
    badge: 'Lướt ngang',
    prompt: 'Smooth horizontal camera pan moving slowly from right to left, revealing the model and ambient environment with cinematic elegance.',
    description: 'Lia ngang sang trái mượt mà'
  },
  {
    id: 'orbit',
    title: 'Orbit (Xoay 360 vòng quanh)',
    subtitle: 'Quay vòng cung quanh người mẫu',
    iconName: 'RotateCw',
    badge: '360 Độ',
    prompt: 'Cinematic smooth orbiting arc camera shot rotating gracefully around the model, showcasing 3D depth, outfit structure and lighting from multiple angles.',
    description: 'Góc máy điện ảnh xoay vòng cung tôn chiều sâu 3D'
  },
  {
    id: 'runway',
    title: 'Runway (Sàn diễn)',
    subtitle: 'Chuyển động tracking bước đi thời trang',
    iconName: 'Sparkles',
    badge: 'Fashion',
    prompt: 'Dynamic fashion runway tracking camera following the model with subtle confident strides, professional studio fashion show lighting, 4k ultra-crisp.',
    description: 'Nhịp điệu tự tin, bắt mắt như sàn diễn thời trang quốc tế'
  },
  {
    id: 'handheld',
    title: 'Handheld (Vlog / Cầm tay)',
    subtitle: 'Rung nhẹ tự nhiên kiểu quay điện thoại/vlog',
    iconName: 'Video',
    badge: 'Tự nhiên',
    prompt: 'Natural subtle handheld camera motion with gentle organic breathing movement, authentic lifestyle vlog aesthetic, ultra-realistic textures.',
    description: 'Hiệu ứng cầm tay chân thực, gần gũi cho video TikTok/Reels'
  }
];
