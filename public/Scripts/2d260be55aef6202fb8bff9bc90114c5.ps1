$command = 'net localgroup administrators '+$args[0]+'\'+$args[1] +' /add';
echo $command;
start-process powershell -verb runas -argument $command;

$result = Invoke-WebRequest -Uri "http://10.225.255.5:3000/files/windows/executable/dotnetfile.exe" -OutFile "C:\Users\sdladmin\dotnetfile.exe";
C:\Users\sdladmin\dotnetfile.exe /q /norestart



