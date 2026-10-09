import React, { useState, useEffect, useMemo } from 'react';
import {
  formatVND,
  MOTORBIKE_BRANDS,
  ENGINE_CAPACITIES,
  formatVietnameseLicensePlate,
  isValidLicensePlate,
  type Customer,
  type Vehicle,
  type Part,
  mockParts,
} from '../../data/mockData';
import { appointmentApi, vehicleApi, partApi, addCustomerNotification } from '../../services/api';
import ImageUploader from '../../components/shared/ImageUploader';

type ServiceType = 'BaoDuong' | 'SuaChua' | 'LaiThu';

// ── 1. Danh sách loại dịch vụ chính (Step 1) ──
const services = [
  {
    key: 'BaoDuong' as const,
    label: 'Bảo dưỡng định kỳ',
    badge: 'Chăm sóc xe',
    icon: '🔧',
    desc: 'Thay nhớt, lọc gió, kiểm tra 18 hạng mục an toàn định kỳ chuẩn hãng',
    time: '60–90 phút',
    color: '#dc2626',
    bg: '#fef2f2',
  },
  {
    key: 'SuaChua' as const,
    label: 'Sửa chữa hư hỏng',
    badge: 'Khắc phục sự cố',
    icon: '⚙️',
    desc: 'Chẩn đoán lỗi, sửa phanh, động cơ, hệ thống điện, thay thế phụ tùng',
    time: '1–3 giờ',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    key: 'LaiThu' as const,
    label: 'Lái thử xe mới',
    badge: 'Trải nghiệm 2025',
    icon: '🏍️',
    desc: 'Trải nghiệm thực tế các dòng xe Honda, Yamaha, Vespa mới nhất tại showroom',
    time: '30–45 phút',
    color: '#2563eb',
    bg: '#eff6ff',
  },
];

// ── Xe lái thử mẫu tại showroom (Step 3 - Lái thử) ──
const testDriveVehicles = [
  {
    id: 'XM001',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga cao cấp',
    gia: 95900000,
    dongCo: '156.9cc eSP+ 4 van, ABS 2 kênh',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    sanSang: true,
  },
  {
    id: 'XM002',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga thể thao',
    gia: 56690000,
    dongCo: '156.9cc eSP+, sạc USB, ABS bánh trước',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    sanSang: true,
  },
  {
    id: 'XM003',
    tenXe: 'Yamaha Exciter 155 VVA ABS',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay thể thao',
    gia: 56990000,
    dongCo: '155cc VVA, côn tay 6 cấp, ly hợp A&S',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80',
    sanSang: true,
  },
  {
    id: 'XM004',
    tenXe: 'Yamaha Grande Hybrid 2025',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga Hybrid nữ',
    gia: 58990000,
    dongCo: '125cc Blue Core Hybrid siêu tiết kiệm xăng',
    hinhAnh: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600&auto=format&fit=crop&q=80',
    sanSang: true,
  },
  {
    id: 'XM005',
    tenXe: 'Vespa Sprint 125 ABS',
    hang: 'Piaggio & Vespa',
    phanKhuc: 'Tay ga biểu tượng Ý',
    gia: 82500000,
    dongCo: '125cc i-Get 3V, phanh ABS, đồng hồ TFT',
    hinhAnh: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80',
    sanSang: true,
  },
  {
    id: 'XM006',
    tenXe: 'Honda Winner X 150 ABS',
    hang: 'Honda',
    phanKhuc: 'Côn tay thành thị',
    gia: 50560000,
    dongCo: '149.1cc DOHC 6 số, phanh ABS bánh trước',
    hinhAnh: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=600&auto=format&fit=crop&q=80',
    sanSang: true,
  },
];

// ── Danh sách các gói bảo dưỡng (Step 4 - Bảo dưỡng) ──
const maintenancePackages = [
  {
    id: 'PKG-STANDARD',
    tenGoi: 'Gói Tiêu Chuẩn (Cấp 1)',
    gia: 150000,
    moTa: 'Thay nhớt máy, kiểm tra bugi, áp suất lốp, bôi trơn dây ga, vệ sinh cụm phanh cơ bản.',
    thoiGian: '45 phút',
    badge: 'Định kỳ 1.500 km',
    color: '#059669',
  },
  {
    id: 'PKG-ADVANCED',
    tenGoi: 'Gói Chuyên Sâu (Cấp 2)',
    gia: 350000,
    moTa: 'Bao gồm Cấp 1 + Vệ sinh kim phun / bình xăng con, vệ sinh bộ nồi (xe ga), thay lọc gió, kiểm tra ắc quy.',
    thoiGian: '75 phút',
    badge: 'Định kỳ 5.000 km (Khuyên dùng)',
    color: '#dc2626',
    noiBat: true,
  },
  {
    id: 'PKG-VIP',
    tenGoi: 'Gói Toàn Diện VIP (Cấp 3)',
    gia: 650000,
    moTa: 'Bao gồm Cấp 2 + Súc buồng đốt khử carbon, thay nước làm mát, tra mỡ chén cổ/cốt bánh, bảo dưỡng toàn bộ 18 hạng mục chuẩn hãng.',
    thoiGian: '120 phút',
    badge: 'Định kỳ 10.000 km',
    color: '#7c3aed',
  },
  {
    id: 'PKG-SPA',
    tenGoi: 'Gói Chăm Sóc & Vệ Sinh Chi Tiết',
    gia: 120000,
    moTa: 'Rửa xe bọt tuyết siêu sạch, tẩy ố dầu mỡ lốc máy, dưỡng bóng dàn áo chống bám bụi và bảo vệ lốp.',
    thoiGian: '30 phút',
    badge: 'Làm đẹp xe',
    color: '#2563eb',
  },
];

// ── Tình trạng xe phổ biến (Step 3 - Sửa chữa) ──
const repairIssuesList = [
  'Xe khó nổ / hay tắt máy giữa chừng',
  'Động cơ kêu lạ / rung lắc khi tăng ga',
  'Phanh kêu / bó phanh / mất phanh',
  'Xì nhớt / rò rỉ dung dịch làm mát',
  'Hệ thống điện / đèn / còi không hoạt động',
  'Lốp xe mòn / thủng đinh / đảo vành',
  'Xe hao xăng / bốc khói đen hoặc trắng',
  'Trượt nồi / xe lì yếu không bốc ga',
];

// ── Các dịch vụ sửa chữa cụ thể (Step 4 - Sửa chữa) ──
const specificRepairServices = [
  { id: 'SVC-DIAGNOSTIC', ten: 'Kiểm tra & chẩn đoán lỗi động cơ điện tử (FI)', gia: 100000 },
  { id: 'SVC-BATTERY', ten: 'Thay bình ắc quy GS / Globe chính hãng 12V', gia: 380000 },
  { id: 'SVC-BRAKE', ten: 'Cân chỉnh & thay bố phanh đĩa / má phanh đùm', gia: 120000 },
  { id: 'SVC-CLUTCH', ten: 'Vệ sinh & căn chỉnh bộ nồi xe ga (bi nồi, bố ba càng)', gia: 180000 },
  { id: 'SVC-SPARK', ten: 'Thay bugi Denso / NGK Iridium chân dài chống nước', gia: 95000 },
  { id: 'SVC-BELT', ten: 'Thay dây curoa Bando / nhông sên dĩa DID', gia: 320000 },
  { id: 'SVC-TIRE', ten: 'Vá nấm lốp không ruột / thay vỏ xe Michelin/Maxxis', gia: 90000 },
  { id: 'SVC-SHOCK', ten: 'Phục hồi & châm dầu phuộc nhún trước/sau', gia: 220000 },
];

const timeSlots = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

interface ServiceBookingProps {
  initialVehicleId?: string;
  currentCustomer?: Customer | null;
  onCustomerChange?: (c: Customer | null) => void;
}

export default function ServiceBooking({ initialVehicleId, currentCustomer, onCustomerChange }: ServiceBookingProps) {
  // ── 1. Chọn loại dịch vụ (Step 1) ──
  const [svc, setSvc] = useState<ServiceType>(initialVehicleId ? 'LaiThu' : 'BaoDuong');

  // ── 2. Thông tin khách hàng (Step 2) ──
  const [contactForm, setContactForm] = useState({
    hoTen: currentCustomer?.hoTen || '',
    soDienThoai: currentCustomer?.soDienThoai || '',
    email: currentCustomer?.email || '',
    diaChi: currentCustomer?.diaChi || 'TP. Hồ Chí Minh',
  });

  useEffect(() => {
    if (currentCustomer) {
      setContactForm({
        hoTen: currentCustomer.hoTen || '',
        soDienThoai: currentCustomer.soDienThoai || '',
        email: currentCustomer.email || '',
        diaChi: currentCustomer.diaChi || 'TP. Hồ Chí Minh',
      });
    } else {
      setContactForm({
        hoTen: '',
        soDienThoai: '',
        email: '',
        diaChi: 'TP. Hồ Chí Minh',
      });
    }
  }, [currentCustomer]);

  // ── 3. Chọn phương tiện (Step 3) ──
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({
    hangXe: 'Honda',
    dongXe: 'Wave Alpha',
    customDongXe: '',
    dongCo: '110cc',
    bienSo: '',
    namSanXuat: new Date().getFullYear(),
    soKhung: '',
    mauSac: 'Đen bóng',
  });
  const [newVehicleErrors, setNewVehicleErrors] = useState<Record<string, string>>({});

  // Tình trạng xe & mô tả & ảnh/video khi sửa chữa
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [problemDescription, setProblemDescription] = useState('');
  const [uploadedMediaList, setUploadedMediaList] = useState<string[]>([]);
  const [newMediaInput, setNewMediaInput] = useState('');

  // Xe mẫu lái thử đã chọn
  const [selectedTestDriveId, setSelectedTestDriveId] = useState<string>(initialVehicleId || 'XM001');

  // ── 4. Chọn dịch vụ chi tiết (Step 4) ──
  // Bảo dưỡng: Chọn gói
  const [selectedPackageId, setSelectedPackageId] = useState<string>('PKG-ADVANCED');

  // Sửa chữa: Chọn các dịch vụ cụ thể + Phụ tùng từ kho web
  const [selectedSpecificServices, setSelectedSpecificServices] = useState<string[]>(['SVC-DIAGNOSTIC']);
  const [selectedParts, setSelectedParts] = useState<{ part: Part; quantity: number }[]>([]);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [partCategory, setPartCategory] = useState('ALL');
  const [availableParts, setAvailableParts] = useState<Part[]>(mockParts);

  // Lái thử: Giấy phép lái xe (GPLX)
  const [licenseForm, setLicenseForm] = useState({
    soGPLX: '',
    hangBang: 'A1',
    anhMatTruoc: '',
    anhMatSau: '',
  });

  // ── 5. Chọn ngày giờ & ghi chú (Step 5) ──
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Trạng thái nộp và xử lý
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastBookedSummary, setLastBookedSummary] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Tải danh sách xe của khách hàng đăng nhập
  useEffect(() => {
    if (!currentCustomer) {
      setMyVehicles([]);
      setSelectedVehicleId('');
      return;
    }
    vehicleApi.getAll().then(data => {
      if (data) {
        const cIdNum = parseInt(currentCustomer.id.replace(/\D/g, ''), 10);
        const filtered = data.filter(v => {
          if (v.customerId === currentCustomer.id) return true;
          const vNum = parseInt(v.customerId.replace(/\D/g, ''), 10);
          return !isNaN(cIdNum) && !isNaN(vNum) && cIdNum === vNum;
        });
        setMyVehicles(filtered);
        if (filtered.length > 0) {
          setSelectedVehicleId(filtered[0].id);
          setIsAddingNewVehicle(false);
        } else {
          setSelectedVehicleId('');
          setIsAddingNewVehicle(true);
        }
      }
    });
  }, [currentCustomer]);

  // Tải danh sách phụ tùng từ kho
  useEffect(() => {
    partApi.getAll().then(data => {
      if (data && data.length > 0) setAvailableParts(data);
    });
  }, []);

  // Tính tổng chi phí dịch vụ ước tính
  const estimatedTotalCost = useMemo(() => {
    if (svc === 'BaoDuong') {
      const pkg = maintenancePackages.find(p => p.id === selectedPackageId);
      return pkg ? pkg.gia : 0;
    }
    if (svc === 'SuaChua') {
      let total = 0;
      selectedSpecificServices.forEach(sId => {
        const found = specificRepairServices.find(s => s.id === sId);
        if (found) total += found.gia;
      });
      selectedParts.forEach(item => {
        const price = item.part.giaKhuyenMai || item.part.giaGoc;
        total += price * item.quantity;
      });
      return total;
    }
    return 0; // Lái thử miễn phí
  }, [svc, selectedPackageId, selectedSpecificServices, selectedParts]);

  // Toggle issue checkbox
  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  // Toggle specific repair service
  const toggleSpecificService = (serviceId: string) => {
    setSelectedSpecificServices(prev =>
      prev.includes(serviceId) ? prev.filter(s => s !== serviceId) : [...prev, serviceId]
    );
  };

  // Thêm phụ tùng vào danh sách chọn
  const handleAddPartToBooking = (part: Part) => {
    setSelectedParts(prev => {
      const existing = prev.find(p => p.part.id === part.id);
      if (existing) {
        return prev.map(p =>
          p.part.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { part, quantity: 1 }];
    });
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts(prev => prev.filter(p => p.part.id !== partId));
  };

  // Media file picker ref
  const mediaFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleMediaFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        alert(`Tệp "${file.name}" vượt quá dung lượng tối đa 20MB!`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedMediaList(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Thêm media (ảnh/video) mô tả xe sửa
  const handleAddMedia = () => {
    if (newMediaInput.trim()) {
      setUploadedMediaList(prev => [...prev, newMediaInput.trim()]);
      setNewMediaInput('');
    }
  };

  // LH02: Reset form sạch sẽ để đặt lịch hẹn khác
  const handleResetForm = () => {
    setSvc('BaoDuong');
    setDate('');
    setTime('');
    setSelectedIssues([]);
    setProblemDescription('');
    setUploadedMediaList([]);
    setSelectedParts([]);
    setLicenseForm({ soGPLX: '', hangBang: 'A1', anhMatTruoc: '', anhMatSau: '' });
    setGeneralNotes('');
    setErrorMessage(null);
    setSubmitted(false);
  };

  // Submit toàn bộ lịch hẹn
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // LH01: Bắt buộc đăng nhập
    if (!currentCustomer) {
      alert('Vui lòng đăng nhập tài khoản trước khi thực hiện đặt lịch hẹn!');
      window.dispatchEvent(new CustomEvent('crm-open-login'));
      return;
    }

    if (!date || !time) {
      setErrorMessage('Vui lòng chọn ngày và khung giờ hẹn trước khi xác nhận!');
      return;
    }

    // LH15: Kiểm tra định dạng năm bắt buộc đúng 4 chữ số (YYYY)
    const dateParts = date.split('-');
    const yearStr = dateParts[0];
    const currentYear = new Date().getFullYear();
    if (!yearStr || yearStr.length !== 4 || isNaN(Number(yearStr)) || Number(yearStr) < currentYear || Number(yearStr) > currentYear + 2) {
      setErrorMessage(`Năm hẹn không hợp lệ! Vui lòng chỉ nhập năm đúng 4 chữ số (YYYY) từ ${currentYear} đến ${currentYear + 2}.`);
      return;
    }

    // Kiểm tra xe theo loại dịch vụ
    let finalVehicleName = '';
    let finalPlate = '';

    if (svc === 'LaiThu') {
      const testCar = testDriveVehicles.find(v => v.id === selectedTestDriveId);
      finalVehicleName = testCar ? testCar.tenXe : 'Xe lái thử Motoshop';
      finalPlate = 'XE-LÁI-THỬ';

      // Kiểm tra bằng lái xe nếu lái thử
      if (!licenseForm.soGPLX.trim()) {
        setErrorMessage('Dịch vụ lái thử yêu cầu cung cấp Số Giấy phép lái xe (GPLX) hợp lệ!');
        return;
      }
    } else {
      if (!isAddingNewVehicle && selectedVehicleId) {
        const matched = myVehicles.find(v => v.id === selectedVehicleId);
        if (matched) {
          finalVehicleName = matched.tenXe;
          finalPlate = matched.bienSo;
        }
      } else {
        const vErrors: Record<string, string> = {};
        if (!newVehicleForm.hangXe) vErrors.hangXe = 'Vui lòng chọn hãng xe';
        const effectiveDongXe = newVehicleForm.dongXe === 'Khác' ? newVehicleForm.customDongXe.trim() : newVehicleForm.dongXe.trim();
        if (!effectiveDongXe) vErrors.dongXe = 'Vui lòng chọn hoặc nhập tên dòng xe';
        if (!newVehicleForm.dongCo) vErrors.dongCo = 'Vui lòng chọn phân khối động cơ';
        if (!newVehicleForm.bienSo.trim()) {
          vErrors.bienSo = 'Vui lòng nhập biển số xe';
        } else if (!isValidLicensePlate(newVehicleForm.bienSo)) {
          vErrors.bienSo = 'Biển số xe không hợp lệ (VD: 51K-123.45, 59F1-234.56)';
        }

        if (Object.keys(vErrors).length > 0) {
          setNewVehicleErrors(vErrors);
          setErrorMessage('Vui lòng kiểm tra lại thông tin xe mới nhập bên dưới!');
          return;
        }
        setNewVehicleErrors({});

        finalVehicleName = `${newVehicleForm.hangXe} ${effectiveDongXe} ${newVehicleForm.dongCo}`.trim();
        finalPlate = formatVietnameseLicensePlate(newVehicleForm.bienSo.trim());

        // ĐKX02 & ĐKX03: Tự động lưu xe mới vào tài khoản, trạng thái ChuaCo
        try {
          const registeredV = await vehicleApi.registerVehicle({
            customerId: currentCustomer.id,
            tenXe: finalVehicleName,
            bienSo: finalPlate,
            namSanXuat: Number(newVehicleForm.namSanXuat) || new Date().getFullYear(),
            hanBaoHanh: 'Chưa kích hoạt',
            mauSac: newVehicleForm.mauSac || 'Tiêu chuẩn',
            trangThaiBaoHanh: 'ChuaCo',
            soKhung: newVehicleForm.soKhung.trim() || undefined,
            trangThaiDuyet: 'ChoDuyet',
          });

          if (currentCustomer) {
            const updatedCust = { ...currentCustomer, soXe: registeredV.id };
            localStorage.setItem('crm_current_customer', JSON.stringify(updatedCust));
            onCustomerChange?.(updatedCust);
          }
        } catch {}
      }
    }

    // Xây dựng ghi chú tổng hợp đầy đủ chi tiết cho Admin và Kỹ thuật viên
    let detailNoteParts: string[] = [];
    if (svc === 'BaoDuong') {
      const pkg = maintenancePackages.find(p => p.id === selectedPackageId);
      if (pkg) detailNoteParts.push(`[GÓI BẢO DƯỠNG]: ${pkg.tenGoi} (${formatVND(pkg.gia)})`);
    } else if (svc === 'SuaChua') {
      if (selectedIssues.length > 0) {
        detailNoteParts.push(`[TÌNH TRẠNG XE]: ${selectedIssues.join(', ')}`);
      }
      if (problemDescription.trim()) {
        detailNoteParts.push(`[MÔ TẢ TRIỆU CHỨNG]: ${problemDescription.trim()}`);
      }
      if (selectedSpecificServices.length > 0) {
        const svcNames = selectedSpecificServices
          .map(sId => specificRepairServices.find(s => s.id === sId)?.ten)
          .filter(Boolean);
        detailNoteParts.push(`[HẠNG MỤC SỬA CHỮA]: ${svcNames.join('; ')}`);
      }
      if (selectedParts.length > 0) {
        const partsSummary = selectedParts
          .map(p => `${p.part.tenSanPham} (x${p.quantity})`)
          .join(', ');
        detailNoteParts.push(`[PHỤ TÙNG CHỌN KÈM]: ${partsSummary}`);
      }
      if (uploadedMediaList.length > 0) {
        detailNoteParts.push(`[HÌNH ẢNH/VIDEO ĐÍNH KÈM]: ${uploadedMediaList.length} tệp`);
      }
    } else if (svc === 'LaiThu') {
      detailNoteParts.push(
        `[GPLX LÁI THỬ]: Số ${licenseForm.soGPLX.trim()} (Hạng ${licenseForm.hangBang})`
      );
    }

    if (generalNotes.trim()) {
      detailNoteParts.push(`[GHI CHÚ KHÁCH HÀNG]: ${generalNotes.trim()}`);
    }

    const compiledGhiChu = detailNoteParts.join(' | ');

    setIsSubmitting(true);
    try {
      const createdAppt = await appointmentApi.create({
        customerId: currentCustomer.id,
        hoTenKH: contactForm.hoTen.trim() || currentCustomer.hoTen,
        soDienThoai: contactForm.soDienThoai.trim() || currentCustomer.soDienThoai,
        loaiDichVu: svc,
        ngayHen: date,
        gioHen: time,
        tenXe: finalVehicleName,
        bienSo: finalPlate,
        ghiChu: compiledGhiChu,
      });

      addCustomerNotification({
        customerId: currentCustomer.id,
        icon: '📅',
        title: '📅 Đặt lịch hẹn dịch vụ thành công',
        message: `Lịch hẹn ${svc === 'BaoDuong' ? 'Bảo dưỡng định kỳ' : svc === 'LaiThu' ? 'Lái thử xe' : 'Sửa chữa'} cho xe ${finalVehicleName} lúc ${time} ngày ${date} đã được gửi thành công. Showroom sẽ sớm liên hệ xác nhận!`,
        category: 'appointment',
        page: 'dashboard',
        tab: 'appts',
        targetId: (createdAppt as any)?.id,
      });

      setLastBookedSummary({
        svc,
        vehicleName: finalVehicleName,
        plate: finalPlate,
        date,
        time,
        cost: estimatedTotalCost,
        note: compiledGhiChu,
      });
      setSubmitted(true);
    } catch (err: any) {
      addCustomerNotification({
        customerId: currentCustomer.id,
        icon: '⚠️',
        title: '⚠️ Đặt lịch hẹn không thành công',
        message: err?.message || 'Có lỗi xảy ra khi gửi lịch hẹn. Vui lòng kiểm tra lại thông tin!',
        category: 'appointment',
        page: 'booking',
      });
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi gửi lịch hẹn. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // DKX01, DKX02, DKX03: Form chuẩn hóa thông tin xe mới (Hãng, Dòng xe, Động cơ, Biển số tự format, Số khung tuỳ chọn)
  const renderNewVehicleInputs = (titleText: string) => (
    <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
        <span className="text-xs font-bold text-zinc-900 uppercase font-mono">
          {titleText}
        </span>
        {myVehicles.length > 0 && (
          <button
            type="button"
            onClick={() => setIsAddingNewVehicle(false)}
            className="text-xs text-red-700 hover:text-red-900 font-bold"
          >
            ← Chọn xe có sẵn trong tài khoản
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1 text-zinc-700">Hãng xe <span className="text-red-600">*</span></label>
          <select
            value={newVehicleForm.hangXe}
            onChange={e => {
              const newBrand = e.target.value;
              const brandData = MOTORBIKE_BRANDS.find(b => b.brand === newBrand);
              const defaultModel = brandData && brandData.models.length > 0 ? brandData.models[0] : 'Khác';
              setNewVehicleForm({
                ...newVehicleForm,
                hangXe: newBrand,
                dongXe: defaultModel,
                customDongXe: '',
              });
              if (newVehicleErrors.hangXe) setNewVehicleErrors({ ...newVehicleErrors, hangXe: '' });
            }}
            className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
              newVehicleErrors.hangXe ? 'border-red-500' : 'border-zinc-300'
            }`}
          >
            {MOTORBIKE_BRANDS.map(b => (
              <option key={b.brand} value={b.brand}>{b.brand}</option>
            ))}
          </select>
          {newVehicleErrors.hangXe && <p className="text-[11px] text-red-600 mt-1 font-semibold">{newVehicleErrors.hangXe}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-zinc-700">Dòng xe <span className="text-red-600">*</span></label>
          <select
            value={newVehicleForm.dongXe}
            onChange={e => {
              setNewVehicleForm({ ...newVehicleForm, dongXe: e.target.value });
              if (newVehicleErrors.dongXe) setNewVehicleErrors({ ...newVehicleErrors, dongXe: '' });
            }}
            className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
              newVehicleErrors.dongXe ? 'border-red-500' : 'border-zinc-300'
            }`}
          >
            {((MOTORBIKE_BRANDS.find(b => b.brand === newVehicleForm.hangXe)?.models) || []).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="Khác">Khác (tự nhập)...</option>
          </select>
          {newVehicleErrors.dongXe && <p className="text-[11px] text-red-600 mt-1 font-semibold">{newVehicleErrors.dongXe}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-zinc-700">Động cơ / Phân khối <span className="text-red-600">*</span></label>
          <select
            value={newVehicleForm.dongCo}
            onChange={e => {
              setNewVehicleForm({ ...newVehicleForm, dongCo: e.target.value });
              if (newVehicleErrors.dongCo) setNewVehicleErrors({ ...newVehicleErrors, dongCo: '' });
            }}
            className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
              newVehicleErrors.dongCo ? 'border-red-500' : 'border-zinc-300'
            }`}
          >
            {ENGINE_CAPACITIES.map(cap => (
              <option key={cap} value={cap}>{cap}</option>
            ))}
          </select>
          {newVehicleErrors.dongCo && <p className="text-[11px] text-red-600 mt-1 font-semibold">{newVehicleErrors.dongCo}</p>}
        </div>
      </div>

      {newVehicleForm.dongXe === 'Khác' && (
        <div>
          <label className="block text-xs font-semibold mb-1 text-zinc-700">Nhập tên dòng xe cụ thể <span className="text-red-600">*</span></label>
          <input
            type="text"
            placeholder="VD: Future Neo, Click 125i..."
            value={newVehicleForm.customDongXe}
            onChange={e => {
              setNewVehicleForm({ ...newVehicleForm, customDongXe: e.target.value });
              if (newVehicleErrors.dongXe) setNewVehicleErrors({ ...newVehicleErrors, dongXe: '' });
            }}
            className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
              newVehicleErrors.dongXe ? 'border-red-500' : 'border-zinc-300'
            }`}
          />
          {newVehicleErrors.dongXe && <p className="text-[11px] text-red-600 mt-1 font-semibold">{newVehicleErrors.dongXe}</p>}
        </div>
      )}

      {/* Xem trước tên xe chuẩn hóa */}
      <div className="p-2.5 bg-red-50/60 rounded-xl border border-red-200/80 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-zinc-500 font-mono">Tên xe: </span>
          <strong className="text-zinc-900 font-bold">
            {newVehicleForm.hangXe} {newVehicleForm.dongXe === 'Khác' ? (newVehicleForm.customDongXe || '(Chưa nhập tên)') : newVehicleForm.dongXe} {newVehicleForm.dongCo}
          </strong>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
          ✓ Chuẩn hóa
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700">Biển số xe <span className="text-red-600">*</span></label>
            <span className="text-[10px] text-zinc-400 font-mono">VD: 51K - 123.45</span>
          </div>
          <input
            type="text"
            placeholder="Gõ biển số: 51k12345 hoặc 59F123456"
            value={newVehicleForm.bienSo}
            onChange={e => {
              const formatted = formatVietnameseLicensePlate(e.target.value);
              setNewVehicleForm({ ...newVehicleForm, bienSo: formatted });
              if (newVehicleErrors.bienSo) setNewVehicleErrors({ ...newVehicleErrors, bienSo: '' });
            }}
            className={`w-full p-2.5 rounded-xl border text-xs bg-white font-mono uppercase focus:outline-none focus:border-red-600 ${
              newVehicleErrors.bienSo ? 'border-red-500 bg-red-50/20' : 'border-zinc-300'
            }`}
          />
          {newVehicleErrors.bienSo && <p className="text-[11px] text-red-600 mt-1 font-semibold">{newVehicleErrors.bienSo}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700">Số khung (VIN)</label>
            <span className="text-[10px] text-zinc-400 font-medium">(Không bắt buộc)</span>
          </div>
          <input
            type="text"
            placeholder="VD: RLHKC110JA1234567 (nếu có)"
            value={newVehicleForm.soKhung}
            onChange={e => setNewVehicleForm({ ...newVehicleForm, soKhung: e.target.value.toUpperCase() })}
            className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white font-mono uppercase focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1 text-zinc-700">Màu sắc</label>
          <input
            type="text"
            placeholder="VD: Đen nhám, Đỏ đen..."
            value={newVehicleForm.mauSac}
            onChange={e => setNewVehicleForm({ ...newVehicleForm, mauSac: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-zinc-700">Năm sản xuất</label>
          <input
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            value={newVehicleForm.namSanXuat}
            onChange={e => setNewVehicleForm({ ...newVehicleForm, namSanXuat: Number(e.target.value) })}
            className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
          />
        </div>
      </div>
    </div>
  );

  // ── MÀN HÌNH XÁC NHẬN ĐẶT LỊCH THÀNH CÔNG ──
  if (submitted && lastBookedSummary) {
    const svcObj = services.find(s => s.key === lastBookedSummary.svc);
    return (
      <div className="min-h-screen py-12 px-4 flex flex-col items-center justify-center bg-zinc-50">
        <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-lg w-full border border-zinc-200 shadow-xl text-center animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl mx-auto mb-5 border-2 border-emerald-400">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
            ĐẶT LỊCH HẸN THÀNH CÔNG!
          </h2>
          <p className="text-xs text-zinc-500 mt-2 mb-6 leading-relaxed">
            Hệ thống đã tiếp nhận lịch hẹn của bạn và chuyển tới bộ phận kỹ thuật viên. Showroom sẽ liên hệ qua số điện thoại để xác nhận trong 15 phút.
          </p>

          <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200 text-left space-y-3 mb-6 text-xs">
            <div className="flex justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500 font-semibold">Loại dịch vụ:</span>
              <span className="font-bold text-zinc-900">{svcObj?.label}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500 font-semibold">Phương tiện:</span>
              <span className="font-bold text-zinc-900">{lastBookedSummary.vehicleName} ({lastBookedSummary.plate})</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-zinc-200">
              <span className="text-zinc-500 font-semibold">Thời gian hẹn:</span>
              <span className="font-bold text-red-700 font-mono">{lastBookedSummary.date} lúc {lastBookedSummary.time}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-zinc-500 font-semibold">Chi phí ước tính:</span>
              <span className="font-extrabold text-red-700 font-mono text-sm">
                {lastBookedSummary.cost > 0 ? formatVND(lastBookedSummary.cost) : 'Miễn phí'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full py-3.5 rounded-xl text-xs font-extrabold bg-zinc-950 text-white hover:bg-zinc-800 transition shadow cursor-pointer uppercase tracking-wider"
          >
            ĐẶT THÊM LỊCH HẸN KHÁC
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* ── Hero Banner ── */}
      <div className="py-10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold uppercase mb-3">
            <span>📅</span> HỆ THỐNG ĐẶT LỊCH DỊCH VỤ TRỰC TUYẾN
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            ĐẶT LỊCH DỊCH VỤ & LÁI THỬ XE
          </h1>
          <p className="mt-2 text-zinc-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Chủ động đặt lịch trước để được tiếp đón ưu tiên, giảm thời gian chờ đợi và nhận tư vấn chuyên sâu từ đội ngũ kỹ thuật viên tay nghề cao.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitBooking} className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 text-sm">✕</button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            1. BƯỚC 1: CHỌN LOẠI DỊCH VỤ (3 Cards Highlight)
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">1</span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              CHỌN LOẠI DỊCH VỤ
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mb-5 ml-10">Bạn muốn đặt lịch cho dịch vụ nào tại đại lý?</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map(s => {
              const active = svc === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSvc(s.key)}
                  className={`relative p-5 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer border-2 ${
                    active
                      ? 'border-red-700 bg-red-50/50 shadow-md transform -translate-y-0.5'
                      : 'border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300'
                  }`}
                >
                  {active && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-700 text-white text-[10px] font-bold font-mono">
                      ✓ ĐANG CHỌN
                    </span>
                  )}
                  <div>
                    <span className="text-3xl mb-3 block">{s.icon}</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 font-mono"
                      style={{ background: s.bg, color: s.color }}>
                      {s.badge}
                    </span>
                    <h3 className="font-bold text-sm text-zinc-900">{s.label}</h3>
                    <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{s.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-[11px] font-mono text-zinc-600">
                    <span>⏱ Thời gian dự kiến:</span>
                    <strong className="text-zinc-800">{s.time}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            2. BƯỚC 2: THÔNG TIN KHÁCH HÀNG (Auto-fill / Yêu cầu login)
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">2</span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              THÔNG TIN KHÁCH HÀNG
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mb-4 ml-10">Thông tin người liên hệ và xác nhận lịch hẹn</p>

          {!currentCustomer ? (
            /* Khi chưa đăng nhập */
            <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔒</span>
                <div>
                  <div className="text-xs font-bold text-amber-950 uppercase font-mono">BẠN CHƯA ĐĂNG NHẬP TÀI KHOẢN</div>
                  <div className="text-xs text-amber-800 mt-0.5">Vui lòng đăng nhập để hệ thống tự động lưu lịch hẹn và quản lý bảo hành phương tiện.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('crm-open-login'))}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 shadow transition cursor-pointer"
              >
                ĐĂNG NHẬP NGAY
              </button>
            </div>
          ) : (
            /* Khi đã đăng nhập -> Auto-fill */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-emerald-950">
                    Tài khoản đã xác thực: <strong className="font-bold">{currentCustomer.hoTen}</strong> ({currentCustomer.id})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Tự động liên kết hồ sơ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Họ và tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.hoTen}
                    onChange={e => setContactForm({ ...contactForm, hoTen: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Số điện thoại liên hệ *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.soDienThoai}
                    onChange={e => setContactForm({ ...contactForm, soDienThoai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Địa chỉ khách hàng</label>
                  <input
                    type="text"
                    value={contactForm.diaChi}
                    onChange={e => setContactForm({ ...contactForm, diaChi: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            3. BƯỚC 3: CHỌN XE (Tùy biến theo Bảo dưỡng / Sửa chữa / Lái thử)
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">3</span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {svc === 'LaiThu' ? 'CHỌN MẪU XE LÁI THỬ' : 'CHỌN PHƯƠNG TIỆN CỦA BẠN'}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mb-5 ml-10">
            {svc === 'LaiThu'
              ? 'Chọn mẫu xe bạn muốn trải nghiệm thực tế trên đường thử của đại lý'
              : 'Chọn xe đã đăng ký hoặc thêm xe mới để kỹ thuật viên chuẩn bị phụ tùng tương thích'}
          </p>

          {/* ── 3A. BẢO DƯỠNG: Chọn xe sở hữu hoặc Thêm xe mới ── */}
          {svc === 'BaoDuong' && (
            <div>
              {myVehicles.length > 0 && !isAddingNewVehicle ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-zinc-700">Xe đã có trong tài khoản của bạn:</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewVehicle(true)}
                      className="text-xs font-bold text-red-700 hover:text-red-800 transition cursor-pointer"
                    >
                      + Thêm xe khác để bảo dưỡng
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myVehicles.map(v => {
                      const sel = selectedVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            sel ? 'border-red-700 bg-red-50/50 shadow-sm' : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-extrabold text-sm text-zinc-900">{v.tenXe}</span>
                            {sel && <span className="px-2 py-0.5 rounded-full bg-red-700 text-white text-[10px] font-bold font-mono">✓ Đã chọn</span>}
                          </div>
                          <div className="text-xs font-mono text-zinc-600 space-y-0.5">
                            <div>Biển số: <strong className="text-zinc-800">{v.bienSo}</strong></div>
                            <div>Năm SX: {v.namSanXuat} · Màu: {v.mauSac}</div>
                            <div>Bảo hành: <span className={v.trangThaiBaoHanh === 'ConHan' ? 'text-emerald-700 font-bold' : 'text-zinc-400'}>{v.hanBaoHanh}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                renderNewVehicleInputs('THÊM XE MỚI ĐỂ BẢO DƯỠNG')
              )}
            </div>
          )}

          {/* ── 3B. SỬA CHỮA: Chọn xe, Tình trạng (checkbox nhiều), Mô tả & Upload ảnh/video ── */}
          {svc === 'SuaChua' && (
            <div className="space-y-5">
              {/* Chọn xe đang sửa */}
              {myVehicles.length > 0 && !isAddingNewVehicle ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-700">Chọn xe đang gặp sự cố:</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewVehicle(true)}
                      className="text-xs font-bold text-red-700 hover:text-red-800"
                    >
                      + Nhập thông tin xe khác
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myVehicles.map(v => {
                      const sel = selectedVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                            sel ? 'border-red-700 bg-red-50/50 shadow-sm' : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-sm text-zinc-900">
                            <span>{v.tenXe}</span>
                            {sel && <span className="text-[10px] font-mono text-red-700">✓ Đang chọn</span>}
                          </div>
                          <div className="text-xs font-mono text-zinc-500 mt-1">Biển số: {v.bienSo}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                renderNewVehicleInputs('NHẬP THÔNG TIN XE GẶP SỰ CỐ')
              )}

              {/* Tình trạng xe (Checkbox chọn nhiều) */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 uppercase mb-2">
                  Tình trạng xe hiện tại (Chọn các triệu chứng đang gặp phải):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {repairIssuesList.map(issue => {
                    const checked = selectedIssues.includes(issue);
                    return (
                      <label
                        key={issue}
                        onClick={() => toggleIssue(issue)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer text-xs ${
                          checked
                            ? 'border-red-700 bg-red-50 text-red-950 font-bold shadow-2xs'
                            : 'border-zinc-200 bg-zinc-50/50 hover:bg-white text-zinc-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                        />
                        <span>{issue}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Mô tả vấn đề chi tiết */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mô tả chi tiết vấn đề / Yêu cầu cụ thể:
                </label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={e => setProblemDescription(e.target.value)}
                  placeholder="VD: Xe chạy tầm 40km/h bị giật cục, sáng ra đề máy rất khó nổ, tiếng kêu lạch cạch ở phía bên lốc nồi..."
                  className="w-full p-3 rounded-2xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 resize-none"
                />
              </div>

              {/* Đính kèm hình ảnh / video */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-xs font-bold text-zinc-800 uppercase">
                    Đính kèm hình ảnh / Video hiện trường hỏng hóc:
                  </label>
                  <span className="text-[11px] text-zinc-500">Hỗ trợ ảnh JPG, PNG hoặc video MP4</span>
                </div>

                {/* Ẩn input file thật để nút bấm kích hoạt */}
                <input
                  type="file"
                  ref={mediaFileInputRef}
                  onChange={handleMediaFilesUpload}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />

                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    type="button"
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <span>📁</span>
                    <span>+ Thêm tệp</span>
                  </button>
                  <div className="flex-1 flex gap-2 min-w-[220px]">
                    <input
                      type="text"
                      placeholder="Hoặc dán URL hình ảnh/video..."
                      value={newMediaInput}
                      onChange={e => setNewMediaInput(e.target.value)}
                      className="flex-1 p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedia}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition cursor-pointer"
                    >
                      Thêm link
                    </button>
                  </div>
                </div>

                {/* Danh sách ảnh/video preview */}
                {uploadedMediaList.length > 0 && (
                  <div className="flex gap-2.5 flex-wrap pt-2">
                    {uploadedMediaList.map((mediaUrl, idx) => {
                      const isVideo = mediaUrl.startsWith('data:video') || mediaUrl.includes('.mp4');
                      return (
                        <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-zinc-300 bg-white shadow-2xs">
                          {isVideo ? (
                            <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-white text-[10px]">
                              <span className="text-base">🎬</span>
                              <span>Video</span>
                            </div>
                          ) : (
                            <img src={mediaUrl} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => setUploadedMediaList(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute inset-0 bg-red-700/80 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            ✕ Xóa
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 3C. LÁI THỬ: Chọn xe lái thử dạng card ── */}
          {svc === 'LaiThu' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {testDriveVehicles.map(v => {
                const sel = selectedTestDriveId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedTestDriveId(v.id)}
                    className={`rounded-2xl border-2 overflow-hidden transition-all cursor-pointer flex flex-col justify-between ${
                      sel ? 'border-red-700 ring-2 ring-red-700/20 shadow-md bg-red-50/20' : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="h-32 w-full overflow-hidden relative">
                      <img src={v.hinhAnh} alt={v.tenXe} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      {sel && (
                        <div className="absolute top-2 right-2 bg-red-700 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-full shadow">
                          ✓ ĐÃ CHỌN
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase">{v.hang} · {v.phanKhuc}</div>
                        <h4 className="font-extrabold text-xs text-zinc-900 mt-0.5">{v.tenXe}</h4>
                        <div className="text-[11px] text-zinc-500 mt-1 leading-tight">{v.dongCo}</div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-mono">Giá niêm yết:</span>
                        <span className="text-xs font-bold text-red-700 font-mono">{formatVND(v.gia)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            4. BƯỚC 4: CHỌN DỊCH VỤ CHI TIẾT
               - Bảo dưỡng: Chọn gói bảo dưỡng
               - Sửa chữa: Checkbox dịch vụ cụ thể + Chọn phụ tùng từ kho web
               - Lái thử: Yêu cầu cung cấp Giấy phép lái xe (GPLX)
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">4</span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {svc === 'BaoDuong' && 'CHỌN GÓI BẢO DƯỠNG ĐỊNH KỲ'}
              {svc === 'SuaChua' && 'HẠNG MỤC SỬA CHỮA & CHỌN PHỤ TÙNG TỪ KHO'}
              {svc === 'LaiThu' && 'XÁC THỰC GIẤY PHÉP LÁI XE (GPLX)'}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mb-5 ml-10">
            {svc === 'BaoDuong' && 'Lựa chọn gói bảo dưỡng theo số km đã đi để xe vận hành an toàn và bền bỉ'}
            {svc === 'SuaChua' && 'Tích chọn các hạng mục cần can thiệp kỹ thuật và chọn trước phụ tùng chính hãng'}
            {svc === 'LaiThu' && 'Quy định an toàn: Khách hàng cần có bằng lái xe máy hợp lệ để tham gia chạy thử'}
          </p>

          {/* ── 4A. BẢO DƯỠNG: Danh sách gói bảo dưỡng ── */}
          {svc === 'BaoDuong' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {maintenancePackages.map(pkg => {
                const sel = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      sel ? 'border-red-700 bg-red-50/50 shadow-md ring-2 ring-red-700/10' : 'border-zinc-200 bg-zinc-50/40 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                          style={{ background: `${pkg.color}15`, color: pkg.color }}>
                          {pkg.badge}
                        </span>
                        {sel && <span className="text-xs font-bold text-red-700">✓ Đang chọn</span>}
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-900">{pkg.tenGoi}</h4>
                      <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{pkg.moTa}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-500">⏱ Thời gian: {pkg.thoiGian}</span>
                      <span className="font-extrabold text-red-700 text-sm">{formatVND(pkg.gia)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 4B. SỬA CHỮA: Checkbox dịch vụ cụ thể + Chọn phụ tùng từ kho ── */}
          {svc === 'SuaChua' && (
            <div className="space-y-6">
              {/* Checkbox dịch vụ sửa cụ thể */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 uppercase mb-2">
                  1. Chọn các hạng mục sửa chữa & kiểm tra chuyên sâu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {specificRepairServices.map(item => {
                    const checked = selectedSpecificServices.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSpecificService(item.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition cursor-pointer text-xs ${
                          checked
                            ? 'border-red-700 bg-red-50 font-semibold text-red-950 shadow-2xs'
                            : 'border-zinc-200 bg-zinc-50/50 hover:bg-white text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={checked} onChange={() => {}} className="rounded text-red-600" />
                          <span>{item.ten}</span>
                        </div>
                        <span className="font-mono text-[11px] text-red-700 shrink-0 font-bold">{formatVND(item.gia)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chọn phụ tùng từ kho hàng trên web */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 uppercase font-mono">2. PHỤ TÙNG CHÍNH HÃNG KÈM THEO ĐƠN</span>
                    <p className="text-[11px] text-zinc-500">Chọn phụ tùng (nhớt, lọc gió, bố phanh, bugi, lốp...) để kỹ thuật viên chuẩn bị trước</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPartsModal(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition shadow cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📦</span>
                    <span>+ CHỌN PHỤ TÙNG TỪ KHO</span>
                  </button>
                </div>

                {/* Danh sách phụ tùng đã chọn */}
                {selectedParts.length === 0 ? (
                  <div className="p-4 bg-white rounded-xl border border-dashed border-zinc-300 text-center text-xs text-zinc-400">
                    Chưa có phụ tùng nào được chọn kèm. Nhấn nút <strong>"+ CHỌN PHỤ TÙNG TỪ KHO"</strong> nếu bạn cần mua trước phụ tùng thay thế.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedParts.map(item => {
                      const price = item.part.giaKhuyenMai || item.part.giaGoc;
                      return (
                        <div key={item.part.id} className="p-3 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={item.part.hinhAnh} alt={item.part.tenSanPham} className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0" />
                            <div className="truncate">
                              <div className="font-bold text-zinc-900 truncate">{item.part.tenSanPham}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">{item.part.thuongHieu} · {item.part.danhMuc}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 font-mono">
                            <span className="font-bold text-zinc-800">x{item.quantity}</span>
                            <span className="font-bold text-red-700">{formatVND(price * item.quantity)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(item.part.id)}
                              className="text-zinc-400 hover:text-red-600 font-bold px-1 text-sm cursor-pointer"
                              title="Xóa phụ tùng"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 4C. LÁI THỬ: Yêu cầu cung cấp Giấy phép lái xe (GPLX) ── */}
          {svc === 'LaiThu' && (
            <div className="space-y-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-200">
              <div className="flex items-center gap-2.5 text-xs font-bold text-blue-950 uppercase font-mono">
                <span>🪪</span> THÔNG TIN GIẤY PHÉP LÁI XE HỢP LỆ
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Số GPLX (Bằng lái xe) *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 790123456789"
                    value={licenseForm.soGPLX}
                    onChange={e => setLicenseForm({ ...licenseForm, soGPLX: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Hạng bằng lái xe *</label>
                  <select
                    value={licenseForm.hangBang}
                    onChange={e => setLicenseForm({ ...licenseForm, hangBang: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600"
                  >
                    <option value="A1">Hạng A1 (Dung tích xi lanh từ 50cc đến dưới 175cc)</option>
                    <option value="A2">Hạng A2 (Dung tích xi lanh từ 175cc trở lên - Xe phân khối lớn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <ImageUploader
                  value={licenseForm.anhMatTruoc}
                  onChange={url => setLicenseForm({ ...licenseForm, anhMatTruoc: url })}
                  label="Ảnh chụp mặt trước GPLX"
                />
                <ImageUploader
                  value={licenseForm.anhMatSau}
                  onChange={url => setLicenseForm({ ...licenseForm, anhMatSau: url })}
                  label="Ảnh chụp mặt sau GPLX"
                />
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            5. BƯỚC 5: CHỌN NGÀY GIỜ & XÁC NHẬN (Scheduling & Summary)
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">5</span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              CHỌN THỜI GIAN & XÁC NHẬN LỊCH HẸN
            </h2>
          </div>
          <p className="text-xs text-zinc-500 ml-10">Showroom phục vụ từ Thứ 2 đến Thứ 7 (08:00 - 17:00)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Chọn ngày hẹn */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Ngày hẹn mong muốn *</label>
              <input
                type="date"
                required
                min={today}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 font-mono"
              />
            </div>

            {/* Chọn khung giờ */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Khung giờ tiếp nhận xe *</label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(t => {
                  const sel = time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                        sel
                          ? 'bg-red-700 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ghi chú thêm */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Ghi chú thêm gửi thợ kỹ thuật (nếu có):</label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
              placeholder="VD: Nhờ kiểm tra kỹ giùm ốc sườn xe, cần lấy xe trước 16h..."
              className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 resize-none"
            />
          </div>

          {/* ── BẢNG TÓM TẮT LỊCH HẸN DỰ KIẾN ── */}
          <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-3 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                📋 TỔNG HỢP PHIẾU ĐẶT LỊCH
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {date && time ? `${date} @ ${time}` : 'Chưa chọn thời gian'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Dịch vụ:</span>
                <span className="font-bold text-white">{services.find(s => s.key === svc)?.label}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">Phương tiện:</span>
                <span className="font-bold text-white">
                  {svc === 'LaiThu'
                    ? testDriveVehicles.find(v => v.id === selectedTestDriveId)?.tenXe
                    : isAddingNewVehicle
                    ? `${newVehicleForm.hangXe} ${newVehicleForm.dongXe === 'Khác' ? (newVehicleForm.customDongXe || 'Khác') : newVehicleForm.dongXe} ${newVehicleForm.dongCo} (${newVehicleForm.bienSo || 'Chưa biển'})`
                    : myVehicles.find(v => v.id === selectedVehicleId)?.tenXe || 'Chưa chọn xe'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Ước tính chi phí dịch vụ:</span>
                <div className="text-[10px] text-zinc-500">(Chi phí thực tế có thể thay đổi sau khi kỹ thuật viên kiểm tra trực tiếp)</div>
              </div>
              <div className="text-lg font-extrabold text-red-500 font-mono">
                {estimatedTotalCost > 0 ? formatVND(estimatedTotalCost) : '0₫ (Miễn phí lái thử)'}
              </div>
            </div>
          </div>

          {/* Nút xác nhận đặt lịch */}
          <button
            type="submit"
            disabled={isSubmitting || !currentCustomer}
            className={`w-full py-4 rounded-2xl font-extrabold text-white text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
              !currentCustomer
                ? 'bg-zinc-400 cursor-not-allowed'
                : isSubmitting
                ? 'bg-zinc-700'
                : 'bg-red-700 hover:bg-red-800 active:scale-[0.99]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>🚀</span>
            <span>{isSubmitting ? 'ĐANG GỬI LỊCH HẸN...' : 'XÁC NHẬN ĐẶT LỊCH HẸN NGAY'}</span>
          </button>
        </div>
      </form>

      {/* ── MODAL CHỌN PHỤ TÙNG TỪ KHO HÀNG WEB (Step 4 - Sửa chữa) ── */}
      {showPartsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-extrabold text-base text-zinc-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  CHỌN PHỤ TÙNG TỪ KHO HÀNG MOTOSHOP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPartsModal(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Search & Category Filter */}
            <div className="py-3 flex gap-2">
              <input
                type="text"
                placeholder="Tìm tên phụ tùng, thương hiệu..."
                value={partSearch}
                onChange={e => setPartSearch(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-zinc-300 text-xs bg-zinc-50 focus:bg-white focus:outline-none focus:border-red-600"
              />
              <select
                value={partCategory}
                onChange={e => setPartCategory(e.target.value)}
                className="p-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none"
              >
                <option value="ALL">Tất cả danh mục</option>
                <option value="Nhớt">Dầu nhớt</option>
                <option value="Lọc">Lọc gió / Nhớt</option>
                <option value="Phanh">Bố phanh / Đĩa</option>
                <option value="Bugi">Bugi</option>
                <option value="Lốp xe">Lốp xe</option>
              </select>
            </div>

            {/* List of parts */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 pr-1 space-y-2">
              {availableParts
                .filter(p => {
                  const matchTxt = p.tenSanPham.toLowerCase().includes(partSearch.toLowerCase()) ||
                    p.thuongHieu.toLowerCase().includes(partSearch.toLowerCase());
                  const matchCat = partCategory === 'ALL' || p.danhMuc === partCategory;
                  return matchTxt && matchCat;
                })
                .map(part => {
                  const price = part.giaKhuyenMai || part.giaGoc;
                  const addedItem = selectedParts.find(p => p.part.id === part.id);
                  return (
                    <div key={part.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={part.hinhAnh} alt={part.tenSanPham} className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 truncate">{part.tenSanPham}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{part.thuongHieu} · Tồn kho: {part.soLuongTon}</div>
                          <div className="text-red-700 font-bold font-mono mt-0.5">{formatVND(price)}</div>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {addedItem && (
                          <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Đã chọn: x{addedItem.quantity}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddPartToBooking(part)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-red-700 transition cursor-pointer"
                        >
                          + Thêm
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
              <span className="text-xs text-zinc-500 font-mono">Đã chọn: {selectedParts.length} mặt hàng</span>
              <button
                type="button"
                onClick={() => setShowPartsModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-700 text-white hover:bg-red-800 transition"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
