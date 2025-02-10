#
# SDLGroupshare windows prerequistes dsc script.
#
# Run this script to configure a windows server 2012 machine to support a single server install

## Windows Features.
Configuration SDLGroupSharePrerequisites
{ 
	param ($MachineName)

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
		
		WindowsFeature WebDynamicCompression
		{ 
			Ensure = "Present"
			Name = "Web-Dyn-Compression"
		} 

		#Install ASP.NET 4.5 
		WindowsFeature WebAspNet45
		{ 
			Ensure = “Present” 
			Name = “Web-Asp-Net45” 
		} 
 

		WindowsFeature DotNETFramework 
		{ 
			Ensure = “Present” 
			Name = “AS-NET-Framework” 
		} 

		WindowsFeature WPASSupport 
		{ 
			Ensure = “Present” 
			Name = “AS-WAS-Support” 
		} 
   

		WindowsFeature WCFHTTPActivation 
		{ 
			Ensure = “Present” 
			Name = “AS-HTTP-Activation” 
		} 

		WindowsFeature WCFTCPActivation 
		{ 
			Ensure = “Present” 
			Name = “AS-TCP-Activation” 
		} 
	} 
}

SDLGroupSharePrerequisites -MachineName $env:COMPUTERNAME

Start-DscConfiguration -Path '.\SDLGroupSharePrerequisites' -wait -verbose -force
