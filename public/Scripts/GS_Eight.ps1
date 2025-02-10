Invoke-WebRequest -Uri "https://www.7-zip.org/a/7z1900-x64.exe" -OutFile c:\7zip.exe

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v7.9/npp.7.9.Installer.exe" -OutFile c:\npp.exe

Start-Sleep -s 5

Start-Process -FilePath C:\7zip.exe -ArgumentList "/S";
Start-Process -FilePath C:\npp.exe -ArgumentList "/S";

Start-Sleep -s 5
Copy-Item -Path "\\sdlproducts.com\dfs\SOFTWARE\Wazuh\wazuh-agent-3.9.1-1.msi" -Destination c:\Wasuh.msi;
msiexec.exe /i c:\Wasuh.msi /quiet

Start-Sleep -s 5
Copy-Item -Path "\\sdlproducts.com\dfs\SOFTWARE\SEPM_Client\Packages\CPT Team\My Company_Infrastructure_WIN64BIT\Symantec Endpoint Protection version 14.2.4815.1101 - English\setup.exe" -Destination c:\endpointProtection.exe;
$exearg = {C:\endpointProtection.exe /S /v/qn };
Invoke-Command -ScriptBlock $exearg;;

Start-Sleep -s 5;
write-host "Completed";