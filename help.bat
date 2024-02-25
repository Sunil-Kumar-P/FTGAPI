@echo off

REM Set the path to your virtual environment
set VENV_PATH=.\venv

REM Check if the first argument is "activate"
IF "%1%"=="venv" (
    REM Activate the virtual environment
    call %VENV_PATH%\Scripts\activate
) ELSE IF "%1%"=="install" (
    REM Run your server command here
    pip install django djangorestframework django-cors-headers
) ELSE IF "%1%"=="server" (
    REM Run your server command here
    python manage.py runserver
) ELSE IF "%1%"=="migrate" (
    REM Run your server command here
    python manage.py makemigrations
    python manage.py migrate
)ELSE IF "%1%"=="superuser" (
    REM Run your server command here
    python manage.py createsuperuser
) ELSE IF "%1%"=="-venv" (
    REM Run your server command here
    deactivate
) ELSE IF "%1%"=="run" (
    python manage.py runserver
) ELSE (
    REM Handle unrecognized command
    echo Unrecognized command: %1%
)
