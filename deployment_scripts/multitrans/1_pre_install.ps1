$i = 0
$aone = $Args[0]
$atwo = $Args[1]
$athree = $Args[2]


Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "1_pre_install --------------------------------------------"

function StartScript{
    
    Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name="S:\pagefile.sys";InitialSize=$RamSize * 1000 * 1.5;Maximumsize=$RamSize * 1000 * 1.5;}
    $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
    $pagefile[0].delete();
    $DCDomainName = $aone;#"csdmdev.online";
    $DCUserName = "$DCDomainName\" + $atwo ;
    $DCPasswd = $athree | ConvertTo-SecureString -asPlainText -Force;
    $credential = New-Object System.Management.Automation.PSCredential($DCUserName,$DCPasswd);
    Add-Computer -DomainName $DCDomainName -Credential $credential;
    # cmd.exe /c "C:\Windows\system32\DISM.exe /online /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all"
    
start-Sleep -s 60;
    $command = 'net localgroup administrators ' + $DCUserName + ' /add';
    echo $command;
    Log "Local group added"
    start-process powershell -verb runas -argument $command;
    cmd.exe /c "C:\Windows\system32\DISM.exe /online /norestart /quiet /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ApplicationDevelopment /featureName:NetFx4Extended-ASPNET45 /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all";
    Restart-Computer -Force
}

Do
{
    ++$i;
    $connection = ((Test-NetConnection www.google.com -Port 80).TcpTestSucceeded);
    write-host "$connection";
    if(((Test-NetConnection www.google.com -Port 80).TcpTestSucceeded) -eq $true) {
        StartScript
        break    
    }
    Log "Trying $($i) Internet connection not available. "
    netsh interface ipv4 show interfaces | Out-File C:\\log.txt -Append
    Start-Sleep -s 5;
    
} While ($true)