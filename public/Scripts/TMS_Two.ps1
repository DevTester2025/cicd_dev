param(
    [Parameter(Mandatory)]
    [string]$DomainName,
 
    [Parameter(Mandatory)]
    [string]$DomainUser,

    [Parameter(Mandatory)]
    [string]$ArchiveServer

)
Function Log {
    param(
        [Parameter(Mandatory = $true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}
Log "2_install_dotnet ------------------------------------------------"
function  installDotNet {   
    Log "Started copying dotnet installer";
    Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False;
    $dotpath = Test-Path "\\$ArchiveServer\dotnetfile.exe";
    Log "Dotnet path is ";
    Log $dotpath;
    $StartTime = Get-Date
    While (!(Test-Path "\\$ArchiveServer\dotnetfile.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 30) { Start-Sleep -S 120; };
    Copy-Item -Path "\\$ArchiveServer\dotnetfile.exe" -Destination "C:\dotnetfile.exe";
    echo $ArchiveServer;
    icacls 'C:\\' /grant Users:F;

    $uname = $DomainName + '\' + $DomainUser;
    If ((Test-Path "W:\")) { 
        icacls "W:\" /grant $uname":(OI)(CI)F" /T;
    }

    C:\dotnetfile.exe /q;
    Log "Started .net installer in background.";
    Write-Host "Completed";    
}
installDotNet;