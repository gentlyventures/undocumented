def generate_fcpxml_timeline(tracks: list) -> str:
    """Generates an XML package matching Final Cut Pro XML (FCPXML 1.10) for importing scenes into video editors."""
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<!DOCTYPE fcpxml>\n'
    xml += '<fcpxml version="1.10">\n'
    xml += '  <resources>\n'
    xml += '    <format id="r1" name="FFVideoFormat1080p24"/>\n'
    xml += '  </resources>\n'
    xml += '  <library>\n'
    xml += '    <event name="ScriptSync Screenplay Timeline">\n'
    # Mock XML elements matching video tracks
    for idx, track in enumerate(tracks):
        xml += f'      <asset-clip name="{track.get("name")}" offset="{idx*10}s" duration="{track.get("duration")}s"/>\n'
    xml += '    </event>\n'
    xml += '  </library>\n'
    xml += '</fcpxml>\n'
    return xml
