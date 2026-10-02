using Microsoft.AspNetCore.Mvc;
using TeenWork.Application.Common.Models;

namespace TeenWork.API.Common;

public static class ApiErrorResponses
{
    /// <summary>Mensagens padrão para respostas sem corpo (401, 403, 404, 405, 429...).</summary>
    public static string MessageFor(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "Requisição inválida.",
        StatusCodes.Status401Unauthorized => "Você precisa estar logado para acessar este recurso.",
        StatusCodes.Status403Forbidden => "Você não tem permissão para acessar este recurso.",
        StatusCodes.Status404NotFound => "Recurso não encontrado.",
        StatusCodes.Status405MethodNotAllowed => "Método HTTP não permitido para este endereço.",
        StatusCodes.Status413PayloadTooLarge => "O conteúdo enviado é grande demais.",
        StatusCodes.Status415UnsupportedMediaType => "Formato de conteúdo não suportado.",
        StatusCodes.Status429TooManyRequests => "Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.",
        _ => "Não foi possível concluir a requisição."
    };

    /// <summary>Erros de binding (JSON malformado, tipo inválido) no mesmo envelope da validação.</summary>
    public static IActionResult FromModelState(ActionContext context)
    {
        var errors = context.ModelState
            .Where(entry => entry.Value is { Errors.Count: > 0 })
            .Select(entry => new ApiError(
                ValidationFilter.ToCamelCase(entry.Key.TrimStart('$', '.')),
                "Valor inválido ou em formato incorreto."))
            .ToList();

        return new BadRequestObjectResult(ApiResponse.Fail("Requisição inválida. Verifique os dados enviados.", errors));
    }
}
