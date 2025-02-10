Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}
Start-Service -DisplayName *SDL* -WhatIf;
Import-Module WebAdministration;
$binding = Test-Path IIS:\AppPools\SdlServer;
while(!($binding)){Log "checking for app pool";Start-Sleep -s 10};
$userName = $args[0]+ '\' + $args[1];
Set-ItemProperty IIS:\AppPools\SDLTokenExchange -name processModel.identityType -Value SpecificUser ;
Set-ItemProperty IIS:\AppPools\SDLTokenExchange -name processModel.userName -Value $username;
Set-ItemProperty IIS:\AppPools\SDLTokenExchange -name processModel.password -Value $args[3];
Set-ItemProperty IIS:\AppPools\SdlServer -name processModel.identityType -Value SpecificUser ;
Set-ItemProperty IIS:\AppPools\SdlServer -name processModel.userName -Value $username;
Set-ItemProperty IIS:\AppPools\SdlServer -name processModel.password -Value $args[3];
start-sleep -s 30;
Start-WebAppPool -Name "SdlServer";
New-WebBinding -name "SDL Server" -Protocol https -Port 443;
$cert = Get-ChildItem -Path Cert:\LocalMachine\My |  Select-Object -ExpandProperty Thumbprint;
echo $cert;
get-item -Path "cert:\localmachine\my\$cert" | new-item -path IIS:\SslBindings\0.0.0.0!443 -Force;
if((Test-Path "S:\")){
    Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name="S:\pagefile.sys";InitialSize=$RamSize * 1000 * 1.5;Maximumsize=$RamSize * 1000 * 1.5;}
    $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
    $pagefile[0].delete();
}