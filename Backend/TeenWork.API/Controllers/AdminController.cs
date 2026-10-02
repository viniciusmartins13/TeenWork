using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Admin;
using TeenWork.Application.Common.Models;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Área administrativa (base preparada para evolução do projeto).</summary>
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public sealed class AdminController(IAdminService adminService) : ApiControllerBase
{
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ApiResponse<AdminStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Stats(CancellationToken ct) => OkData(await adminService.GetStatsAsync(ct));

    [HttpGet("users")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AdminUserDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Users([FromQuery] AdminUserQuery query, CancellationToken ct) =>
        OkData(await adminService.GetUsersAsync(query, ct));

    [HttpPatch("users/{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetUserStatus(int id, SetUserActiveRequest request, CancellationToken ct)
    {
        await adminService.SetUserActiveAsync(id, request, ct);
        return OkMessage(request.IsActive ? "Conta ativada." : "Conta desativada.");
    }
}
