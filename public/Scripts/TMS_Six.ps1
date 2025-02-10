Import-Module WebAdministration;
$cert = Get-ChildItem -Path Cert:\LocalMachine\My |  Select-Object -ExpandProperty Thumbprint;
echo $cert;
if($cert){
    get-item -Path "cert:\localmachine\my\$cert" | new-item -path IIS:\SslBindings\0.0.0.0!443 -Force;
}else{
    $newCertificate = New-SelfSignedCertificate -DnsName "TMS" -CertStoreLocation "cert:\LocalMachine\My";
    $binding = Get-WebBinding -name "SDLTMS" -Protocol "https";
    $binding.AddSslCertificate($newCertificate.GetCertHashString() , "my");
}

				
$binding = Get-WebBinding -name "SDLTMS" -Protocol "http";
while(!($binding)){Start-sleep -s 30;$binding = Get-WebBinding -name "SDLTMS" -Protocol "http";};
##### 
# Install URL Rewrite 
#
write-host Downloading WebPlatform Installer
$source = "http://download.microsoft.com/download/F/4/2/F42AB12D-C935-4E65-9D98-4E56F9ACBC8E/wpilauncher.exe"
$destination = "$env:temp\wpilauncher.exe"
$wc = New-Object System.Net.WebClient
$wc.DownloadFile($source, $destination)
mkdir c:/msi;
Invoke-WebRequest "http://download.microsoft.com/download/C/F/F/CFF3A0B8-99D4-41A2-AE1A-496C08BEB904/WebPlatformInstaller_amd64_en-US.msi" -OutFile c:/msi/WebPlatformInstaller_amd64_en-US.msi;
Start-Process "c:/msi/WebPlatformInstaller_amd64_en-US.msi" "/qn" -PassThru | Wait-Process;
cd "C:/Program Files/Microsoft/Web Platform Installer"; .\WebpiCmd.exe /Install /Products:"UrlRewrite2,ARRv3_0" /AcceptEULA /Log:c:/msi/WebpiCmd.log;

####Start WEB Platform Installer
Start-Process -FilePath $destination 

# Wait for Installation to Complete 
Start-Sleep -Seconds 30

# Web Platform Installer CommandLine Tool 
$WebPiCMd = 'C:\Program Files\Microsoft\Web Platform Installer\WebpiCmd-x64.exe'
Start-Process -wait -FilePath $WebPiCMd -ArgumentList "/install /Products:UrlRewrite2 /AcceptEula /OptInMU /SuppressPostFinish" 

# Add Management Tools 
Add-WindowsFeature Web-Server -IncludeManagementTools
import-module webAdministration

# Create URL Rewrite Rules
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webserver/rewrite/GlobalRules" -name "." -value @{name='HTTP to HTTPS Redirect'; patternSyntax='ECMAScript'; stopProcessing='True'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webserver/rewrite/GlobalRules/rule[@name='HTTP to HTTPS Redirect']/match" -name url -value "(.*)"
Add-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webserver/rewrite/GlobalRules/rule[@name='HTTP to HTTPS Redirect']/conditions" -name "." -value @{input="{HTTPS}"; pattern='^OFF$'}
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/rewrite/globalRules/rule[@name='HTTP to HTTPS Redirect']/action" -name "type" -value "Redirect"
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/rewrite/globalRules/rule[@name='HTTP to HTTPS Redirect']/action" -name "url" -value "https://{HTTP_HOST}/{R:1}"
Set-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/rewrite/globalRules/rule[@name='HTTP to HTTPS Redirect']/action" -name "redirectType" -value "SeeOther" 
write-host "Completed";