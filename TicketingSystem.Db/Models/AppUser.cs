namespace TicketingSystem.Db.Models;

public partial class AppUser
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? Department { get; set; }

    public bool IsITTeam { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Ticket> TicketAssignedToUsers { get; set; } = new List<Ticket> ();

    public virtual ICollection<Ticket> TicketSubmittedByUsers { get; set; } = new List<Ticket> ();
}
