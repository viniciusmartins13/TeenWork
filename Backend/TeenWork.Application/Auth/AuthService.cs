using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Validation;
using TeenWork.Domain.Constants;
using TeenWork.Domain.Entities;
using TeenWork.Domain.Enums;

namespace TeenWork.Application.Auth;

public sealed class AuthService(
    IAppDbContext db,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    ICurrentUser currentUser,
    IEmailSender emailSender,
    IOptions<FrontendOptions> frontendOptions,
    TimeProvider clock) : IAuthService
{
    private const string InvalidCredentialsMessage = "E-mail ou senha inválidos.";
    private static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromHours(1);

    // Hash usado quando o e-mail não existe, para que o tempo de resposta não revele contas cadastradas.
    private static string? _dummyHash;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        if (!Roles.TryParse(request.UserType, out var userType) || userType == UserType.Admin)
        {
            throw new BadRequestException("Tipo de conta inválido.");
        }

        var email = NormalizeEmail(request.Email);
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
        {
            throw new ConflictException("Este e-mail já está cadastrado. Faça login ou use outro e-mail.");
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            UserType = userType,
            IsActive = true,
            LastLoginAt = AppTime.UtcNow(clock)
        };

        if (userType == UserType.Student)
        {
            user.StudentProfile = new StudentProfile
            {
                School = request.School.TrimToNull(),
                Course = request.Course.TrimToNull(),
                City = request.City.TrimToNull(),
                State = request.State.ToUpperTrimmed()
            };
        }
        else
        {
            var cnpj = CnpjValidator.Normalize(request.Cnpj);
            if (cnpj is not null && await db.CompanyProfiles.AnyAsync(c => c.Cnpj == cnpj, ct))
            {
                throw new ConflictException("Já existe uma empresa cadastrada com este CNPJ.");
            }

            user.CompanyProfile = new CompanyProfile
            {
                CompanyName = request.CompanyName!.Trim(),
                Cnpj = cnpj,
                City = request.City.TrimToNull(),
                State = request.State.ToUpperTrimmed()
            };
        }

        user.Notifications.Add(new Notification
        {
            Title = "Bem-vindo(a) ao TeenWork!",
            Message = userType == UserType.Student
                ? "Complete seu perfil com escola, curso e habilidades para receber recomendações de vagas melhores."
                : "Complete o perfil da empresa e publique sua primeira vaga para começar a receber candidaturas.",
            Type = NotificationType.System,
            Link = userType == UserType.Student ? "/aluno/perfil" : "/empresa/perfil"
        });

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        var user = await db.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.CompanyProfile)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
        {
            passwordHasher.Verify(request.Password, _dummyHash ??= passwordHasher.Hash("teenwork-dummy-password"));
            throw new UnauthorizedException(InvalidCredentialsMessage);
        }

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException(InvalidCredentialsMessage);
        }

        if (!user.IsActive)
        {
            throw new ForbiddenException("Sua conta está desativada. Entre em contato com o suporte do TeenWork.");
        }

        user.LastLoginAt = AppTime.UtcNow(clock);
        await db.SaveChangesAsync(ct);

        return BuildAuthResponse(user);
    }

    public async Task<UserDto> GetCurrentUserAsync(CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var user = await db.Users
            .AsNoTracking()
            .Include(u => u.StudentProfile)
            .Include(u => u.CompanyProfile)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("Usuário não encontrado. Faça login novamente.");

        if (!user.IsActive)
        {
            throw new ForbiddenException("Sua conta está desativada.");
        }

        return ToUserDto(user);
    }

    public async Task RequestPasswordResetAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive, ct);

        // A resposta é sempre a mesma para não revelar quais e-mails estão cadastrados.
        if (user is null) return;

        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetTokenHash = HashToken(token);
        user.PasswordResetTokenExpiresAt = AppTime.UtcNow(clock).Add(ResetTokenLifetime);
        await db.SaveChangesAsync(ct);

        var baseUrl = frontendOptions.Value.FrontendUrl.TrimEnd('/');
        var link = $"{baseUrl}/redefinir-senha?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";
        var safeName = WebUtility.HtmlEncode(user.Name);
        var safeLink = WebUtility.HtmlEncode(link);

        var body = $"""
            <p>Olá, {safeName}!</p>
            <p>Recebemos um pedido para redefinir a senha da sua conta no TeenWork.</p>
            <p><a href="{safeLink}">Clique aqui para criar uma nova senha</a>. O link expira em 1 hora.</p>
            <p>Se você não fez esse pedido, ignore este e-mail — sua senha continua a mesma.</p>
            """;

        await emailSender.SendAsync(user.Email, "TeenWork — redefinição de senha", body, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        var now = AppTime.UtcNow(clock);

        var isValid = user is not null
            && user.PasswordResetTokenHash is not null
            && user.PasswordResetTokenExpiresAt is not null
            && user.PasswordResetTokenExpiresAt.Value > now
            && CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(user.PasswordResetTokenHash),
                Encoding.UTF8.GetBytes(HashToken(request.Token.Trim())));

        if (!isValid)
        {
            throw new BusinessRuleException("Este link de redefinição é inválido ou expirou. Solicite um novo.");
        }

        user!.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        await db.SaveChangesAsync(ct);
    }

    public async Task ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default)
    {
        var userId = currentUser.GetRequiredUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("Usuário não encontrado. Faça login novamente.");

        if (!passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new BadRequestException("A senha atual está incorreta.",
                [new("currentPassword", "A senha atual está incorreta.")]);
        }

        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        await db.SaveChangesAsync(ct);
    }

    internal static UserDto ToUserDto(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = Roles.FromUserType(user.UserType),
        ProfileImage = user.ProfileImage,
        ProfileId = user.UserType switch
        {
            UserType.Student => user.StudentProfile?.Id,
            UserType.Company => user.CompanyProfile?.Id,
            _ => null
        },
        CompanyName = user.CompanyProfile?.CompanyName,
        CompanyLogo = user.CompanyProfile?.Logo,
        CreatedAt = user.CreatedAt
    };

    private AuthResponse BuildAuthResponse(User user)
    {
        var token = tokenService.CreateToken(user);
        return new AuthResponse
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAt,
            User = ToUserDto(user)
        };
    }

    internal static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

/// <summary>Codificação Base64 segura para URLs (sem dependência de pacotes web).</summary>
internal static class WebEncoders
{
    public static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
