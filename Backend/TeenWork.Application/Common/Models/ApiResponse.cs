namespace TeenWork.Application.Common.Models;

/// <summary>Erro de validação associado a um campo (Field vazio = erro geral).</summary>
public sealed record ApiError(string Field, string Message);

/// <summary>
/// Envelope padrão de todas as respostas da API.
/// </summary>
public class ApiResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<ApiError> Errors { get; init; } = [];

    public static ApiResponse Fail(string message, IReadOnlyList<ApiError>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors ?? [] };

    public static ApiResponse FromMessage(string message) =>
        new() { Success = true, Message = message };
}

public class ApiResponse<T> : ApiResponse
{
    public T? Data { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Message = message, Data = data };
}
