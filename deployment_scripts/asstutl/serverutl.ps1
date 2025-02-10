$server = 'ad.lab.local'
#$Server = $Server.trim()

# CPU info
$MaxClockSpeed = $(Get-WmiObject Win32_Processor | select -first 1).MaxClockSpeed
$ProcessorPerformance = (Get-Counter -Counter "\Processor Information(_Total)\% Processor Performance").CounterSamples.CookedValue
$CurrentCPUSpeed = [Math]::round($($MaxClockSpeed*($ProcessorPerformance/100))/1000,2)

$BaseCpuSpeed = [Math]::round(($MaxClockSpeed/1000),2)

# CPU utilization
$CPUUsagePercentage = [Math]::round($(Get-Counter -Counter "\Processor(_Total)\% Processor Time" | Select -ExpandProperty countersamples | Measure-Object -Average CookedValue).Average,2)

# Memory info
$ComputerMemory = Get-WmiObject -Class win32_operatingsystem -ErrorAction Stop
$TotalMemory = [Math]::round($ComputerMemory.TotalVisibleMemorySize/1MB)
$FreeMemory = [Math]::round($ComputerMemory.FreePhysicalMemory /1MB,2)

# Memory utilization
$Memory = ((($ComputerMemory.TotalVisibleMemorySize - $ComputerMemory.FreePhysicalMemory)*100)/ $ComputerMemory.TotalVisibleMemorySize)
$memoryUsagePercentage = [math]::Round($Memory, 2)

# Disk Utilization
$DiskRead = [Math]::round($(Get-Counter -Counter "\physicaldisk(_total)\Disk Read Bytes/sec" | select -ExpandProperty countersamples | Measure-Object -Average CookedValue).Average/1000,2)
$DiskWrite = [Math]::round($(Get-Counter -Counter "\physicaldisk(_total)\Disk Write Bytes/sec" | select -ExpandProperty countersamples | Measure-Object -Average CookedValue).Average/1000,2)

#return "$CpuSpeed,$CPUUsagePercentage,$TotalMemory,$FreeMemory,$memoryUsagePercentage,$DiskRead,$DiskWrite"

# Network Utilization
#$Adapters = $(Get-NetAdapter | where Status -eq up | select InterfaceDescription).InterfaceDescription

$BRPS = 0;
$BSPS = 0;

$adapters = Get-WmiObject -Class Win32_PerfFormattedData_Tcpip_NetworkInterface | select Name, BytesReceivedPersec, BytesSentPersec | where {$_.BytesReceivedPersec -ne 0 -and $_.BytesSentPersec -ne 0}

If($adapters)
{
    $count = $($adapters | Measure-Object).count
    foreach($adapter in $adapters)
    {
        $BRPS += $adapter.BytesReceivedPersec
        $BSPS += $adapter.BytesSentPersec
    }
    $BRPS_avg = $BRPS/$count
    $BSPS_avg = $BSPS/$count

    $Received_Kbps = [Math]::round($BRPS_avg/125,2)
    $Sent_Kbps = [Math]::round($BSPS_avg/125,2)
}
else
{
    $Received_Kbps = $BRPS
    $Sent_Kbps = $BSPS
}

$Object = New-Object PSObject
# $Object | Add-Member -MemberType NoteProperty -Name "SERVER_IP" -Value $Server
$Object | Add-Member -MemberType NoteProperty -Name "CPU:CPU_UTIL:PERCENT" -Value $CPUUsagePercentage
$Object | Add-Member -MemberType NoteProperty -Name "MEMORY:MEM_USEPERCENT:PERCENT" -Value $memoryUsagePercentage
$Object | Add-Member -MemberType NoteProperty -Name "CPU:CPU_SPEED:GHz" -Value $CurrentCPUSpeed
$Object | Add-Member -MemberType NoteProperty -Name "MEMORY:MEM_TOTAL:GB" -Value $TotalMemory
$Object | Add-Member -MemberType NoteProperty -Name "MEMORY:MEM_FREE:GB" -Value $FreeMemory
$Object | Add-Member -MemberType NoteProperty -Name "DISK:DISK_READ:KBs" -Value $DiskRead
$Object | Add-Member -MemberType NoteProperty -Name "DISK:DISK_WRITE:KBs" -Value $DiskWrite
$Object | Add-Member -MemberType NoteProperty -Name "ETHERNET:NET_RECV:Kbps" -Value $Received_Kbps
$Object | Add-Member -MemberType NoteProperty -Name "ETHERNET:NET_SEND:Kbps" -Value $Sent_Kbps


return ConvertTo-Json $Object