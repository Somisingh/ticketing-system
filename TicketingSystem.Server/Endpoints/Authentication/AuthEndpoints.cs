namespace TicketingSystem.Server.Endpoints.Authentication
{
    public static class AuthEndpoints
    {

        public static IEndpointRouteBuilder MapAuthEndpoints( this IEndpointRouteBuilder app )
        {
            var group = app.MapGroup ( "/api/auth" )
            .WithTags ( "Authentication" );

            group.MapSignUpUserEndpoint ();
            group.MapLoginUserEndpoint ();
            group.MapForgotPasswordEndpoint ();

            return app;
        }

    }

}
