from pathlib import Path
from zipfile import ZipFile
from docx import Document

root = Path(__file__).resolve().parent
source = root / "Desert_Voice_Revised_Project_Proposal_RLA.docx"
media_dir = root / "proposal-media"
media_dir.mkdir(exist_ok=True)

document = Document(source)
text = "\n".join(p.text for p in document.paragraphs if p.text.strip())
(root / "proposal-text.txt").write_text(text, encoding="utf-8")

with ZipFile(source) as archive:
    for name in archive.namelist():
        if name.startswith("word/media/") and not name.endswith("/"):
            target = media_dir / Path(name).name
            target.write_bytes(archive.read(name))

print(f"Extracted {len(list(media_dir.iterdir()))} media files")
print(f"Extracted {len(text)} characters of proposal text")
