import os

import pytest
from appium.options.android import UiAutomator2Options
from appium.options.ios import XCUITestOptions
from appium.webdriver import Remote
from selenium.common.exceptions import WebDriverException

from . import sauce


@sauce.vm
@pytest.fixture(scope="function")
def pixel_3_xl(app, sauce_url, browser_name, orientation, name_of_test):
    options = UiAutomator2Options()
    options.device_name = "Google Pixel 3 XL GoogleAPI Emulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "10.0")
    options.set_capability("sauce:options", {"name": name_of_test})
    return appium(options, sauce_url, app=app, browser_name=browser_name)


@sauce.vm
@pytest.fixture(scope="function")
def pixel_3a_xl(app, sauce_url, browser_name, orientation, name_of_test):
    options = UiAutomator2Options()
    options.device_name = "Google Pixel 3a XL GoogleAPI Emulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "10.0")
    options.set_capability("sauce:options", {"name": name_of_test})
    return appium(options, sauce_url, app=app, browser_name=browser_name)


@sauce.vm
@pytest.fixture(scope="function")
def samsung_galaxy_s8(app, sauce_url, browser_name, orientation, name_of_test):
    options = UiAutomator2Options()
    options.device_name = "Samsung Galaxy S8 FHD GoogleAPI Emulator"
    options.set_capability("platformVersion", "7.0")
    options.orientation = orientation.upper()
    options.set_capability("sauce:options", {"name": name_of_test})
    return appium(options, sauce_url, app=app, browser_name=browser_name)


@sauce.mac_vm
@pytest.fixture(scope="function")
def iphone_xs(app, sauce_url, browser_name, orientation, name_of_test):
    # 2023-06-29 sauce raises "The test with session id # has already finished" error
    # right from the session start
    pytest.skip("There is no way to instantiate iPhone XS device with Appium2")


@sauce.mac_vm
@pytest.fixture(scope="function")
def iphone_12(app, sauce_url, browser_name, orientation, name_of_test):
    options = XCUITestOptions()
    options.device_name = "iPhone 12 Pro Simulator"
    options.orientation = orientation.upper()
    options.set_capability("platformVersion", "15.2")
    options.set_capability("sauce:options", {"name": name_of_test})
    return appium(options, sauce_url, app=app, browser_name=browser_name)


def appium(options, sauce_url, app="", browser_name=""):
    if app and browser_name:
        raise Exception("Appium drivers shouldn't contain both app and browserName")
    if not app and not browser_name:
        raise Exception("Appium drivers should have app or browserName")
    if app:
        options.app = app
    if browser_name:
        options.set_capability("browserName", browser_name)

    selenium_url = os.getenv("SELENIUM_SERVER_URL", sauce_url)
    for attempt in range(3):  # try to work around random sauce server errors
        try:
            return Remote(command_executor=selenium_url, options=options)
        except WebDriverException as e:
            print("Failed to start appium driver:", e)
            if "Unexpected server error" not in e.msg or attempt == 2:
                raise
