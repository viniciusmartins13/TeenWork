using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TeenWork.Application.Admin;
using TeenWork.Application.Auth;
using TeenWork.Application.Companies;
using TeenWork.Application.Dashboard;
using TeenWork.Application.JobApplications;
using TeenWork.Application.Jobs;
using TeenWork.Application.Media;
using TeenWork.Application.Notifications;
using TeenWork.Application.SavedJobs;
using TeenWork.Application.Students;

namespace TeenWork.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Exibe apenas o primeiro erro de cada campo (mensagens mais claras no frontend).
        ValidatorOptions.Global.DefaultRuleLevelCascadeMode = CascadeMode.Stop;
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddSingleton(TimeProvider.System);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IStudentService, StudentService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IJobService, JobService>();
        services.AddScoped<IJobApplicationService, JobApplicationService>();
        services.AddScoped<ISavedJobService, SavedJobService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IMediaService, MediaService>();

        return services;
    }
}
