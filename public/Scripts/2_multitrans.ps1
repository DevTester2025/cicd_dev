param(
[parameter(Mandatory)]
[string]$ArchiverServer,
[parameter(Mandatory)]
[string]$MultiTransVersion,
[parameter(Mandatory)]
[string]$DatabaseServer,
[parameter(Mandatory)]
[string]$DatabasePort,
[parameter(Mandatory)]
[string]$DbUser,
[parameter(Mandatory)]
[string]$DbPassword,
[parameter(Mandatory)]
[string]$FlowDbName,
[parameter(Mandatory)]
[string]$ReportDbName,
[parameter(Mandatory)]
[string]$MTDbName,
[parameter(Mandatory)]
[string]$AuditDbName
)
Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Function ExecuteSQLCommand() {
	Param(
		$SQLServer = $(Throw "-SQLServer is mandatory for the ExecuteSQLCommand Function!"),
		$SQLCommand = $(Throw "-SQLCommand is mandatory for the ExecuteSQLCommand Function!"),
		$DBUsername = $(Throw "-DBUsername is mandatory for the ExecuteSQLCommand Function!"),
		$DBPassword = $(Throw "-DBPassword is mandatory for the ExecuteSQLCommand Function!")
	)
	#Create The SQL Client Connection
	$SQLConnection = New-Object System.Data.SqlClient.SqlConnection
	$SQLConnection.ConnectionString = "Server=$SQLServer;Integrated Security=False;User ID = $DBUsername; Password = $DBPassword;"

	#Create & Define The SQL Client Command Object
	$SQLCmd = New-Object System.Data.SqlClient.SqlCommand
	$SQLCmd.CommandTimeout = 3600
	$SQLCmd.CommandText = $SQLCOmmand
	$SQLCmd.Connection = $SQLConnection
	
	#Create SQL Data Adaptor & Data Set Object To Return The Recordset To
	$SQLAdapter = New-Object System.Data.SqlClient.SqlDataAdapter
	$SQLAdapter.SelectCommand = $SQLCmd
	$ResultSet = New-Object System.Data.DataSet
	$ReturnCode = $SQLAdapter.Fill($ResultSet)
    
	#Close Off SQL Client Connection
	$SQLConnection.Close()
	
	#Return a Hash Table Containing SQL Server Return Code & Results of The Query (If Any)
	Return @{
		"SQLReturnCode" = $ReturnCode
	}
}

###Copy Exe files from archieve server
function StartInstallation{
write-host "Completed"

Log $ArchiverServer;
Log $MultiTransVersion;
Log $DatabaseServer;
Log $DatabasePort;
Log $DbUser;
Log $DbPassword;
Log $FlowDbName;
Log $ReportDbName;
Log $MTDbName;
Log $AuditDbName;
$ArchiverServer = "ECLUS1FS3\CloudMatiq";
$MultiTransVersion = "Multitrans";
Invoke-WebRequest -Uri "https://www.7-zip.org/a/7z1900-x64.exe" -OutFile c:\7zip.exe;
Start-Process -FilePath C:\7zip.exe -ArgumentList "/S";
Copy-Item -Path "\\eclus1fs3\cloudmatiq\Multitrans" -Recurse -Destination "W:\";
ExecuteSQLCommand -SQLServer $DatabaseServer -DBUsername $DbUser -DBPassword $DbPassword -SQLCommand "Create database $FlowDbName";
ExecuteSQLCommand -SQLServer $DatabaseServer -DBUsername $DbUser -DBPassword $DbPassword -SQLCommand "Create database $MTDbName";
ExecuteSQLCommand -SQLServer $DatabaseServer -DBUsername $DbUser -DBPassword $DbPassword -SQLCommand "Create database $ReportDbName";
ExecuteSQLCommand -SQLServer $DatabaseServer -DBUsername $DbUser -DBPassword $DbPassword -SQLCommand "Create database $AuditDbName";
cd W:\Multitrans;
$ENV:Path += ";C:\Program Files\7-Zip";
7z x W:\Multitrans\MultiTransServer_7.0.20283.3.exe -oW:\Multitrans\MultiTransServer_7.0.20283.3 -y;
7z x W:\Multitrans\FlowServer_7.0.20283.3.exe -oW:\Multitrans\FlowServer_7.0.20283.3 -y;
Write-Host "Installation of pre-requistes Completed";
Start-Sleep -s 120;

###Starting MultiTrans Installation

Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\AspNetMVC3\aspnetmvc3setup.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\vcredist110_x64\vcredist_x64_update4.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\vcredist110_x86\vcredist_x86.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\vcredist140_x64\vcredist_x64.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\vcredist140_x86\vcredist_x86.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\DotNetFX461\NDP461-KB3102436-x86-x64-AllOS-ENU.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\AspNetMVC3\aspnetmvc3setup.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\FlowServer_7.0.20283.3\DotNetFX461\NDP461-KB3102436-x86-x64-AllOS-ENU.exe" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\FlowServer_7.0.20283.3\IISURLRewrite2_32\rewrite_x86_en-US.msi" -ArgumentList "/q";
Start-Process -Wait -FilePath "W:\$MultiTransVersion\FlowServer_7.0.20283.3\IISURLRewrite2_64\rewrite_amd64_en-US.msi" -ArgumentList "/q";

Start-Sleep -s 60;

Log "MultiTrans pre-requisites completed, MT started";
Write-Host "MultiTrans pre-requisites completed,";

msiexec /i "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\MultiTransServer.msi" MULTICORPORA_DIR="W:\ProgramFiles(x86)\Donnelley\" MULTICORPORA64_DIR="W:\ProgramFiles\Donnelley\" WEBSITE=1 /qn /L*V "W:\MultiTransServerInstall.log" /norestart;

Log "MT Installation completed";
Write-Host "MT Installation completed";

Start-Sleep -s 360;
msiexec /i "W:\$MultiTransVersion\FlowServer_7.0.20283.3\FlowServer_7.0.20283.3.msi" MULTICORPORA_DIR="W:\ProgramFiles(x86)\Donnelley\" MULTICORPORA64_DIR="W:\ProgramFiles\Donnelley\" FLOW_DATABASE_SERVER="$DatabaseServer" FLOW_DATABASE_SERVER_PORT=$DatabasePort FLOW_DATABASE_NAME=$FlowDbName FLOW_DATABASE_USERNAME=$DbUser FLOW_DATABASE_PASSWORD=$DbPassword FLOW_REPORTS_DATABASE_SERVER=$DatabaseServer FLOW_REPORTS_DATABASE_SERVER_PORT=$DatabasePort FLOW_REPORTS_DATABASE_NAME=$ReportDbName FLOW_REPORTS_DATABASE_USERNAME=$DbUser FLOW_REPORTS_DATABASE_PASSWORD=$DbPassword /qn /L*V "W:\FlowServerInstall.log";

Log "Flow Installation completed";
Write-Host "Flow Installation completed";

Start-Sleep -s 360;
$StartTime = Get-Date ;
While (!(Test-Path "W:\ProgramFiles(x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Tools\Database Initializer\DbInit2.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 15) { Start-Sleep -S 30; }; 

Log "MT DB inialization completed";
Write-Host "MT DB inialization completed";

& 'W:\ProgramFiles(x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Tools\Database Initializer\DbInit2.exe' --connectionstring="Data Source=$DatabaseServer;Persist Security Info=True;Integrated Security=False;Initial Catalog=$MTDbName;User ID = $DbUser; Password = $DbPassword;" --username="$DbUser" --password="$DbPassword";

Start-Sleep -s 180;
$StartTime = Get-Date ;
While (!(Test-Path "W:\ProgramFiles(x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Services\Directory\AuditDbInit.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 15) { Start-Sleep -S 2; }; 	

Log "Audit DB completed";
Write-Host "Audit DB completed";

& 'W:\ProgramFiles(x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Services\Directory\AuditDbInit.exe' --connectionstring="Data Source=$DatabaseServer;Persist Security Info=True;Integrated Security=False;Initial Catalog=$AuditDbName;User ID = $DbUser; Password = $DbPassword;" --username="$DbUser" --password="$DbPassword";

Rename-Item -Path "W:\ProgramFiles(x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Web Services\Web.config" -NewName "Http-Web.config";
Rename-Item -Path "W:\ProgramFiles(x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Web Services\Https-Web.config" -NewName "Web.config";

$ENV:Path += ";W:\ProgramFiles\Donnelley\MultiTrans 6.0\License Server";
powershell -c "mcsvractutil -served -activationID 607c-6791-6879-fb05-156c-77 -count 1 -internet";

Restart-Service -name *MultiTrans*;
Restart-service -name "TextBaseUpdateService";
Restart-service -name "MultiCorporaFlowServer64";
Restart-service -name "MCDirectoryService";
Write-Host "Completed";
}

Do {
    ++$i;
    $connection = ((Test-NetConnection www.google.com -Port 80).TcpTestSucceeded);
    write-host "$connection";
    if (((Test-NetConnection www.google.com -Port 80).TcpTestSucceeded) -eq $true) {
        StartInstallation
        break    
    }
    Log "Trying $($i) Internet connection not available. "
    netsh interface ipv4 show interfaces | Out-File C:\\log.txt -Append
    Start-Sleep -s 30;
    
} While ($true)