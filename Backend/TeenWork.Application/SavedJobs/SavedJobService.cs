using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Common.Interfaces;
using TeenWork.Application.Common.Models;
using TeenWork.Application.Common.Validation;
using TeenWork.Application.Jobs;
using TeenWork.Domain.Entities;

namespace TeenWork.Application.SavedJobs;

public sealed class SavedJobsQuery : PaginationQuery;

public sealed class SavedJobsQueryValidator : PaginationQueryValidator<SavedJobsQuery>;

public interface ISavedJobService
{
    Task<PagedResult<JobSummaryDto>> GetMySavedJobsAsync(SavedJobsQuery query, CancellationToken ct = default);
    /// <summary>Retorna true quando a vaga foi salva agora; false quando já estava salva.</summary>
    Task<bool> SaveAsync(int jobId, CancellationToken ct = default);
    Task RemoveAsync(int jobId, CancellationToken ct = default);
}

public sealed class SavedJobService(IAppDbContext db, ICurrentUser currentUser) : ISavedJobService
{
    public async Task<PagedResult<JobSummaryDto>> GetMySavedJobsAsync(SavedJobsQuery query, CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(currentUser.GetRequiredUserId(), ct);

        // Ordena pelas vagas salvas mais recentemente; inclui vagas encerradas para o aluno ver o que mudou.
        var jobs = db.SavedJobs
            .AsNoTracking()
            .Where(s => s.StudentId == studentId)
            .OrderByDescending(s => s.CreatedAt)
            .ThenByDescending(s => s.Id)
            .Select(s => s.Job);

        return await JobService.ProjectSummary(jobs, studentId).ToPagedResultAsync(query, ct);
    }

    public async Task<bool> SaveAsync(int jobId, CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(currentUser.GetRequiredUserId(), ct);

        if (!await db.Jobs.AnyAsync(j => j.Id == jobId, ct))
        {
            throw new NotFoundException("Vaga não encontrada.");
        }

        if (await db.SavedJobs.AnyAsync(s => s.JobId == jobId && s.StudentId == studentId, ct))
        {
            return false;
        }

        db.SavedJobs.Add(new SavedJob { JobId = jobId, StudentId = studentId });
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task RemoveAsync(int jobId, CancellationToken ct = default)
    {
        var studentId = await db.GetStudentIdAsync(currentUser.GetRequiredUserId(), ct);
        var saved = await db.SavedJobs.FirstOrDefaultAsync(s => s.JobId == jobId && s.StudentId == studentId, ct)
            ?? throw new NotFoundException("Esta vaga não está na sua lista de salvas.");

        db.SavedJobs.Remove(saved);
        await db.SaveChangesAsync(ct);
    }
}
