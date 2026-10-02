namespace TeenWork.Application.Common;

/// <summary>Configuração "App" do appsettings.</summary>
public sealed class FrontendOptions
{
    public const string SectionName = "App";

    /// <summary>URL pública do frontend, usada em links enviados por e-mail.</summary>
    public string FrontendUrl { get; set; } = "http://localhost:5173";
}
