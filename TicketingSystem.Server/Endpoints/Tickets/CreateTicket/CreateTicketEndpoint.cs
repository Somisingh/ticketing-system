using TicketingSystem.Core.Models;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;
using TicketingSystem.Server.Dtos;

namespace TicketingSystem.Server.Endpoints.Tickets;

public static class CreateTicketEndpoints
{
    public static RouteGroupBuilder MapCreateTicketEndpoints(
       this RouteGroupBuilder group )
    {
        // ─────────────────────────────────────────────────────────────
        // Create Ticket
        // POST /tickets?userId=1
        // ─────────────────────────────────────────────────────────────
        group.MapPost ( "/", async (
            CreateTicketRequest req,
            int userId,
            TicketingSystemDbContext db,
            ILogger<CreateTicketEndpointMarker> logger ) =>
        {
            logger.LogInformation ( "Create ticket request from user {UserId}", userId );

            var user = await db.AppUsers.FindAsync ( userId );

            if ( user is null )
            {
                logger.LogWarning ( "Create ticket failed - user not found {UserId}", userId );
                return Results.BadRequest ( "User not found." );
            }

            var ticket = new Ticket
            {
                SubmittedByUserId = userId,
                SubmittedByName = user.FullName,
                SubmittedByDepartment = user.Department,
                IssueDescription = req.IssueDescription,
                Urgency = req.Urgency,
                NotifyOnResolution = req.NotifyOnResolution,
                Status = TicketStatus.Open,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            db.Tickets.Add ( ticket );
            await db.SaveChangesAsync ();

            logger.LogInformation ( "Ticket {TicketId} created by user {UserId}", ticket.Id, userId );

            await db.Entry ( ticket ).Reference ( t => t.SubmittedByUser ).LoadAsync ();

            return Results.Created (
                $"/tickets/{ticket.Id}",
                TicketMappings.ToDto ( ticket ) );
        } )
             .WithName ( "CreateTicket" )
        .WithOpenApi ();

        return group;
    }

}

public record CreateTicketRequest(
 string IssueDescription,
 TicketUrgency Urgency,
 bool NotifyOnResolution
);
public sealed class CreateTicketEndpointMarker { }