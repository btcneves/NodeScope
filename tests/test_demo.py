from __future__ import annotations

import unittest
from pathlib import Path


class DemoAssetTests(unittest.TestCase):
    def test_demo_static_assets_exist_and_reference_api_features(self) -> None:
        html = Path("/home/btcneves/corecraft/api/static/demo.html").read_text(encoding="utf-8")
        css = Path("/home/btcneves/corecraft/api/static/demo.css").read_text(encoding="utf-8")
        js = Path("/home/btcneves/corecraft/api/static/demo.js").read_text(encoding="utf-8")

        self.assertIn("NodeScope Demo", html)
        self.assertIn("/static/demo.js", html)
        self.assertIn("/summary", js)
        self.assertIn("/events/recent", js)
        self.assertIn("/events/classifications", js)
        self.assertIn("/events/stream", js)
        self.assertIn("EventSource", js)
        self.assertIn("script_type_counts", js)
        self.assertIn("coinbase_input_present_count", js)
        self.assertIn("op_return_count", js)
        self.assertIn("event_type", js)
        self.assertIn("kind", js)
        self.assertIn("Tempo real", html)
        self.assertIn(".hero", css)
        self.assertIn(".stream-chip", css)


if __name__ == "__main__":
    unittest.main()
