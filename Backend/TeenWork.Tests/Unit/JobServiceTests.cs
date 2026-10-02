using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.Jobs;
using TeenWork.Domain.Enums;
using TeenWork.Tests.Support;

namespace TeenWork.Tests.Unit;

public sealed class JobServiceTests : IDisposable
{
    private readonly TestEnvironment _env = new();

    [Fact]
    public async Task Company_CreatesJob_AppearsInSearchAsActive()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();

        Assert.Equal(JobStatus.Active, job.Status);
        Assert.True(job.IsOwner);
        Assert.True(job.IsOpenForApplications);

        _env.CurrentUser.SignOut();
        var search = await _env.Jobs.SearchAsync(new JobQuery());
        Assert.Contains(search.Items, j => j.Id == job.Id);
    }

    [Fact]
    public async Task Student_CannotCreateJob()
    {
        var student = await _env.RegisterStudentAsync();
        _env.SignInAs(student);

        await Assert.ThrowsAsync<ForbiddenException>(() => _env.Jobs.CreateAsync(TestEnvironment.SampleJob()));
    }

    [Fact]
    public async Task Company_CannotEditJobFromAnotherCompany()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync("dona@teste.com");
        var other = await _env.RegisterCompanyAsync("outra@teste.com", "Outra Empresa");
        _env.SignInAs(other);

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _env.Jobs.UpdateAsync(job.Id, TestEnvironment.SampleJob("Título alterado indevidamente")));
        await Assert.ThrowsAsync<ForbiddenException>(() => _env.Jobs.DeleteAsync(job.Id));
    }

    [Fact]
    public async Task InactiveJob_IsHiddenFromSearch()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();
        await _env.Jobs.UpdateStatusAsync(job.Id, new UpdateJobStatusRequest { Status = JobStatus.Inactive });

        _env.CurrentUser.SignOut();
        var search = await _env.Jobs.SearchAsync(new JobQuery());
        Assert.DoesNotContain(search.Items, j => j.Id == job.Id);
    }

    [Fact]
    public async Task JobWithApplications_CannotBeDeleted()
    {
        var (company, job) = await _env.CreateCompanyWithJobAsync();
        var student = await _env.RegisterStudentAsync();
        await _env.ApplyAsStudentAsync(student, job.Id);

        _env.SignInAs(company);
        await Assert.ThrowsAsync<ConflictException>(() => _env.Jobs.DeleteAsync(job.Id));
    }

    [Fact]
    public async Task Search_FiltersByWorkModelAndPaginates()
    {
        var company = await _env.RegisterCompanyAsync();
        _env.SignInAs(company);
        for (var i = 0; i < 3; i++)
        {
            await _env.Jobs.CreateAsync(TestEnvironment.SampleJob($"Vaga híbrida número {i}"));
        }

        var remote = TestEnvironment.SampleJob("Vaga remota de suporte");
        remote.WorkModel = WorkModel.Remote;
        await _env.Jobs.CreateAsync(remote);

        _env.CurrentUser.SignOut();
        var page = await _env.Jobs.SearchAsync(new JobQuery { WorkModel = WorkModel.Hybrid, Page = 1, PageSize = 2 });

        Assert.Equal(3, page.TotalItems);
        Assert.Equal(2, page.Items.Count);
        Assert.Equal(2, page.TotalPages);
        Assert.All(page.Items, j => Assert.Equal(WorkModel.Hybrid, j.WorkModel));
    }

    public void Dispose() => _env.Dispose();
}
