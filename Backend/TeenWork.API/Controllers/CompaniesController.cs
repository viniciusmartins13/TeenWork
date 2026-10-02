using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Companies;
using TeenWork.Application.Jobs;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Empresas: perfil público, perfil próprio e gestão de vagas.</summary>
[Route("api/companies")]
public sealed class CompaniesController(ICompanyService companyService, IJobService jobService) : ApiControllerBase
{
    /// <summary>Lista empresas cadastradas (paginado).</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CompanySummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] CompanyQuery query, CancellationToken ct) =>
        OkData(await companyService.SearchAsync(query, ct));

    /// <summary>Perfil público de uma empresa.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<CompanyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => OkData(await companyService.GetByIdAsync(id, ct));

    /// <summary>Perfil da empresa logada.</summary>
    [HttpGet("me")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<CompanyProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe(CancellationToken ct) => OkData(await companyService.GetMyProfileAsync(ct));

    /// <summary>Atualiza o perfil da empresa logada.</summary>
    [HttpPut("profile")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<CompanyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateProfile(UpdateCompanyProfileRequest request, CancellationToken ct) =>
        OkData(await companyService.UpdateProfileAsync(request, ct), "Perfil da empresa atualizado.");

    /// <summary>Todas as vagas da empresa logada (qualquer status), com contagem de candidaturas.</summary>
    [HttpGet("me/jobs")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CompanyJobDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyJobs([FromQuery] CompanyJobQuery query, CancellationToken ct) =>
        OkData(await jobService.GetMyCompanyJobsAsync(query, ct));
}
