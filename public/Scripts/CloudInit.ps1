#ps1
NET USER cmadmin "CmAbmin#12E!" /ADD
NET LOCALGROUP "administrators" "cmadmin" /add
Write-Output Y | winrm quickconfig
winrm set winrm/config/service/Auth '@{Basic="true"}'
winrm set winrm/config/service '@{AllowUnencrypted="true"}'
winrm set winrm/config/client '@{AllowUnencrypted="true"}'
winrm set winrm/config/winrs '@{MaxMemoryPerShellMB="1024"}'
netsh advfirewall firewall add rule name = "Open PsExec port 445" dir=in action=allow protocol=TCP localport=445;
netsh advfirewall firewall add rule name = "Open WinRM port 5985" dir=in action=allow protocol=TCP localport=5985;
Set-NetFirewallProfile -Enabled False;
$DriveLetter = 'W';
$SWAPDriveLetter = 'S';
$VMDisks = Get-Disk | where partitionstyle -eq "Raw";
if ($VMDisks) {
    if ( $VMDisks[0].Number) {
        Initialize-Disk -Number $VMDisks[0].Number -PartitionStyle MBR -PassThru ;
        New-Partition -DiskNumber $VMDisks[0].Number -DriveLetter $DriveLetter -UseMaximumSize;
        Format-Volume -DriveLetter $DriveLetter -FileSystem NTFS -NewFileSystemLabel "SDL" -Confirm:$false;

        if ( $VMDisks[1].Number) {
            Initialize-Disk -Number $VMDisks[1].Number -PartitionStyle MBR -PassThru ;
            New-Partition -DiskNumber $VMDisks[1].Number -DriveLetter $SWAPDriveLetter -UseMaximumSize;
            Format-Volume -DriveLetter $SWAPDriveLetter -FileSystem NTFS -NewFileSystemLabel "PAGEFILE" -Confirm:$false;
            Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name = "S:\pagefile.sys"; InitialSize = $RamSize * 1000 * 1.5; Maximumsize = $RamSize * 1000 * 1.5; }
            $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
            $pagefile[0].delete();
        }
        # $HostName = $args[0]; #GC Env:ComputerName;
        # $DCDNS = $args[1]; #"172.31.3.52"; #provide the DNS IPv4 of the AD server
        $DCDomainName = "SDLPRODUCTS"; #"csdmdev.online";
        $DCUserName = "$DCDomainName\cmnambi" ;
        $DCPasswd = "Csdm@Nov20200";
        # $NewHostName = $args[0]; #provide the new Host name
        $credential = New-Object System.Management.Automation.PSCredential($DCUserName, $DCPasswd);

        Add-Computer -DomainName $DCDomainName -Credential $credential;
        # shutdown -r -f
        # Rename-Computer $NewHostName -DomainCredential $credential -Restart -Force
    }
    else {
        write-host("false")
    }
    Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False
}
else {
    write-host("false")
}

# SWAP drive configuration
$ComputerMemory = Get-WmiObject -Class win32_operatingsystem -ErrorAction Stop;
$RamSize = [Math]::round($ComputerMemory.TotalVisibleMemorySize / 1MB);
$computersys = Get-WmiObject Win32_ComputerSystem -EnableAllPrivileges;
$computersys.AutomaticManagedPagefile = $False;
$computersys.Put();
$pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
$pagefile.InitialSize = $RamSize * 1000 * 1.5;
$pagefile.MaximumSize = $RamSize * 1000 * 1.5;
$pagefile.Put();

if ($VMDisks) {
    if ( $VMDisks[1].Number) {
        Initialize-Disk -Number $VMDisks[1].Number -PartitionStyle MBR -PassThru ;
        New-Partition -DiskNumber $VMDisks[1].Number -DriveLetter 'S' -UseMaximumSize;
        Format-Volume -DriveLetter 'S' -FileSystem NTFS -NewFileSystemLabel "PAGEFILE" -Confirm:$false;
        Set-WmiInstance -Class Win32_PageFileSetting -Arguments @{Name = "S:\pagefile.sys"; InitialSize = $RamSize * 1000 * 1.5; Maximumsize = $RamSize * 1000 * 1.5; }
        $pagefile = Get-WmiObject -Query "Select * From Win32_PageFileSetting Where Name like '%pagefile.sys'";
        $pagefile[0].delete();
    }
    else {
        write-host("false")
    }
    Get-Disk | Where-Object IsOffline -Eq $True | Set-Disk -IsOffline $False
}
