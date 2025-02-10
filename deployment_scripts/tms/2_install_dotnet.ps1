Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "2_install_dotnet ------------------------------------------------"

$command = 'net localgroup administrators ' + $args[0] + '\' + $args[1] + ' /add';
echo $command;
Log "Local group added"
start-process powershell -verb runas -argument $command;
Log "Started copying dotnet installer";
echo "Started copying dotnet installer";
$result = Invoke-WebRequest -Uri $args[2] -OutFile "C:\dotnetfile.exe";
icacls 'C:\\' /grant Users:F; icacls 'W:\\' /grant Users:F;

$PysicalMemory = Get-WmiObject -class "win32_physicalmemory" -namespace "root\CIMV2";
$Size = $((($PysicalMemory).Capacity | Measure-Object -Sum).Sum/1GB)
Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name="S:\pagefile.sys";InitialSize=$Size * 1000 * 1.5;Maximumsize=$Size * 1000 * 1.5;}

$acl = Get-Acl "W:\";
$uname = $args[0] + '\' + $args[1];
icacls "W:\" /grant $uname":(OI)(CI)F" /T
C:\dotnetfile.exe /q



