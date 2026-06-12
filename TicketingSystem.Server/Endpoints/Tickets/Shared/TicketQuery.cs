using Microsoft.EntityFrameworkCore;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;

namespace TicketingSystem.Server.Endpoints.Tickets.Shared
{
    public static class TicketQuery
    {
        // ─────────────────────────────────────────────────────────────
        // Local helpers
        // ─────────────────────────────────────────────────────────────

        public static IQueryable<Ticket> BaseQuery( TicketingSystemDbContext db ) =>
            db.Tickets
                .Include ( t => t.SubmittedByUser )
                .Include ( t => t.AssignedToUser )
                .Where ( t => !t.IsDeleted );
    }
}
