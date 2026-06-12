using TicketingSystem.Server.Endpoints.Tickets.DeleteTickets;
using TicketingSystem.Server.Endpoints.Tickets.FetchTicket;
using TicketingSystem.Server.Endpoints.Tickets.FetchTickets;
using TicketingSystem.Server.Endpoints.Tickets.Update;

namespace TicketingSystem.Server.Endpoints.Tickets;

public static class TicketEndpoints
{

    public static IEndpointRouteBuilder MapTicketEndpoints( this IEndpointRouteBuilder app )
    {

        var group = app.MapGroup ( "/api/tickets" )
        .WithTags ( "Tickets" );

        group.MapCreateTicketEndpoints ();
        group.MapGetTicketsEndpoint ();
        group.MapGetTicketByIdEndpoints ();
        group.MapUpdateTicketEndpoint ();
        group.MapDeleteTicketEndpoint ();

        return app;
    }

}