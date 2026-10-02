namespace TeenWork.Domain.Enums;

public enum JobStatus
{
    /// <summary>Publicada e recebendo candidaturas.</summary>
    Active = 1,
    /// <summary>Pausada pela empresa; não aparece na busca.</summary>
    Inactive = 2,
    /// <summary>Processo seletivo encerrado.</summary>
    Closed = 3
}
