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

$ifIndex = Get-WmiObject -Class win32_ip4routetable | where {$_.destination -eq "0.0.0.0"} | select -ExpandProperty InterfaceIndex
$ifIndex = "InterfaceIndex=" + $ifIndex
$desc = Get-WmiObject -Class win32_networkadapterconfiguration -Filter $ifIndex | select -ExpandProperty Description
$nic_name = $desc -replace "#","_"
$Received = [Math]::round($(Get-Counter -Counter "\Network Adapter($nic_name)\Bytes Received/sec"| Select -ExpandProperty Countersamples | Measure-Object -Average CookedValue).Average/125,2)
$Sent = [Math]::round($(Get-Counter -Counter "\Network Adapter($nic_name)\Bytes Sent/sec"| Select -ExpandProperty Countersamples | Measure-Object -Average CookedValue).Average/125,2)

$Object = New-Object PSObject
$Object | Add-Member -MemberType NoteProperty -Name "SERVER_IP" -Value $Server
$Object | Add-Member -MemberType NoteProperty -Name "CPU:CPU_UTIL:PERCENT" -Value $CPUUsagePercentage
$Object | Add-Member -MemberType NoteProperty -Name "MEMORY:MEM_USEPERCENT:PERCENT" -Value $memoryUsagePercentage
$Object | Add-Member -MemberType NoteProperty -Name "CPU:CPU_SPEED:GHz" -Value $CurrentCPUSpeed
$Object | Add-Member -MemberType NoteProperty -Name "MEMORY:MEM_TOTAL:GB" -Value $TotalMemory
$Object | Add-Member -MemberType NoteProperty -Name "MEMORY:MEM_FREE:GB" -Value $FreeMemory
$Object | Add-Member -MemberType NoteProperty -Name "DISK:DISK_READ:KB/s" -Value $DiskRead
$Object | Add-Member -MemberType NoteProperty -Name "DISK:DISK_WRITE:KB/s" -Value $DiskWrite
$Object | Add-Member -MemberType NoteProperty -Name "ETHERNET:NET_RECV:Kbps" -Value $Received
$Object | Add-Member -MemberType NoteProperty -Name "ETHERNET:NET_SEND:Kbps" -Value $Sent


ConvertTo-Json $Object