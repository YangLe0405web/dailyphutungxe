using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        // Chỉ cho phép các định dạng ảnh hợp lệ
        private static readonly HashSet<string> _allowedExtensions = new()
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
        };

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // POST: api/Upload/base64
        [HttpPost("base64")]
        public async Task<IActionResult> UploadBase64([FromBody] UploadBase64Dto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.Base64Data))
                    return BadRequest(new { message = "Dữ liệu ảnh không hợp lệ." });

                // Lọc bỏ header "data:image/png;base64," nếu có
                var match = Regex.Match(dto.Base64Data, @"data:image/(?<type>.+?);base64,(?<data>.+)");
                string base64Data = match.Success ? match.Groups["data"].Value : dto.Base64Data;

                byte[] imageBytes = Convert.FromBase64String(base64Data);

                // Tạo thư mục uploads nếu chưa có
                string uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                string ext = match.Success ? $".{match.Groups["type"].Value.ToLower()}" : ".png";

                // FIX BẢO MẬT: Kiểm tra đuôi file hợp lệ trước khi lưu
                if (!_allowedExtensions.Contains(ext))
                    return BadRequest(new { message = $"Định dạng file '{ext}' không được phép. Chỉ chấp nhận: jpg, jpeg, png, gif, webp." });

                string uniqueFileName = Guid.NewGuid().ToString() + ext;
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

                string fileUrl = $"{Request.Scheme}://{Request.Host}/api/Upload/images/{uniqueFileName}";
                return Ok(new { url = fileUrl, message = "Upload thành công!" });
            }
            catch (FormatException)
            {
                return BadRequest(new { message = "Chuỗi Base64 không hợp lệ." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi upload: " + ex.Message });
            }
        }

        // GET: api/Upload/images/{fileName}
        [HttpGet("images/{fileName}")]
        public IActionResult GetImage(string fileName)
        {
            // FIX BẢO MẬT: Ngăn chặn Path Traversal Attack
            // Chỉ cho phép tên file thuần (không có /, \, ..)
            if (fileName.Contains('/') || fileName.Contains('\\') || fileName.Contains(".."))
                return BadRequest(new { message = "Tên file không hợp lệ." });

            string uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
            string filePath = Path.Combine(uploadsFolder, fileName);

            // Xác nhận đường dẫn cuối cùng phải nằm trong thư mục uploads
            if (!Path.GetFullPath(filePath).StartsWith(Path.GetFullPath(uploadsFolder)))
                return BadRequest(new { message = "Truy cập bị từ chối." });

            if (!System.IO.File.Exists(filePath))
                return NotFound(new { message = "Không tìm thấy file ảnh." });

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out string? contentType))
                contentType = "application/octet-stream";

            var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            return File(fileStream, contentType);
        }

        // DELETE: api/Upload/images/{fileName}
        [HttpDelete("images/{fileName}")]
        public IActionResult DeleteImage(string fileName)
        {
            try
            {
                // FIX BẢO MẬT: Ngăn chặn Path Traversal Attack
                if (fileName.Contains('/') || fileName.Contains('\\') || fileName.Contains(".."))
                    return BadRequest(new { message = "Tên file không hợp lệ." });

                string uploadsFolder = Path.Combine(_env.ContentRootPath, "uploads");
                string filePath = Path.Combine(uploadsFolder, fileName);

                // Xác nhận đường dẫn cuối cùng phải nằm trong thư mục uploads
                if (!Path.GetFullPath(filePath).StartsWith(Path.GetFullPath(uploadsFolder)))
                    return BadRequest(new { message = "Truy cập bị từ chối." });

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "Không tìm thấy file ảnh để xóa." });

                System.IO.File.Delete(filePath);
                return Ok(new { message = $"Đã xóa file {fileName} thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa ảnh: " + ex.Message });
            }
        }
    }
}
