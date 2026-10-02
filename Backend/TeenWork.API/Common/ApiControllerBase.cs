using Microsoft.AspNetCore.Mvc;
using TeenWork.Application.Common.Models;

namespace TeenWork.API.Common;

[ApiController]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ApiResponse), StatusCodes.Status500InternalServerError)]
public abstract class ApiControllerBase : ControllerBase
{
    protected OkObjectResult OkData<T>(T data, string? message = null) => Ok(ApiResponse<T>.Ok(data, message));

    protected ObjectResult CreatedData<T>(string location, T data, string? message = null) =>
        Created(location, ApiResponse<T>.Ok(data, message));

    protected OkObjectResult OkMessage(string message) => Ok(ApiResponse.FromMessage(message));
}
