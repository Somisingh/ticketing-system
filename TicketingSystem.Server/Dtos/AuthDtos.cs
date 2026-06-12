namespace TicketingSystem.Server.Dtos;

public record LoginRequest(string Email, string Password);

public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string? Department
);

public record AuthResponse(
    int UserId,
    string FullName,
    string Email,
    string? Department,
    bool IsITTeam
);
