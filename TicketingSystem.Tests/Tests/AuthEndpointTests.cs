// ============================================================
// AuthEndpointTests.cs
// Integration tests for /auth/register, /auth/login, /auth/forgot-password
//
// HOW TO RUN:
//   dotnet test
//
// PACKAGES NEEDED (add to your .csproj):
//   <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.*" />
//   <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.*" />
//   <PackageReference Include="xunit" Version="2.9.*" />
//   <PackageReference Include="FluentAssertions" Version="8.*" />
// ============================================================

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TicketingSystem.Db;

namespace TicketingSystem.Tests;

// ──────────────────────────────────────────────────────────────
// Custom WebApplicationFactory
// Replaces the real SQL Server DB with an in-memory database
// so tests run without any database server installed.
// ──────────────────────────────────────────────────────────────
public class TestWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost( IWebHostBuilder builder )
    {
        builder.ConfigureServices ( services =>
        {
            // Remove the real DbContext registration
            services.RemoveAll<DbContextOptions<TicketingSystemDbContext>> ();
            services.RemoveAll<TicketingSystemDbContext> ();

            // Add a fresh in-memory DB for every test run
            services.AddDbContext<TicketingSystemDbContext> ( options =>
                options.UseInMemoryDatabase ( $"TestDb_{Guid.NewGuid ()}" ) );
        } );
    }
}

// ──────────────────────────────────────────────────────────────
// AUTH TESTS
// ──────────────────────────────────────────────────────────────
public class AuthEndpointTests : IClassFixture<TestWebAppFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointTests( TestWebAppFactory factory )
    {
        _client = factory.CreateClient ();
    }

    // ──────────────────────────────────────────
    // REGISTER TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: POST /auth/register with valid data
    /// EXPECT: 200 OK + user details returned
    /// WHY: This is the most critical happy path — user must be able to sign up
    /// </summary>
    [Fact]
    public async Task Register_WithValidData_Returns200AndUserInfo( )
    {
        // Arrange — build a valid registration payload
        var request = new
        {
            fullName = "John Doe",
            email = "john.doe@.com",
            password = "SecurePass123!",
            department = "Finance"
        };

        // Act — POST to the register endpoint
        var response = await _client.PostAsJsonAsync ( "/auth/register", request );

        // Assert — check status code and response body
        response.StatusCode.Should ().Be ( HttpStatusCode.OK );

        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto> ();
        body.Should ().NotBeNull ();
        body!.FullName.Should ().Be ( "John Doe" );
        body.Email.Should ().Be ( "john.doe@.com" );
        body.IsITTeam.Should ().BeFalse ( "self-registered users are always Employees, never IT" );
    }

    /// <summary>
    /// WHAT: POST /auth/register with the same email twice
    /// EXPECT: 400 Bad Request — duplicate emails are not allowed
    /// WHY: Prevents two accounts with the same email in the system
    /// </summary>
    [Fact]
    public async Task Register_WithDuplicateEmail_Returns400( )
    {
        // Arrange — register a user first
        var request = new
        {
            fullName = "Jane Smith",
            email = "jane.smith@.com",
            password = "Password123!",
            department = ( string? ) null
        };
        await _client.PostAsJsonAsync ( "/auth/register", request );

        // Act — try to register the same email again
        var response = await _client.PostAsJsonAsync ( "/auth/register", request );

        // Assert
        response.StatusCode.Should ().Be ( HttpStatusCode.BadRequest );
    }

    /// <summary>
    /// WHAT: POST /auth/register with empty email and password
    /// EXPECT: 400 Bad Request
    /// WHY: The API must reject incomplete registration data
    /// </summary>
    [Fact]
    public async Task Register_WithEmptyEmailOrPassword_Returns400( )
    {
        var request = new { fullName = "Test User", email = "", password = "", department = "" };

        var response = await _client.PostAsJsonAsync ( "/auth/register", request );

        response.StatusCode.Should ().Be ( HttpStatusCode.BadRequest );
    }

    // ──────────────────────────────────────────
    // LOGIN TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: POST /auth/login with correct credentials
    /// EXPECT: 200 OK + correct user data (userId, name, isITTeam)
    /// WHY: Login is the entry point for everything else in the app
    /// </summary>
    [Fact]
    public async Task Login_WithCorrectCredentials_Returns200AndUserInfo( )
    {
        // Arrange — register a user first so they exist in the DB
        var registerRequest = new
        {
            fullName = "Alice IT",
            email = "alice@.com",
            password = "MyPassword99!",
            department = "IT"
        };
        await _client.PostAsJsonAsync ( "/auth/register", registerRequest );

        // Act — log in with correct credentials
        var loginRequest = new { email = "alice@.com", password = "MyPassword99!" };
        var response = await _client.PostAsJsonAsync ( "/auth/login", loginRequest );

        // Assert
        response.StatusCode.Should ().Be ( HttpStatusCode.OK );

        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto> ();
        body.Should ().NotBeNull ();
        body!.Email.Should ().Be ( "alice@.com" );
        body.FullName.Should ().Be ( "Alice IT" );
    }

    /// <summary>
    /// WHAT: POST /auth/login with wrong password
    /// EXPECT: 401 Unauthorized
    /// WHY: Wrong passwords must never grant access
    /// </summary>
    [Fact]
    public async Task Login_WithWrongPassword_Returns401( )
    {
        // Arrange — create user
        await _client.PostAsJsonAsync ( "/auth/register", new
        {
            fullName = "Bob User",
            email = "bob@.com",
            password = "CorrectPassword!",
            department = ( string? ) null
        } );

        // Act — login with wrong password
        var response = await _client.PostAsJsonAsync ( "/auth/login",
            new { email = "bob@.com", password = "WrongPassword!" } );

        // Assert
        response.StatusCode.Should ().Be ( HttpStatusCode.Unauthorized );
    }

    /// <summary>
    /// WHAT: POST /auth/login with an email that doesn't exist
    /// EXPECT: 401 Unauthorized (not 404, to avoid revealing whether an email is registered)
    /// WHY: Security — never confirm whether an email is in the system to unknown users
    /// </summary>
    [Fact]
    public async Task Login_WithNonExistentEmail_Returns401( )
    {
        var response = await _client.PostAsJsonAsync ( "/auth/login",
            new { email = "nobody@.com", password = "AnyPassword!" } );

        response.StatusCode.Should ().Be ( HttpStatusCode.Unauthorized );
    }

    /// <summary>
    /// WHAT: POST /auth/login with empty fields
    /// EXPECT: 400 Bad Request
    /// WHY: Must reject empty credentials before even checking the database
    /// </summary>
    [Fact]
    public async Task Login_WithEmptyCredentials_Returns400( )
    {
        var response = await _client.PostAsJsonAsync ( "/auth/login",
            new { email = "", password = "" } );

        response.StatusCode.Should ().Be ( HttpStatusCode.BadRequest );
    }

    // ──────────────────────────────────────────
    // FORGOT PASSWORD TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: POST /auth/forgot-password for a registered email with valid new password
    /// EXPECT: 200 OK — password updated
    /// WHY: Users need to be able to reset their password
    /// </summary>
    [Fact]
    public async Task ForgotPassword_WithValidEmailAndPassword_Returns200( )
    {
        // Arrange — create a user
        await _client.PostAsJsonAsync ( "/auth/register", new
        {
            fullName = "Carol Reset",
            email = "carol@.com",
            password = "OldPassword1!",
            department = ( string? ) null
        } );

        // Act — reset password
        var response = await _client.PostAsJsonAsync ( "/auth/forgot-password",
            new { email = "carol@.com", newPassword = "NewPassword99!" } );

        // Assert
        response.StatusCode.Should ().Be ( HttpStatusCode.OK );

        // Verify new password works for login
        var loginResponse = await _client.PostAsJsonAsync ( "/auth/login",
            new { email = "carol@.com", password = "NewPassword99!" } );
        loginResponse.StatusCode.Should ().Be ( HttpStatusCode.OK, "new password should work after reset" );
    }

    /// <summary>
    /// WHAT: POST /auth/forgot-password with a password shorter than 8 characters
    /// EXPECT: 400 Bad Request — enforce minimum password length
    /// WHY: Weak passwords are a security risk; the API must reject them
    /// </summary>
    [Fact]
    public async Task ForgotPassword_WithShortPassword_Returns400( )
    {
        await _client.PostAsJsonAsync ( "/auth/register", new
        {
            fullName = "Dave User",
            email = "dave@.com",
            password = "LongEnough1!",
            department = ( string? ) null
        } );

        var response = await _client.PostAsJsonAsync ( "/auth/forgot-password",
            new { email = "dave@.com", newPassword = "short" } );

        response.StatusCode.Should ().Be ( HttpStatusCode.BadRequest );
    }

    /// <summary>
    /// WHAT: POST /auth/forgot-password for an email that doesn't exist
    /// EXPECT: 404 Not Found
    /// WHY: Should clearly tell the caller no account was found
    /// </summary>
    [Fact]
    public async Task ForgotPassword_WithUnknownEmail_Returns404( )
    {
        var response = await _client.PostAsJsonAsync ( "/auth/forgot-password",
            new { email = "ghost@.com", newPassword = "ValidPassword1!" } );

        response.StatusCode.Should ().Be ( HttpStatusCode.NotFound );
    }
}

// ── Minimal DTO just for deserializing test responses ──
file record AuthResponseDto( int UserId, string FullName, string Email, string? Department, bool IsITTeam );
