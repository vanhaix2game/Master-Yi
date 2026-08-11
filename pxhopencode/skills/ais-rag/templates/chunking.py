from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownTextSplitter, PythonCodeTextSplitter

def get_splitter(doc_type: str, chunk_size: int = 1000, overlap: int = 200):
    splitters = {
        "markdown": MarkdownTextSplitter(chunk_size, overlap),
        "code": PythonCodeTextSplitter(chunk_size, overlap),
        "text": RecursiveCharacterTextSplitter(
            chunk_size, overlap,
            separators=["\n\n", "\n", ".", "!", "?", " ", ""]
        ),
    }
    return splitters.get(doc_type, splitters["text"])

def chunk_document(text: str, doc_type: str = "text") -> list[dict]:
    splitter = get_splitter(doc_type)
    chunks = splitter.split_text(text)
    return [
        {"content": c, "index": i, "char_count": len(c)}
        for i, c in enumerate(chunks)
    ]
