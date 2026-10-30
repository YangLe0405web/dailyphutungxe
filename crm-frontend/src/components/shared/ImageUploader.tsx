import React, { useRef } from 'react';

interface ImageUploaderProps {
  value?: string;
  onChange: (urlOrBase64: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
}

export default function ImageUploader({
  value = '',
  onChange,
  label = 'Hình ảnh sản phẩm / phương tiện',
  error,
  placeholder = 'Chọn file ảnh từ máy tính hoặc dán URL...',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('Dung lượng file ảnh quá lớn! Vui lòng chọn file dưới 20MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const rawResult = readEvent.target?.result as string;
        if (!rawResult) return;

        // Tự động nén ảnh qua Canvas (tối đa 900px, chất lượng 0.75) để ảnh chỉ khoảng 30KB - 50KB,
        // vừa hiển thị sắc nét vừa tuyệt đối không làm tràn hạn ngạch LocalStorage (QuotaExceededError)
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDimension = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              onChange(compressedBase64);
              return;
            }
          } catch (canvasErr) {
            console.warn('[ImageUploader] Canvas compress fallback:', canvasErr);
          }
          onChange(rawResult);
        };
        img.onerror = () => {
          onChange(rawResult);
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex items-start gap-3">
        {/* Preview box */}
        <div className="relative group w-20 h-20 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden flex items-center justify-center">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs"
                title="Xóa ảnh"
              >
                ✕ Xóa
              </button>
            </>
          ) : (
            <div className="text-center p-2">
              <span className="text-2xl block mb-1">🖼️</span>
              <span className="text-[10px] text-zinc-400 font-mono">Chưa chọn</span>
            </div>
          )}
        </div>

        {/* Input file & URL */}
        <div className="flex-1 space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <span>📁 Tải ảnh từ máy tính</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition"
              >
                Gỡ ảnh
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              readOnly={value.startsWith('data:')}
              value={value.startsWith('data:') ? '✓ Đã tải ảnh từ máy tính' : value}
              onChange={e => {
                if (!value.startsWith('data:')) {
                  onChange(e.target.value);
                }
              }}
              placeholder={placeholder}
              className={`w-full p-2 text-xs rounded-xl border border-zinc-300 ${value.startsWith('data:') ? 'bg-zinc-100 text-emerald-700 font-semibold cursor-default' : 'bg-white text-zinc-800'} focus:outline-none focus:border-red-600 font-mono`}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
