using Microsoft.EntityFrameworkCore;
using TicketingSystem.Core.Models;
using TicketingSystem.Db;
using TicketingSystem.Server.Dtos;
using TicketingSystem.Server.Endpoints.Tickets.Shared;

namespace TicketingSystem.Server.Endpoints.Tickets.FetchTicket
{
    public static class GetTicketByIdEndpoint
    {
        public static RouteGroupBuilder MapGetTicketByIdEndpoints( this RouteGroupBuilder group )
        {
            // ─────────────────────────────────────────────────────────────
            // Get My History
            // GET /tickets/my/1/history
            // ─────────────────────────────────────────────────────────────

            group.MapGet ( "/my/{userId:int}/history",
            async (
                int userId,
                TicketingSystemDbContext db ) =>
            {
                var tickets = await TicketQuery.BaseQuery ( db )
                    .Where ( t =>
                        t.SubmittedByUserId == userId &&
                        (
                            t.Status == TicketStatus.Resolved ||
                            t.Status == TicketStatus.Closed
                        ) )
                    .OrderByDescending ( t => t.UpdatedAt )
                    .ToListAsync ();

                return Results.Ok (
                    tickets.Select ( TicketMappings.ToDto ) );
            } )
            .WithName ( "GetMyTicketHistory" )
            .WithOpenApi ();


            // ── Employee: get my open tickets ────────────────────────────────────

            group.MapGet ( "my/{userId:int}", async ( int userId,
                TicketingSystemDbContext db ) =>
            {
                var tickets = await TicketQuery.BaseQuery ( db )
                .Where ( t => t.SubmittedByUserId == userId && t.Status != TicketStatus.Closed )
                .OrderByDescending ( t => t
                .CreatedAt )
                .ToListAsync ();
                return Results.Ok ( tickets.Select ( TicketMappings.ToDto ) );
            } )
                .WithName ( "GetMyOpenTicket" )
            .WithOpenApi ();



            // ─────────────────────────────────────────────────────────────
            // Get Assigned IT Tickets
            // GET /tickets/assigned/2
            // ─────────────────────────────────────────────────────────────

            group.MapGet ( "/assigned/{itUserId:int}",
            async (
                int itUserId,
                TicketingSystemDbContext db ) =>
            {
                var tickets = await TicketQuery.BaseQuery ( db )
                    .Where ( t =>
                        t.AssignedToUserId == itUserId &&
                        t.Status != TicketStatus.Closed )
                    .OrderByDescending ( t => t.Urgency )
                    .ThenByDescending ( t => t.CreatedAt )
                    .ToListAsync ();

                return Results.Ok (
                    tickets.Select ( TicketMappings.ToDto ) );
            } )
            .WithName ( "GetAssignedTickets" )
            .WithOpenApi ();

            // ─────────────────────────────────────────────────────────────
            // Get Ticket By Id
            // GET /tickets/5
            // ─────────────────────────────────────────────────────────────

            group.MapGet ( "/{id:int}",
            async (
                int id,
                TicketingSystemDbContext db ) =>
            {
                var ticket = await TicketQuery.BaseQuery ( db )
                    .FirstOrDefaultAsync ( t => t.Id == id );

                if ( ticket is null )
                {
                    return Results.NotFound ();
                }

                return Results.Ok (
                    TicketMappings.ToDto ( ticket ) );
            } )
            .WithName ( "GetTicketById" )
            .WithOpenApi ();

            return group;
        }
    }
}
