param(
     [Parameter(Mandatory)]
     [string]$DomainName,
 
     [Parameter(Mandatory)]
     [string]$DomainUser,

     [Parameter(Mandatory)]
     [string]$DomainPassword

     [Parameter(Mandatory)]
     [String]$OUPath
 
 )

$i = 0


Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "1_pre_install --------------------------------------------"

function StartScript{
    Log "Script execution started"
    Log "First Arg $($DomainName)"
    Log "Second Arg $($DomainUser)"
    Log "Third Arg $($DomainPassword)"
    Write-Output "First Arg $($DomainName)"
    Write-Output "Second Arg $($DomainUser)"
    Write-Output "Third Arg $($DomainPassword)"
    $DCDomainName = $DomainName;#"csdmdev.online";
    $DCUserName = "$DCDomainName\" + $DomainUser ;
    $DCPasswd = $DomainPassword | ConvertTo-SecureString -asPlainText -Force;
    $credential = New-Object System.Management.Automation.PSCredential($DCUserName,$DCPasswd);
    Add-Computer -DomainName $DCDomainName -Credential $credential -OUPath $OUPath -Force;

    $acl = Get-Acl HKLM:\SOFTWARE;
    $rule = New-Object System.Security.AccessControl.RegistryAccessRule ($DCUserName,"FullControl",@("ObjectInherit","ContainerInherit"),"None","Allow");
    $acl.SetAccessRule($rule);
    $acl |Set-Acl -Path HKLM:\SOFTWARE;

    # cmd.exe /c "C:\Windows\system32\DISM.exe /online /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all"
    cmd.exe /c "C:\Windows\system32\DISM.exe /online /norestart /quiet /enable-feature /featureName:IIS-WebServerRole /featureName:IIS-WebServer /featureName:IIS-CommonHttpFeatures /featureName:IIS-Security /featureName:IIS-RequestFiltering /featureName:IIS-StaticContent /featureName:IIS-DefaultDocument /featureName:IIS-HttpErrors /featureName:IIS-NetFxExtensibility45 /featureName:IIS-ISAPIExtensions /featureName:IIS-ISAPIFilter /featureName:IIS-ApplicationDevelopment /featureName:NetFx4Extended-ASPNET45 /featureName:IIS-ASPNET45 /featureName:IIS-ASP /featureName:IIS-HealthAndDiagnostics /featureName:IIS-HttpLogging /featureName:IIS-RequestMonitor /featureName:IIS-IPSecurity /featureName:IIS-Performance /featureName:IIS-HttpCompressionStatic /featureName:IIS-HttpCompressionDynamic /featureName:IIS-WebServerManagementTools /featureName:IIS-ManagementConsole /featureName:IIS-ManagementScriptingTools /all"
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