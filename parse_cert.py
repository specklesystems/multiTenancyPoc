from pathlib import Path
import json

cert = Path("./ca-cert").read_text()


cert_json = json.dumps({"cert": cert})

Path("./ca-cert.json").write_text(cert_json)
