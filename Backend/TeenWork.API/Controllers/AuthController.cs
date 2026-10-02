using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TeenWork.API.Common;
using TeenWork.Application.Auth;
using TeenWork.Application.Common.Models;

namespace TeenWork.API.Controllers;

/// <summary>Cadastro, login e gerenciamento de senha.</summary>
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ApiControllerBase
{
    /// <summary>Cria uma conta de estudante (STUDENT) ou empresa (COMPANY) e já retorna o token.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await authService.RegisterAsync(request, ct);
        return CreatedData("/api/auth/me", result, "Conta criada com sucesso!");
    }

    /// <summary>Autentica com e-mail e senha e retorna o JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct) =>
        OkData(await authService.LoginAsync(request, ct), "Login realizado com sucesso.");

    /// <summary>Dados do usuário autenticado.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct) => OkData(await authService.GetCurrentUserAsync(ct));

    /// <summary>Envia o link de redefinição de senha (a resposta é sempre a mesma, por segurança).</summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken ct)
    {
        await authService.RequestPasswordResetAsync(request, ct);
        return OkMessage("Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
    }

    /// <summary>Define uma nova senha a partir do token recebido por e-mail.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken ct)
    {
        await authService.ResetPasswordAsync(request, ct);
        return OkMessage("Senha redefinida com sucesso. Faça login com a nova senha.");
    }

    /// <summary>Altera a senha do usuário logado.</summary>
    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        await authService.ChangePasswordAsync(request, ct);
        return OkMessage("Senha alterada com sucesso.");
    }
}
