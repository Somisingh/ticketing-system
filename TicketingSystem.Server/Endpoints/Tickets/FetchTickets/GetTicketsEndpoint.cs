using Microsoft.EntityFrameworkCore;
using TicketingSystem.Core.Models;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;
using TicketingSystem.Server.Dtos;
using TicketingSystem.Server.Endpoints.Tickets.Shared;

namespace TicketingSystem.Server.Endpoints.Tickets.FetchTickets;

public sealed class GetTicketsEndpointMarker { }
public static class GetTicketsEndpoint
{
    public static RouteGroupBuilder MapGetTicketsEndpoint( this RouteGroupBuilder group )
    {
        // ─────────────────────────────────────────────────────────────
        // Get All Tickets
        // GET /tickets/all?status=Open
        // ─────────────────────────────────────────────────────────────

        group.MapGet ( "/all", async (
            string? status,
            TicketingSystemDbContext db,
            ILogger<GetTicketsEndpointMarker> logger ) =>
        {
            logger.LogInformation ( "Fetching tickets with status filter: {Status}", status );

            IQueryable<Ticket> query = TicketQuery.BaseQuery ( db );

            if ( !string.IsNullOrWhiteSpace ( status ) &&
                Enum.TryParse<TicketStatus> ( status, true, out var parsedStatus ) )
            {
                logger.LogInformation ( "Filtering tickets by status {Status}", parsedStatus );
                query = query.Where ( t => t.Status == parsedStatus );
            }
            else
            {
                query = query.Where ( t => t.Status != TicketStatus.Closed );
            }

            var tickets = await query
                .OrderByDescending ( t => t.Urgency )
                .ThenByDescending ( t => t.CreatedAt )
                .ToListAsync ();

            logger.LogInformation ( "Fetched {Count} tickets", tickets.Count );

            return Results.Ok ( tickets.Select ( TicketMappings.ToDto ) );
        } )
        .WithName ( "GetAllTickets" )
        .WithOpenApi ();


        // ─────────────────────────────────────────────────────────────
        // Get IT Members (for assign dropdown) 
        // GET /tickets/it-members
        // ─────────────────────────────────────────────────────────────

        group.MapGet ( "/it-members",
        async ( string? status,
        TicketingSystemDbContext db,
           ILogger<GetTicketsEndpointMarker> logger ) =>
        {
            logger.LogInformation ( "Fetching IT Member tickets with status filter: {Status}", status );

            var members = await db.AppUsers
                .Where ( u =>
                    u.IsITTeam &&
                    u.IsActive )
                .Select ( u =>
                    new ITMemberDto (
                        u.Id,
                        u.FullName ) )
                .ToListAsync ();

            return Results.Ok ( members );
        } )
        .WithName ( "GetITMembers" )
        .WithOpenApi ();


        return group;
    }
}