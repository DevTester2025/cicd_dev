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
    Log "Script execution started"
    Log "First Arg $($aone)"
    Log "Second Arg $($atwo)"
    Log "Third Arg $($athree)"
    Write-Output "First Arg $($aone)"
    Write-Output "Second Arg $($atwo)"
    Write-Output "Third Arg $($athree)"
    $DCDomainName = $aone;#"csdmdev.online";
    $DCUserName = "$DCDomainName\" + $atwo ;
    $DCPasswd = $athree | ConvertTo-SecureString -asPlainText -Force;
    $credential = New-Object System.Management.Automation.PSCredential($DCUserName,$DCPasswd);
    Add-Computer -DomainName $DCDomainName -Credential $credential;

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