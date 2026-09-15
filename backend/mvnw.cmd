@echo off
@REM MediKiosk Maven Wrapper Batch Script

if exist "C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.2\plugins\maven\lib\maven3\bin\mvn.cmd" (
    "C:\Program Files\JetBrains\IntelliJ IDEA 2025.3.2\plugins\maven\lib\maven3\bin\mvn.cmd" %*
) else (
    mvn %*
)
