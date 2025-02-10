#cmd.exe C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\Configurator.exe encrypt soundarc
#Start-Sleep -Seconds 140

Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "Password encryption start--------------------------------------------";

$StartTime = Get-Date
While (!(Test-Path "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\Configurator.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
$command =  'cmd.exe /c "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\Configurator.exe" encrypt Csdm@Nov2020'
Invoke-Expression -Command:$command | Tee-Object -FilePath C:\encryptout.txt;

#Get-Item -Path C:\encryptout.txt | Get-Content -Tail 1

Log "Password encryption end--------------------------------------------";

#SDL Groupshare Configuration Utility 15.1.0.0
#Copyright (C) 2019 SDL
#Running as: SDLPRODUCTS\cmnambi
#2hVrYO1G8HDSvMCHb2pyiw==