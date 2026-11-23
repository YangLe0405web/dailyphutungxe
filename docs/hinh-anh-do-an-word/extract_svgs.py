import os, re

base_dir = r"d:\crm-project\docs\hinh-anh-do-an-word"
mapping = [
    ("export_hinh_2_2.html", "Hinh_2.2_So_do_luong_du_lieu_DFD_muc_ngu_canh.svg"),
    ("export_hinh_2_3.html", "Hinh_2.3_So_do_luong_du_lieu_DFD_muc_dinh.svg"),
    ("export_hinh_2_4a.html", "Hinh_2.4A_DFD_muc_duoi_dinh_Tien_trinh_3.0_Ban_hang.svg"),
    ("export_hinh_2_4b.html", "Hinh_2.4B_DFD_muc_duoi_dinh_Tien_trinh_4.0_Dich_vu_ky_thuat.svg")
]

for html_file, svg_file in mapping:
    with open(os.path.join(base_dir, html_file), "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"(<svg[\s\S]*?</svg>)", content)
    if match:
        svg_content = match.group(1)
        with open(os.path.join(base_dir, svg_file), "w", encoding="utf-8") as out:
            out.write(svg_content)
        print(f"Extracted {svg_file}")

print("ALL SVG FILES EXTRACTED!")
