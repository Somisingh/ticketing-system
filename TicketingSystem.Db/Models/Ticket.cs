using TicketingSystem.Core.Models;

namespace TicketingSystem.Db.Models;

public partial class Ticket
{
    public int Id { get; set; }

    public int SubmittedByUserId { get; set; }

    public string SubmittedByName { get; set; } = null!;

    public string? SubmittedByDepartment { get; set; }

    public string IssueDescription { get; set; } = null!;

    public TicketUrgency Urgency { get; set; }

    public bool NotifyOnResolution { get; set; }

    public int? AssignedToUserId { get; set; }

    public TicketStatus Status { get; set; }

    public string? ResolutionNotes { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual AppUser? AssignedToUser { get; set; }

    public virtual AppUser SubmittedByUser { get; set; } = null!;
}
