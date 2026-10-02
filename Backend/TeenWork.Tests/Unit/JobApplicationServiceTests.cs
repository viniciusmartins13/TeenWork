using Microsoft.EntityFrameworkCore;
using TeenWork.Application.Common.Exceptions;
using TeenWork.Application.JobApplications;
using TeenWork.Application.Jobs;
using TeenWork.Domain.Enums;
using TeenWork.Tests.Support;

namespace TeenWork.Tests.Unit;

public sealed class JobApplicationServiceTests : IDisposable
{
    private readonly TestEnvironment _env = new();

    [Fact]
    public async Task Student_AppliesToOpenJob_CreatesPendingApplicationAndNotifiesCompany()
    {
        var (company, job) = await _env.CreateCompanyWithJobAsync();
        var student = await _env.RegisterStudentAsync();

        var application = await _env.ApplyAsStudentAsync(student, job.Id, "Tenho muito interesse!");

        Assert.Equal(ApplicationStatus.Pending, application.Status);
        Assert.Equal(job.Id, application.JobId);
        Assert.True(application.CanCancel);
        Assert.True(await _env.Db.Notifications.AnyAsync(n =>
            n.UserId == company.User.Id && n.Type == NotificationType.ApplicationReceived));
    }

    [Fact]
    public async Task Student_CannotApplyTwiceToSameJob()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();
        var student = await _env.RegisterStudentAsync();
        await _env.ApplyAsStudentAsync(student, job.Id);

        await Assert.ThrowsAsync<ConflictException>(() => _env.ApplyAsStudentAsync(student, job.Id));
        Assert.Equal(1, await _env.Db.Applications.CountAsync());
    }

    [Fact]
    public async Task Student_CannotApplyToClosedJob()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();
        await _env.Jobs.UpdateStatusAsync(job.Id, new UpdateJobStatusRequest { Status = JobStatus.Closed });
        var student = await _env.RegisterStudentAsync();

        await Assert.ThrowsAsync<BusinessRuleException>(() => _env.ApplyAsStudentAsync(student, job.Id));
    }

    [Fact]
    public async Task Company_CannotApplyToJob()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();

        await Assert.ThrowsAsync<ForbiddenException>(() => _env.Applications.ApplyAsync(job.Id, new ApplyRequest()));
    }

    [Fact]
    public async Task Company_UpdatesStatus_StudentIsNotified()
    {
        var (company, job) = await _env.CreateCompanyWithJobAsync();
        var student = await _env.RegisterStudentAsync();
        var application = await _env.ApplyAsStudentAsync(student, job.Id);

        _env.SignInAs(company);
        var updated = await _env.Applications.UpdateStatusAsync(application.Id,
            new UpdateApplicationStatusRequest { Status = ApplicationStatus.Accepted, Feedback = "Parabéns!" });

        Assert.Equal(ApplicationStatus.Accepted, updated.Status);
        Assert.Equal("Parabéns!", updated.CompanyFeedback);
        Assert.True(await _env.Db.Notifications.AnyAsync(n =>
            n.UserId == student.User.Id && n.Type == NotificationType.ApplicationStatusChanged));
    }

    [Fact]
    public async Task OtherCompany_CannotChangeApplicationStatus()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync("dona@teste.com");
        var student = await _env.RegisterStudentAsync();
        var application = await _env.ApplyAsStudentAsync(student, job.Id);

        var intruder = await _env.RegisterCompanyAsync("intrusa@teste.com", "Empresa Intrusa");
        _env.SignInAs(intruder);

        await Assert.ThrowsAsync<ForbiddenException>(() => _env.Applications.UpdateStatusAsync(application.Id,
            new UpdateApplicationStatusRequest { Status = ApplicationStatus.Rejected }));
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _env.Applications.GetForJobAsync(job.Id, new ReceivedApplicationsQuery()));
    }

    [Fact]
    public async Task Student_SeesOnlyOwnApplications_AndCanCancel()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();
        var ana = await _env.RegisterStudentAsync("ana@teste.com", "Ana Teste");
        var bia = await _env.RegisterStudentAsync("bia@teste.com", "Bia Teste");
        var anaApplication = await _env.ApplyAsStudentAsync(ana, job.Id);
        await _env.ApplyAsStudentAsync(bia, job.Id);

        _env.SignInAs(ana);
        var mine = await _env.Applications.GetMyApplicationsAsync(new MyApplicationsQuery());
        Assert.Single(mine.Items);

        _env.SignInAs(bia);
        await Assert.ThrowsAsync<ForbiddenException>(() => _env.Applications.CancelAsync(anaApplication.Id));

        _env.SignInAs(ana);
        await _env.Applications.CancelAsync(anaApplication.Id);
        var cancelled = await _env.Db.Applications.SingleAsync(a => a.Id == anaApplication.Id);
        Assert.Equal(ApplicationStatus.Cancelled, cancelled.Status);
    }

    [Fact]
    public async Task Student_CanReapplyAfterCancelling()
    {
        var (_, job) = await _env.CreateCompanyWithJobAsync();
        var student = await _env.RegisterStudentAsync();
        var first = await _env.ApplyAsStudentAsync(student, job.Id);
        await _env.Applications.CancelAsync(first.Id);

        var second = await _env.ApplyAsStudentAsync(student, job.Id);

        Assert.Equal(first.Id, second.Id);
        Assert.Equal(ApplicationStatus.Pending, second.Status);
    }

    [Fact]
    public async Task CancelledApplication_CannotBeChangedByCompany()
    {
        var (company, job) = await _env.CreateCompanyWithJobAsync();
        var student = await _env.RegisterStudentAsync();
        var application = await _env.ApplyAsStudentAsync(student, job.Id);
        await _env.Applications.CancelAsync(application.Id);

        _env.SignInAs(company);
        await Assert.ThrowsAsync<BusinessRuleException>(() => _env.Applications.UpdateStatusAsync(application.Id,
            new UpdateApplicationStatusRequest { Status = ApplicationStatus.Accepted }));
    }

    public void Dispose() => _env.Dispose();
}
