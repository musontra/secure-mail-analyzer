namespace SecureMailAnalyzer.Api.Models;

// POST /api/analyses isteğinin gövdesi (kullanıcıdan alınan alanlar)
public record CreateAnalysisRequest(string? InputType, string? InputContent);
