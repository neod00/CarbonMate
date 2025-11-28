from pypdf import PdfReader
import re

reader = PdfReader("BS EN ISO 14067 2018.pdf")
text = ""
page_map = {}

for i, page in enumerate(reader.pages):
    content = page.extract_text()
    page_map[i] = content
    text += f"--- PAGE {i} ---\n{content}\n"

# Try to find the start of 6.3 and end of 7 (or start of 8)
start_pattern = re.compile(r"6\.3\s+Life cycle inventory analysis")
end_pattern = re.compile(r"8\s+Critical review") # Assuming 8 follows 7

start_page = -1
end_page = -1

for i, content in page_map.items():
    if start_pattern.search(content) and start_page == -1:
        start_page = i
        print(f"Found 6.3 on page {i}")
    if end_pattern.search(content):
        end_page = i
        print(f"Found 8 on page {i}")

if start_page != -1:
    if end_page == -1: end_page = len(reader.pages)
    
    extracted_text = ""
    for i in range(start_page, end_page + 1):
        extracted_text += page_map[i]
    
    print("\n=== EXTRACTED TEXT (Clauses 6.3 - 7) ===\n")
    print(extracted_text[:5000]) # Print first 5000 chars
else:
    print("Could not find section 6.3")
