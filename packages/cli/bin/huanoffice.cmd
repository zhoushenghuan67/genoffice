@echo off
rem huanoffice launcher for the packaged Windows app: <install>\resources\cli\huanoffice.cmd
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\..\HuanOffice.exe" "%~dp0huanoffice.cjs" %*
endlocal
