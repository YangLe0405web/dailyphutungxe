# Frontend UI/UX — Ghi chú kỹ thuật quan trọng

## ⚠️ Lỗi CSS Cascade với Tailwind v4 — BẮT BUỘC ĐỌC TRƯỚC KHI CHỈNH GIAO DIỆN

### Vấn đề

Dự án dùng **Tailwind CSS v4** kết hợp với `@layer` (CSS Cascade Layers).

Trong Tailwind v4, các utility class như `mx-auto`, `mb-*`, `mt-*`, `px-*` được đặt trong `@layer utilities`.
Trong CSS cascade, **unlayered styles luôn thắng layered styles** (dù specificity bằng nhau).

**Nếu viết CSS reset NGOÀI `@layer`:**
```css
/* ❌ SAI — sẽ override toàn bộ Tailwind utilities! */
*, *::before, *::after { margin: 0; padding: 0; }
```

`margin: 0` này sẽ override `mx-auto`, `mb-6`, `mt-2`... → layout bị vỡ, content không center được.

### Fix

**Luôn đặt CSS reset và base styles vào `@layer base`:**
```css
/* ✅ ĐÚNG */
@layer base {
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-family: var(--font-sans); ... }
  button { font-family: inherit; transition: all 0.15s ease; }
}
```

File đã được fix tại: `src/index.css`

---

## Quy tắc layout — Centering Content

### Pattern chuẩn cho tất cả pages

```tsx
{/* Full-width background section */}
<div className="py-10" style={{ background: '...' }}>
  {/* Content bên trong phải có max-w + mx-auto + px */}
  <div className="max-w-7xl mx-auto px-6 sm:px-8">
    {/* nội dung */}
  </div>
</div>

{/* Main content area */}
<div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
  {/* nội dung */}
</div>
```

> **Quan trọng:** Padding `px-6 sm:px-8` phải nằm trên **inner div** (cùng với `max-w-* mx-auto`), KHÔNG phải trên outer div có background.

### Max-width đang dùng theo trang

| Trang | Max-width | Ghi chú |
|---|---|---|
| `PartsStore` | `max-w-7xl` (1280px) | Grid sản phẩm cần rộng |
| `ServiceBooking` | `max-w-4xl` (896px) | Form 3 bước |
| `CustomerDashboard` | `max-w-6xl` (1152px) | Dashboard + tabs |
| `Checkout` | `max-w-6xl` (1152px) | 2-column grid |
| `AdminLayout` | Sidebar 248px + flex-1 | Sidebar tự thu gọn |
| `CustomerLayout` navbar | `max-w-7xl` (1280px) | Navbar header |

---

## Stack công nghệ Frontend

| Thứ | Phiên bản | Ghi chú |
|---|---|---|
| React | 19 | Dùng `createRoot` |
| Vite | 8 | Config tại `vite.config.ts` |
| Tailwind CSS | v4 | `@import 'tailwindcss'` + `@theme {}` |
| TypeScript | 5.7 | Strict mode |
| Recharts | 3.x | Charts ở Admin Dashboard |

---

## Cấu trúc thư mục

```
crm-frontend/src/
├── App.tsx              ← Routing chính (useState-based, không dùng react-router)
├── index.css            ← Global styles + Tailwind v4 theme
├── contexts/
│   └── CartContext.tsx  ← Giỏ hàng (React Context)
├── data/
│   └── mockData.ts      ← Toàn bộ mock data + TypeScript types
├── components/shared/
│   └── StatusTag.tsx    ← StatusTag, WarrantyTag, RatingStars
├── layouts/
│   ├── AdminLayout.tsx  ← Sidebar có thể collapse
│   └── CustomerLayout.tsx ← Navbar + Cart drawer
└── pages/
    ├── admin/           ← Dashboard, Sales, Customers, Feedback
    └── customer/        ← PartsStore, ServiceBooking, CustomerDashboard, Checkout
```

---

## Theme màu sắc (CSS Variables)

```css
/* Dùng trong style={{ color: 'var(--color-red-700)' }} */

/* Reds - màu chủ đạo */
--color-red-700: #b91c1c
--color-red-500: #ef4444
--color-red-400: #f87171
--color-red-100: #fee2e2

/* Zinc - neutral/dark */
--color-zinc-950: #09090b   /* Background tối nhất */
--color-zinc-900: #18181b
--color-zinc-800: #27272a
--color-zinc-50:  #fafafa   /* Background sáng */

/* Semantic */
--color-success: #16a34a
--color-warning: #d97706
--color-info:    #2563eb
```

## Fonts

```css
--font-display: 'Barlow Condensed'  /* Tiêu đề lớn, uppercase */
--font-sans:    'Inter'             /* Body text */
--font-mono:    'JetBrains Mono'    /* Mã, số liệu, badge */
```
