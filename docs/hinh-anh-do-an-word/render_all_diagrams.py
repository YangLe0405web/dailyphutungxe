from playwright.sync_api import sync_playwright
import os

configs = [
    {
        "html": "export_hinh_2_1.html",
        "output": "Hinh_2.1_So_do_phan_cap_chuc_nang_BFD_muc_2.png",
        "width": 1360,
        "height": 650
    },
    {
        "html": "export_hinh_2_2.html",
        "output": "Hinh_2.2_So_do_luong_du_lieu_DFD_muc_ngu_canh.png",
        "width": 1250,
        "height": 830
    },
    {
        "html": "export_hinh_2_3.html",
        "output": "Hinh_2.3_So_do_luong_du_lieu_DFD_muc_dinh.png",
        "width": 1350,
        "height": 990
    },
    {
        "html": "export_hinh_2_4a.html",
        "output": "Hinh_2.4A_DFD_muc_duoi_dinh_Tien_trinh_3.0_Ban_hang.png",
        "width": 1150,
        "height": 610
    },
    {
        "html": "export_hinh_2_4b.html",
        "output": "Hinh_2.4B_DFD_muc_duoi_dinh_Tien_trinh_4.0_Dich_vu_ky_thuat.png",
        "width": 1150,
        "height": 610
    }
]

base_dir = r"d:\crm-project\docs\hinh-anh-do-an-word"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        headless=True
    )
    for cfg in configs:
        page = browser.new_page(
            viewport={"width": cfg["width"], "height": cfg["height"]},
            device_scale_factor=2 # 2x Retina scale for ultra sharp printing/word insertion
        )
        url = "file:///" + os.path.join(base_dir, cfg["html"]).replace("\\", "/")
        print(f"Rendering {cfg['output']} from {url}...")
        page.goto(url)
        page.wait_for_timeout(800)
        out_path = os.path.join(base_dir, cfg["output"])
        page.screenshot(path=out_path)
        page.close()
        size_kb = os.path.getsize(out_path) / 1024
        print(f" -> Done: {cfg['output']} ({size_kb:.1f} KB)")

    browser.close()

print("\nALL 5 DIAGRAMS RENDERED AT 2X RETINA RESOLUTION SUCCESSFULLY!")
