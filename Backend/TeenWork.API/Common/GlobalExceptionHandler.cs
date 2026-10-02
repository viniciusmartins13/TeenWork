using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Models;

namespace TeenWork.API.Common;

/// <summary>
/// Converte qualquer exceção no envelope padrão { success, message, errors }.
/// Nunca expõe stack trace ou detalhes internos ao cliente.
/// </summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        (int Status, string Message, IReadOnlyList<ApiError> Errors) result = exception switch
        {
            BadRequestException e => (StatusCodes.Status400BadRequest, e.Message, e.Errors),
            UnauthorizedException e => (StatusCodes.Status401Unauthorized, e.Message, Array.Empty<ApiError>()),
            ForbiddenException e => (StatusCodes.Status403Forbidden, e.Message, Array.Empty<ApiError>()),
            NotFoundException e => (StatusCodes.Status404NotFound, e.Message, Array.Empty<ApiError>()),
            ConflictException e => (StatusCodes.Status409Conflict, e.Message, Array.Empty<ApiError>()),
            BusinessRuleException e => (StatusCodes.Status422UnprocessableEntity, e.Message, Array.Empty<ApiError>()),
            DbUpdateException e when IsDuplicateKey(e) => (StatusCodes.Status409Conflict,
                "Este registro já existe. Atualize a página e tente novamente.", Array.Empty<ApiError>()),
            BadHttpRequestException e => (e.StatusCode, e.StatusCode == StatusCodes.Status413PayloadTooLarge
                ? "O arquivo enviado é grande demais."
                : "Requisição inválida. Verifique os dados enviados.", Array.Empty<ApiError>()),
            _ => (StatusCodes.Status500InternalServerError,
                "Ocorreu um erro inesperado. Tente novamente em instantes.", Array.Empty<ApiError>())
        };

        if (result.Status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Erro não tratado em {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogDebug("Requisição rejeitada ({Status}): {Message}", result.Status, result.Message);
        }

        if (httpContext.Response.HasStarted)
        {
            return false;
        }

        httpContext.Response.StatusCode = result.Status;
        await httpContext.Response.WriteAsJsonAsync(ApiResponse.Fail(result.Message, result.Errors), cancellationToken);
        return true;
    }

    private static bool IsDuplicateKey(DbUpdateException exception) =>
        exception.InnerException?.Message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase) == true;
}
