using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using TeenWork.Application.Common.Models;

namespace TeenWork.API.Common;

/// <summary>
/// Executa automaticamente o validador FluentValidation de cada argumento da action
/// (corpo JSON ou query string). Falhas geram HTTP 400 no envelope padrão.
/// </summary>
public sealed class ValidationFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var errors = new List<ApiError>();

        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null || argument is CancellationToken || argument is IFormFile) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (context.HttpContext.RequestServices.GetService(validatorType) is not IValidator validator) continue;

            var result = await validator.ValidateAsync(new ValidationContext<object>(argument), context.HttpContext.RequestAborted);
            errors.AddRange(result.Errors.Select(e => new ApiError(ToCamelCase(e.PropertyName), e.ErrorMessage)));
        }

        if (errors.Count > 0)
        {
            context.Result = new BadRequestObjectResult(ApiResponse.Fail("Alguns campos precisam de atenção.", errors));
            return;
        }

        await next();
    }

    internal static string ToCamelCase(string value)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return string.Join('.', value.Split('.').Select(part =>
            part.Length == 0 ? part : char.ToLowerInvariant(part[0]) + part[1..]));
    }
}
