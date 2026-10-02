using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeenWork.API.Common;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Jobs;
using TeenWork.Application.Students;
using TeenWork.Domain.Constants;

namespace TeenWork.API.Controllers;

/// <summary>Perfil do estudante, experiências e recomendações.</summary>
[Route("api/students")]
[Authorize]
public sealed class StudentsController(IStudentService studentService) : ApiControllerBase
{
    /// <summary>Perfil completo do estudante logado.</summary>
    [HttpGet("me")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<StudentProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe(CancellationToken ct) => OkData(await studentService.GetMyProfileAsync(ct));

    /// <summary>Perfil de um estudante (o próprio aluno ou empresas que receberam candidatura dele).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<StudentProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct) => OkData(await studentService.GetByIdAsync(id, ct));

    /// <summary>Atualiza o perfil do estudante logado.</summary>
    [HttpPut("profile")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<StudentProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateProfile(UpdateStudentProfileRequest request, CancellationToken ct) =>
        OkData(await studentService.UpdateProfileAsync(request, ct), "Perfil atualizado com sucesso.");

    /// <summary>Adiciona uma experiência ao perfil.</summary>
    [HttpPost("me/experiences")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<ExperienceDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddExperience(ExperienceRequest request, CancellationToken ct)
    {
        var experience = await studentService.AddExperienceAsync(request, ct);
        return CreatedData("/api/students/me", experience, "Experiência adicionada.");
    }

    /// <summary>Atualiza uma experiência do estudante logado.</summary>
    [HttpPut("me/experiences/{experienceId:int}")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<ExperienceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateExperience(int experienceId, ExperienceRequest request, CancellationToken ct) =>
        OkData(await studentService.UpdateExperienceAsync(experienceId, request, ct), "Experiência atualizada.");

    /// <summary>Remove uma experiência do estudante logado.</summary>
    [HttpDelete("me/experiences/{experienceId:int}")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteExperience(int experienceId, CancellationToken ct)
    {
        await studentService.DeleteExperienceAsync(experienceId, ct);
        return NoContent();
    }

    /// <summary>Vagas recomendadas com base na cidade, habilidades e curso do aluno.</summary>
    [HttpGet("me/recommended-jobs")]
    [Authorize(Roles = Roles.Student)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<JobSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRecommendedJobs([FromQuery] int limit = 6, CancellationToken ct = default) =>
        OkData(await studentService.GetRecommendedJobsAsync(limit, ct));
}
