param(
    [Parameter(Mandatory)]
    [string]$DomainName,
 
    [Parameter(Mandatory)]
    [string]$DomainUser,

    [Parameter(Mandatory)]
    [String]$DomainPassword

)

$i = 0
$aone = $DomainName
$atwo = $DomainUser
$athree = $DomainPassword


Function Log {
    param(
        [Parameter(Mandatory = $true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "1_pre_install --------------------------------------------"

function StartScript {
    Log $DomainName;
    Log $DomainUser;
    Log $DomainPassword;
    If ((Test-Path "S:\")) { 
        Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name="S:\pagefile.sys";InitialSize=$RamSize * 1000 * 1.5;Maximumsize=$RamSize * 1000 * 1.5;}
        $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
        $pagefile[0].delete();
    }
    $DCDomainName = $aone;
    $DCUserName = "$DCDomainName\" + $atwo ;
    $DCPasswd = $athree | ConvertTo-SecureString -asPlainText -Force;

    $credential = New-Object System.Management.Automation.PSCredential($DCUserName,$DCPasswd);
    # Add-Computer -DomainName $DCDomainName -Credential $credential;
    Add-Computer -DomainName $DCDomainName -Credential $credential -OUPath "OU=CloudMatiq Servers,DC=sdlproducts,DC=com" -Force;
    start-Sleep -s 30;

    $command = 'net localgroup administrators ' + $DCUserName + ' /add';
    start-process powershell -verb runas -argument $command;
    echo $command;
    Log "Local group added"
    start-Sleep -s 10;

    Import-Module ServerManager;
    pkgmgr /iu:"TelnetClient";
    DISM /Online /Enable-Feature /FeatureName:NetFx3 /All;
    Install-WindowsFeature -Name Web-Server -IncludeAllSubFeature -IncludeManagementTools;
    Dism /online /enable-feature /FeatureName:NetFx4 /All;
    Dism /online /quiet /enable-feature /FeatureName:WCF-HTTP-Activation /FeatureName:WCF-Services45 /FeatureName:WCF-HTTP-Activation45 /FeatureName:WCF-Pipe-Activation45 /FeatureName:WCF-TCP-Activation45 /all;
    while(!(Get-WindowsFeature web-server).installed){
    cmd.exe /c "C:\Windows\system32\DISM.exe /online /norestart /quiet /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ApplicationDevelopment /featureName:NetFx4Extended-ASPNET45 /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all";      
    start-Sleep -s 240;
    }

    while(!(Get-WindowsFeature Net-Framework-Core).installed){
    Install-WindowsFeature Net-Framework-Core;
    Dism /online /enable-feature /FeatureName:NetFx4 /All;
    Enable-WindowsOptionalFeature -Online -FeatureName "WCF-Services45";
    start-Sleep -s 60;
    }
    while(!(Get-WindowsFeature net-wcf-http-Activation45).installed){
    Install-WindowsFeature net-wcf-http-Activation45 -Verbose;  
    start-Sleep -s 60;
    }
    while(!(Get-WindowsFeature net-wcf-pipe-Activation45).installed){
    Install-WindowsFeature net-wcf-pipe-Activation45 -Verbose;  
    start-Sleep -s 60;
    }
    while(!(Get-WindowsFeature net-wcf-tcp-Activation45).installed){
    Install-WindowsFeature net-wcf-tcp-Activation45 -Verbose;  
    start-Sleep -s 60;
    }
    while(!(Get-WindowsFeature Telnet-Client).installed){
    Install-WindowsFeature Telnet-Client -Verbose;  
    start-Sleep -s 60;
    }
Write-Host "Completed";
Restart-Computer -Force;
}

Do {
    ++$i;
    $connection = ((Test-NetConnection www.google.com -Port 80).TcpTestSucceeded);
    write-host "$connection";
    if (((Test-NetConnection www.google.com -Port 80).TcpTestSucceeded) -eq $true) {
        StartScript
        break    
    }
    Log "Trying $($i) Internet connection not available. "
    netsh interface ipv4 show interfaces | Out-File C:\\log.txt -Append
    Start-Sleep -s 15;
    
} While ($true)