using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Jobs;
using TeenWork.Application.SavedJobs;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Vagas salvas (favoritas) do estudante.</summary>
[Route("api/saved-jobs")]
[Authorize(Roles = Roles.Student)]
public sealed class SavedJobsController(ISavedJobService savedJobService) : ApiControllerBase
{
    /// <summary>Lista as vagas salvas do estudante logado.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<JobSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine([FromQuery] SavedJobsQuery query, CancellationToken ct) =>
        OkData(await savedJobService.GetMySavedJobsAsync(query, ct));
}
