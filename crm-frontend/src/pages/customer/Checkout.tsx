import { validateSafeText } from '../../utils/security';
import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../contexts/CartContext';
import { formatVND, mockCustomers, getCustomerTier, type Customer, type Part } from '../../data/mockData';
import { orderApi, customerApi, partApi, addCustomerNotification, promotionApi, type Promotion } from '../../services/api';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: () => void;
  currentCustomer?: Customer | null;
  onCustomerChange?: (c: Customer | null) => void;
}

export default function Checkout({ onBack, onSuccess, currentCustomer, onCustomerChange }: CheckoutProps) {
  // Hỗ trợ chế độ Mua ngay trực tiếp (không thêm vào giỏ hàng)
  const [directBuyItem, setDirectBuyItem] = useState<{ part: Part; soLuong: number } | null>(() => {
    try {
      const cached = sessionStorage.getItem('crm_direct_checkout_item');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const isDirectBuy = !!directBuyItem;
  const directCheckoutItems = useMemo(() => {
    if (!directBuyItem) return [];
    return [{ part: directBuyItem.part, soLuong: directBuyItem.soLuong }];
  }, [directBuyItem]);

  const directCheckoutTotal = useMemo(() => {
    if (!directBuyItem) return 0;
    const price = directBuyItem.part.giaKhuyenMai ?? directBuyItem.part.giaGoc;
    return price * directBuyItem.soLuong;
  }, [directBuyItem]);

  const { items, total, clear, selectedItems, selectedTotal, selectedCount, remove } = useCart();
  const checkoutItems = isDirectBuy ? directCheckoutItems : (selectedCount > 0 ? selectedItems : items);
  const checkoutTotal = isDirectBuy ? directCheckoutTotal : (selectedCount > 0 ? selectedTotal : total);

  const handleBackToStore = () => {
    if (isDirectBuy) {
      sessionStorage.removeItem('crm_direct_checkout_item');
      setDirectBuyItem(null);
    }
    onBack();
  };
  
  // Auth state for non-logged in users
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginInput, setLoginInput] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    matKhau: '',
  });

  const [form, setForm] = useState({
    hoTen: currentCustomer?.hoTen || '',
    soDienThoai: currentCustomer?.soDienThoai || '',
    diaChi: currentCustomer?.diaChi || '',
    ghiChu: '',
  });

  useEffect(() => {
    if (currentCustomer) {
      setForm(prev => ({
        ...prev,
        hoTen: currentCustomer.hoTen,
        soDienThoai: currentCustomer.soDienThoai,
        diaChi: currentCustomer.diaChi || prev.diaChi || 'TP. Hồ Chí Minh',
      }));
    } else {
      setForm({
        hoTen: '',
        soDienThoai: '',
        diaChi: '',
        ghiChu: '',
      });
    }
  }, [currentCustomer]);

  const [pay, setPay] = useState<'cod' | 'transfer'>('cod');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ship = 30000;
  // Voucher states (Ảnh 6, 7)
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherErrMsg, setVoucherErrMsg] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<Promotion | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [selectedVoucherInModal, setSelectedVoucherInModal] = useState<Promotion | null>(null);

  // Re-validate voucher if checkoutTotal changes
  useEffect(() => {
    if (appliedVoucher) {
      const res = promotionApi.validateVoucher(appliedVoucher.maVoucher || appliedVoucher.id, checkoutTotal, currentCustomer);
      if (res.valid) {
        setVoucherDiscount(res.discountAmount);
      } else {
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        setVoucherErrMsg(res.message || 'Mã giảm giá đã bị gỡ do không đủ điều kiện.');
      }
    }
  }, [checkoutTotal, currentCustomer]);

  // Nếu voucher giảm 100% thì buộc giá về đúng 0đ (miễn phí cả hàng và phí vận chuyển)
  const is100PercentVoucher = appliedVoucher?.loaiGiamGia === 'PhanTram' && appliedVoucher?.mucGiam === 100;
  const effectiveVoucherDiscount = is100PercentVoucher ? (checkoutTotal + ship) : voucherDiscount;
  const grand = is100PercentVoucher ? 0 : Math.max(0, checkoutTotal + ship - effectiveVoucherDiscount);

  // Danh sách voucher cho modal chọn mã
  const customerVouchers = useMemo(() => {
    return promotionApi.getVouchersForCustomer(currentCustomer);
  }, [currentCustomer, showVoucherModal]);

  const voucherEvaluationList = useMemo(() => {
    return customerVouchers.map(v => {
      const res = promotionApi.validateVoucher(v.maVoucher || v.id, checkoutTotal, currentCustomer);
      return {
        voucher: v,
        isValid: res.valid,
        discountAmount: res.discountAmount,
        reason: res.message,
      };
    });
  }, [customerVouchers, checkoutTotal, currentCustomer]);

  const eligibleVouchers = useMemo(() => voucherEvaluationList.filter(x => x.isValid), [voucherEvaluationList]);
  const ineligibleVouchers = useMemo(() => voucherEvaluationList.filter(x => !x.isValid), [voucherEvaluationList]);

  const handleApplyVoucherInput = () => {
    setVoucherErrMsg(null);
    if (!voucherInput.trim()) {
      setVoucherErrMsg('Vui lòng nhập mã giảm giá!');
      return;
    }
    const res = promotionApi.validateVoucher(voucherInput.trim(), checkoutTotal, currentCustomer);
    if (res.valid && res.voucher) {
      setAppliedVoucher(res.voucher);
      setVoucherDiscount(res.discountAmount);
      setVoucherInput('');
      setVoucherErrMsg(null);
    } else {
      setVoucherErrMsg(res.message || 'Mã giảm giá không hợp lệ!');
    }
  };

  const handleConfirmModalVoucher = () => {
    if (selectedVoucherInModal) {
      const res = promotionApi.validateVoucher(selectedVoucherInModal.maVoucher || selectedVoucherInModal.id, checkoutTotal, currentCustomer);
      if (res.valid) {
        setAppliedVoucher(selectedVoucherInModal);
        setVoucherDiscount(res.discountAmount);
        setVoucherErrMsg(null);
      }
    }
    setShowVoucherModal(false);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setSelectedVoucherInModal(null);
    setVoucherErrMsg(null);
  };

  // Handle inline login
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErr(null);
    const found = mockCustomers.find(
      c => c.email.toLowerCase() === loginInput.trim().toLowerCase() || c.soDienThoai === loginInput.trim()
    );
    if (found) {
      onCustomerChange?.(found);
    } else {
      setAuthErr('Không tìm thấy tài khoản với Email/SĐT này. Vui lòng thử đăng ký mới.');
    }
  };

  // Handle inline register
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErr(null);
    if (!registerForm.hoTen.trim() || !registerForm.email.trim() || !registerForm.soDienThoai.trim()) {
      setAuthErr('Vui lòng điền đủ Họ tên, Email và Số điện thoại');
      return;
    }

    try {
      const res = await customerApi.create({
        hoTen: registerForm.hoTen.trim(),
        email: registerForm.email.trim(),
        soDienThoai: registerForm.soDienThoai.trim(),
        diaChi: registerForm.diaChi.trim() || 'TP. Hồ Chí Minh',
        tenDangNhap: registerForm.email.split('@')[0],
        matKhau: registerForm.matKhau || '123456',
      });
      if (res.customer) {
        onCustomerChange?.(res.customer);
      }
    } catch (err) {
      setAuthErr('Đăng ký không thành công, vui lòng thử lại.');
    }
  };

  const stockMap = useMemo(() => {
    const all = partApi.getAllSync();
    const map = new Map<string, number>();
    all.forEach(p => map.set(p.id, p.soLuongTon));
    return map;
  }, [checkoutItems]);

  const stockErrors = useMemo(() => {
    const errors: string[] = [];
    checkoutItems.forEach(it => {
      const available = stockMap.get(it.part.id) ?? it.part.soLuongTon;
      if (available <= 0) {
        errors.push(`"${it.part.tenSanPham}" đã HẾT HÀNG (Tồn kho: 0)`);
      } else if (it.soLuong > available) {
        errors.push(`"${it.part.tenSanPham}" chỉ còn ${available} cái trong kho (Bạn đang đặt ${it.soLuong} cái)`);
      }
    });
    return errors;
  }, [checkoutItems, stockMap]);

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCustomer) {
      alert('Vui lòng đăng nhập hoặc tạo tài khoản trước khi xác nhận đặt hàng!');
      return;
    }
    const errName = validateSafeText('Họ và tên người nhận', form.hoTen);
    if (errName) {
      alert('⚠️ ' + errName);
      return;
    }
    const errAddress = validateSafeText('Địa chỉ giao hàng', form.diaChi);
    if (errAddress) {
      alert('⚠️ ' + errAddress);
      return;
    }
    const errNote = validateSafeText('Ghi chú đơn hàng', form.ghiChu);
    if (errNote) {
      alert('⚠️ ' + errNote);
      return;
    }
    if (stockErrors.length > 0) {
      alert(`⚠️ Không thể đặt hàng:\n- ${stockErrors.join('\n- ')}\n\nVui lòng quay lại giỏ hàng điều chỉnh số lượng!`);
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await orderApi.create({
        customerId: currentCustomer.id,
        hoTenKH: form.hoTen.trim() || currentCustomer.hoTen,
        soDienThoai: form.soDienThoai.trim() || currentCustomer.soDienThoai,
        diaChiGiao: form.diaChi.trim() || currentCustomer.diaChi || 'TP.HCM',
        phuongThucThanhToan: pay === 'cod' ? 'TienMat' : 'ChuyenKhoan',
        trangThaiThanhToan: (grand === 0) ? 'DaThanhToan' : (pay === 'cod' ? 'ChuaThanhToan' : 'DaThanhToan'),
        items: checkoutItems.map(it => {
          const allParts = partApi.getAllSync();
          const foundPart = allParts.find(p => p.tenSanPham.toLowerCase().trim() === it.part.tenSanPham.toLowerCase().trim() || p.id === it.part.id);
          const rawNum = foundPart?.id ? parseInt(foundPart.id.replace(/\D/g, ''), 10) : parseInt(it.part.id.replace(/\D/g, ''), 10);
          const numId = (!isNaN(rawNum) && rawNum > 0 && rawNum < 2147483647) ? rawNum : 1;
          const unitPrice = (it.part.giaKhuyenMai && it.part.giaKhuyenMai > 0 && it.part.giaKhuyenMai < it.part.giaGoc) ? it.part.giaKhuyenMai : it.part.giaGoc;
          return {
            maPhuTung: numId,
            partId: it.part.id,
            tenSanPham: it.part.tenSanPham,
            soLuong: it.soLuong,
            donGia: unitPrice,
            hinhAnh: it.part.hinhAnh,
            thuongHieu: it.part.thuongHieu,
            danhMuc: it.part.danhMuc,
          };
        }),
        tongTien: grand,
        ghiChu: form.ghiChu,
        maVoucher: appliedVoucher?.maVoucher || appliedVoucher?.id,
        giamVoucher: voucherDiscount,
      });

      if (!res.success) {
        addCustomerNotification({
          customerId: currentCustomer.id,
          icon: '⚠️',
          title: '⚠️ Đặt hàng không thành công',
          message: res.message || 'Đặt hàng không thành công do không đủ tồn kho!',
          category: 'order',
          page: 'store',
        });
        alert(res.message || 'Đặt hàng không thành công do không đủ tồn kho!');
        setSubmitting(false);
        return;
      }

      addCustomerNotification({
        customerId: currentCustomer.id,
        icon: '📦',
        title: '📦 Đặt hàng phụ tùng thành công',
        message: `Đơn hàng #${res.order?.id || ''} (${formatVND(grand)}) đã được gửi thành công. Nhân viên đang chuẩn bị đóng gói.`,
        category: 'order',
        page: 'dashboard',
        tab: 'orders',
        targetId: res.order?.id,
      });

      window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'orders', id: res.order?.id } }));
      try {
        sessionStorage.setItem('crm_client_highlight', JSON.stringify({ type: 'order', id: res.order?.id }));
      } catch {}

      if (appliedVoucher) {
        promotionApi.recordUsage(appliedVoucher.maVoucher || appliedVoucher.id, currentCustomer?.id);
      }
      setDone(true);
      if (isDirectBuy) {
        sessionStorage.removeItem('crm_direct_checkout_item');
        setDirectBuyItem(null);
      } else {
        clear();
      }
      setTimeout(onSuccess, 3000);
    } catch (err) {
      console.error('Lỗi khi tạo đơn hàng:', err);
      alert('Có sự cố xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: 'var(--color-zinc-50)' }}>
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center rounded-full mb-6 mx-auto"
            style={{ width: 80, height: 80, background: 'var(--color-success-bg)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--color-zinc-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ĐẶT HÀNG THÀNH CÔNG!
          </div>
          <p className="text-sm mt-3 mb-2 font-medium" style={{ color: 'var(--color-zinc-700)' }}>
            Đơn hàng của bạn đã được ghi nhận ở trạng thái <strong>Chờ xác nhận</strong>.
          </p>
          <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--color-zinc-500)' }}>
            Hệ thống đã tự động giữ tồn kho khả dụng cho bạn. Bạn có thể theo dõi tiến độ hoặc <strong>Hủy đơn hàng</strong> (khi đơn chưa chuyển sang trạng thái đang giao) trong mục <strong>Đơn hàng của tôi</strong>.
          </p>
          <div className="text-xs font-mono animate-pulse" style={{ color: 'var(--color-zinc-400)' }}>Đang chuyển hướng về trang cá nhân…</div>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-4xl mb-4">🛒</div>
        <div className="font-600 mb-4">Không có sản phẩm nào được chọn để thanh toán</div>
        <button onClick={handleBackToStore} className="px-6 py-2.5 rounded-lg text-sm font-600 text-white"
          style={{ background: 'var(--color-red-700)', border: 'none', cursor: 'pointer' }}>← Quay lại cửa hàng</button>
      </div>
    );
  }

  const inputSt: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid var(--color-zinc-200)', fontSize: 14,
    fontFamily: 'var(--font-sans)', color: 'var(--color-zinc-900)',
    background: 'white', outline: 'none',
  };

  const tier = currentCustomer ? getCustomerTier(currentCustomer.tongChiTieu) : null;

  return (
    <div style={{ background: 'var(--color-zinc-50)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-0 py-5 border-b" style={{ background: 'var(--color-zinc-950)', borderColor: 'var(--color-zinc-800)' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center gap-4">
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-zinc-400)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            THANH TOÁN ĐƠN HÀNG
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1fr) min(360px, 100%)' }}>
        {/* Left: form */}
        <div className="flex flex-col gap-5">
          {/* STEP 1: CUSTOMER AUTH STATUS */}
          <div className="rounded-2xl p-6 bg-white border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
                <h3 className="font-bold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                  1. TÀI KHOẢN KHÁCH HÀNG
                </h3>
              </div>
              {currentCustomer && (
                <button
                  type="button"
                  onClick={() => onCustomerChange?.(null)}
                  className="text-xs text-zinc-500 hover:text-red-700 underline font-mono"
                >
                  Đổi tài khoản
                </button>
              )}
            </div>

            {currentCustomer ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-lg">
                    {currentCustomer.hoTen[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <span>{currentCustomer.hoTen}</span>
                      {tier && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold"
                          style={{ background: tier.badgeBg, color: tier.badgeColor, border: `1px solid ${tier.badgeBorder}` }}>
                          {tier.shortLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono mt-0.5">
                      {currentCustomer.soDienThoai} · {currentCustomer.email}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 font-mono flex items-center gap-1">
                  ✓ Đã xác thực
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>Bạn <strong>chưa đăng nhập</strong>. Vui lòng đăng nhập hoặc tạo tài khoản để đặt hàng & bảo lưu quyền lợi bảo hành điện tử.</span>
                </div>

                <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthErr(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authTab === 'login' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
                  >
                    🔑 Đã có tài khoản (Đăng nhập)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthErr(null); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${authTab === 'register' ? 'bg-white shadow text-zinc-900' : 'text-zinc-500'}`}
                  >
                    📝 Chưa có tài khoản (Đăng ký nhanh)
                  </button>
                </div>

                {authErr && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{authErr}</p>
                )}

                {authTab === 'login' ? (
                  <form onSubmit={handleInlineLogin} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Email hoặc SĐT *</label>
                        <input
                          type="text"
                          required
                          placeholder="VD: 0901234567 hoặc an@gmail.com"
                          value={loginInput}
                          onChange={e => setLoginInput(e.target.value)}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Mật khẩu *</label>
                        <input
                          type="password"
                          required
                          placeholder="Mật khẩu"
                          value={loginPass}
                          onChange={e => setLoginPass(e.target.value)}
                          style={inputSt}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-zinc-500">
                        Chọn tài khoản mẫu:
                        <button
                          type="button"
                          onClick={() => onCustomerChange?.(mockCustomers[0])}
                          className="text-red-700 font-bold ml-1.5 hover:underline"
                        >
                          Nguyễn Văn An
                        </button>
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition"
                      >
                        ĐĂNG NHẬP →
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleInlineRegister} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={registerForm.hoTen}
                          onChange={e => setRegisterForm(f => ({ ...f, hoTen: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Số điện thoại *</label>
                        <input
                          type="tel"
                          required
                          placeholder="0912345678"
                          value={registerForm.soDienThoai}
                          onChange={e => setRegisterForm(f => ({ ...f, soDienThoai: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="khach@gmail.com"
                          value={registerForm.email}
                          onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 mb-1">Mật khẩu *</label>
                        <input
                          type="password"
                          required
                          placeholder="Tạo mật khẩu"
                          value={registerForm.matKhau}
                          onChange={e => setRegisterForm(f => ({ ...f, matKhau: e.target.value }))}
                          style={inputSt}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow"
                      >
                        TẠO TÀI KHOẢN & TIẾP TỤC →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: DELIVERY INFO */}
          <form onSubmit={handleOrder} className="flex flex-col gap-5">
            <div className="rounded-2xl p-6 bg-white border border-zinc-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase' }}>
                  2. THÔNG TIN GIAO HÀNG
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Họ và tên *</label>
                  <input required value={form.hoTen} onChange={e => setForm(f => ({...f, hoTen: e.target.value}))} style={inputSt} />
                </div>
                <div>
                  <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Số điện thoại *</label>
                  <input required value={form.soDienThoai} onChange={e => setForm(f => ({...f, soDienThoai: e.target.value}))} style={inputSt} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Địa chỉ giao hàng *</label>
                  <input required value={form.diaChi} onChange={e => setForm(f => ({...f, diaChi: e.target.value}))} style={inputSt} />
                </div>
                <div className="col-span-2 p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <span>📍</span>
                    <span>Thông tin được tự động điền từ tài khoản. Bạn có thể sửa trực tiếp nếu <strong>đặt hộ người khác</strong>.</span>
                  </div>
                  {currentCustomer && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        hoTen: currentCustomer.hoTen,
                        soDienThoai: currentCustomer.soDienThoai,
                        diaChi: currentCustomer.diaChi || 'TP. Hồ Chí Minh',
                      }))}
                      className="text-[11px] text-red-700 font-bold hover:underline whitespace-nowrap self-end sm:self-auto"
                    >
                      Khôi phục thông tin tôi
                    </button>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-500 mb-1.5" style={{ color: 'var(--color-zinc-600)' }}>Ghi chú đơn hàng (tùy chọn)</label>
                  <textarea rows={2} value={form.ghiChu} onChange={e => setForm(f => ({...f, ghiChu: e.target.value}))}
                    placeholder="Ghi chú đặc biệt cho đơn hàng hoặc giờ giao..."
                    style={{ ...inputSt, resize: 'none' }} />
                </div>
              </div>
            </div>

            {/* STEP 3: PAYMENT METHOD */}
            <div className="rounded-2xl p-6 bg-white border border-zinc-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: 'var(--color-red-700)' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase' }}>
                  3. PHƯƠNG THỨC THANH TOÁN
                </div>
              </div>
              {[
                { key: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: '💵', desc: 'Trả tiền mặt cho shipper khi nhận phụ tùng' },
                { key: 'transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦', desc: 'VPBank / Vietcombank · Nội dung: DH + SĐT' },
              ].map(opt => (
                <div key={opt.key} onClick={() => setPay(opt.key as typeof pay)}
                  className="flex items-start gap-4 rounded-xl p-4 mb-3 cursor-pointer transition-all"
                  style={{
                    border: pay === opt.key ? '2px solid var(--color-red-700)' : '2px solid var(--color-zinc-200)',
                    background: pay === opt.key ? 'var(--color-red-50)' : 'var(--color-zinc-50)',
                  }}>
                  <div className="text-2xl">{opt.icon}</div>
                  <div>
                    <div className="font-600 text-sm" style={{ color: 'var(--color-zinc-900)' }}>{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-zinc-500)' }}>{opt.desc}</div>
                  </div>
                  <div className="ml-auto flex items-center justify-center rounded-full border-2 shrink-0 mt-0.5"
                    style={{ width: 20, height: 20, borderColor: pay === opt.key ? 'var(--color-red-700)' : 'var(--color-zinc-300)', background: pay === opt.key ? 'var(--color-red-700)' : 'white' }}>
                    {pay === opt.key && <div className="rounded-full bg-white" style={{ width: 6, height: 6 }} />}
                  </div>
                </div>
              ))}
            </div>

            {stockErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium space-y-1 mb-4 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-red-800">
                  <span>⚠️</span> KHÔNG THỂ ĐẶT HÀNG DO LỖI TỒN KHO:
                </div>
                {stockErrors.map((err, idx) => (
                  <div key={idx} className="pl-4 font-mono">• {err}</div>
                ))}
                <div className="text-[11px] text-zinc-500 pt-1">
                  💡 Vui lòng bấm "Quay lại giỏ hàng" để xóa bớt hoặc giảm số lượng phù hợp với kho.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!currentCustomer || submitting || stockErrors.length > 0}
              className="w-full py-4 rounded-xl font-800 text-white transition-all shadow-md"
              style={{
                background: currentCustomer && stockErrors.length === 0 ? 'var(--color-red-700)' : 'var(--color-zinc-400)',
                border: 'none',
                cursor: currentCustomer && stockErrors.length === 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {submitting
                ? 'ĐANG TẠO ĐƠN HÀNG...'
                : stockErrors.length > 0
                ? '⚠️ VƯỢT QUÁ TỒN KHO - KHÔNG THỂ ĐẶT'
                : currentCustomer
                ? 'XÁC NHẬN ĐẶT HÀNG →'
                : '🔒 VUI LÒNG ĐĂNG NHẬP ĐỂ ĐẶT HÀNG'}
            </button>
          </form>
        </div>

        {/* Right: order summary */}
        <div className="rounded-2xl p-6 h-fit sticky top-24 bg-white border border-zinc-200">
          {isDirectBuy && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span>Đang thanh toán trực tiếp: <strong>{directBuyItem.part.tenSanPham}</strong> (x{directBuyItem.soLuong})</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 font-bold shrink-0">
                Mua ngay
              </span>
            </div>
          )}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '0.04em', color: 'var(--color-zinc-900)', textTransform: 'uppercase', marginBottom: 16 }}>ĐƠN HÀNG</div>
          <div className="flex flex-col gap-3 mb-4 max-h-[350px] overflow-y-auto pr-1">
            {checkoutItems.map(item => {
              const price = item.part.giaKhuyenMai ?? item.part.giaGoc;
              const avail = stockMap.get(item.part.id) ?? item.part.soLuongTon;
              const isOut = avail <= 0;
              const isOver = item.soLuong > avail;
              return (
                <div key={item.part.id} className="flex items-center gap-3">
                  <img src={item.part.hinhAnh} alt={item.part.tenSanPham} className="rounded-lg object-cover shrink-0"
                    style={{ width: 48, height: 48, background: 'var(--color-zinc-100)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-500 truncate" style={{ color: 'var(--color-zinc-900)' }}>{item.part.tenSanPham}</div>
                    <div className="text-xs flex items-center gap-2" style={{ color: 'var(--color-zinc-500)', fontFamily: 'var(--font-mono)' }}>
                      <span>x{item.soLuong}</span>
                      {isOut ? (
                        <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">[HẾT HÀNG]</span>
                      ) : isOver ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">[Kho còn {avail}]</span>
                      ) : (
                        <span className="text-zinc-400 font-normal">(Kho: {avail})</span>
                      )}
                    </div>
                  </div>
                  <div className="font-600 text-sm shrink-0" style={{ color: 'var(--color-zinc-900)' }}>{formatVND(price * item.soLuong)}</div>
                </div>
              );
            })}
          </div>
          {/* Khuyến mãi (Chọn hoặc nhập mã) - Chuẩn Ảnh 6 */}
          <div className="border-t pt-3.5 pb-2 border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5 font-mono">
                <span>🎟️</span>
                <span>Khuyến mãi (Chọn hoặc nhập mã)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVoucherInModal(appliedVoucher);
                  setShowVoucherModal(true);
                }}
                className="text-xs font-black text-red-700 hover:text-red-800 transition cursor-pointer flex items-center gap-1"
              >
                <span>CHỌN MÃ</span>
                <span>→</span>
              </button>
            </div>

            {/* Quick Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã voucher (VD: MOTO50K)..."
                value={voucherInput}
                onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyVoucherInput())}
                className="flex-1 px-3 py-1.5 border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-red-600 placeholder:normal-case placeholder:font-normal"
              />
              <button
                type="button"
                onClick={handleApplyVoucherInput}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition cursor-pointer font-mono"
              >
                ÁP DỤNG
              </button>
            </div>
            {voucherErrMsg && (
              <div className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                <span>⚠️</span> {voucherErrMsg}
              </div>
            )}

            {/* Thẻ voucher đã áp dụng */}
            {appliedVoucher && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono font-bold text-[10px]">
                    {appliedVoucher.maVoucher || appliedVoucher.id}
                  </span>
                  <div>
                    <div className="font-bold text-emerald-950 text-[11px] line-clamp-1">{appliedVoucher.tenChuongTrinh}</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">
                      Đã giảm {formatVND(voucherDiscount)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-zinc-400 hover:text-red-600 text-xs font-bold p-1 cursor-pointer"
                  title="Bỏ áp dụng mã này"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex flex-col gap-2" style={{ borderColor: 'var(--color-zinc-200)' }}>
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-zinc-600)' }}>
              <span>Tạm tính ({checkoutItems.length} sản phẩm)</span><span>{formatVND(checkoutTotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-zinc-600)' }}>
              <span>Phí giao hàng</span><span>{formatVND(ship)}</span>
            </div>
            {(effectiveVoucherDiscount > 0 || is100PercentVoucher) && (
              <div className="flex justify-between text-sm font-bold text-emerald-600">
                <span className="flex items-center gap-1">
                  <span>🎟️</span> Giảm giá (Voucher)
                </span>
                <span className="font-mono">-{formatVND(effectiveVoucherDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-700 text-lg pt-2 border-t" style={{ borderColor: 'var(--color-zinc-200)', color: 'var(--color-zinc-900)' }}>
              <span>Tổng thanh toán</span>
              <span style={{ color: 'var(--color-red-700)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>{formatVND(grand)}</span>
            </div>
          </div>
        </div>
      </div>
    

      {/* ── MODAL CHỌN VOUCHER / MÃ GIẢM GIÁ (Ảnh 7) ── */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎟️</span>
                <h3 className="text-base font-black text-zinc-950 uppercase tracking-tight font-mono">
                  CHỌN VOUCHER / MÃ GIẢM GIÁ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Input mã giảm giá nhanh trong modal */}
            <div className="pt-4 pb-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã voucher (VD: MOTO50K)..."
                  value={voucherInput}
                  onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyVoucherInput())}
                  className="flex-1 px-3.5 py-2 border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-red-600"
                />
                <button
                  type="button"
                  onClick={handleApplyVoucherInput}
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl font-mono cursor-pointer transition shadow-xs"
                >
                  ÁP DỤNG
                </button>
              </div>
              {voucherErrMsg && (
                <div className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {voucherErrMsg}
                </div>
              )}
            </div>

            {/* Body: Danh sách Voucher */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
              {/* PHẦN 1: VOUCHER KHẢ DỤNG CHO ĐƠN HÀNG NÀY */}
              <div>
                <div className="text-[11px] font-black text-zinc-700 uppercase font-mono mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  VOUCHER KHẢ DỤNG CHO ĐƠN HÀNG NÀY ({eligibleVouchers.length})
                </div>

                {eligibleVouchers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 rounded-2xl border border-zinc-200 font-mono">
                    Không có voucher khả dụng nào cho mức giá đơn hàng hiện tại.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {eligibleVouchers.map(({ voucher: v, discountAmount }) => {
                      const isSelected = selectedVoucherInModal?.id === v.id || appliedVoucher?.id === v.id;
                      const isVip = v.doiTuongKhachHang === 'VIP' || v.maVoucher === 'VIPCUSTOMER';

                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVoucherInModal(v)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-red-600 bg-red-50/50 shadow-xs ring-2 ring-red-500/20'
                              : 'border-zinc-200 hover:border-zinc-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Radio Icon */}
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-red-600 bg-red-600' : 'border-zinc-300 bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>

                            {/* Badge mã */}
                            <div className="shrink-0 text-center min-w-[70px]">
                              <span className={`block px-2 py-1 rounded-lg text-xs font-black font-mono ${
                                isVip
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {v.loaiGiamGia === 'PhanTram' ? `-${v.mucGiam}%` : `${v.mucGiam / 1000}K`}
                              </span>
                            </div>

                            {/* Thông tin voucher */}
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-zinc-900 line-clamp-1 flex items-center gap-1">
                                {isVip && <span>👑</span>}
                                <span>{v.tenChuongTrinh}</span>
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                {v.donHangToiThieu ? `Đơn từ ${formatVND(v.donHangToiThieu)}` : 'Mọi đơn hàng'}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                HSD: {v.ngayKetThuc >= '2030-01-01' ? 'Quanh năm' : v.ngayKetThuc}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-700 font-mono block">
                              -{formatVND(discountAmount)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppliedVoucher(v);
                                setVoucherDiscount(discountAmount);
                                setVoucherErrMsg(null);
                                setShowVoucherModal(false);
                              }}
                              className="mt-1 px-3 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold cursor-pointer transition shadow-2xs font-mono"
                            >
                              ÁP DỤNG
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PHẦN 2: VOUCHER CHƯA ĐỦ ĐIỀU KIỆN */}
              {ineligibleVouchers.length > 0 && (
                <div>
                  <div className="text-[11px] font-black text-zinc-400 uppercase font-mono mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-300"></span>
                    VOUCHER CHƯA ĐỦ ĐIỀU KIỆN ({ineligibleVouchers.length})
                  </div>

                  <div className="space-y-2">
                    {ineligibleVouchers.map(({ voucher: v, reason }) => (
                      <div
                        key={v.id}
                        className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-100/90 opacity-40 grayscale-[25%] pointer-events-none cursor-not-allowed flex items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 text-center min-w-[70px]">
                            <span className="block px-2 py-1 rounded-lg text-xs font-bold font-mono bg-zinc-200 text-zinc-600 border border-zinc-300">
                              {v.loaiGiamGia === 'PhanTram' ? `-${v.mucGiam}%` : `${v.mucGiam / 1000}K`}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-zinc-600 line-clamp-1">{v.tenChuongTrinh}</div>
                            <div className="text-[11px] text-amber-700 font-mono mt-0.5">
                              {reason || `Đơn tối thiểu ${formatVND(v.donHangToiThieu || 0)}`}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0 uppercase font-bold">
                          Chưa đủ ĐK
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100 transition cursor-pointer font-mono"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmModalVoucher}
                disabled={!selectedVoucherInModal}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:bg-zinc-300 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:cursor-not-allowed font-mono"
              >
                XÁC NHẬN
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
