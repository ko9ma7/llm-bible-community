@echo off
rem Compatibility alias. v2.3.0 uses setup-permissions.cmd for DB/Auth/admin setup.
call "%~dp0setup-permissions.cmd"
exit /b %errorlevel%
