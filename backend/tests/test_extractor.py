from unittest.mock import Mock

import pytest

from app.services import extractor


def test_extract_claims_uses_gemini_openai_compatible_api(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setenv("LLM_MODEL", "gemini-test-model")

    client = Mock()
    client.chat.completions.create.return_value.choices = [
        Mock(
            message=Mock(
                content='[{"kind":"task","subject":"Login API","quote":"Login API is planned."}]'
            )
        )
    ]
    openai_client = Mock(return_value=client)
    monkeypatch.setattr(extractor, "OpenAI", openai_client)

    claims = extractor.extract_claims("Login API is planned.")

    openai_client.assert_called_once_with(
        api_key="test-gemini-key",
        base_url=extractor.GEMINI_OPENAI_BASE_URL,
    )
    client.chat.completions.create.assert_called_once()
    request = client.chat.completions.create.call_args.kwargs
    assert request["model"] == "gemini-test-model"
    assert request["messages"][1]["content"] == "Login API is planned."
    assert claims[0]["subject"] == "Login API"


def test_extract_claims_requires_gemini_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        extractor.extract_claims("Login API is planned.")
