import { useState, useEffect, useMemo } from 'react';
import { formatVND, mockProductReviews, ProductReview, mockVehicles, countWords, getCustomerTier, computeSurveyStatus } from '../../data/mockData';
import { catalogVehicleApi, feedbackApi, surveyApi } from '../../services/api';

export interface ShowroomVehicle {
  id: string;
  tenXe: string;
  hang: 'Honda' | 'Yamaha' | 'Suzuki' | 'Piaggio & Vespa';
  phanKhuc: 'Tay ga' | 'Côn tay' | 'Xe số' | 'Scrambler' | 'Hyper-underbone';
  giaNiemYet: number;
  mauSac: string;
  moTa: string;
  hinhAnh: string;
  coTheLaiThu: boolean;
  dongCo: string;
  congSuat: string;
  tieuHaoNhienLieu?: string;
  phanh?: string;
  xuatXu?: string;
}

export const showroomVehicles: ShowroomVehicle[] = [
  // ── HONDA ──
  {
    id: 'XM-HD01',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc',
    moTa: 'Mẫu xe tay ga cao cấp đầu bảng của Honda với phanh ABS 2 kênh, hệ thống kiểm soát lực kéo HSTC, chìa khóa thông minh Smartkey và kết nối Bluetooth My Honda+.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '16.6 HP / 8.500 rpm',
    tieuHaoNhienLieu: '2.24 L/100km',
    phanh: 'Đĩa trước & sau, ABS 2 kênh',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD02',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 56690000,
    mauSac: 'Đỏ đen, Xanh xám, Đen vàng đồng',
    moTa: 'Dòng xe tay ga thể thao bán chạy nhất Việt Nam, khung xe eSAF thế hệ mới, cốp xe 23.2L tích hợp cổng sạc USB và phanh ABS bánh trước.',
    coTheLaiThu: true,
    dongCo: '156.9cc eSP+ 4 van',
    congSuat: '15.0 HP / 8.000 rpm',
    tieuHaoNhienLieu: '2.30 L/100km',
    phanh: 'Đĩa trước có ABS, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD03',
    tenXe: 'Honda Vision 110 Thể Thao',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 36612000,
    mauSac: 'Đen bóng, Xám xi măng, Xanh dương',
    moTa: '"Xe tay ga quốc dân" kiểu dáng trẻ trung năng động, vành đúc 16 inch cao ráo, khóa thông minh Smartkey và động cơ eSP siêu tiết kiệm xăng.',
    coTheLaiThu: false,
    dongCo: '109.5cc eSP 4 thì',
    congSuat: '8.8 HP / 7.500 rpm',
    tieuHaoNhienLieu: '1.85 L/100km',
    phanh: 'Đĩa trước CBS, tang trống sau',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD04',
    tenXe: 'Honda Winner X 150 ABS',
    hang: 'Honda',
    phanKhuc: 'Côn tay',
    giaNiemYet: 50560000,
    mauSac: 'Đỏ đen xanh thể thao, Đen nhám bạc',
    moTa: 'Côn tay thể thao thế hệ mới trang bị bộ ly hợp chống trượt hai chiều (Assist & Slipper Clutch), xích phốt O-ring và phanh ABS bánh trước an toàn tuyệt đối.',
    coTheLaiThu: true,
    dongCo: '149.1cc DOHC 6 số',
    congSuat: '15.4 HP / 9.000 rpm',
    tieuHaoNhienLieu: '1.98 L/100km',
    phanh: 'Đĩa trước có ABS, đĩa sau',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-HD05',
    tenXe: 'Honda Wave Alpha 110 Cổ Điển',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 19290000,
    mauSac: 'Xám cổ điển, Vàng trắng, Đỏ đen',
    moTa: 'Mẫu xe số quốc dân bền bỉ qua năm tháng, chi phí vận hành siêu tiết kiệm và phụ tùng dễ thay thế ở mọi cung đường.',
    coTheLaiThu: false,
    dongCo: '109.1cc 4 thì làm mát gió',
    congSuat: '8.2 HP / 7.500 rpm',
    tieuHaoNhienLieu: '1.72 L/100km',
    phanh: 'Tang trống trước & sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
  },

  // ── YAMAHA ──
  {
    id: 'XM-YM01',
    tenXe: 'Yamaha Exciter 155 VVA ABS',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 55000000,
    mauSac: 'Xanh GP Monster, Đen nhám, Đỏ bạc',
    moTa: '"Ông vua đường phố" trang bị công nghệ van biến thiên VVA, 4 bản đồ đánh lửa tùy chỉnh theo từng cấp số, phanh đĩa trước 2 piston kèm ABS.',
    coTheLaiThu: true,
    dongCo: '155cc VVA SOHC 4 van',
    congSuat: '17.7 HP / 9.500 rpm',
    tieuHaoNhienLieu: '2.09 L/100km',
    phanh: 'Đĩa trước ABS 2 piston, đĩa sau',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-YM02',
    tenXe: 'Yamaha Grande Hybrid Tiêu Chuẩn',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 46047000,
    mauSac: 'Hồng pastel, Trắng ngọc trai, Đỏ mận',
    moTa: 'Xe tay ga tiết kiệm nhiên liệu số 1 Việt Nam với công nghệ trợ lực điện Blue Core Hybrid, cốp xe 27L siêu lớn có đèn LED chiếu sáng bên trong.',
    coTheLaiThu: true,
    dongCo: '125cc Blue Core Hybrid',
    congSuat: '8.3 HP / 6.500 rpm',
    tieuHaoNhienLieu: '1.66 L/100km',
    phanh: 'Đĩa trước thủy lực, tang trống sau',
    hinhAnh: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-YM03',
    tenXe: 'Yamaha NVX 155 VVA Maxi-Scooter',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 55500000,
    mauSac: 'Đen vàng, Xám ánh xanh, Đỏ đen',
    moTa: 'Tay ga thể thao phong cách Maxi-scooter hầm hố, lốp sau bản rộng 140mm bám đường, giảm xóc dầu bình phụ thể thao và kết nối điện thoại Y-Connect.',
    coTheLaiThu: true,
    dongCo: '155cc Blue Core VVA',
    congSuat: '15.4 HP / 8.000 rpm',
    tieuHaoNhienLieu: '2.17 L/100km',
    phanh: 'Đĩa trước có ABS, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-YM04',
    tenXe: 'Yamaha PG-1 115cc Scrambler',
    hang: 'Yamaha',
    phanKhuc: 'Scrambler',
    giaNiemYet: 30437000,
    mauSac: 'Vàng sa mạc, Cam rực rỡ, Xanh rêu bụi',
    moTa: 'Mẫu xe số địa hình phong cách Scrambler ghi đông trần cá tính, lốp gai to đa dụng vượt mọi địa hình phượt dã ngoại của giới trẻ.',
    coTheLaiThu: true,
    dongCo: '113.7cc 4 thì SOHC',
    congSuat: '8.8 HP / 7.000 rpm',
    tieuHaoNhienLieu: '1.96 L/100km',
    phanh: 'Đĩa trước thủy lực, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop&q=80',
  },

  // ── SUZUKI ──
  {
    id: 'XM-SZ01',
    tenXe: 'Suzuki Raider R150 Fi (DOHC)',
    hang: 'Suzuki',
    phanKhuc: 'Hyper-underbone',
    giaNiemYet: 51190000,
    mauSac: 'Đỏ đen, Xanh mờ MotoGP, Đen cam',
    moTa: '"Vua tốc độ" phân khúc 150cc với động cơ DOHC 4 van Twin-Cam công suất cực đại 18.5 HP mạnh nhất phân khúc, kiểu dáng Hyper-underbone thuần chất đường đua.',
    coTheLaiThu: true,
    dongCo: '147.3cc DOHC 4 van làm mát nước',
    congSuat: '18.5 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.40 L/100km',
    phanh: 'Đĩa trước & sau hình cánh hoa',
    hinhAnh: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-SZ02',
    tenXe: 'Suzuki Satria F150 Fi Nhập Khẩu',
    hang: 'Suzuki',
    phanKhuc: 'Hyper-underbone',
    giaNiemYet: 53490000,
    mauSac: 'Trắng đỏ thể thao, Xanh đen, Đen mờ',
    moTa: 'Nhập khẩu nguyên chiếc từ Suzuki Indonesia, trang bị hệ thống khởi động nhanh 1 chạm Suzuki Easy Start System và cụm đồng hồ LCD kỹ thuật số toàn phần.',
    coTheLaiThu: true,
    dongCo: '147.3cc DOHC Fi nguyên bản',
    congSuat: '18.5 HP / 10.000 rpm',
    tieuHaoNhienLieu: '2.42 L/100km',
    phanh: 'Đĩa trước & đĩa sau',
    hinhAnh: 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-SZ03',
    tenXe: 'Suzuki Burgman Street 125',
    hang: 'Suzuki',
    phanKhuc: 'Tay ga',
    giaNiemYet: 48600000,
    mauSac: 'Xám mờ thời thượng, Vàng đồng, Đen tuyền',
    moTa: 'Mẫu xe tay ga đường trường phong cách Maxi sang trọng đẳng cấp châu Âu, sàn để chân kép linh hoạt thay đổi tư thế ngồi lái thoải mái suốt hành trình.',
    coTheLaiThu: false,
    dongCo: '124.3cc SEP tiết kiệm nhiên liệu',
    congSuat: '8.7 HP / 6.750 rpm',
    tieuHaoNhienLieu: '1.96 L/100km',
    phanh: 'Đĩa trước kết hợp phanh CBS',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
  },

  // ── PIAGGIO & VESPA ──
  {
    id: 'XM-PI01',
    tenXe: 'Vespa Sprint S 150 i-Get ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 97800000,
    mauSac: 'Xám Titan, Vàng nhám, Trắng tuyết',
    moTa: 'Biểu tượng phong cách thời trang Ý huyền thoại với đèn pha LED lục giác góc cạnh, thân xe bằng thép liền khối dập nổi tinh xảo và phanh ABS chống trượt.',
    coTheLaiThu: true,
    dongCo: '155cc i-Get 3 van phun xăng điện tử',
    congSuat: '12.7 HP / 7.750 rpm',
    tieuHaoNhienLieu: '2.60 L/100km',
    phanh: 'Đĩa trước có phanh ABS, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XM-PI02',
    tenXe: 'Piaggio Liberty 125 S ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga',
    giaNiemYet: 57700000,
    mauSac: 'Đỏ bóng thể thao, Trắng bóng, Xám xi măng',
    moTa: 'Tay ga bánh lớn 16 inch an toàn vượt trội trên đường đô thị, động cơ i-Get êm ái cùng hệ thống khóa từ chống trộm Piaggio Immobilizer bảo mật tuyệt đối.',
    coTheLaiThu: true,
    dongCo: '124.5cc i-Get 3 van',
    congSuat: '10.2 HP / 7.500 rpm',
    tieuHaoNhienLieu: '2.38 L/100km',
    phanh: 'Đĩa trước ABS 240mm, đùm sau',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
  },
];

import type { Customer } from '../../data/mockData';
import { matchVietnameseSearch } from '../../utils/vietnameseSearch';

interface Props {
  onBookTestDrive: (vehicleId: string) => void;
  currentCustomer?: Customer | null;
  onRequireLogin?: () => void;
  onNavigateToSurvey?: () => void;
}

const brandMeta: Record<string, { label: string; color: string; bg: string; badge: string }> = {
  Honda: { label: 'Honda', color: '#dc2626', bg: '#fef2f2', badge: '🔴 Honda' },
  Yamaha: { label: 'Yamaha', color: '#2563eb', bg: '#eff6ff', badge: '🔵 Yamaha' },
  Suzuki: { label: 'Suzuki', color: '#d97706', bg: '#fffbeb', badge: '🟡 Suzuki' },
  'Piaggio & Vespa': { label: 'Piaggio & Vespa', color: '#059669', bg: '#ecfdf5', badge: '🟢 Vespa Ý' },
};

export default function VehiclesShowroom({ onBookTestDrive, currentCustomer, onRequireLogin, onNavigateToSurvey }: Props) {
  // TC15: Đếm khảo sát đang chờ làm của khách hàng đăng nhập
  const pendingSurveysCount = useMemo(() => {
    if (!currentCustomer) return 0;
    const custTier = getCustomerTier(currentCustomer.tongChiTieu).tier;
    return surveyApi.getAll().filter(s => {
      const liveStatus = computeSurveyStatus(s);
      if (liveStatus !== 'DangDienRa') return false;
      const isEligible =
        s.targetCustomerId === currentCustomer.id ||
        (s.targetCustomerIds && s.targetCustomerIds.includes(currentCustomer.id)) ||
        ((s.targetCustomerId === 'ALL' || !s.targetCustomerId) && (!s.targetCustomerTier || s.targetCustomerTier === 'ALL' || s.targetCustomerTier === custTier));
      if (!isEligible) return false;
      const done = surveyApi.getResponses().some(r => r.surveyId === s.id && r.customerId === currentCustomer.id);
      return !done;
    }).length;
  }, [currentCustomer]);
  const [vehicles, setVehicles] = useState<ShowroomVehicle[]>(showroomVehicles);
  const [search, setSearch] = useState('');
  const [selectedHang, setSelectedHang] = useState<string>('ALL');
  const [selectedPhanKhuc, setSelectedPhanKhuc] = useState<string>('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc'>('default');
  const [onlyTestDrive, setOnlyTestDrive] = useState<boolean>(false);
  const [detailVehicle, setDetailVehicle] = useState<ShowroomVehicle | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'specs' | 'reviews'>('specs');

  useEffect(() => {
    const loadVehicles = () => {
      catalogVehicleApi.getAll().then(data => {
        if (data && data.length > 0) {
          const merged: ShowroomVehicle[] = data.map(d => {
            const found = showroomVehicles.find(
              sv => sv.id === d.id || sv.tenXe.toLowerCase().trim() === d.tenXe.toLowerCase().trim()
            );
            return {
              id: d.id,
              tenXe: d.tenXe,
              hang: (d.hang as any) || 'Honda',
              phanKhuc: (d.phanKhuc as any) || 'Tay ga',
              giaNiemYet: d.giaNiemYet,
              mauSac: d.mauSac,
              moTa: d.moTa,
              hinhAnh: d.hinhAnh,
              coTheLaiThu: d.coTheLaiThu,
              dongCo: d.dongCo || found?.dongCo || '150cc eSP+',
              congSuat: d.congSuat || found?.congSuat || '15.0 HP / 8.000 rpm',
              tieuHaoNhienLieu: d.tieuHaoNhienLieu || found?.tieuHaoNhienLieu || '2.2 L/100km',
              phanh: d.phanh || found?.phanh || 'Phanh đĩa ABS trước',
              xuatXu: found?.xuatXu || (d.hang === 'Piaggio & Vespa' ? 'Nhập khẩu (Ý)' : 'Việt Nam'),
            };
          });
          setVehicles(merged);
        }
      });
    };

    loadVehicles();
    window.addEventListener('crm-data-refresh', loadVehicles);
    return () => window.removeEventListener('crm-data-refresh', loadVehicles);
  }, []);

  // Local reviews state so user can add a review dynamically (ĐG04, ĐG05)
  const [allReviews, setAllReviews] = useState<ProductReview[]>([...mockProductReviews]);
  const [newReviewAuthor, setNewReviewAuthor] = useState(currentCustomer?.hoTen || '');
  const [newReviewPhone, setNewReviewPhone] = useState(currentCustomer?.soDienThoai || '');
  const [newReviewStars, setNewReviewStars] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [reviewMediaFiles, setReviewMediaFiles] = useState<string[]>([]);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  // Sync vehicle reviews from feedbackApi (ĐG04, ĐG09)
  useEffect(() => {
    const syncVehicleReviews = async () => {
      try {
        const feedbacks = await feedbackApi.getAll();
        const vFeedbacks: ProductReview[] = feedbacks
          .filter(f => f.productType === 'XeMau' || f.productId?.startsWith('XM') || (f.xeDangDung && !f.productId?.startsWith('PT')))
          .map(f => ({
            id: f.id,
            targetId: f.productId || '',
            customerId: f.customerId,
            tenKhachHang: f.hoTen,
            soDienThoai: f.soDienThoai,
            soSao: f.diemDanhGia,
            ngayDanhGia: f.ngayGui,
            noiDung: f.noiDung,
            daMua: true,
            dongXeDaMua: f.productName || f.xeDangDung || 'Xe máy chính hãng',
            editCount: f.editCount || 0,
            productName: f.productName || f.xeDangDung,
            hinhAnhDinhKem: f.hinhAnhDinhKem || [],
          }));

        setAllReviews(prev => {
          const merged = [...prev];
          vFeedbacks.forEach(vf => {
            const idx = merged.findIndex(m => m.id === vf.id);
            if (idx !== -1) merged[idx] = { ...merged[idx], ...vf };
            else if (vf.targetId) merged.unshift(vf);
          });
          return merged;
        });
      } catch (err) {
        console.warn('Sync vehicle reviews error:', err);
      }
    };

    syncVehicleReviews();
    window.addEventListener('crm-data-refresh', syncVehicleReviews);
    return () => window.removeEventListener('crm-data-refresh', syncVehicleReviews);
  }, []);

  useEffect(() => {
    if (currentCustomer) {
      setNewReviewAuthor(currentCustomer.hoTen);
      setNewReviewPhone(currentCustomer.soDienThoai);
    }
  }, [currentCustomer]);

  // Auth-checked test drive trigger (TC03)
  const handleBookTestDrive = (vehicleId: string) => {
    if (!currentCustomer) {
      if (onRequireLogin) onRequireLogin();
      else window.dispatchEvent(new CustomEvent('crm-open-login'));
      return;
    }
    onBookTestDrive(vehicleId);
  };

  // Bộ lọc đa tiêu chí (TC02, TC07, TC08: Tiếng Việt không dấu & khoảng trắng thừa)
  const filteredVehicles = vehicles
    .filter(v => {
      const matchSearch =
        !search.trim() ||
        matchVietnameseSearch(v.tenXe, search) ||
        matchVietnameseSearch(v.hang, search) ||
        matchVietnameseSearch(v.phanKhuc, search) ||
        (v.dongCo ? matchVietnameseSearch(v.dongCo, search) : false) ||
        (v.mauSac ? matchVietnameseSearch(v.mauSac, search) : false);

      const matchHang = selectedHang === 'ALL' || v.hang === selectedHang;
      const matchPhanKhuc = selectedPhanKhuc === 'ALL' || v.phanKhuc === selectedPhanKhuc;
      const matchTestDrive = !onlyTestDrive || v.coTheLaiThu;

      // Khoảng giá (TC02)
      let matchPrice = true;
      if (selectedPriceRange === 'under30') matchPrice = v.giaNiemYet < 30000000;
      else if (selectedPriceRange === '30to60') matchPrice = v.giaNiemYet >= 30000000 && v.giaNiemYet <= 60000000;
      else if (selectedPriceRange === '60to100') matchPrice = v.giaNiemYet > 60000000 && v.giaNiemYet <= 100000000;
      else if (selectedPriceRange === 'above100') matchPrice = v.giaNiemYet > 100000000;

      // Xuất xứ (TC02)
      let matchOrigin = true;
      const origin = v.xuatXu || (v.hang === 'Piaggio & Vespa' ? 'Nhập khẩu (Ý)' : 'Việt Nam');
      if (selectedOrigin === 'Trong nước') matchOrigin = origin.includes('Việt Nam');
      else if (selectedOrigin === 'Nhập khẩu') matchOrigin = !origin.includes('Việt Nam');

      return matchSearch && matchHang && matchPhanKhuc && matchTestDrive && matchPrice && matchOrigin;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return a.giaNiemYet - b.giaNiemYet;
      if (sortBy === 'priceDesc') return b.giaNiemYet - a.giaNiemYet;
      if (sortBy === 'nameAsc') return a.tenXe.localeCompare(b.tenXe);
      if (sortBy === 'nameDesc') return b.tenXe.localeCompare(a.tenXe);
      return 0;
    });

  const currentVehicleReviews = detailVehicle
    ? allReviews.filter(r => r.targetId === detailVehicle.id)
    : [];

  // Check if currentCustomer has already reviewed detailVehicle (ĐG05)
  const existingVehicleReview = useMemo(() => {
    if (!currentCustomer || !detailVehicle) return null;
    return allReviews.find(r =>
      r.targetId === detailVehicle.id &&
      (
        r.customerId === currentCustomer.id ||
        (r.soDienThoai && currentCustomer.soDienThoai && r.soDienThoai.replace(/\D/g, '') === currentCustomer.soDienThoai.replace(/\D/g, '')) ||
        r.tenKhachHang.toLowerCase().trim() === currentCustomer.hoTen.toLowerCase().trim()
      )
    ) || null;
  }, [currentCustomer, detailVehicle, allReviews]);

  // Handle Submit Review (ĐG04, ĐG05, ĐG09: Media đính kèm, ĐG16: Giới hạn 200 từ)
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailVehicle || !currentCustomer || !newReviewAuthor.trim() || !newReviewContent.trim()) return;

    // ĐG16: Giới hạn mỗi lần đánh giá không quá 200 từ và cảnh báo chống spam
    const words = countWords(newReviewContent);
    if (words > 200) {
      alert(`Đánh giá không được vượt quá 200 từ (Hiện tại: ${words} từ). Vui lòng rút gọn nội dung để đảm bảo tính xác thực và phòng chống spam!`);
      return;
    }

    if (existingVehicleReview) {
      if ((existingVehicleReview.editCount || 0) >= 1) {
        alert('Bạn đã sử dụng hết lượt chỉnh sửa đánh giá cho dòng xe này (tối đa 1 lần).');
        return;
      }

      await feedbackApi.update(existingVehicleReview.id, {
        diemDanhGia: newReviewStars,
        noiDung: newReviewContent.trim(),
        hinhAnhDinhKem: reviewMediaFiles,
      });

      setAllReviews(prev => prev.map(r => r.id === existingVehicleReview.id ? {
        ...r,
        soSao: newReviewStars,
        noiDung: newReviewContent.trim(),
        hinhAnhDinhKem: reviewMediaFiles,
        editCount: (r.editCount || 0) + 1,
      } : r));

      setIsEditingReview(false);
      setReviewToast('✓ Đã cập nhật đánh giá xe thành công! Bạn đã hoàn thành lượt chỉnh sửa.');
      setTimeout(() => setReviewToast(null), 4000);
      return;
    }

    // ĐG04 & ĐG09: Gửi đánh giá mới lên Backend kèm media ảnh/video
    const res = await feedbackApi.create({
      customerId: currentCustomer.id,
      hoTen: newReviewAuthor.trim(),
      soDienThoai: currentCustomer.soDienThoai,
      email: currentCustomer.email,
      diaChi: currentCustomer.diaChi,
      noiDung: newReviewContent.trim(),
      diemDanhGia: newReviewStars,
      loaiDanhGia: 'SanPham',
      loaiNhan: newReviewStars <= 3 ? 'KhieuNai' : 'DanhGia',
      productId: detailVehicle.id,
      productName: detailVehicle.tenXe,
      productImage: detailVehicle.hinhAnh,
      productType: 'XeMau',
      xeDangDung: detailVehicle.tenXe,
      hinhAnhDinhKem: reviewMediaFiles,
    });

    const newRev: ProductReview = {
      id: res.feedback.id,
      targetId: detailVehicle.id,
      customerId: currentCustomer.id,
      tenKhachHang: newReviewAuthor.trim(),
      soDienThoai: currentCustomer.soDienThoai
        ? currentCustomer.soDienThoai.slice(0, 4) + '***' + currentCustomer.soDienThoai.slice(-3)
        : '090***' + Math.floor(100 + Math.random() * 900),
      soSao: newReviewStars,
      ngayDanhGia: new Date().toISOString().split('T')[0],
      noiDung: newReviewContent.trim(),
      daMua: true,
      dongXeDaMua: `${detailVehicle.tenXe} (Chính hãng)`,
      editCount: 0,
      productName: detailVehicle.tenXe,
      productImage: detailVehicle.hinhAnh,
      productType: 'XeMau',
      hinhAnhDinhKem: reviewMediaFiles,
    };

    setAllReviews(prev => [newRev, ...prev]);
    setNewReviewContent('');
    setReviewMediaFiles([]);
    setReviewSubmitted(true);
    setReviewToast('✓ Đánh giá xe kèm hình ảnh đã được lưu và cập nhật đồng bộ trên hệ thống!');
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewToast(null);
    }, 4000);
  };

  // ── TC04: DEDICATED FULL-PAGE VEHICLE DETAIL VIEW ──
  if (detailVehicle) {
    const meta = brandMeta[detailVehicle.hang] || { color: '#dc2626', bg: '#fef2f2', badge: detailVehicle.hang };
    const vReviews = allReviews.filter(r => r.targetId === detailVehicle.id);
    const relatedVehicles = vehicles
      .filter(v => v.id !== detailVehicle.id && (v.hang === detailVehicle.hang || v.phanKhuc === detailVehicle.phanKhuc))
      .slice(0, 4);

    // Check if currentCustomer owns or has purchased detailVehicle (ĐG03)
    const hasPurchasedVehicle = !currentCustomer ? false : mockVehicles.some(v => {
      const isMine = v.customerId === currentCustomer.id;
      if (!isMine) return false;
      const vName = v.tenXe.toLowerCase().trim();
      const detailName = detailVehicle.tenXe.toLowerCase().trim();
      return vName.includes(detailName) || detailName.includes(vName) ||
        (detailVehicle.dongCo && vName.includes(detailVehicle.hang.toLowerCase()));
    });

    return (
      <div className="min-h-screen bg-zinc-50 pb-20">
        {/* Breadcrumb Top Bar */}
        <div className="bg-white border-b border-zinc-200 py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <button
                onClick={() => {
                  setDetailVehicle(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-red-700 transition cursor-pointer flex items-center gap-1 font-sans font-semibold"
              >
                <span>←</span> Showroom xe máy
              </button>
              <span>/</span>
              <span className="text-zinc-500">{detailVehicle.hang}</span>
              <span>/</span>
              <span className="text-zinc-900 font-bold truncate max-w-xs">{detailVehicle.tenXe}</span>
            </div>

            <button
              onClick={() => {
                setDetailVehicle(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>✕</span> Quay lại danh sách xe
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
          {/* Main 2-Column Showcase */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Big Image & Guarantees */}
              <div className="lg:col-span-6 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 aspect-[16/10] flex items-center justify-center group shadow-inner">
                  <img
                    src={detailVehicle.hinhAnh}
                    alt={detailVehicle.tenXe}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Brand & Segment badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-extrabold font-mono shadow-md"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}
                    >
                      {detailVehicle.hang}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-zinc-900/90 text-zinc-200 border border-zinc-700 shadow-md">
                      {detailVehicle.phanKhuc}
                    </span>
                  </div>

                  {/* Test drive badge */}
                  {detailVehicle.coTheLaiThu ? (
                    <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md font-mono flex items-center gap-1">
                      <span>✓</span> Sẵn xe lái thử tận nơi
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-300 text-xs font-medium px-3 py-1 rounded-full shadow-md font-mono">
                      Chưa có xe mẫu lái thử
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-mono bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 flex justify-between items-center">
                    <span>Màu sắc: <strong>{detailVehicle.mauSac}</strong></span>
                    <span>Động cơ: <strong>{detailVehicle.dongCo}</strong></span>
                  </div>
                </div>

                {/* Service Perks Box */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <div className="font-bold text-zinc-900">Bảo hành 3 năm</div>
                      <div className="text-[10px] text-zinc-500">Hoặc 30.000 km toàn quốc</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🏍️</span>
                    <div>
                      <div className="font-bold text-zinc-900">Lái thử miễn phí</div>
                      <div className="text-[10px] text-zinc-500">Trải nghiệm xe tại showroom</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">💳</span>
                    <div>
                      <div className="font-bold text-zinc-900">Trả góp 0%</div>
                      <div className="text-[10px] text-zinc-500">Duyệt nhanh trong 15 phút</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center gap-2.5">
                    <span className="text-xl">🎁</span>
                    <div>
                      <div className="font-bold text-zinc-900">Gói quà chính hãng</div>
                      <div className="text-[10px] text-zinc-500">Mũ bảo hiểm + Áo mưa cao cấp</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Title, Ratings, Price Box, Specs, Actions */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold font-mono uppercase tracking-wider">
                      {detailVehicle.hang}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-semibold">
                      Phân khúc: {detailVehicle.phanKhuc}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      Xuất xứ: {detailVehicle.xuatXu || (detailVehicle.hang === 'Piaggio & Vespa' ? 'Nhập khẩu (Ý)' : 'Việt Nam')}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                    {detailVehicle.tenXe}
                  </h1>

                  {/* Rating & reviews */}
                  <div className="flex items-center gap-4 text-xs flex-wrap pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <span className="font-bold text-sm text-zinc-900 underline">4.9</span>
                      <span>★★★★★</span>
                    </div>
                    <span className="text-zinc-300">|</span>
                    <span className="text-zinc-600">
                      <strong className="text-zinc-900">{vReviews.length || 2}</strong> Đánh giá từ khách hàng
                    </span>
                    <span className="text-zinc-300">|</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span>✓</span> 100% Khách khuyên mua
                    </span>
                  </div>

                  {/* Highlight Price Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50/90 via-orange-50/50 to-red-50/90 border border-red-200/80 space-y-2">
                    <div className="text-xs uppercase font-mono text-zinc-500 font-bold">Giá niêm yết đề xuất chính hãng</div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl sm:text-4xl font-extrabold text-red-700 font-mono tracking-tight">
                        {formatVND(detailVehicle.giaNiemYet)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-xs font-extrabold font-mono uppercase">
                        CHÍNH HÃNG
                      </span>
                    </div>
                    <div className="text-xs text-red-800/80 font-medium flex items-center gap-1.5">
                      <span>🎁</span> Ưu đãi độc quyền: Tặng gói cứu hộ xe máy 24/7 trong 1 năm + Voucher phụ kiện 500k!
                    </div>
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase">Động cơ</span>
                      <strong className="text-zinc-900 font-mono">{detailVehicle.dongCo}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase">Công suất</span>
                      <strong className="text-zinc-900 font-mono">{detailVehicle.congSuat}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase">Mức tiêu hao nhiên liệu</span>
                      <strong className="text-emerald-700 font-mono">{detailVehicle.tieuHaoNhienLieu || '2.2 L/100km'}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <span className="text-zinc-400 block font-mono text-[10px] uppercase">Hệ thống phanh</span>
                      <strong className="text-zinc-900 font-mono">{detailVehicle.phanh || 'Phanh đĩa trước'}</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                    <span className="text-zinc-500 font-medium">Bảng màu phân phối: </span>
                    <strong className="text-zinc-900 font-semibold">{detailVehicle.mauSac}</strong>
                  </div>
                </div>

                {/* Big Action Buttons (TC03: Auth check) */}
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailVehicle.coTheLaiThu ? (
                      <button
                        onClick={() => handleBookTestDrive(detailVehicle.id)}
                        className="py-3.5 px-6 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-red-700/30 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span className="text-base">🏍️</span>
                        <span>Đăng ký lái thử ngay</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="py-3.5 px-6 rounded-2xl bg-zinc-100 text-zinc-400 font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span>Chưa có xe lái thử</span>
                      </button>
                    )}

                    <a
                      href="tel:19001234"
                      className="py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border-2 bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-800"
                    >
                      <span className="text-base">📞</span>
                      <span>Báo giá lăn bánh</span>
                    </a>
                  </div>

                  {!currentCustomer && (
                    <div className="text-center text-[11px] text-zinc-500 font-sans">
                      🔒 Chưa đăng nhập? Nhấn nút "Đăng ký lái thử ngay" hệ thống sẽ mở form đăng nhập để ghi nhận lịch hẹn của bạn.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Tabs: Thông số kỹ thuật / Đánh giá khách hàng (TC01) */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/70 px-6 gap-6">
              <button
                onClick={() => setActiveModalTab('specs')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  activeModalTab === 'specs'
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                📋 THÔNG SỐ & MÔ TẢ CHI TIẾT
              </button>
              <button
                onClick={() => setActiveModalTab('reviews')}
                className={`py-4 text-xs font-bold uppercase tracking-wider transition border-b-2 cursor-pointer flex items-center gap-2 ${
                  activeModalTab === 'reviews'
                    ? 'border-red-700 text-red-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span>⭐ ĐÁNH GIÁ KHÁCH HÀNG</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-mono font-bold">
                  {vReviews.length || 2}
                </span>
              </button>
            </div>

            <div className="p-6 lg:p-8">
              {activeModalTab === 'specs' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 mb-2 font-display">Mô tả tổng quan dòng xe</h3>
                    <p className="text-xs text-zinc-700 leading-relaxed font-sans">{detailVehicle.moTa}</p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-900 mb-3 font-display">Bảng thông số kỹ thuật đầy đủ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Hãng sản xuất:</span>
                        <strong className="text-zinc-900 font-mono">{detailVehicle.hang}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Phân khúc xe:</span>
                        <strong className="text-zinc-900 font-mono">{detailVehicle.phanKhuc}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Khối động cơ:</span>
                        <strong className="text-zinc-900 font-mono">{detailVehicle.dongCo}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Công suất cực đại:</span>
                        <strong className="text-zinc-900 font-mono">{detailVehicle.congSuat}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Mức tiêu thụ xăng:</span>
                        <strong className="text-emerald-700 font-mono">{detailVehicle.tieuHaoNhienLieu || '2.2 L/100km'}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Hệ thống phanh:</span>
                        <strong className="text-zinc-900 font-mono">{detailVehicle.phanh || 'Phanh đĩa ABS'}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Xuất xứ lắp ráp:</span>
                        <strong className="text-zinc-900 font-mono">{detailVehicle.xuatXu || (detailVehicle.hang === 'Piaggio & Vespa' ? 'Nhập khẩu (Ý)' : 'Việt Nam')}</strong>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                        <span className="text-zinc-500">Tình trạng xe lái thử:</span>
                        <strong className={`font-mono ${detailVehicle.coTheLaiThu ? 'text-emerald-700' : 'text-zinc-500'}`}>
                          {detailVehicle.coTheLaiThu ? 'Có sẵn xe mẫu tại showroom' : 'Chưa có xe lái thử'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Rating Overview */}
                  <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-extrabold text-zinc-900 font-mono">4.9</div>
                      <div>
                        <div className="flex text-amber-500 text-base">★★★★★</div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          Dựa trên {vReviews.length || 2} nhận xét thực tế từ khách hàng đã mua xe
                        </div>
                      </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
                      ✓ 100% Khách hàng hài lòng về vận hành
                    </span>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {vReviews.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-50 rounded-2xl">
                        Chưa có đánh giá nào cho xe này. Hãy là người đầu tiên để lại nhận xét!
                      </div>
                    ) : (
                      vReviews.map(r => (
                        <div key={r.id} className="p-4 rounded-2xl bg-white border border-zinc-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                                {r.tenKhachHang[0]}
                              </span>
                              <span className="font-bold text-zinc-900">{r.tenKhachHang}</span>
                              {r.soDienThoai && (
                                <span className="text-[11px] text-zinc-400 font-mono">({r.soDienThoai})</span>
                              )}
                              {r.daMua && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                                  ✓ Đã mua xe chính hãng
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono">{r.ngayDanhGia}</span>
                          </div>

                          <div className="flex text-amber-500 text-xs">
                            {'★'.repeat(r.soSao)}{'☆'.repeat(5 - r.soSao)}
                          </div>

                          <p className="text-xs text-zinc-700 leading-relaxed">
                            {r.noiDung}
                          </p>

                          {/* ĐG09: Hiển thị hình ảnh & video đính kèm của review xe */}
                          {r.hinhAnhDinhKem && r.hinhAnhDinhKem.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {r.hinhAnhDinhKem.map((imgUrl, i) => {
                                const isVid = imgUrl.includes('data:video') || imgUrl.endsWith('.mp4') || imgUrl.endsWith('.webm');
                                if (isVid) {
                                  return (
                                    <video
                                      key={i}
                                      src={imgUrl}
                                      controls
                                      className="w-28 h-20 rounded-xl object-cover border border-zinc-200 bg-black shadow-2xs"
                                    />
                                  );
                                }
                                return (
                                  <img
                                    key={i}
                                    src={imgUrl}
                                    alt={`Ảnh review xe ${i + 1}`}
                                    onClick={() => setPreviewZoomImage(imgUrl)}
                                    className="w-16 h-16 rounded-xl object-cover border border-zinc-200 cursor-pointer hover:opacity-90 hover:scale-105 transition shadow-2xs bg-white"
                                    title="Bấm để xem ảnh phóng to"
                                  />
                                );
                              })}
                            </div>
                          )}

                          {r.phanHoiShowroom && (
                            <div className="mt-2 p-2.5 rounded-xl bg-zinc-50 border-l-2 border-red-600 text-xs text-zinc-600">
                              <span className="font-bold text-red-700 block mb-0.5">Phản hồi từ Motoshop:</span>
                              {r.phanHoiShowroom}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Review Form (TC01: Blocked when unauth, ĐG03: Blocked when unpurchased, ĐG01 & ĐG02: Responsive & Account Display) */}
                  {!currentCustomer ? (
                    <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                      <div className="text-3xl">🔒</div>
                      <div className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider">
                        ĐĂNG NHẬP ĐỂ VIẾT ĐÁNH GIÁ XE
                      </div>
                      <p className="text-xs text-amber-700 max-w-md mx-auto">
                        Chỉ khách hàng đã đăng nhập tài khoản và sở hữu dòng xe này mới có thể gửi đánh giá và nhận xét.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (onRequireLogin) onRequireLogin();
                          else window.dispatchEvent(new CustomEvent('crm-open-login'));
                        }}
                        className="mt-2 px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                      >
                        Đăng nhập để đánh giá ngay →
                      </button>
                    </div>
                  ) : !hasPurchasedVehicle ? (
                    /* ĐG03: Khách hàng chưa mua dòng xe này */
                    <div className="p-6 rounded-3xl bg-amber-50/80 border border-amber-200 text-center space-y-3">
                      <div className="text-3xl">🏍️</div>
                      <div className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider">
                        BẠN CHƯA MUA DÒNG XE NÀY
                      </div>
                      <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                        Theo chính sách đánh giá minh bạch, chỉ những khách hàng đã mua xe <strong>"{detailVehicle.tenXe}"</strong> tại hệ thống đại lý Motoshop mới có thể gửi nhận xét thực tế về cảm giác lái và độ bền xe.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-3">
                        {detailVehicle.coTheLaiThu && (
                          <button
                            type="button"
                            onClick={() => handleBookTestDrive(detailVehicle.id)}
                            className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-2"
                          >
                            <span>🏍️</span> Đăng ký lái thử xe này
                          </button>
                        )}
                      </div>
                    </div>
                  ) : existingVehicleReview && !isEditingReview ? (
                    /* ĐG05: Đã đánh giá xe - Hiển thị đánh giá của khách hàng và nút sửa (tối đa 1 lần) */
                    <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-200">
                        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
                          <span>✓</span> ĐÁNH GIÁ CỦA BẠN VỀ DÒNG XE NÀY
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {(existingVehicleReview.editCount || 0) >= 1 ? 'Đã hết lượt sửa (tối đa 1 lần)' : 'Còn 1 lượt chỉnh sửa'}
                        </span>
                      </div>

                      {reviewToast && (
                        <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <span>✓</span> {reviewToast}
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-white border border-zinc-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                              {currentCustomer.hoTen[0]}
                            </span>
                            <span className="font-bold text-xs text-zinc-900">{currentCustomer.hoTen}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">{existingVehicleReview.ngayDanhGia}</span>
                        </div>

                        <div className="flex text-amber-500 text-sm">
                          {'★'.repeat(existingVehicleReview.soSao)}{'☆'.repeat(5 - existingVehicleReview.soSao)}
                        </div>

                        <p className="text-xs text-zinc-700 leading-relaxed">{existingVehicleReview.noiDung}</p>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                        <div className="text-[11px] text-zinc-500">
                          {(existingVehicleReview.editCount || 0) >= 1 ? (
                            <span className="text-emerald-700 font-medium">✓ Bạn đã hoàn thành đánh giá và sử dụng lượt chỉnh sửa duy nhất.</span>
                          ) : (
                            <span>Mỗi tài khoản được gửi đánh giá xe 1 lần và sửa 1 lần duy nhất.</span>
                          )}
                        </div>

                        {(existingVehicleReview.editCount || 0) < 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingReview(true);
                              setNewReviewStars(existingVehicleReview.soSao);
                              setNewReviewContent(existingVehicleReview.noiDung);
                              setReviewMediaFiles(existingVehicleReview.hinhAnhDinhKem || []);
                            }}
                            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <span>✏️</span> Chỉnh sửa đánh giá xe (Còn 1 lần sửa)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ĐG01, ĐG02, ĐG05: Khung nhập / sửa đánh giá xe */
                    <form onSubmit={handleAddReview} className="p-5 sm:p-6 rounded-3xl bg-zinc-50 border border-zinc-200 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-zinc-200">
                        <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-mono flex items-center gap-2">
                          <span>{isEditingReview ? '✏️' : '✍️'}</span> {isEditingReview ? 'CHỈNH SỬA ĐÁNH GIÁ XE (LƯỢT SỬA DUY NHẤT)' : 'VIẾT NHẬN XÉT & ĐÁNH GIÁ TRẢI NGHIỆM XE'}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {isEditingReview ? '⚠️ Còn 1 lần sửa' : '✓ Đã xác minh mua xe tại đại lý'}
                        </span>
                      </div>

                      {reviewToast && (
                        <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <span>✓</span> {reviewToast}
                        </div>
                      )}

                      {/* ĐG02: Hiển thị thông tin tài khoản đang đánh giá */}
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-zinc-200">
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm font-mono shrink-0">
                          {currentCustomer.hoTen.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-zinc-900">{currentCustomer.hoTen}</span>
                            <span className="text-[10px] font-mono text-zinc-500 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">
                              {currentCustomer.soDienThoai}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            Email: {currentCustomer.email || 'Chưa cập nhật'} · Khách hàng Motoshop
                          </div>
                        </div>
                      </div>

                      {/* ĐG01: Khung nhập đánh giá responsive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Họ và tên người đánh giá *</label>
                          <input
                            type="text"
                            required
                            value={newReviewAuthor}
                            onChange={e => setNewReviewAuthor(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Số điện thoại liên hệ *</label>
                          <input
                            type="text"
                            required
                            value={newReviewPhone}
                            onChange={e => setNewReviewPhone(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs focus:outline-none focus:border-red-600 font-mono font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                        <span className="font-semibold text-zinc-700">Mức độ hài lòng:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewStars(star)}
                              className="text-xl text-amber-500 hover:scale-110 transition cursor-pointer p-0.5"
                            >
                              {star <= newReviewStars ? '★' : '☆'}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-600 ml-1">
                          {newReviewStars === 5 ? 'Tuyệt vời (5 sao)' : newReviewStars === 4 ? 'Hài lòng (4 sao)' : newReviewStars === 3 ? 'Bình thường (3 sao)' : 'Chưa hài lòng'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Chia sẻ chi tiết trải nghiệm lái & sử dụng xe (Tối đa 200 từ) *
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Chia sẻ trải nghiệm vận hành, cảm giác lái, mức ăn xăng hoặc chất lượng bảo hành..."
                          required
                          value={newReviewContent}
                          onChange={e => setNewReviewContent(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl border bg-white text-xs focus:outline-none leading-relaxed transition ${
                            countWords(newReviewContent) > 200 ? 'border-red-500 focus:border-red-600' : 'border-zinc-300 focus:border-red-600'
                          }`}
                        />
                        {/* ĐG16: Bộ đếm từ và cảnh báo chống spam */}
                        <div className="flex items-center justify-between text-xs mt-1.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${
                              countWords(newReviewContent) > 200 ? 'text-red-600' : countWords(newReviewContent) > 0 ? 'text-emerald-700' : 'text-zinc-500'
                            }`}>
                              📝 {countWords(newReviewContent)} / 200 từ
                            </span>
                            {countWords(newReviewContent) > 200 ? (
                              <span className="text-red-600 font-bold text-[11px] animate-pulse">
                                ⚠️ Vượt quá 200 từ! Vui lòng rút gọn nội dung để tránh spam.
                              </span>
                            ) : countWords(newReviewContent) > 0 ? (
                              <span className="text-emerald-600 text-[11px] font-medium">
                                ✓ Độ dài hợp lệ (tối đa 200 từ)
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {newReviewContent.length} ký tự
                          </span>
                        </div>
                      </div>

                      {/* ĐG09: Đính kèm hình ảnh hoặc video khi đánh giá xe máy */}
                      <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-zinc-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 uppercase font-mono">
                            <span>📷</span> ĐÍNH KÈM HÌNH ẢNH HOẶC VIDEO XE ({reviewMediaFiles.length})
                          </label>
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 cursor-pointer transition flex items-center gap-1 shadow-2xs">
                              <span>📁 Chọn tệp từ máy</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={e => {
                                  const files = Array.from(e.target.files || []);
                                  files.forEach(file => {
                                    const reader = new FileReader();
                                    reader.onload = ev => {
                                      if (ev.target?.result) {
                                        setReviewMediaFiles(prev => [...prev, ev.target!.result as string]);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewMediaFiles(prev => [
                                  ...prev,
                                  detailVehicle.hinhAnh || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'
                                ]);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl border border-zinc-200 cursor-pointer transition flex items-center gap-1"
                              title="Thêm nhanh ảnh chụp thực tế xe mẫu"
                            >
                              <span>📷 + Ảnh mẫu</span>
                            </button>
                          </div>
                        </div>

                        {reviewMediaFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {reviewMediaFiles.map((mUrl, idx) => {
                              const isVid = mUrl.includes('data:video') || mUrl.endsWith('.mp4');
                              return (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-zinc-300 w-20 h-20 bg-zinc-900 shadow-2xs">
                                  {isVid ? (
                                    <video src={mUrl} className="w-full h-full object-cover" />
                                  ) : (
                                    <img src={mUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setReviewMediaFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition cursor-pointer shadow"
                                    title="Xóa tệp đính kèm này"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isEditingReview && (
                          <button
                            type="button"
                            onClick={() => setIsEditingReview(false)}
                            className="px-4 py-3 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={countWords(newReviewContent) > 200 || countWords(newReviewContent) === 0}
                          className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold transition shadow-md ${
                            countWords(newReviewContent) > 200 || countWords(newReviewContent) === 0
                              ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                              : 'bg-red-700 text-white hover:bg-red-800 cursor-pointer shadow-red-700/20'
                          }`}
                        >
                          {isEditingReview ? 'Lưu cập nhật đánh giá xe' : 'Gửi đánh giá ngay'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Vehicles Section */}
          {relatedVehicles.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 font-display uppercase tracking-wide">
                🏍️ CÁC MẪU XE CÙNG HÃNG HOẶC PHÂN KHÚC
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedVehicles.map(rv => (
                  <div
                    key={rv.id}
                    onClick={() => {
                      setDetailVehicle(rv);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-red-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="aspect-[16/10] rounded-xl bg-zinc-950 p-2 mb-3 overflow-hidden relative">
                      <img src={rv.hinhAnh} alt={rv.tenXe} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                        {rv.hang}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">{rv.phanKhuc}</div>
                      <div className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-red-700 transition">
                        {rv.tenXe}
                      </div>
                      <div className="text-sm font-bold text-red-700 font-mono">
                        {formatVND(rv.giaNiemYet)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN SHOWROOM VIEW (TC05: Unified Filter Card) ──
  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 text-white py-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <span>✨</span> SHOWROOM XE MÁY CHÍNH HÃNG 2025
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            KHÁM PHÁ CÁC DÒNG XE ĐẲNG CẤP
          </h1>
          <p className="mt-2 text-zinc-300 text-xs sm:text-sm max-w-2xl font-sans">
            Honda, Yamaha, Suzuki, Vespa chính hãng · Hỗ trợ đăng ký lái thử tận nơi · Trả góp 0% lãi suất · Xem đánh giá chân thực từ khách hàng đã mua xe
          </p>
        </div>
      </div>

      {/* ── TC15: Survey Notification Banner on Trang Chủ ── */}
      {pendingSurveysCount > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <div className="text-xs font-bold text-amber-900 uppercase font-mono">THÔNG BÁO KHẢO SÁT MỚI TỪ ĐẠI LÝ</div>
                <div className="text-xs text-amber-700">Bạn có {pendingSurveysCount} cuộc khảo sát ý kiến đang chờ hoàn thành.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToSurvey?.()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition cursor-pointer"
            >
              Làm khảo sát ngay →
            </button>
          </div>
        </div>
      )}

      {/* ── TC05: UNIFIED SEARCH & FILTER CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
            <div className="text-sm font-bold text-zinc-900 uppercase font-mono flex items-center gap-2">
              <span>🔍</span> BỘ LỌC TÌM KIẾM XE MÁY TẬP TRUNG
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Hiển thị <strong className="text-zinc-900">{filteredVehicles.length}</strong> / {vehicles.length} mẫu xe
            </div>
          </div>

          {/* Row 1: Search & Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="lg:col-span-4 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Tìm tên xe, động cơ, màu sắc..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-red-600 bg-zinc-50/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Phân khúc */}
            <div className="lg:col-span-2">
              <select
                value={selectedPhanKhuc}
                onChange={e => setSelectedPhanKhuc(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium bg-zinc-50/50 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="ALL">🛵 Phân khúc: Tất cả</option>
                <option value="Tay ga">Xe Tay ga</option>
                <option value="Côn tay">Xe Côn tay</option>
                <option value="Xe số">Xe Số phổ thông</option>
                <option value="Scrambler">Dòng Scrambler</option>
                <option value="Hyper-underbone">Hyper-underbone</option>
              </select>
            </div>

            {/* Mức giá */}
            <div className="lg:col-span-2">
              <select
                value={selectedPriceRange}
                onChange={e => setSelectedPriceRange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium bg-zinc-50/50 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="ALL">💰 Giá: Tất cả mức giá</option>
                <option value="under30">Dưới 30 triệu</option>
                <option value="30to60">30 - 60 triệu</option>
                <option value="60to100">60 - 100 triệu</option>
                <option value="above100">Trên 100 triệu</option>
              </select>
            </div>

            {/* Xuất xứ */}
            <div className="lg:col-span-2">
              <select
                value={selectedOrigin}
                onChange={e => setSelectedOrigin(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium bg-zinc-50/50 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="ALL">🌐 Xuất xứ: Tất cả</option>
                <option value="Trong nước">Lắp ráp trong nước</option>
                <option value="Nhập khẩu">Nhập khẩu nguyên chiếc</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium bg-zinc-50/50 focus:outline-none focus:border-red-600 cursor-pointer"
              >
                <option value="default">⚡ Sắp xếp: Mặc định</option>
                <option value="priceAsc">Giá: Thấp → Cao</option>
                <option value="priceDesc">Giá: Cao → Thấp</option>
                <option value="nameAsc">Tên: A → Z</option>
                <option value="nameDesc">Tên: Z → A</option>
              </select>
            </div>
          </div>

          {/* Row 2: Brand Pills & Test Drive Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-zinc-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              <span className="text-xs font-bold text-zinc-500 font-mono mr-1">Hãng xe:</span>
              <button
                onClick={() => setSelectedHang('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedHang === 'ALL'
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                Tất cả ({vehicles.length})
              </button>

              {(['Honda', 'Yamaha', 'Suzuki', 'Piaggio & Vespa'] as const).map(b => {
                const count = vehicles.filter(v => v.hang === b).length;
                const meta = brandMeta[b];
                const isSelected = selectedHang === b;

                return (
                  <button
                    key={b}
                    onClick={() => setSelectedHang(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'border-transparent text-white shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                    style={{
                      background: isSelected ? meta.color : undefined,
                    }}
                  >
                    <span>{meta.badge}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyTestDrive}
                  onChange={e => setOnlyTestDrive(e.target.checked)}
                  className="w-4 h-4 text-red-700 rounded-sm focus:ring-red-600 accent-red-700"
                />
                <span>Chỉ xe có Lái thử</span>
              </label>

              {(search || selectedHang !== 'ALL' || selectedPhanKhuc !== 'ALL' || selectedPriceRange !== 'ALL' || selectedOrigin !== 'ALL' || sortBy !== 'default' || onlyTestDrive) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedHang('ALL');
                    setSelectedPhanKhuc('ALL');
                    setSelectedPriceRange('ALL');
                    setSelectedOrigin('ALL');
                    setSortBy('default');
                    setOnlyTestDrive(false);
                  }}
                  className="text-xs text-red-700 font-bold hover:underline cursor-pointer"
                >
                  ✕ Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Vehicle Cards Grid ── */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
            <div className="text-4xl mb-3">🏍️</div>
            <div className="text-lg font-bold text-zinc-800">Không tìm thấy mẫu xe nào phù hợp</div>
            <p className="text-xs text-zinc-500 mt-1">Vui lòng thử chọn lại hãng xe hoặc từ khóa tìm kiếm khác</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredVehicles.map(v => {
              const meta = brandMeta[v.hang] || { color: '#dc2626', bg: '#fef2f2', badge: v.hang };
              const vReviews = allReviews.filter(r => r.targetId === v.id);

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setDetailVehicle(v);
                    setActiveModalTab('specs');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col group cursor-pointer hover:-translate-y-1"
                >
                  {/* Image container */}
                  <div className="relative h-56 bg-zinc-950 overflow-hidden">
                    <img
                      src={v.hinhAnh}
                      alt={v.tenXe}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Brand Pill */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono shadow"
                        style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40` }}
                      >
                        {v.hang}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-zinc-900/90 text-zinc-200 border border-zinc-700 shadow">
                        {v.phanKhuc}
                      </span>
                    </div>

                    {/* Test Drive badge */}
                    {v.coTheLaiThu && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                        ✓ Có xe lái thử
                      </span>
                    )}

                    {/* Price bottom overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-zinc-300 font-bold">Giá niêm yết chính hãng</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '0.02em', lineHeight: 1 }}>
                          {formatVND(v.giaNiemYet)}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-300 bg-black/40 px-2 py-0.5 rounded">
                        ⭐ 4.9 ({vReviews.length || 2} ĐG)
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-900 group-hover:text-red-700 transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                        {v.tenXe}
                      </h3>
                      <p className="text-xs text-zinc-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {v.moTa}
                      </p>

                      {/* Specs pills */}
                      <div className="mt-3 pt-3 border-t border-zinc-100 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                          <span className="text-zinc-400 block text-[9px] uppercase font-bold">Động cơ</span>
                          <span className="font-semibold text-zinc-800">{v.dongCo}</span>
                        </div>
                        <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                          <span className="text-zinc-400 block text-[9px] uppercase font-bold">Công suất</span>
                          <span className="font-semibold text-zinc-800">{v.congSuat}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-zinc-500 font-mono">
                        <span className="text-zinc-400">Màu sắc: </span>
                        <span>{v.mauSac}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setDetailVehicle(v);
                          setActiveModalTab('reviews');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>💬</span> Đánh giá ({vReviews.length || 2})
                      </button>
                      {v.coTheLaiThu ? (
                        <button
                          onClick={() => handleBookTestDrive(v.id)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer shadow-sm flex items-center justify-center gap-1"
                        >
                          <span>🏍️</span> Lái thử ngay
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 py-2 rounded-xl text-xs font-medium bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        >
                          Chưa có xe mẫu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ĐG09: Lightbox modal for previewing enlarged review photos */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewZoomImage(null)}
              className="absolute top-4 right-4 bg-zinc-900/90 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm hover:bg-black cursor-pointer shadow-lg z-10"
            >
              ✕
            </button>
            <img src={previewZoomImage} alt="Xem ảnh phóng to" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl mx-auto border border-white/20" />
          </div>
        </div>
      )}
    </div>
  );
}
