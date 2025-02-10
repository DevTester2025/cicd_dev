Invoke-WebRequest -Uri "https://www.7-zip.org/a/7z1900-x64.exe" -OutFile c:\7zip.exe

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v7.8/npp.7.8.Installer.exe" -OutFile c:\npp.exe;

Start-Sleep -s 5

Start-Process -FilePath C:\7zip.exe -ArgumentList "/S";
Start-Process -FilePath C:\npp.exe -ArgumentList "/S";

Start-Sleep -s 5
Copy-Item -Path "\\sdlproducts.com\dfs\SOFTWARE\Wazuh\wazuh-agent-3.9.1-1.msi" -Destination c:\Wasuh.msi;
msiexec.exe /i c:\Wasuh.msi /quiet

Start-Sleep -s 5
Copy-Item -Path "\\sdlproducts.com\dfs\SOFTWARE\SEPM_Client\Packages\CPT Team\My Company_Infrastructure_WIN64BIT\Symantec Endpoint Protection version 14.2.4815.1101 - English\setup.exe" -Destination c:\endpointProtection.exe;
$exearg = {C:\endpointProtection.exe /S /v/qn };
Invoke-Command -ScriptBlock $exearg;

Function RunWindowsUpdates {   
    Write-Output "Starting Windows update process."

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    $updateLogFile = "c:\Program Files\Cloudbase Solutions\Cloudbase-Init\log\winUpdates.log"
    Write-Output "Install Nuget package manager update"
    Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force | Out-File -FilePath $updateLogFile
    
    Write-Output "Install module PSWindowsUpdate"
    Install-Module PSWindowsUpdate -Force | Out-File -FilePath $updateLogFile
    
    Write-Output "Install updates"
    Get-WUInstall -AcceptAll -IgnoreReboot -IgnoreUserInput -Install -Verbose -MicrosoftUpdate | Out-File -FilePath $updateLogFile
    
    Write-Output "Waiting for update task to complete."
    Start-Sleep -Seconds 30

    While (Get-WUInstallerStatus | Where-Object {$_.IsBusy -eq $true})
    {
        Write-Output "Task still running. Waiting 30 seconds..."
        Start-Sleep -Seconds 30
    }

    Write-Output "windows update task completed."
    if(Get-WURebootStatus -Silent)
    {
        Write-Output "Reboot Required, after installing updates"
        Restart-Computer -Force
        exit 1003
        break
    }
}


#install updates
RunWindowsUpdates