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
  type Appointment,
  mockParts,
  mockAppointments,
} from '../../data/mockData';
import { appointmentApi, vehicleApi, partApi, addCustomerNotification, catalogVehicleApi, DEFAULT_CATALOG_VEHICLES, type CatalogVehicle } from '../../services/api';
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

// ── Danh sách mẫu xe lái thử ban đầu (Fallback nếu chưa load được Catalog) ──
const defaultTestDriveVehicles = [
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
  'Chưa xác định, cần kiểm tra',
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
  onNavigateToDashboard?: () => void;
}

export default function ServiceBooking({
  initialVehicleId,
  currentCustomer,
  onCustomerChange,
  onNavigateToDashboard,
}: ServiceBookingProps) {
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
    soMay: '',
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

  // LH18: Tải danh sách xe mẫu từ catalog và bộ lọc tìm kiếm
  const [catalogVehicles, setCatalogVehicles] = useState<CatalogVehicle[]>(() => {
    try {
      const all = catalogVehicleApi.getAllSync();
      const eligible = all.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
      return eligible.length > 0 ? eligible : DEFAULT_CATALOG_VEHICLES.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
    } catch {
      return DEFAULT_CATALOG_VEHICLES.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
    }
  });
  const [testDriveSearch, setTestDriveSearch] = useState('');
  const [testDriveBrandFilter, setTestDriveBrandFilter] = useState('ALL');
  const [showAllVehicles, setShowAllVehicles] = useState(false);

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
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [existingAppts, setExistingAppts] = useState<Appointment[]>(mockAppointments);

  // Cảnh báo trùng lịch hẹn lái thử cùng ngày khác giờ
  const [duplicateConfirmModal, setDuplicateConfirmModal] = useState<{
    open: boolean;
    existingTime: string;
    vehicleName: string;
    onProceed: () => void;
  } | null>(null);

  // LH09: Kiểm tra ngày Chủ nhật (0 là Chủ nhật)
  const isSundayDate = (dStr: string) => {
    if (!dStr) return false;
    const [y, m, d] = dStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getDay() === 0;
  };

  const today = new Date().toISOString().split('T')[0];

  // Tải danh sách lịch hẹn hiện có trong hệ thống để kiểm tra trùng lịch (LH04)
  useEffect(() => {
    const loadAppts = () => {
      appointmentApi.getAll().then(data => {
        if (data && data.length > 0) setExistingAppts(data);
      });
    };
    loadAppts();
    window.addEventListener('crm-data-refresh', loadAppts);
    return () => window.removeEventListener('crm-data-refresh', loadAppts);
  }, []);

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
    // LH18: Tải danh sách xe mẫu showroom cho phép lái thử
    catalogVehicleApi.getAll().then(data => {
      if (data && data.length > 0) {
        const eligible = data.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
        if (eligible.length > 0) setCatalogVehicles(eligible);
      }
    }).catch(() => {});
  }, []);

  // LH18: Danh sách toàn bộ xe lái thử kết hợp từ Catalog
  const allTestDriveVehicles = useMemo(() => {
    const source = catalogVehicles.length > 0 ? catalogVehicles : DEFAULT_CATALOG_VEHICLES.filter(v => v.coTheLaiThu !== false && v.trangThaiHienThi !== 'An');
    const mapped = source.map(v => ({
      id: v.id,
      tenXe: v.tenXe,
      hang: v.hang,
      phanKhuc: v.phanKhuc,
      gia: v.giaNiemYet || 0,
      dongCo: v.dongCo || v.loaiDongCo || v.dungTichXiLanh || `${v.hang} ${v.phanKhuc}`,
      hinhAnh: v.hinhAnh || 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
      sanSang: true,
    }));
    return mapped.length > 0 ? mapped : defaultTestDriveVehicles;
  }, [catalogVehicles]);

  // LH18: Tự động ánh xạ thông minh mẫu xe lái thử từ Showroom (XM-HD01 <-> XM001)
  useEffect(() => {
    if (initialVehicleId && allTestDriveVehicles.length > 0) {
      const match = allTestDriveVehicles.find(v => 
        v.id === initialVehicleId || 
        v.id.toLowerCase() === initialVehicleId.toLowerCase() ||
        (initialVehicleId.includes('-') && v.id.replace(/\D/g, '') === initialVehicleId.replace(/\D/g, ''))
      );
      if (match) {
        setSelectedTestDriveId(match.id);
      } else {
        const cleanInit = initialVehicleId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameMatch = allTestDriveVehicles.find(v => {
          const vClean = v.tenXe.toLowerCase().replace(/[^a-z0-9]/g, '');
          return vClean.includes(cleanInit) || cleanInit.includes(vClean);
        });
        if (nameMatch) {
          setSelectedTestDriveId(nameMatch.id);
        }
      }
    }
  }, [initialVehicleId, allTestDriveVehicles]);

  // Danh sách các hãng xe có trong hệ thống để tạo bộ lọc nhanh
  const availableBrands = useMemo(() => {
    const brands = Array.from(new Set(allTestDriveVehicles.map(v => v.hang).filter(Boolean)));
    return brands;
  }, [allTestDriveVehicles]);

  // Danh sách xe sau khi lọc theo hãng và từ khóa tìm kiếm
  const filteredTestDriveVehicles = useMemo(() => {
    return allTestDriveVehicles.filter(v => {
      if (testDriveBrandFilter !== 'ALL' && v.hang.toLowerCase() !== testDriveBrandFilter.toLowerCase()) {
        return false;
      }
      if (testDriveSearch.trim()) {
        const q = testDriveSearch.toLowerCase().trim();
        const matchName = v.tenXe.toLowerCase().includes(q);
        const matchBrand = v.hang.toLowerCase().includes(q);
        const matchSegment = v.phanKhuc.toLowerCase().includes(q);
        const matchEngine = (v.dongCo || '').toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchSegment && !matchEngine) return false;
      }
      return true;
    });
  }, [allTestDriveVehicles, testDriveBrandFilter, testDriveSearch]);

  // Danh sách xe hiển thị (Mặc định 6 xe, hoặc hiển thị tất cả khi bấm xem thêm hoặc tìm kiếm)
  const displayedVehicles = useMemo(() => {
    if (showAllVehicles || testDriveSearch.trim() || testDriveBrandFilter !== 'ALL') {
      return filteredTestDriveVehicles;
    }
    return filteredTestDriveVehicles.slice(0, 6);
  }, [filteredTestDriveVehicles, showAllVehicles, testDriveSearch, testDriveBrandFilter]);

  // Tính tổng chi phí dịch vụ ước tính (LH15: Sửa chữa kiểm tra trực tiếp và báo giá tại showroom)
  const estimatedTotalCost = useMemo(() => {
    if (svc === 'BaoDuong') {
      const pkg = maintenancePackages.find(p => p.id === selectedPackageId);
      return pkg ? pkg.gia : 0;
    }
    if (svc === 'SuaChua') {
      return 0; // Kỹ thuật viên kiểm tra trực tiếp và báo giá tại showroom
    }
    return 0; // Lái thử miễn phí
  }, [svc, selectedPackageId]);

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
    setContactErrors({});
    setErrorMessage(null);
    setSubmitted(false);
  };

  // Chuẩn hóa biển số để so khớp chính xác
  const normalizePlate = (p?: string) => (p || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // LH02 & LH03: Ràng buộc thời gian hẹn (Không quá khứ, tối thiểu trước 3 tiếng nếu cùng ngày)
  const checkSlotValidity = (slotTime: string, selectedDate: string) => {
    if (!selectedDate) return { valid: true, reason: '' };

    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate < todayStr) {
      return { valid: false, reason: 'Ngày hẹn đã trôi qua trong quá khứ!' };
    }

    if (selectedDate === todayStr) {
      const now = new Date();
      const [slotH, slotM] = slotTime.split(':').map(Number);
      const slotDate = new Date();
      slotDate.setHours(slotH, slotM, 0, 0);

      const diffMs = slotDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours <= 0) {
        return { valid: false, reason: 'Khung giờ này đã trôi qua so với hiện tại!' };
      }
      if (diffHours < 3) {
        return { valid: false, reason: 'Cần đặt lịch trước ít nhất 3 tiếng' };
      }
    }

    return { valid: true, reason: '' };
  };

  // LH04: Kiểm tra trùng lịch hẹn của cùng một xe vào cùng ngày và khung giờ
  // Yêu cầu: Không ẩn khung giờ lái thử đã đặt để các tài khoản khác vẫn có thể lựa chọn
  const isSlotBookedForVehicle = (slotTime: string) => {
    if (!date) return false;
    if (svc === 'LaiThu') {
      return false; // Giữ nguyên danh sách khung giờ lái thử, không ẩn/khóa trên giao diện
    }
    return existingAppts.some(a => {
      if (a.trangThai === 'DaHuy' || a.trangThai === 'TuChoi') return false;
      if (a.ngayHen !== date || a.gioHen !== slotTime) return false;

      const targetPlate = !isAddingNewVehicle && selectedVehicleId 
        ? myVehicles.find(v => v.id === selectedVehicleId)?.bienSo 
        : newVehicleForm.bienSo;
      const targetVehicleName = !isAddingNewVehicle && selectedVehicleId
        ? myVehicles.find(v => v.id === selectedVehicleId)?.tenXe
        : `${newVehicleForm.hangXe} ${newVehicleForm.dongXe === 'Khác' ? newVehicleForm.customDongXe : newVehicleForm.dongXe}`;

      const normA = normalizePlate(a.bienSo);
      const normTarget = normalizePlate(targetPlate);
      if (normA && normTarget && normA === normTarget) return true;

      if (currentCustomer && a.customerId === currentCustomer.id && a.tenXe && targetVehicleName) {
        if (a.tenXe.toLowerCase().trim() === targetVehicleName.toLowerCase().trim()) return true;
      }

      return false;
    });
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

    // LH08 & LH05 & LH09: Thu thập toàn bộ các trường không hợp lệ
    const errs: Record<string, string> = {};
    const trimmedHoTen = contactForm.hoTen.trim();
    const trimmedPhone = contactForm.soDienThoai.trim().replace(/\s/g, '');
    const trimmedEmail = contactForm.email.trim();

    // 1. Thông tin liên hệ
    if (!trimmedHoTen) {
      errs['field-contact-hoten'] = 'Họ và tên khách hàng không được để trống!';
    }
    if (!trimmedPhone) {
      errs['field-contact-phone'] = 'Số điện thoại liên hệ không được để trống!';
    } else if (!/^0\d{9}$/.test(trimmedPhone)) {
      errs['field-contact-phone'] = 'Số điện thoại không hợp lệ! Phải gồm đúng 10 chữ số và bắt đầu bằng số 0.';
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs['field-contact-email'] = 'Địa chỉ email không đúng định dạng!';
    }

    // 2. Kiểm tra phương tiện
    let finalVehicleName = '';
    let finalPlate = '';

    if (svc === 'LaiThu') {
      let testCar = allTestDriveVehicles.find(v => v.id === selectedTestDriveId);
      if (!testCar && initialVehicleId) {
        testCar = allTestDriveVehicles.find(v => 
          v.id === initialVehicleId || 
          v.id.toLowerCase() === initialVehicleId.toLowerCase() ||
          (initialVehicleId.includes('-') && v.id.replace(/\D/g, '') === initialVehicleId.replace(/\D/g, ''))
        );
      }
      if (!testCar && allTestDriveVehicles.length > 0) {
        testCar = allTestDriveVehicles[0];
      }
      if (!testCar) {
        errs['field-testdrive-vehicle'] = 'Vui lòng chọn mẫu xe bạn muốn lái thử!';
      } else {
        finalVehicleName = testCar.tenXe;
        finalPlate = 'XE-LÁI-THỬ';
      }

      // LH17: Kiểm tra bắt buộc Số GPLX và Ảnh chụp GPLX
      if (!licenseForm.soGPLX.trim()) {
        errs['field-testdrive-license'] = 'Vui lòng nhập Số Giấy phép lái xe (GPLX) của bạn!';
      } else if (licenseForm.soGPLX.trim().length < 8) {
        errs['field-testdrive-license'] = 'Số GPLX không hợp lệ! Vui lòng nhập tối thiểu 8–12 chữ số.';
      }

      if (!licenseForm.anhMatTruoc) {
        errs['field-testdrive-license-img'] = 'Vui lòng tải lên ảnh chụp mặt trước Giấy phép lái xe để showroom xác thực điều kiện lái thử!';
      }
    } else {
      if (!isAddingNewVehicle && selectedVehicleId) {
        const matched = myVehicles.find(v => v.id === selectedVehicleId);
        if (matched) {
          finalVehicleName = matched.tenXe;
          finalPlate = matched.bienSo;
        } else {
          errs['field-vehicle-selection'] = 'Vui lòng chọn phương tiện để thực hiện dịch vụ!';
        }
      } else if (!isAddingNewVehicle && myVehicles.length > 0 && !selectedVehicleId) {
        errs['field-vehicle-selection'] = 'Vui lòng chọn phương tiện để thực hiện dịch vụ!';
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

        if (newVehicleForm.namSanXuat) {
          const yNum = Number(newVehicleForm.namSanXuat);
          const yStr = String(newVehicleForm.namSanXuat);
          if (yStr.length !== 4 || isNaN(yNum) || yNum < 1980 || yNum > new Date().getFullYear() + 1) {
            vErrors.namSanXuat = `Năm sản xuất không hợp lệ! Vui lòng chỉ nhập đúng 4 chữ số từ 1980 đến ${new Date().getFullYear() + 1}.`;
          }
        }

        if (Object.keys(vErrors).length > 0) {
          setNewVehicleErrors(vErrors);
          errs['field-new-vehicle'] = 'Vui lòng kiểm tra lại thông tin xe mới nhập bên dưới!';
        } else {
          setNewVehicleErrors({});
          finalVehicleName = `${newVehicleForm.hangXe} ${effectiveDongXe} ${newVehicleForm.dongCo}`.trim();
          finalPlate = formatVietnameseLicensePlate(newVehicleForm.bienSo.trim());
        }
      }
    }

    // 3. Gói bảo dưỡng nếu là Bảo dưỡng
    if (svc === 'BaoDuong' && !selectedPackageId) {
      errs['field-service-pkg'] = 'Vui lòng chọn một gói bảo dưỡng định kỳ!';
    }

    // LH14: Kiểm tra tình trạng xe bắt buộc khi đặt lịch sửa chữa
    if (svc === 'SuaChua') {
      if (selectedIssues.length === 0) {
        errs['field-repair-issues'] = 'Vui lòng chọn ít nhất một tình trạng xe hoặc triệu chứng đang gặp phải!';
      }
      if (!problemDescription.trim()) {
        errs['field-repair-desc'] = 'Vui lòng nhập mô tả chi tiết vấn đề hoặc yêu cầu cụ thể!';
      }
    }

    // 4. Ngày hẹn (LH09: Chặn Chủ nhật)
    if (!date) {
      errs['field-booking-date'] = 'Vui lòng chọn ngày hẹn tiếp nhận xe!';
    } else if (isSundayDate(date)) {
      errs['field-booking-date'] = 'Showroom không hoạt động vào Chủ nhật. Vui lòng chọn ngày khác từ thứ Hai đến thứ Bảy.';
    } else {
      const dateParts = date.split('-');
      const yearStr = dateParts[0];
      const currentYear = new Date().getFullYear();
      if (!yearStr || yearStr.length !== 4 || isNaN(Number(yearStr)) || Number(yearStr) < currentYear || Number(yearStr) > currentYear + 2) {
        errs['field-booking-date'] = `Năm hẹn không hợp lệ! Vui lòng chỉ nhập năm đúng 4 chữ số từ ${currentYear} đến ${currentYear + 2}.`;
      }
    }

    // 5. Khung giờ hẹn (LH02, LH03, LH04)
    if (!time) {
      errs['field-booking-time'] = 'Vui lòng chọn khung giờ hẹn tiếp nhận xe!';
    } else if (date && !errs['field-booking-date']) {
      const slotCheck = checkSlotValidity(time, date);
      if (!slotCheck.valid) {
        errs['field-booking-time'] = slotCheck.reason || 'Cần đặt lịch trước ít nhất 3 tiếng';
      } else {
        if (svc !== 'LaiThu') {
          const duplicateAppt = existingAppts.find(a => {
            if (a.trangThai === 'DaHuy' || a.trangThai === 'TuChoi') return false;
            if (a.ngayHen !== date || a.gioHen !== time) return false;
            const normA = normalizePlate(a.bienSo);
            const normTarget = normalizePlate(finalPlate);
            if (normA && normTarget && normA === normTarget) return true;
            if (a.customerId === currentCustomer.id && a.tenXe && finalVehicleName && a.tenXe.toLowerCase().trim() === finalVehicleName.toLowerCase().trim()) {
              return true;
            }
            return false;
          });

          if (duplicateAppt) {
            errs['field-booking-time'] = 'Xe đã có lịch hẹn vào thời gian này. Vui lòng chọn ngày hoặc giờ khác.';
          }
        }
      }
    }

    // LH08: Nếu có lỗi -> hiển thị ngay dưới trường và tự động cuộn đến trường lỗi đầu tiên
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setContactErrors({
        hoTen: errs['field-contact-hoten'] || '',
        soDienThoai: errs['field-contact-phone'] || '',
        email: errs['field-contact-email'] || '',
      });

      const priorityOrder = [
        'field-contact-hoten',
        'field-contact-phone',
        'field-contact-email',
        'field-vehicle-selection',
        'field-new-vehicle',
        'field-repair-issues',
        'field-repair-desc',
        'field-service-pkg',
        'field-testdrive-vehicle',
        'field-testdrive-license',
        'field-testdrive-license-img',
        'field-booking-date',
        'field-booking-time',
      ];
      const firstErrorId = priorityOrder.find(id => errs[id]);
      if (firstErrorId) {
        setTimeout(() => {
          const el = document.getElementById(firstErrorId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const focusable = el.querySelector('input:not([type="hidden"]), select, textarea') as HTMLElement | null;
            if (focusable && typeof focusable.focus === 'function') {
              focusable.focus();
            }
          }
        }, 50);
      }
      return;
    }

    setFormErrors({});
    setContactErrors({});

    // Tự động đăng ký xe mới nếu người dùng nhập xe mới
    if (svc !== 'LaiThu' && (isAddingNewVehicle || myVehicles.length === 0)) {
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
          soMay: newVehicleForm.soMay.trim() || undefined,
          trangThaiDuyet: 'ChoDuyet',
        });

        if (currentCustomer) {
          const updatedCust = { ...currentCustomer, soXe: registeredV.id };
          localStorage.setItem('crm_current_customer', JSON.stringify(updatedCust));
          onCustomerChange?.(updatedCust);
        }
      } catch {}
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

    const executeSubmitBooking = async (
      vName: string,
      plate: string,
      compiledNote: string,
      hoTen: string,
      phone: string
    ) => {
      setIsSubmitting(true);
      try {
        const createdAppt = await appointmentApi.create({
          customerId: currentCustomer.id,
          hoTenKH: hoTen,
          soDienThoai: phone,
          loaiDichVu: svc,
          ngayHen: date,
          gioHen: time,
          tenXe: vName,
          bienSo: plate,
          ghiChu: compiledNote,
        });

        const apptId = (createdAppt as any)?.appointment?.id || (createdAppt as any)?.id || String(createdAppt?.maLich || `LH${Date.now().toString().slice(-4)}`);

        addCustomerNotification({
          customerId: currentCustomer.id,
          icon: '📅',
          title: '📅 Đặt lịch hẹn dịch vụ thành công',
          message: `Lịch hẹn ${svc === 'BaoDuong' ? 'Bảo dưỡng định kỳ' : svc === 'LaiThu' ? 'Lái thử xe' : 'Sửa chữa'} cho xe ${vName} lúc ${time} ngày ${date} đã được gửi thành công. Showroom sẽ sớm liên hệ xác nhận!`,
          category: 'appointment',
          page: 'dashboard',
          tab: 'appts',
          targetId: apptId,
        });

        // Cập nhật lại danh sách lịch hẹn hiện có
        const freshAppts = await appointmentApi.getAll();
        setExistingAppts(freshAppts);

        setLastBookedSummary({
          id: apptId,
          svc,
          vehicleName: vName,
          plate: plate,
          date,
          time,
          cost: estimatedTotalCost,
          note: compiledNote,
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

    // Kiểm tra trùng lặp lịch hẹn lái thử (Yêu cầu 2, 3, 4, 5)
    if (svc === 'LaiThu') {
      const allCurrentAppts = appointmentApi.getAllSync();
      const cleanVehicleTarget = finalVehicleName.toLowerCase().trim();
      const cleanPhone = trimmedPhone.replace(/\D/g, '');

      const sameCustomerTestDrives = allCurrentAppts.filter(a => {
        if (a.trangThai === 'DaHuy' || a.trangThai === 'TuChoi') return false;
        if (a.loaiDichVu !== 'LaiThu') return false;
        if (a.ngayHen !== date) return false;
        const isMatchCust = a.customerId === currentCustomer.id ||
          (cleanPhone && a.soDienThoai && a.soDienThoai.replace(/\D/g, '') === cleanPhone);
        if (!isMatchCust) return false;
        return a.tenXe && a.tenXe.toLowerCase().trim() === cleanVehicleTarget;
      });

      // 1. Trùng toàn bộ thông tin (cùng xe, cùng ngày, cùng giờ):
      const sameTimeAppt = sameCustomerTestDrives.find(a => a.gioHen === time);
      if (sameTimeAppt) {
        setErrorMessage('Bạn đã đặt lịch lái thử xe này vào thời gian trên.');
        alert('Bạn đã đặt lịch lái thử xe này vào thời gian trên.');
        return; // Không tạo lịch mới
      }

      // 2. Trùng xe, trùng ngày nhưng khác giờ: Cảnh báo xác nhận đặt thêm
      const diffTimeAppt = sameCustomerTestDrives.find(a => a.gioHen !== time);
      if (diffTimeAppt) {
        setDuplicateConfirmModal({
          open: true,
          existingTime: diffTimeAppt.gioHen,
          vehicleName: finalVehicleName,
          onProceed: () => {
            setDuplicateConfirmModal(null);
            executeSubmitBooking(finalVehicleName, finalPlate, compiledGhiChu, trimmedHoTen, trimmedPhone);
          }
        });
        return;
      }
    }

    await executeSubmitBooking(finalVehicleName, finalPlate, compiledGhiChu, trimmedHoTen, trimmedPhone);
  };

  // DKX01, DKX02, DKX03: Form chuẩn hóa thông tin xe mới (Hãng, Dòng xe, Động cơ, Biển số tự format, Số khung tuỳ chọn)
  const renderNewVehicleInputs = (titleText: string) => (
    <div id="field-new-vehicle" className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700">Số máy (Engine No.)</label>
            <span className="text-[10px] text-zinc-400 font-medium">(Không bắt buộc)</span>
          </div>
          <input
            type="text"
            placeholder="VD: JF51E1234567 (nếu có)"
            value={newVehicleForm.soMay}
            onChange={e => setNewVehicleForm({ ...newVehicleForm, soMay: e.target.value.toUpperCase() })}
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
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="VD: 2024"
            value={newVehicleForm.namSanXuat || ''}
            onChange={e => {
              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
              setNewVehicleForm({
                ...newVehicleForm,
                namSanXuat: digitsOnly ? Number(digitsOnly) : ('' as any),
              });
              if (newVehicleErrors.namSanXuat) {
                setNewVehicleErrors(prev => {
                  const n = { ...prev };
                  delete n.namSanXuat;
                  return n;
                });
              }
            }}
            className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 font-mono ${
              newVehicleErrors.namSanXuat ? 'border-red-500' : 'border-zinc-300'
            }`}
          />
          {newVehicleErrors.namSanXuat && (
            <p className="text-[11px] text-red-600 mt-1 font-semibold">{newVehicleErrors.namSanXuat}</p>
          )}
        </div>
      </div>
      {formErrors['field-new-vehicle'] && (
        <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 pt-1">
          <span>⚠️</span>
          <span>{formErrors['field-new-vehicle']}</span>
        </p>
      )}
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

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('crm_client_highlight', JSON.stringify({
                  type: 'appointment',
                  id: lastBookedSummary.id,
                }));
                window.dispatchEvent(new CustomEvent('crm-client-highlight-trigger', {
                  detail: {
                    type: 'appointment',
                    id: lastBookedSummary.id,
                  }
                }));
                if (onNavigateToDashboard) {
                  onNavigateToDashboard();
                } else {
                  window.dispatchEvent(new CustomEvent('crm-data-refresh', { detail: { type: 'navigate_dashboard' } }));
                }
              }}
              className="flex-1 py-3.5 rounded-xl text-xs font-extrabold bg-red-700 text-white hover:bg-red-800 transition shadow cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>📅</span>
              <span>XEM LỊCH HẸN</span>
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="flex-1 py-3.5 rounded-xl text-xs font-extrabold bg-zinc-950 text-white hover:bg-zinc-800 transition shadow cursor-pointer uppercase tracking-wider"
            >
              ĐẶT THÊM LỊCH HẸN KHÁC
            </button>
          </div>
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
                <div id="field-contact-hoten">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Họ và tên khách hàng <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.hoTen}
                    onChange={e => {
                      setContactForm({ ...contactForm, hoTen: e.target.value });
                      if (contactErrors.hoTen) setContactErrors(prev => ({ ...prev, hoTen: '' }));
                      if (formErrors['field-contact-hoten']) setFormErrors(prev => ({ ...prev, 'field-contact-hoten': '' }));
                    }}
                    placeholder="VD: Nguyễn Văn A"
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
                      (contactErrors.hoTen || formErrors['field-contact-hoten']) ? 'border-red-500 bg-red-50/20 ring-2 ring-red-500/20' : 'border-zinc-300'
                    }`}
                  />
                  {(contactErrors.hoTen || formErrors['field-contact-hoten']) && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{contactErrors.hoTen || formErrors['field-contact-hoten']}</span>
                    </p>
                  )}
                </div>
                <div id="field-contact-phone">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.soDienThoai}
                    onChange={e => {
                      setContactForm({ ...contactForm, soDienThoai: e.target.value });
                      if (contactErrors.soDienThoai) setContactErrors(prev => ({ ...prev, soDienThoai: '' }));
                      if (formErrors['field-contact-phone']) setFormErrors(prev => ({ ...prev, 'field-contact-phone': '' }));
                    }}
                    placeholder="VD: 0912345678"
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 font-mono ${
                      (contactErrors.soDienThoai || formErrors['field-contact-phone']) ? 'border-red-500 bg-red-50/20 ring-2 ring-red-500/20' : 'border-zinc-300'
                    }`}
                  />
                  {(contactErrors.soDienThoai || formErrors['field-contact-phone']) && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{contactErrors.soDienThoai || formErrors['field-contact-phone']}</span>
                    </p>
                  )}
                </div>
                <div id="field-contact-email">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => {
                      setContactForm({ ...contactForm, email: e.target.value });
                      if (contactErrors.email) setContactErrors(prev => ({ ...prev, email: '' }));
                      if (formErrors['field-contact-email']) setFormErrors(prev => ({ ...prev, 'field-contact-email': '' }));
                    }}
                    placeholder="VD: customer@gmail.com"
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none focus:border-red-600 ${
                      (contactErrors.email || formErrors['field-contact-email']) ? 'border-red-500 bg-red-50/20 ring-2 ring-red-500/20' : 'border-zinc-300'
                    }`}
                  />
                  {(contactErrors.email || formErrors['field-contact-email']) && (
                    <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{contactErrors.email || formErrors['field-contact-email']}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Địa chỉ khách hàng</label>
                  <input
                    type="text"
                    value={contactForm.diaChi}
                    onChange={e => setContactForm({ ...contactForm, diaChi: e.target.value })}
                    placeholder="VD: Quận 3, TP. Hồ Chí Minh"
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
                <div id="field-vehicle-selection">
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

                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl ${formErrors['field-vehicle-selection'] ? 'border-2 border-red-500 bg-red-50/20' : ''}`}>
                    {myVehicles.map(v => {
                      const sel = selectedVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            if (formErrors['field-vehicle-selection']) setFormErrors(prev => ({ ...prev, 'field-vehicle-selection': '' }));
                          }}
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
                  {formErrors['field-vehicle-selection'] && (
                    <p className="text-[11px] text-red-600 mt-2 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{formErrors['field-vehicle-selection']}</span>
                    </p>
                  )}
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
                <div id="field-vehicle-selection">
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
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl ${formErrors['field-vehicle-selection'] ? 'border-2 border-red-500 bg-red-50/20' : ''}`}>
                    {myVehicles.map(v => {
                      const sel = selectedVehicleId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            if (formErrors['field-vehicle-selection']) setFormErrors(prev => ({ ...prev, 'field-vehicle-selection': '' }));
                          }}
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
                  {formErrors['field-vehicle-selection'] && (
                    <p className="text-[11px] text-red-600 mt-2 font-semibold flex items-center gap-1">
                      <span>⚠️</span>
                      <span>{formErrors['field-vehicle-selection']}</span>
                    </p>
                  )}
                </div>
              ) : (
                renderNewVehicleInputs('NHẬP THÔNG TIN XE GẶP SỰ CỐ')
              )}

              {/* Tình trạng xe (Checkbox chọn nhiều) - LH14 */}
              <div id="field-repair-issues" className="scroll-mt-6">
                <label className="block text-xs font-bold text-zinc-800 uppercase mb-2">
                  Tình trạng xe hiện tại (Chọn các triệu chứng đang gặp phải) <span className="text-red-600">*</span>:
                </label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2 rounded-2xl transition ${
                  formErrors['field-repair-issues'] ? 'border-2 border-red-500 bg-red-50/30 ring-2 ring-red-500/20' : ''
                }`}>
                  {repairIssuesList.map(issue => {
                    const checked = selectedIssues.includes(issue);
                    return (
                      <label
                        key={issue}
                        onClick={() => {
                          toggleIssue(issue);
                          if (formErrors['field-repair-issues']) {
                            setFormErrors(prev => {
                              const next = { ...prev };
                              delete next['field-repair-issues'];
                              return next;
                            });
                          }
                        }}
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
                {formErrors['field-repair-issues'] && (
                  <p className="text-xs text-red-600 mt-1.5 font-bold flex items-center gap-1">
                    <span>⚠️</span> {formErrors['field-repair-issues']}
                  </p>
                )}
              </div>

              {/* Mô tả vấn đề chi tiết - LH14 */}
              <div id="field-repair-desc" className="scroll-mt-6">
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mô tả chi tiết vấn đề / Yêu cầu cụ thể <span className="text-red-600">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={problemDescription}
                  onChange={e => {
                    setProblemDescription(e.target.value);
                    if (e.target.value.trim() && formErrors['field-repair-desc']) {
                      setFormErrors(prev => {
                        const next = { ...prev };
                        delete next['field-repair-desc'];
                        return next;
                      });
                    }
                  }}
                  placeholder="VD: Xe chạy tầm 40km/h bị giật cục, sáng ra đề máy rất khó nổ, tiếng kêu lạch cạch ở phía bên lốc nồi..."
                  className={`w-full p-3 rounded-2xl border text-xs bg-white focus:outline-none focus:border-red-600 resize-none transition ${
                    formErrors['field-repair-desc'] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-zinc-300'
                  }`}
                />
                {formErrors['field-repair-desc'] && (
                  <p className="text-xs text-red-600 mt-1.5 font-bold flex items-center gap-1">
                    <span>⚠️</span> {formErrors['field-repair-desc']}
                  </p>
                )}
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

          {/* ── 3C. LÁI THỬ: Chọn xe lái thử dạng card (LH18: Đầy đủ xe, Tìm kiếm & Lọc theo hãng) ── */}
          {svc === 'LaiThu' && (
            <div id="field-testdrive-vehicle" className="space-y-4 scroll-mt-6">
              {formErrors['field-testdrive-vehicle'] && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formErrors['field-testdrive-vehicle']}</span>
                </div>
              )}

              {/* LH18: Thanh tìm kiếm & bộ lọc hãng xe */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  {/* Ô tìm kiếm */}
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
                    <input
                      type="text"
                      value={testDriveSearch}
                      onChange={e => {
                        setTestDriveSearch(e.target.value);
                        setShowAllVehicles(true);
                      }}
                      placeholder="Tìm kiếm mẫu xe lái thử (VD: SH 160i, Exciter, Air Blade, Vespa, Honda, Tay ga...)"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-zinc-300 text-xs bg-white focus:outline-none focus:border-red-600 transition"
                    />
                    {testDriveSearch && (
                      <button
                        type="button"
                        onClick={() => setTestDriveSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                        title="Xóa tìm kiếm"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Số lượng xe hiển thị */}
                  <div className="text-[11px] text-zinc-500 font-mono shrink-0 text-right">
                    Tìm thấy: <strong className="text-zinc-800">{filteredTestDriveVehicles.length}</strong> / {allTestDriveVehicles.length} mẫu xe
                  </div>
                </div>

                {/* Bộ lọc Hãng */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-200/70 text-xs">
                  <span className="text-[11px] text-zinc-500 font-semibold mr-1">Hãng xe:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTestDriveBrandFilter('ALL');
                      setShowAllVehicles(true);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      testDriveBrandFilter === 'ALL'
                        ? 'bg-red-700 text-white shadow-2xs'
                        : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                    }`}
                  >
                    Tất cả ({allTestDriveVehicles.length})
                  </button>
                  {availableBrands.map(b => {
                    const count = allTestDriveVehicles.filter(v => v.hang === b).length;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setTestDriveBrandFilter(b);
                          setShowAllVehicles(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          testDriveBrandFilter === b
                            ? 'bg-red-700 text-white shadow-2xs'
                            : 'bg-white text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                        }`}
                      >
                        {b} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Danh sách xe / Trạng thái trống */}
              {filteredTestDriveVehicles.length === 0 ? (
                <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 space-y-2">
                  <div className="text-3xl">🔍</div>
                  <div className="text-sm font-bold text-zinc-800">Không tìm thấy mẫu xe phù hợp</div>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Không tìm thấy mẫu xe nào khớp với từ khóa "{testDriveSearch}". Quý khách vui lòng thử tìm kiếm bằng tên xe, dòng xe hoặc hãng xe khác.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTestDriveSearch('');
                      setTestDriveBrandFilter('ALL');
                    }}
                    className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer transition shadow-2xs"
                  >
                    ✕ Xóa bộ lọc tìm kiếm
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {displayedVehicles.map(v => {
                      const sel = selectedTestDriveId === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedTestDriveId(v.id);
                            setFormErrors(prev => {
                              const n = { ...prev };
                              delete n['field-testdrive-vehicle'];
                              return n;
                            });
                          }}
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

                  {/* Nút Xem thêm / Thu gọn (khi không tìm kiếm và có nhiều hơn 6 xe) */}
                  {!testDriveSearch.trim() && testDriveBrandFilter === 'ALL' && filteredTestDriveVehicles.length > 6 && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowAllVehicles(!showAllVehicles)}
                        className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer inline-flex items-center gap-1.5 border border-zinc-200 shadow-2xs"
                      >
                        {showAllVehicles ? (
                          <>
                            <span>▲ Thu gọn danh sách</span>
                          </>
                        ) : (
                          <>
                            <span>▼ Xem thêm tất cả ({filteredTestDriveVehicles.length - 6} mẫu xe khác)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            4. BƯỚC 4: CHỌN DỊCH VỤ CHI TIẾT (LH15: Ẩn khi svc === 'SuaChua')
               - Bảo dưỡng: Chọn gói bảo dưỡng
               - Lái thử: Yêu cầu cung cấp Giấy phép lái xe (GPLX)
        ════════════════════════════════════════════════════════════ */}
        {svc !== 'SuaChua' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">4</span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              {svc === 'BaoDuong' && 'CHỌN GÓI BẢO DƯỠNG ĐỊNH KỲ'}
              {svc === 'LaiThu' && 'XÁC THỰC GIẤY PHÉP LÁI XE (GPLX)'}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mb-5 ml-10">
            {svc === 'BaoDuong' && 'Lựa chọn gói bảo dưỡng theo số km đã đi để xe vận hành an toàn và bền bỉ'}
            {svc === 'LaiThu' && 'Quy định an toàn: Khách hàng cần có bằng lái xe máy hợp lệ để tham gia chạy thử'}
          </p>

          {/* ── 4A. BẢO DƯỠNG: Danh sách gói bảo dưỡng ── */}
          {svc === 'BaoDuong' && (
            <div id="field-service-pkg">
              {formErrors['field-service-pkg'] && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formErrors['field-service-pkg']}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {maintenancePackages.map(pkg => {
                  const sel = selectedPackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setFormErrors(prev => {
                          const n = { ...prev };
                          delete n['field-service-pkg'];
                          return n;
                        });
                      }}
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
            </div>
          )}

          {/* ── 4C. LÁI THỬ: Yêu cầu cung cấp Giấy phép lái xe (GPLX) (LH17: Bắt buộc số và ảnh) ── */}
          {svc === 'LaiThu' && (
            <div
              className="space-y-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-200"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center justify-between w-full flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-blue-950 uppercase font-mono">
                    <span>🪪</span> THÔNG TIN GIẤY PHÉP LÁI XE HỢP LỆ (BẮT BUỘC)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLicenseForm({
                        soGPLX: '079198004567',
                        hangBang: 'A1',
                        anhMatTruoc: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
                        anhMatSau: '',
                      });
                      setFormErrors(prev => {
                        const n = { ...prev };
                        delete n['field-testdrive-license'];
                        delete n['field-testdrive-license-img'];
                        return n;
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <span>📄</span> Dùng GPLX mẫu để test
                  </button>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">Bắt buộc theo Luật GTĐB Việt Nam</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div id="field-testdrive-license" className="scroll-mt-6">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Số GPLX (Bằng lái xe) <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 790123456789"
                    value={licenseForm.soGPLX}
                    onChange={e => {
                      const val = e.target.value;
                      setLicenseForm({ ...licenseForm, soGPLX: val });
                      if (val.trim()) {
                        setFormErrors(prev => {
                          const n = { ...prev };
                          delete n['field-testdrive-license'];
                          return n;
                        });
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none font-mono transition ${
                      formErrors['field-testdrive-license']
                        ? 'border-red-500 ring-2 ring-red-500/20 focus:border-red-600'
                        : 'border-zinc-300 focus:border-red-600'
                    }`}
                  />
                  {formErrors['field-testdrive-license'] && (
                    <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {formErrors['field-testdrive-license']}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Hạng bằng lái xe <span className="text-red-600 font-bold">*</span>
                  </label>
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

              {/* Phần ảnh chụp GPLX (LH17: Bắt buộc ảnh mặt trước) */}
              <div id="field-testdrive-license-img" className="pt-2 scroll-mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-2 rounded-2xl transition ${
                      formErrors['field-testdrive-license-img']
                        ? 'border-2 border-red-500 bg-red-50/30 ring-2 ring-red-500/20'
                        : ''
                    }`}
                  >
                    <ImageUploader
                      value={licenseForm.anhMatTruoc}
                      onChange={url => {
                        setLicenseForm({ ...licenseForm, anhMatTruoc: url });
                        if (url) {
                          setFormErrors(prev => {
                            const n = { ...prev };
                            delete n['field-testdrive-license-img'];
                            return n;
                          });
                        }
                      }}
                      label="Ảnh chụp mặt trước GPLX (Bắt buộc) *"
                    />
                  </div>
                  <div>
                    <ImageUploader
                      value={licenseForm.anhMatSau}
                      onChange={url => setLicenseForm({ ...licenseForm, anhMatSau: url })}
                      label="Ảnh chụp mặt sau GPLX (Tùy chọn)"
                    />
                  </div>
                </div>
                {formErrors['field-testdrive-license-img'] && (
                  <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {formErrors['field-testdrive-license-img']}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            CHỌN NGÀY GIỜ & XÁC NHẬN (LH15: Bước 4 nếu Sửa chữa, Bước 5 nếu Bảo dưỡng/Lái thử)
        ════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-mono font-bold">
              {svc === 'SuaChua' ? 4 : 5}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              CHỌN THỜI GIAN & XÁC NHẬN LỊCH HẸN
            </h2>
          </div>
          <p className="text-xs text-zinc-500 ml-10">Showroom phục vụ từ Thứ 2 đến Thứ 7 (08:00 - 17:00)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Chọn ngày hẹn */}
            <div id="field-booking-date">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Ngày hẹn mong muốn *</label>
                <span className="text-[11px] text-zinc-400 font-mono">Tối thiểu từ hôm nay</span>
              </div>
              <input
                type="date"
                required
                min={today}
                max={`${new Date().getFullYear() + 2}-12-31`}
                value={date}
                onChange={e => {
                  const newDate = e.target.value;
                  setDate(newDate);
                  if (newDate) {
                    const y = newDate.split('-')[0];
                    if (y && y.length > 4) {
                      setFormErrors(prev => ({
                        ...prev,
                        'field-booking-date': 'Năm không hợp lệ! Năm chỉ được phép có tối đa 4 chữ số.'
                      }));
                      return;
                    }
                    if (isSundayDate(newDate)) {
                      setFormErrors(prev => ({
                        ...prev,
                        'field-booking-date': 'Showroom không hoạt động vào Chủ nhật. Vui lòng chọn ngày khác từ thứ Hai đến thứ Bảy.'
                      }));
                    } else {
                      setFormErrors(prev => {
                        const next = { ...prev };
                        delete next['field-booking-date'];
                        return next;
                      });
                    }
                  }
                  if (time) {
                    const check = checkSlotValidity(time, newDate);
                    if (!check.valid) {
                      setTime('');
                    }
                  }
                }}
                className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none font-mono transition ${
                  formErrors['field-booking-date']
                    ? 'border-red-500 ring-2 ring-red-500/20'
                    : 'border-zinc-300 focus:border-red-600'
                }`}
              />
              {formErrors['field-booking-date'] && (
                <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {formErrors['field-booking-date']}
                </p>
              )}
            </div>

            {/* Chọn khung giờ */}
            <div id="field-booking-time">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-700">Khung giờ tiếp nhận xe *</label>
                <span className="text-[11px] text-zinc-400 font-mono">Cách hiện tại ≥ 3 tiếng</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(t => {
                  const sel = time === t;
                  const { valid, reason } = checkSlotValidity(t, date);
                  const isBooked = isSlotBookedForVehicle(t);
                  const isAvailable = valid && !isBooked;

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        if (!valid) {
                          setFormErrors(prev => ({
                            ...prev,
                            'field-booking-time': reason || 'Cần đặt lịch trước ít nhất 3 tiếng'
                          }));
                          return;
                        }
                        if (isBooked) {
                          setFormErrors(prev => ({
                            ...prev,
                            'field-booking-time': 'Xe đã có lịch hẹn vào thời gian này. Vui lòng chọn ngày hoặc giờ khác.'
                          }));
                          return;
                        }
                        setTime(t);
                        setFormErrors(prev => {
                          const next = { ...prev };
                          delete next['field-booking-time'];
                          return next;
                        });
                      }}
                      title={!valid ? reason : isBooked ? 'Xe đã có lịch hẹn vào thời gian này' : undefined}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition ${
                        sel
                          ? 'bg-red-700 text-white shadow-xs cursor-pointer'
                          : isAvailable
                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 cursor-pointer'
                          : 'bg-zinc-100 text-zinc-400 opacity-50 cursor-not-allowed border border-dashed border-zinc-300 line-through'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {formErrors['field-booking-time'] && (
                <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {formErrors['field-booking-time']}
                </p>
              )}
              {date === today && timeSlots.every(t => !checkSlotValidity(t, date).valid) && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Các khung giờ hôm nay đã qua hoặc không đủ 3 tiếng chuẩn bị. Quý khách vui lòng chọn ngày tiếp theo.</span>
                </div>
              )}
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
                    ? allTestDriveVehicles.find(v => v.id === selectedTestDriveId)?.tenXe
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
              <div className="text-base sm:text-lg font-extrabold text-red-500 font-mono text-right">
                {svc === 'SuaChua'
                  ? '0₫ (Kỹ thuật viên kiểm tra trực tiếp và báo giá tại showroom)'
                  : svc === 'LaiThu'
                  ? '0₫ (Miễn phí lái thử)'
                  : estimatedTotalCost > 0
                  ? formatVND(estimatedTotalCost)
                  : '0₫'}
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

      {/* Modal cảnh báo và xác nhận đặt thêm lịch lái thử cùng ngày khác giờ */}
      {duplicateConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#18181b] border border-amber-500/70 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <span className="text-3xl text-amber-500">⚠️</span>
              <h3 className="font-extrabold text-base text-amber-400 uppercase tracking-tight">
                XÁC NHẬN ĐẶT THÊM LỊCH LÁI THỬ
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Bạn đã đặt lịch lái thử xe này vào lúc <strong className="text-amber-400 font-mono text-sm">{duplicateConfirmModal.existingTime}</strong> cùng ngày. Bạn có chắc chắn muốn đặt thêm lịch không?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDuplicateConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={duplicateConfirmModal.onProceed}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer shadow-md"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
