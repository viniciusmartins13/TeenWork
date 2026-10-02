using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Jobs;
using TeenWork.Application.SavedJobs;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Busca, detalhes e gestão de vagas.</summary>
[Route("api/jobs")]
public sealed class JobsController(IJobService jobService, ISavedJobService savedJobService) : ApiControllerBase
{
    /// <summary>
    /// Busca vagas abertas com paginação, filtros e ordenação.
    /// Ex.: /api/jobs?page=1&amp;pageSize=10&amp;search=estágio&amp;city=Campinas&amp;workModel=Hybrid&amp;sort=recent
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<JobSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] JobQuery query, CancellationToken ct) =>
        OkData(await jobService.SearchAsync(query, ct));

    /// <summary>Áreas, localidades e salário máximo das vagas abertas (para montar os filtros).</summary>
    [HttpGet("filters")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<JobFilterOptionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilters(CancellationToken ct) => OkData(await jobService.GetFilterOptionsAsync(ct));

    /// <summary>Detalhes de uma vaga.</summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<JobDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => OkData(await jobService.GetByIdAsync(id, ct));

    /// <summary>Publica uma nova vaga (empresa logada).</summary>
    [HttpPost]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<JobDetailsDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(JobRequest request, CancellationToken ct)
    {
        var job = await jobService.CreateAsync(request, ct);
        return CreatedData($"/api/jobs/{job.Id}", job, "Vaga publicada com sucesso!");
    }

    /// <summary>Edita uma vaga da empresa logada.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<JobDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, JobRequest request, CancellationToken ct) =>
        OkData(await jobService.UpdateAsync(id, request, ct), "Vaga atualizada.");

    /// <summary>Ativa, desativa ou encerra uma vaga (Active, Inactive, Closed).</summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<JobDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateStatus(int id, UpdateJobStatusRequest request, CancellationToken ct) =>
        OkData(await jobService.UpdateStatusAsync(id, request, ct), "Status da vaga atualizado.");

    /// <summary>Exclui uma vaga sem candidaturas (vagas com candidatos devem ser encerradas).</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await jobService.DeleteAsync(id, ct);
        return NoContent();
    }

    /// <summary>Salva (favorita) uma vaga.</summary>
    [HttpPost("{jobId:int}/save")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Save(int jobId, CancellationToken ct)
    {
        var created = await savedJobService.SaveAsync(jobId, ct);
        return created
            ? StatusCode(StatusCodes.Status201Created, ApiResponse.FromMessage("Vaga salva."))
            : OkMessage("Esta vaga já estava salva.");
    }

    /// <summary>Remove a vaga das salvas.</summary>
    [HttpDelete("{jobId:int}/save")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Unsave(int jobId, CancellationToken ct)
    {
        await savedJobService.RemoveAsync(jobId, ct);
        return NoContent();
    }
}
