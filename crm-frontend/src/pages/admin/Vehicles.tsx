import React, { useState, useEffect } from 'react';
import { formatVND } from '../../data/mockData';
import ImageUploader from '../../components/shared/ImageUploader';
import { catalogVehicleApi, type CatalogVehicle } from '../../services/api';

type Vehicle = CatalogVehicle;

const initialVehicles: Vehicle[] = [
  {
    id: 'XM001',
    tenXe: 'Honda SH 160i ABS 2025',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 95900000,
    mauSac: 'Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc',
    moTa: 'Flagship tay ga cao cấp của Honda với phanh ABS 2 kênh, động cơ 156.9cc eSP+ 4 van, Smart Key',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 15,
    ncc: 'Công ty Honda Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'eSP+ 4 van, 4 kỳ, 1 xi-lanh, làm mát bằng dung dịch',
    dungTichXiLanh: '156.9 cm³',
    tieuThuNhienLieu: '2.24 L/100km',
    khoiLuong: '134 kg',
    kichThuoc: '2.090 x 739 x 1.129 mm',
    doCaoYen: '799 mm',
    dungTichBinhXang: '7.8 L',
    heThongPhanh: 'Phanh đĩa trước & sau, tích hợp ABS 2 kênh',
    kichCoLop: 'Trước: 100/80-16, Sau: 120/80-16',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-20',
  },
  {
    id: 'XM002',
    tenXe: 'Honda Air Blade 160 ABS',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 56690000,
    mauSac: 'Đỏ đen, Xanh xám, Đen vàng đồng',
    moTa: 'Tay ga thể thao mạnh mẽ, động cơ eSP+ 160cc, cốp rộng 23.2L tích hợp cổng sạc USB',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 20,
    ncc: 'Công ty Honda Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'eSP+ 4 van, 4 kỳ, xi-lanh đơn, làm mát bằng dung dịch',
    dungTichXiLanh: '156.9 cm³',
    tieuThuNhienLieu: '2.30 L/100km',
    khoiLuong: '114 kg',
    kichThuoc: '1.890 x 686 x 1.116 mm',
    doCaoYen: '775 mm',
    dungTichBinhXang: '4.4 L',
    heThongPhanh: 'Đĩa thủy lực ABS trước, phanh tang trống sau',
    kichCoLop: 'Trước: 90/80-14, Sau: 100/80-14',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-18',
  },
  {
    id: 'XM003',
    tenXe: 'Honda Lead 125cc (Bản Đặc Biệt)',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 42790000,
    mauSac: 'Bạc nhám, Đen mờ, Trắng ngọc',
    moTa: 'Cốp xe siêu lớn 37L đựng 2 mũ bảo hiểm, cổng sạc USB, động cơ eSP+ 4 van êm ái',
    hinhAnh: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 18,
    ncc: 'Công ty Honda Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'eSP+ 4 van, 4 kỳ, làm mát bằng dung dịch',
    dungTichXiLanh: '124.8 cm³',
    tieuThuNhienLieu: '2.16 L/100km',
    khoiLuong: '113 kg',
    kichThuoc: '1.844 x 680 x 1.130 mm',
    doCaoYen: '760 mm',
    dungTichBinhXang: '6.0 L',
    heThongPhanh: 'Đĩa thủy lực trước kết hợp CBS, tang trống sau',
    kichCoLop: 'Trước: 90/90-12, Sau: 100/90-10',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-15',
  },
  {
    id: 'XM004',
    tenXe: 'Honda Vision 110 Thể Thao',
    hang: 'Honda',
    phanKhuc: 'Tay ga',
    giaNiemYet: 36612000,
    mauSac: 'Xám xi măng, Đen bóng, Xanh dương',
    moTa: 'Xe tay ga quốc dân nhỏ gọn thanh lịch, vành đúc 16 inch cao ráo, Smart Key, siêu tiết kiệm xăng',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
    soLuong: 25,
    ncc: 'Công ty Honda Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'eSP 4 kỳ, 1 xi-lanh, làm mát bằng không khí',
    dungTichXiLanh: '109.5 cm³',
    tieuThuNhienLieu: '1.85 L/100km',
    khoiLuong: '97 kg',
    kichThuoc: '1.871 x 686 x 1.101 mm',
    doCaoYen: '785 mm',
    dungTichBinhXang: '4.9 L',
    heThongPhanh: 'Đĩa thủy lực trước kết hợp CBS, cơ sau',
    kichCoLop: 'Trước: 80/90-16, Sau: 90/90-14',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-12',
  },
  {
    id: 'XM005',
    tenXe: 'Honda Winner X 150 ABS',
    hang: 'Honda',
    phanKhuc: 'Côn tay',
    giaNiemYet: 50560000,
    mauSac: 'Đỏ đen xanh thể thao, Đen nhám bạc',
    moTa: 'Côn tay thể thao trang bị ly hợp chống trượt Assist & Slipper, xích phốt O-ring, phanh ABS trước',
    hinhAnh: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 14,
    ncc: 'Công ty Honda Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'DOHC 4 kỳ, 1 xi-lanh, làm mát bằng dung dịch',
    dungTichXiLanh: '149.1 cm³',
    tieuThuNhienLieu: '1.99 L/100km',
    khoiLuong: '122 kg',
    kichThuoc: '2.019 x 727 x 1.104 mm',
    doCaoYen: '795 mm',
    dungTichBinhXang: '4.5 L',
    heThongPhanh: 'Đĩa thủy lực ABS trước, đĩa sau',
    kichCoLop: 'Trước: 90/80-17, Sau: 120/70-17',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-10',
  },
  {
    id: 'XM006',
    tenXe: 'Honda Wave Alpha 110 Cổ Điển',
    hang: 'Honda',
    phanKhuc: 'Xe số',
    giaNiemYet: 19290000,
    mauSac: 'Xám cổ điển, Vàng trắng, Đỏ đen',
    moTa: 'Xe số bền bỉ tiết kiệm nhiên liệu số 1, chi phí vận hành cực thấp, phụ tùng thay thế sẵn có',
    hinhAnh: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
    soLuong: 30,
    ncc: 'Công ty Honda Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: '4 kỳ, 1 xi-lanh, làm mát bằng không khí',
    dungTichXiLanh: '109.1 cm³',
    tieuThuNhienLieu: '1.72 L/100km',
    khoiLuong: '97 kg',
    kichThuoc: '1.914 x 688 x 1.075 mm',
    doCaoYen: '769 mm',
    dungTichBinhXang: '3.7 L',
    heThongPhanh: 'Tang trống (cơ) trước và sau',
    kichCoLop: 'Trước: 70/90-17, Sau: 80/90-17',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-05',
  },
  {
    id: 'XM007',
    tenXe: 'Yamaha Exciter 155 VVA ABS',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 55000000,
    mauSac: 'Xanh GP Monster, Đen nhám, Đỏ bạc',
    moTa: 'Ông vua đường phố van biến thiên VVA 155cc, 4 bản đồ đánh lửa, phanh đĩa trước 2 piston có ABS',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 16,
    ncc: 'Công ty Yamaha Motor Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: '4 thì, 4 van, SOHC, làm mát bằng dung dịch, van biến thiên VVA',
    dungTichXiLanh: '155.1 cm³',
    tieuThuNhienLieu: '2.09 L/100km',
    khoiLuong: '121 kg',
    kichThuoc: '1.975 x 665 x 1.085 mm',
    doCaoYen: '795 mm',
    dungTichBinhXang: '5.4 L',
    heThongPhanh: 'Đĩa đơn thủy lực ABS 2 piston trước, đĩa sau',
    kichCoLop: 'Trước: 90/80-17, Sau: 120/70-17',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-22',
  },
  {
    id: 'XM008',
    tenXe: 'Yamaha Grande Hybrid Tiêu Chuẩn',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 46047000,
    mauSac: 'Hồng pastel, Trắng ngọc trai, Đỏ mận',
    moTa: 'Tay ga tiết kiệm xăng số 1 Việt Nam (1.66L/100km), công nghệ trợ lực điện Blue Core Hybrid, cốp 27L',
    hinhAnh: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 12,
    ncc: 'Công ty Yamaha Motor Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'Blue Core Hybrid, 4 thì, 2 van, SOHC, làm mát bằng không khí',
    dungTichXiLanh: '124.9 cm³',
    tieuThuNhienLieu: '1.66 L/100km',
    khoiLuong: '101 kg',
    kichThuoc: '1.820 x 684 x 1.155 mm',
    doCaoYen: '790 mm',
    dungTichBinhXang: '4.0 L',
    heThongPhanh: 'Đĩa ABS trước, đùm sau',
    kichCoLop: 'Trước: 110/70-12, Sau: 110/70-12',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-24',
  },
  {
    id: 'XM009',
    tenXe: 'Yamaha NVX 155 VVA Maxi-Scooter',
    hang: 'Yamaha',
    phanKhuc: 'Tay ga',
    giaNiemYet: 55500000,
    mauSac: 'Đen vàng, Xám ánh xanh, Đỏ đen',
    moTa: 'Tay ga hầm hố lốp sau 140mm, giảm xóc dầu bình phụ thể thao, kết nối Y-Connect, phanh ABS',
    hinhAnh: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 10,
    ncc: 'Công ty Yamaha Motor Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'Blue Core 155cc, 4 van VVA làm mát bằng dung dịch',
    dungTichXiLanh: '155.1 cm³',
    tieuThuNhienLieu: '2.17 L/100km',
    khoiLuong: '125 kg',
    kichThuoc: '1.980 x 700 x 1.150 mm',
    doCaoYen: '790 mm',
    dungTichBinhXang: '5.5 L',
    heThongPhanh: 'Đĩa ABS trước, tang trống sau',
    kichCoLop: 'Trước: 110/80-14, Sau: 140/70-14',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-25',
  },
  {
    id: 'XM010',
    tenXe: 'Yamaha PG-1 115cc Scrambler',
    hang: 'Yamaha',
    phanKhuc: 'Xe số',
    giaNiemYet: 30437000,
    mauSac: 'Vàng sa mạc, Cam rực rỡ, Xanh rêu bụi',
    moTa: 'Phong cách Scrambler địa hình phượt bụi, lốp gai to đa dụng, ghi đông trần cá tính',
    hinhAnh: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 11,
    ncc: 'Công ty Yamaha Motor Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: '4 thì, 2 van, SOHC, làm mát bằng không khí',
    dungTichXiLanh: '113.7 cm³',
    tieuThuNhienLieu: '1.96 L/100km',
    khoiLuong: '107 kg',
    kichThuoc: '1.980 x 805 x 1.050 mm',
    doCaoYen: '795 mm',
    dungTichBinhXang: '5.1 L',
    heThongPhanh: 'Đĩa trước thủy lực, đùm sau',
    kichCoLop: 'Trước: 90/100-16, Sau: 90/100-16',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-26',
  },
  {
    id: 'XM011',
    tenXe: 'Yamaha MT-15 Naked Streetfighter',
    hang: 'Yamaha',
    phanKhuc: 'Côn tay',
    giaNiemYet: 69000000,
    mauSac: 'Xanh đen thể thao, Xám tem đỏ, Đen nhám',
    moTa: 'Naked bike 155cc VVA, phuộc Upside Down vàng thể thao, đèn pha LED thấu kính Transformer',
    hinhAnh: 'https://images.unsplash.com/photo-1558980359-a99ad4205530?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 8,
    ncc: 'Công ty Yamaha Motor Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Nhập khẩu Indonesia',
    vat: 10,
    loaiDongCo: '4 thì, 4 van, SOHC, làm mát bằng chất lỏng, VVA',
    dungTichXiLanh: '155.0 cm³',
    tieuThuNhienLieu: '2.28 L/100km',
    khoiLuong: '133 kg',
    kichThuoc: '1.965 x 800 x 1.065 mm',
    doCaoYen: '810 mm',
    dungTichBinhXang: '10.0 L',
    heThongPhanh: 'Đĩa thủy lực trước & sau',
    kichCoLop: 'Trước: 110/70-17, Sau: 140/70-17',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-25',
  },
  {
    id: 'XM012',
    tenXe: 'Suzuki Raider R150 Fi (DOHC)',
    hang: 'Suzuki',
    phanKhuc: 'Côn tay',
    giaNiemYet: 51190000,
    mauSac: 'Đỏ đen, Xanh mờ MotoGP, Đen cam',
    moTa: 'Vua tốc độ DOHC 4 van két nước lớn, công suất 18.5 HP mạnh nhất phân khúc 150cc',
    hinhAnh: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 7,
    ncc: 'Công ty TNHH Việt Nam Suzuki',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam',
    vat: 10,
    loaiDongCo: 'DOHC 4 van, 4 thì, 1 xi-lanh, làm mát két nước lớn',
    dungTichXiLanh: '147.3 cm³',
    tieuThuNhienLieu: '2.40 L/100km',
    khoiLuong: '112 kg',
    kichThuoc: '1.960 x 675 x 980 mm',
    doCaoYen: '765 mm',
    dungTichBinhXang: '4.0 L',
    heThongPhanh: 'Đĩa trước & sau hình cánh hoa',
    kichCoLop: 'Trước: 70/90-17, Sau: 80/90-17',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-27',
  },
  {
    id: 'XM013',
    tenXe: 'Suzuki Burgman Street 125',
    hang: 'Suzuki',
    phanKhuc: 'Tay ga',
    giaNiemYet: 48600000,
    mauSac: 'Đen mờ, Xám titan, Vàng đồng',
    moTa: 'Maxi-scooter sang trọng phong cách Châu Âu, sàn để chân rộng rãi, cổng sạc điện thoại tiện lợi',
    hinhAnh: 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: false,
    soLuong: 5,
    ncc: 'Công ty TNHH Việt Nam Suzuki',
    namSanXuat: 2025,
    xuatXu: 'Nhập khẩu Ấn Độ',
    vat: 10,
    loaiDongCo: 'SEP 4 thì, 1 xi-lanh, làm mát bằng không khí',
    dungTichXiLanh: '124.3 cm³',
    tieuThuNhienLieu: '1.96 L/100km',
    khoiLuong: '110 kg',
    kichThuoc: '1.880 x 715 x 1.140 mm',
    doCaoYen: '780 mm',
    dungTichBinhXang: '5.5 L',
    heThongPhanh: 'Đĩa trước kết hợp phanh CBS, tang trống sau',
    kichCoLop: 'Trước: 90/90-12, Sau: 90/100-10',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-29',
  },
  {
    id: 'XM014',
    tenXe: 'Vespa Sprint S 150 TFT',
    hang: 'Piaggio',
    phanKhuc: 'Tay ga',
    giaNiemYet: 97800000,
    mauSac: 'Đen nhám, Đồng nhám, Trắng ánh kim',
    moTa: 'Khung thép liền khối kinh điển, màn hình TFT màu thông minh kết nối Vespa MIA, động cơ i-Get 150cc',
    hinhAnh: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    coTheLaiThu: true,
    soLuong: 7,
    ncc: 'Công ty TNHH Piaggio Việt Nam',
    namSanXuat: 2025,
    xuatXu: 'Việt Nam (Ý thiết kế)',
    vat: 10,
    loaiDongCo: 'i-Get 150cc, 4 thì, 3 van, phun xăng điện tử',
    dungTichXiLanh: '155.0 cm³',
    tieuThuNhienLieu: '2.25 L/100km',
    khoiLuong: '125 kg',
    kichThuoc: '1.863 x 695 x 1.334 mm',
    doCaoYen: '790 mm',
    dungTichBinhXang: '7.0 L',
    heThongPhanh: 'Đĩa thủy lực 200mm có ABS trước, tang trống sau',
    kichCoLop: 'Trước: 110/70-12, Sau: 120/70-12',
    trangThaiHienThi: 'Hien',
    trangThaiKinhDoanh: 'DangKinhDoanh',
    ngayTao: '2026-03-30',
  },
];

const hangOptions = ['Honda', 'Yamaha', 'Suzuki', 'SYM', 'Piaggio'];
const phanKhucOptions = ['Xe số', 'Tay ga', 'Côn tay', 'Xe điện'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [filterHang, setFilterHang] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [filterTestDrive, setFilterTestDrive] = useState<'All' | 'Yes' | 'No'>('All');
  const [filterPrice, setFilterPrice] = useState<'All' | 'Under30' | '30To60' | '60To90' | 'Above90'>('All');
  const [filterWebVisibility, setFilterWebVisibility] = useState<'All' | 'Hien' | 'An'>('All');
  // XM06: Quick filter by KPI card
  const [filterQuick, setFilterQuick] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'NEW'>('ALL');

  // Modal Thêm / Sửa
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'basic' | 'colors' | 'specs'>('basic');
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Partial<Vehicle>>({});
  const [colorList, setColorList] = useState<string[]>(['']); // XM03: Quản lý nhiều khung màu
  const [errors, setErrors] = useState<Record<string, string>>({});

  // XM05: Modal Chi tiết xe mẫu cho Admin
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadVehicles = () => {
    catalogVehicleApi.getAll().then(data => {
      if (data && data.length > 0) {
        setVehicles(data);
      } else {
        localStorage.setItem('crm_catalog_vehicles', JSON.stringify(initialVehicles));
        setVehicles(initialVehicles);
      }
    });
  };

  useEffect(() => {
    loadVehicles();
    const handleRefresh = (e: any) => {
      if (!e.detail || e.detail.type === 'vehicle_catalog') {
        loadVehicles();
      }
    };
    window.addEventListener('crm-data-refresh', handleRefresh);
    return () => window.removeEventListener('crm-data-refresh', handleRefresh);
  }, []);

  // XM06: Tính toán chỉ số tổng quan Banner
  const stats = React.useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(
      v => (v.trangThaiKinhDoanh || 'DangKinhDoanh') === 'DangKinhDoanh' && v.trangThaiHienThi !== 'An'
    ).length;
    const inactive = vehicles.filter(
      v => v.trangThaiKinhDoanh === 'NgungKinhDoanh' || v.trangThaiHienThi === 'An'
    ).length;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
    const newAdded = vehicles.filter(v => {
      if (!v.ngayTao) return false;
      const t = new Date(v.ngayTao).getTime();
      return !isNaN(t) && t >= thirtyDaysAgo;
    }).length;

    return { total, active, inactive, newAdded };
  }, [vehicles]);

  // Bộ lọc danh sách xe
  const filtered = vehicles.filter(v => {
    // Quick filter from KPI cards
    if (filterQuick === 'ACTIVE') {
      if (!((v.trangThaiKinhDoanh || 'DangKinhDoanh') === 'DangKinhDoanh' && v.trangThaiHienThi !== 'An')) {
        return false;
      }
    } else if (filterQuick === 'INACTIVE') {
      if (!(v.trangThaiKinhDoanh === 'NgungKinhDoanh' || v.trangThaiHienThi === 'An')) {
        return false;
      }
    } else if (filterQuick === 'NEW') {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
      const t = v.ngayTao ? new Date(v.ngayTao).getTime() : 0;
      if (isNaN(t) || t < thirtyDaysAgo) return false;
    }

    // Search
    const matchSearch =
      !search.trim() ||
      v.tenXe.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.mauSac.toLowerCase().includes(search.toLowerCase());
    // Hang
    const matchHang = !filterHang || v.hang === filterHang;
    // Segment
    const matchSeg = !filterSegment || v.phanKhuc === filterSegment;
    // Test drive
    const matchTest = filterTestDrive === 'All' ? true : filterTestDrive === 'Yes' ? v.coTheLaiThu : !v.coTheLaiThu;
    // Web Visibility (XM07)
    const matchWeb =
      filterWebVisibility === 'All'
        ? true
        : filterWebVisibility === 'Hien'
        ? v.trangThaiHienThi !== 'An'
        : v.trangThaiHienThi === 'An';
    // Price range
    const matchPrice =
      filterPrice === 'All'
        ? true
        : filterPrice === 'Under30'
        ? v.giaNiemYet < 30000000
        : filterPrice === '30To60'
        ? v.giaNiemYet >= 30000000 && v.giaNiemYet <= 60000000
        : filterPrice === '60To90'
        ? v.giaNiemYet > 60000000 && v.giaNiemYet <= 90000000
        : v.giaNiemYet > 90000000;

    return matchSearch && matchHang && matchSeg && matchTest && matchWeb && matchPrice;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagedVehicles = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // XM03: Quản lý danh sách màu
  const handleAddColor = () => {
    setColorList(prev => [...prev, '']);
  };

  const handleColorChange = (idx: number, val: string) => {
    setColorList(prev => prev.map((c, i) => (i === idx ? val : c)));
  };

  const handleRemoveColor = (idx: number) => {
    if (colorList.length <= 1) {
      setColorList(['']);
      return;
    }
    setColorList(prev => prev.filter((_, i) => i !== idx));
  };

  const openCreateModal = () => {
    setEditVehicle(null);
    setForm({
      soLuong: 10,
      ncc: 'Công ty Honda Việt Nam',
      namSanXuat: new Date().getFullYear(),
      xuatXu: 'Việt Nam',
      vat: 10,
      trangThaiHienThi: 'Hien',
      trangThaiKinhDoanh: 'DangKinhDoanh',
      coTheLaiThu: true,
      loaiDongCo: '4 kỳ, 1 xi-lanh, làm mát bằng dung dịch',
      dungTichXiLanh: '150 cc',
      tieuThuNhienLieu: '2.20 L/100km',
      khoiLuong: '125 kg',
      kichThuoc: '1.950 x 690 x 1.100 mm',
      doCaoYen: '780 mm',
      dungTichBinhXang: '5.5 L',
      heThongPhanh: 'Phanh đĩa thủy lực trước & sau',
      kichCoLop: 'Lốp không săm',
    });
    setColorList(['']);
    setErrors({});
    setModalTab('basic');
    setShowModal(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setForm({ ...vehicle });
    // Tách chuỗi màu sắc thành mảng khung màu (XM03)
    if (vehicle.mauSac) {
      const parsedColors = vehicle.mauSac
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
      setColorList(parsedColors.length > 0 ? parsedColors : ['']);
    } else {
      setColorList(['']);
    }
    setErrors({});
    setModalTab('basic');
    setShowModal(true);
  };

  // XM07: Bật/Tắt ẩn hiện xe mẫu trên Web trực tiếp
  const handleToggleWebVisibility = async (v: Vehicle) => {
    const nextStatus = v.trangThaiHienThi === 'An' ? 'Hien' : 'An';
    await catalogVehicleApi.update(v.id, { ...v, trangThaiHienThi: nextStatus });
    setVehicles(prev =>
      prev.map(item => (item.id === v.id ? { ...item, trangThaiHienThi: nextStatus } : item))
    );
    if (nextStatus === 'Hien') {
      showToast(`✓ Đã hiển thị xe ${v.tenXe} lên Website Showroom!`);
    } else {
      showToast(`🔒 Đã ẩn xe ${v.tenXe} khỏi Website Showroom (vẫn lưu trên Admin).`);
    }
  };

  const validate = (data: Partial<Vehicle>) => {
    const err: Record<string, string> = {};
    if (!data.tenXe?.trim()) err.tenXe = 'Tên xe không được để trống';
    if (!data.hang?.trim()) err.hang = 'Hãng không được để trống';
    if (!data.phanKhuc?.trim()) err.phanKhuc = 'Phân khúc không được để trống';
    if (data.giaNiemYet == null || data.giaNiemYet <= 0) err.giaNiemYet = 'Giá niêm yết phải > 0';

    const validColors = colorList.map(c => c.trim()).filter(Boolean);
    if (validColors.length === 0) {
      err.mauSac = 'Vui lòng nhập ít nhất một màu sắc của xe';
    }
    return err;
  };

  const handleSave = async () => {
    const err = validate(form);
    if (Object.keys(err).length) {
      setErrors(err);
      if (err.mauSac) setModalTab('colors');
      else if (err.tenXe || err.hang || err.phanKhuc || err.giaNiemYet) setModalTab('basic');
      return;
    }

    const mergedColors = colorList
      .map(c => c.trim())
      .filter(Boolean)
      .join(', ');

    const payload: Partial<Vehicle> = {
      tenXe: form.tenXe!.trim(),
      hang: form.hang!.trim(),
      phanKhuc: form.phanKhuc!.trim(),
      giaNiemYet: Number(form.giaNiemYet),
      mauSac: mergedColors,
      moTa: form.moTa?.trim() ?? '',
      hinhAnh: form.hinhAnh?.trim() ?? '',
      coTheLaiThu: !!form.coTheLaiThu,
      // XM04: Các thuộc tính bổ sung
      soLuong: form.soLuong != null ? Number(form.soLuong) : 10,
      ncc: form.ncc?.trim() || `${form.hang} Việt Nam`,
      namSanXuat: form.namSanXuat ? Number(form.namSanXuat) : new Date().getFullYear(),
      xuatXu: form.xuatXu?.trim() || 'Việt Nam',
      vat: form.vat != null ? Number(form.vat) : 10,
      trangThaiKinhDoanh: form.trangThaiKinhDoanh || 'DangKinhDoanh',
      trangThaiHienThi: form.trangThaiHienThi || 'Hien',
      // Thông số kỹ thuật
      loaiDongCo: form.loaiDongCo?.trim() || '4 kỳ, 1 xi-lanh',
      dungTichXiLanh: form.dungTichXiLanh?.trim() || '150 cc',
      tieuThuNhienLieu: form.tieuThuNhienLieu?.trim() || '2.20 L/100km',
      khoiLuong: form.khoiLuong?.trim() || '125 kg',
      kichThuoc: form.kichThuoc?.trim() || '1.950 x 690 x 1.100 mm',
      doCaoYen: form.doCaoYen?.trim() || '780 mm',
      dungTichBinhXang: form.dungTichBinhXang?.trim() || '5.5 L',
      heThongPhanh: form.heThongPhanh?.trim() || 'Phanh đĩa',
      kichCoLop: form.kichCoLop?.trim() || 'Lốp không săm',
    };

    if (editVehicle) {
      await catalogVehicleApi.update(editVehicle.id, payload);
      setVehicles(prev =>
        prev.map(v => (v.id === editVehicle.id ? ({ ...v, ...payload } as Vehicle) : v))
      );
      showToast(`✓ Đã cập nhật thành công xe ${payload.tenXe}!`);
    } else {
      const res = await catalogVehicleApi.create(payload as any);
      setVehicles(prev => [res.vehicle, ...prev]);
      showToast(`✓ Đã thêm mẫu xe mới ${res.vehicle.tenXe} (Mã: ${res.vehicle.id}) thành công!`);
    }

    setShowModal(false);
    setEditVehicle(null);
    setForm({});
    setColorList(['']);
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    const vMatch = vehicles.find(v => v.id === id);
    const vehicleName = vMatch ? vMatch.tenXe : 'mẫu xe';
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${vehicleName} (ID: ${id}) khỏi danh mục xe mẫu?`)) {
      await catalogVehicleApi.delete(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast(`✓ Đã xóa thành công ${vehicleName}!`);
    }
  };

  return (
    <div className="p-6 lg:p-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-zinc-950 text-white shadow-2xl border border-zinc-800 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-xl">{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span className="text-xs font-semibold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-zinc-400 hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
            QUẢN LÝ XE MẪU SHOWROOM
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Quản lý danh mục xe mẫu, cấu hình thông số kỹ thuật, giá niêm yết và trạng thái hiển thị trên website
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition shadow flex items-center justify-center gap-2 cursor-pointer"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span>+</span>
          <span>THÊM XE MỚI</span>
        </button>
      </div>

      {/* XM06: Banner/Cards chỉ số nổi bật đầu trang */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Tổng số xe mẫu */}
        <div
          onClick={() => {
            setFilterQuick('ALL');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
            filterQuick === 'ALL'
              ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-2 ring-zinc-700'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                filterQuick === 'ALL' ? 'text-zinc-300' : 'text-zinc-500'
              }`}
            >
              Tổng xe mẫu
            </span>
            <span className="text-lg">🏍️</span>
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{stats.total}</div>
          <div className={`text-[11px] mt-1 ${filterQuick === 'ALL' ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Tất cả dòng xe trong hệ thống
          </div>
        </div>

        {/* Card 2: Đang kinh doanh */}
        <div
          onClick={() => {
            setFilterQuick(filterQuick === 'ACTIVE' ? 'ALL' : 'ACTIVE');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
            filterQuick === 'ACTIVE'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                filterQuick === 'ACTIVE' ? 'text-emerald-100' : 'text-emerald-700'
              }`}
            >
              Đang kinh doanh
            </span>
            <span className="text-lg">✅</span>
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-emerald-600">{stats.active}</div>
          <div className={`text-[11px] mt-1 ${filterQuick === 'ACTIVE' ? 'text-emerald-100' : 'text-zinc-500'}`}>
            Đang hiển thị & sẵn sàng phục vụ
          </div>
        </div>

        {/* Card 3: Ngừng kinh doanh / Đang ẩn */}
        <div
          onClick={() => {
            setFilterQuick(filterQuick === 'INACTIVE' ? 'ALL' : 'INACTIVE');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
            filterQuick === 'INACTIVE'
              ? 'bg-amber-700 text-white border-amber-700 shadow-md ring-2 ring-amber-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                filterQuick === 'INACTIVE' ? 'text-amber-100' : 'text-amber-700'
              }`}
            >
              Ngừng kinh doanh / Ẩn
            </span>
            <span className="text-lg">🔒</span>
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-amber-600">{stats.inactive}</div>
          <div className={`text-[11px] mt-1 ${filterQuick === 'INACTIVE' ? 'text-amber-100' : 'text-zinc-500'}`}>
            Tạm dừng hoặc ẩn khỏi showroom web
          </div>
        </div>

        {/* Card 4: Xe mới thêm */}
        <div
          onClick={() => {
            setFilterQuick(filterQuick === 'NEW' ? 'ALL' : 'NEW');
            setCurrentPage(1);
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer select-none ${
            filterQuick === 'NEW'
              ? 'bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-500'
              : 'bg-white text-zinc-900 border-zinc-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                filterQuick === 'NEW' ? 'text-blue-100' : 'text-blue-700'
              }`}
            >
              Xe mới thêm
            </span>
            <span className="text-lg">✨</span>
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-blue-600">{stats.newAdded}</div>
          <div className={`text-[11px] mt-1 ${filterQuick === 'NEW' ? 'text-blue-100' : 'text-zinc-500'}`}>
            Tạo mới trong 30 ngày qua
          </div>
        </div>
      </div>

      {/* Multi-criteria filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 mb-5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="🔍 Tìm theo ID xe, tên xe, màu..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-600"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={filterHang}
              onChange={e => {
                setFilterHang(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Hãng: Tất cả</option>
              {hangOptions.map(h => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Segment Filter */}
          <div>
            <select
              value={filterSegment}
              onChange={e => {
                setFilterSegment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="">Phân khúc: Tất cả</option>
              {phanKhucOptions.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* XM07: Web Visibility Filter */}
          <div>
            <select
              value={filterWebVisibility}
              onChange={e => {
                setFilterWebVisibility(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Web: Tất cả</option>
              <option value="Hien">👁️ Đang hiện trên Web</option>
              <option value="An">🔒 Đã ẩn trên Web</option>
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <select
              value={filterPrice}
              onChange={e => {
                setFilterPrice(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-white focus:outline-none focus:border-red-600"
            >
              <option value="All">Khoảng giá: Tất cả</option>
              <option value="Under30">Dưới 30 triệu</option>
              <option value="30To60">30 - 60 triệu</option>
              <option value="60To90">60 - 90 triệu</option>
              <option value="Above90">Trên 90 triệu</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs text-zinc-500">
          <div>
            Hiển thị <strong>{filtered.length}</strong> / {vehicles.length} xe mẫu{' '}
            {filterQuick !== 'ALL' && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium">
                (Đang lọc thẻ: {filterQuick === 'ACTIVE' ? 'Đang kinh doanh' : filterQuick === 'INACTIVE' ? 'Ngừng kinh doanh / Ẩn' : 'Xe mới thêm'})
              </span>
            )}
          </div>
          {(search ||
            filterHang ||
            filterSegment ||
            filterTestDrive !== 'All' ||
            filterWebVisibility !== 'All' ||
            filterPrice !== 'All' ||
            filterQuick !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterHang('');
                setFilterSegment('');
                setFilterTestDrive('All');
                setFilterWebVisibility('All');
                setFilterPrice('All');
                setFilterQuick('ALL');
              }}
              className="text-red-700 font-bold hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-xs">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950 text-white font-mono text-xs uppercase">
            <tr>
              {/* XM02: Thay STT bằng ID xe */}
              <th className="p-3 text-center">MÃ XE (ID)</th>
              <th className="p-3 text-center">Ảnh</th>
              <th className="p-3 text-left">Tên xe mẫu</th>
              <th className="p-3 text-left">Hãng & Phân khúc</th>
              <th className="p-3 text-right">Giá niêm yết</th>
              <th className="p-3 text-center">Tồn kho / VAT</th>
              <th className="p-3 text-left">Phiên bản màu</th>
              {/* XM07: Cột Ẩn/Hiện trên Web */}
              <th className="p-3 text-center">Hiển thị Web</th>
              <th className="p-3 text-center">Lái thử</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-zinc-500 text-xs">
                  Không tìm thấy xe mẫu nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              pagedVehicles.map(v => {
                const isHidden = v.trangThaiHienThi === 'An';
                return (
                  <tr key={v.id} className={`hover:bg-zinc-50 transition ${isHidden ? 'bg-zinc-50/50 opacity-90' : ''}`}>
                    {/* XM02: Hiển thị ID xe thay vì STT */}
                    <td className="p-3 text-center">
                      <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-md border border-red-200 inline-block shadow-2xs">
                        {v.id}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {v.hinhAnh ? (
                        <img
                          src={v.hinhAnh}
                          alt={v.tenXe}
                          className="h-10 w-14 object-cover rounded-lg mx-auto border border-zinc-200 shadow-2xs cursor-pointer hover:scale-105 transition"
                          onClick={() => setViewingVehicle(v)}
                        />
                      ) : (
                        <div className="h-10 w-14 bg-zinc-100 rounded-lg flex items-center justify-center text-[10px] text-zinc-400 mx-auto font-mono">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-zinc-900 hover:text-red-700 cursor-pointer" onClick={() => setViewingVehicle(v)}>
                        {v.tenXe}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Năm: {v.namSanXuat || 2025} • Xuất xứ: {v.xuatXu || 'Việt Nam'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-xs text-zinc-800">{v.hang}</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 font-mono mt-0.5">
                        {v.phanKhuc}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-xs font-bold text-red-700">
                      {formatVND(v.giaNiemYet)}
                    </td>
                    <td className="p-3 text-center font-mono text-xs">
                      {(v.soLuong ?? 10) <= 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                          ⛔ Hết hàng (0)
                        </span>
                      ) : (v.soLuong ?? 10) <= 5 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⚠️ Sắp hết ({v.soLuong} xe)
                        </span>
                      ) : (
                        <span className="font-bold text-zinc-800">{v.soLuong ?? 10} xe</span>
                      )}
                      <div className="text-[10px] text-zinc-500 mt-0.5">VAT: {v.vat ?? 10}%</div>
                    </td>
                    <td className="p-3 text-xs text-zinc-600 max-w-xs">
                      <div className="truncate" title={v.mauSac}>
                        {v.mauSac}
                      </div>
                    </td>
                    {/* XM07: Nút chuyển đổi Ẩn/Hiện xe trên Web */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleWebVisibility(v)}
                        title={isHidden ? 'Nhấn để hiện xe lên Website Showroom' : 'Nhấn để ẩn xe khỏi Website Showroom'}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 mx-auto shadow-2xs ${
                          isHidden
                            ? 'bg-zinc-100 text-zinc-600 border border-zinc-300 hover:bg-zinc-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        <span className="text-xs">{isHidden ? '🔒' : '👁️'}</span>
                        <span>{isHidden ? 'Đã ẩn' : 'Đang hiện'}</span>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      {v.coTheLaiThu ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-semibold font-mono">
                          ✓ Lái thử
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full text-[11px] font-medium font-mono">
                          Không
                        </span>
                      )}
                    </td>
                    {/* Thao tác: Chi tiết, Sửa, Xóa */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingVehicle(v)}
                          className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 cursor-pointer"
                          title="Xem chi tiết thông số kỹ thuật"
                        >
                          👁️ Chi tiết
                        </button>
                        <button
                          onClick={() => handleEdit(v)}
                          className="px-2 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-white border-t border-zinc-200">
            <div className="text-xs text-zinc-500 font-mono">
              Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
              <strong>{Math.min(currentPage * pageSize, filtered.length)}</strong> trên tổng số{' '}
              <strong>{filtered.length}</strong> xe mẫu (Trang {currentPage}/{totalPages})
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                « Đầu
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                ‹ Trước
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 text-xs font-bold rounded-lg transition font-mono cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                Tiếp ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-mono cursor-pointer"
              >
                Cuối »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal XM04 & XM03: Thêm / Sửa xe mẫu với các tab chuyên biệt */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-zinc-200 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div>
                <h2 className="text-base font-extrabold uppercase text-zinc-900" style={{ fontFamily: 'var(--font-display)' }}>
                  {editVehicle ? `SỬA XE MẪU (${editVehicle.id})` : 'THÊM XE MẪU MỚI'}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Điền đầy đủ các thông tin kỹ thuật, số lượng tồn kho, giá bán và các tùy chọn màu sắc
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 mt-3 text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setModalTab('basic')}
                className={`py-2.5 px-4 border-b-2 cursor-pointer transition ${
                  modalTab === 'basic' ? 'border-red-700 text-red-700' : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                1. Thông tin cơ bản & Kho
              </button>
              <button
                type="button"
                onClick={() => setModalTab('colors')}
                className={`py-2.5 px-4 border-b-2 cursor-pointer transition ${
                  modalTab === 'colors' ? 'border-red-700 text-red-700' : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                2. Phiên bản màu ({colorList.filter(c => c.trim()).length}) & Mô tả
              </button>
              <button
                type="button"
                onClick={() => setModalTab('specs')}
                className={`py-2.5 px-4 border-b-2 cursor-pointer transition ${
                  modalTab === 'specs' ? 'border-red-700 text-red-700' : 'border-transparent text-zinc-500 hover:text-zinc-900'
                }`}
              >
                3. Thông số kỹ thuật chi tiết
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex-1 pr-1 space-y-4">
              {/* TAB 1: Cơ bản & Kho xe */}
              {modalTab === 'basic' && (
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Tên mẫu xe *</label>
                    <input
                      type="text"
                      placeholder="VD: Honda SH 160i ABS 2025"
                      value={form.tenXe ?? ''}
                      onChange={e => setForm({ ...form, tenXe: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                    {errors.tenXe && <p className="text-[11px] text-red-600 mt-0.5">{errors.tenXe}</p>}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Hãng sản xuất *</label>
                    <select
                      value={form.hang ?? ''}
                      onChange={e => setForm({ ...form, hang: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                    >
                      <option value="">Chọn hãng</option>
                      {hangOptions.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    {errors.hang && <p className="text-[11px] text-red-600 mt-0.5">{errors.hang}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Phân khúc xe *</label>
                    <select
                      value={form.phanKhuc ?? ''}
                      onChange={e => setForm({ ...form, phanKhuc: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                    >
                      <option value="">Chọn phân khúc</option>
                      {phanKhucOptions.map(p => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.phanKhuc && <p className="text-[11px] text-red-600 mt-0.5">{errors.phanKhuc}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Giá niêm yết (VNĐ) *</label>
                    <input
                      type="number"
                      min="0"
                      step="100000"
                      placeholder="VD: 55000000"
                      value={form.giaNiemYet ?? ''}
                      onChange={e => setForm({ ...form, giaNiemYet: Number(e.target.value) })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono font-bold"
                    />
                    {form.giaNiemYet ? (
                      <div className="text-[11px] text-emerald-600 font-mono mt-1 font-semibold">
                        ➔ Định dạng: {formatVND(form.giaNiemYet)}
                      </div>
                    ) : null}
                    {errors.giaNiemYet && <p className="text-[11px] text-red-600 mt-0.5">{errors.giaNiemYet}</p>}
                  </div>

                  {/* XM04: Số lượng tồn & VAT */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Số lượng tồn kho (xe)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.soLuong ?? 10}
                      onChange={e => setForm({ ...form, soLuong: Number(e.target.value) })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Thuế VAT (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.vat ?? 10}
                      onChange={e => setForm({ ...form, vat: Number(e.target.value) })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>

                  {/* XM04: Nhà cung cấp & Năm SX */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Nhà cung cấp (NCC)</label>
                    <input
                      type="text"
                      placeholder="VD: Công ty Honda Việt Nam"
                      value={form.ncc ?? ''}
                      onChange={e => setForm({ ...form, ncc: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Năm sản xuất</label>
                    <input
                      type="number"
                      min="2010"
                      max="2035"
                      value={form.namSanXuat ?? 2025}
                      onChange={e => setForm({ ...form, namSanXuat: Number(e.target.value) })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>

                  {/* Xuất xứ & Trạng thái KD */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Xuất xứ lắp ráp</label>
                    <input
                      type="text"
                      placeholder="VD: Việt Nam, Nhập khẩu Nhật Bản, Thái Lan..."
                      value={form.xuatXu ?? 'Việt Nam'}
                      onChange={e => setForm({ ...form, xuatXu: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Trạng thái kinh doanh</label>
                    <select
                      value={form.trangThaiKinhDoanh ?? 'DangKinhDoanh'}
                      onChange={e => setForm({ ...form, trangThaiKinhDoanh: e.target.value as any })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                    >
                      <option value="DangKinhDoanh">Đang kinh doanh</option>
                      <option value="NgungKinhDoanh">Ngừng kinh doanh</option>
                    </select>
                  </div>

                  {/* XM07: Thiết lập hiển thị web */}
                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Trạng thái hiển thị trên Website</label>
                    <select
                      value={form.trangThaiHienThi ?? 'Hien'}
                      onChange={e => setForm({ ...form, trangThaiHienThi: e.target.value as any })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 font-semibold"
                    >
                      <option value="Hien">👁️ Hiển thị trên website</option>
                      <option value="An">🔒 Ẩn trên website</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="coTheLaiThu"
                      checked={!!form.coTheLaiThu}
                      onChange={e => setForm({ ...form, coTheLaiThu: e.target.checked })}
                      className="w-4 h-4 accent-red-700 cursor-pointer"
                    />
                    <label htmlFor="coTheLaiThu" className="font-semibold text-zinc-800 cursor-pointer">
                      Có sẵn xe lái thử tại showroom
                    </label>
                  </div>

                  <div className="col-span-2 pt-2">
                    <ImageUploader
                      value={form.hinhAnh ?? ''}
                      onChange={url => setForm({ ...form, hinhAnh: url })}
                      label="Hình ảnh xe mẫu"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Phiên bản màu (XM03) & Mô tả */}
              {modalTab === 'colors' && (
                <div className="space-y-4 text-xs">
                  {/* XM03: Thiết kế dạng nhiều khung màu riêng biệt */}
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                          <span>🎨</span>
                          <span>CÁC KHUNG MÀU SẮC RIÊNG BIỆT ({colorList.length} màu)</span>
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Khung Màu 1 gồm ô nhập và nút "Thêm màu". Nhấn "Thêm màu" để tạo Màu 2, Màu 3... Mỗi màu có nút Xóa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddColor}
                        className="px-3.5 py-1.5 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>+</span>
                        <span>Thêm màu</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {colorList.map((cName, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs"
                        >
                          <div className="w-20 text-[11px] font-bold text-zinc-600 font-mono shrink-0">
                            Khung Màu #{idx + 1}
                          </div>
                          <input
                            type="text"
                            value={cName}
                            onChange={e => handleColorChange(idx, e.target.value)}
                            placeholder={`VD: ${
                              idx === 0
                                ? 'Đen mờ / Đen nhám'
                                : idx === 1
                                ? 'Đỏ đen thể thao'
                                : idx === 2
                                ? 'Trắng bạc ngọc trai'
                                : 'Xám xi măng'
                            }`}
                            className="flex-1 px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-red-600 font-medium"
                          />
                          {idx === 0 && colorList.length === 1 && (
                            <button
                              type="button"
                              onClick={handleAddColor}
                              className="px-3 py-1.5 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                            >
                              + Thêm màu
                            </button>
                          )}
                          {colorList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColor(idx)}
                              className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                              title="Loại bỏ màu này"
                            >
                              ✕ Xóa
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.mauSac && <p className="text-[11px] text-red-600 font-medium">{errors.mauSac}</p>}
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 mb-1">Mô tả đặc điểm xe</label>
                    <textarea
                      rows={4}
                      placeholder="Mô tả phong cách thiết kế, tiện ích nổi bật, trang bị an toàn của mẫu xe..."
                      value={form.moTa ?? ''}
                      onChange={e => setForm({ ...form, moTa: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Thông số kỹ thuật chi tiết (XM04) */}
              {modalTab === 'specs' && (
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="col-span-2">
                    <p className="text-[11px] text-zinc-500 bg-blue-50/70 text-blue-900 p-2.5 rounded-xl border border-blue-100">
                      ℹ️ Các thông số kỹ thuật nhập ở đây sẽ tự động hiển thị đầy đủ trong phần <strong>Mô tả xe trên Website Showroom</strong> và <strong>Chi tiết xe quản lý Admin</strong>.
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Loại động cơ</label>
                    <input
                      type="text"
                      placeholder="VD: 4 kỳ, 1 xi-lanh, làm mát bằng dung dịch, eSP+"
                      value={form.loaiDongCo ?? ''}
                      onChange={e => setForm({ ...form, loaiDongCo: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Dung tích xi-lanh</label>
                    <input
                      type="text"
                      placeholder="VD: 156.9 cm³ (hoặc 124.8 cc)"
                      value={form.dungTichXiLanh ?? ''}
                      onChange={e => setForm({ ...form, dungTichXiLanh: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Mức tiêu thụ nhiên liệu</label>
                    <input
                      type="text"
                      placeholder="VD: 2.24 L/100km"
                      value={form.tieuThuNhienLieu ?? ''}
                      onChange={e => setForm({ ...form, tieuThuNhienLieu: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Khối lượng bản thân</label>
                    <input
                      type="text"
                      placeholder="VD: 134 kg"
                      value={form.khoiLuong ?? ''}
                      onChange={e => setForm({ ...form, khoiLuong: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Kích thước (Dài x Rộng x Cao)</label>
                    <input
                      type="text"
                      placeholder="VD: 2.090 x 739 x 1.129 mm"
                      value={form.kichThuoc ?? ''}
                      onChange={e => setForm({ ...form, kichThuoc: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Độ cao yên</label>
                    <input
                      type="text"
                      placeholder="VD: 799 mm"
                      value={form.doCaoYen ?? ''}
                      onChange={e => setForm({ ...form, doCaoYen: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Dung tích bình xăng</label>
                    <input
                      type="text"
                      placeholder="VD: 7.8 lít"
                      value={form.dungTichBinhXang ?? ''}
                      onChange={e => setForm({ ...form, dungTichBinhXang: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block font-semibold text-zinc-700 mb-1">Hệ thống phanh</label>
                    <input
                      type="text"
                      placeholder="VD: Phanh đĩa trước & sau, tích hợp ABS 2 kênh"
                      value={form.heThongPhanh ?? ''}
                      onChange={e => setForm({ ...form, heThongPhanh: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-semibold text-zinc-700 mb-1">Kích cỡ lốp xe</label>
                    <input
                      type="text"
                      placeholder="VD: Trước: 100/80-16, Sau: 120/80-16"
                      value={form.kichCoLop ?? ''}
                      onChange={e => setForm({ ...form, kichCoLop: e.target.value })}
                      className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
              <div className="flex gap-2">
                {modalTab !== 'basic' && (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'specs' ? 'colors' : 'basic')}
                    className="px-3.5 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                  >
                    ‹ Quay lại
                  </button>
                )}
                {modalTab !== 'specs' && (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'basic' ? 'colors' : 'specs')}
                    className="px-3.5 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                  >
                    Tiếp theo ›
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 shadow cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XM05: Modal Xem Chi Tiết Thông Số Kỹ Thuật Đầy Đủ Phía Admin */}
      {viewingVehicle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-zinc-200 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-start pb-4 border-b border-zinc-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {viewingVehicle.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 font-mono">
                    {viewingVehicle.hang} • {viewingVehicle.phanKhuc}
                  </span>
                  {viewingVehicle.trangThaiHienThi === 'An' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      🔒 Đang ẩn trên Web
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      👁️ Đang hiện trên Web
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black uppercase text-zinc-900 mt-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {viewingVehicle.tenXe}
                </h2>
              </div>
              <button
                onClick={() => setViewingVehicle(null)}
                className="text-zinc-400 hover:text-zinc-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex-1 pr-1 space-y-5 text-xs">
              {/* Header card: Ảnh + Giá + Tồn kho */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div className="sm:col-span-1">
                  {viewingVehicle.hinhAnh ? (
                    <img
                      src={viewingVehicle.hinhAnh}
                      alt={viewingVehicle.tenXe}
                      className="w-full h-36 object-cover rounded-xl border border-zinc-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-full h-36 bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 font-mono">
                      Không có ảnh
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-500">Giá niêm yết:</span>
                    <strong className="text-lg font-black text-red-700 font-mono">
                      {formatVND(viewingVehicle.giaNiemYet)}
                    </strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Tồn kho khả dụng:</span>
                      <strong className="text-zinc-800 font-mono text-sm">{viewingVehicle.soLuong ?? 10} xe</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Thuế VAT:</span>
                      <strong className="text-zinc-800 font-mono text-sm">{viewingVehicle.vat ?? 10}%</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Năm sản xuất:</span>
                      <strong className="text-zinc-800 font-mono">{viewingVehicle.namSanXuat ?? 2025}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">Xuất xứ:</span>
                      <strong className="text-zinc-800">{viewingVehicle.xuatXu ?? 'Việt Nam'}</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Nhà cung cấp:</span>
                    <strong className="text-zinc-800">{viewingVehicle.ncc ?? `${viewingVehicle.hang} Việt Nam`}</strong>
                  </div>
                </div>
              </div>

              {/* XM05: Bảng thông số kỹ thuật đầy đủ */}
              <div>
                <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-xs">
                  <span>⚙️</span>
                  <span>BẢNG THÔNG SỐ KỸ THUẬT CHI TIẾT</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Loại động cơ:</span>
                    <strong className="text-zinc-900 font-mono text-right ml-2">
                      {viewingVehicle.loaiDongCo || viewingVehicle.dongCo || '4 kỳ, 1 xi-lanh'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Dung tích xi-lanh:</span>
                    <strong className="text-zinc-900 font-mono">{viewingVehicle.dungTichXiLanh || '150 cc'}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Mức tiêu thụ nhiên liệu:</span>
                    <strong className="text-emerald-700 font-mono">
                      {viewingVehicle.tieuThuNhienLieu || viewingVehicle.tieuHaoNhienLieu || '2.20 L/100km'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Khối lượng bản thân:</span>
                    <strong className="text-zinc-900 font-mono">{viewingVehicle.khoiLuong || '125 kg'}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Kích thước (DxRxC):</span>
                    <strong className="text-zinc-900 font-mono text-right ml-2">
                      {viewingVehicle.kichThuoc || '1.950 x 690 x 1.100 mm'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Độ cao yên:</span>
                    <strong className="text-zinc-900 font-mono">{viewingVehicle.doCaoYen || '780 mm'}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Dung tích bình xăng:</span>
                    <strong className="text-zinc-900 font-mono">{viewingVehicle.dungTichBinhXang || '5.5 L'}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-500">Hệ thống phanh:</span>
                    <strong className="text-zinc-900 font-mono text-right ml-2">
                      {viewingVehicle.heThongPhanh || viewingVehicle.phanh || 'Phanh đĩa'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 sm:col-span-2">
                    <span className="text-zinc-500">Kích cỡ lốp:</span>
                    <strong className="text-zinc-900 font-mono">{viewingVehicle.kichCoLop || 'Lốp không săm'}</strong>
                  </div>
                </div>
              </div>

              {/* Các phiên bản màu sắc */}
              <div>
                <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 text-xs">
                  <span>🎨</span>
                  <span>CÁC PHIÊN BẢN MÀU SẮC</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {viewingVehicle.mauSac
                    .split(',')
                    .map(c => c.trim())
                    .filter(Boolean)
                    .map((color, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium text-xs flex items-center gap-1.5"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                        <span>{color}</span>
                      </span>
                    ))}
                </div>
              </div>

              {/* Mô tả */}
              {viewingVehicle.moTa && (
                <div>
                  <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-1.5 text-xs">Mô tả tổng quan</h3>
                  <p className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 leading-relaxed text-xs">
                    {viewingVehicle.moTa}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
              <button
                onClick={() => {
                  const target = viewingVehicle;
                  setViewingVehicle(null);
                  handleEdit(target);
                }}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                ✏️ Chỉnh sửa thông tin
              </button>
              <button
                onClick={() => setViewingVehicle(null)}
                className="px-5 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
