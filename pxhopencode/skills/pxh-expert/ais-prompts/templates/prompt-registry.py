from pydantic import BaseModel
from datetime import datetime
import hashlib

class PromptVersion(BaseModel):
    id: str
    name: str
    version: int
    system: str
    template: str
    model: str
    created_at: str

class PromptRegistry:
    def __init__(self):
        self._versions: dict[str, list[PromptVersion]] = {}

    def register(self, name: str, system: str, template: str, model: str = "gpt-4o"):
        versions = self._versions.get(name, [])
        v = len(versions) + 1
        pid = hashlib.md5(f"{name}:{v}".encode()).hexdigest()[:8]
        entry = PromptVersion(
            id=pid, name=name, version=v,
            system=system, template=template,
            model=model, created_at=datetime.utcnow().isoformat(),
        )
        versions.append(entry)
        self._versions[name] = versions
        return entry

    def get(self, name: str, version: int | None = None) -> PromptVersion | None:
        versions = self._versions.get(name, [])
        if not versions:
            return None
        if version is None:
            return versions[-1]  # latest
        return next((v for v in versions if v.version == version), None)

    def format(self, name: str, **kwargs) -> list[dict]:
        prompt = self.get(name)
        if not prompt:
            return []
        return [
            {"role": "system", "content": prompt.system},
            {"role": "user", "content": prompt.template.format(**kwargs)},
        ]
