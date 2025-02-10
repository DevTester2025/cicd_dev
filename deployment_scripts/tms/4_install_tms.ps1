$DatabaseServer = $args[0];
$TMSDatabaseName = $args[1];
$ImplementationName = $args[2];
$InstallAccount = $args[3];
$ServiceAccountPassword = $args[4];
# $TMSVersion = $args[6];
# $ArchiverServer = "ECLUS1FS3\CloudMatiq";
$ArchiverServer = $args[5];
$TMSVersion = $args[6];
$TMSVersion = "12.6.29594.0";
$ArchiverServer = "ECLUS1FS3\CloudMatiq";
$dbusername = $args[7];
$dbpassword = $args[8];
$InstallAdditionalSoft = $args[9];

Function Log {
	param(
		[Parameter(Mandatory = $true)][String]$msg
	)
    
	Add-Content C:\\log.txt $msg
}

Log "4_install_tms ------------------------------------------------"

$i = 0;
function testVersion {
	$version = (Get-ItemProperty "HKLM:SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full").version;
	if ($version -like "*4.8*") {
		Log ".Net Framework Version 4.8";
		#Set Log File Name & Enable Verbose Logging
		$j = 0;
		function checkConnection {
			$connectionenabled = Test-Connection -ComputerName google.com -Quiet;
			if ($connectionenabled) {
				$VerboseLogging = $true;
				$Log = [string]("C:\Install-Log-" + (Get-Date).ToString('dd.MM.yy-HH.mm') + ".log")


				#Define The Logging & Output Function
				Function Output-Log($output, $type) {	
	
					# Output To Host If appropriate
					if ($type -eq "verbose" -and $verboseLogging) {
						Log $output;
					}
					elseif ($type -eq "error") {
						$output = "Error: $output";
						Log $output -backgroundColor black -foregroundcolor red
					}
					elseif ($type -eq "warning") {
						$output = "Warning: $output";
						Log $output -backgroundColor black -foregroundcolor yellow
					}
					elseif ($type -ne "verbose") {
						Log $output;
					}
	
					# Output to a log if appropriate
					if ($log) {
						# Add a timestamp
						$output = "[$((Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))] $output"
						if ($type -eq "verbose" -and $verboseLogging) {
							Add-Content $log $output;
						}
						elseif ($type -ne "verbose") {
							Add-Content $log $output;
						}
					}
				}

				#Connect To The SQL Database & Execute SQL Commands - Only here to allow SQL commands in the future if required - CB 16/04/2019
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

				### Step Into Code Here ###

				### Install IIS Pre-req
				$connectionenabled = Test-Connection -ComputerName google.com -Quiet;
				CLS
				Output-Log "Installing Windows pre-requisits";
				Output-Log "connection status  $connectionenabled";
				cmd.exe /c "C:\Windows\system32\DISM.exe /online /norestart /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all"




				$Confirm = $False
				While ($Confirm -eq $False) {

					#Gather Input From User
					CLS
					$DC = "ECLUS1DC3";
					$ArchiveServer = "ECLUS1FS3\CloudMatiq";


					Write-Host "TMS Auto-Deployment & Customiser `n================================ `n`n`tPlease Select a TMS Version to Install: `n`t======================================="
     
					Write-Host "`t=> 1: TMS 12.2.26690.10"
					Write-Host "`t=> 2: TMS 12.2.27115.17"
					Write-Host "`t=> 3: TMS 12.3.27270.4."
					Write-Host "`t=> 4: TMS 12.4.27340.1"
					Write-Host "`t=> 5: TMS 12.4.27340.2"
					Write-Host "`t=> 6: TMS 12.4.27602.3"
					Write-Host "`t=> 7: TMS 12.4.27630.4"
					Write-Host "`t=> 8: TMS 12.4.27708.5"
					Write-Host "`t=> 9: TMS 12.4.27809.6"
					Write-Host "`t=> 10: TMS 12.4.27809.7"
					Write-Host "`t=> 11: TMS 12.4.28001.8"
					Write-Host "`t=> 12: TMS 12.4.28066.9"
					Write-Host "`t=> 13: TMS 12.4.28130.10"
					Write-Host "`t=> 14: TMS 12.4.28199.11"
					Write-Host "`t=> 15: TMS 12.4.28310.12"
					Write-Host "`t=> 16: TMS 12.4.28348.13"
					Write-Host "`t=> 17: TMS 12.4.28506.14"
					Write-Host "`t=> 18: TMS 12.4.28605.16"

					$input = '12.6.29594.0';
					# $TMSVersion = $TMSVersion;
					switch ($input) {
						'12.6.29594.0' {
            
							$INSTALLCMD = "\\$ArchiverServer\SDLTMS$input.exe"
                
						} '12.2.27115.17' {
            
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\76 SDLTMS 12.2.27115.17\SDLTMS 12.2.27115.17.exe"
                
						} '12.3.27270.4' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\77 SDLTMS 12.3.27270.4\SDLTMS 12.3.27270.4.exe"

						} '12.4.27340.1' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\78 SDLTMS 12.4.27340.1\SDLTMS 12.4.27340.1.exe"

						} '12.4.27424.2' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\79 SDLTMS 12.4.27424.2\SDLTMS 12.4.27424.2.exe"

						} '12.4.27602.3' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\80 SDLTMS 12.4.27602.3\SDLTMS 12.4.27602.3.exe"

						} '12.4.27630.4' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\81 SDLTMS 12.4.27630.4\SDLTMS 12.4.27630.4.exe"

						} '12.4.27708.5' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\82 SDLTMS 12.4.27708.5\SDLTMS 12.4.27708.5.exe"

						} '12.4.27809.6' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\83 SDLTMS 12.4.27809.6\SDLTMS 12.4.27809.6.exe"

						} '12.4.27891.7' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\84 SDLTMS 12.4.27891.7\SDLTMS 12.4.27891.7.exe"

						} '12.4.28001.8' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\85 SDLTMS 12.4.28001.8\SDLTMS 12.4.28001.8.exe"

						} '12.4.28066.9' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\86 SDLTMS 12.4.28066.9\SDLTMS 12.4.28066.9.exe"

						} '12.4.28130.10' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\87 SDLTMS 12.4.28130.10\SDLTMS 12.4.28130.10.exe"

						} '12.4.28199.11' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\88 SDLTMS 12.4.28199.11\SDLTMS 12.4.28199.11.exe"

						} '12.4.28310.12' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\89 SDLTMS 12.4.28310.12\SDLTMS 12.4.28310.12.exe"

						} '12.4.28348.13' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\90 SDLTMS 12.4.28348.13\SDLTMS 12.4.28348.13.exe"

						} '12.4.28506.14' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\91 SDLTMS 12.4.28506.14\SDLTMS 12.4.28506.14.exe"

						} '12.4.28605.16' {
                
							$INSTALLCMD = "\\Sdlproducts\dfs\SOFTWARE\Applications\SDL International\SDLTMS\93 SDLTMS 12.4.28605.16\SDLTMS 12.4.28605.16.exe"

						}
						
					}	
	
					output-log "Install command is $INSTALLCMD";
					$ServiceAccount = ([Environment]::UserDomainName) + "\" + $InstallAccount
					$MigrationSysname = $ImplementationName + "PREMIGRATION"
					#	$ArchiveServer = (Read-Host "`n`t=> Archive Server")
	
	
					#Summarise The User's Input On Screen
					CLS
					Output-Log "The Settings For Your New TMS Implemenation Will Be As Follows: `n===============================================================" "Verbose"			
					Output-Log "`n`t=> TMS SQL Server          : $DatabaseServer" "Verbose"
					Output-Log "`t=> TMS Database Name       : $TMSDatabaseName" "Verbose"
	
					Output-Log "`n`t=> TMS Implementation Name : $ImplementationName" "Verbose"
					Output-Log "`t=> TMS Service Account     : $ServiceAccount" "Verbose"
					Output-Log "`t=> Archive Server          : $ArchiveServer" "Verbose"
					Output-Log "`t=> TMS Install Path        : $INSTALLCMD" "Verbose"
  
    	


					$ConfirmChoice = "Yes";
					If (($ConfirmChoice) -Eq "Yes") {
						$Confirm = $True
					}
					ElseIf (($ConfirmChoice) -Eq "Retry") {
						$Confirm = $False
					}
					Else {
						Write-Warning "Invalid Option Specified - Please Enter 'Yes' or 'Retry'"; $ConfirmChoice = (Read-Host "`n`n`t=> Are You Happy With The Above Settings? [Yes/Retry]")
						$Confirm = $False
					}
				}

				### Prep The TMS Server ###

				#Change Drive "D:" To Be Our W: Data Drive (If Required)
				# If ($DriveDObj = $(GWMI -Class Win32_Volume -Filter "DriveLetter = 'D:'")) {
	
				# 	Try {
				# 		Set-WMIInstance -Input $DriveDObj -Arguments @{DriveLetter = "W:" } | out-null;
				# 	}
				# 	Catch {
				# 		Output-Log $_.exception.message "Verbose"
				# 	}
				# }

				# Wait Until W: Is Accessible Before Proceeding
				$StartTime = Get-Date
				While (!(Test-Path "W:\") -And (New-TimeSpan $startTime (Get-Date)).TotalMinutes -lt 2) { Start-Sleep -s 2; }; Output-Log "=> Setting drive D: to Drive W: - Success!" "Verbose"

				### Create TMS folders on W drive

				Output-Log " Creating SDLTMS Specific Folders"
				cmd.exe /c "md W:\SDLTMS"
				cmd.exe /c "md W:\FTPSite"
				cmd.exe /c "md W:\SDLTMS\Application"
				cmd.exe /c "md W:\SDLTMS\Data"
				cmd.exe /c "md W:\SDLTMS\Data\Resources"
				cmd.exe /c "md W:\SDLTMS\Data\TC"
				cmd.exe /c "md W:\SDLTMS\Data\SW_SCRIPTS"
				cmd.exe /c "md W:\SDLTMS\Data\CVTUpload"
				cmd.exe /c "md W:\SDLTMS\Data\Transfer"
				cmd.exe /c "md W:\SDLTMS\Data\Logs"
				cmd.exe /c "md W:\SDLTMS\Data\ITDUpload"
				cmd.exe /c "md W:\SDLTMS\Data\Download\L10NComplete"
				cmd.exe /c "md W:\SDLTMS\Data\NewJobs"
				cmd.exe /c "md W:\SDLTMS\Data\TMExport"
				cmd.exe /c "md W:\SDLTMS\Website"


				#Share The 'Website', 'Data' & 'FTPSite' Folders If Not Already Shared
				If (!(Test-Path "\\$HostName\Data$")) { Output-Log "Creating '\\$HostName\Data$' Share" "Verbose"; $(CMD /c "NET SHARE Data$=W:\SDLTMS\Data /GRANT:Everyone,FULL") }
				If (!(Test-Path "\\$HostName\Website$")) { Output-Log "Creating '\\$HostName\Website$' Share" "Verbose"; $(CMD /c "NET SHARE Website$=W:\SDLTMS\Website /GRANT:Everyone,FULL") }
				If (!(Test-Path "\\$HostName\FTPSite$")) { Output-Log "Creating '\\$HostName\FTPSite$' Share" "Verbose"; $(CMD /c "NET SHARE FTPSite$=W:\FTPSite /GRANT:Everyone,FULL") }

				#Give The Service Account Full Control To The 'SDLTMS' & 'FTPSITE' Directories  In The Root Of W:
				$ApplyPermsStatus = [string]$(ICACLS "W:\SDLTMS" /Grant "$ServiceAccount`:(OI)(CI)F")
				Output-Log "Giving The Service Account Full Control To The 'SDLTMS' Folder - $ApplyPermsStatus" "Verbose"

				$ApplyPermsStatus = [string]$(ICACLS "W:\FTPSite" /Grant "$ServiceAccount`:(OI)(CI)F")
				Output-Log "Giving The Service Account Full Control To The 'FTPSITE' Folder - $ApplyPermsStatus" "Verbose"





				#Check That The Specified DFS Path Does Not Exist, Add The Archive Folder & DFS Target's If It Doesn't
				$CommandSuccessful = $False
				While (!$CommandSuccessful) {
					If (!(Test-Path "\\$ArchiveServer\$ImplementationName\") -And !(Test-Path "\\$ArchiveServer\$ImplementationName\")) {

						#Create Archive Directory On Archive Server & Check It's Accessible
						Output-Log "Creating '\\$ArchiveServer\$ImplementationName\' Archive Folder" "Verbose"; $ArchiveFolder = New-Item "\\$ArchiveServer\$ImplementationName\" -Type Directory
		
						$StartTime = Get-Date
					 While (!(Test-Path "\\$ArchiveServer\$ImplementationName\") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
						Output-Log "Testing If '\\$ArchiveServer\$ImplementationName\' Is A Valid Path - Success!" "Verbose"
				
						#Give The Service Account Full Control To The Newly Created Archive Folder
						$ApplyPermsStatus = [string]$(ICACLS "\\$ArchiveServer\$ImplementationName\" /Grant "$ServiceAccount`:(OI)(CI)F")
						Output-Log "Giving The Service Account Full Control To The Newly Created Archive Folder - $ApplyPermsStatus" "Verbose"
		
		
						Output-Log "Adding DFS Targets For $ImplementationName `n==========================================" "Verbose"
						#Connect To A Domain Controller & Create DFS Folder Targets
						# $DFSCMDOutput = Invoke-Command -ComputerName $DC -ScriptBlock {
						# 	# $ArchiveServer = $Args[0]
						# 	$HostName = $TMSDatabaseName
			
						# 	##Note: Because We Are In A Remote Session, All Logs Will Be Returned & Outputted At The End Of The Session As '$DFSCMDOutput'
						# 	$CommandStatus = [string]$(DFSCMD /ADD "\\$ArchiveServer\$ImplementationName\ARCHIVE" "\\$ArchiveServer\$ImplementationName\")
						# 	$DFSCMDOutput = "'\\$ArchiveServer\$ImplementationName\ARCHIVE' => '\\$ArchiveServer\$ImplementationName\' - $CommandStatus"
						
						# 	$CommandStatus = [string]$(DFSCMD /ADD "\\$ArchiveServer\$ImplementationName\DATA" "\\$HostName\Data$")
						# 	$DFSCMDOutput = $DFSCMDOutput + "`n'\\$ArchiveServer\$ImplementationName\DATA' => '\\$HostName\Data$' - $CommandStatus"
						
						# 	$CommandStatus = [string]$(DFSCMD /ADD "\\$ArchiveServer\$ImplementationName\WEBSITE" "\\$HostName\Website$")
						# 	$DFSCMDOutput = $DFSCMDOutput + "`n'\\$ArchiveServer\$ImplementationName\WEBSITE' => '\\$HostName\Website$' - $CommandStatus"
						
						# 	$CommandStatus = [string]$(DFSCMD /ADD "\\$ArchiveServer\$ImplementationName\FTPSITE" "\\$HostName\FTPSite$")
						# 	$DFSCMDOutput = $DFSCMDOutput + "`n'\\$ArchiveServer\$ImplementationName\FTPSITE' => '\\$HostName\FTPSite$' - $CommandStatus"	
				
						# 	Return ([string]$DFSCMDOutput) 
						# } -Args @($ArchiveServer, $ImplementationName, $HostName)
		
						#Add Contents Of The Returned Variable To The Log
						Output-Log "$DFSCMDOutput" "Verbose"

						#Verify That DFS Path's Are Now Valid & Accessible
						$StartTime = Get-Date
					 While (!(Test-Path "\\$ArchiveServer\$ImplementationName\ARCHIVE") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
						Output-Log "Testing If '\\$ArchiveServer\$ImplementationName\ARCHIVE' Is A Valid Path - Success!" "Verbose"

						$StartTime = Get-Date 
					 While (!(Test-Path "\\$ArchiveServer\$ImplementationName\DATA") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
						Output-Log "Testing If '\\$ArchiveServer\$ImplementationName\DATA' Is A Valid Path - Success!" "Verbose"

						$StartTime = Get-Date 
					 While (!(Test-Path "\\$ArchiveServer\$ImplementationName\WEBSITE") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
						Output-Log "Testing If '\\$ArchiveServer\$ImplementationName\WEBSITE' Is A Valid Path - Success!" "Verbose"
		 
						$StartTime = Get-Date  
					 While (!(Test-Path "\\$ArchiveServer\$ImplementationName\FTPSITE") -And (New-TimeSpan $StartTime (Get-Date)).TotalMinutes -Lt 2) { Start-Sleep -S 2; }; 
						Output-Log "Testing If '\\$ArchiveServer\$ImplementationName\FTPSITE' Is A Valid Path - Success!" "Verbose"
			 
						$CommandSuccessful = $True
					}
					Else {
						Output-Log "A DFS Folder And/Or Archive Folder Under The Name $ImplementationName Already Exists!" "Warning"
						$ImplementationName = (Read-Host "`n`t=> Please Enter A New Name For The Implementation (The DFS & Archive Paths Will Reflect This)").ToUpper()
					}
				}
				### End Of The Prep TMS Server Section ###

				### Install TMS*
				$getdisks = Get-Disk;
				Output-Log "Installing TMS - Please Wait";
				Output-Log "$getdisks";

				$tmsUserDomain = ([Environment]::UserDomainName);
				$tmsUserName = $InstallAccount;
				$tmsUserPass = $ServiceAccountPassword;
				$tmsCustomisationsName = $TMSDatabaseName;
				$TMSDatabaseName = $tmsCustomisationsName + "_db";
				$ImplementationName = $tmsCustomisationsName;
				$MigrationSysname = $ImplementationName;
				Copy-Item -Path "\\$ArchiverServer\$TMSVersion" -Destination "c:\" -Recurse;
				Start-Sleep -Seconds 120;
				$StartTime = Get-Date;
				$exePath = "C:\$TMSVersion\SDLTMS$TMSVersion.exe";
				$arglist = "/s /nr /domain:$tmsUserDomain /usr:$tmsUserName /pwd:$tmsUserPass /env:$tmsCustomisationsName /dbserver:$DatabaseServer /dbuser:$dbusername /dbpass:$dbpassword /dbname:$TMSDatabaseName /systemname:$MigrationSysname /installpath:W:\SDLTMS /webpath:W:\SDLTMS\Website /datapath:\\$ArchiveServer\$ImplementationName\Data";

				$connectionenabled = Test-Connection -ComputerName google.com -Quiet;
				Log "$exePath $arglist"
				Output-Log "$exePath $arglist";
				Output-Log "connection status  $connectionenabled";
				$pinfo = New-Object System.Diagnostics.ProcessStartInfo;
				$pinfo.FileName = $exePath;
				$pinfo.RedirectStandardError = $false;
				$pinfo.RedirectStandardOutput = $false;
				$pinfo.UseShellExecute = $false;
				$pinfo.Arguments = $arglist;
				$pinfo.CreateNoWindow = $false;
				$pinfo.Verb = "RunAs";
				$p = New-Object System.Diagnostics.Process;
				$p.StartInfo = $pinfo;
				$p.Start() | Out-Null;
				Output-Log "stdout: $stdout";
				Output-Log "stderr: $stderr";
				$p.WaitForExit();
				$installCount = 1;
				while ($installCount -le 5) {
					Start-Sleep -Seconds 120;
					$request = [System.Net.WebRequest]::Create('https://localhost');
					$response = $request.getResponse()
					if ($response.StatusCode -eq "200") {
						$installCount = 6;
					}
					else {
						Start-Process -Wait -FilePath $exePath -ArgumentList $arglist;
					}
				}
				if ($InstallAdditionalSoft -like "true") {
					cd W: ;
					msiexec.exe /q /i "C:\$TMSVersion\Sdl.ContentCollector.msi" INSTALLLOCATION=W:\SDLTMS\ContentCollector;
					msiexec.exe /q /i "C:\$TMSVersion\Sdl.Nexus.msi" INSTALLLOCATION=W:\SDLTMS\Nexus;
					msiexec.exe /q /i "C:\$TMSVersion\Sdl.Sjp.msi" INSTALLLOCATION=W:\SDLTMS\Sjp;
					cd C: ;
				}
				sc.exe config "Nexus" obj="$tmsUserDomain\$tmsUserName" Password="$tmsUserPass"
				$changedUserName = $dbusername -replace "\$";
				$changedPassword = $dbpassword -replace "\$";
				(Get-Content W:\SDLTMS\Website\connectionStrings.config) -replace '\$' | Set-Content W:\SDLTMS\Website\connectionStrings.config;
				(Get-Content W:\SDLTMS\Website\connectionStrings.config) -replace "User ID=$changedUserName;" | Set-Content W:\SDLTMS\Website\connectionStrings.config;
				(Get-Content W:\SDLTMS\Website\connectionStrings.config) -replace "Password=$changedPassword" | Set-Content W:\SDLTMS\Website\connectionStrings.config;
				(Get-Content W:\SDLTMS\Website\connectionStrings.config) -replace "Integrated Security=False;","Integrated Security=True;" | Set-Content W:\SDLTMS\Website\connectionStrings.config;
				
				#change database owner to SA
				# $SQLReturnCode = (ExecuteSQLCommand -SQLServer $DatabaseServer -SQLCommand "
				# ALTER AUTHORIZATION ON DATABASE::$TMSDatabaseName TO sa
				# ").SQLReturnCode;

				# If ($SQLReturnCode -eq 0) {
				# 	Log "`t Failed to update database owner. Please Contact the DBA team" -ForegroundColor Red -BackgroundColor Yellow
				# 	Add-Content $Log "[$((Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))] Failed to update database owner. Please Contact the DBA team"
				# }
				# Else {
				# 	Log "`tDatabase Owner updated successfully" -ForegroundColor Green
				# 	Add-Content $Log "[$((Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))] Database Owner updated successfully"
				# 	Exit
				# }

				#Load IIS PS Module, Then Bind The SDLTMS Website To The Local SSL Certificate To Make It Accessible
				
				Import-Module WebAdministration -ErrorAction SilentlyContinue
				New-WebBinding -Name "SDLTMS" -IP "*" -Port 443 -Protocol https
				Get-ChildItem Cert:\LocalMachine\Root | Where { $_.Subject -like "*WIN*" } | Select -First 1 | New-Item IIS:\SslBindings\0.0.0.0!443
				# Redirect HTTP to HTTPS
				Run Check on DB for Broker Service

				Output-Log "Checking Broker Service is enabled on the Database"
				$SQLReturnCode = (ExecuteSQLCommand -SQLServer $DatabaseServer -SQLCommand "
				Select sys.databases.name, is_broker_enabled from sys.databases  
				where name Like '$TMSDatabaseName'").SQLReturnCode

				If ($SQLReturnCode -eq 0) {
					Log "`tBroker Service NOT Enabled. Please Contact the DBA team" -ForegroundColor Red -BackgroundColor Yellow
					Add-Content $Log "[$((Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))] Broker Service NOT Enabled. Please Contact the DBA team"
				}
				Else {
					Log "`tBroker Service Enabled" -ForegroundColor Green
					Add-Content $Log "[$((Get-Date).ToString('dd/MM/yyyy HH:mm:ss'))] Broker Service Enabled"
					Exit
				}
				$host.SetShouldExit($p.ExitCode);
				Remove-Item –path C:/1_pre_install.ps1 –recurse -ErrorAction Ignore;
				Remove-Item –path C:/2_install_dotnet.ps1 –recurse -ErrorAction Ignore;
				Remove-Item –path C:/3_check_dotnet_version.ps1 –recurse -ErrorAction Ignore;
				Remove-Item –path C:/5_verify_installations.ps1 –recurse -ErrorAction Ignore;
				Remove-Item –path C:/dotnetfile.exe –recurse -ErrorAction Ignore;
				Remove-Item –path "C:/$TMSVersion" –recurse -ErrorAction Ignore;
				Remove-Item –path "C:/$log" –recurse -ErrorAction Ignore;
				Remove-Item –path "C:/log.txt" –recurse -ErrorAction Ignore;
				Remove-Item –path C:/4_install_tms.ps1 –recurse -ErrorAction Ignore;

				Output-Log "TMS Install Complete"
			}
			else {
				if ($j -le 14) {
					Log('Waiting ' + $i + ' time');
					Start-Sleep -s 30;
					$i = $i + 1;
					checkConnection;
				}
				else {
					Log "Failed";
				}
			}
		}
		checkConnection;
	}
	else {
		if ($i -le 14) {
			Log('Waiting ' + $i + ' time');
			Start-Sleep -s 30;
			$i = $i + 1;
			testVersion;
		}
		else {
			Log "Failed";
		}
	}
}

testVersion;
