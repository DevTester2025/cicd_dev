#ps1
NET USER sdladmin "SdlAbmin#12E!" /ADD
NET LOCALGROUP "administrators" "sdladmin" /add
Write-Output Y | winrm quickconfig
winrm set winrm/config/service/Auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
winrm set winrm/config/client '@{AllowUnencrypted="true"}'
winrm set winrm/config/winrs '@{MaxMemoryPerShellMB="1024"}'
netsh advfirewall firewall add rule name = "Open PsExec port 445" dir=in action=allow protocol=TCP localport=445;
netsh advfirewall firewall add rule name = "Open WinRM port 5985" dir=in action=allow protocol=TCP localport=5985;
NetSh Advfirewall set allprofiles state off;


$DriveLetter = 'W';
$SWAPDriveLetter = 'S';
$VMDisks = Get-Disk | where partitionstyle -eq "Raw";
Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False;
$i = 0;
# SWAP drive configuration
$ComputerMemory = Get-WmiObject -Class win32_operatingsystem -ErrorAction Stop;
$RamSize = [Math]::round($ComputerMemory.TotalVisibleMemorySize/1MB);
$computersys = Get-WmiObject Win32_ComputerSystem -EnableAllPrivileges;
$computersys.AutomaticManagedPagefile = $False;
$computersys.Put();
$pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
$pagefile.InitialSize = $RamSize * 1000 * 1.5;
$pagefile.MaximumSize = $RamSize * 1000 * 1.5;
$pagefile.Put();

$PysicalMemory = Get-WmiObject -class "win32_physicalmemory" -namespace "root\CIMV2";
$Size = $((($PysicalMemory).Capacity | Measure-Object -Sum).Sum/1GB);

function cleandisk{
        Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False;
        if ( $VMDisks[$i].Number){
        Initialize-Disk -Number $VMDisks[$i].Number -PartitionStyle MBR -PassThru ;
        if($i -eq 0){
        New-Partition -DiskNumber $VMDisks[$i].Number -DriveLetter $DriveLetter -UseMaximumSize;
        Format-Volume -DriveLetter $DriveLetter -FileSystem NTFS -NewFileSystemLabel "SDL" -Confirm:$false;
        }elseif($i -eq 1){
        New-Partition -DiskNumber $VMDisks[$i].Number -DriveLetter $SWAPDriveLetter -UseMaximumSize;
        Format-Volume -DriveLetter $SWAPDriveLetter -FileSystem NTFS -NewFileSystemLabel "SWAP" -Confirm:$false;
        Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name="S:\pagefile.sys";InitialSize=$Size * 1000 * 0.1;Maximumsize=$Size * 1000 * 0.9;}
        $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
        $pagefile[0].delete();
        Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False;
        }
        else{
        $volume = New-Partition -DiskNumber $VMDisks[$i].Number -AssignDriveLetter -UseMaximumSize;     
        Format-Volume -DriveLetter $volume[0].DriveLetter -FileSystem NTFS -Confirm:$false;   
        }
        $i++;
        Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False;
        cleandisk;
        }
}
if($VMDisks){
cleandisk;
}