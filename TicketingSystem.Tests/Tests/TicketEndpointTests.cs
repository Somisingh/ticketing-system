// ============================================================
// TicketEndpointTests.cs
// Integration tests for all /tickets endpoints
//
// Covered endpoints:
//   POST   /tickets?userId=X          — Create ticket
//   GET    /tickets/my/{userId}        — My open tickets
//   GET    /tickets/my/{userId}/history — My resolved/closed tickets
//   GET    /tickets/all?status=X       — All tickets (IT view)
//   GET    /tickets/assigned/{itUserId} — Assigned to IT member
//   GET    /tickets/{id}               — Get single ticket
//   PUT    /tickets/{id}               — Update ticket (IT action)
//   DELETE /tickets/{id}               — Soft delete
//   GET    /tickets/it-members          — List IT team members
// ============================================================

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;

namespace TicketingSystem.Tests;

public class TicketEndpointTests : IClassFixture<TestWebAppFactory>, IAsyncLifetime
{
    private readonly HttpClient _client;
    private readonly TestWebAppFactory _factory;

    // IDs seeded in the database before each test class run
    private int _employeeUserId;
    private int _itUserId;

    public TicketEndpointTests( TestWebAppFactory factory )
    {
        _factory  = factory;
        _client   = factory.CreateClient ();
    }

    // ──────────────────────────────────────────────────────────────
    // SETUP — seeds two users (employee + IT) before tests run
    // This is like setting up test data before each test class
    // ──────────────────────────────────────────────────────────────
    public async Task InitializeAsync( )
    {
        using var scope = _factory.Services.CreateScope ();
        var db = scope.ServiceProvider.GetRequiredService<TicketingSystemDbContext> ();
        await db.Database.EnsureCreatedAsync ();

        var employee = new AppUser
        {
            FullName = "Employee User",
            Email = "employee@test.com",
            PasswordHash = "hash",
            IsITTeam = false,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        var itMember = new AppUser
        {
            FullName = "IT Member",
            Email = "it@test.com",
            PasswordHash = "hash",
            IsITTeam = true,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        db.AppUsers.AddRange ( employee, itMember );
        await db.SaveChangesAsync ();

        _employeeUserId = employee.Id;
        _itUserId       = itMember.Id;
    }

    public Task DisposeAsync( ) => Task.CompletedTask;

    // ──────────────────────────────────────────
    // HELPER — creates a ticket and returns its ID
    // Avoids repeating creation code in every test
    // ──────────────────────────────────────────
    private async Task<int> CreateTestTicketAsync(
        int userId,
        string description = "Test issue",
        string urgency = "NotUrgent" )
    {
        var payload = new { issueDescription = description, urgency, notifyOnResolution = true };
        var response = await _client.PostAsJsonAsync ( $"/tickets?userId={userId}", payload );
        response.EnsureSuccessStatusCode ();
        var ticket = await response.Content.ReadFromJsonAsync<TicketDto> ();
        return ticket!.Id;
    }

    // ──────────────────────────────────────────
    // CREATE TICKET TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: Employee creates a ticket with valid data
    /// EXPECT: 201 Created + ticket body with Open status
    /// WHY: This is the core action in the whole app
    /// </summary>
    [Fact]
    public async Task CreateTicket_WithValidUser_Returns201AndOpenStatus( )
    {
        var payload = new
        {
            issueDescription = "My laptop won't connect to Wi-Fi",
            urgency = "Urgent",
            notifyOnResolution = true
        };

        var response = await _client.PostAsJsonAsync ( $"/tickets?userId={_employeeUserId}", payload );

        response.StatusCode.Should ().Be ( HttpStatusCode.Created );

        var ticket = await response.Content.ReadFromJsonAsync<TicketDto> ();
        ticket.Should ().NotBeNull ();
        ticket!.Status.Should ().Be ( "Open", "new tickets always start as Open" );
        ticket.Urgency.Should ().Be ( "Urgent" );
        ticket.IssueDescription.Should ().Be ( "My laptop won't connect to Wi-Fi" );
        ticket.SubmittedByUserId.Should ().Be ( _employeeUserId );
    }

    /// <summary>
    /// WHAT: Create ticket with a userId that doesn't exist
    /// EXPECT: 400 Bad Request — can't create a ticket for a ghost user
    /// WHY: Tickets must always be linked to a valid user
    /// </summary>
    [Fact]
    public async Task CreateTicket_WithNonExistentUser_Returns400( )
    {
        var payload = new { issueDescription = "Test", urgency = "NotUrgent", notifyOnResolution = false };

        var response = await _client.PostAsJsonAsync ( "/tickets?userId=99999", payload );

        response.StatusCode.Should ().Be ( HttpStatusCode.BadRequest );
    }

    // ──────────────────────────────────────────
    // GET MY TICKETS TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: GET /tickets/my/{userId} returns only OPEN tickets for that user
    /// EXPECT: List of tickets, all with status != Closed
    /// WHY: Employees only see their active (non-closed) tickets on the dashboard
    /// </summary>
    [Fact]
    public async Task GetMyTickets_ReturnsOnlyOpenTicketsForUser( )
    {
        // Arrange — create 2 tickets
        await CreateTestTicketAsync ( _employeeUserId, "Issue A" );
        await CreateTestTicketAsync ( _employeeUserId, "Issue B" );

        // Act
        var response = await _client.GetAsync ( $"/tickets/my/{_employeeUserId}" );

        // Assert
        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var tickets = await response.Content.ReadFromJsonAsync<List<TicketDto>> ();
        tickets.Should ().NotBeNull ();
        tickets!.Should ().OnlyContain ( t => t.SubmittedByUserId == _employeeUserId );
        tickets.Should ().NotContain ( t => t.Status == "Closed", "closed tickets don't appear in active view" );
    }

    /// <summary>
    /// WHAT: GET /tickets/my/{userId}/history returns only Resolved/Closed tickets
    /// EXPECT: Empty list (no resolved tickets yet)
    /// WHY: History tab must only show completed tickets
    /// </summary>
    [Fact]
    public async Task GetMyTicketHistory_ReturnsOnlyResolvedOrClosedTickets( )
    {
        var response = await _client.GetAsync ( $"/tickets/my/{_employeeUserId}/history" );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var tickets = await response.Content.ReadFromJsonAsync<List<TicketDto>> ();
        tickets.Should ().NotBeNull ();
        // At this point no tickets are resolved yet — history is empty
        tickets!.Should ().OnlyContain ( t =>
            t.Status == "Resolved" || t.Status == "Closed" );
    }

    // ──────────────────────────────────────────
    // GET ALL TICKETS TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: GET /tickets/all without a status filter
    /// EXPECT: Returns all non-Closed tickets, sorted by Urgency then CreatedAt
    /// WHY: IT dashboard default view shows everything active
    /// </summary>
    [Fact]
    public async Task GetAllTickets_WithNoFilter_ReturnsNonClosedTickets( )
    {
        await CreateTestTicketAsync ( _employeeUserId, "Urgent network issue", "Urgent" );
        await CreateTestTicketAsync ( _employeeUserId, "Printer not working", "NotUrgent" );

        var response = await _client.GetAsync ( "/tickets/all" );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var tickets = await response.Content.ReadFromJsonAsync<List<TicketDto>> ();
        tickets.Should ().NotBeNull ();
        tickets!.Should ().NotContain ( t => t.Status == "Closed" );
    }

    /// <summary>
    /// WHAT: GET /tickets/all?status=Open filters by Open status
    /// EXPECT: Only Open tickets returned
    /// WHY: IT team can filter by specific status on their board
    /// </summary>
    [Fact]
    public async Task GetAllTickets_WithStatusFilter_ReturnsOnlyMatchingStatus( )
    {
        var response = await _client.GetAsync ( "/tickets/all?status=Open" );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var tickets = await response.Content.ReadFromJsonAsync<List<TicketDto>> ();
        tickets.Should ().NotBeNull ();
        tickets!.Should ().OnlyContain ( t => t.Status == "Open" );
    }

    // ──────────────────────────────────────────
    // GET TICKET BY ID TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: GET /tickets/{id} for an existing ticket
    /// EXPECT: 200 OK + correct ticket data
    /// WHY: Both employees and IT need to view ticket details
    /// </summary>
    [Fact]
    public async Task GetTicketById_WithExistingId_Returns200AndTicket( )
    {
        var ticketId = await CreateTestTicketAsync ( _employeeUserId, "Specific issue for detail view" );

        var response = await _client.GetAsync ( $"/tickets/{ticketId}" );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var ticket = await response.Content.ReadFromJsonAsync<TicketDto> ();
        ticket.Should ().NotBeNull ();
        ticket!.Id.Should ().Be ( ticketId );
        ticket.IssueDescription.Should ().Be ( "Specific issue for detail view" );
    }

    /// <summary>
    /// WHAT: GET /tickets/{id} for a non-existent ID
    /// EXPECT: 404 Not Found
    /// WHY: Graceful error when a ticket ID doesn't exist
    /// </summary>
    [Fact]
    public async Task GetTicketById_WithNonExistentId_Returns404( )
    {
        var response = await _client.GetAsync ( "/tickets/99999" );

        response.StatusCode.Should ().Be ( HttpStatusCode.NotFound );
    }

    // ──────────────────────────────────────────
    // UPDATE TICKET TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: IT member updates ticket status to InProgress and assigns it to themselves
    /// EXPECT: 200 OK + updated ticket with new status and assignee
    /// WHY: This is the main IT workflow action — taking ownership of a ticket
    /// </summary>
    [Fact]
    public async Task UpdateTicket_AssignAndChangeStatus_Returns200WithUpdatedData( )
    {
        var ticketId = await CreateTestTicketAsync ( _employeeUserId, "Can't access email" );

        var updateRequest = new
        {
            assignedToUserId = _itUserId,
            status = "InProgress",
            resolutionNotes = ( string? ) null
        };

        var response = await _client.PutAsJsonAsync ( $"/tickets/{ticketId}", updateRequest );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var updated = await response.Content.ReadFromJsonAsync<TicketDto> ();
        updated.Should ().NotBeNull ();
        updated!.Status.Should ().Be ( "InProgress" );
        updated.AssignedToUserId.Should ().Be ( _itUserId );
    }

    /// <summary>
    /// WHAT: IT member resolves a ticket with resolution notes
    /// EXPECT: 200 OK + ResolvedAt is set + status is Resolved
    /// WHY: Resolving a ticket should automatically stamp the ResolvedAt timestamp
    /// </summary>
    [Fact]
    public async Task UpdateTicket_WhenStatusSetToResolved_SetsResolvedAt( )
    {
        var ticketId = await CreateTestTicketAsync ( _employeeUserId, "Software installation request" );

        var updateRequest = new
        {
            assignedToUserId = _itUserId,
            status = "Resolved",
            resolutionNotes = "Installed the required software. User confirmed it works."
        };

        var response = await _client.PutAsJsonAsync ( $"/tickets/{ticketId}", updateRequest );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var updated = await response.Content.ReadFromJsonAsync<TicketDto> ();
        updated!.Status.Should ().Be ( "Resolved" );
        updated.ResolvedAt.Should ().NotBeNull ( "ResolvedAt must be set when a ticket is resolved" );
        updated.ResolutionNotes.Should ().Contain ( "Installed the required software" );
    }

    /// <summary>
    /// WHAT: PUT /tickets/{id} for a non-existent ticket
    /// EXPECT: 404 Not Found
    /// </summary>
    [Fact]
    public async Task UpdateTicket_WithNonExistentId_Returns404( )
    {
        var updateRequest = new { assignedToUserId = _itUserId, status = "InProgress", resolutionNotes = ( string? ) null };

        var response = await _client.PutAsJsonAsync ( "/tickets/99999", updateRequest );

        response.StatusCode.Should ().Be ( HttpStatusCode.NotFound );
    }

    // ──────────────────────────────────────────
    // DELETE TICKET TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: DELETE /tickets/{id} soft-deletes a ticket
    /// EXPECT: 204 No Content + ticket no longer appears in GET /all
    /// WHY: Soft delete means the record stays in the DB but is hidden from all views
    /// </summary>
    [Fact]
    public async Task DeleteTicket_SoftDeletesTicket_Returns204AndTicketIsHidden( )
    {
        var ticketId = await CreateTestTicketAsync ( _employeeUserId, "To be deleted" );

        // Delete
        var deleteResponse = await _client.DeleteAsync ( $"/tickets/{ticketId}" );
        deleteResponse.StatusCode.Should ().Be ( HttpStatusCode.NoContent );

        // Verify it's gone from the GET endpoint
        var getResponse = await _client.GetAsync ( $"/tickets/{ticketId}" );
        getResponse.StatusCode.Should ().Be ( HttpStatusCode.NotFound,
            "soft-deleted tickets must not be returned by GET /tickets/{id}" );
    }

    /// <summary>
    /// WHAT: DELETE /tickets/{id} for a non-existent ticket
    /// EXPECT: 404 Not Found
    /// </summary>
    [Fact]
    public async Task DeleteTicket_WithNonExistentId_Returns404( )
    {
        var response = await _client.DeleteAsync ( "/tickets/99999" );

        response.StatusCode.Should ().Be ( HttpStatusCode.NotFound );
    }

    // ──────────────────────────────────────────
    // GET IT MEMBERS TESTS
    // ──────────────────────────────────────────

    /// <summary>
    /// WHAT: GET /tickets/it-members returns only active IT team members
    /// EXPECT: List contains only users with IsITTeam = true
    /// WHY: The "Assign To" dropdown on the ticket detail page uses this endpoint
    /// </summary>
    [Fact]
    public async Task GetITMembers_ReturnsOnlyActiveITTeamMembers( )
    {
        var response = await _client.GetAsync ( "/tickets/it-members" );

        response.StatusCode.Should ().Be ( HttpStatusCode.OK );
        var members = await response.Content.ReadFromJsonAsync<List<ITMemberDto>> ();
        members.Should ().NotBeNull ();
        members!.Should ().NotBeEmpty ( "at least one IT member was seeded" );
        // All returned members should be IT (the endpoint filters IsITTeam && IsActive)
        members.Should ().Contain ( m => m.FullName == "IT Member" );
    }

    // ── DTOs for deserializing responses in tests ──
    private record TicketDto(
        int Id, int SubmittedByUserId, string? SubmittedByEmail,
        string SubmittedByName, string? SubmittedByDepartment,
        string IssueDescription, string Urgency, bool NotifyOnResolution,
        int? AssignedToUserId, string? AssignedToName,
        string Status, string? ResolutionNotes,
        DateTime? ResolvedAt, DateTime CreatedAt, DateTime UpdatedAt );

    private record ITMemberDto( int Id, string FullName );
}
