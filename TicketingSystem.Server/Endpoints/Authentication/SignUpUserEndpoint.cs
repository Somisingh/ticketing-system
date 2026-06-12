using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;

namespace TicketingSystem.Server.Endpoints.Authentication;

/// <summary>
/// This file ONLY wires endpoints. No business logic.
/// </summary>
public static class SignUpUserEndpoint
{

    public static RouteGroupBuilder MapSignUpUserEndpoint(
    this RouteGroupBuilder group )
    {
        group.MapPost ( "/register",
async ( HttpContext httpContext,
SignUpUserRequest request,
TicketingSystemDbContext db,
IPasswordHasher<AppUser> hasher,
ILogger<SignUpUserEndpointMarker> logger ) =>
{
    var email = request.Email?.Trim ().ToLowerInvariant ();

    logger.LogInformation (
    "Signup attempt started for {Email} from IP {IP}",
    email,
    httpContext.Connection.RemoteIpAddress?.ToString () );

    // ---------------------------
    // Input validation
    // ---------------------------
    if ( string.IsNullOrWhiteSpace ( request.Email ) ||
        string.IsNullOrWhiteSpace ( request.Password ) ||
        string.IsNullOrWhiteSpace ( request.FullName ) )
    {
        logger.LogWarning ( "Signup failed due to invalid input for {Email}", email );
        return Results.BadRequest ( "Email, FullName and Password are required." );
    }


    // ---------------------------
    // Check existing user
    // ---------------------------
    var exists = await db.AppUsers
        .AnyAsync ( x => x.Email == email );

    if ( exists )
    {
        logger.LogWarning ( "Signup blocked - email already exists: {Email}", email );
        return Results.BadRequest ( "An account with this email already exists." );
    }

    try
    {
        // ---------------------------
        // Create user
        // ---------------------------
        var user = new AppUser
        {
            FullName = request.FullName,
            Email = email,
            Department = request.Department,
            IsITTeam = false,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        user.PasswordHash = hasher.HashPassword ( user, request.Password );

        db.AppUsers.Add ( user );
        await db.SaveChangesAsync ();

        logger.LogInformation (
            "User successfully created with Id {UserId} and Email {Email}",
            user.Id,
            email );

        return Results.Ok ( new SignUpUserResponse (
            UserId: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Department: user.Department,
            IsITTeam: user.IsITTeam
        ) );
    }
    catch ( DbUpdateException ex )
    {
        // database-related failures (constraint issues, connection issues, etc.)
        logger.LogError ( ex,
            "Database error while creating user {Email}",
            email );

        return Results.Problem (
            title: "Error creating user",
            statusCode: 500 );
    }
    catch ( Exception ex )
    {
        // unexpected failures
        logger.LogError ( ex,
            "Unexpected error during signup for {Email}",
            email );

        return Results.Problem (
            title: "Unexpected server error",
            statusCode: 500 );
    }

} ).WithName ( "RegisterUser" )
    .WithOpenApi ();

        return group;
    }
}

public sealed record SignUpUserRequest
(
     string FullName,
[Required] string Email,
[Required] string Password,
string? Department
);

public sealed record SignUpUserResponse(
 int UserId,
string FullName,
string Email,
string? Department,
bool IsITTeam
);
public sealed class SignUpUserEndpointMarker { }