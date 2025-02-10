Import-Module WebAdministration;
$Flowbinding = Get-WebBinding -name "Flow Web Site";
$IsFlowAvailable = "false";
if(($Flowbinding)){$IsFlowAvailable ="true"};
echo $IsFlowAvailable;
while(($IsFlowAvailable -like "false")){echo "Not found";Start-Sleep -s 100;$Flowbinding = Get-WebBinding -name "Flow Web Site";
$IsFlowAvailable = "false";
if(($Flowbinding)){$IsFlowAvailable ="true"};}
Remove-WebBinding -Name "Flow Web Site" -Protocol http -BindingInformation "*:80:";
New-WebBinding -Name "Flow Web Site" -IP "*" -Port 443 -Protocol https;
New-WebBinding -Name "Default Web Site" -IP "*" -Port 80 -Protocol http;
$newCertificate = New-SelfSignedCertificate -DnsName "TMS" -CertStoreLocation "cert:\LocalMachine\My";
$binding = Get-WebBinding -name "Flow Web Site" -Protocol "https";
$binding.AddSslCertificate($newCertificate.GetCertHashString() , "my");
start-Website "Flow Web Site";
start-Website "Default Web Site";
