Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}
#icacls 'C:\\' /grant Users:F; icacls 'W:\\' /grant Users:F;
Start-Sleep -Seconds 60

#Start-Process '\\ECLUS1FS3\CloudMatiq\GroupShare\SDL_Trados_GroupShare_2020_Service_Release_1.exe' '/S' -Wait:$false -PassThru;
$StartTime = Get-Date
While (!(Test-Path "C:\SDL_Trados_GroupShare_2020_Service_Release_1.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
C:\SDL_Trados_GroupShare_2020_Service_Release_1.exe /S


Log "Extract SDL_Trados_GroupShare_2020_Service_Release_1 ------------------------------------------------";
