#
# SDLGroupshare windows prerequistes dsc script.
#
# Run this script to configure a windows server 2019 machine to support a single server install

## Windows Features.
Configuration SDLGroupSharePrerequisites
{ 
	param ($MachineName)

	Import-DscResource –ModuleName 'PSDesiredStateConfiguration'

	Node $MachineName 
	{ 
		#Install the IIS Role 
		WindowsFeature WebServerRole 
		{ 
			Ensure = “Present” 
			Name = “Web-Server” 
		} 

		WindowsFeature WebMgmtConsole
		{
			Name = "Web-Mgmt-Console"
			Ensure = "Present"
			DependsOn = "[WindowsFeature]WebServerRole"
			} 

		WindowsFeature WebAppInit
		{
			Name = "Web-AppInit"
			Ensure = "Present"
			DependsOn = "[WindowsFeature]WebServerRole"
			} 

		WindowsFeature WebSockets
		{
			Name = "Web-WebSockets"
			Ensure = "Present"
			DependsOn = "[WindowsFeature]WebServerRole"
		} 

		#Install ASP.NET 4.6
		WindowsFeature WebAspNet45
		{ 
			Ensure = “Present” 
			Name = “Web-Asp-Net45” 
		} 

		WindowsFeature WebDynamicCompression
		{ 
			Ensure = "Present"
			Name = "Web-Dyn-Compression"
		} 

		WindowsFeature DotNETFramework45Core
		{ 
			Ensure = “Present” 
			Name = “NET-FrameWork-45-Core” 
		} 

        WindowsFeature DotNETFramework45Features
		{ 
			Ensure = “Present” 
			Name = “NET-FrameWork-45-Features” 
		} 

		WindowsFeature WPASSupport 
		{ 
			Ensure = “Present” 
			Name = “WAS” 
		} 
   

		WindowsFeature WCFHTTPActivation 
		{ 
			Ensure = “Present” 
			Name = “NET-WCF-HTTP-Activation45” 
		} 

		WindowsFeature WCFTCPActivation 
		{ 
			Ensure = “Present” 
			Name = “NET-WCF-TCP-Activation45” 
		} 
	} 
}

SDLGroupSharePrerequisites -MachineName $env:COMPUTERNAME

Start-DscConfiguration -Path '.\SDLGroupSharePrerequisites' -wait -verbose -force
