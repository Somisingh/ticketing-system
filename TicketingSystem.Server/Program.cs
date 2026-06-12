using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;
using TicketingSystem.Db;
using TicketingSystem.Db.Models;
using TicketingSystem.Server.Endpoints.Authentication;
using TicketingSystem.Server.Endpoints.Tickets;
using TicketingSystem.Server.Middleware;


try
{
    Log.Information ( "Application starting" );

    var builder = WebApplication.CreateBuilder ( args );

    // Database


    builder.Services.AddDbContext<TicketingSystemDbContext> ( options =>
    {
        var dbPath = Path.Combine (
    Directory.GetCurrentDirectory (),
    "ticketing.db"
);
        Log.Information ( $"*************************** {dbPath}" );

        options.UseSqlite ( $"Data Source={dbPath}" );
    } );

    builder.Services.ConfigureHttpJsonOptions ( options =>
    {
        options.SerializerOptions.Converters.Add (
            new System.Text.Json.Serialization.JsonStringEnumConverter ()
        );
    } );
    builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>> ();
    // CORS
    builder.Services.AddCors ( opt =>
    {
        opt.AddPolicy ( "CorsPolicy", policy =>
        {
            policy
                .AllowAnyHeader ()
                .AllowAnyMethod ()
                .WithOrigins (
                    "http://localhost:59320",
                    "https://localhost:59320",
                    "http://localhost:3000",
                    "http://localhost:5173"
                )
                .AllowCredentials ();
        } );
    } );

    Log.Logger = new LoggerConfiguration ()
        .ReadFrom.Configuration ( builder.Configuration )
        .CreateLogger ();

    builder.Host.UseSerilog ( Log.Logger );

    builder.Services.AddControllers ()
        .AddJsonOptions ( o =>
        {
            o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        } );



    builder.Services.AddControllers ();
    builder.Services.AddEndpointsApiExplorer ();
    builder.Services.AddSwaggerGen ();

    // Serve React static files from wwwroot (used in production/IIS)
    builder.Services.AddSpaStaticFiles ( config =>
    {
        config.RootPath = "wwwroot";
    } );

    var app = builder.Build ();



    // HTTP pipeline
    if ( app.Environment.IsDevelopment () )
    {
        app.UseDeveloperExceptionPage ();
        app.UseSwagger ();
        app.UseSwaggerUI ();
    }
    else
    {
        app.UseHsts ();
        app.UseHttpsRedirection ();
    }

    app.UseStaticFiles ();
    app.UseSpaStaticFiles ();

    app.UseRouting ();
    app.UseCors ( "CorsPolicy" );
    app.UseAuthorization ();

    app.UseSerilogRequestLogging ();
    app.UseMiddleware<CorrelationIdMiddleware> ();
    app.UseExceptionHandler ( errorApp =>
    {
        errorApp.Run ( async context =>
        {
            var feature =
                context.Features.Get<IExceptionHandlerPathFeature> ();

            if ( feature?.Error != null )
            {
                Log.Error (
                    feature.Error,
                    "Unhandled exception" );
            }

            context.Response.StatusCode = 500;

            await context.Response.WriteAsJsonAsync (
                new
                {
                    Message = "Internal server error"
                } );
        } );
    } );

    app.MapAuthEndpoints ();
    app.MapTicketEndpoints ();
    //app.MapControllers ();

    // In production: serve React SPA for all non-API routes
    if ( !app.Environment.IsDevelopment () )
    {
        app.MapFallbackToFile ( "index.html" );
    }

    app.Run ();
}
catch ( Exception ex )
{
    Log.Fatal ( ex, "Application failed to start" );
}
finally
{
    Log.CloseAndFlush ();
}

// Required for WebApplicationFactory in tests
public partial class Program { }