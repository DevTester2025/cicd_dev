Invoke-WebRequest -Uri "https://www.7-zip.org/a/7z1900-x64.exe" -OutFile c:\7zip.exe

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://gsf-fl.softonic.com/4ce/056/0a10c19c1e2ce747e5ff46d8086acf5a9b/npp.7.9.Installer.exe?Expires=1602440479&Signature=44c67a5ea162df0189a7d317a3d76c9ae089c3e7&url=https://notepad-plus.en.softonic.com&Filename=npp.7.9.Installer.exe" -OutFile c:\npp.exe

Start-Sleep -s 5

Start-Process -FilePath C:\7zip.exe -ArgumentList "/S";
Start-Process -FilePath C:\npp.exe -ArgumentList "/S";

Start-Sleep -s 5
Copy-Item -Path "\\sdlproducts.com\dfs\SOFTWARE\Wazuh\wazuh-agent-3.9.1-1.msi" -Destination c:\Wasuh.msi;
msiexec.exe /i c:\Wasuh.msi /quiet

Start-Sleep -s 5
Copy-Item -Path "\\sdlproducts.com\dfs\SOFTWARE\SEPM_Client\Packages\CPT Team\My Company_Infrastructure_WIN64BIT\Symantec Endpoint Protection version 14.2.4815.1101 - English\setup.exe" -Destination c:\endpointProtection.exe;
$exearg = {C:\endpointProtection.exe /S /v/qn };
Invoke-Command -ScriptBlock $exearg;