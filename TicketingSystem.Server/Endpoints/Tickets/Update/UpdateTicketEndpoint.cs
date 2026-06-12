using Microsoft.EntityFrameworkCore;
using TicketingSystem.Core.Models;
using TicketingSystem.Db;
using TicketingSystem.Server.Dtos;
using TicketingSystem.Server.Endpoints.Tickets.Shared;

namespace TicketingSystem.Server.Endpoints.Tickets.Update;

public sealed class UpdateTicketEndpointMarker { }

public static class UpdateTicketEndpoint
{
    public static RouteGroupBuilder MapUpdateTicketEndpoint( this RouteGroupBuilder group )
    {
        // ─────────────────────────────────────────────────────────────
        // Update Ticket
        // PUT /tickets/5
        // ─────────────────────────────────────────────────────────────

        group.MapPut ( "/{id:int}", async (
            int id,
            UpdateTicketRequest req,
            TicketingSystemDbContext db,
            ILogger<UpdateTicketEndpointMarker> logger ) =>
        {
            var ticket = await TicketQuery.BaseQuery ( db )
                .FirstOrDefaultAsync ( t => t.Id == id );

            if ( ticket is null )
            {
                logger.LogWarning ( "Update failed - ticket not found {TicketId}", id );
                return Results.NotFound ();
            }

            logger.LogInformation ( "Updating ticket {TicketId}", id );

            ticket.AssignedToUserId = req.AssignedToUserId;
            ticket.Status = req.Status;
            ticket.ResolutionNotes = req.ResolutionNotes;
            ticket.UpdatedAt = DateTime.Now;

            if ( ( req.Status == TicketStatus.Resolved ||
                 req.Status == TicketStatus.Closed ) &&
                ticket.ResolvedAt is null )
            {
                ticket.ResolvedAt = DateTime.Now;
            }

            await db.SaveChangesAsync ();

            await db.Entry ( ticket ).Reference ( t => t.SubmittedByUser ).LoadAsync ();
            await db.Entry ( ticket ).Reference ( t => t.AssignedToUser ).LoadAsync ();

            logger.LogInformation ( "Ticket {TicketId} updated successfully", id );

            return Results.Ok ( TicketMappings.ToDto ( ticket ) );
        } )
         .WithName ( "UpdateTicket" )
        .WithOpenApi ();

        return group;
    }
}