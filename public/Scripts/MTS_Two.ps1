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
		$SQLCommand = $(Throw "-SQLCommand is mandatory for the ExecuteSQLCommand Function!")
	)
	#Create The SQL Client Connection
	$SQLConnection = New-Object System.Data.SqlClient.SqlConnection
	$SQLConnection.ConnectionString = "Server=$SQLServer;Integrated Security=SSPI"

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

ExecuteSQLCommand -SQLServer $DatabaseServer -SQLCommand "Create database $FlowDbName";
ExecuteSQLCommand -SQLServer $DatabaseServer -SQLCommand "Create database $MTDbName";
ExecuteSQLCommand -SQLServer $DatabaseServer -SQLCommand "Create database $ReportDbName";
ExecuteSQLCommand -SQLServer $DatabaseServer -SQLCommand "Create database $AuditDbName";

Copy-Item -Path "\\$ArchiverServer\$MultiTransVersion\FlowServer_7.0.20283.3.zip" -Destination "W:\$MultiTransVersion\" -Recurse;
Copy-Item -Path "\\$ArchiverServer\$MultiTransVersion\MultiTransServer_7.0.20283.3.zip" -Destination "W:\$MultiTransVersion\" -Recurse;
Expand-Archive -LiteralPath "W:\$MultiTransVersion\FlowServer_7.0.20283.3.zip" -DestinationPath "W:\$MultiTransVersion";
Expand-Archive -LiteralPath "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3.zip" -DestinationPath "W:\$MultiTransVersion";


Log "Execution Started";

Install-WindowsFeature Net-Framework-Core;
Dism /online /enable-feature /FeatureName:NetFx4 /All;
Enable-WindowsOptionalFeature -Online -FeatureName "WCF-Services45";
Install-WindowsFeature net-wcf-http-Activation45 -Verbose;
Install-WindowsFeature net-wcf-pipe-Activation45 -Verbose;
Install-WindowsFeature net-wcf-tcp-Activation45 -Verbose;
Install-WindowsFeature Telnet-Client -Verbose;

Log "Installation of pre-requistes Completed";
Write-Host "Installation of pre-requistes Completed";

cmd.exe /c "C:\Windows\system32\DISM.exe /online /norestart /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all";

mkdir "W:\$MultiTransVersion\";
Log "IIS installation Completed";
write-host "IIS installation Completed";
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
Start-Sleep -s 120;

Log "MultiTrans pre-requisites completed, MT started";
Write-Host "MultiTrans pre-requisites completed,";

msiexec /i "W:\$MultiTransVersion\MultiTransServer_7.0.20283.3\MultiTransServer.msi" WEBSITE=1 /qn /L*V "W:\MultiTransServerInstall.log" /norestart;

Log "MT Installation completed";
Write-Host "MT Installation completed";

Start-Sleep -s 600;
msiexec /i "W:\$MultiTransVersion\FlowServer_7.0.20283.3\FlowServer_7.0.20283.3.msi" FLOW_DATABASE_SERVER="$DatabaseServer" FLOW_DATABASE_SERVER_PORT=$DatabasePort FLOW_DATABASE_NAME=$FlowDbName FLOW_DATABASE_USERNAME=$DbUser FLOW_DATABASE_PASSWORD=$DbPassword FLOW_REPORTS_DATABASE_SERVER=$DatabaseServer FLOW_REPORTS_DATABASE_SERVER_PORT=$DatabasePort FLOW_REPORTS_DATABASE_NAME=$ReportDbName FLOW_REPORTS_DATABASE_USERNAME=$DbUser FLOW_REPORTS_DATABASE_PASSWORD=$DbPassword /qn /L*V "W:\FlowServerInstall.log";

Log "Flow Installation completed";
Write-Host "Flow Installation completed";

Start-Sleep -s 600;
$StartTime = Get-Date ;
While (!(Test-Path "C:\Program Files (x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Tools\Database Initializer\DbInit2.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 15) { Start-Sleep -S 30; }; 

Log "MT DB inialization completed";
Write-Host "MT DB inialization completed";

& 'C:\Program Files (x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Tools\Database Initializer\DbInit2.exe' --connectionstring="Data Source=$DatabaseServer;Persist Security Info=True;Integrated Security=SSPI;Initial Catalog=$MTDbName" --username="$DbUser" --password="$DbPassword";

Start-Sleep -s 300;
$StartTime = Get-Date ;
While (!(Test-Path "C:\Program Files (x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Services\Directory\AuditDbInit.exe") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 15) { Start-Sleep -S 2; }; 	

Log "Audit DB completed";
Write-Host "Audit DB completed";

& 'C:\Program Files (x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Services\Directory\AuditDbInit.exe' --connectionstring="Data Source=$DatabaseServer;Persist Security Info=True;Integrated Security=SSPI;Initial Catalog=$AuditDbName" --username="$DbUser" --password="$DbPassword";

Rename-Item -Path "C:\Program Files (x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Web Services\Https-Web.config" -NewName "Web.config";
Rename-Item -Path "C:\Program Files (x86)\Donnelley\MultiTrans 6.0\MultiTrans Server\Web Services\Web.config" -NewName "Http-Web.config";

$ENV:Path += ";C:\Program Files\Donnelley\MultiTrans 6.0\License Server";
powershell -c "mcsvractutil -served -activationID 601c-6791-6879-fb05-156c-77 -count 1 -internet";

Restart-Service -name *MultiTrans*;
Restart-service -name "TextBaseUpdateService";
Restart-service -name "MultiCorporaFlowServer64";
Restart-service -name "MCDirectoryService";

}StartInstallation