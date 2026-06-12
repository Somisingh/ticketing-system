using TicketingSystem.Db;

namespace TicketingSystem.Server.Endpoints.Tickets.DeleteTickets;

public sealed class DeleteTicketEndpointMarker { }

public static class DeleteTicketEndpoint
{
    // ─────────────────────────────────────────────────────────────
    // Delete Ticket (Soft Delete)
    // DELETE /tickets/5
    // ─────────────────────────────────────────────────────────────

    public static RouteGroupBuilder MapDeleteTicketEndpoint( this RouteGroupBuilder group )
    {
        group.MapDelete ( "/delete/{id:int}", async (
            int id,
            int requestingUserId,
            TicketingSystemDbContext db,
            ILogger<DeleteTicketEndpointMarker> logger ) =>
        {
            var ticket = await db.Tickets.FindAsync ( id );

            if ( ticket is null )
            {
                logger.LogWarning ( "Delete failed - ticket not found {TicketId}", id );
                return Results.NotFound ();
            }

            // Check requesting user exists and has permission
            var requestingUser = await db.AppUsers.FindAsync ( requestingUserId );

            if ( requestingUser is null )
            {
                logger.LogWarning ( "Delete failed - requesting user not found {UserId}", requestingUserId );
                return Results.Unauthorized ();
            }

            bool isOwner = ticket.SubmittedByUserId == requestingUserId;
            bool isITTeam = requestingUser.IsITTeam;

            if ( !isOwner && !isITTeam )
            {
                logger.LogWarning ( "Delete forbidden - user {UserId} does not own ticket {TicketId}", requestingUserId, id );
                return Results.Forbid ();
            }

            ticket.IsDeleted = true;
            ticket.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync ();

            logger.LogInformation ( "Ticket {TicketId} soft deleted by user {UserId}", id, requestingUserId );

            return Results.Ok ();
        } )
        .WithName ( "DeleteTicket" )
        .WithOpenApi ();

        return group;
    }
}