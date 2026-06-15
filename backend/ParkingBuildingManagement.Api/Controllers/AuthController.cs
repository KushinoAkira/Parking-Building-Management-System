using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ParkingBuildingManagement.DTOs;

namespace ParkingBuildingManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            var connectionString = _configuration.GetConnectionString("DefaultConnection");

            using var connection = new SqlConnection(connectionString);
            connection.Open();

            var sql = @"
                SELECT 
                    u.UserID,
                    u.FullName,
                    u.Email,
                    u.Status,
                    r.RoleName
                FROM Users u
                INNER JOIN Roles r ON u.RoleID = r.RoleID
                WHERE u.Email = @Email
                  AND u.PasswordHash = @Password
                  AND u.Status = 'Active'
            ";

            using var command = new SqlCommand(sql, connection);
            command.Parameters.AddWithValue("@Email", request.Email);
            command.Parameters.AddWithValue("@Password", request.Password);

            using var reader = command.ExecuteReader();

            if (!reader.Read())
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var response = new LoginResponse
            {
                UserID = reader.GetInt32(reader.GetOrdinal("UserID")),
                FullName = reader.GetString(reader.GetOrdinal("FullName")),
                Email = reader.GetString(reader.GetOrdinal("Email")),
                Status = reader.GetString(reader.GetOrdinal("Status")),
                RoleName = reader.GetString(reader.GetOrdinal("RoleName"))
            };

            return Ok(response);
        }
    }
}