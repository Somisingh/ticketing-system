namespace TicketingSystem.Core.Models
{

    public enum TicketStatus
    {
        Open = 0,
        ToDo = 1,
        InProgress = 2,
        Blocked = 3,
        UnderReview = 4,
        Resolved = 5,
        Closed = 6
    }

    public enum TicketUrgency
    {
        NotUrgent = 0,
        Urgent = 1
    }

}
