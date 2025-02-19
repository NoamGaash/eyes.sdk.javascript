from __future__ import absolute_import, division, print_function, unicode_literals

import json

from applitools.common.eyes import WebEyes
from applitools.common.runner import EyesRunner

from .fluent.target import Target
from .runner import ClassicRunner

__all__ = "Eyes", "EyesRunner"

from typing import TYPE_CHECKING

from six import string_types

from ..common import EyesError, ProxySettings, __version__
from ..common.command_executor import CommandExecutor
from ..common.ec_client_settings import ECClientCapabilitiesOptions, ECClientSettings
from ..common.selenium.config import Configuration
from ..common.utils.general_utils import get_env_with_prefix

if TYPE_CHECKING:
    from typing import Optional, Text, Union


class Eyes(WebEyes):
    _Configuration = Configuration
    _DefaultRunner = ClassicRunner
    Target = Target

    @classmethod
    def get_execution_cloud_url(cls, api_key=None, server_url=None, proxy=None):
        # type: (Text, Text, ProxySettings) -> Text
        cmd = CommandExecutor.get_instance(
            cls._DefaultRunner.Protocol, cls._DefaultRunner.BASE_AGENT_ID, __version__
        )
        result = cmd.core_make_ec_client(
            ECClientSettings(ECClientCapabilitiesOptions(api_key, server_url), proxy)
        )
        return result["url"]

    @staticmethod
    def set_nmg_capabilities(
        caps,  # type: dict
        api_key=None,  # type: Optional[Text]
        eyes_server_url=None,  # type: Optional[Text]
        proxy_settings=None,  # type: Optional[Union[Text, ProxySettings]]
    ):
        # type: (...) -> None
        if not api_key:
            api_key = get_env_with_prefix("APPLITOOLS_API_KEY")
            if not api_key:
                raise EyesError("No API key was given, or is an empty string.")
        env_caps = {
            "NML_API_KEY": api_key,
        }

        if not eyes_server_url:
            eyes_server_url = get_env_with_prefix("APPLITOOLS_SERVER_URL")
        if eyes_server_url:
            env_caps["NML_SERVER_URL"] = eyes_server_url

        if not proxy_settings:
            proxy_settings = ProxySettings.from_env()
        elif isinstance(proxy_settings, string_types):
            proxy_settings = ProxySettings(proxy_settings)
        if proxy_settings:
            env_caps["NML_PROXY_URL"] = proxy_settings.url

        # for iOS
        ios_env_caps = {
            "DYLD_INSERT_LIBRARIES": (
                "@executable_path/Frameworks/UFG_lib.xcframework/ios-arm64_x86_64-simulator/UFG_lib.framework/UFG_lib"
                ":@executable_path/Frameworks/UFG_lib.xcframework/ios-arm64/UFG_lib.framework/UFG_lib"
            )
        }
        ios_env_caps.update(env_caps)
        caps["processArguments"] = {
            "args": [],
            "env": ios_env_caps,
        }
        # for Android
        caps["optionalIntentArguments"] = "--es APPLITOOLS '{}'".format(
            json.dumps(env_caps, sort_keys=True)
        )

    @property
    def is_cut_provider_explicitly_set(self):
        # type: () -> bool
        """
        Gets is cut provider explicitly set.
        """
        raise self.configuration.cut_provider is not None

    # Impossible to implement via universal sdk
    @property
    def should_stitch_content(self):
        # type: () -> bool
        raise NotImplementedError

    @property
    def original_fc(self):
        """Gets original frame chain

        Before check() call we save original frame chain

        Returns:
            Frame chain saved before check() call
        """
        raise NotImplementedError

    @property
    def device_pixel_ratio(self):
        # type: () -> int
        """
        Gets device pixel ratio.

        :return The device pixel ratio, or if the DPR is not known yet or if it wasn't
        possible to extract it.
        """
        raise NotImplementedError

    @property
    def debug_screenshots_provider(self):
        raise NotImplementedError

    @property
    def position_provider(self):
        """
        Sets position provider.
        """
        raise NotImplementedError

    @property
    def current_frame_position_provider(self):
        raise NotImplementedError

    def add_mouse_trigger_by_element(self, action, element):
        """
        Adds a mouse trigger.

        :param action: Mouse action (click, double click etc.)
        :param element: The element on which the action was performed.
        """
        raise NotImplementedError

    def add_text_trigger_by_element(self, element, text):
        """
        Adds a text trigger.

        :param element: The element to which the text was sent.
        :param text: The trigger's text.
        """
        raise NotImplementedError

    @property
    def agent_setup(self):
        # Saved for backward compatibility
        return None

    @property
    def server_connector(self):
        raise NotImplementedError

    @server_connector.setter
    def server_connector(self, server_connector):
        raise NotImplementedError
