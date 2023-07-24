*** Settings ***
Resource    resources/setup.robot
Library     SeleniumLibrary
Library     EyesLibrary     runner=${RUNNER}    config=applitools.yaml

Test Setup       Setup
Test Teardown    Teardown


*** Test Cases ***
Check Window Two Times
    Eyes Open    Check Window Two Times ${RUNNER}  batch=${BATCH_NAME}
    Eyes Check Window       first
    Eyes Check Window       second


Check Region By Element
    Eyes Open    Check Region By Element ${RUNNER}  batch=${BATCH_NAME}
    ${element}=     Get WebElement          ${FORM_XPATH}
    Eyes Check Region By Element    ${element}


Check Region By Selector
    Eyes Open    Check Region By Selector ${RUNNER}  batch=${BATCH_NAME}
    Eyes Check Region By Selector    ${FORM_XPATH}


Check Shadow Dom
    Eyes Open    Check Window Two Times ${RUNNER}  batch=${BATCH_NAME}
    Go To        https://applitools.github.io/demo/TestPages/ShadowDOM/index.html
    Eyes Check Region By Target Path
    ...     Shadow By Selector    css:#has-shadow-root
    ...     Region By Selector   css:h1
    ...     Ignore Region By Coordinates    [12 22 22 22]


Check Window with padding
    Eyes Open    batch=${BATCH_NAME}
    Go To        https://applitools.github.io/demo/TestPages/PaddedBody/region-padding.html
    Eyes Check Window  Fully
    ...  Ignore Region By Selector   css:#ignoreRegions   padding=20
    ...  Layout Region By Selector   css:#layoutRegions   padding=top: 20 right: 20
    ...  Content Region By Selector  css:#contentRegions  padding=left: 20 right: 20
    ...  Strict Region By Selector   css:#strictRegions   padding=bottom: 20


Check With Ignore Region having Region ID
    Eyes Open    batch=${BATCH_NAME}
    Go To        https://applitools.github.io/demo/TestPages/RandomizePage/?randomize
    ${element}=  Get WebElement    css:\#random
    Eyes Check Window

Check Region By Element
    Eyes Open    Check Region By Element ${RUNNER}  batch=${BATCH_NAME}
    ${element}=     Get WebElement          ${FORM_XPATH}
    Eyes Check Region By Element    ${element}


Check Region By Selector
    Eyes Open    Check Region By Selector ${RUNNER}  batch=${BATCH_NAME}
    Eyes Check Region By Selector    ${FORM_XPATH}


Check Shadow Dom
    Eyes Open    Check Window Two Times ${RUNNER}  batch=${BATCH_NAME}
    Go To        https://applitools.github.io/demo/TestPages/ShadowDOM/index.html
    Eyes Check Region By Target Path
    ...     Shadow By Selector    css:#has-shadow-root
    ...     Region By Selector   css:h1
    ...     Ignore Region By Coordinates    [12 22 22 22]


Check Window with padding
    Eyes Open    batch=${BATCH_NAME}
    Go To        https://applitools.github.io/demo/TestPages/PaddedBody/region-padding.html
    Eyes Check Window  Fully
    ...  Ignore Region By Selector   css:#ignoreRegions   padding=20
    ...  Layout Region By Selector   css:#layoutRegions   padding=top: 20 right: 20
    ...  Content Region By Selector  css:#contentRegions  padding=left: 20 right: 20
    ...  Strict Region By Selector   css:#strictRegions   padding=bottom: 20


Check With Ignore Region having Region ID
    Eyes Open    batch=${BATCH_NAME}
    Go To        https://applitools.github.io/demo/TestPages/RandomizePage/?randomize
    ${element}=  Get WebElement    css:\#random
    Eyes Check Window
    ...  Ignore Region By Element  ${element}  region_id=Random number
