Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "Fetch Password --------------------------------------------";

$StartTime = Get-Date
While (!(Test-Path "C:\encryptout.txt") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 

return Get-Item -Path C:\encryptout.txt | Get-Content -Tail 1;