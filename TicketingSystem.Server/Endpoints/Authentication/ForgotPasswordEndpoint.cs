using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;

namespace TicketingSystem.Server.Endpoints.Authentication;

public sealed class ForgotPasswordEndpointMarker { }
public sealed record ForgotPasswordRequest(
    [Required] string Email,
    [Required] string NewPassword
);

public static class ForgotPasswordEndpoint
{
    public static RouteGroupBuilder MapForgotPasswordEndpoint( this RouteGroupBuilder group )
    {
        group.MapPost ( "/forgot-password", async (
            ForgotPasswordRequest request,
            TicketingSystemDbContext db,
            IPasswordHasher<AppUser> hasher,
               ILogger<ForgotPasswordEndpointMarker> logger ) =>
        {
            logger.LogInformation (
                "Forgot password request received for {Email}",
                request.Email );
            try
            {
                // 1. Basic validation
                if ( string.IsNullOrWhiteSpace ( request.Email ) )
                {
                    logger.LogWarning ( "Forgot password failed: empty email" );
                    return Results.BadRequest ( "Email is required." );
                }

                if ( string.IsNullOrWhiteSpace ( request.NewPassword ) ||
                    request.NewPassword.Length < 8 )
                {
                    logger.LogWarning (
                        "Forgot password failed: weak password for {Email}",
                        request.Email );

                    return Results.BadRequest ( "Password must be at least 8 characters." );
                }

                // 2. Fetch user
                var user = await db.AppUsers
                    .FirstOrDefaultAsync ( u => u.Email == request.Email );

                if ( user is null )
                {
                    // Avoid account enumeration but still log internally
                    logger.LogWarning (
                        "Forgot password attempt for non-existing email {Email}",
                        request.Email );

                    return Results.NotFound ( "No account found with that email address." );
                }

                // 3. Update password
                user.PasswordHash = hasher.HashPassword ( user, request.NewPassword );

                await db.SaveChangesAsync ();

                logger.LogInformation (
                    "Password successfully reset for {Email} (UserId: {UserId})",
                    request.Email,
                    user.Id );

                return Results.Ok ( "Password reset successfully." );
            }
            catch ( DbUpdateException dbEx )
            {
                logger.LogError (
                    dbEx,
                    "Database error while resetting password for {Email}",
                    request.Email );

                return Results.Problem ( "Database error occurred." );
            }
            catch ( Exception ex )
            {
                logger.LogError (
                    ex,
                    "Unexpected error while resetting password for {Email}",
                    request.Email );

                return Results.Problem ( "An unexpected error occurred." );
            }
        } )
        .WithName ( "ForgotPassword" )
        .WithOpenApi ();

        return group;
    }
}
