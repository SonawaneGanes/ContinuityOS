def attest_claim(
    raw_text: str,
    quote: str | None,
    start_char: int | None,
    end_char: int | None,
) -> bool:
    if quote is None or start_char is None or end_char is None:
        return False
    if start_char < 0 or end_char < start_char or end_char > len(raw_text):
        return False
    return raw_text[start_char:end_char] == quote


def locate_and_verify(raw_text: str, quote: str | None) -> tuple[int, int] | None:
    """Return the exact source span for a quote, or None when it does not match."""
    if not quote:
        return None

    start = raw_text.find(quote)
    if start == -1:
        return None

    end = start + len(quote)
    if raw_text[start:end] != quote:
        return None

    return start, end
