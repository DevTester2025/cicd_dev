Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}
#Set-ExecutionPolicy Unrestricted;
$sysname = $env:COMPUTERNAME;
$sysname = $sysname -replace "-";
$op =  "GROUPSHARE_" + ($sysname);
Start-Sleep -Seconds 120
set-executionpolicy bypass;
$ENV:Path += ";C:\Program Files\RabbitMQ Server\rabbitmq_server-3.7.18\sbin";
powershell.exe rabbitmq-plugins enable rabbitmq_management;
$dReplacements = @{
#"#{COMPUTERNAME}#"= $env:COMPUTERNAME -replace '-',''
"#{COMPUTERNAME}#"= $op
"#{DomainName}#"=([Environment]::UserDomainName)+".COM"
"#{DBSuffix}#"=""
"#{SQLInstance}#"="US1VSQLP0099"
"#{ServiceAccount}#"="cmnambi"
"#{ServiceAccountDomain}#"=([Environment]::UserDomainName)
"#{ServiceAccountPassword}#"="ZD3N0mrdA1WYyRENbwCs0A=="
"#{APPLICATIONSERVICEHOST}#"="localhost"
"#{ROLESTOINSTALL}#"="19"
"C:\\\\ProgramData" ="W:"
"C:\\\\Program Files \(x86\)" ="W:"
"clujservices01"="smtp.sdlproducts.com"
"integrated security=True"="integrated security=False;User ID = TMS_svcuser; Password = exkVSK6hW$"
" integrated security = True"="integrated security=False;User ID = TMS_svcuser; Password = exkVSK6hW$"
};
$StartTime = Get-Date
While (!(Test-Path "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\silent\answers.json") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
$inFile = "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\silent\answers.json"
$outFile = "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\answers.json"

$sRawJson = Get-Content -Path $inFile | Out-String

foreach($oEnum in $dReplacements.GetEnumerator()){
$sRawJson = $sRawJson -replace $oEnum.Key ,$oEnum.Value;
}

$sRawJson | Out-File -FilePath $outFile;
(Get-Content "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\answers.json") -replace(" = ","=")| Set-Content "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\answers.json";
$StartTime = Get-Date
While (!(Test-Path "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\EnterpriseEditionSetup.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
Log "Group share called ";
# start-sleep -s 60;
# if(!(get-process -name "EnterpriseEditionSetup")){
Import-Module WebAdministration;
Start-Process -FilePath "C:\ProgramData\Package Cache\SDL\SDLTradosGroupShare2020\EnterpriseEditionSetup.exe" -ArgumentList "-unattended";
$service = Get-Service -name "Sdl.Application";
echo $service;
while(!($service)){
    echo 1; start-sleep -s 10;$service = Get-Service -name "Sdl.Application";
}
Start-Service -DisplayName *SDL* -WhatIf;
start-sleep -s 120 ;
Start-Service -name "Sdl.Application";
$binding = Test-Path IIS:\AppPools\SdlServer;
while(!($binding)){Log "checking for app pool";Start-Sleep -s 10;$binding = Test-Path IIS:\AppPools\SdlServer;};
$userName = "SDLPRODUCTS\cmnambi";
Set-ItemProperty IIS:\AppPools\SDLTokenExchange -name processModel.identityType -Value SpecificUser ;
Set-ItemProperty IIS:\AppPools\SDLTokenExchange -name processModel.userName -Value $username;
Set-ItemProperty IIS:\AppPools\SDLTokenExchange -name processModel.password -Value $args[3];
Set-ItemProperty IIS:\AppPools\SdlServer -name processModel.identityType -Value SpecificUser ;
Set-ItemProperty IIS:\AppPools\SdlServer -name processModel.userName -Value $username;
Set-ItemProperty IIS:\AppPools\SdlServer -name processModel.password -Value $args[3];
start-sleep -s 30;
Start-WebAppPool -Name "SdlServer";
# }


 

