from app.services.verifier import locate_and_verify


TEXT = "Login API is in progress, owner Ravi Kumar."


def test_exact_quote_is_found():
    span = locate_and_verify(TEXT, "owner Ravi Kumar")
    assert span is not None
    start, end = span
    assert TEXT[start:end] == "owner Ravi Kumar"


def test_quote_not_in_text_is_rejected():
    assert locate_and_verify(TEXT, "owner Priya") is None


def test_changed_wording_is_rejected():
    assert locate_and_verify(TEXT, "owner Ravi K.") is None


def test_empty_quote_is_rejected():
    assert locate_and_verify(TEXT, "") is None
    assert locate_and_verify(TEXT, None) is None
