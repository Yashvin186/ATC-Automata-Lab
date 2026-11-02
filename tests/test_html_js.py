"""Test suite verifying DOM integrity and JavaScript element bindings."""

import unittest
import os
import re


class TestDomIntegrity(unittest.TestCase):
    """Verify that templates/index.html contains every element ID required by static/app.js."""

    def test_all_app_js_element_ids_exist_in_index_html(self):
        js_path = os.path.join("static", "app.js")
        html_path = os.path.join("templates", "index.html")

        with open(js_path, "r", encoding="utf-8") as f:
            js_content = f.read()

        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()

        # Find all getElementById calls
        referenced_ids = set(re.findall(r'getElementById\(["\']([^"\']+)["\']\)', js_content))

        # Dynamic tape IDs like tape-cell-0 or trace-row-0 are created dynamically
        dynamic_prefixes = ("tape-cell-", "trace-row-")

        missing_ids = []
        for el_id in referenced_ids:
            if any(el_id.startswith(p) for p in dynamic_prefixes):
                continue
            id_attr1 = f'id="{el_id}"'
            id_attr2 = f"id='{el_id}'"
            if id_attr1 not in html_content and id_attr2 not in html_content:
                missing_ids.append(el_id)

        self.assertEqual(
            missing_ids,
            [],
            f"The following element IDs used in app.js are missing from index.html: {missing_ids}",
        )

    def test_local_cytoscape_vendored(self):
        """Ensure cytoscape.min.js is present locally for offline operation."""
        cytoscape_path = os.path.join("static", "cytoscape.min.js")
        self.assertTrue(os.path.exists(cytoscape_path), "static/cytoscape.min.js must exist")
        self.assertGreater(os.path.getsize(cytoscape_path), 100000, "cytoscape.min.js file size is unexpectedly small")


if __name__ == "__main__":
    unittest.main()

