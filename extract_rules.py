from pypdf import PdfReader
import re

def extract_paragraphs(text, keywords):
    paragraphs = text.split('\n\n') # Assuming double newline separates paragraphs
    results = {}
    for keyword in keywords:
        results[keyword] = []
        for p in paragraphs:
            if keyword.lower() in p.lower():
                results[keyword].append(p.strip())
                if len(results[keyword]) >= 3: # Limit to 3 paragraphs per keyword
                    break
    return results

reader = PdfReader("BS EN ISO 14067 2018.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n\n" # Add double newline to preserve paragraph structure

keywords = ["allocation", "cut-off", "transport", "electricity", "biogenic"]
results = extract_paragraphs(text, keywords)

for k, v in results.items():
    print(f"=== {k.upper()} ===")
    for p in v:
        print(f"- {p[:300]}...") # Print first 300 chars
    print("\n")
