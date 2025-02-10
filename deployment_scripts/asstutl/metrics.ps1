param(
	[Parameter(Mandatory)]
	[string]$InstanceRefID,

	[Parameter(Mandatory)]
	[string]$TenantID,

	[Parameter(Mandatory)]
	[string]$DatabaseURL
)

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
 $Headers = @{
                Authorization = "Basic $EncodedCreds"
            }

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
if(Test-Path alias:curl){
Remove-item alias:curl;
}
mkdir 'c:\scripts\';

# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=CPU,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=CPU_SPEED,uom=GHz value=$CurrentCPUSpeed";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=CPU,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=CPU_UTIL,uom=PERCENT value=$CPUUsagePercentage";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=MEMORY,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=MEM_USEPERCENT,uom=PERCENT value=$memoryUsagePercentage";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=MEMORY,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=MEM_TOTAL,uom=GB value=$TotalMemory";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=MEMORY,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=MEM_FREE,uom=GB value=$FreeMemory";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=DISK,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=DISK_READ,uom=KBs value=$DiskRead";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=DISK,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=DISK_WRITE,uom=KBs value=$DiskWrite";
# curl -i -XPOST "$DatabaseURL/write?db=test&u=csdm&p=aaludra" --data-binary "utilization,utiltype=ETHERNET,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=NET_RECV,uom=Kbps value=$Received_Kbps";
# curl -i -XPOST "$DatabaseURL/write?db=test" --data-binary "utilization,utiltype=ETHERNET,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=NET_SEND,uom=Kbps value=$Sent_Kbps";
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=CPU,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=CPU_SPEED,uom=GHz value=$CurrentCPUSpeed" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=CPU,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=CPU_UTIL,uom=PERCENT value=$CPUUsagePercentage" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=MEMORY,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=MEM_USEPERCENT,uom=PERCENT value=$memoryUsagePercentage" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=MEMORY,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=MEM_TOTAL,uom=GB value=$TotalMemory" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=MEMORY,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=MEM_FREE,uom=GB value=$FreeMemory" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=DISK,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=DISK_READ,uom=KBs value=$DiskRead" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=DISK,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=DISK_WRITE,uom=KBs value=$DiskWrite" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=ETHERNET,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=NET_RECV,uom=Kbps value=$Received_Kbps" -Headers $Headers | Out-Null;
Invoke-RestMethod -Uri "$DatabaseURL/write?db=test" -Method Post -Body "utilization,utiltype=ETHERNET,tenantid=$TenantID,instancename=$env:COMPUTERNAME,instancerefid=$InstanceRefID,utilkey=NET_SEND,uom=Kbps value=$Sent_Kbps" -Headers $Headers | Out-Null;
