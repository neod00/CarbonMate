from pypdf import PdfReader

reader = PdfReader("BS EN ISO 14067 2018.pdf")

with open("pdf_content.txt", "w", encoding="utf-8") as f:
    # Dumping pages 10 to 45 (0-indexed: 9 to 44)
    for i in range(9, 45):
        try:
            page_content = reader.pages[i].extract_text()
            f.write(f"\n--- PAGE {i+1} ---\n{page_content}\n")
        except IndexError:
            break

print("Dump completed.")
