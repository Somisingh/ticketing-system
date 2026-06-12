using TicketingSystem.Core.Models;
using TicketingSystem.Db.Models;

namespace TicketingSystem.Server.Dtos;

// Submitted by employee when creating a ticket


// IT updates (assignee, status, resolution)
public record UpdateTicketRequest(
    int? AssignedToUserId,
    TicketStatus Status,
    string? ResolutionNotes
);

public record TicketDto(
    int Id,
    int SubmittedByUserId,
    string? SubmittedByEmail,
    string SubmittedByName,
    string? SubmittedByDepartment,
    string IssueDescription,
    string Urgency,
    bool NotifyOnResolution,
    int? AssignedToUserId,
    string? AssignedToName,
    string Status,
    string? ResolutionNotes,
    DateTime? ResolvedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
public static class TicketMappings
{
    public static TicketDto ToDto( Ticket t ) => new (
        t.Id,
        t.SubmittedByUserId,
        t.SubmittedByUser?.Email,
        t.SubmittedByName,
        t.SubmittedByDepartment,
        t.IssueDescription,
        t.Urgency.ToString (),
        t.NotifyOnResolution,
        t.AssignedToUserId,
        t.AssignedToUser?.FullName,
        t.Status.ToString (),
        t.ResolutionNotes,
        t.ResolvedAt,
        t.CreatedAt,
        t.UpdatedAt
    );
}
public record ITMemberDto( int Id, string FullName );