Invoke-WebRequest -Uri https://az764295.vo.msecnd.net/stable/93c2f0fbf16c5a4b10e4d5f89737d9c2c25488a3/VSCodeUserSetup-x64-1.50.0.exe -OutFile  c:\code.exe;
& C:/code.exe | Write-Output 'Installation in progress...';
Write-Host "Completed";