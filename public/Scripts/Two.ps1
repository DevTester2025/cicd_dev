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