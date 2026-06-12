using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;
using TicketingSystem.Server.Dtos;

namespace TicketingSystem.Server.Endpoints.Authentication
{
    public static class LoginUserEndpoint
    {
        public static RouteGroupBuilder MapLoginUserEndpoint(
        this RouteGroupBuilder group )
        {
            try
            {
                group.MapPost ( "/login",
                         async ( HttpContext httpContext,
                         LoginUserRequest request,
                         TicketingSystemDbContext dbContext,
                         IPasswordHasher<AppUser> hasher,
                         ILogger<LoginUserEndpointMarker> logger ) =>
               {
                   logger.LogInformation (
              "Login attempt for {Email} from IP {IP}",
              request.Email,
              httpContext.Connection.RemoteIpAddress?.ToString () );


                   var user = await dbContext.AppUsers.FirstOrDefaultAsync ( x => x.Email == request.Email );
                   if ( user is null  || string.IsNullOrEmpty ( user.PasswordHash ) )
                   {
                       logger.LogWarning ( "Login failed for {Email}", request.Email );
                       return Results.Unauthorized ();
                   }

                   PasswordVerificationResult result;

                   try
                   {
                       result = hasher.VerifyHashedPassword (
                           user,
                           user.PasswordHash,
                           request.Password );

                       if ( result == PasswordVerificationResult.Failed )
                       {
                           logger.LogWarning ( "Login failed for {Email}", request.Email );
                           return Results.Unauthorized ();
                       }
                   }
                   catch ( Exception ex )
                   {
                       logger.LogError ( ex, "Password verification error for {Email}", request.Email );

                       return Results.Unauthorized (); // protects against bad DB values
                   }

                   logger.LogInformation (
              "Login success for {Email} from IP {IP}",
              request.Email,
              httpContext.Connection.RemoteIpAddress?.ToString () );


                   return Results.Ok ( new AuthResponse (
                      UserId: user.Id,

                      Email: user.Email,
                       FullName: user.FullName,
                       Department: user.Department,
                      IsITTeam: user.IsITTeam

         ) );

               } )
                       .WithName ( "LoginUser" )
                       .WithOpenApi ();


                return group;

            }
            catch ( Exception ex )
            {
                Console.WriteLine ( ex.ToString () );
                throw;
            }
        }
    }

    public sealed record LoginUserResponse(
       int UserId,
       string FullName,
       string Email,
       string? Department,
       bool IsITTeam
        );
    public sealed class LoginUserEndpointMarker { }
    public sealed record LoginUserRequest(
        [Required] string Email,
        [Required] string Password
        );
}

