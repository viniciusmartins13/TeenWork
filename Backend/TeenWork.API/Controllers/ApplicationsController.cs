using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.JobApplications;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Candidaturas: aluno se candidata/cancela; empresa analisa e altera o status.</summary>
[Route("api/applications")]
[Authorize]
public sealed class ApplicationsController(IJobApplicationService applicationService) : ApiControllerBase
{
    /// <summary>Candidata o estudante logado à vaga.</summary>
    [HttpPost("/api/jobs/{jobId:int}/apply")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<MyApplicationDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Apply(int jobId, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] ApplyRequest? request, CancellationToken ct)
    {
        var application = await applicationService.ApplyAsync(jobId, request ?? new ApplyRequest(), ct);
        return CreatedData($"/api/applications/{application.Id}", application, "Candidatura enviada! Boa sorte 🍀");
    }

    /// <summary>Candidaturas do estudante logado.</summary>
    [HttpGet("my")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MyApplicationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine([FromQuery] MyApplicationsQuery query, CancellationToken ct) =>
        OkData(await applicationService.GetMyApplicationsAsync(query, ct));

    /// <summary>Candidaturas de uma vaga da empresa logada.</summary>
    [HttpGet("/api/jobs/{jobId:int}/applications")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ReceivedApplicationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetForJob(int jobId, [FromQuery] ReceivedApplicationsQuery query, CancellationToken ct) =>
        OkData(await applicationService.GetForJobAsync(jobId, query, ct));

    /// <summary>Todas as candidaturas recebidas pela empresa logada (filtros: jobId, status, search).</summary>
    [HttpGet("received")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ReceivedApplicationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReceived([FromQuery] ReceivedApplicationsQuery query, CancellationToken ct) =>
        OkData(await applicationService.GetReceivedAsync(query, ct));

    /// <summary>Detalhe de uma candidatura (aluno dono ou empresa dona da vaga).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => OkData(await applicationService.GetByIdAsync(id, ct));

    /// <summary>Altera o status da candidatura (Pending, UnderReview, Accepted, Rejected).</summary>
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = Roles.Company)]
    [ProducesResponseType(typeof(ApiResponse<ApplicationDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateStatus(int id, UpdateApplicationStatusRequest request, CancellationToken ct) =>
        OkData(await applicationService.UpdateStatusAsync(id, request, ct), "Status da candidatura atualizado.");

    /// <summary>Cancela a candidatura do estudante logado.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Cancel(int id, CancellationToken ct)
    {
        await applicationService.CancelAsync(id, ct);
        return NoContent();
    }
}
