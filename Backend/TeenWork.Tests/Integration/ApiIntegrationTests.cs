using System.Net;
using System.Net.Http.Json;

namespace TeenWork.Tests.Integration;

public sealed class ApiIntegrationTests(TeenWorkApiFactory factory) : IClassFixture<TeenWorkApiFactory>
{
    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await factory.CreateClient().GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_Returns401WithStandardEnvelope()
    {
        var response = await factory.CreateClient().GetAsync("/api/applications/my");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = await response.ReadEnvelopeAsync<object>();
        Assert.False(body.Success);
        Assert.False(string.IsNullOrWhiteSpace(body.Message));
    }

    [Fact]
    public async Task UnknownApiRoute_Returns404Json_NotHtml()
    {
        var response = await factory.CreateClient().GetAsync("/api/rota-que-nao-existe");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Register_InvalidData_Returns400WithFieldErrors()
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/api/auth/register", new
        {
            name = "A",
            email = "email-invalido",
            password = "123",
            confirmPassword = "456",
            userType = "STUDENT",
            acceptTerms = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.ReadEnvelopeAsync<object>();
        Assert.False(body.Success);
        Assert.Contains(body.Errors, e => e.Field == "email");
        Assert.Contains(body.Errors, e => e.Field == "password");
    }

    [Fact]
    public async Task Login_ReturnsTokenThatAuthorizesMe()
    {
        var client = factory.CreateClient();
        var email = $"login-{Guid.NewGuid():N}@teste.com";
        await client.RegisterAsync("STUDENT", email);

        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = ApiTestExtensions.Password });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var auth = (await login.ReadEnvelopeAsync<AuthData>()).Data!;

        var me = await factory.CreateClient().WithToken(auth.Token).GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        Assert.Equal("STUDENT", (await me.ReadEnvelopeAsync<UserData>()).Data!.Role);
    }

    [Fact]
    public async Task Student_CannotCreateJob_Returns403()
    {
        var anonymous = factory.CreateClient();
        var student = await anonymous.RegisterAsync("STUDENT");

        var response = await factory.CreateClient().WithToken(student.Token)
            .PostAsJsonAsync("/api/jobs", ApiTestExtensions.SampleJob(), ApiTestExtensions.Json);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FullFlow_CreateJob_Apply_DuplicateIsRejected_CompanyChangesStatus()
    {
        var company = await factory.CreateClient().RegisterAsync("COMPANY");
        var companyClient = factory.CreateClient().WithToken(company.Token);

        var created = await companyClient.PostAsJsonAsync("/api/jobs", ApiTestExtensions.SampleJob(), ApiTestExtensions.Json);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var job = (await created.ReadEnvelopeAsync<IdData>()).Data!;

        var student = await factory.CreateClient().RegisterAsync("STUDENT");
        var studentClient = factory.CreateClient().WithToken(student.Token);

        var apply = await studentClient.PostAsJsonAsync($"/api/jobs/{job.Id}/apply", new { coverLetter = "Quero muito participar!" });
        Assert.Equal(HttpStatusCode.Created, apply.StatusCode);
        var application = (await apply.ReadEnvelopeAsync<IdData>()).Data!;
        Assert.Equal("Pending", application.Status);

        var duplicate = await studentClient.PostAsJsonAsync($"/api/jobs/{job.Id}/apply", new { });
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);

        var status = await companyClient.PatchAsJsonAsync($"/api/applications/{application.Id}/status",
            new { status = "UnderReview" });
        Assert.Equal(HttpStatusCode.OK, status.StatusCode);
        Assert.Equal("UnderReview", (await status.ReadEnvelopeAsync<IdData>()).Data!.Status);

        // O aluno não pode alterar o status da própria candidatura.
        var forbidden = await studentClient.PatchAsJsonAsync($"/api/applications/{application.Id}/status",
            new { status = "Accepted" });
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    [Fact]
    public async Task Company_CannotListApplicationsOfAnotherCompanyJob()
    {
        var owner = await factory.CreateClient().RegisterAsync("COMPANY");
        var ownerClient = factory.CreateClient().WithToken(owner.Token);
        var created = await ownerClient.PostAsJsonAsync("/api/jobs", ApiTestExtensions.SampleJob(), ApiTestExtensions.Json);
        var job = (await created.ReadEnvelopeAsync<IdData>()).Data!;

        var intruder = await factory.CreateClient().RegisterAsync("COMPANY");
        var response = await factory.CreateClient().WithToken(intruder.Token).GetAsync($"/api/jobs/{job.Id}/applications");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PublicJobSearch_SupportsPaginationParameters()
    {
        var response = await factory.CreateClient().GetAsync("/api/jobs?page=1&pageSize=5&workModel=Hybrid&sort=recent");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var invalid = await factory.CreateClient().GetAsync("/api/jobs?pageSize=500");
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }
}
