from __future__ import absolute_import, division, print_function

import uuid
from copy import copy, deepcopy
from datetime import datetime
from typing import TYPE_CHECKING

import attr
import six
from six import string_types
from six.moves.urllib.parse import urlparse, urlunsplit

from . import deprecated
from .accessibility import AccessibilitySettings
from .geometry import RectangleSize
from .match import ImageMatchSettings, MatchLevel
from .server import FailureReports, SessionType
from .utils import argument_guard
from .utils.converters import str2bool
from .utils.datetime_utils import UTC
from .utils.general_utils import get_env_with_prefix

if TYPE_CHECKING:
    from typing import TYPE_CHECKING, Dict, List, Optional, Text, TypeVar

    from .utils.custom_types import ViewPort

    Self = TypeVar("Self", bound="Configuration")  # typedef

__all__ = ("BatchInfo", "Configuration")

MINIMUM_MATCH_TIMEOUT_MS = 600
DEFAULT_ALL_TEST_RESULTS_TIMEOUT = 30 * 60  # seconds
PROCESS_DEFAULT_BATCH_ID = str(uuid.uuid4())  # Unique per-process


@attr.s(init=False, slots=True)
class BatchInfo(object):
    """
    A batch of tests.
    """

    name = attr.ib()  # type: Text
    started_at = attr.ib()  # type: datetime
    sequence_name = attr.ib()  # type: Optional[Text]
    id = attr.ib()  # type: Text
    notify_on_completion = attr.ib()  # type: bool
    properties = attr.ib()  # type: List[Dict[Text,Text]]

    def __init__(self, name=None, started_at=None, batch_sequence_name=None):
        # type: (Optional[Text], Optional[datetime], Optional[Text]) -> None
        self.id = get_env_with_prefix(
            "APPLITOOLS_BATCH_ID", PROCESS_DEFAULT_BATCH_ID
        )  # type: Text
        self.name = get_env_with_prefix("APPLITOOLS_BATCH_NAME")  # type: Text
        self.started_at = datetime.now(UTC)  # type: datetime
        self.sequence_name = get_env_with_prefix(
            "APPLITOOLS_BATCH_SEQUENCE"
        )  # type: Optional[Text]
        self.notify_on_completion = str2bool(
            get_env_with_prefix("APPLITOOLS_BATCH_NOTIFY")
        )  # type: bool
        self.properties = []  # type: List[Dict[Text,Text]]

        if name:
            self.name = name
        if started_at:
            self.started_at = started_at
        if batch_sequence_name:
            self.sequence_name = batch_sequence_name

    def with_batch_id(self, id):
        # type: (Text) -> BatchInfo
        argument_guard.not_none(id)
        self.id = str(id)
        return self

    def add_property(self, name, value):
        # type: (Text, Text) -> BatchInfo
        """
        Associates a key/value pair with the Batch. This can be used later for filtering.
        :param name: (string) The property name.
        :param value: (string) The property value
        """
        self.properties.append({"name": name, "value": value})
        return self

    def clear_properties(self):
        # type: () -> BatchInfo
        """
        Clears the list of Batch properties.
        """
        del self.properties[:]
        return self


class ProxySettings(object):
    def __init__(
        self,
        host_or_url,  # type: Text
        port=None,  # type: Optional[int]
        username=None,  # type: Optional[Text]
        password=None,  # type: Optional[Text]
        scheme=None,  # type: Text
    ):
        # type: (...) -> None
        if host_or_url.startswith("http://") or host_or_url.startswith("https://"):
            parsed = urlparse(host_or_url)
            self.host = parsed.hostname
            self.port = port or parsed.port or 8888
            self.username = username or parsed.username
            self.password = password or parsed.password
            self.scheme = scheme or parsed.scheme or "http"
        else:
            self.host = host_or_url
            self.port = port or 8888
            self.username = username
            self.password = password
            self.scheme = scheme or "http"

    @property
    def url(self):
        password = ":{}".format(self.password) if self.password else ""
        auth = "{}{}@".format(self.username, password) if self.username else ""
        port = ":{}".format(self.port) if self.port else ""
        return urlunsplit((self.scheme, auth + self.host + port, "", "", ""))

    @classmethod
    def from_env(cls):
        # type: (ProxySettings) -> ProxySettings | None
        url = get_env_with_prefix("APPLITOOLS_HTTP_PROXY")
        if url:
            return cls(url)
        return None


@attr.s
class Configuration(object):
    batch = attr.ib(factory=BatchInfo)  # type: BatchInfo
    branch_name = attr.ib(
        factory=lambda: get_env_with_prefix("APPLITOOLS_BRANCH", None),
    )  # type: Optional[Text]
    parent_branch_name = attr.ib(
        factory=lambda: get_env_with_prefix("APPLITOOLS_PARENT_BRANCH", None),
    )  # type: Optional[Text]
    baseline_branch_name = attr.ib(
        factory=lambda: get_env_with_prefix("APPLITOOLS_BASELINE_BRANCH", None),
    )  # type: Optional[Text]
    agent_id = attr.ib(default=None)  # type: Optional[Text]
    baseline_env_name = attr.ib(default=None)  # type: Optional[Text]
    environment_name = attr.ib(default=None)  # type: Optional[Text]
    save_diffs = attr.ib(default=None)  # type: bool
    app_name = attr.ib(default=None)  # type: Optional[Text]
    test_name = attr.ib(default=None)  # type: Optional[Text]
    viewport_size = attr.ib(
        default=None,
        converter=attr.converters.optional(RectangleSize.from_),
    )  # type: Optional[RectangleSize]
    session_type = attr.ib(default=None)  # type: Optional[SessionType]
    host_app = attr.ib(default=None)  # type: Optional[Text]
    host_os = attr.ib(default=None)  # type: Optional[Text]
    properties = attr.ib(factory=list)  # type: List[Dict[Text, Text]]
    match_timeout = attr.ib(default=None)  # type: Optional[int] # ms
    is_disabled = attr.ib(default=None)  # type: Optional[bool]
    save_new_tests = attr.ib(default=None)  # type: Optional[bool]
    save_failed_tests = attr.ib(default=None)  # type: Optional[bool]
    failure_reports = attr.ib(default=None)  # type: Optional[FailureReports]
    send_dom = attr.ib(default=None)  # type: Optional[bool]
    default_match_settings = attr.ib(
        factory=ImageMatchSettings
    )  # type: ImageMatchSettings
    stitch_overlap = attr.ib(default=None)  # type: Optional[int]
    api_key = attr.ib(
        factory=lambda: get_env_with_prefix("APPLITOOLS_API_KEY", None)
    )  # type: Optional[Text]
    server_url = attr.ib(
        factory=lambda: get_env_with_prefix("APPLITOOLS_SERVER_URL"),
    )  # type: Text
    _timeout = attr.ib(default=None)  # type: Optional[int] # ms
    proxy = attr.ib(factory=ProxySettings.from_env)  # type: ProxySettings | None
    save_debug_screenshots = attr.ib(default=None)  # type: Optional[bool]
    debug_screenshots_path = attr.ib(
        converter=str, factory=lambda: get_env_with_prefix("DEBUG_SCREENSHOT_PATH", "")
    )
    debug_screenshots_prefix = attr.ib(
        converter=str,
        factory=lambda: get_env_with_prefix("DEBUG_SCREENSHOT_PREFIX", "screenshot_"),
    )
    wait_before_capture = attr.ib(default=None)  # type: Optional[int]
    user_test_id = attr.ib(default=None)  # type: Optional[Text]

    @property
    def enable_patterns(self):
        # type: () -> bool
        return self.default_match_settings.enable_patterns

    @enable_patterns.setter
    def enable_patterns(self, enable_patterns):
        # type: (bool) -> None
        self.default_match_settings.enable_patterns = enable_patterns

    @property
    def use_dom(self):
        # type: () -> bool
        return self.default_match_settings.use_dom

    @use_dom.setter
    def use_dom(self, use_dom):
        # type: (bool) -> None
        self.default_match_settings.use_dom = use_dom

    @property
    def match_level(self):
        # type: () -> MatchLevel
        return self.default_match_settings.match_level

    @match_level.setter
    def match_level(self, match_level):
        # type: (MatchLevel) -> None
        self.default_match_settings.match_level = match_level

    @property
    def ignore_displacements(self):
        # type: () -> bool
        return self.default_match_settings.ignore_displacements

    @ignore_displacements.setter
    def ignore_displacements(self, ignore_displacements):
        # type: (bool) -> None
        self.default_match_settings.ignore_displacements = ignore_displacements

    def set_batch(self, batch):
        # type: (Self, BatchInfo) -> Self
        argument_guard.is_a(batch, BatchInfo)
        self.batch = batch
        return self

    def set_branch_name(self, branch_name):
        # type: (Self, Text) -> Self
        self.branch_name = branch_name
        return self

    def set_agent_id(self, agent_id):
        # type: (Self, Text) -> Self
        self.agent_id = agent_id
        return self

    def set_parent_branch_name(self, parent_branch_name):
        # type: (Self, Text) -> Self
        self.parent_branch_name = parent_branch_name
        return self

    def set_baseline_branch_name(self, baseline_branch_name):
        # type: (Self, Text) -> Self
        self.baseline_branch_name = baseline_branch_name
        return self

    def set_baseline_env_name(self, baseline_env_name):
        # type: (Self, Text) -> Self
        self.baseline_env_name = baseline_env_name
        return self

    def set_environment_name(self, environment_name):
        # type: (Self, Text) -> Self
        self.environment_name = environment_name
        return self

    def set_save_diffs(self, save_diffs):
        # type: (Self, bool) -> Self
        self.save_diffs = save_diffs
        return self

    def set_app_name(self, app_name):
        # type: (Self, Text) -> Self
        self.app_name = app_name
        return self

    def set_test_name(self, test_name):
        # type: (Self, Text) -> Self
        self.test_name = test_name
        return self

    def set_viewport_size(self, viewport_size):
        # type: (Self, ViewPort) -> Self
        self.viewport_size = viewport_size
        return self

    def set_session_type(self, session_type):
        # type: (Self, SessionType) -> Self
        self.session_type = session_type
        return self

    @property
    def ignore_caret(self):
        # type: () -> bool
        return self.default_match_settings.ignore_caret

    def set_ignore_caret(self, ignore_caret):
        # type: (Self, bool) -> Self
        self.default_match_settings.ignore_caret = ignore_caret
        return self

    def set_host_app(self, host_app):
        # type: (Self, Text) -> Self
        self.host_app = host_app
        return self

    def set_host_os(self, host_os):
        # type: (Self, Text) -> Self
        self.host_os = host_os
        return self

    def set_match_timeout(self, match_timeout):
        # type: (Self, int) -> Self
        self.match_timeout = match_timeout
        return self

    def set_match_level(self, match_level):
        # type: (Self, MatchLevel) -> Self
        self.match_level = match_level
        return self

    def set_ignore_displacements(self, ignore_displacements):
        # type: (Self, bool) -> Self
        self.ignore_displacements = ignore_displacements
        return self

    def set_save_new_tests(self, save_new_tests):
        # type: (Self, bool) -> Self
        self.save_new_tests = save_new_tests
        return self

    def set_save_failed_tests(self, save_failed_tests):
        # type: (Self, bool) -> Self
        self.save_failed_tests = save_failed_tests
        return self

    def set_failure_reports(self, failure_reports):
        # type: (Self, FailureReports) -> Self
        self.failure_reports = failure_reports
        return self

    def set_send_dom(self, send_dom):
        # type: (Self, bool) -> Self
        self.send_dom = send_dom
        return self

    def set_use_dom(self, use_dom):
        # type: (Self, bool) -> Self
        self.use_dom = use_dom
        return self

    def set_enable_patterns(self, enable_patterns):
        # type: (Self, bool) -> Self
        self.enable_patterns = enable_patterns
        return self

    def set_stitch_overlap(self, stitch_overlap):
        # type: (Self, int) -> Self
        self.stitch_overlap = stitch_overlap
        return self

    def set_api_key(self, api_key):
        # type: (Self, Text) -> Self
        self.api_key = api_key
        return self

    def set_server_url(self, server_url):
        # type: (Self, Text) -> Self
        self.server_url = server_url
        return self

    def set_default_match_settings(self, default_match_settings):
        # type: (Self, ImageMatchSettings) -> Self
        self.default_match_settings = default_match_settings
        return self

    @property
    def accessibility_validation(self):
        # type: (Self) -> Optional[AccessibilitySettings]
        return self.default_match_settings.accessibility_settings

    @accessibility_validation.setter
    def accessibility_validation(self, accessibility_settings):
        # type: (Self, Optional[AccessibilitySettings]) -> None
        if accessibility_settings is None:
            self.self.default_match_settings.accessibility_settings = None
            return
        argument_guard.is_a(accessibility_settings, AccessibilitySettings)
        self.default_match_settings.accessibility_settings = accessibility_settings

    def set_accessibility_validation(self, accessibility_settings):
        # type: (Self, Optional[AccessibilitySettings]) -> Self
        self.accessibility_validation = accessibility_settings
        return self

    @match_timeout.validator
    def _validate1(self, attribute, value):
        if value is not None and 0 < value < MINIMUM_MATCH_TIMEOUT_MS:
            raise ValueError(
                "Match timeout must be at least {} ms.".format(MINIMUM_MATCH_TIMEOUT_MS)
            )

    @viewport_size.validator
    def _validate2(self, attribute, value):
        if value is None:
            return None
        if isinstance(value, RectangleSize) or (
            isinstance(value, dict)
            and "width" in value.keys()
            and "height" in value.keys()
        ):
            return None

        raise ValueError("Wrong viewport type settled")

    @property
    def is_send_dom(self):
        # type: () -> bool
        return self.send_dom

    def clone(self):
        # type: () -> Self
        # TODO: Remove this huck when get rid of Python2
        # deepcopy on python 2 raise an exception so construct manually
        conf = copy(self)
        conf.batch = deepcopy(conf.batch)
        conf.viewport_size = copy(conf.viewport_size)
        conf.properties = deepcopy(conf.properties)
        conf.default_match_settings = deepcopy(conf.default_match_settings)
        return conf

    def add_property(self, name, value):
        # type: (Text, Text) -> Self
        """
        Associates a key/value pair with the test. This can be used later for filtering.
        :param name: (string) The property name.
        :param value: (string) The property value
        """
        self.properties.append({"name": name, "value": value})
        return self

    def clear_properties(self):
        # type: () -> Self
        """
        Clears the list of custom properties.
        """
        del self.properties[:]
        return self

    def set_proxy(self, proxy):
        # type: (Optional[ProxySettings | Text]) -> Self
        if isinstance(proxy, ProxySettings):
            self.proxy = proxy
        elif isinstance(proxy, six.string_types):
            self.proxy = ProxySettings(proxy)
        return self

    def set_wait_before_capture(self, milliseconds):
        # type: (int) -> Self
        self.wait_before_capture = milliseconds
        return self

    @deprecated.attribute("Configuration features are not supported")
    def set_features(self, *_):
        pass

    def set_user_test_id(self, user_test_id):
        # type: (Text) -> Self
        argument_guard.is_a(user_test_id, string_types)
        self.user_test_id = user_test_id
        return self
