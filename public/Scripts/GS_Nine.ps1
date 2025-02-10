Function RunWindowsUpdates
{   
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
        exit 1003
        break
    }
}

Write-Host "Completed";
#install updates
RunWindowsUpdates