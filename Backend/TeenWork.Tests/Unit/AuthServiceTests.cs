using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Auth;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Domain.Constants;
using TeenWork.Tests.Support;

namespace TeenWork.Tests.Unit;

public sealed class AuthServiceTests : IDisposable
{
    private readonly TestEnvironment _env = new();

    [Fact]
    public async Task Register_Student_CreatesUserProfileAndReturnsToken()
    {
        var result = await _env.RegisterStudentAsync("Ana@Teste.com");

        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal(Roles.Student, result.User.Role);
        Assert.Equal("ana@teste.com", result.User.Email); // e-mail normalizado
        Assert.NotNull(result.User.ProfileId);

        var user = await _env.Db.Users.Include(u => u.StudentProfile).SingleAsync();
        Assert.NotNull(user.StudentProfile);
        Assert.NotEqual(TestEnvironment.Password, user.PasswordHash); // senha nunca em texto puro
        Assert.True(_env.Hasher.Verify(TestEnvironment.Password, user.PasswordHash));
    }

    [Fact]
    public async Task Register_Company_CreatesCompanyProfile()
    {
        var result = await _env.RegisterCompanyAsync(companyName: "Nuvem Azul");

        Assert.Equal(Roles.Company, result.User.Role);
        Assert.Equal("Nuvem Azul", result.User.CompanyName);
        Assert.Equal(1, await _env.Db.CompanyProfiles.CountAsync());
    }

    [Fact]
    public async Task Register_DuplicatedEmail_ThrowsConflict()
    {
        await _env.RegisterStudentAsync("repetido@teste.com");

        await Assert.ThrowsAsync<ConflictException>(() => _env.RegisterStudentAsync("REPETIDO@teste.com"));
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        await _env.RegisterStudentAsync("login@teste.com");

        var result = await _env.Auth.LoginAsync(new LoginRequest { Email = " login@teste.com ", Password = TestEnvironment.Password });

        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("login@teste.com", result.User.Email);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ThrowsUnauthorized()
    {
        await _env.RegisterStudentAsync("login@teste.com");

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _env.Auth.LoginAsync(new LoginRequest { Email = "login@teste.com", Password = "SenhaErrada@1" }));
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ThrowsUnauthorized()
    {
        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _env.Auth.LoginAsync(new LoginRequest { Email = "ninguem@teste.com", Password = TestEnvironment.Password }));
    }

    [Fact]
    public async Task Login_DeactivatedAccount_ThrowsForbidden()
    {
        await _env.RegisterStudentAsync("inativo@teste.com");
        var user = await _env.Db.Users.SingleAsync();
        user.IsActive = false;
        await _env.Db.SaveChangesAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _env.Auth.LoginAsync(new LoginRequest { Email = "inativo@teste.com", Password = TestEnvironment.Password }));
    }

    [Fact]
    public void RegisterValidator_RejectsWeakPasswordAndMissingTerms()
    {
        var validator = new RegisterRequestValidator();
        var result = validator.Validate(new RegisterRequest
        {
            Name = "Aluno",
            Email = "aluno@teste.com",
            Password = "fraca",
            ConfirmPassword = "fraca",
            UserType = Roles.Student,
            AcceptTerms = false
        });

        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Password));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.AcceptTerms));
    }

    [Fact]
    public void RegisterValidator_CompanyRequiresValidCnpj()
    {
        var validator = new RegisterRequestValidator();
        var result = validator.Validate(new RegisterRequest
        {
            Name = "Responsável",
            Email = "rh@teste.com",
            Password = TestEnvironment.Password,
            ConfirmPassword = TestEnvironment.Password,
            UserType = Roles.Company,
            CompanyName = "Empresa",
            Cnpj = "11.111.111/1111-11",
            AcceptTerms = true
        });

        Assert.Contains(result.Errors, e => e.PropertyName == nameof(RegisterRequest.Cnpj));
    }

    public void Dispose() => _env.Dispose();
}
