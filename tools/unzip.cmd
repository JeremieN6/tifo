@echo off
setlocal enabledelayedexpansion

set "zipfile="
set "outdir="

:parse
if "%~1"=="" goto execute
if /I "%~1"=="-d" (
  set "outdir=%~2"
  shift
  shift
  goto parse
)
if /I "%~1"=="-o" (
  shift
  goto parse
)
if /I "%~1"=="-q" (
  shift
  goto parse
)
if /I "%~1"=="-qq" (
  shift
  goto parse
)
if /I "%~1"=="-n" (
  shift
  goto parse
)
if "%zipfile%"=="" (
  set "zipfile=%~1"
)
shift
goto parse

:execute
if "%zipfile%"=="" exit /b 1
if "%outdir%"=="" set "outdir=."
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%zipfile%' -DestinationPath '%outdir%' -Force"
exit /b %errorlevel%
