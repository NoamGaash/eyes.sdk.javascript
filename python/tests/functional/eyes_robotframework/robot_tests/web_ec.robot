*** Settings ***
Library     SeleniumLibrary
Library     EyesLibrary  runner=web_ufg  config=applitools.yaml


*** Test Cases ***
Check Window Using Execution Cloud Driver
    ${remote_url}=  Get Execution Cloud URL
    # desired_capabilities parameter is here because SeleniumLibrary on python 3.6
    # has 'platform' in default desired capabilities, which is rejected by EC
    # newer versions don't seem to add default platform.
    Open Browser  https://demo.applitools.com  chrome  remote_url=${remote_url}
    ...           desired_capabilities=browserName:chrome
    Eyes Open
    Eyes Check Window
    Eyes Close Async
    Close Browser
