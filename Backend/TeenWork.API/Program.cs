using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using TeenWork.API.Common;
using TeenWork.Application;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Infrastructure;
using TeenWork.Infrastructure.Persistence;
using TeenWork.Infrastructure.Storage;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Serviços
// ---------------------------------------------------------------------------
builder.Services.AddApplication();
builder.Services.AddInfrastructure();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();

builder.Services
    .AddControllers(options =>
    {
        options.Filters.Add<ValidationFilter>();
        // As validações ficam no FluentValidation (mensagens em português).
        options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = ApiErrorResponses.FromModelState;
    });

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

const string CorsPolicy = "Frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:5173"];
builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(RateLimitPolicies.Auth, context =>
    {
        var permitLimit = context.RequestServices.GetRequiredService<IConfiguration>().GetValue("RateLimiting:AuthPermitLimit", 20);
        return RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TeenWork API",
        Version = "v1",
        Description = "API da plataforma TeenWork — conectando estudantes do ensino médio ao primeiro emprego, " +
                      "Jovem Aprendiz, estágios e cursos. Faça login em /api/auth/login, copie o token e clique em Authorize."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Cole apenas o token JWT retornado no login (o prefixo \"Bearer\" é adicionado automaticamente)."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xmlFile = Path.Combine(AppContext.BaseDirectory, "TeenWork.API.xml");
    if (File.Exists(xmlFile))
    {
        options.IncludeXmlComments(xmlFile);
    }
});

var app = builder.Build();

// ---------------------------------------------------------------------------
// Banco de dados: migrations + seed
// ---------------------------------------------------------------------------
await app.Services.InitializeDatabaseAsync();

// ---------------------------------------------------------------------------
// Pipeline HTTP
// ---------------------------------------------------------------------------
app.UseExceptionHandler();

// Respostas sem corpo (401, 403, 404, 405, 429...) da API recebem o envelope padrão.
app.UseStatusCodePages(async context =>
{
    var http = context.HttpContext;
    if (!http.Request.Path.StartsWithSegments("/api")) return;

    http.Response.ContentType = "application/json; charset=utf-8";
    await http.Response.WriteAsJsonAsync(ApiResponse.Fail(ApiErrorResponses.MessageFor(http.Response.StatusCode)));
});

app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Configuration.GetValue("Swagger:Enabled", true))
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "TeenWork API v1");
        options.DocumentTitle = "TeenWork API";
    });
}

// Frontend compilado (Docker/produção) em wwwroot.
app.UseDefaultFiles();
app.UseStaticFiles();

// Fotos e logos enviadas pelos usuários.
var uploadsRoot = app.Services.GetRequiredService<IOptions<StorageOptions>>().Value.ResolveRoot(app.Environment.ContentRootPath);
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = StorageOptions.PublicRequestPath
});

app.UseCors(CorsPolicy);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(ApiResponse<object>.Ok(new { status = "ok", time = DateTime.UtcNow })))
    .AllowAnonymous()
    .ExcludeFromDescription();

// SPA fallback: rotas do React caem no index.html, mas NUNCA /api, /swagger ou /uploads
// (senão um 404 da API devolveria HTML).
app.MapFallback(async context =>
{
    var path = context.Request.Path;
    if (path.StartsWithSegments("/api") || path.StartsWithSegments("/swagger") ||
        path.StartsWithSegments(StorageOptions.PublicRequestPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsJsonAsync(ApiResponse.Fail(ApiErrorResponses.MessageFor(StatusCodes.Status404NotFound)));
        return;
    }

    var index = app.Environment.WebRootFileProvider.GetFileInfo("index.html");
    if (!index.Exists)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        context.Response.ContentType = "text/plain; charset=utf-8";
        await context.Response.WriteAsync(
            "Frontend não publicado nesta API. Em desenvolvimento, rode \"npm run dev\" na pasta Frontend e acesse http://localhost:5173. " +
            "A documentação da API está em /swagger.");
        return;
    }

    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.SendFileAsync(index);
});

app.Run();

/// <summary>Exposto para os testes de integração (WebApplicationFactory).</summary>
public partial class Program;
