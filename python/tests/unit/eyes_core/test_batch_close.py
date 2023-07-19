from mock import ANY, call, patch

from applitools.common import ProxySettings
from applitools.common.batch_close import BatchClose


def test_pass_multiple_batches_ids(monkeypatch):
    monkeypatch.setenv("APPLITOOLS_API_KEY", "abc")
    with patch(
        "applitools.common.command_executor.CommandExecutor._checked_command"
    ) as c:
        BatchClose().set_batch_ids("test batch-id", "test-batch-second").close()
        assert c.mock_calls == [
            call(
                ANY,
                "Core.closeBatch",
                {
                    "settings": [
                        {"batchId": "test batch-id", "apiKey": "abc"},
                        {"batchId": "test-batch-second", "apiKey": "abc"},
                    ]
                },
            )
        ]


def test_batch_close_uses_proxy(monkeypatch):
    monkeypatch.setenv("APPLITOOLS_API_KEY", "abc")
    with patch(
        "applitools.common.command_executor.CommandExecutor._checked_command"
    ) as c:
        BatchClose().set_batch_ids("test-id").set_proxy(
            ProxySettings("localhost", 80)
        ).close()
        assert c.mock_calls == [
            call(
                ANY,
                "Core.closeBatch",
                {
                    "settings": [
                        {
                            "apiKey": "abc",
                            "batchId": "test-id",
                            "proxy": {"url": "http://localhost:80"},
                        }
                    ]
                },
            )
        ]
