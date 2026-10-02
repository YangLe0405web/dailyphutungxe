export interface Ward {
  name: string;
}

export interface District {
  name: string;
  wards: string[];
}

export interface Province {
  name: string;
  districts: District[];
}

export const VIETNAM_LOCATIONS: Province[] = [
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Tân Định'],
      },
      {
        name: 'Quận 3',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường Võ Thị Sáu', 'Phường 11', 'Phường 12', 'Phường 14'],
      },
      {
        name: 'Quận 5',
        wards: ['Phường 1', 'Phường 2', 'Phường 5', 'Phường 6', 'Phường 8', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14'],
      },
      {
        name: 'Quận 7',
        wards: ['Phường Tân Thuận Đông', 'Phường Tân Thuận Tây', 'Phường Tân Kiểng', 'Phường Tân Hưng', 'Phường Bình Thuận', 'Phường Tân Quy', 'Phường Phú Thuận', 'Phường Tân Phú', 'Phường Tân Phong', 'Phường Phú Mỹ'],
      },
      {
        name: 'Quận 10',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 10', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'],
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17'],
      },
      {
        name: 'Quận Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
      },
      {
        name: 'TP. Thủ Đức',
        wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường An Khánh', 'Phường Bình An', 'Phường Bình Trưng Đông', 'Phường Bình Trưng Tây', 'Phường Linh Trung', 'Phường Linh Chiểu', 'Phường Hiệp Bình Chánh', 'Phường Tam Phú'],
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14', 'Phường 16'],
      },
    ],
  },
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Phúc Xá', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc', 'Phường Cống Vị', 'Phường Liễu Giai', 'Phường Kim Mã', 'Phường Giảng Võ', 'Phường Thành Công'],
      },
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Phúc Tân', 'Phường Đồng Xuân', 'Phường Hàng Mã', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Hàng Bồ', 'Phường Cửa Đông', 'Phường Tràng Tiền', 'Phường Phan Chu Trinh'],
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Văn Miếu', 'Phường Quốc Tử Giám', 'Phường Láng Thượng', 'Phường Ô Chợ Dừa', 'Phường Trung Tự', 'Phường Khâm Thiên', 'Phường Phương Mai'],
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa'],
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Nguyễn Du', 'Phường Bạch Đằng', 'Phường Phạm Đình Hổ', 'Phường Đồng Nhân', 'Phường Phố Huế', 'Phường Đống Mác', 'Phường Thanh Lương', 'Phường Bạch Mai', 'Phường Minh Khai'],
      },
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Thuận Tây', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'],
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường Tam Thuận', 'Phường Thanh Khê Tây', 'Phường Thanh Khê Đông', 'Phường Xuân Hà', 'Phường Tân Chính', 'Phường Chính Gián', 'Phường Vĩnh Trung', 'Phường Thạc Gián', 'Phường An Khê'],
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Tây', 'Phường An Hải Đông', 'Phường Phước Mỹ', 'Phường Mân Thái', 'Phường Nại Hiên Đông', 'Phường Thọ Quang'],
      },
    ],
  },
  {
    name: 'Bình Dương',
    districts: [
      {
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa', 'Phường Phú Hòa', 'Phường Phú Lợi', 'Phường Định Hòa', 'Phường Hiệp An'],
      },
      {
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thiêu', 'Phường An Phú', 'Phường Bình Hòa', 'Phường Bình Chuẩn', 'Phường Thuận Giao', 'Phường Vĩnh Phú'],
      },
      {
        name: 'TP. Dĩ An',
        wards: ['Phường Dĩ An', 'Phường Tân Bình', 'Phường Tân Đông Hiệp', 'Phường Bình An', 'Phường Bình Thắng', 'Phường Đông Hòa', 'Phường An Bình'],
      },
    ],
  },
  {
    name: 'Cần Thơ',
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường Cái Khế', 'Phường An Hòa', 'Phường Thới Bình', 'Phường An Nghiệp', 'Phường An Cư', 'Phường Tân An', 'Phường Xuân Khánh', 'Phường Hưng Lợi'],
      },
      {
        name: 'Quận Bình Thủy',
        wards: ['Phường Bình Thủy', 'Phường Trà An', 'Phường Trà Nóc', 'Phường Thới An Đông', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền'],
      },
    ],
  },
];
