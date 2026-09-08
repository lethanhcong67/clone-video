import React from 'react';
import { X, UploadCloud, Shirt, User, Subtitles, Sparkles } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="guide-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="guide-modal-content"
        className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              Hướng dẫn Thay thế Nhân vật, Trang phục & Xóa phụ đề
            </h3>
            <p className="text-xs text-stone-500">
              Quy trình 4 bước đơn giản để tạo ra bộ ảnh mới chất lượng cao
            </p>
          </div>
        </div>

        <div className="space-y-4 my-4 text-xs sm:text-sm text-stone-700">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <h4 className="font-bold text-stone-900 mb-0.5 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                Tải lên hàng loạt ảnh cần sửa
              </h4>
              <p className="text-xs text-stone-600">
                Kéo thả nhiều ảnh cùng lúc từ thiết bị của bạn. Ứng dụng sẽ xếp hàng các ảnh vào danh sách đợi để xử lý tuần tự.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <h4 className="font-bold text-stone-900 mb-0.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-violet-600" />
                Nhập nhân vật muốn thay thế
              </h4>
              <p className="text-xs text-stone-600">
                Mô tả chi tiết nhân vật (tuổi tác, giới tính, nét mặt, kiểu tóc, phong cách). Bạn cũng có thể bật tùy chọn "Giữ nguyên dáng điệu gốc" để nhân vật mới có tư thế đồng bộ với ảnh ban đầu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <h4 className="font-bold text-stone-900 mb-0.5 flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-emerald-600" />
                Tải lên hoặc mô tả trang phục cần đổi
              </h4>
              <p className="text-xs text-stone-600">
                Tải ảnh mẫu trang phục tham khảo thực tế hoặc nhập mô tả chi tiết bằng văn bản (màu sắc, chất liệu vải, kiểu dáng). AI sẽ phân tích và khoác trang phục mới vừa vặn lên nhân vật.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs">
              4
            </div>
            <div>
              <h4 className="font-bold text-stone-900 mb-0.5 flex items-center gap-1.5">
                <Subtitles className="w-4 h-4 text-amber-600" />
                Xóa phụ đề & Xuất file ZIP
              </h4>
              <p className="text-xs text-stone-600">
                Bật tùy chọn "Xóa sạch phụ đề & chữ trong hình ảnh cũ". AI sẽ tự động inpaint phục hồi màu nền bên dưới dòng chữ phụ đề. Sau khi xong, bạn có thể kéo thanh so sánh Trước/Sau và tải toàn bộ ảnh dạng file .ZIP.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
          >
            Đã hiểu, bắt đầu sử dụng
          </button>
        </div>
      </div>
    </div>
  );
};
