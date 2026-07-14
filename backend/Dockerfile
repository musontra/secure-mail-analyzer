# Aşama 1: SDK imajıyla restore + publish (derleme araçları sadece burada)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Önce sadece csproj kopyalanır: bağımlılıklar değişmedikçe
# restore katmanı cache'ten gelir, build hızlanır
COPY SecureMailAnalyzer.Api/SecureMailAnalyzer.Api.csproj SecureMailAnalyzer.Api/
RUN dotnet restore SecureMailAnalyzer.Api/SecureMailAnalyzer.Api.csproj

COPY SecureMailAnalyzer.Api/ SecureMailAnalyzer.Api/
RUN dotnet publish SecureMailAnalyzer.Api/SecureMailAnalyzer.Api.csproj -c Release -o /app/publish

# Aşama 2: sadece runtime imajı + publish çıktısı (SDK imaja girmez)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Container içinde 8080 dinlenir; connection string, GEMINI_API_KEY ve
# JWT_SECRET ortam değişkenlerinden gelir (compose'da tanımlı)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SecureMailAnalyzer.Api.dll"]
