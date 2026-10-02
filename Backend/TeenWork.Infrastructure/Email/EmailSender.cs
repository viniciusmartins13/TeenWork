using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TeenWork.Application.Common.Interfaces;

namespace TeenWork.Infrastructure.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUser { get; set; }
    public string? SmtpPassword { get; set; }
    public bool EnableSsl { get; set; } = true;
    public string FromAddress { get; set; } = "nao-responda@teenwork.dev";
    public string FromName { get; set; } = "TeenWork";
}

/// <summary>
/// Envia e-mails por SMTP quando configurado. Sem SMTP (ambiente de desenvolvimento),
/// o conteúdo é registrado no log da API para que o fluxo possa ser testado.
/// </summary>
public sealed class EmailSender(IOptions<EmailOptions> options, ILogger<EmailSender> logger) : IEmailSender
{
    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;

        if (string.IsNullOrWhiteSpace(settings.SmtpHost))
        {
            logger.LogWarning(
                "SMTP não configurado — e-mail NÃO enviado. Para: {To} | Assunto: {Subject}{NewLine}{Body}",
                to, subject, Environment.NewLine, htmlBody);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(settings.FromAddress, settings.FromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(to);

        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
        {
            EnableSsl = settings.EnableSsl,
            Credentials = string.IsNullOrWhiteSpace(settings.SmtpUser)
                ? null
                : new NetworkCredential(settings.SmtpUser, settings.SmtpPassword)
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception ex) when (ex is SmtpException or InvalidOperationException)
        {
            // O fluxo de "esqueci minha senha" não deve revelar falhas de infraestrutura ao usuário.
            logger.LogError(ex, "Falha ao enviar e-mail para {To}", to);
        }
    }
}
