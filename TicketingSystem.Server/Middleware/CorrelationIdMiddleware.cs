namespace TicketingSystem.Server.Middleware;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware( RequestDelegate next )
    {
        _next = next;
    }

    public async Task Invoke(
        HttpContext context,
        ILogger<CorrelationIdMiddleware> logger )
    {
        var correlationId =
            context.Request.Headers["X-Correlation-ID"]
            .FirstOrDefault ()
            ?? Guid.NewGuid ().ToString ();

        context.Response.Headers["X-Correlation-ID"] =
            correlationId;

        using ( Serilog.Context.LogContext.PushProperty (
            "CorrelationId",
            correlationId ) )
        {
            await _next ( context );
        }
    }
}
