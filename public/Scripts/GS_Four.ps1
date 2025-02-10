param(
    [Parameter(Mandatory)]
    [string]$ArchiveServer,
 
    [Parameter(Mandatory)]
    [string]$ContainerFolder

)

Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "2_util_install ------------------------------------------------";
set-executionpolicy bypass;
Log $env:USERNAME
Log $env:USERDNSDOMAIN
Log $env:USERDOMAIN
Log $env:USERDOMAIN_ROAMINGPROFILE
Log $env:USERPROFILE
Log $env:HOMEPATH
Log $env:COMPUTERNAME
Write-Host "Completed";

Copy-Item -Path "\\$ArchiveServer\$ContainerFolder\otp_win64_20.3.exe" -Destination "C:\" -Recurse | Wait-Job;
Copy-Item -Path "\\$ArchiveServer\$ContainerFolder\rabbitmq-server-3.7.18.exe" -Destination "C:\" -Recurse | Wait-Job;
Copy-Item -Path "\\$ArchiveServer\$ContainerFolder\SDL_Trados_GroupShare_2020_Service_Release_1.exe" -Destination "C:\" -Recurse | Wait-Job;
Copy-Item -Path "\\$ArchiveServer\$ContainerFolder\GroupsharePrereqW2016.ps1" -Destination "C:\" -Recurse | Wait-Job;

C:\otp_win64_20.3.exe /S | Write-Output;

C:\GroupsharePrereqW2016.ps1;

Start-Sleep -Seconds 30;
Write-Host "Completed";

C:\rabbitmq-server-3.7.18.exe /S | Write-Output;
Write-Host "Completed";

$ENV:Path += ";C:\Program Files\RabbitMQ Server\rabbitmq_server-3.7.18\sbin";
powershell.exe rabbitmq-plugins enable rabbitmq_management;

C:\SDL_Trados_GroupShare_2020_Service_Release_1.exe /S;
# $user = [System.Security.Principal.NTAccount]::new('SDLPRODUCTS','cmnambi')
# $sid = $user.Translate([System.Security.Principal.SecurityIdentifier]).Value
# echo $sid
# Set-ItemProperty -Path "Registry::HKEY_USERS\$sid\Environment" -Name "Name2" -Value "Value3"
Write-Host "Completed";