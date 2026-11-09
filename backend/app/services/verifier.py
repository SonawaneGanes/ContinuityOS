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
