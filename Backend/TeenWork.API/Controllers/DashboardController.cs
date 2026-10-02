using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Dashboard;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Resumos para as telas iniciais do aluno e da empresa.</summary>
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController(IDashboardService dashboardService) : ApiControllerBase
{
    [HttpGet("student")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<StudentDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Student(CancellationToken ct) => OkData(await dashboardService.GetStudentDashboardAsync(ct));

    [HttpGet("company")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<CompanyDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Company(CancellationToken ct) => OkData(await dashboardService.GetCompanyDashboardAsync(ct));
}
