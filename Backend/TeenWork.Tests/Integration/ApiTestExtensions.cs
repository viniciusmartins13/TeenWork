using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace TeenWork.Tests.Integration;

public sealed class Envelope<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<EnvelopeError> Errors { get; set; } = [];
    public T? Data { get; set; }
}

public sealed class EnvelopeError
{
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public sealed class AuthData
{
    public string Token { get; set; } = string.Empty;
    public UserData User { get; set; } = new();
}

public sealed class UserData
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
}

public sealed class IdData
{
    public int Id { get; set; }
    public string? Status { get; set; }
}

public static class ApiTestExtensions
{
    public const string Password = "Senha@123";

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task<Envelope<T>> ReadEnvelopeAsync<T>(this HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<Envelope<T>>(Json))!;

    public static async Task<AuthData> RegisterAsync(this HttpClient client, string userType, string? email = null)
    {
        email ??= $"{userType.ToLowerInvariant()}-{Guid.NewGuid():N}@teste.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            name = userType == "COMPANY" ? "Responsável RH" : "Estudante Teste",
            email,
            password = Password,
            confirmPassword = Password,
            userType,
            companyName = userType == "COMPANY" ? "Empresa Teste" : null,
            city = "Campinas",
            state = "SP",
            acceptTerms = true
        }, Json);

        response.EnsureSuccessStatusCode();
        return (await response.ReadEnvelopeAsync<AuthData>()).Data!;
    }

    public static HttpClient WithToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public static object SampleJob(string title = "Estágio em Desenvolvimento Web") => new
    {
        title,
        description = "Participar do desenvolvimento de sistemas web com mentoria de um desenvolvedor sênior.",
        requirements = "Cursando técnico em informática",
        area = "Tecnologia",
        city = "Campinas",
        state = "SP",
        workModel = "Hybrid",
        jobType = "Internship",
        salary = 1200,
        vacancies = 2,
        deadline = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(20).ToString("yyyy-MM-dd")
    };
}
