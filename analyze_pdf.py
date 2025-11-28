from pypdf import PdfReader
import re

keywords = ["allocation", "cut-off", "exclusion", "formula", "calculation", "electricity", "transport"]
reader = PdfReader("BS EN ISO 14067 2018.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

print(f"Total characters: {len(text)}")

for keyword in keywords:
    print(f"--- Searching for: {keyword} ---")
    matches = re.finditer(f"([^.]*?{keyword}[^.]*\.)", text, re.IGNORECASE)
    count = 0
    for match in matches:
        print(match.group(1).strip())
        count += 1
        if count > 5: # Limit to 5 matches per keyword for brevity
            break
    print("\n")
