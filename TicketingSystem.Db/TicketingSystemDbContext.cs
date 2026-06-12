using Microsoft.EntityFrameworkCore;
using TicketingSystem.Db.Models;

namespace TicketingSystem.Db;


public partial class TicketingSystemDbContext : DbContext
{
    public TicketingSystemDbContext( )
    {
    }

    public TicketingSystemDbContext( DbContextOptions<TicketingSystemDbContext> options )
        : base ( options )
    {
    }

    public virtual DbSet<AppUser> AppUsers { get; set; }

    public virtual DbSet<Ticket> Tickets { get; set; }


    //  protected override void OnConfiguring( DbContextOptionsBuilder optionsBuilder )
    //  {
    //      if ( !optionsBuilder.IsConfigured )
    //      {
    //          var dbPath = Path.Combine (
    //    Directory.GetCurrentDirectory (),
    //    "ticketing.db"
    //);

    //          optionsBuilder.UseSqlite ( $"Data Source={dbPath}" );
    //      }
    //  }
    protected override void OnModelCreating( ModelBuilder modelBuilder )
    {
        modelBuilder.Entity<AppUser> ( entity =>
        {
            entity.HasKey ( e => e.Id ).HasName ( "PK__AppUsers__3214EC07FA8831BC" );

            entity.HasIndex ( e => e.Email, "IX_AppUsers_Email" ).IsUnique ();

            entity.Property ( e => e.CreatedAt ).HasDefaultValueSql ( "CURRENT_TIMESTAMP" );
            entity.Property ( e => e.Department ).HasMaxLength ( 100 );
            entity.Property ( e => e.Email ).HasMaxLength ( 255 );
            entity.Property ( e => e.FullName ).HasMaxLength ( 100 );
            entity.Property ( e => e.IsActive ).HasDefaultValue ( true );
            entity.Property ( e => e.IsITTeam ).HasColumnName ( "IsITTeam" );
            entity.Property ( e => e.PasswordHash ).HasMaxLength ( 500 );
            entity.HasData ( new AppUser
            {
                Id=1,
                FullName="Test User",
                Email="testacc@co.nz",
                PasswordHash="Admin@123"
            } );
        } );

        modelBuilder.Entity<Ticket> ( entity =>
        {
            entity.HasKey ( e => e.Id ).HasName ( "PK__Ticket__3214EC07216C54FD" );

            entity.ToTable ( "Ticket", tb =>
            {
                tb.HasTrigger ( "trg_Ticket_NewTicketEmail" );
            } );

            entity.HasIndex ( e => e.AssignedToUserId, "IX_Ticket_AssignedToUserId" );

            entity.HasIndex ( e => e.Status, "IX_Ticket_Status" );

            entity.HasIndex ( e => e.SubmittedByUserId, "IX_Ticket_SubmittedByUserId" );

            entity.Property ( e => e.CreatedAt ).HasDefaultValueSql ( "CURRENT_TIMESTAMP" );
            entity.Property ( e => e.NotifyOnResolution ).HasDefaultValue ( true );
            entity.Property ( e => e.SubmittedByDepartment ).HasMaxLength ( 100 );
            entity.Property ( e => e.SubmittedByName ).HasMaxLength ( 100 );
            entity.Property ( e => e.UpdatedAt ).HasDefaultValueSql ( "CURRENT_TIMESTAMP" );

            entity.HasOne ( d => d.AssignedToUser ).WithMany ( p => p.TicketAssignedToUsers )
                .HasForeignKey ( d => d.AssignedToUserId )
                .OnDelete ( DeleteBehavior.SetNull )
                .HasConstraintName ( "FK_Ticket_AssignedTo" );

            entity.HasOne ( d => d.SubmittedByUser ).WithMany ( p => p.TicketSubmittedByUsers )
                .HasForeignKey ( d => d.SubmittedByUserId )
                .OnDelete ( DeleteBehavior.ClientSetNull )
                .HasConstraintName ( "FK_Ticket_SubmittedBy" );


            OnModelCreatingPartial ( modelBuilder );
        } );
    }
    partial void OnModelCreatingPartial( ModelBuilder modelBuilder );
}
