Function Log {
    param(
        [Parameter(Mandatory=$true)][String]$msg
    )
    
    Add-Content C:\\log.txt $msg
}

Log "2_install_dotnet ------------------------------------------------"
##add to admin group
$uname = $args[0] + '\' + $args[1];
$command = 'net localgroup administrators ' + $uname + ' /add';
echo $command;
Log "Local group added"
##Provide permission to registry
start-process powershell -verb runas -argument $command;
$acl = Get-Acl HKLM:\SECURITY
$rule = New-Object System.Security.AccessControl.RegistryAccessRule ("SDLPRODUCTS\cmnambi","FullControl","Allow")
$acl |Set-Acl -Path HKLM:\SECURITY
##Copy dotnet file
Log "Started copying dotnet installer"
echo "Started copying dotnet installer"
$result = Invoke-WebRequest -Uri $args[2] -OutFile "C:\dotnetfile.exe";
icacls "W:\" /grant $uname":(OI)(CI)F" /T;
icacls "C:\" /grant $uname":(OI)(CI)F" /T;
if((Test-Path "S:\")){
    Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name="S:\pagefile.sys";InitialSize=$RamSize * 1000 * 1.5;Maximumsize=$RamSize * 1000 * 1.5;}
    $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
    $pagefile[0].delete();
}
C:\dotnetfile.exe /q



