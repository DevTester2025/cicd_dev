try {
    # $version = (Get-Item (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe').'(Default)').VersionInfo
    Write-Host "Completed";
}
catch {
    Write-Host "Failed";
}