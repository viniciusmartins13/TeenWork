using TeenWork.Application.Common.Models;

namespace TeenWork.Application.Common.Exceptions;

/// <summary>
/// Exceções de aplicação. O middleware da API converte cada tipo no HTTP status correspondente:
/// BadRequest=400, Unauthorized=401, Forbidden=403, NotFound=404, Conflict=409, BusinessRule=422.
/// </summary>
public abstract class AppException : Exception
{
    protected AppException(string message) : base(message) { }
}

public sealed class BadRequestException : AppException
{
    public BadRequestException(string message, IReadOnlyList<ApiError>? errors = null) : base(message)
    {
        Errors = errors ?? [];
    }

    public IReadOnlyList<ApiError> Errors { get; }
}

public sealed class UnauthorizedException : AppException
{
    public UnauthorizedException(string message) : base(message) { }
}

public sealed class ForbiddenException : AppException
{
    public ForbiddenException(string message) : base(message) { }
}

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message) { }
}

public sealed class ConflictException : AppException
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Dados válidos, mas que violam uma regra de negócio (HTTP 422).</summary>
public sealed class BusinessRuleException : AppException
{
    public BusinessRuleException(string message) : base(message) { }
}
