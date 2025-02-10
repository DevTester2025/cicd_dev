param(
[parameter(Mandatory)]
[string]$MTWebsite,
[parameter(Mandatory)]
[string]$FlowWebsite
)
function bindsites(){
$Flowbinding = Get-WebBinding -name "Flow Web Site";
$IsFlowAvailable = "false";
if(($Flowbinding)){$IsFlowAvailable ="true"};
echo $IsFlowAvailable;
while(($IsFlowAvailable -like "false")){echo "Not found";Start-Sleep -s 100;$Flowbinding = Get-WebBinding -name "Flow Web Site";
$IsFlowAvailable = "false";
if(($Flowbinding)){$IsFlowAvailable ="true"};}
Remove-WebBinding -Name "Flow Web Site" -Protocol http -BindingInformation "*:80:";
New-WebBinding -Name "Flow Web Site" -IP "*" -Port 443 -Protocol https -HostHeader $FlowWebsite;
New-WebBinding -Name "Flow Web Site" -IP "*" -Port 80 -Protocol http -HostHeader $FlowWebsite;
New-WebBinding -Name "Default Web Site" -IP "*" -Port 80 -Protocol https -HostHeader $MTWebsite;
New-WebBinding -Name "Default Web Site" -IP "*" -Port 443 -Protocol http -HostHeader $MTWebsite;
$newCertificate = New-SelfSignedCertificate -DnsName "TMS" -CertStoreLocation "cert:\LocalMachine\My";
$binding = Get-WebBinding -name "Flow Web Site" -Protocol "https";
$binding.AddSslCertificate($newCertificate.GetCertHashString() , "my");
start-Website "Flow Web Site";
start-Website "Default Web Site";
$privateIP =  Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress} | select -expand IPaddress | where {$_ -like "10.*"};
Add-Content C:\Windows\System32\drivers\etc\hosts "";
Add-Content C:\Windows\System32\drivers\etc\hosts "$privateIP        $MTWebsite";
Add-Content C:\Windows\System32\drivers\etc\hosts "$privateIP        $FlowWebsite";

(Get-Content "W:\Multitrans\secsys.xml" -Raw).Replace("replaceme",$MTWebsite.ToLower()) | Out-File "C:\programData\Donnelley\DirectoryServer\secsys.xml"
} bindsites;