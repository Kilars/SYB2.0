//TODO
// Client work (show matches and show match.)
// Think about how u want to register rounds/matches, signalR?
using API.Middleware;
using Application.Core;
using Application.Interfaces;
using Application.Leagues.Queries;
using Application.Leagues.Validators;
using Domain;
using FluentValidation;
using Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddScoped<IUserAccessor, UserAccessor>();
builder.Services.AddAutoMapper(typeof(MappingProfiles).Assembly);
builder.Services.AddValidatorsFromAssemblyContaining<CreateLeagueValidator>();
builder.Services.AddTransient<ExceptionMiddleware>();
builder.Services.AddControllers(opt =>
{
    var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    opt.Filters.Add(new AuthorizeFilter(policy));
});
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddCors();
builder.Services.AddMediatR(
    x => {
        x.RegisterServicesFromAssemblyContaining<GetLeagueList.Handler>();
        x.AddOpenBehavior(typeof(ValidationBehaviour<,>));
    }
);
builder.Services.AddIdentityApiEndpoints<User>(opt =>
{
    opt.User.RequireUniqueEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthorization(opt =>
{
    opt.AddPolicy("IsLeagueAdmin", policy =>
    {
        policy.Requirements.Add(new IsAdminRequirement());
    });
    opt.AddPolicy("IsLeagueMember", policy =>
    {
        policy.Requirements.Add(new IsLeagueMember());
    });
    opt.AddPolicy("IsMatchEditable", policy =>
    {
        policy.Requirements.Add(new IsMatchEditable());
    });
    opt.AddPolicy("IsLeaguePlanned", policy =>
    {
        policy.Requirements.Add(new IsPlannedRequirement());
    });
});
builder.Services.AddTransient<IAuthorizationHandler, IsAdminRequirementHandler>();
builder.Services.AddTransient<IAuthorizationHandler, IsPlannerRequirementHandler>();
builder.Services.AddTransient<IAuthorizationHandler, IsMatchEditableHandler>();
builder.Services.AddTransient<IAuthorizationHandler, IsLeagueMemberHandler>();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors(x => x.AllowAnyHeader().AllowAnyMethod().AllowCredentials().WithOrigins("http://localhost:3000"));
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("api").MapIdentityApi<User>(); //api/login

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

try
{
    var context = services.GetRequiredService<AppDbContext>();
    var userManager = services.GetRequiredService<UserManager<User>>();
    await context.Database.MigrateAsync();
    await DbInitializer.SeedData(context, userManager);
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occured during migration");
}


app.Run();
