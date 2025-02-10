param(
	[Parameter(Mandatory)]
	[string]$InstanceRef,

	[Parameter(Mandatory)]
	[string]$Tenant,

	[Parameter(Mandatory)]
	[string]$Database,

	[Parameter(Mandatory)]
	[string]$ScriptURL
)

mkdir C:\scripts;
Invoke-WebRequest -Uri "$ScriptURL/deployment_scripts/asstutl/metrics.ps1" -OutFile "C:\scripts\metrics.ps1";
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date -Format HHtt) -RepetitionInterval (New-TimeSpan -Minutes 1);
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "C:\scripts\metrics.ps1 -InstanceRefID $InstanceRef -TenantID $Tenant -DatabaseURL $Database" ;
Register-ScheduledTask -TaskName "Monitor Utilization" -Trigger $Trigger -Action $Action -RunLevel Highest –Force;

